// Bot de juego automático para equilibrar la economía y para los tests de humo.
import { newGame } from '../src/core/state.js';
import { advanceMonth, currentPending, resolvePending, checkEnding, score } from '../src/core/sim.js';
import { openBusiness, canOpen, buyUpgrade, sobaoTypeId, doManoloAction, borrow, setPolicy, openingCost } from '../src/core/actions.js';
import { estimateOpening, patrimonio, creditLimit, grossPatrimonio } from '../src/core/economy.js';
import { refreshCandidates, hireExec, execOf } from '../src/core/execs.js';
import { canStartRD, startRD, upgradeBusiness, upgradeCost, launchCampaign } from '../src/core/market.js';
import { acquireRival, acquisitionPrice } from '../src/core/rivals.js';
import { canIPO, doIPO } from '../src/core/life.js';
import { PRODUCTS } from '../src/data/market.js';
import { CITIES } from '../src/data/cities.js';
import { random } from '../src/core/rng.js';
import { canAsk, askLoan } from '../src/core/cartilla.js';
import { canSignAgreement, signAgreement, endAgreement, agreementTerms } from '../src/core/international.js';
import { FOREIGN_CITIES } from '../src/data/foreignCities.js';
import { FOREIGN_MARKETS } from '../src/data/international.js';
import { isOperating } from '../src/core/construction.js';

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
 *  guia: guía de la promesa del trimestre cotizando ('prudente' por defecto, 'en_linea', 'optimista', 'tiburon')
 *  mama: pide a Doña Remedios «lo que pueda» cuando se deja (y resuelve sus cartas con la primera opción)
 *  campaign: 'classic' (por defecto en el bot) | 'europe'
 *  scan: evalúa solo ese número de combinaciones tipo×ciudad al mes, elegidas con un azar propio del bot
 *    (no toca el de la partida); sin scan, las prueba todas · opens: aperturas como mucho por mes (1)
 *  europe: persigue la meta de la campaña europea (marca blanca → despliegue exterior → tienda propia en cada
 *    país; I+D de logística, telecomunicaciones y banca; viviendas donde falte plantilla) y no vende un local
 *    a un rival. Abre también los sectores estratégicos y en ciudades europeas. rank: 'ratio' (beneficio/coste,
 *    por defecto) | 'delta' (el mayor beneficio con un plazo de recuperación ≤ payback meses, 36 por defecto)
 */
export const LEGAL = { salario: 'convenio', horas: 'pagadas', becarios: 'ninguno' };
// Azar del propio bot (mulberry32), para no gastar el de la partida al decidir qué mirar.
function botRandom(seed, month) {
  let a = (seed * 2654435761 + month * 40503) | 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const from = (m, pol) => (s) => (s.month >= m ? pol : null);
const STRATEGIC = ['plataforma_logistica', 'red_telecom', 'licencia_bancaria'];
const STRATEGIC_TYPES = ['logistica', 'telecom', 'banca'];
const EU_MARKETS = FOREIGN_MARKETS.filter((m) => FOREIGN_CITIES.some((c) => c.market === m.id)).sort((a, b) => a.setup - b.setup);
const FOREIGN_IDS = FOREIGN_CITIES.map((c) => c.id);
const marketOf = Object.fromEntries(FOREIGN_CITIES.map((c) => [c.id, c.market]));
const ownIn = (s, market) => s.businesses.some((b) => b.mode !== 'franquicia' && isOperating(s, b) && marketOf[b.city] === market);

// Lo que haría un jugador que va a por la meta europea, antes de la gestión de siempre.
function europeStep(s, strategy) {
  const track = (m) => s.foreignTrack?.[m]?.successMonths || 0;
  // Laboratorio: primero el despliegue exterior en cuanto un país lo permite; si no, los sectores estratégicos.
  if (!s.rd) {
    if (!s.products.includes('expansion_propia') && EU_MARKETS.some((m) => track(m.id) >= 6)) {
      if (canStartRD(s, 'expansion_propia').ok) startRD(s, 'expansion_propia');
    } else {
      const next = STRATEGIC.find((id, i) => !s.unlocked[STRATEGIC_TYPES[i]] && !s.products.includes(id));
      const cost = PRODUCTS.find((x) => x.id === next)?.cost ?? Infinity;
      if (next && s.cash > cost * 2 && canStartRD(s, next).ok) startRD(s, next);
    }
  }
  // Marca blanca, con auditoría, en los mercados más baratos, si el obrador puede servirla al 90 %.
  const rep = s.lastReport;
  if (rep && s.cash > 300000) {
    const needed = 7 - EU_MARKETS.filter((m) => ownIn(s, m.id)).length;
    let spare = rep.capacity * 0.92 - rep.totalDemand;
    let signed = (s.foreignDeals || []).filter((d) => d.mode === 'private_label').length;
    for (const m of EU_MARKETS) {
      if (signed >= needed) break;
      if (ownIn(s, m.id) || track(m.id) >= 6 || (s.foreignDeals || []).some((d) => d.market === m.id)) continue;
      const units = agreementTerms(m.id, 'private_label', true).units;
      if (spare < units) { if (rep.fill > 0.97) buyUpgrade(s); break; }
      if (!canSignAgreement(s, m.id, 'private_label', true).ok) break;
      signAgreement(s, m.id, 'private_label', true);
      spare -= units; signed++;
    }
  }
  // Tienda propia en cada país desbloqueado y, ya dentro, fuera el acuerdo (libera obrador y evita disputas).
  if (s.products.includes('expansion_propia')) {
    for (const m of EU_MARKETS) {
      if (track(m.id) < 6) continue;
      if (!ownIn(s, m.id)) {
        let best = null;
        for (const c of FOREIGN_CITIES.filter((x) => x.market === m.id)) {
          if (!canOpen(s, sobaoTypeId(s), c.id).ok) continue;
          const d = estimateOpening(s, sobaoTypeId(s), c.id, 'propia').delta;
          if (!best || d > best.d) best = { c: c.id, d };
        }
        if (best) openBusiness(s, sobaoTypeId(s), best.c);
      }
      const deal = (s.foreignDeals || []).find((d) => d.market === m.id);
      if (deal && ownIn(s, m.id)) endAgreement(s, deal.id);
    }
  }
  // Un local de cada sector estratégico en cuanto se pueda, en la ciudad que más rinda.
  for (const type of STRATEGIC_TYPES) {
    if (!s.unlocked[type] || s.businesses.some((b) => b.type === type && b.mode !== 'franquicia')) continue;
    let best = null;
    let blocked = null;
    for (const c of [...CITY_IDS, ...FOREIGN_IDS]) {
      const ok = canOpen(s, type, c);
      if (!ok.ok && /plazas/.test(ok.msg || '')) { blocked ??= c; continue; }
      if (!ok.ok && !/en caja/.test(ok.msg || '')) continue;
      const d = estimateOpening(s, type, c, 'propia').delta;
      if (d > 0 && (!best || d > best.d)) best = { c, d };
    }
    if (best) {
      const cost = openingCost(s, type, 'propia', best.c);
      if (s.cash < cost && strategy.leverage) fund(s, cost - s.cash + 50000);
      openBusiness(s, type, best.c);
    } else if (blocked) housingFor(s, blocked, strategy);
  }
}
// Viviendas para la plantilla donde un negocio grande no cabe (una promoción en obras por ciudad).
function housingFor(s, city, strategy) {
  if (s.businesses.some((b) => b.type === 'vivienda' && b.city === city && !isOperating(s, b))) return;
  const cost = openingCost(s, 'vivienda', 'propia', city, 'apartamentos');
  if (s.cash < cost * 1.2 && strategy.leverage) fund(s, cost * 1.2 - s.cash);
  if (canOpen(s, 'vivienda', city, 'propia', 'apartamentos').ok) openBusiness(s, 'vivienda', city, 'propia', 'apartamentos');
}
// Crédito solo si cabe con holgura (deuda hasta el 80 % del límite).
function fund(s, amount) {
  if (amount <= 0) return;
  const room = creditLimit(s) * 0.8 - s.debt;
  if (room >= amount) borrow(s, Math.ceil(amount / 25000) * 25000);
}

// En la campaña europea, vender un local a un rival puede costar un país.
const europeChooser = (p) => (p.pending.id === 'rival_oferta_compra' ? p.choices.find((c) => c.index === 1)?.index ?? null : null);

export function playGame(seed, strategy = {}) {
  const s = newGame(seed, strategy.difficulty || 'normal',strategy.campaign||'classic');
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
    if (strategy.europe) europeStep(s, strategy);
    if (strategy.smart) manage(s, strategy.off || []);
    const types = [sobaoTypeId(s)];
    if (strategy.diversify) types.push(...DIVERSIFY);
    if (strategy.europe) types.push(...STRATEGIC_TYPES);
    const cityIds = strategy.cities || (strategy.europe ? [...CITY_IDS, ...FOREIGN_IDS] : CITY_IDS);
    let pairs = null;
    if (strategy.scan) {
      const pick = botRandom(seed, s.month);
      pairs = Array.from({ length: strategy.scan }, () => [types[Math.floor(pick() * types.length)], cityIds[Math.floor(pick() * cityIds.length)]]);
    }
    for (let k = 0; k < (strategy.opens ?? 1); k++) {
      let best = null;
      for (const [t, c] of pairs || types.flatMap((t) => cityIds.map((c) => [t, c]))) {
        for (const mode of strategy.franchise && t === sobaoTypeId(s) ? ['propia', 'franquicia'] : ['propia']) {
          const ok = canOpen(s, t, c, mode);
          if (!ok.ok) continue;
          const est = estimateOpening(s, t, c, mode);
          if (est.delta < 800) continue;
          const cost = mode === 'franquicia' ? 1 : ok.cost;
          if (strategy.rank === 'delta' && cost / est.delta > (strategy.payback ?? 36)) continue;
          const score = strategy.rank === 'delta' ? est.delta : est.delta / Math.max(cost, 20000);
          if (!best || score > best.score) best = { t, c, mode, score };
        }
      }
      if (!(best && s.cash > 40000 && s.businesses.length < (strategy.maxBiz ?? Infinity))) break;
      if (!openBusiness(s, best.t, best.c, best.mode)?.ok) break;
    }
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
      if (idx == null && strategy.europe) idx = europeChooser(p);
      if (idx == null && strategy.guia && p.pending.id === 'promesa_trimestre') idx = p.choices.find((c) => c.key === strategy.guia)?.index ?? null;
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
