// Regresiones de la auditoría de la primera hora (agentes jugando la interfaz real como jugadores nuevos).
import { test, assert, assertEq } from './runner.js';
import { newGame } from '../src/core/state.js';
import { advanceMonth, resolvePending, currentPending } from '../src/core/sim.js';
import { computeEconomy } from '../src/core/economy.js';
import { openBusiness, checkUnlocks } from '../src/core/actions.js';
import { resultSnapshot, isMinorResult } from '../src/core/results.js';
import { upcoming } from '../src/core/digest.js';
import { fillPct, plural } from '../src/core/helpers.js';
import { GOALS } from '../src/data/goals.js';
import { EVENT_BY_ID } from '../src/data/events.js';

const fresh = (seed = 7, campaign = 'classic') => { const s = newGame(seed, 'normal', campaign); resolvePending(s, 0); s.notices = []; return s; };

test('primera hora: un modificador o un contrato nuevo no es un resultado menor', () => {
  const s = fresh();
  s.pending.unshift({ kind: 'event', id: 'x' });
  const before = resultSnapshot(s);
  s.pending.shift();
  s.mods.push({ kind: 'revenue', factor: 0.92, months: 4 });
  assert(!isMinorResult('x', 'Bajas precios.', before, resultSnapshot(s)), 'con un modificador nuevo');
  s.mods.pop(); s.contracts.push({ id: 'c', units: 1, price: 1, months: 1 });
  assert(!isMinorResult('x', 'Firmas.', before, resultSnapshot(s)), 'con un contrato nuevo');
  s.contracts.pop();
  assert(isMinorResult('x', 'Nada.', before, resultSnapshot(s)), 'sin efecto sigue siendo menor');
});

test('primera hora: los avisos de «Próximamente» dicen el mes, nunca «este mes»', () => {
  const s = fresh();
  for (let m = 0; m < 14; m++) {
    for (const line of upcoming(s)) assert(!/este mes/.test(line), line);
    s.month++;
  }
});

test('primera hora: la cobertura por debajo del 100 % no se redondea a 100', () => {
  assertEq(fillPct(0.996), '99 %');
  assertEq(fillPct(1), '100 %');
  assertEq(plural(1, 'negocio', 'negocios'), '1 negocio');
  assertEq(plural(3, 'mes', 'meses'), '3 meses');
});

test('primera hora: un desbloqueo trae su propio aviso', () => {
  const s = fresh();
  s.cash = 5e6; s.month = 30; s.notices = [];
  for (let i = 0; i < 4; i++) openBusiness(s, 'express', ['madrid', 'barcelona', 'valencia', 'sevilla'][i]);
  checkUnlocks(s);
  assert(s.notices.some((n) => n.kicker === '🔓 Desbloqueado'), JSON.stringify(s.notices));
});

test('primera hora: el objetivo del obrador regional llega con la entrega, no al pagar la obra', () => {
  const s = fresh();
  const g = GOALS.find((x) => x.id === 'regional');
  s.businesses.push({ id: 900, type: 'obrador_regional', city: 'zaragoza', mode: 'propia', level: 1, value: 1, readyMonth: s.month + 6 });
  assert(!g.test(s), 'en obras');
  s.month += 6;
  assert(g.test(s), 'entregado');
});

test('primera hora: recomprar una franquicia quebrada cuesta devolver su canon', () => {
  const s = fresh();
  s.cash = 1e6;
  const b = openBusiness(s, 'express', 'madrid', 'franquicia').business;
  const before = s.cash;
  s.pending.unshift({ kind: 'event', id: 'franquiciado_arruinado', params: { businessId: b.id } });
  const p = currentPending(s);
  const buy = p.choices.find((c) => /canon/.test(c.label));
  assert(buy && buy.label.includes(b.fee.toLocaleString('es-ES').slice(0, 2)), buy?.label);
  resolvePending(s, buy.index);
  assertEq(Math.round(before - s.cash), b.fee);
});

test('primera hora: la marca blanca dice cuánto obrador ocupa y sale como línea propia', () => {
  const s = fresh();
  s.lastReport = computeEconomy(s);
  s.pending.unshift({ kind: 'event', id: 'marca_blanca' });
  const firmar = currentPending(s).choices[0];
  assert(/5\.?000 uds\/mes/.test(firmar.hint) && /Cobertura prevista/.test(firmar.hint), firmar.hint);
  resolvePending(s, firmar.index);
  const r = computeEconomy(s);
  const line = r.lines.find((l) => l.type === 'contract');
  assert(line && line.revenue > 0 && /SuperAhorro/.test(line.label), JSON.stringify(line));
});

test('primera hora: las cartas dicen el coste antes de elegir', () => {
  const hintOf = (id, re) => EVENT_BY_ID[id].choices.find((c) => re.test(typeof c.label === 'function' ? '' : c.label))?.hint;
  assert(/60\.000/.test(hintOf('primo_argentino', /juicio/)), 'juicio');
  assert(/−8 %/.test(hintOf('rival_hipster', /Guerra de precios/)), 'guerra de precios');
  assert(/50 %/.test(hintOf('rival_hipster', /reseñas falsas/)), 'reseñas');
});
