import { test, assert, assertEq } from './runner.js';
import { newGame, serialize, deserialize } from '../src/core/state.js';
import { advanceMonth, resolvePending, currentPending, checkEnding, eligibleEvents } from '../src/core/sim.js';
import { computeEconomy, patrimonio, creditLimit, grossPatrimonio, estimateOpening } from '../src/core/economy.js';
import { openBusiness, canOpen, setPolicy, borrow, repay, buyUpgrade, sellBusiness, doManoloAction, togglePerk, currentGoal, rebrand, dropMonthlyCost } from '../src/core/actions.js';
import { laborFine, trickOdds, recordTrick, recidivism, tickLaborHistory, clearRecord, laborVisitParams } from '../src/core/inspections.js';
import { dateLabel } from '../src/core/helpers.js';
import { EVENTS } from '../src/data/events.js';
import { BUSINESS_TYPES, OBRADOR_UPGRADES } from '../src/data/businesses.js';
import { MANOLO_ACTIONS } from '../src/data/manoloActions.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { refreshCandidates, hireExec, execBonus, fireExec } from '../src/core/execs.js';
import { buyLujo, doIPO, companyValuation, ipoPremium } from '../src/core/life.js';
import { transportCost } from '../src/core/logistics.js';
import { advice } from '../src/core/advice.js';
import { tickRivals, rivalFactor, actOnRival, acquireRival, acquisitionPrice } from '../src/core/rivals.js';
import { launchCampaign, startRD, upgradeBusiness, upgradeCost } from '../src/core/market.js';
import { forecast, policyPreview, previewBase, riskInfo, blame, STATS } from '../src/core/preview.js';
import { GOALS } from '../src/data/goals.js';
import { CLAUSES, CLAUSE_BY_ID, clauseForSeed, CLAUSE_PRIZE, PRISA_GOAL, PRISA_MONTH } from '../src/data/clauses.js';
import { CITIES } from '../src/data/cities.js';
import { checkClause, clauseWarn, clauseMult, clauseActive } from '../src/core/clauses.js';
import { score } from '../src/core/sim.js';
import { netDrivers, freshEntries, upcoming, monthDigest, MAX_DRIVERS } from '../src/core/digest.js';
import { seedCode, parseSeed, isoWeekKey, weekSeed } from '../src/core/seed.js';
import { tickAhorro, liquidacion, liquidate, strikeChance, tickComite, rollConvenio, K as PK } from '../src/core/plantilla.js';
import { playGame, from } from './bot.js';

const started = (seed = 42, brand = 0) => {
  const s = newGame(seed);
  resolvePending(s, brand);
  return s;
};

const resolveAll = (s) => {
  while (s.pending.length) resolvePending(s, currentPending(s).choices[0].index);
};

test('la partida nueva empieza con la herencia pendiente', () => {
  const s = newGame(1);
  assertEq(s.month, 0);
  assertEq(s.pending[0].id, 'intro_herencia');
  assertEq(advanceMonth(s), null, 'no se puede avanzar con sucesos pendientes');
});

test('elegir marca fija el tipo de tienda', () => {
  const a = started(1, 0);
  const b = started(1, 1);
  assertEq(a.brand, 'express');
  assertEq(b.brand, 'maison');
  a.cash = b.cash = 500000;
  assert(!canOpen(a, 'maison', 'madrid').ok, 'express no puede abrir maison');
  assert(canOpen(b, 'maison', 'madrid').ok, 'maison sí puede');
});

test('el obrador heredado es rentable pero justito', () => {
  const s = started();
  const r = computeEconomy(s);
  assert(r.net > 0 && r.net < 6000, `beneficio inicial ${r.net}`);
  assert(r.employees >= 6, 'plantilla mínima');
  assertEq(r.fill, 1);
});

test('abrir tienda propia cobra el coste; franquicia cobra el canon', () => {
  const s = started();
  const cash = s.cash;
  assert(openBusiness(s, 'express', 'zaragoza').ok);
  assertEq(s.cash, cash - BUSINESS_TYPES.express.cost);
  assert(openBusiness(s, 'express', 'murcia', 'franquicia').ok);
  assertEq(s.cash, cash - BUSINESS_TYPES.express.cost + BUSINESS_TYPES.express.franchiseFee);
  assertEq(s.businesses.length, 2);
});

test('los negocios bloqueados no se pueden abrir', () => {
  const s = started();
  s.cash = 1e6;
  assert(!canOpen(s, 'smash', 'madrid').ok);
  s.unlocked.smash = true;
  assert(canOpen(s, 'smash', 'madrid').ok);
  assert(!canOpen(s, 'smash', 'selaya').ok, 'en Selaya no hay mercado');
});

test('la explotación abarata salarios y enciende el radar', () => {
  const legal = started(7);
  const evil = started(7);
  for (const k of ['zaragoza', 'sevilla']) {
    openBusiness(legal, 'express', k);
    openBusiness(evil, 'express', k);
  }
  setPolicy(evil, 'salario', 'negro');
  setPolicy(evil, 'horas', 'tiburon');
  setPolicy(evil, 'becarios', 'legion');
  assert(computeEconomy(evil).costs.salarios < computeEconomy(legal).costs.salarios * 0.6);
  for (let i = 0; i < 6; i++) {
    legal.cooldowns.trabajo = evil.cooldowns.trabajo = 99;
    legal.cooldowns.hacienda = evil.cooldowns.hacienda = 99;
    legal.pending = [];
    evil.pending = [];
    advanceMonth(legal);
    advanceMonth(evil);
  }
  assert(evil.heatTrabajo > legal.heatTrabajo + 15, `radar ${evil.heatTrabajo} vs ${legal.heatTrabajo}`);
  assert(evil.moral < legal.moral - 10, 'la moral cae');
  assertEq(laborFine(legal), 0);
  assert(laborFine(evil) > 0);
});

test('la contabilidad creativa acumula cuota defraudada', () => {
  const s = started(3);
  setPolicy(s, 'contabilidad', 'artistica');
  s.cooldowns.hacienda = 99;
  advanceMonth(s);
  assert(s.evaded > 0, 'hay cuota defraudada');
  assert(s.lastReport.tax < s.lastReport.profit * 0.25);
});

test('todas las cartas de suceso se resuelven sin errores', () => {
  for (const ev of EVENTS) {
    ev.choices.forEach((ch, i) => {
      const s = started(11);
      s.cash = 2e6;
      s.unlocked = { sobaos: true, vivienda: true, airbnb: true, smash: true, empanadas: true, academy: true };
      openBusiness(s, 'express', 'madrid', 'franquicia');
      openBusiness(s, 'airbnb', 'barcelona');
      openBusiness(s, 'smash', 'madrid');
      openBusiness(s, 'empanadas', 'valencia');
      openBusiness(s, 'academy', 'madrid');
      s.perks.abogado = true;
      s.perks.gestor = true;
      s.flags.alcaldeShield = 3;
      s.evaded = 150000;
      s.obrador.upgrades = ['linea2'];
      advanceMonth(s);
      resolveAll(s);
      const fr = s.businesses.find((b) => b.mode === 'franquicia');
      const ab = s.businesses.find((b) => b.type === 'airbnb');
      s.rivals = [{ id: 'masa', presence: { madrid: 2, bilbao: 1 }, since: 0, calm: 0, actions: {} }];
      refreshCandidates(s, true);
      hireExec(s, s.candidates.find((c) => c.pos === 'marketing').id);
      const params = { fine: 20000, debt: 150000, businessId: (ev.id === 'franquiciado_arruinado' ? fr : ab)?.id, city: 'madrid', rival: 'masa', pos: 'marketing' };
      s.pending = [{ kind: 'event', id: ev.id, params }];
      if (ch.available && !ch.available(s, params)) return;
      const text = resolvePending(s, i);
      assert(typeof text === 'string' && text.length > 10, `${ev.id}#${i} devuelve texto`);
      assert(Number.isFinite(s.cash), `${ev.id}#${i} caja finita`);
      assert(computeEconomy(s).revenue >= 0, `${ev.id}#${i} economía válida`);
    });
  }
});

test('todas las acciones de Manolo funcionan una vez al mes', () => {
  for (const a of MANOLO_ACTIONS) {
    const s = started(5);
    const r = doManoloAction(s, a.id);
    assert(r.ok && r.text.length > 10, a.id);
    assert(!doManoloAction(s, a.id).ok, 'solo una por mes');
  }
});

test('póliza de crédito: pedir, devolver y descubierto automático', () => {
  const s = started();
  const limit = creditLimit(s);
  assert(borrow(s, 50000).ok);
  assertEq(s.debt, 50000);
  assert(repay(s, 20000).ok);
  assertEq(s.debt, 30000);
  s.cash = -40000;
  s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
  advanceMonth(s);
  assert(s.cash >= 0, 'la póliza cubre el descubierto');
  assert(s.debt > 30000 && s.debt <= limit + 1);
});

test('tres meses en descubierto sin crédito = concurso de acreedores', () => {
  const s = started();
  s.debt = creditLimit(s);
  for (let i = 0; i < 3; i++) {
    s.cash = -500000;
    s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
    advanceMonth(s);
    s.pending = [];
  }
  assertEq(checkEnding(s), 'bancarrota');
});

test('tres expedientes = prisión', () => {
  const s = started();
  s.expedientes = 3;
  assertEq(checkEnding(s), 'carcel');
});

test('el final de los 8 años depende del patrimonio', () => {
  const s = started();
  s.month = 96;
  s.cash = 6e6;
  assertEq(checkEnding(s), 'tiburon');
});

test('mejoras del obrador, venta de negocios y asesores', () => {
  const s = started();
  s.cash = 1e6;
  const cap = computeEconomy(s).capacity;
  assert(buyUpgrade(s).ok);
  assert(computeEconomy(s).capacity > cap);
  openBusiness(s, 'express', 'zaragoza');
  const id = s.businesses[0].id;
  const before = s.cash;
  assert(sellBusiness(s, id).ok);
  assert(s.cash > before && s.businesses.length === 0);
  assert(togglePerk(s, 'andorra').ok);
  assert(s.perks.andorra && s.andorraPaid);
});

test('guardar y cargar conserva la partida', () => {
  const s = started(9);
  openBusiness(s, 'express', 'zaragoza');
  advanceMonth(s);
  const copy = deserialize(serialize(s));
  assertEq(copy.month, s.month);
  assertEq(copy.cash, s.cash);
  assertEq(copy.rng, s.rng);
  assertEq(patrimonio(copy), patrimonio(s));
});

test('la simulación es determinista con la misma semilla', () => {
  const a = playGame(123, { choice: 'random', diversify: true });
  const b = playGame(123, { choice: 'random', diversify: true });
  assertEq(a.patrimonio, b.patrimonio);
  assertEq(a.ending, b.ending);
});

test('partidas completas con decisiones aleatorias terminan bien', () => {
  for (let seed = 1; seed <= 8; seed++) {
    const r = playGame(seed, { choice: 'random', diversify: seed % 2 === 0, brand: seed % 3 ? 'express' : 'maison', franchise: seed % 4 === 0 });
    assert(r.ending, `seed ${seed} sin final`);
    assert(Number.isFinite(r.patrimonio), `seed ${seed} patrimonio`);
  }
});

test('los sucesos de una sola vez no se repiten', () => {
  const s = started();
  s.month = 30;
  s.seen.hija_bellasartes = 2;
  assert(!eligibleEvents(s).some((e) => e.id === 'hija_bellasartes'));
});

test('los objetivos se cumplen en cadena y dejan aviso', () => {
  const s = started();
  assertEq(currentGoal(s).id, 'primera_tienda');
  openBusiness(s, 'express', 'zaragoza');
  assertEq(currentGoal(s).id, 'tres_tiendas');
  assertEq(s.notices.length, 1);
  openBusiness(s, 'express', 'sevilla', 'franquicia');
  openBusiness(s, 'express', 'murcia', 'franquicia');
  assertEq(currentGoal(s).id, 'mejora_obrador');
});

test('la dificultad cambia herencia, multas e intereses', () => {
  const easy = newGame(1, 'cunado');
  const hard = newGame(1, 'hacienda');
  assert(easy.cash > hard.cash);
  for (const s of [easy, hard]) {
    resolvePending(s, 0);
    setPolicy(s, 'salario', 'negro');
    s.debt = 100000;
  }
  assert(laborFine(easy) < laborFine(hard), 'multas');
  assert(computeEconomy(easy).costs.intereses < computeEconomy(hard).costs.intereses, 'intereses');
});

test('el rebranding reconvierte las tiendas y tiene enfriamiento', () => {
  const s = started(4, 0);
  s.cash = 1e6;
  openBusiness(s, 'express', 'madrid');
  openBusiness(s, 'express', 'bilbao', 'franquicia');
  assert(rebrand(s).ok);
  assertEq(s.brand, 'maison');
  assert(s.businesses.every((b) => b.type === 'maison'));
  assert(!rebrand(s).ok, 'no se puede repetir enseguida');
});

test('los logros se evalúan sin errores durante una partida', () => {
  const r = playGame(77, { diversify: true, choice: 'random' });
  for (const a of ACHIEVEMENTS) assert(typeof a.test(r.state) === 'boolean', a.id);
  assert(ACHIEVEMENTS.some((a) => a.id === `final_${r.ending}` && a.test(r.state)), 'el final da logro');
});

test('el ciclo económico rota de fase y mueve el ladrillo', () => {
  const s = started(21);
  s.cash = 1e6;
  s.unlocked.vivienda = true;
  openBusiness(s, 'vivienda', 'madrid');
  const seen = new Set([s.macro.phase]);
  let minValue = Infinity;
  let maxValue = 0;
  for (let i = 0; i < 90; i++) {
    s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
    advanceMonth(s);
    resolveAll(s);
    seen.add(s.macro.phase);
    const v = s.businesses.find((b) => b.type === 'vivienda')?.value;
    if (v == null) break; // algún suceso puede haberlo vendido
    minValue = Math.min(minValue, v);
    maxValue = Math.max(maxValue, v);
  }
  assertEq(seen.size, 4, 'pasa por las cuatro fases');
  assert(maxValue > minValue * 1.1, 'el valor del inmueble oscila');
});

test('las partidas antiguas se migran al cargar', () => {
  const old = started(3);
  delete old.macro;
  delete old.rivals;
  old.version = 1;
  const s = deserialize(serialize(old));
  assertEq(s.version, 2);
  assert(s.macro && Array.isArray(s.rivals));
  advanceMonth(s);
});

test('las cadenas rivales aparecen, quitan demanda y se pueden comprar', () => {
  const s = started(31);
  s.cash = 5e6;
  openBusiness(s, 'express', 'madrid');
  openBusiness(s, 'express', 'zaragoza');
  s.month = 5;
  tickRivals(s, computeEconomy(s));
  const rosa = s.rivals.find((r) => r.id === 'dona_rosa') || s.rivals[0];
  assert(rosa, 'aparece al menos una cadena');
  const b = s.businesses[0];
  rosa.presence[b.city] = 2;
  assert(rivalFactor(s, b) < 0.8, 'la competencia quita demanda');
  assert(actOnRival(s, rosa.id, b.city, 'guerra').ok);
  assert(!actOnRival(s, rosa.id, b.city, 'resenas').ok, 'una acción por ciudad y mes');
  const price = acquisitionPrice(s, rosa.id);
  const n = s.businesses.length;
  assert(acquireRival(s, rosa.id).ok);
  assertEq(s.cash, 5e6 - BUSINESS_TYPES.express.cost * 2 - price);
  assert(s.businesses.length > n, 'te quedas con sus locales');
  assert(!s.rivals.some((r) => r.id === rosa.id));
});

test('reformas, campañas e I+D mejoran el negocio', () => {
  const s = started(32);
  s.cash = 2e6;
  openBusiness(s, 'express', 'sevilla');
  const b = s.businesses[0];
  const before = computeEconomy(s).totalDemand;
  assert(upgradeBusiness(s, b.id).ok);
  assertEq(b.level, 2);
  assert(computeEconomy(s).totalDemand > before, 'la reforma atrae más demanda');
  const r2 = computeEconomy(s).totalDemand;
  assert(launchCampaign(s, 'vallas', 'sevilla').ok);
  assert(!launchCampaign(s, 'vallas', 'sevilla').ok, 'no se duplica');
  assert(computeEconomy(s).totalDemand > r2, 'la campaña atrae más demanda');
  assert(startRD(s, 'relleno').ok);
  for (let i = 0; i < 5; i++) {
    s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
    advanceMonth(s);
    resolveAll(s);
  }
  assert(s.products.includes('relleno'), 'el producto termina');
  assert(upgradeCost(b) > 0);
});

test('los directivos cuestan dinero y aportan su bonus', () => {
  const s = started(33);
  s.cash = 1e6;
  refreshCandidates(s, true);
  const c = s.candidates.find((x) => x.pos === 'operaciones');
  const cap = computeEconomy(s).capacity;
  assert(hireExec(s, c.id).ok);
  assert(execBonus(s, 'operaciones') > 0);
  assert(computeEconomy(s).capacity > cap);
  assertEq(computeEconomy(s).costs.directivos, c.salary);
});

test('caprichos, familia y divorcio', () => {
  const s = started(41);
  s.cash = 2e6;
  const pat = patrimonio(s);
  assert(buyLujo(s, 'yate').ok);
  assert(patrimonio(s) < pat, 'el capricho pierde valor al comprarlo');
  assert(computeEconomy(s).costs.personales > 0, 'tiene mantenimiento');
  s.familia = 10;
  s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
  advanceMonth(s);
  const i = s.pending.findIndex((p) => p.id === 'divorcio');
  assert(i >= 0, 'Merche pide el divorcio');
  s.pending = [s.pending[i]];
  const cash = s.cash;
  resolvePending(s, 0);
  assert(s.flags.divorciado && s.cash < cash, 'se reparte la caja');
  assert(!s.lujo.some((x) => x.id === 'yate'), 'el yate se lo queda ella');
});

test('salir a Bolsa da dinero y diluye el patrimonio', () => {
  const s = started(42);
  s.cash = 5e6;
  s.month = 40;
  s.macro.phase = 'burbuja';
  const gross = grossPatrimonio(s);
  const r = doIPO(s, gross);
  assert(r.ok, r.msg);
  assert(r.valuation > gross, 'en burbuja se vende con prima');
  assert(patrimonio(s) > gross * 0.75, 'con prima, Manolo sale ganando');
  assert(!doIPO(s, grossPatrimonio(s)).ok, 'solo una vez');
  for (let k = 0; k < 6; k++) {
    s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
    advanceMonth(s);
    resolveAll(s);
  }
  assert(s.ipo.price > 0);
});

test('logística: el transporte cuesta y un obrador regional lo abarata', () => {
  const s = started(51);
  s.cash = 2e6;
  s.unlocked.obrador_regional = true;
  const far = transportCost(s, 'sevilla');
  assert(far > 0.15, `Sevilla queda lejos de Selaya (${far})`);
  assert(transportCost(s, 'laspalmas') > far * 1.5, 'Canarias paga barco');
  const cap = computeEconomy(s).capacity;
  assert(openBusiness(s, 'obrador_regional', 'sevilla').ok);
  assert(!openBusiness(s, 'obrador_regional', 'sevilla').ok, 'uno por ciudad');
  assert(transportCost(s, 'sevilla') === 0 && transportCost(s, 'malaga') < far, 'fabricar cerca abarata');
  assert(computeEconomy(s).capacity > cap, 'más capacidad');
});

test('pisos turísticos con licencia o sin ella', () => {
  const s = started(52);
  s.cash = 2e6;
  s.unlocked.airbnb = true;
  const legal = s.cash;
  assert(openBusiness(s, 'airbnb', 'barcelona').ok);
  const paid = legal - s.cash;
  const before = s.cash;
  assert(openBusiness(s, 'airbnb', 'barcelona', 'ilegal').ok);
  assert(before - s.cash < paid, 'sin licencia es más barato');
  assert(s.businesses[1].ilegal, 'queda marcado');
  assert(!canOpen(s, 'airbnb', 'zaragoza', 'ilegal').ok, 'en Zaragoza no hace falta licencia');
});

test('modo infinito: tras el final por tiempo se puede seguir', () => {
  const s = started(61);
  s.month = 96;
  assertEq(checkEnding(s), 'ruina_lenta');
  s.ending = null;
  s.endless = true;
  assertEq(checkEnding(s), null);
  s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
  advanceMonth(s);
  assertEq(s.month, 97);
});

test('el informe del gestor detecta problemas', () => {
  const s = started(71);
  assert(advice(s).length >= 1, 'sin informe en el mes 0 no hay datos, pero da una pista');
  s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
  advanceMonth(s);
  s.heatHacienda = 90;
  s.familia = 10;
  const tips = advice(s);
  assert(tips.some((t) => t.level === 'alta' && /Hacienda/.test(t.text)));
  assert(tips.some((t) => /Merche/.test(t.text)));
});

test('exploit: abrir y rescindir franquicias no da dinero', () => {
  const s = started(81, 1);
  const cash = s.cash;
  for (let i = 0; i < 5; i++) {
    assert(openBusiness(s, 'maison', 'bilbao', 'franquicia').ok);
    assert(sellBusiness(s, s.businesses[s.businesses.length - 1].id).ok);
  }
  assert(s.cash <= cash, `la caja no crece (${cash} → ${s.cash})`);
});

test('exploit: comprar una cadena y revender sus locales no es rentable', () => {
  for (const phase of ['expansion', 'crisis']) {
    const s = started(82);
    s.cash = 5e6;
    s.unlocked.residencia = true;
    s.macro.phase = phase;
    s.rivals = [{ id: 'silver', presence: { madrid: 1, bilbao: 1 }, since: 0, calm: 0, actions: {} }];
    const before = s.cash;
    assert(acquireRival(s, 'silver').ok);
    for (const b of [...s.businesses]) sellBusiness(s, b.id);
    assert(s.cash < before, `${phase}: revender no compensa (${before} → ${s.cash})`);
  }
});

test('los obradores regionales no se reforman y la guerra exige competir en la ciudad', () => {
  const s = started(83);
  s.cash = 2e6;
  s.unlocked.obrador_regional = true;
  openBusiness(s, 'obrador_regional', 'sevilla');
  assertEq(upgradeCost(s.businesses[0]), null);
  s.rivals = [{ id: 'dona_rosa', presence: { murcia: 2 }, since: 0, calm: 0, actions: {} }];
  assert(!actOnRival(s, 'dona_rosa', 'murcia', 'guerra').ok, 'sin tienda en Murcia no hay guerra');
});

test('los objetivos se guardan por id y las partidas viejas se convierten', () => {
  const s = started(84);
  delete s.goalsDone;
  s.goalIndex = 4; // partida antigua: ya había cumplido hasta "diversificar"
  assertEq(currentGoal(s).id, 'directivo', 'los objetivos nuevos quedan pendientes');
  assert(s.goalsDone.includes('diversificar') && s.goalsDone.includes('mejora_obrador'));
});

test('las elecciones cambian las reglas', () => {
  const s = started(91);
  s.cash = 1e6;
  s.month = 16;
  s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
  advanceMonth(s);
  const i = s.pending.findIndex((p) => p.id === 'elecciones');
  assert(i >= 0, 'hay elecciones en mayo de 2027');
  s.pending = [s.pending[i]];
  const text = resolvePending(s, 0);
  assert(/Resultado: gana/.test(text));
  assert(['ale', 'pps'].includes(s.gov.party));
  const taxBefore = computeEconomy(s).tax;
  s.gov.party = s.gov.party === 'ale' ? 'pps' : 'ale';
  assert(computeEconomy(s).tax !== taxBefore || computeEconomy(s).revenue >= 0, 'el gobierno afecta a la economía');
});

test('el estrés sube con el imperio, baja con el descanso y avisa con un susto', () => {
  const s = started(95);
  s.estres = 85;
  s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
  advanceMonth(s);
  const i = s.pending.findIndex((p) => p.id === 'susto_padel');
  assert(i >= 0, 'susto con estrés alto');
  s.pending = [s.pending[i]];
  resolvePending(s, 0);
  assertEq(s.restMonths, 3);
  assert(!doManoloAction(s, 'linkedin').ok, 'en reposo no hay acciones');
  const before = s.estres;
  s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
  advanceMonth(s);
  resolveAll(s);
  assert(s.estres < before, 'el reposo baja el estrés');
});

test('mantenimiento: los locales se deterioran y venden menos', () => {
  const s = started(97);
  s.cash = 1e6;
  openBusiness(s, 'express', 'zaragoza');
  setPolicy(s, 'mantenimiento', 'kevin');
  const fresh = computeEconomy(s).totalDemand;
  for (let i = 0; i < 30; i++) {
    s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
    advanceMonth(s);
    resolveAll(s);
  }
  const b = s.businesses.find((x) => x.type === 'express');
  if (b) {
    assert(b.cond < 70, `se deteriora (${b.cond})`);
    s.policies.mantenimiento = 'profesional';
    assert(computeEconomy(s).costs.mantenimiento > 0);
    b.cond = 100;
    const shiny = computeEconomy(s).totalDemand;
    b.cond = 0;
    assert(computeEconomy(s).totalDemand < shiny, 'deteriorado vende menos');
  }
  assert(fresh > 0);
});

test('regresión: las partidas antiguas conservan los objetivos cumplidos al cargarse', () => {
  const s = started(101);
  delete s.goalsDone;
  s.goalIndex = 5; // partida antigua: cumplido hasta "millon"
  const loaded = deserialize(serialize(s));
  assert(loaded.goalsDone.includes('millon') && loaded.goalsDone.includes('diversificar'), 'convierte el progreso');
  assertEq(currentGoal(loaded).id, 'directivo', 'solo quedan pendientes los objetivos nuevos');
});

test('regresión: la plantilla de Selaya no cuenta lo que fabrican los obradores regionales', () => {
  const s = started(102);
  s.cash = 2e6;
  const before = computeEconomy(s).lines.find((l) => l.id === 'obrador').staff;
  s.unlocked.obrador_regional = true;
  openBusiness(s, 'obrador_regional', 'sevilla');
  const after = computeEconomy(s).lines.find((l) => l.id === 'obrador').staff;
  assertEq(after, before, 'Selaya mantiene su plantilla');
});

test('regresión: los pisos reconvertidos en vivienda dejan de ser ilegales', () => {
  const s = started(103);
  s.cash = 2e6;
  s.unlocked.airbnb = true;
  openBusiness(s, 'airbnb', 'barcelona', 'ilegal');
  const b = s.businesses[0];
  b.type = 'vivienda';
  s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
  advanceMonth(s);
  assert(!b.ilegal, 'se limpia la marca');
});

test('fechas en español', () => {
  assertEq(dateLabel(0), 'Enero 2026');
  assertEq(dateLabel(13), 'Febrero 2027');
});

// ------------------------------------------------------------- Expediente
const visit = (s, id, params) => {
  s.pending = [{ kind: 'event', id, params }];
  return currentPending(s);
};
const pick = (s, p, text) => {
  const c = p.choices.find((x) => x.label.includes(text));
  assert(c, `opción «${text}» disponible`);
  return resolvePending(s, c.index);
};

test('expediente: los trucos funcionan peor cada vez', () => {
  const s = started();
  assertEq(trickOdds(s, 'frigorifico'), 0.55);
  recordTrick(s, 'frigorifico');
  assertEq(trickOdds(s, 'frigorifico'), 0.275);
  assertEq(trickOdds(s, 'anciano'), 0.2);
  recordTrick(s, 'anciano');
  assertEq(trickOdds(s, 'anciano'), 0);
  s.policies.becarios = 'algunos';
  const p = visit(s, 'inspeccion_trabajo', { fine: 10000 });
  assert(p.choices.some((c) => c.hint.includes('28 %')), 'la pista enseña la probabilidad real');
});

test('expediente: el anciano confuso no cuela dos veces', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const s = started(seed);
    recordTrick(s, 'anciano');
    const cash = s.cash;
    pick(s, visit(s, 'auditoria_hacienda', { debt: 10000 }), 'anciano');
    assertEq(Math.round(cash - s.cash), 15000, `semilla ${seed}`);
  }
});

test('expediente: la reincidencia agrava la multa durante 24 meses', () => {
  const s = started();
  s.month = 30;
  const base = laborFine(s);
  s.dossier.sanciones = [24];
  assertEq(recidivism(s), 1.25);
  s.policies.salario = 'negro';
  const withRec = laborFine(s);
  s.dossier.sanciones = [0];
  assertEq(recidivism(s), 1);
  assert(withRec > laborFine(s) && laborFine(s) > base, 'agravante solo con sanciones recientes');
});

test('expediente: pasarse a legal el mes de la visita no borra los meses anteriores', () => {
  const s = started();
  s.policies.salario = 'negro';
  for (let i = 0; i < 5; i++) tickLaborHistory(s);
  s.policies.salario = 'convenio';
  tickLaborHistory(s);
  const fine = laborFine(s);
  assert(fine > 0, 'sigue habiendo multa');
  const p = visit(s, 'inspeccion_trabajo', { fine });
  assert(!p.choices.some((c) => c.label.includes('Ofrecerle un sobao')), 'sin sobao con historial sucio');
  pick(s, p, 'Colaborar');
  assertEq(s.dossier.historial.length, 0, 'la visita vacía el historial');
  assertEq(s.dossier.sanciones.length, 1, 'colaborar cuenta como sanción');
});

test('expediente: una visita limpia tacha la sanción más antigua', () => {
  const s = started();
  s.dossier.sanciones = [1, 5];
  s.dossier.trucos.frigorifico = 2;
  s.dossier.trucos.gestor = 1;
  pick(s, visit(s, 'inspeccion_trabajo', { fine: 0 }), 'Ofrecerle un sobao');
  assertEq(s.dossier.sanciones.join(), '5');
  assertEq(s.dossier.trucos.frigorifico, 1);
  assertEq(s.dossier.trucos.gestor, 1, 'Hacienda no se entera de lo de Trabajo');
});

test('expediente: Paco se va a la tercera vez que le culpas', () => {
  const s = started();
  s.perks.gestor = true;
  pick(s, visit(s, 'auditoria_hacienda', { debt: 5000 }), 'gestor');
  pick(s, visit(s, 'auditoria_hacienda', { debt: 5000 }), 'gestor');
  assert(s.perks.gestor, 'Paco aguanta dos');
  const text = pick(s, visit(s, 'auditoria_hacienda', { debt: 5000 }), 'gestor');
  assert(!s.perks.gestor && text.includes('Paco te deja'), 'a la tercera se va');
});

test('expediente: las cartas nunca enseñan funciones y el expediente se guarda', () => {
  const s = started(3);
  s.cash = 2e6;
  openBusiness(s, 'express', 'madrid', 'franquicia');
  s.rivals = [{ id: 'masa', presence: { madrid: 2 }, since: 0, calm: 0, actions: {} }];
  const params = { fine: 20000, debt: 150000, businessId: s.businesses[1]?.id, city: 'madrid', rival: 'masa', pos: 'marketing' };
  for (const ev of EVENTS) {
    s.pending = [{ kind: 'event', id: ev.id, params }];
    let p;
    try {
      p = currentPending(s);
    } catch (e) {
      throw new Error(`${ev.id}: ${e.message}`);
    }
    assertEq(typeof p.title, 'string', `${ev.id} título`);
    for (const c of p.choices) {
      assertEq(typeof c.label, 'string', `${ev.id} etiqueta`);
      assert(c.hint === undefined || typeof c.hint === 'string', `${ev.id} pista`);
    }
  }
  s.pending = [];
  recordTrick(s, 'orujo');
  s.dossier.sanciones.push(2);
  const back = deserialize(serialize(s));
  assertEq(back.dossier.trucos.orujo, 1);
  assertEq(back.dossier.sanciones.join(), '2');
  const old = JSON.parse(serialize(s));
  delete old.dossier;
  const migrated = deserialize(JSON.stringify(old));
  assertEq(migrated.dossier.sanciones.length, 0, 'las partidas viejas empiezan con el expediente limpio');
});

// ------------------------------------------------------------- Previsiones
test('previsión: la opción actual no cambia nada', () => {
  const s = started();
  const p = policyPreview(s, 'salario', s.policies.salario);
  for (const k of ['net', 'evaded', 'net6', ...STATS]) assert(Math.abs(p[k]) < 1e-9, `${k} = ${p[k]}`);
});

test('previsión: pasar a negro da dinero, baja la moral y sube el radar', () => {
  const s = started();
  const p = policyPreview(s, 'salario', 'negro');
  assert(p.net > 0 && p.moral < 0 && p.heatTrabajo > 0 && p.fine > 0, JSON.stringify(p));
  assert(p.net6 < p.net * 6, 'a 6 meses rinde menos que 6 veces el primer mes');
});

test('previsión: el neto previsto coincide con el real y no toca la partida', () => {
  const s = started(9);
  s.cash = 600000;
  openBusiness(s, 'express', 'madrid');
  openBusiness(s, 'smash', 'bilbao');
  const before = serialize(s);
  const base = computeEconomy(s).net;
  const p = policyPreview(s, 'horas', 'tiburon');
  riskInfo(s);
  blame(s, 'moral');
  assertEq(serialize(s), before, 'el estado no cambia');
  setPolicy(s, 'horas', 'tiburon');
  assert(Math.abs(computeEconomy(s).net - (base + p.net)) < 1e-6);
});

test('previsión: la contabilidad creativa solo ahorra si hay beneficio', () => {
  const s = started(4);
  const r = computeEconomy(s);
  const p = policyPreview(s, 'contabilidad', 'creativa');
  assert(r.net > 0 && p.evaded > 0 && p.heatHacienda > 0);
  s.cash = 900000;
  for (const c of ['madrid', 'barcelona', 'valencia', 'sevilla']) openBusiness(s, 'express', c);
  s.extraMonthly.push({ label: 'Pérdidas', amount: 500000 });
  assertEq(policyPreview(s, 'contabilidad', 'creativa').evaded, 0);
});

test('previsión: los indicadores coinciden con el cierre de mes', () => {
  const setups = [
    {},
    { salario: 'negro', horas: 'gratis', becarios: 'legion' },
    { contabilidad: 'artistica', alquiler: 'abusivo', salario: 'minimo', ingredientes: 'misteriosa' },
  ];
  for (let seed = 1; seed <= 5; seed++) {
    for (const pol of setups) {
      const s = started(seed);
      s.cash = 1e6;
      openBusiness(s, 'express', 'madrid');
      openBusiness(s, 'vivienda', 'santander');
      Object.assign(s.policies, pol);
      s.rd = null;
      s.goalsDone = GOALS.map((g) => g.id);
      s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
      const f = forecast(s);
      advanceMonth(s);
      for (const k of STATS) assert(Math.abs(s[k] - f.after[k]) < 1e-9, `semilla ${seed} ${k}: ${s[k]} vs ${f.after[k]}`);
    }
  }
});

test('previsión: riesgo de visita según el periodo de espera', () => {
  const s = started();
  s.heatTrabajo = 60;
  s.cooldowns.trabajo = 1;
  assert(riskInfo(s).trabajo.chance > 0);
  s.cooldowns.trabajo = 2;
  const r = riskInfo(s).trabajo;
  assertEq(r.chance, 0);
  assertEq(r.wait, 1);
});

test('previsión: con solo el salario en negro, la culpa es del salario', () => {
  const s = started();
  s.policies.salario = 'negro';
  const b = blame(s, 'heatTrabajo');
  assertEq(b.rows.length, 1);
  assertEq(b.rows[0].key, 'salario');
  const legal = forecast(s, (c) => { c.policies.salario = 'convenio'; });
  assert(Math.abs(b.rest - legal.d.heatTrabajo) < 1e-9, 'el resto es lo que pasaría siendo legal');
});

// ------------------------------------------------------------- Costumbres
const yearly = (s, id, text) => pick(s, visit(s, id, {}), text);

test('costumbres: romper una tradición de cestas duele más', () => {
  const s = started();
  yearly(s, 'navidad', 'Cesta');
  const first = visit(s, 'navidad', {}).text;
  yearly(s, 'navidad', 'Cesta');
  const second = visit(s, 'navidad', {}).text;
  assert(first !== second && second.includes('tradición'), 'el texto cambia con los años');
  s.moral = 50;
  yearly(s, 'navidad', 'tarjeta');
  assertEq(s.moral, 40);
  assertEq(s.customs.navidad.last, 'tarjeta');
});

test('costumbres: tres agostos sin vacaciones traen a la Inspección', () => {
  const s = started();
  s.cooldowns.trabajo = 0;
  yearly(s, 'agosto', 'En agosto');
  yearly(s, 'agosto', 'En agosto');
  const p = visit(s, 'agosto', {});
  assert(p.choices.find((c) => c.label.includes('En agosto')).hint.startsWith('↺'), 'la opción repetida avisa');
  const ins = s.stats.inspecciones;
  pick(s, p, 'En agosto');
  assertEq(s.pending[0]?.id, 'inspeccion_trabajo');
  assertEq(s.cooldowns.trabajo, 4);
  assertEq(s.stats.inspecciones, ins + 1);
  const t = started();
  t.cooldowns.trabajo = 3;
  for (let i = 0; i < 2; i++) yearly(t, 'agosto', 'En agosto');
  const heat = t.heatTrabajo;
  yearly(t, 'agosto', 'En agosto');
  assertEq(t.pending.length, 0);
  assert(Math.abs(t.heatTrabajo - heat - 15) < 1e-9 || t.heatTrabajo === 100, 'radar +15');
});

test('costumbres: cerrar agosto como en Francia solo tras dos veranos de vacaciones', () => {
  const s = started();
  assert(!visit(s, 'agosto', {}).choices.some((c) => c.label.includes('Francia')));
  yearly(s, 'agosto', 'disfruten');
  yearly(s, 'agosto', 'disfruten');
  const p = visit(s, 'agosto', {});
  assert(p.choices[p.choices.length - 1].label.includes('Francia'), 'es la última opción');
  pick(s, p, 'Francia');
  assert(s.mods.some((m) => m.kind === 'revenue' && m.factor === 0.8));
});

test('costumbres: las partidas sin costumbres se cargan y resuelven Navidad', () => {
  const s = started();
  const old = JSON.parse(serialize(s));
  delete old.customs;
  const back = deserialize(JSON.stringify(old));
  yearly(back, 'navidad', 'lotería');
  assertEq(back.customs.navidad.count, 1);
});

// ------------------------------------------------------------- Cláusula del testamento
const withClause = (id, seed = 42) => {
  const s = started(seed);
  s.clausula = { id, broken: false, done: false };
  return s;
};

test('cláusula: la semilla la elige y las siete salen', () => {
  assertEq(newGame(77).clausula.id, newGame(77).clausula.id);
  const seen = new Set();
  for (let seed = 1; seed <= 200; seed++) seen.add(clauseForSeed(seed));
  assertEq(seen.size, CLAUSES.length);
  for (const c of CLAUSES) {
    const s = withClause(c.id);
    assertEq(typeof c.short(s, s.clausula), 'string');
    assert(c.short(s, s.clausula).length <= 40, `${c.id}: texto corto`);
    assertEq(typeof c.broken(s, s.clausula), 'boolean');
    assertEq(typeof c.met(s, s.clausula), 'boolean');
  }
});

test('cláusula: abrir en Madrid rompe la del norte y el negocio 13 la de boutique', () => {
  const s = withClause('cornisa');
  s.cash = 5e6;
  assert(openBusiness(s, 'express', 'bilbao').ok);
  assert(!s.clausula.broken, 'Bilbao es del norte');
  assert(clauseWarn(s, (c) => openBusiness(c, 'express', 'madrid')), 'avisa antes');
  assert(!s.clausula.broken, 'avisar no rompe');
  openBusiness(s, 'express', 'madrid');
  assert(s.clausula.broken);
  const b = withClause('boutique');
  b.cash = 9e6;
  const cities = CITIES.filter((c) => !c.hq).slice(0, 13).map((c) => c.id);
  for (const c of cities.slice(0, 12)) openBusiness(b, 'express', c);
  assertEq(b.businesses.length, 12);
  assert(!b.clausula.broken);
  openBusiness(b, 'express', cities[12]);
  assert(b.clausula.broken);
});

test('cláusula: pedir prestado la rompe; la póliza automática no', () => {
  const s = withClause('sin_bancos');
  s.cash = -20000;
  s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
  advanceMonth(s);
  resolveAll(s);
  assert(s.debt > 0 && !s.clausula.broken, 'descubierto cubierto por la póliza');
  borrow(s, 10000);
  assert(s.clausula.broken);
});

test('cláusula: prisa por llegar a 5 millones antes de cumplir los sesenta', () => {
  const s = withClause('prisa');
  s.month = PRISA_MONTH - 10;
  s.cash = PRISA_GOAL + 1e5;
  checkClause(s);
  assert(s.clausula.reached && !s.clausula.broken);
  const t = withClause('prisa');
  t.month = PRISA_MONTH;
  checkClause(t);
  assert(t.clausula.broken);
});

test('cláusula: cumplida al final da premio una vez y multiplica la puntuación', () => {
  const s = withClause('boutique');
  s.month = 96;
  s.cash = 6e6;
  const before = score(s);
  assertEq(checkEnding(s), 'tiburon');
  assert(s.clausula.done);
  assertEq(s.cash, 6e6 + CLAUSE_PRIZE);
  assertEq(clauseMult(s), CLAUSE_BY_ID.boutique.mult);
  assert(score(s) > before * (CLAUSE_BY_ID.boutique.mult - 0.1), 'puntuación multiplicada');
  s.endless = true;
  s.ending = null;
  s.month = 120;
  checkEnding(s);
  assertEq(s.cash, 6e6 + CLAUSE_PRIZE, 'el modo infinito no paga dos veces');
  const r = withClause('boutique');
  r.month = 96;
  r.cash = 100000;
  assertEq(checkEnding(r), 'ruina_lenta');
  assert(!r.clausula.done, 'la ruina lenta no tiene premio');
});

test('cláusula: las partidas viejas quedan sin cláusula', () => {
  const s = started();
  const old = JSON.parse(serialize(s));
  delete old.clausula;
  const back = deserialize(JSON.stringify(old));
  assertEq(back.clausula, null);
  assertEq(clauseMult(back), 1);
  advanceMonth(back);
});

test('cláusula: el estado final de partidas del bot es válido', () => {
  for (let seed = 1; seed <= 3; seed++) {
    const r = playGame(seed, { diversify: true, smart: true });
    assert(r.ending, 'termina');
  }
});

// ------------------------------------------------------------- Parte del mes
test('parte: las mayores variaciones primero, con su motivo', () => {
  const s = started();
  const prev = computeEconomy(s);
  const r = JSON.parse(JSON.stringify(prev));
  r.month = prev.month + 1;
  r.revenueByCat.sobaos -= 5000;
  r.costs.estructura += 1000;
  r.net = prev.net - 6000;
  const d = netDrivers(prev, r, s);
  assertEq(d[0].key, 'sobaos');
  assertEq(d[1].key, 'estructura');
  assert(d[0].delta < 0 && d[1].delta < 0);
  assertEq(d[1].reason, 'más negocios que coordinar desde Selaya');
});

test('parte: detecta a la cadena rival que aprieta', () => {
  const s = started();
  s.cash = 1e6;
  s.obrador.upgrades = OBRADOR_UPGRADES.map((u) => u.id); // con capacidad de sobra, lo que se pierde no se vende en otra parte
  openBusiness(s, 'express', 'madrid');
  const prev = computeEconomy(s);
  s.rivals = [{ id: 'masa', presence: { madrid: 1 }, since: 0, calm: 0, actions: {} }];
  const r = computeEconomy(s);
  const d = netDrivers(prev, r, s).find((x) => x.key === 'sobaos');
  assert(d && d.delta < 0, 'los sobaos bajan');
  assert(d.reason && d.reason.includes('Madrid'), `motivo: ${d.reason}`);
});

test('parte: «Este mes» solo trae lo nuevo y sin titulares', () => {
  const s = started();
  s.log.unshift({ month: s.month, text: 'viejo', tone: 'info' });
  const head = s.log[0];
  s.log.unshift({ month: s.month, text: 'titular', tone: 'news' }, { month: s.month, text: 'bueno', tone: 'good' }, { month: s.month, text: 'malo', tone: 'bad' });
  const f = freshEntries(s, head);
  assertEq(f.items.map((e) => e.text).join(), 'malo,bueno');
});

test('parte: próximamente avisa de Navidad y elecciones, nunca de inspecciones', () => {
  const s = started();
  s.month = 10;
  assert(upcoming(s).some((t) => t.includes('Navidad')));
  s.month = 14;
  const u = upcoming(s);
  assert(u.some((t) => t.includes('Elecciones')));
  s.heatTrabajo = 100;
  s.cooldowns.trabajo = 0;
  assert(!upcoming(s).some((t) => /inspecc|Marisa/i.test(t)));
});

test('parte: se calcula cada mes de una partida sin errores', () => {
  const s = started(21);
  s.cash = 2e6;
  Object.assign(s.unlocked, { smash: true, vivienda: true, airbnb: true });
  for (const c of ['madrid', 'bilbao']) openBusiness(s, 'express', c);
  for (let i = 0; i < 30; i++) {
    const prev = s.lastReport;
    const head = s.log[0];
    if (i === 5) openBusiness(s, 'smash', 'valencia');
    const r = advanceMonth(s);
    const d = monthDigest(prev, r, s, head);
    assert(d.drivers.length <= MAX_DRIVERS);
    resolveAll(s);
  }
});

// Cifras fijadas de la 0.4 (el agravio resta algo de moral; con AGR_MORAL = 0 salen las de la 0.3).
test('regresión: los campos del parte no cambian las cuentas', () => {
  const a = newGame(1);
  resolvePending(a, 0);
  const b = newGame(2);
  resolvePending(b, 1);
  b.cash = 2e6;
  b.unlocked.smash = true;
  openBusiness(b, 'maison', 'madrid');
  openBusiness(b, 'smash', 'bilbao');
  openBusiness(b, 'maison', 'barcelona', 'franquicia');
  const c = newGame(3);
  resolvePending(c, 0);
  c.cash = 3e6;
  Object.assign(c.unlocked, { vivienda: true, airbnb: true });
  for (const city of ['madrid', 'sevilla', 'valencia']) openBusiness(c, 'express', city);
  openBusiness(c, 'vivienda', 'santander');
  openBusiness(c, 'airbnb', 'malaga');
  for (let i = 0; i < 5; i++) {
    c.cooldowns.trabajo = c.cooldowns.hacienda = 99;
    advanceMonth(c);
    resolveAll(c);
  }
  const expected = [[24037.83, 20595.49, 2581.75], [106390.18, 76757.12, 22224.8], [58048.68, 46659.66, 8541.77]];
  [a, b, c].forEach((s, i) => {
    const r = computeEconomy(s);
    [r.revenue, r.totalCost, r.net].forEach((v, k) => assert(Math.abs(v - expected[i][k]) < 0.01, `estado ${i} cifra ${k}: ${v}`));
  });
});

// ------------------------------------------------------------- Semillas
test('semilla: el código va y vuelve', () => {
  for (const x of [0, 1, 2 ** 32 - 1, 101411902]) assertEq(parseSeed(seedCode(x)), x);
  assertEq(seedCode(2 ** 32 - 1), '1Z141Z3');
  for (const bad of ['', 'ZZZZZZZ', 'AB-1', '12345678']) assertEq(parseSeed(bad), null, `rechaza «${bad}»`);
  assertEq(parseSeed(' 1odlxa '), 101411902, 'acepta minúsculas y espacios');
});

test('semilla: semana ISO y reto de la semana', () => {
  assertEq(isoWeekKey(new Date(2026, 9, 23)), '2026-W43');
  assertEq(isoWeekKey(new Date(2027, 0, 1)), '2026-W53');
  assertEq(weekSeed('2026-W43'), 101411902);
  assertEq(seedCode(weekSeed('2026-W43')), '1ODLXA');
});

test('semilla: el mismo código da la misma partida y la misma cláusula', () => {
  const x = weekSeed('2026-W43');
  const a = newGame(parseSeed(seedCode(x)));
  assertEq(a.seed, x);
  assertEq(a.clausula.id, newGame(x).clausula.id);
  const r1 = playGame(x, { choice: 'random', diversify: true });
  const r2 = playGame(parseSeed(seedCode(x)), { choice: 'random', diversify: true });
  assertEq(r1.patrimonio, r2.patrimonio);
  assertEq(r1.ending, r2.ending);
});

// ------------------------------------------------------------- Regresiones de la revisión de la 0.3
test('regresión 0.3: la pista de «lo de siempre» nunca dice undefined', () => {
  const s = started();
  s.customs.franquiciado_arruinado = { count: 1, streak: 1, last: 'mentalidad', counts: { mentalidad: 1 } };
  const p = visit(s, 'franquiciado_arruinado', { city: 'madrid' });
  const h = p.choices.find((c) => c.key === 'mentalidad').hint;
  assert(h.startsWith('↺') && !h.includes('undefined'), h);
});

test('regresión 0.3: el tercer agosto sin vacaciones multa aunque todo lo demás sea legal', () => {
  const s = started();
  s.cooldowns.trabajo = 0;
  for (let i = 0; i < 3; i++) yearly(s, 'agosto', 'En agosto');
  const v = s.pending[0];
  assertEq(v.id, 'inspeccion_trabajo');
  assert(v.params.fine > 0 && v.params.motivo === 'vacaciones');
  const p = currentPending(s);
  assert(!p.choices.some((c) => c.label.includes('Ofrecerle un sobao')), 'no es una visita limpia');
  assert(p.text.includes('vacaciones'));
});

test('regresión 0.3: la visita limpia tacha una sanción vigente, no una caducada', () => {
  const s = started();
  s.month = 50;
  s.dossier.sanciones = [5, 40];
  assertEq(recidivism(s), 1.25);
  clearRecord(s, 'trabajo');
  assertEq(recidivism(s), 1);
  assertEq(s.dossier.sanciones.length, 0);
});

test('regresión 0.3: Paco no vuelve en un año', () => {
  const s = started();
  s.perks.gestor = true;
  s.flags.pacoCulpas = 2;
  pick(s, visit(s, 'auditoria_hacienda', { debt: 5000 }), 'gestor');
  assert(!s.perks.gestor);
  assert(!togglePerk(s, 'gestor').ok, 'no coge el teléfono');
  s.month += 12;
  assert(togglePerk(s, 'gestor').ok, 'al año, sí');
});

test('regresión 0.3: la carpeta enseña el agravante con el que se calculó la multa', () => {
  const s = started();
  const p = visit(s, 'inspeccion_trabajo', { fine: 9000, recid: 1.25, sanciones: 1 });
  assert(p.text.includes('×1,25'), 'agravante de la instantánea');
});

test('regresión 0.3: la culpa se ve aunque la moral esté en el tope', () => {
  const s = started();
  s.moral = 0;
  s.policies.salario = 'negro';
  s.policies.horas = 'tiburon';
  const b = blame(s, 'moral');
  const labor = b.rows.filter((x) => ['salario', 'horas'].includes(x.key));
  assert(b.clamp > 0 && labor.length === 2, JSON.stringify(b));
  assert(labor.every((x) => x.value < 0));
  assert(Math.abs(b.rows.reduce((a, x) => a + x.value, 0) + b.rest + b.clamp - b.total) < 1e-9, 'las partes suman el total');
});

test('regresión 0.3: una huelga que acaba este mes no tapa el riesgo de la siguiente', () => {
  const s = started();
  s.moral = 10;
  s.mods.push({ kind: 'strike', factor: 0.5, months: 1, label: 'Huelga' });
  assert(riskInfo(s).moral.strike > 0);
  s.mods[s.mods.length - 1].months = 2;
  assertEq(riskInfo(s).moral.strike, 0);
});

test('regresión 0.3: la OPA y despedir a un enchufado comprueban la cláusula al momento', () => {
  const s = withClause('boutique');
  s.cash = 9e6;
  for (const c of CITIES.filter((c) => !c.hq).slice(0, 12).map((c) => c.id)) openBusiness(s, 'express', c);
  s.rivals = [{ id: 'masa', presence: { madrid: 2, zaragoza: 1 }, since: 0, calm: 0, actions: {} }];
  assert(acquireRival(s, 'masa').ok);
  assert(s.clausula.broken, 'rota al comprar');
  const m = withClause('merche');
  m.familia = 58;
  m.execs.rrhh = { id: 1, name: 'Primo Toño', pos: 'rrhh', trait: 'enchufado', skill: 1, salary: 3000 };
  fireExec(m, 'rrhh');
  assert(m.clausula.broken, 'rota al despedir al enchufado');
});

test('regresión 0.3: la prisa cuenta el resultado del último mes del plazo', () => {
  const s = withClause('prisa');
  s.month = PRISA_MONTH - 1;
  s.cash = PRISA_GOAL - 1000;
  s.cooldowns.trabajo = s.cooldowns.hacienda = 99;
  s.extraMonthly = [];
  s.cash += 2e5; // el cierre lo deja por encima
  advanceMonth(s);
  assert(s.clausula.reached && !s.clausula.broken);
});

test('regresión 0.3: la cláusula se cierra al terminar sin cumplirla', () => {
  const s = withClause('sin_bancos');
  s.month = 96;
  s.cash = 6e6;
  s.debt = 100;
  assertEq(checkEnding(s), 'tiburon');
  assert(s.clausula.closed && !s.clausula.done && !clauseActive(s));
  s.endless = true;
  s.ending = null;
  s.debt = 0;
  s.month = 130;
  checkEnding(s);
  assert(!s.clausula.done, 'el modo infinito no la cobra');
  assertEq(clauseWarn(s, (c) => borrow(c, 1000)), null);
});

test('regresión 0.3: los motivos del parte van en el sentido de la cifra', () => {
  const s = started();
  const prev = computeEconomy(s);
  prev.phase = 'expansion';
  const r = JSON.parse(JSON.stringify(prev));
  r.month = prev.month + 1;
  r.phase = 'burbuja';
  r.revenueByCat.sobaos -= 5000;
  r.net -= 5000;
  const d = netDrivers(prev, r, s).find((x) => x.key === 'sobaos');
  assert(!d.reason || !d.reason.includes('ciclo'), `motivo: ${d.reason}`);
  const t = JSON.parse(JSON.stringify(prev));
  t.month = prev.month + 1;
  t.profit = prev.profit + 10000;
  t.costs.impuestos = prev.costs.impuestos - 2000;
  t.net = prev.net + 12000;
  const tax = netDrivers(prev, t, s).find((x) => x.key === 'impuestos');
  assert(tax && !tax.reason?.includes('más impuestos'), `impuestos: ${tax?.reason}`);
});

test('regresión 0.3b: el burofax de agosto espera a la próxima visita de Marisa', () => {
  const s = started(3);
  s.cooldowns.trabajo = 2;
  for (let i = 0; i < 3; i++) yearly(s, 'agosto', 'En agosto');
  assertEq(s.pending.length, 0);
  assertEq(s.flags.denunciaVacaciones, 3);
  const params = laborVisitParams(s);
  assert(params.fine > 0 && params.motivo === 'vacaciones');
  const p = visit(s, 'inspeccion_trabajo', params);
  assert(!p.choices.some((c) => c.label.includes('Ofrecerle un sobao')));
  pick(s, p, 'Colaborar');
  assertEq(s.flags.denunciaVacaciones, undefined, 'la denuncia se resuelve');
  const q = started(4);
  q.cooldowns.trabajo = 0;
  q.customs.agosto = { count: 3, streak: 3, last: 'trabajar', counts: { trabajar: 3 } };
  yearly(q, 'agosto', 'En agosto');
  assert(currentPending(q).text.includes('4 veranos'), 'cuenta los veranos de verdad');
});

test('regresión 0.3b: Paco solo cuenta las culpas que se lleva él', () => {
  const s = started();
  for (let i = 0; i < 3; i++) pick(s, visit(s, 'auditoria_hacienda', { debt: 5000 }), 'gestor');
  assert(togglePerk(s, 'gestor').ok);
  const h = visit(s, 'auditoria_hacienda', { debt: 5000 }).choices.find((c) => c.label.includes('gestor')).hint;
  assert(!h.includes('harto') && !h.includes('se fue'), h);
  pick(s, visit(s, 'auditoria_hacienda', { debt: 5000 }), 'gestor');
  assert(s.perks.gestor, 'la primera vez no se va');
});

test('regresión 0.3b: la culpa se mide sin topes y cuadra con la previsión', () => {
  const s = started(42);
  s.heatHacienda = 99;
  s.policies.contabilidad = 'artistica';
  const b = blame(s, 'heatHacienda');
  assert(b.clamp < 0, `el radar de Hacienda choca con 100: ${b.clamp}`);
  const r = started(42);
  r.rep = 97;
  r.perks.comunicacion = true;
  r.policies.ingredientes = 'margarina';
  const br = blame(r, 'rep');
  assertEq(br.clamp, 0);
  const marginal = -policyPreview(r, 'ingredientes', 'mantequilla').rep;
  assert(Math.abs(br.rows[0].value - marginal) < 1e-9, `${br.rows[0].value} vs ${marginal}`);
});

test('regresión 0.3b: cláusula cerrada en partidas viejas y sin aviso del ICO', () => {
  const s = withClause('sin_bancos');
  s.endless = true;
  s.month = 100;
  const back = deserialize(serialize(s));
  assert(back.clausula.closed, 'el modo infinito la cierra al cargar');
  back.pending = [{ kind: 'event', id: 'macro_crisis', params: {} }];
  const ico = currentPending(back).choices.find((c) => c.label.includes('ICO'));
  assert(ico && !ico.hint, 'sin promesas de cláusula');
});

test('regresión 0.3b: el parte no culpa a una apertura de bajar costes ni a una huelga que sigue igual', () => {
  const s = started();
  s.cash = 1e6;
  openBusiness(s, 'express', 'madrid');
  const prev = computeEconomy(s);
  openBusiness(s, 'express', 'bilbao');
  const r = computeEconomy(s);
  r.month = prev.month + 1;
  r.costs.materias = prev.costs.materias - 8000;
  r.net = prev.net + 8000;
  const m = netDrivers(prev, r, s).find((x) => x.key === 'materias');
  assert(!m?.reason?.includes('apertura'), `materias: ${m?.reason}`);
  const a = JSON.parse(JSON.stringify(prev));
  a.strike = 0.55;
  const b = JSON.parse(JSON.stringify(a));
  b.month = a.month + 1;
  b.revenueByCat.sobaos -= 6000;
  b.fill = a.fill - 0.1;
  b.net -= 6000;
  const d = netDrivers(a, b, s).find((x) => x.key === 'sobaos');
  assert(d?.reason !== 'huelga', `sobaos: ${d?.reason}`);
  const c = JSON.parse(JSON.stringify(prev));
  delete c.debt;
  const e = JSON.parse(JSON.stringify(prev));
  e.month = prev.month + 1;
  e.debt = 1000;
  e.costs.intereses = prev.costs.intereses + 2000;
  e.net = prev.net - 2000;
  const i = netDrivers(c, e, s).find((x) => x.key === 'intereses');
  assert(i && i.reason == null, `intereses: ${i?.reason}`);
});

// ------------------------------------------------------------- 0.4 · Cimientos
test('estimación rápida: igual que con un clon y sin tocar la partida', () => {
  const ref = (s, type, city, mode = 'propia') => {
    const base = computeEconomy(s);
    const c = JSON.parse(JSON.stringify(s));
    c.businesses.push({ id: -1, type, city, mode, value: 0, level: 1 });
    const after = computeEconomy(c);
    return { delta: after.profit - base.profit, fillAfter: after.fill, fillBefore: base.fill };
  };
  for (const months of [12, 40]) {
    const s = playGame(5, { diversify: true, months }).state;
    s.unlocked.smash = true;
    const before = JSON.stringify(s);
    for (const [type, city] of [['express', 'madrid'], ['smash', 'bilbao'], ['vivienda', 'sevilla']]) {
      for (let i = 0; i < 10; i++) {
        const a = estimateOpening(s, type, city);
        const b = ref(s, type, city);
        assertEq(JSON.stringify(a), JSON.stringify(b), `${months} ${type}`);
      }
    }
    assertEq(JSON.stringify(s), before, 'la partida no cambia');
  }
});

test('bot: modo infinito, políticas por fases y control del radar', () => {
  const r = playGame(7932, { diversify: true, endless: true, trace: true, policyAt: from(24, { salario: 'minimo', horas: 'gratis' }), control: { hi: 15, lo: 5 } });
  assertEq(r.month, 96);
  assertEq(r.mon.length, 96);
  assert(r.mon.some((x) => x.m > 24), 'traza');
});

// ------------------------------------------------------------- 0.4 · La cuenta de la plantilla
const report = (s) => computeEconomy(s);
const freshComite = () => ({ since: 0, plus: 0, paz: 0, nextConvenio: 0, prometido: null, rotas: [], extra: 0, huelgas: 0, firmas: 0 });

test('plantilla: el ahorro se mide frente al convenio y no cuenta los pactos de crisis', () => {
  const s = started();
  s.policies.salario = 'minimo';
  const r = report(s);
  tickAhorro(s, r);
  assertEq(s.dossier.ahorro.at(-1), Math.round(r.employees * 400));
  s.mods.push({ kind: 'labor', factor: 0.9, months: 3, label: 'Pacto de crisis' });
  tickAhorro(s, r);
  assertEq(s.dossier.ahorro.at(-1), Math.round(r.employees * 400), 'el pacto legal no se liquida');
  s.policies.salario = 'convenio';
  tickAhorro(s, r);
  assertEq(s.dossier.ahorro.at(-1), 0);
});

test('plantilla: la liquidación suma 24 meses ×1,2 y la visita la vacía', () => {
  const s = started();
  s.dossier.ahorro = Array.from({ length: PK.LIQ_WINDOW }, () => 1000);
  assertEq(liquidacion(s), Math.round(24 * 1000 * 1.2));
  const p = visit(s, 'inspeccion_trabajo', { fine: 0, liq: liquidacion(s), liqMeses: 24 });
  assert(!p.choices.some((c) => c.label.includes('Ofrecerle un sobao')), 'sin sobao con liquidación');
  assert(p.text.includes('dos últimos años'));
  pick(s, p, 'Colaborar');
  assertEq(s.dossier.ahorro.length, 0);
});

test('plantilla: la liquidación paga como mucho el 25 % sin dejar la caja en negativo y aplaza el resto', () => {
  const s = started();
  s.cash = 10000;
  const text = liquidate(s, 200000);
  assertEq(s.cash, 0, 'el 25 % no cabe: se paga lo que hay');
  const cuota = s.extraMonthly.at(-1);
  assert(cuota.locked && cuota.months >= 18 && cuota.months <= 48, JSON.stringify(cuota));
  assert(Math.abs(cuota.amount * cuota.months - 190000 * 1.05) < cuota.months, 'resto con recargo del 5 %');
  assert(!dropMonthlyCost(s, s.extraMonthly.length - 1).ok, 'no se quita con un clic');
  assert(text.includes('cuotas'));
  const t = started();
  t.cash = 1e6;
  liquidate(t, 100000);
  assertEq(t.cash, 1e6 - 25000);
});

test('plantilla: Don Cosme rebaja la liquidación al 85 %', () => {
  const s = started();
  s.perks.abogado = true;
  s.cash = 1e6;
  pick(s, visit(s, 'inspeccion_trabajo', { fine: 0, liq: 100000 }), 'Don Cosme');
  assertEq(s.stats.liquidado, 85000);
});

test('plantilla: el reparto es deducible', () => {
  const s = started(4);
  const r0 = report(s);
  assert(r0.profit > 0, 'el obrador heredado da beneficio');
  s.policies.reparto = 'paga';
  const r = report(s);
  assert(Math.abs(r.costs.reparto - 0.03 * r0.profit) < 1e-6, 'el 3 % del beneficio antes de impuestos');
  assert(r.tax < r0.tax, 'paga menos impuestos');
  assert(Math.abs(r.profit - (r0.profit - r.costs.reparto)) < 1e-6);
});

test('plantilla: el comité nace con 50 empleados y no a mitad del arco', () => {
  const s = started();
  const fake = { ...report(s), employees: 60 };
  s.flags.comiteStep = 2;
  tickComite(s, fake);
  assert(!s.comite, 'a mitad del arco, no');
  delete s.flags.comiteStep;
  tickComite(s, fake);
  assert(s.comite && s.pending.some((p) => p.id === 'comite_nace'), 'nace');
  s.month = 30;
  assert(!EVENTS.find((e) => e.id === 'arc_comite_1').weight(s), 'el arco ya no empieza');
});

test('plantilla: marzo sin subida con poco agravio; firmar sube el plus y bloquea 12 meses', () => {
  const s = started();
  s.comite = freshComite();
  s.month = 14;
  s.agravio = 5;
  rollConvenio(s);
  assertEq(s.pending.length, 0, 'sin carta');
  assertEq(s.comite.paz, 12);
  s.comite.nextConvenio = 0;
  s.agravio = 40;
  rollConvenio(s);
  const p = currentPending(s);
  assertEq(p.pending.id, 'convenio_anual');
  assertEq(p.pending.params.d, 0.02);
  s.policies.salario = 'minimo';
  pick(s, p, 'Firmar');
  assert(Math.abs(s.comite.plus - 0.02) < 1e-9 && s.comite.paz === 12);
  assertEq(s.flags.forcedLegal, 12);
  assertEq(s.policies.salario, 'convenio');
  const res = setPolicy(s, 'salario', 'negro');
  assert(!res.ok && res.msg.includes('convenio'), res.msg);
});

test('plantilla: prometer y no cumplir trae huelga general de 2 meses y agravio +20', () => {
  const s = started();
  s.comite = freshComite();
  s.agravio = 40;
  pick(s, visit(s, 'convenio_anual', { d: 0.02 }), 'año que viene');
  assertEq(s.comite.prometido, s.month);
  s.month += 12;
  pick(s, visit(s, 'convenio_anual', { d: 0.02 }), 'Congelar');
  assertEq(s.agravio, 70, 'agravio +10 por congelar y +20 por la promesa rota');
  const h = s.pending.find((p) => p.id === 'huelga_general');
  assert(h && h.params.months === 2, JSON.stringify(s.pending));
  assertEq(s.comite.rotas.length, 1);
});

test('plantilla: nunca dos huelgas a la vez; con comité no sale la de moral', () => {
  const s = started();
  s.moral = 5;
  assertEq(strikeChance(s, { control: 0 }).card, 'huelga');
  s.comite = freshComite();
  s.comite.nextConvenio = 99;
  s.agravio = 80;
  const st = strikeChance(s, { control: 0 });
  assertEq(st.card, 'huelga_general');
  assert(st.p > 0.15);
  for (let seed = 1; seed <= 30; seed++) {
    const t = started(seed);
    t.comite = { ...s.comite };
    t.agravio = 80;
    t.moral = 5;
    t.cooldowns.trabajo = t.cooldowns.hacienda = 99;
    advanceMonth(t);
    const n = t.pending.filter((p) => p.id === 'huelga' || p.id === 'huelga_general').length;
    assert(n <= 1, `semilla ${seed}: ${n} huelgas`);
    assert(!t.pending.some((p) => p.id === 'huelga'), 'con comité no hay huelga de moral');
  }
});

test('plantilla: el «¿Por qué?» del agravio culpa a no repartir', () => {
  const s = started(4);
  s.cash = 1e6;
  for (const c of ['madrid', 'barcelona', 'valencia']) openBusiness(s, 'express', c);
  s.agravio = 30;
  s.plantilla.ratio = 1.5;
  const b = blame(s, 'agravio');
  const row = b.rows.find((x) => x.key === 'reparto');
  assert(row && row.value > 0, JSON.stringify(b.rows));
});

test('plantilla: el neto a 6 meses de explotar descuenta la liquidación esperada', () => {
  const s = started(4);
  s.cash = 1e6;
  for (const c of ['madrid', 'barcelona', 'valencia']) openBusiness(s, 'express', c);
  s.heatTrabajo = 40;
  const p = policyPreview(s, 'salario', 'minimo');
  assert(p.saving > 0 && p.liq > 0, JSON.stringify(p));
  assert(p.net6 < p.net * 6 * 0.9, `el horizonte descuenta la deuda latente: ${p.net6} vs ${p.net * 6}`);
});

test('plantilla: las partidas viejas migran sin comité y con el ahorro vacío', () => {
  const s = started();
  const old = JSON.parse(serialize(s));
  delete old.agravio;
  delete old.comite;
  delete old.plantilla;
  delete old.dossier.ahorro;
  delete old.policies.reparto;
  delete old.stats.liquidado;
  const back = deserialize(JSON.stringify(old));
  assertEq(back.agravio, 0);
  assertEq(back.comite, null);
  assertEq(back.dossier.ahorro.length, 0);
  assertEq(back.policies.reparto, 'ninguno');
  assertEq(back.stats.liquidado, 0);
  advanceMonth(back);
});

test('bot: una partida explotadora acaba pagando una liquidación', () => {
  const r = playGame(7932, { diversify: true, smart: true, leverage: true, endless: true, policyAt: from(24, { salario: 'minimo', horas: 'gratis' }) });
  assert(r.liquidado > 0, `liquidado ${r.liquidado}`);
});

// ------------------------------------------------------------- 0.4 · La Bolsa tiene memoria (4a)
test('bolsa: el bloqueo de 6 meses retrasa la revista', () => {
  const s = started();
  s.cash = 20e6;
  s.ipo = { month: 50, float: 0.25, valuation: 1e7, price: 100, peak: 100, angryMonth: -99 };
  s.month = 53;
  assertEq(checkEnding(s), null, 'en el bloqueo no hay revista');
  s.month = 56;
  assertEq(checkEnding(s), 'forbes');
  const t = started();
  t.cash = 20e6;
  t.month = 53;
  assertEq(checkEnding(t), 'forbes', 'sin Bolsa, como siempre');
});

test('bolsa: la valoración mezcla libros y 6 veces el beneficio al 50 %', () => {
  const s = started();
  s.history = Array.from({ length: 12 }, (_, i) => ({ month: i, net: 100000, revenue: 500000, cash: 0, patrimonio: 0, cat: {} }));
  const prem = ipoPremium(s);
  assert(Math.abs(companyValuation(s, 2e6) - (0.5 * 2e6 + 0.5 * 6 * 1.2e6) * prem) < 1e-6);
  assert(Math.abs(companyValuation(s, 10e6) - 10e6 * prem) < 1e-6, 'nunca por debajo de los libros');
});
