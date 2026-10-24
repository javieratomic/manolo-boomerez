// Barrida de equilibrado (fuera de la batería de tests): node tests/balance.mjs --seeds 16 --only E_legal,M_mg_mix
// Juega cada variante en modo infinito hasta el mes 96 y resume patrimonio, revista, moral, multas y huelgas.
import { playGame, from } from './bot.js';

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const N = Number(arg('seeds', 16));
const only = arg('only', null)?.split(',');
const SEEDS = Array.from({ length: N }, (_, i) => (i + 1) * 7919 + 13);

const SMART = { diversify: true, smart: true, leverage: true };
const MG = { salario: 'minimo', horas: 'gratis' };
const NEG = { salario: 'negro', horas: 'gratis', becarios: 'algunos' };
const key = (p, k) => p.choices.find((c) => c.key === k)?.index ?? null;
const isLegal = (s) => s.policies.salario === 'convenio' && s.policies.horas === 'pagadas' && s.policies.becarios === 'ninguno';

// Cómo resuelve el bot la revisión del convenio y la huelga general (cartas de la 0.4).
function chooser(cv = 'first', hg = 'first') {
  return (s, p) => {
    const id = p.pending.id;
    if (id === 'convenio_anual') {
      if (cv === 'congelar') return key(p, 'congelar');
      if (cv === 'mixto') {
        const d = p.pending.params?.d ?? 0;
        if (isLegal(s) && d <= 0.03) return key(p, 'firmar');
        if (s.cash > (s.lastReport?.employees ?? 10) * 400 * 3) return key(p, 'paga');
        return key(p, 'prometer') ?? key(p, 'congelar');
      }
    }
    if (id === 'huelga_general' && hg === 'aguantar') return key(p, 'aguantar');
    return null;
  };
}
const withComite = (opt) => (s) => (s.comite ? opt : 'ninguno');

export const VARIANTS = {
  B_basic: {},
  D_legal: { diversify: true },
  R_random: { diversify: true, choice: 'random' },
  H_hacienda: { diversify: true, leverage: true, difficulty: 'hacienda' },
  E_legal: { ...SMART },
  E_legal_cong: { ...SMART, choose: chooser('congelar', 'aguantar') },
  E_mg: { ...SMART, policyAt: from(24, MG) },
  E_mg_mix: { ...SMART, policyAt: from(24, MG), choose: chooser('mixto') },
  E_ctl_mix: { ...SMART, policyAt: from(24, MG), control: { hi: 15, lo: 5 }, choose: chooser('mixto') },
  E_neg_mix: { ...SMART, policyAt: from(24, NEG), choose: chooser('mixto') },
  E_rep_paga: { ...SMART, choose: chooser('mixto'), reparto: withComite('paga') },
  M_legal: { ...SMART, brand: 'maison' },
  M_legal_cong: { ...SMART, brand: 'maison', choose: chooser('congelar', 'aguantar') },
  M_mg_mix: { ...SMART, brand: 'maison', policyAt: from(24, MG), choose: chooser('mixto') },
  M_ctl_mix: { ...SMART, brand: 'maison', policyAt: from(24, MG), control: { hi: 15, lo: 5 }, choose: chooser('mixto') },
  M_rep_paga: { ...SMART, brand: 'maison', choose: chooser('mixto'), reparto: withComite('paga') },
  M_rep_part: { ...SMART, brand: 'maison', choose: chooser('mixto'), reparto: withComite('participacion') },
};

const med = (a) => {
  const b = a.filter((x) => x != null).sort((x, y) => x - y);
  return b.length ? b[Math.floor(b.length / 2)] : null;
};
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const M = (x) => (x == null ? '—' : (x / 1e6).toFixed(1));

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('balance.mjs')) {
  for (const [name, v] of Object.entries(VARIANTS)) {
    if (only && !only.includes(name)) continue;
    const rs = SEEDS.map((seed) => {
      let p60 = null;
      const g = playGame(seed, { ...v, endless: true, trace: true, onMonth: (s) => { if (s.month === 60) p60 = null; } });
      const late = g.mon.filter((x) => x.m > 24);
      p60 = g.mon.find((x) => x.m === 60)?.pat ?? g.patrimonio;
      return {
        p60, p96: g.patrimonio, ff: g.firstForbes, end: g.ending,
        m95: late.filter((x) => x.moral >= 95).length / Math.max(1, late.length),
        multas: g.multas, liq: g.liquidado, insp: g.inspecciones, agr: mean(late.map((x) => x.agravio)),
        hg: g.mon.reduce((a, x) => a + x.evs.filter((e) => e === 'huelga_general').length, 0),
      };
    });
    const ends = {};
    for (const r of rs) if (r.end) ends[r.end] = (ends[r.end] || 0) + 1;
    console.log(`${name.padEnd(13)} p60 ${M(med(rs.map((r) => r.p60)))} | p96 med ${M(med(rs.map((r) => r.p96)))} media ${M(mean(rs.map((r) => r.p96)))} | revista ${rs.filter((r) => r.ff).length}/${N} mes ${med(rs.map((r) => r.ff)) ?? '—'} | ${JSON.stringify(ends)} | moral≥95 ${mean(rs.map((r) => r.m95)).toFixed(2)} | multas ${M(mean(rs.map((r) => r.multas)))} liq ${M(mean(rs.map((r) => r.liq)))} insp ${mean(rs.map((r) => r.insp)).toFixed(1)} | agravio ${mean(rs.map((r) => r.agr)).toFixed(0)} huelgas ${mean(rs.map((r) => r.hg)).toFixed(1)}`);
  }
}
