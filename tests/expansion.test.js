import { CITIES, CITY_BY_ID } from '../src/data/cities.js';
import { km, transportCost } from '../src/core/logistics.js';
import { test, assert, assertEq } from './runner.js';
import { newGame, serialize, deserialize, GAME_VERSION } from '../src/core/state.js';
import { resolvePending, advanceMonth, currentPending } from '../src/core/sim.js';
import { buyUpgrade } from '../src/core/actions.js';
import {openBusiness} from './fixtures.js';
import { computeEconomy } from '../src/core/economy.js';
import { signAgreement, endAgreement, tickInternational, resolveDispute, agreementTerms } from '../src/core/international.js';
import { FOREIGN_MARKETS } from '../src/data/international.js';

const started = () => { const s = newGame(42); resolvePending(s, 0); s.cash = 1e7; return s; };

test('exterior: marca blanca consume producción y la licencia fabrica fuera', () => {
  const white = started(), licence = started();
  const base = computeEconomy(white);
  assert(signAgreement(white, 'portugal', 'private_label', false).ok);
  assert(signAgreement(licence, 'portugal', 'licence', true).ok);
  const w = computeEconomy(white), l = computeEconomy(licence);
  assert(w.totalDemand > base.totalDemand);
  assertEq(l.totalDemand, base.totalDemand);
  assert(l.lines.find(x => x.foreign).revenue > 0);
  assert(l.lines.find(x => x.foreign).cost > 0, 'auditoría mensual');
  assert(!signAgreement(white, 'portugal', 'licence', false).ok, 'exclusividad territorial');
  assert(deserialize(serialize(white)).foreignDeals.length === 1);
  assert(!signAgreement(white, 'desconocido', 'private_label').ok);
  assert(!signAgreement(white, 'francia', 'fantasma').ok);
});

test('exterior: la licencia no pierde royalties por saturación del obrador', () => {
  const s = started(); signAgreement(s, 'francia', 'licence', true);
  const a = computeEconomy(s).lines.find(x => x.foreign);
  s.contracts.push({id:'pedido', label:'Pedido', units:1e8, price:2, months:12});
  const b = computeEconomy(s).lines.find(x => x.foreign);
  assertEq(a.revenue, b.revenue);
});

test('exterior: incidentes deterministas con respuesta, coste y consecuencias', () => {
  const s = started(); signAgreement(s, 'alemania', 'licence', false);
  const deal = s.foreignDeals[0];
  deal.dispute = 'calidad';
  s.pending.push({kind:'event', id:'socio_extranjero', params:{dealId:deal.id, reason:'calidad'}});
  const before = s.rep;
  assert(currentPending(s).choices.length >= 3);
  assert(resolvePending(s, 2));
  assert(s.rep < before);
  assert(!deal.dispute);
  assert(computeEconomy(s).lines.some(x => x.foreign));
});

test('exterior: un contrato vence, se puede cancelar y la auditoría reduce el riesgo', () => {
  const s = started(); signAgreement(s, 'mexico', 'private_label', true);
  assert(agreementTerms('mexico', 'private_label', true).risk < agreementTerms('mexico', 'private_label', false).risk);
  s.foreignDeals[0].months = 1;
  tickInternational(s, computeEconomy(s));
  assertEq(s.foreignDeals.length, 0);
  assert(signAgreement(s, 'mexico', 'licence', false).ok);
  assert(endAgreement(s, s.foreignDeals[0].id).ok);
  assertEq(s.foreignDeals.length, 0);
});

test('exterior: dos meses de suministro insuficiente abren un conflicto real', () => {
  const s = started(); signAgreement(s, 'japon', 'private_label', true);
  s.foreignDeals[0].shortMonths = 1;
  tickInternational(s, {fill:0});
  assert(s.pending.some(p => p.id === 'socio_extranjero' && p.params.reason === 'suministro'));
});

test('exterior: guardados antiguos migran sin acuerdos; referencias inválidas se rechazan', () => {
  const s = started(); delete s.foreignDeals;
  assertEq(deserialize(serialize(s)).foreignDeals.length, 0);
  const bad = started(); signAgreement(bad, 'portugal', 'licence', true);
  bad.foreignDeals[0].market = 'Atlantida';
  let rejected = false; try { deserialize(serialize(bad)); } catch { rejected = true; }
  assert(rejected);
});


test('mapa: están las 50 capitales provinciales y las dos ciudades autónomas', () => {
  const capitals = ['coruna','albacete','alicante','almeria','oviedo','avila','badajoz','barcelona','burgos','caceres','cadiz','santander','castellon','ciudadreal','cordoba','cuenca','girona','granada','guadalajara','huelva','huesca','jaen','leon','lleida','lugo','madrid','malaga','murcia','pamplona','ourense','palencia','palma','laspalmas','pontevedra','salamanca','santacruz','segovia','sevilla','soria','tarragona','teruel','toledo','valencia','valladolid','vitoria','bilbao','zamora','zaragoza','donostia','logrono'];
  assertEq(capitals.length, 50);
  for (const id of [...capitals,'ceuta','melilla']) assert(CITY_BY_ID[id], `falta ${id}`);
  assertEq(new Set(CITIES.map(c => c.id)).size, CITIES.length);
  for (const c of CITIES) {
    assert(c.pop > 0 && c.wealth > 0 && c.rent > 0);
    assert(Number.isFinite(km('selaya',c.id)));
  }
});

test('mapa: Tenerife usa coordenadas reales para transportar, no las del inserto', () => {
  assert(CITY_BY_ID.santacruz);
  assert(km('santacruz','laspalmas') > 80 && km('santacruz','laspalmas') < 200);
  assert(transportCost(started(),'santacruz') > 0.5);
});


test('franquicias: cuatro meses rentables para el dueño nunca generan quiebra', () => {
  const s = started(); s.clausula = null;
  for (let i=0;i<3;i++) buyUpgrade(s);
  openBusiness(s,'express','madrid','franquicia');
  const b = s.businesses[0]; b.lossMonths=3;
  for (let i=0;i<4;i++) {
    s.pending=[]; s.rep=100;
    const report=advanceMonth(s);
    assert(report.lines.find(l => l.id === b.id).franchiseeProfit > 0);
    assertEq(b.lossMonths,0);
    assert(!s.pending.some(p => p.id === 'franquiciado_arruinado'));
  }
});

test('franquicias: una central rentable puede tener un franquiciado que pierde cuatro meses', () => {
  const s = started(); s.clausula = null;
  openBusiness(s,'express','selaya','franquicia');
  for (let i=0;i<4;i++) {
    s.pending=[];s.rep=55;
    const r=advanceMonth(s), l=r.lines.find(l=>l.franchise);
    assert(l.revenue-l.cost > 0);
    assert(l.franchiseeProfit < 0);
    assertEq(s.pending.some(p=>p.id==='franquiciado_arruinado'),i===3);
  }
});


test('migración 0.5: conserva caja, RNG y versión de origen de la partida antigua', () => {
  const old = started(); old.gameVersion='0.4.0'; delete old.foreignDeals; delete old.obrador.expansions;
  const loaded = deserialize(serialize(old));
  assertEq(loaded.gameVersion, GAME_VERSION);
  assertEq(loaded.originalGameVersion, '0.4.0');
  assertEq(loaded.cash, old.cash); assertEq(loaded.rng, old.rng);
  assertEq(loaded.obrador.expansions,0); assertEq(loaded.foreignDeals.length,0);
});

test('exterior: las cuentas suman una sola vez producción, envíos y royalties', () => {
  const s = started(); signAgreement(s,'portugal','private_label',true); signAgreement(s,'alemania','licence',true);
  const r=computeEconomy(s), foreign=r.lines.filter(l=>l.foreign);
  assert(Math.abs(r.lines.reduce((sum,l)=>sum+l.revenue,0)-r.revenue)<0.01);
  assert(Math.abs(r.costs.materias-r.produced*1.05)<0.01, 'cada sobao se fabrica una sola vez');
  assertEq(r.costs.transporte, foreign.reduce((sum,l)=>sum+l.shipping,0));
  assert(Math.abs(r.totalCost-Object.entries(r.costs).filter(([k])=>k!=='impuestos').reduce((sum,[,v])=>sum+v,0))<0.01);
});
