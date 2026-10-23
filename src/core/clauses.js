// Seguimiento de la cláusula del testamento: se rompe (para siempre) o se cumple al terminar la partida.
import { CLAUSE_BY_ID, CLAUSE_PRIZE } from '../data/clauses.js';
import { addCash, log, money } from './helpers.js';

export const clauseOf = (s) => (s.clausula ? CLAUSE_BY_ID[s.clausula.id] : null);
export const clauseActive = (s) => !!s.clausula && !s.clausula.broken && !s.clausula.done && !s.clausula.closed;

// Corre tras cada apertura, suceso, acción y cierre de mes (desde checkUnlocks).
export function checkClause(s) {
  if (!clauseActive(s)) return;
  const c = s.clausula;
  const def = CLAUSE_BY_ID[c.id];
  def.track?.(s, c);
  if (def.broken(s, c)) {
    c.broken = true;
    c.brokenMonth = s.month;
    log(s, `📜 Has roto la cláusula «${def.title}». El prado de Vega de Pas y las 40 vacas pasiegas, para la Cofradía del Sobao Pasiego.`, 'bad');
  }
}

// ¿Esto rompería la cláusula? Se prueba sobre una copia; devuelve el aviso o null.
export function clauseWarn(s, mutate) {
  if (!clauseActive(s)) return null;
  const c = JSON.parse(JSON.stringify(s));
  mutate(c);
  checkClause(c);
  if (!c.clausula.broken) return null;
  const def = CLAUSE_BY_ID[s.clausula.id];
  return `Esto rompe la cláusula del testamento «${def.title}»: ${def.rule}\n\nPerderías el premio (puntuación ×${String(def.mult).replace('.', ',')} y el prado con las vacas).`;
}

// Al terminar con pyme, tiburón o revista: si sigue en pie y se cumple, premio (una sola vez).
export function settleClause(s) {
  if (!clauseActive(s)) return false;
  checkClause(s);
  const c = s.clausula;
  if (c.broken || !CLAUSE_BY_ID[c.id].met(s, c)) return false;
  c.done = true;
  c.doneMonth = s.month;
  addCash(s, CLAUSE_PRIZE);
  log(s, `📜 Cláusula cumplida: «${CLAUSE_BY_ID[c.id].title}». Heredas el prado de Vega de Pas y 40 vacas pasiegas (${money(CLAUSE_PRIZE)}).`, 'good');
  return true;
}

export const clauseMult = (s) => (s.clausula?.done ? CLAUSE_BY_ID[s.clausula.id].mult : 1);

export function clauseStatus(s) {
  const def = clauseOf(s);
  if (!def) return null;
  const c = s.clausula;
  return { def, state: c.done ? 'cumplida' : c.broken ? 'rota' : c.closed ? 'cerrada' : 'vigente', short: def.short(s, c) };
}
