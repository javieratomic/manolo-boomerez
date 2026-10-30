// Fuzzer de invariantes: partidas caóticas con acciones válidas al azar y comprobaciones cada mes.
// Uso: node tests/fuzz.mjs [--seeds 20] [--from 1] [--months 240] [--campaign europe] [--roundtrip 12]
//      [--rich] (50 M€ al empezar) [--tame] (políticas legales y, en las cartas, la opción honrada el 70 %) [--quiet]
// Sale con código 1 si algún invariante falla, y cada fallo trae semilla y mes para reproducirlo.
import { newGame, serialize, deserialize } from '../src/core/state.js';
import { advanceMonth, currentPending, resolvePending, checkEnding, canRetire, retire } from '../src/core/sim.js';
import * as A from '../src/core/actions.js';
import * as M from '../src/core/market.js';
import * as MK from '../src/core/marketing.js';
import * as INT from '../src/core/international.js';
import * as H from '../src/core/housing.js';
import * as ON from '../src/core/online.js';
import * as PF from '../src/core/portfolio.js';
import * as DV from '../src/core/divestment.js';
import * as OP from '../src/core/opportunities.js';
import * as EX from '../src/core/execs.js';
import * as LF from '../src/core/life.js';
import * as CT from '../src/core/cartilla.js';
import * as RV from '../src/core/rivals.js';
import * as DY from '../src/core/dynasty.js';
import { patrimonio } from '../src/core/economy.js';
import { BUSINESS_TYPES } from '../src/data/businesses.js';
import { ALL_CITIES } from '../src/data/cities.js';
import { CAMPAIGNS, PRODUCTS } from '../src/data/market.js';
import { FOREIGN_MARKETS, DEAL_MODES } from '../src/data/international.js';
import { LUJOS } from '../src/data/lujo.js';
import { MANOLO_ACTIONS } from '../src/data/manoloActions.js';
import { EXTRA_ACTIONS } from '../src/data/manoloActionsExtra.js';
import { POLICIES, LEGAL_LABOR } from '../src/data/policies.js';
import { ONLINE_SHIPPING } from '../src/data/online.js';
import { HOUSING_FORMS } from '../src/data/housing.js';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SEEDS = Number(arg('seeds', 20)), FROM = Number(arg('from', 1)), MONTHS = Number(arg('months', 240));
const CAMPAIGN = arg('campaign', 'europe'), ROUNDTRIP = Number(arg('roundtrip', 12)), RICH = process.argv.includes('--rich');
const QUIET = process.argv.includes('--quiet');
// --tame: políticas legales y cartas casi siempre honradas, para que las partidas lleguen lejos (relevos, imperio grande).
const TAME = process.argv.includes('--tame');
const TAME_POLICY = { ...LEGAL_LABOR, contabilidad: 'limpia', ingredientes: 'mantequilla', alquiler: 'mercado' };

// Azar propio del fuzzer (no toca el RNG de la partida al elegir; las acciones sí pueden usarlo).
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pickOf = (r, xs) => xs[Math.floor(r() * xs.length)];
const asList = (x) => (Array.isArray(x) ? x : Object.values(x || {}));
const idsOf = (x) => (Array.isArray(x) ? x.map((y) => y.id ?? y) : Object.keys(x || {}));

const TYPES = Object.keys(BUSINESS_TYPES);
const CITIES = ALL_CITIES.map((c) => c.id);
const CAMP_IDS = CAMPAIGNS.map((c) => c.id);
const PRODUCT_IDS = PRODUCTS.map((p) => p.id);
const MARKET_IDS = FOREIGN_MARKETS.map((m) => m.id);
const MODES = idsOf(DEAL_MODES);
const LUJO_IDS = asList(LUJOS).map((l) => l.id);
const ACTION_IDS = [...asList(MANOLO_ACTIONS), ...asList(EXTRA_ACTIONS)].map((a) => a.id);
const SHIPPING = Object.keys(ONLINE_SHIPPING);
const FORMS = Object.keys(HOUSING_FORMS);
const HEIRS = ['vanessa', 'kevin', 'merche', 'plantilla', 'profesional', 'familia'];

function randomSubset(r, xs, max = 6) { const out = []; for (const x of xs) if (r() < 0.3 && out.length < max) out.push(x); return out; }

// Cada acción recibe (s, r) y llama a la API como lo haría la interfaz, con argumentos válidos.
const ACTIONS = [
  [6, 'open', (s, r) => A.openBusiness(s, pickOf(r, TYPES), pickOf(r, CITIES), r() < 0.3 ? 'franquicia' : 'propia', pickOf(r, FORMS))],
  [2, 'sell', (s, r) => s.businesses.length && A.sellBusiness(s, pickOf(r, s.businesses).id)],
  [3, 'upgrade', (s, r) => s.businesses.length && M.upgradeBusiness(s, pickOf(r, s.businesses).id)],
  [1, 'obrador', (s) => A.buyUpgrade(s)],
  [3, 'policy', (s, r) => { const k = pickOf(r, Object.keys(POLICIES)); if (TAME && TAME_POLICY[k]) return A.setPolicy(s, k, TAME_POLICY[k]); return A.setPolicy(s, k, pickOf(r, Object.keys(POLICIES[k].options))); }],
  [2, 'borrow', (s, r) => A.borrow(s, pickOf(r, [50000, 250000, 1e6]))],
  [2, 'repay', (s, r) => A.repay(s, pickOf(r, [50000, 250000, 1e6]))],
  [2, 'rd', (s, r) => M.startRD(s, pickOf(r, PRODUCT_IDS))],
  [2, 'campaign', (s, r) => MK.launchCampaignBatch(s, pickOf(r, CAMP_IDS), null)],
  [2, 'deal', (s, r) => INT.signAgreement(s, pickOf(r, MARKET_IDS), pickOf(r, MODES), r() < 0.5)],
  [1, 'endDeal', (s, r) => { const xs = s.foreignDeals || []; return xs.length && INT.endAgreement(s, pickOf(r, xs).id); }],
  [1, 'online', (s, r) => [ON.openOnline, ON.upgradeOnline, ON.toggleOnline][Math.floor(r() * 3)](s)],
  [1, 'shipping', (s, r) => ON.setOnlineShipping(s, pickOf(r, SHIPPING))],
  [1, 'housing', (s, r) => { const g = r() < 0.5 ? 'employee' : 'public'; const vals = g === 'employee' ? Object.keys(POLICIES.alquiler.options) : ['social', 'mercado', 'premium', 'bajo', 'alto']; return H.setHousingPolicy(s, pickOf(r, CITIES), g, pickOf(r, vals)); }],
  [2, 'hire', (s, r) => { EX.refreshCandidates(s); const c = s.candidates || []; return c.length && EX.hireExec(s, pickOf(r, c).id); }],
  [1, 'fire', (s, r) => { const ks = Object.keys(s.execs || {}); return ks.length && EX.fireExec(s, pickOf(r, ks)); }],
  [1, 'lujo', (s, r) => (r() < 0.6 ? LF.buyLujo : LF.sellLujo)(s, pickOf(r, LUJO_IDS))],
  [1, 'ipo', (s) => { const eq = LF.grossEquity ? null : null; const c = LF.canIPO(s, patrimonio(s)); return c.ok && LF.doIPO(s, patrimonio(s)); }],
  [1, 'mama', (s, r) => (r() < 0.6 ? CT.canAsk(s).ok && CT.askLoan(s, 'max') : CT.repayEarly(s))],
  [1, 'rival', (s, r) => { if (!s.rivals?.length) return; const rv = pickOf(r, s.rivals); return r() < 0.3 ? RV.acquireRival(s, rv.id) : RV.actOnRival(s, rv.id, pickOf(r, CITIES), pickOf(r, ['precios', 'resenas', 'fichar'])); }],
  [2, 'batchUpgrade', (s, r) => s.businesses.length && PF.upgradeBatch(s, randomSubset(r, s.businesses.map((b) => b.id)))],
  [1, 'batchSale', (s, r) => s.businesses.length > 3 && DV.saleBatch(s, randomSubset(r, s.businesses.map((b) => b.id), 3))],
  [2, 'opening', (s, r) => { const o = OP.openingOpportunities(s, {}); const xs = o?.items || o?.rows || o || []; const it = Array.isArray(xs) && xs.length ? pickOf(r, xs) : null; return it && OP.executeOpening(s, it.choice || it); }],
  [4, 'manolo', (s, r) => A.doManoloAction(s, pickOf(r, ACTION_IDS))],
  [1, 'rebrand', (s) => A.canRebrand(s).ok && A.rebrand(s)],
  [1, 'heir', (s, r) => DY.nominateHeir(s, pickOf(r, HEIRS))],
  [0.3, 'retire', (s) => canRetire(s).ok && retire(s)],
];
const TOTAL_W = ACTIONS.reduce((a, [w]) => a + w, 0);
function randomAction(r) { let x = r() * TOTAL_W; for (const a of ACTIONS) { x -= a[0]; if (x <= 0) return a; } return ACTIONS[0]; }

// Invariantes.
const RANGES = { moral: [0, 100], rep: [0, 100], fama: [0, 100], familia: [0, 100], estres: [0, 100], heatTrabajo: [0, 100], heatHacienda: [0, 100] };
function scanNumbers(x, path, out, seen = new Set()) {
  if (typeof x === 'number') { if (!Number.isFinite(x)) out.push(`${path} = ${x}`); return; }
  if (!x || typeof x !== 'object' || seen.has(x)) return;
  seen.add(x);
  for (const [k, v] of Object.entries(x)) { scanNumbers(v, path + '.' + k, out, seen); if (out.length > 5) return; }
}
function checkState(s, where, fail) {
  const bad = []; scanNumbers(s, 's', bad);
  for (const b of bad) fail('no-finito', `${where}: ${b}`);
  for (const [k, [lo, hi]] of Object.entries(RANGES)) if (typeof s[k] === 'number' && (s[k] < lo - 1e-9 || s[k] > hi + 1e-9)) fail('rango', `${where}: ${k}=${s[k]}`);
  if (s.debt < -1e-6) fail('rango', `${where}: debt=${s.debt}`);
  const ids = new Set();
  for (const b of s.businesses) { if (ids.has(b.id)) fail('negocio-duplicado', `${where}: ${b.id}`); ids.add(b.id); if (!BUSINESS_TYPES[b.type]) fail('negocio-tipo', `${where}: ${b.type}`); }
  if (s.pending.length > 25) fail('cola-desbocada', `${where}: ${s.pending.length} cartas: ${s.pending.slice(0, 8).map((p) => p.id).join(',')}`);
}

const failures = new Map();
let games = 0, monthsPlayed = 0, actionsRun = 0, cards = 0, maxAdvance = 0, maxAdvanceAt = '', endings = {};
function playChaos(seed) {
  const r = mulberry(seed * 7919 + 13);
  const s = newGame(seed, pickOf(r, ['cunado', 'normal', 'hacienda']), CAMPAIGN);
  if (RICH) s.cash += 5e7;
  const fail = (kind, msg) => { if (!failures.has(kind)) failures.set(kind, []); const xs = failures.get(kind); if (xs.length < 6) xs.push(`seed ${seed} · ${msg}`); };
  const resolveAll = (where) => {
    let guard = 0;
    while (s.pending.length) {
      if (++guard > 60) { fail('cola-infinita', `${where}: ${s.pending.slice(0, 6).map((p) => p.id).join(',')}`); s.pending = []; return; }
      let p;
      try { p = currentPending(s); } catch (e) { fail('excepcion-carta', `${where} ${s.pending[0]?.id}: ${e.message}`); s.pending.shift(); continue; }
      if (!p.event) { fail('carta-desconocida', `${where}: ${s.pending[0].id}`); s.pending.shift(); continue; }
      if (!p.choices.length) { fail('carta-sin-opciones', `${where}: ${p.pending.id}`); s.pending.shift(); continue; }
      const c = TAME && r() < 0.7 ? p.choices[0] : pickOf(r, p.choices);
      try { resolvePending(s, c.index); cards++; } catch (e) { fail('excepcion-elegir', `${where} ${p.pending.id}#${c.index}: ${e.message}`); s.pending.shift(); }
    }
  };
  resolveAll('inicio');
  while (!s.ending && s.month < MONTHS) {
    const where = `mes ${s.month}`;
    const n = Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const [, name, fn] = randomAction(r);
      try { fn(s, r); actionsRun++; } catch (e) { fail('excepcion-accion', `${where} ${name}: ${e.message}`); }
      if (s.pending.length) resolveAll(`${where} tras ${name}`);
    }
    const before = s.month;
    const t0 = performance.now();
    let rep;
    try { rep = advanceMonth(s); } catch (e) { fail('excepcion-cierre', `${where}: ${e.stack.split('\n').slice(0, 3).join(' | ')}`); break; }
    const dt = performance.now() - t0;
    if (dt > maxAdvance) { maxAdvance = dt; maxAdvanceAt = `seed ${seed} mes ${before} (${s.businesses.length} negocios)`; }
    if (s.month !== before + 1 && !s.ending) fail('mes-no-avanza', `${where}: advanceMonth devolvió ${rep === null ? 'null' : typeof rep} con ${s.pending.length} cartas`);
    resolveAll(`cierre ${before}`);
    try { checkEnding(s); } catch (e) { fail('excepcion-final', `${where}: ${e.message}`); }
    checkState(s, `tras mes ${before}`, fail);
    if (ROUNDTRIP && s.month % ROUNDTRIP === 0 && !s.ending) {
      try {
        // Tras una primera carga (que puede rellenar claves), guardar y cargar no cambia nada más.
        const x = deserialize(serialize(s)), b = serialize(x), c = serialize(deserialize(b));
        const live = structuredClone(s);
        if (b !== c) { let i = 0; while (b[i] === c[i]) i++; fail('guardado-no-idempotente', `mes ${s.month}: …${b.slice(Math.max(0, i - 60), i + 40)}…`); }
        // Y lo importante: la partida cargada vive lo mismo que la que no se cargó.
        const step = (g) => { advanceMonth(g); let k = 0; while (g.pending.length && k++ < 60) { const p = currentPending(g); if (!p?.choices?.length) { g.pending.shift(); continue; } resolvePending(g, p.choices[0].index); } checkEnding(g); };
        const sig = (g) => JSON.stringify({ m: g.month, cash: Math.round(g.cash), debt: Math.round(g.debt), rng: g.rng, moral: g.moral, rep: g.rep, fama: g.fama, ht: g.heatTrabajo, hh: g.heatHacienda, biz: g.businesses.map((q) => q.id + ':' + q.level).join(','), pend: g.pending.map((q) => q.id).join(','), end: g.ending || null });
        // `live` es una copia exacta de la partida viva (sin guardar ni cargar) y `x` la cargada: las dos viven igual.
        for (let i = 0; i < 3 && !live.ending; i++) {
          step(live); step(x);
          const ss = sig(live), sx = sig(x);
          if (ss !== sx) { fail('carga-cambia-el-futuro', `cargada en mes ${s.month}, diverge en ${live.month}: una ${ss.slice(0, 220)} · otra ${sx.slice(0, 220)}`); break; }
        }
      } catch (e) { fail('guardado-falla', `mes ${s.month}: ${e.stack.split('\n').slice(0, 2).join(' | ')}`); }
    }
    monthsPlayed++;
    if (s.month === before) break;
  }
  games++;
  endings[s.ending || 'sin_final'] = (endings[s.ending || 'sin_final'] || 0) + 1;
}

const t0 = performance.now();
for (let seed = FROM; seed < FROM + SEEDS; seed++) {
  playChaos(seed);
  if (!QUIET) process.stdout.write(`\rpartidas ${games}/${SEEDS} · meses ${monthsPlayed} · fallos ${[...failures.values()].reduce((a, x) => a + x.length, 0)}   `);
}
console.log(`\n${games} partidas, ${monthsPlayed} meses, ${actionsRun} acciones, ${cards} cartas en ${((performance.now() - t0) / 1000).toFixed(1)} s`);
console.log(`finales: ${JSON.stringify(endings)} · cierre más lento: ${maxAdvance.toFixed(1)} ms (${maxAdvanceAt})`);
if (!failures.size) { console.log('Sin fallos de invariantes.'); process.exit(0); }
for (const [k, xs] of failures) { console.log(`\n✘ ${k}`); for (const x of xs) console.log('   ' + x); }
process.exit(1);
