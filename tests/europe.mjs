// Medida de la campaña europea (fuera de la batería de tests), en paralelo:
//   node tests/europe.mjs --seeds 32 --months 600 --only EU_goal [--workers 16]
// Para cada variante: victorias con su intervalo de confianza (Wilson, 95 %), meses hasta ganar (mediana con
// intervalo bootstrap), finales, y en qué se queda quien no gana a tiempo (países, sectores, patrimonio).
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import os from 'node:os';

const SMART = { diversify: true, smart: true, leverage: true, campaign: 'europe', scan: 120, opens: 3 };
export const EU_VARIANTS = {
  EU_smart: { ...SMART },                          // el bot de siempre, sin plan europeo
  EU_goal: { ...SMART, europe: true },             // persigue los tres requisitos
  EU_goal_delta: { ...SMART, europe: true, rank: 'delta' }, // además prioriza el mayor beneficio (plazo ≤ 36 meses)
  // Un jugador corriente: sin crédito, una apertura al mes y mirando pocas opciones.
  EU_casual: { diversify: true, smart: true, campaign: 'europe', scan: 40, opens: 1, europe: true },
  EU_goal_maison: { ...SMART, europe: true, brand: 'maison' },
  EU_goal_hacienda: { ...SMART, europe: true, difficulty: 'hacienda' },
  EU_goal_cunado: { ...SMART, europe: true, difficulty: 'cunado' },
};

async function playOne(seed, name, months) {
  const { playGame } = await import('./bot.js');
  const { europeProgress } = await import('../src/core/dynasty.js');
  const { patrimonio } = await import('../src/core/economy.js');
  const firsts = { m10: null, m100: null, m1000: null, countries8: null, sectors3: null };
  const t0 = performance.now();
  const g = playGame(seed, {
    ...EU_VARIANTS[name], months,
    onMonth: (s) => {
      const pat = patrimonio(s), p = europeProgress(s, pat);
      if (firsts.m10 == null && pat >= 1e7) firsts.m10 = s.month;
      if (firsts.m100 == null && pat >= 1e8) firsts.m100 = s.month;
      if (firsts.m1000 == null && pat >= 1e9) firsts.m1000 = s.month;
      if (firsts.countries8 == null && p.countries >= 8) firsts.countries8 = s.month;
      if (firsts.sectors3 == null && p.sectors >= 3) firsts.sectors3 = s.month;
    },
  });
  const s = g.state, p = europeProgress(s, patrimonio(s));
  return { seed, ending: g.ending, month: g.month, pat: g.patrimonio, countries: p.countries, sectors: p.sectors, gen: s.dynasty?.generation ?? 0, biz: g.businesses, ...firsts, ms: Math.round(performance.now() - t0) };
}

if (!isMainThread) {
  const { seeds, name, months } = workerData;
  for (const seed of seeds) parentPort.postMessage(await playOne(seed, name, months));
  process.exit(0);
}

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg('seeds', 32)), MONTHS = Number(arg('months', 600));
const WORKERS = Math.min(Number(arg('workers', Math.max(1, os.cpus().length - 4))), N);
const only = arg('only', 'EU_goal').split(',');
const SEEDS = Array.from({ length: N }, (_, i) => (i + 1) * 7919 + 13);

const sorted = (a) => a.filter((x) => x != null).sort((x, y) => x - y);
const med = (a) => { const b = sorted(a); return b.length ? b[Math.floor(b.length / 2)] : null; };
function wilson(k, n, z = 1.96) {
  if (!n) return [0, 0];
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), w = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [(c - w) / d, (c + w) / d];
}
function bootMedian(a, reps = 2000) {
  const b = sorted(a);
  if (b.length < 2) return [b[0] ?? null, b[0] ?? null];
  let x = 12345;
  const rnd = () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; };
  const ms = [];
  for (let r = 0; r < reps; r++) ms.push(med(Array.from(b, () => b[Math.floor(rnd() * b.length)])));
  ms.sort((p, q) => p - q);
  return [ms[Math.floor(reps * 0.025)], ms[Math.floor(reps * 0.975)]];
}
const yrs = (m) => (m == null ? '—' : `${m} (${(m / 12).toFixed(1)} a)`);

for (const name of only) {
  if (!EU_VARIANTS[name]) { console.log(`Variante desconocida: ${name}`); continue; }
  const t0 = performance.now();
  const chunks = Array.from({ length: WORKERS }, (_, w) => SEEDS.filter((_, i) => i % WORKERS === w));
  const rs = [];
  await Promise.all(chunks.map((seeds) => new Promise((ok, ko) => {
    const wk = new Worker(new URL(import.meta.url), { workerData: { seeds, name, months: MONTHS } });
    wk.on('message', (r) => rs.push(r)); wk.on('error', ko); wk.on('exit', ok);
  })));
  const won = rs.filter((r) => r.ending === 'europe');
  const [lo, hi] = wilson(won.length, rs.length);
  const wm = won.map((r) => r.month), [bl, bh] = bootMedian(wm);
  const ends = {};
  for (const r of rs) ends[r.ending || 'sin_final'] = (ends[r.ending || 'sin_final'] || 0) + 1;
  const open = rs.filter((r) => !r.ending);
  console.log(`\n${name} · ${rs.length} partidas hasta ${MONTHS} meses · ${((performance.now() - t0) / 1000).toFixed(0)} s`);
  console.log(`  victorias ${won.length}/${rs.length} (${(100 * won.length / rs.length).toFixed(0)} %, IC95 ${(100 * lo).toFixed(0)}–${(100 * hi).toFixed(0)} %) · meses hasta ganar: mediana ${yrs(med(wm))}, IC95 ${bl ?? '—'}–${bh ?? '—'}, rango ${sorted(wm)[0] ?? '—'}–${sorted(wm).at(-1) ?? '—'}`);
  console.log(`  finales ${JSON.stringify(ends)} · relevos (media) ${(rs.reduce((a, r) => a + r.gen, 0) / rs.length).toFixed(2)}`);
  console.log(`  hitos (mediana del mes en que se alcanzan, entre quienes lo alcanzan): 10 M€ ${yrs(med(rs.map((r) => r.m10)))} [${rs.filter((r) => r.m10 != null).length}] · 100 M€ ${yrs(med(rs.map((r) => r.m100)))} [${rs.filter((r) => r.m100 != null).length}] · 1.000 M€ ${yrs(med(rs.map((r) => r.m1000)))} [${rs.filter((r) => r.m1000 != null).length}] · 8 países ${yrs(med(rs.map((r) => r.countries8)))} [${rs.filter((r) => r.countries8 != null).length}] · 3 sectores ${yrs(med(rs.map((r) => r.sectors3)))} [${rs.filter((r) => r.sectors3 != null).length}]`);
  if (open.length) console.log(`  sin terminar al mes ${MONTHS}: ${open.length} · países med ${med(open.map((r) => r.countries))} · sectores med ${med(open.map((r) => r.sectors))} · patrimonio med ${(med(open.map((r) => r.pat)) / 1e6).toFixed(1)} M€ · negocios med ${med(open.map((r) => r.biz))}`);
  console.log(`  tiempo por partida: mediana ${(med(rs.map((r) => r.ms)) / 1000).toFixed(1)} s`);
}
