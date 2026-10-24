// Bot de juego automático para equilibrar la economía y para los tests de humo.
import { newGame } from '../src/core/state.js';
import { advanceMonth, currentPending, resolvePending, checkEnding, score } from '../src/core/sim.js';
import { openBusiness, canOpen, buyUpgrade, sobaoTypeId, doManoloAction, borrow, setPolicy } from '../src/core/actions.js';
import { estimateOpening, patrimonio, creditLimit, grossPatrimonio } from '../src/core/economy.js';
import { refreshCandidates, hireExec, execOf } from '../src/core/execs.js';
import { canStartRD, startRD, upgradeBusiness, upgradeCost, launchCampaign } from '../src/core/market.js';
import { acquireRival, acquisitionPrice } from '../src/core/rivals.js';
import { canIPO, doIPO } from '../src/core/life.js';
import { PRODUCTS } from '../src/data/market.js';
import { CITIES } from '../src/data/cities.js';
import { random } from '../src/core/rng.js';
import { canAsk, askLoan } from '../src/core/cartilla.js';

const CITY_IDS = CITIES.filter((c) => !c.hq).map((c) => c.id);
const DIVERSIFY = ['smash', 'empanadas', 'airbnb', 'vivienda', 'academy', 'taberna', 'gimnasio', 'coworking', 'residencia', 'obrador_regional'];

/**
 * Estrategias:
 *  brand: 'express' | 'maison'
 *  policies: políticas fijas a aplicar
 *  diversify: abre otros negocios cuando se desbloquean
 *  leverage: usa la póliza para invertir
 *  franchise: vende franquicias cuando la tienda propia no sale rentable
 *  smart: usa los sistemas de gestión (directivos, I+D, reformas, campañas, OPA, Bolsa, familia)
 *  reapply: vuelve a aplicar las políticas cada mes (tras la legalidad forzosa)
 *  maxBiz: no abre más allá de ese número de negocios · cities: solo abre en esas ciudades
 *  clause: id de cláusula del testamento a forzar
 *  choice: 'first' | 'random' para resolver sucesos
 *  difficulty: 'cunado' | 'normal' | 'hacienda'
 *  endless: no se para en la revista (para medir el patrimonio a 96 meses) · months: meses a jugar (96)
 *  policyAt(s): políticas según el momento (null = las de `policies`), p. ej. from(24, {...})
 *  control: { hi, lo }: con políticas ilegales, pasa a legal cuando el radar de Trabajo llega a hi y vuelve
 *    a explotar cuando baja de lo
 *  choose(s, p): índice de la opción para una carta (null = la regla por defecto)
 *  hook(s), onMonth(s, r, eventos): ganchos para scripts de medida
 *  mama: pide a Doña Remedios «lo que pueda» cuando se deja (y resuelve sus cartas con la primera opción)
 */
export const LEGAL = { salario: 'convenio', horas: 'pagadas', becarios: 'ninguno' };
export const from = (m, pol) => (s) => (s.month >= m ? pol : null);
export function playGame(seed, strategy = {}) {
  const s = newGame(seed, strategy.difficulty || 'normal');
  resolvePending(s, strategy.brand === 'maison' ? 1 : 0);
  Object.assign(s.policies, strategy.policies || {});
  if (strategy.clause) s.clausula = { id: strategy.clause, broken: false, done: false };
  if (strategy.endless) s.endless = true;
  const trace = [];
  const mon = [];
  let firstForbes = null;
  let ctl = false;
  while (!s.ending && s.month < (strategy.months ?? 96)) {
    if (strategy.reapply) for (const [k, v] of Object.entries(strategy.policies || {})) setPolicy(s, k, v);
    let pol = strategy.policyAt ? strategy.policyAt(s) : null;
    if (pol && strategy.control) {
      if (s.heatTrabajo >= strategy.control.hi) ctl = true;
      if (s.heatTrabajo <= strategy.control.lo) ctl = false;
      if (ctl) pol = LEGAL;
    }
    if (pol) for (const [k, v] of Object.entries(pol)) setPolicy(s, k, v);
    if (strategy.reparto) setPolicy(s, 'reparto', typeof strategy.reparto === 'function' ? strategy.reparto(s) : strategy.reparto);
    strategy.hook?.(s);
    if (strategy.mama && canAsk(s).ok) askLoan(s, 'max');
    if (s.lastReport && s.lastReport.fill < 0.97) buyUpgrade(s);
    if (strategy.leverage && s.debt < creditLimit(s) * 0.5 && s.cash < 150000) borrow(s, 50000);
    if (strategy.smart) manage(s, strategy.off || []);
    const types = [sobaoTypeId(s)];
    if (strategy.diversify) types.push(...DIVERSIFY);
    let best = null;
    for (const t of types) {
      for (const c of strategy.cities || CITY_IDS) {
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
    if (best && s.cash > 40000 && s.businesses.length < (strategy.maxBiz ?? Infinity)) openBusiness(s, best.t, best.c, best.mode);
    let action = strategy.action || 'linkedin';
    if (strategy.smart && (s.estres ?? 0) > 65) action = s.cash > 20000 ? 'escapada' : 'padel';
    else if (strategy.smart && !s.flags.divorciado && s.familia < 35) action = 'cena';
    doManoloAction(s, action);
    const r = advanceMonth(s);
    const evs = [];
    while (s.pending.length) {
      const p = currentPending(s);
      evs.push(p.pending.id);
      let idx = strategy.choose ? strategy.choose(s, p) : null;
      if (idx == null) idx = p.choices[strategy.choice === 'random' ? Math.floor(random(s) * p.choices.length) : 0].index;
      resolvePending(s, idx);
    }
    s.notices = [];
    checkEnding(s);
    const pat = patrimonio(s);
    if (firstForbes == null && pat >= 15e6) firstForbes = s.month;
    if (s.month % 12 === 0) trace.push(Math.round(pat / 1000));
    if (strategy.trace) mon.push({ m: s.month, pat, net: r?.net ?? 0, moral: s.moral, agravio: s.agravio ?? 0, emp: r?.employees ?? 0, ht: s.heatTrabajo, evs });
    strategy.onMonth?.(s, r, evs);
  }
  return {
    seed,
    ending: s.ending,
    month: s.month,
    patrimonio: Math.round(patrimonio(s)),
    score: score(s),
    clausula: s.clausula ? `${s.clausula.id}:${s.clausula.done ? 'ok' : s.clausula.broken ? 'rota' : 'no'}` : null,
    businesses: s.businesses.length,
    expedientes: s.expedientes,
    inspecciones: s.stats.inspecciones,
    auditorias: s.stats.auditorias,
    multas: Math.round(s.stats.multas),
    rivals: s.rivals.length,
    divorced: !!s.flags.divorciado,
    ipo: !!s.ipo,
    firstForbes,
    liquidado: Math.round(s.stats.liquidado ?? 0),
    huelgas: s.stats.huelgas ?? 0,
    trace,
    mon,
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
  s.policies.mantenimiento = s.cash > 500000 ? 'profesional' : 'manitas';
}
