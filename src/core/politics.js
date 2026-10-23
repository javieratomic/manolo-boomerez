// Gobierno y elecciones: efectos sobre salarios, inspecciones, consumo, impuestos y turismo.
import { PARTIES, ELECTION_MONTHS } from '../data/politics.js';
import { random } from './rng.js';
import { log } from './helpers.js';

const NEUTRAL = { wage: 1, inspection: 1, demand: 1, tax: 1, tourism: 'normal' };

export function govFx(s) {
  return PARTIES[s.gov?.party]?.effects || NEUTRAL;
}

// En los meses de elecciones se encola la carta de campaña electoral.
export function tickPolitics(s) {
  if (ELECTION_MONTHS.includes(s.month)) s.pending.push({ kind: 'event', id: 'elecciones' });
}

// Resuelve las elecciones; `lean` (−1..1) es el empujoncito de las "donaciones" de Manolo hacia la ALE.
export function holdElection(s, lean = 0) {
  const pAle = Math.max(0.15, Math.min(0.85, 0.5 + 0.2 * lean));
  const party = random(s) < pAle ? 'ale' : 'pps';
  const prev = s.gov?.party;
  s.gov = { party, since: s.month };
  const p = PARTIES[party];
  if (p.effects.wage !== 1) s.wageIndex = (s.wageIndex || 1) * p.effects.wage;
  log(s, `🗳️ Elecciones: gana ${p.name}. ${p.summary}`, 'info');
  return { party, changed: prev !== party };
}
