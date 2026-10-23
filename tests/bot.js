// Bot de juego automático para equilibrar la economía y para los tests de humo.
import { newGame } from '../src/core/state.js';
import { advanceMonth, currentPending, resolvePending, checkEnding } from '../src/core/sim.js';
import { openBusiness, canOpen, buyUpgrade, sobaoTypeId, doManoloAction, borrow } from '../src/core/actions.js';
import { estimateOpening, patrimonio, creditLimit, grossPatrimonio } from '../src/core/economy.js';
import { refreshCandidates, hireExec, execOf } from '../src/core/execs.js';
import { canStartRD, startRD, upgradeBusiness, upgradeCost, launchCampaign } from '../src/core/market.js';
import { acquireRival, acquisitionPrice } from '../src/core/rivals.js';
import { canIPO, doIPO } from '../src/core/life.js';
import { PRODUCTS } from '../src/data/market.js';
import { CITIES } from '../src/data/cities.js';
import { random } from '../src/core/rng.js';

const CITY_IDS = CITIES.filter((c) => !c.hq).map((c) => c.id);
const DIVERSIFY = ['smash', 'empanadas', 'airbnb', 'vivienda', 'academy', 'taberna', 'gimnasio', 'coworking', 'residencia'];

/**
 * Estrategias:
 *  brand: 'express' | 'maison'
 *  policies: políticas fijas a aplicar
 *  diversify: abre otros negocios cuando se desbloquean
 *  leverage: usa la póliza para invertir
 *  franchise: vende franquicias cuando la tienda propia no sale rentable
 *  smart: usa los sistemas de gestión (directivos, I+D, reformas, campañas, OPA, Bolsa, familia)
 *  choice: 'first' | 'random' para resolver sucesos
 *  difficulty: 'cunado' | 'normal' | 'hacienda'
 */
export function playGame(seed, strategy = {}) {
  const s = newGame(seed, strategy.difficulty || 'normal');
  resolvePending(s, strategy.brand === 'maison' ? 1 : 0);
  Object.assign(s.policies, strategy.policies || {});
  const trace = [];
  while (!s.ending && s.month < 96) {
    if (s.lastReport && s.lastReport.fill < 0.97) buyUpgrade(s);
    if (strategy.leverage && s.debt < creditLimit(s) * 0.5 && s.cash < 150000) borrow(s, 50000);
    if (strategy.smart) manage(s, strategy.off || []);
    const types = [sobaoTypeId(s)];
    if (strategy.diversify) types.push(...DIVERSIFY);
    let best = null;
    for (const t of types) {
      for (const c of CITY_IDS) {
        for (const mode of strategy.franchise && t === sobaoTypeId(s) ? ['propia', 'franquicia'] : ['propia']) {
          const ok = canOpen(s, t, c, mode);
          if (!ok.ok) continue;
          const est = estimateOpening(s, t, c, mode);
          if (est.delta < 800) continue;
          const score = est.delta / Math.max(mode === 'franquicia' ? 1 : ok.cost, 20000);
          if (!best || score > best.score) best = { t, c, mode, score };
        }
      }
    }
    if (best && s.cash > 40000) openBusiness(s, best.t, best.c, best.mode);
    const action = strategy.smart && !s.flags.divorciado && s.familia < 35 ? 'cena' : strategy.action || 'linkedin';
    doManoloAction(s, action);
    advanceMonth(s);
    while (s.pending.length) {
      const p = currentPending(s);
      const k = strategy.choice === 'random' ? Math.floor(random(s) * p.choices.length) : 0;
      resolvePending(s, p.choices[k].index);
    }
    s.notices = [];
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
    rivals: s.rivals.length,
    divorced: !!s.flags.divorciado,
    ipo: !!s.ipo,
    trace,
    state: s,
  };
}

// Decisiones de gestión de un jugador razonable.
function manage(s, off) {
  refreshCandidates(s);
  if (!off.includes('exec')) for (const c of [...(s.candidates || [])].sort((a, b) => b.skill - a.skill)) {
    if (!execOf(s, c.pos) && c.trait !== 'enchufado' && s.cash > c.salary * 30) hireExec(s, c.id);
  }
  if (!s.rd && !off.includes('rd')) {
    const p = PRODUCTS.find((x) => canStartRD(s, x.id).ok && x.cost < s.cash * 0.25);
    if (p) startRD(s, p.id);
  }
  const lines = new Map((s.lastReport?.lines || []).map((l) => [l.id, l.revenue - l.cost]));
  const candidates = s.businesses.filter((b) => upgradeCost(b) != null && (lines.get(b.id) || 0) > 3000).sort((a, b) => (lines.get(b.id) || 0) - (lines.get(a.id) || 0));
  if (!off.includes('upgrade') && candidates[0] && s.cash > upgradeCost(candidates[0]) * 3) upgradeBusiness(s, candidates[0].id);
  if (!off.includes('campaign') && s.cash > 800000) launchCampaign(s, 'tele');
  if (!off.includes('opa')) for (const r of [...s.rivals]) if (s.cash > acquisitionPrice(s, r.id) * 3) acquireRival(s, r.id);
  if (s.macro.phase === 'burbuja' && canIPO(s, grossPatrimonio(s)).ok) doIPO(s, grossPatrimonio(s));
}
