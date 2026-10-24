// Directivos: candidatos, fichajes, efectos y rasgos.
import { POSITIONS, TRAITS, FIRST_NAMES, LAST_NAMES, FAMILY, EXEC_PORTRAITS, execPortrait } from '../data/execs.js';
import { chance, int, pick } from './rng.js';
import { addCash, log, money } from './helpers.js';
import { checkClause } from './clauses.js';

export const CANDIDATE_REFRESH = 6;

export const execOf = (s, pos) => s.execs?.[pos] || null;
export const execSkill = (s, pos) => execOf(s, pos)?.skill ?? 0;
export const execBonus = (s, pos) => (POSITIONS[pos]?.bonus ?? 0) * execSkill(s, pos);

export function execSalaries(s) {
  return Object.values(s.execs || {}).reduce((a, e) => a + e.salary, 0);
}

function makeCandidate(s, pos) {
  const taken = new Set([...Object.values(s.execs || {}), ...(s.candidates || [])].map((e) => e.name));
  const famPool = FAMILY.filter((f) => !taken.has(f.name) && !(s.flags.divorciado && f.note === 'tu mujer'));
  const family = famPool.length > 0 && chance(s, 0.15);
  const trait = family ? 'enchufado' : pick(s, ['leal', 'trepa', 'chivato', 'quemado', 'tiburon', 'mba', 'leal', 'trepa']);
  let skill = family ? 1 : int(s, 1, 3);
  if (trait === 'tiburon') skill = Math.min(3, skill + 1);
  let salary = family ? 1800 : 3200 + 1500 * skill;
  if (trait === 'tiburon') salary *= 1.5;
  if (trait === 'mba') salary *= 1.25;
  const fam = family ? pick(s, famPool) : null;
  const candidate = {
    id: `c${s.month}_${pos}_${int(s, 100, 999)}`,
    name: fam ? fam.name : `${pick(s, FIRST_NAMES)} ${pick(s, LAST_NAMES)}`,
    note: fam?.note || null,
    pos, skill, trait,
    salary: Math.round(salary / 50) * 50,
    portrait: pick(s, EXEC_PORTRAITS),
  };
  candidate.portrait = execPortrait(candidate.name, candidate.portrait);
  return candidate;
}

// Cada 6 meses llega una nueva hornada de currículums (uno o dos por puesto).
export function refreshCandidates(s, force = false) {
  const since = s.month - (s.candidatesMonth ?? -99);
  if (!force && since >= 0 && since < CANDIDATE_REFRESH && s.candidates?.length) return;
  s.candidates = [];
  for (const pos of Object.keys(POSITIONS)) {
    const n = chance(s, 0.5) ? 2 : 1;
    for (let i = 0; i < n; i++) s.candidates.push(makeCandidate(s, pos));
  }
  s.candidatesMonth = s.month;
}

export const signingFee = (c) => c.salary; // la headhunter cobra un mes de sueldo
export const severance = (e) => e.salary * 3;

export function hireExec(s, candidateId) {
  const c = s.candidates.find((x) => x.id === candidateId);
  if (!c) return { ok: false, msg: 'Ese candidato ya no está disponible.' };
  if (execOf(s, c.pos)) return { ok: false, msg: 'Ese puesto ya está ocupado. Despide primero a quien lo ocupa.' };
  if (s.cash < signingFee(c)) return { ok: false, msg: `La headhunter cobra ${money(signingFee(c))}.` };
  addCash(s, -signingFee(c));
  s.execs[c.pos] = { ...c, since: s.month };
  s.candidates = s.candidates.filter((x) => x !== c);
  log(s, `🤝 Fichas a ${c.name}${c.note ? ` (${c.note})` : ''} para ${POSITIONS[c.pos].label}.`, 'good');
  return { ok: true, exec: s.execs[c.pos] };
}

export function fireExec(s, pos, reason = null) {
  const e = execOf(s, pos);
  if (!e) return { ok: false, msg: 'No hay nadie en ese puesto.' };
  if (!reason) addCash(s, -severance(e));
  delete s.execs[pos];
  if (s.sucesion?.heir === 'directivo' && s.sucesion.execName === e.name) {
    s.sucesion.heir = 'nadie';
    s.sucesion.execName = null;
    log(s, `📜 ${e.name} deja de ser el heredero al salir de la empresa.`, 'info');
  }
  if (e.trait === 'enchufado' && !reason) {
    s.familia = Math.max(0, (s.familia ?? 60) - 15);
    log(s, `🍽️ Despides a ${e.name}. La próxima comida familiar va a ser muy larga (familia −15).`, 'bad');
  } else {
    log(s, reason ? `🚪 ${e.name} deja ${POSITIONS[pos].label}: ${reason}.` : `🚪 Despides a ${e.name} (${POSITIONS[pos].label}). Indemnización: ${money(severance(e))}.`, 'info');
  }
  checkClause(s);
  return { ok: true };
}

// Efectos de los rasgos: se comprueban una vez al mes.
export function tickExecs(s, laborSeverity) {
  refreshCandidates(s);
  for (const [pos, e] of Object.entries(s.execs || {})) {
    if (e.trait === 'trepa' && s.rivals?.length && chance(s, 0.05)) {
      s.pending.push({ kind: 'event', id: 'directivo_fichaje', params: { pos } });
    } else if (e.trait === 'chivato' && laborSeverity >= 2.5 && chance(s, 0.08)) {
      s.pending.push({ kind: 'event', id: 'directivo_chivato', params: { pos } });
    } else if (e.trait === 'quemado' && s.moral < 35 && chance(s, 0.1)) {
      fireExec(s, pos, 'burnout; se va a recorrer el Camino de Santiago');
    }
  }
}

export function execHeat(s) {
  return Object.values(s.execs || {}).filter((e) => e.trait === 'tiburon').length * 0.5;
}

export { POSITIONS, TRAITS };
