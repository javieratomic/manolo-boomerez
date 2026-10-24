// Utilidades que mutan el estado de partida aplicando los modificadores de asesores y de dificultad.
import { difficultyOf } from './state.js';

let clampOff = false;
export const clamp = (v, min = 0, max = 100) => (clampOff ? v : Math.max(min, Math.min(max, v)));

// Solo para las previsiones: ejecuta fn sin los topes de 0 a 100, para medir cuánto empuja cada cosa.
export function unclamped(fn) {
  clampOff = true;
  try {
    return fn();
  } finally {
    clampOff = false;
  }
}

export function addCash(s, amount) {
  s.cash += amount;
}

export function addRep(s, d) {
  if (d < 0 && s.perks.comunicacion) d *= 0.6;
  s.rep = clamp(s.rep + d);
}

export function addMoral(s, d) {
  s.moral = clamp(s.moral + d);
}

export function addFama(s, d) {
  s.fama = clamp(s.fama + d);
}

const heatMult = (s) => difficultyOf(s).heat;

export function addHeatTrabajo(s, d) {
  if (d > 0) d *= heatMult(s);
  s.heatTrabajo = clamp(s.heatTrabajo + d);
}

export function addHeatHacienda(s, d) {
  if (d > 0) d *= heatMult(s);
  if (d > 0 && s.perks.gestor) d *= 0.65;
  s.heatHacienda = clamp(s.heatHacienda + d);
}

// Hitos de la partida (para la crónica, la carta y el epílogo): se apuntan una sola vez, con su mes.
export function hito(s, id) {
  s.hitos ||= [];
  if (!s.hitos.some((h) => h.id === id)) s.hitos.push({ id, m: s.month });
}

export function addExpediente(s, n = 1, reason = '') {
  s.expedientes += n;
  hito(s, 'expediente');
  if (s.cartilla) s.cartilla.confianza = Math.max(0, s.cartilla.confianza - 15 * n); // «un hijo mío en los papeles»
  log(s, `⚖️ Se abre expediente penal${reason ? ': ' + reason : ''}. Llevas ${s.expedientes} de 3.`, 'bad');
}

export function log(s, text, tone = 'info') {
  s.log.unshift({ month: s.month, text, tone });
  if (s.log.length > 80) s.log.length = 80;
}

// Costumbres: lo que Manolo eligió las otras veces en los sucesos con memoria (Navidad, agosto...).
export const custom = (s, id) => s.customs?.[id] || { count: 0, streak: 0, last: null, counts: {} };

export function remember(s, id, key) {
  s.customs ||= {};
  const c = { counts: {}, ...custom(s, id) };
  c.streak = c.last === key ? c.streak + 1 : 1;
  c.last = key;
  c.count++;
  c.counts = { ...c.counts, [key]: (c.counts[key] || 0) + 1 };
  c.month = s.month;
  s.customs[id] = c;
}

export function addMod(s, mod) {
  // mod: { kind, months, factor, category?, label }
  s.mods.push({ ...mod });
}

export function addMonthlyCost(s, label, amount, months = null) {
  s.extraMonthly.push({ label, amount, months });
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const START_YEAR = 2026;
export const GAME_MONTHS = 96;

export function monthName(m) {
  return MONTHS[((m % 12) + 12) % 12];
}

export function dateLabel(m) {
  return `${monthName(m)} ${START_YEAR + Math.floor(m / 12)}`;
}

const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export function money(n) {
  return eur.format(Math.round(n));
}

export function moneyShort(n) {
  const a = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (a >= 1e6) return `${sign}${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace('.', ',')} M€`;
  if (a >= 1e4) return `${sign}${Math.round(a / 1000)} k€`;
  return `${sign}${Math.round(a).toLocaleString('es-ES')} €`;
}
