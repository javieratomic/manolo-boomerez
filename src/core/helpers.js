// Utilidades que mutan el estado de partida aplicando los modificadores de asesores y de dificultad.
import { difficultyOf } from './state.js';

export const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, v));

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

export function addExpediente(s, n = 1, reason = '') {
  s.expedientes += n;
  log(s, `⚖️ Se abre expediente penal${reason ? ': ' + reason : ''}. Llevas ${s.expedientes} de 3.`, 'bad');
}

export function log(s, text, tone = 'info') {
  s.log.unshift({ month: s.month, text, tone });
  if (s.log.length > 80) s.log.length = 80;
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
