// Bot de juego automático para equilibrar la economía y para los tests de humo.
import { newGame } from '../src/core/state.js';
import { advanceMonth, currentPending, resolvePending, checkEnding } from '../src/core/sim.js';
import { openBusiness, canOpen, buyUpgrade, sobaoTypeId, doManoloAction, borrow } from '../src/core/actions.js';
import { estimateOpening, patrimonio, creditLimit } from '../src/core/economy.js';
import { CITIES } from '../src/data/cities.js';
import { random } from '../src/core/rng.js';

const CITY_IDS = CITIES.filter((c) => !c.hq).map((c) => c.id);

/**
 * Estrategias:
 *  brand: 'express' | 'maison'
 *  policies: políticas fijas a aplicar
 *  diversify: abre otros negocios cuando se desbloquean
 *  leverage: usa la póliza para invertir
 *  franchise: vende franquicias cuando la tienda propia no sale rentable
 *  choice: 'first' | 'random' para resolver sucesos
 */
export function playGame(seed, strategy = {}) {
  const s = newGame(seed);
  resolvePending(s, strategy.brand === 'maison' ? 1 : 0);
  Object.assign(s.policies, strategy.policies || {});
  const trace = [];
  while (!s.ending && s.month < 96) {
    if (s.lastReport && s.lastReport.fill < 0.97) buyUpgrade(s);
    if (strategy.leverage && s.debt < creditLimit(s) * 0.5 && s.cash < 150000) borrow(s, 50000);
    const types = [sobaoTypeId(s)];
    if (strategy.diversify) types.push('smash', 'empanadas', 'airbnb', 'vivienda', 'academy');
    let best = null;
    for (const t of types) {
      for (const c of CITY_IDS) {
        for (const mode of strategy.franchise && t === sobaoTypeId(s) ? ['propia', 'franquicia'] : ['propia']) {
          if (!canOpen(s, t, c, mode).ok) continue;
          const est = estimateOpening(s, t, c, mode);
          if (est.delta < 800) continue;
          const cost = mode === 'franquicia' ? 1 : canOpen(s, t, c, mode).cost;
          const score = est.delta / Math.max(cost, 20000);
          if (!best || score > best.score) best = { t, c, mode, score };
        }
      }
    }
    if (best && s.cash > 40000) openBusiness(s, best.t, best.c, best.mode);
    doManoloAction(s, strategy.action || 'linkedin');
    advanceMonth(s);
    while (s.pending.length) {
      const p = currentPending(s);
      const k = strategy.choice === 'random' ? Math.floor(random(s) * p.choices.length) : 0;
      resolvePending(s, p.choices[k].index);
    }
    checkEnding(s);
    if (s.month % 12 === 0) trace.push(Math.round(patrimonio(s) / 1000));
  }
  return {
    seed,
    ending: s.ending,
    month: s.month,
    patrimonio: Math.round(patrimonio(s)),
    businesses: s.businesses.length,
    expedientes: s.expedientes,
    inspecciones: s.stats.inspecciones,
    auditorias: s.stats.auditorias,
    multas: Math.round(s.stats.multas),
    trace,
    state: s,
  };
}
