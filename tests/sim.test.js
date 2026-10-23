import { test, assert, assertEq } from './runner.js';
import { newGame, serialize, deserialize } from '../src/core/state.js';
import { advanceMonth, resolvePending, currentPending, checkEnding, eligibleEvents } from '../src/core/sim.js';
import { computeEconomy, patrimonio, creditLimit } from '../src/core/economy.js';
import { openBusiness, canOpen, setPolicy, borrow, repay, buyUpgrade, sellBusiness, doManoloAction, togglePerk, currentGoal, rebrand } from '../src/core/actions.js';
import { laborFine } from '../src/core/inspections.js';
import { dateLabel } from '../src/core/helpers.js';
import { EVENTS } from '../src/data/events.js';
import { BUSINESS_TYPES } from '../src/data/businesses.js';
import { MANOLO_ACTIONS } from '../src/data/manoloActions.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { playGame } from './bot.js';

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
      const params = { fine: 20000, debt: 150000, businessId: (ev.id === 'franquiciado_arruinado' ? fr : ab)?.id, city: 'madrid' };
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
    const v = s.businesses[0].value;
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

test('fechas en español', () => {
  assertEq(dateLabel(0), 'Enero 2026');
  assertEq(dateLabel(13), 'Febrero 2027');
});
