// Regresiones de la revisión de la 0.19 (bot europeo, fuzzer y caza de trucos).
import { test, assert, assertEq } from './runner.js';
import { newGame, serialize, deserialize, migrate } from '../src/core/state.js';
import { resolvePending, currentPending } from '../src/core/sim.js';
import { computeEconomy, estimateOpening } from '../src/core/economy.js';
import { openBusiness, canOpen, FRANCHISES_PER_MONTH } from '../src/core/actions.js';
import { calculateOnline } from '../src/core/online.js';
import { europeProgress } from '../src/core/dynasty.js';
import { EVENT_BY_ID } from '../src/data/events.js';
import { RIVALS } from '../src/data/rivals.js';

const fresh = (seed = 7, campaign = 'europe') => {
  const s = newGame(seed, 'normal', campaign);
  resolvePending(s, 0);
  return s;
};

test('franquicias: como mucho tres firmadas al mes', () => {
  const s = fresh();
  s.cash = 1e6;
  const cities = ['madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao'];
  const signed = cities.map((c) => openBusiness(s, 'express', c, 'franquicia').ok);
  assertEq(signed.filter(Boolean).length, FRANCHISES_PER_MONTH);
  assert(/ya has colocado/.test(canOpen(s, 'express', 'zaragoza', 'franquicia').msg));
  s.month++;
  assert(openBusiness(s, 'express', 'zaragoza', 'franquicia').ok, 'al mes siguiente se puede volver a firmar');
});

test('estimación de apertura: incluye el mantenimiento del local', () => {
  const s = fresh(5);
  s.cash = 1e8; s.month = 24; s.unlocked.banca = true;
  const est = estimateOpening(s, 'banca', 'madrid').delta;
  const before = computeEconomy(s).profit;
  assert(openBusiness(s, 'banca', 'madrid').ok);
  const real = computeEconomy(s).profit - before;
  assert(Math.abs(est - real) < 1, `estimación ${est} frente a ${real}`);
});

test('plantilla: un local en obras cuenta para la vivienda que hará falta al entregarlo', () => {
  const s = fresh(7);
  s.cash = 1e8; s.month = 24; s.unlocked.banca = true; s.unlocked.telecom = true;
  const t = openBusiness(s, 'telecom', 'madrid');
  assert(t.ok && t.business.readyMonth > s.month, 'las telecomunicaciones tardan en entregarse');
  const bank = canOpen(s, 'banca', 'madrid');
  assert(!bank.ok && /plazas de vivienda/.test(bank.msg), bank.msg);
});

test('venta online: un centro logístico propio abarata la paquetería', () => {
  const s = fresh(3);
  s.online = { level: 1, active: true, shipping: 'incluido' };
  const without = calculateOnline(s, { availableUnits: 6000, staff: 5 }).parcelCost;
  s.businesses.push({ id: 999, type: 'logistica', city: 'madrid', mode: 'propia', level: 1, value: 0 });
  const withHub = calculateOnline(s, { availableUnits: 6000, staff: 5 }).parcelCost;
  assert(Math.abs(withHub - without * 0.85) < 1e-9, `${without} → ${withHub}`);
});

test('oferta de un rival: avisa si vender te quita un país de la meta europea', () => {
  const s = fresh(7);
  const rival = Object.keys(RIVALS).find((id) => RIVALS[id].targets.includes('express'));
  s.rivals = [{ id: rival, presence: { madrid: 1 } }];
  s.businesses.push({ id: 900, type: 'express', city: 'lisboa', mode: 'propia', level: 1, value: 1e6 });
  assertEq(europeProgress(s).countries, 2);
  s.pending.unshift({ kind: 'event', id: 'rival_oferta_compra' });
  const sell = currentPending(s).choices.find((c) => c.index === 0);
  assert(/Portugal/.test(sell.hint) && /de 2 a 1 países/.test(sell.hint), sell.hint);
});

test('ERTE: la opción honrada va primero', () => {
  assert(/fraude/.test(EVENT_BY_ID.erte.choices[0].label));
});

test('guardados de antes de la 0.6 sin campaña siguen siendo de la campaña clásica', () => {
  const s = fresh(9, 'classic');
  delete s.campaign;
  const loaded = deserialize(serialize(s));
  assertEq(loaded.campaign, 'classic');
  const e = migrate(JSON.parse(JSON.stringify(fresh(9, 'europe'))));
  assertEq(e.campaign, 'europe');
});

test('campaña clásica: la revista pide 20 M€ y el texto lo dice', async () => {
  const { checkEnding } = await import('../src/core/sim.js');
  const { CLASSIC_GOALS, ENDINGS } = await import('../src/data/endings.js');
  const { GOALS } = await import('../src/data/goals.js');
  const { patrimonio } = await import('../src/core/economy.js');
  assertEq(CLASSIC_GOALS.revista, 20e6);
  const rich = (extra) => { const s = fresh(4, 'classic'); s.month = 50; s.cash += CLASSIC_GOALS.revista - patrimonio(s) + extra; return s; };
  assertEq(checkEnding(rich(-1000)), null, 'por debajo, nada');
  assertEq(checkEnding(rich(1000)), 'forbes');
  assert(ENDINGS.forbes.text.includes('20 millones'));
  assert(GOALS.find((g) => g.id === 'forbes').text.includes('20 millones'));
});

test('marcas: el obrador heredado rinde igual y lo ampliado da la mitad de sobaos de autor', async () => {
  const { obradorCapacity } = await import('../src/core/economy.js');
  const { upgradeEffect } = await import('../src/core/market.js');
  const { EVENT_BY_ID: EV } = await import('../src/data/events.js');
  const make = (brand) => { const s = fresh(3, 'classic'); s.brand = brand; return s; };
  const e = make('express'), m = make('maison');
  assertEq(Math.round(obradorCapacity(m)), Math.round(obradorCapacity(e)), 'el obrador del abuelo da lo mismo');
  for (const s of [e, m]) { s.obrador.upgrades.push('linea2', 'robot', 'nave'); for (let i = 0; i < 10; i++) s.businesses.push({ id: 800 + i, type: 'vivienda', city: 'selaya', mode: 'propia', level: 1, value: 0 }); }
  const extraE = obradorCapacity(e) - 12000, extraM = obradorCapacity(m) - 12000;
  assert(extraE > 0 && Math.abs(extraM - extraE / 2) < 1, `${extraE} frente a ${extraM}`);
  assert(/\+2\.?625 /.test(upgradeEffect({ type: 'obrador_regional' }, m)));
  const r = make('maison'); r.cash = 1e6;
  assert(/\+7\.?500 /.test(EV.robot_aleman.choices[0].effect(r)), 'el robot promete lo que da');
});
