// ¿Merece ventana el resultado de una carta? Los menores (texto corto y poco efecto) van a un toast y al
// registro; lo serio (inspecciones, auditorías, huelgas, la cartilla...) siempre se enseña. Función pura.
import { saleValue } from './actions.js';
import { BUSINESS_TYPES } from '../data/businesses.js';
import { money } from './helpers.js';
export const MINOR_TEXT = 140;
export const MINOR_STAT = 5;
const STATS = ['rep', 'moral', 'fama', 'heatTrabajo', 'heatHacienda', 'agravio', 'familia', 'estres'];
const ALWAYS = new Set(['inspeccion_trabajo', 'auditoria_hacienda', 'sanidad', 'huelga', 'huelga_general', 'junta_accionistas', 'informe_bajista', 'convenio_anual', 'comite_nace']);
const ALWAYS_PREFIX = /^(cartilla_|remedios_|velas_|intro_)/;

export function resultSnapshot(s) {
  const o = { cash: s.cash, pending: s.pending.length, expedientes: s.expedientes || 0, extra: (s.extraMonthly || []).length, mods: (s.mods || []).length, contracts: (s.contracts || []).length, ending: s.ending || null };
  for (const k of STATS) o[k] = s[k] ?? 0;
  return o;
}

// Caja: menos de max(2.000 €, 2 % de la caja); indicadores: menos de 5; sin carta ni expediente nuevos.
export function isMinorResult(id, text, before, after) {
  if (ALWAYS.has(id) || ALWAYS_PREFIX.test(id)) return false;
  if (!text || text.length > MINOR_TEXT) return false;
  if (Math.abs(after.cash - before.cash) >= Math.max(2000, Math.abs(before.cash) * 0.02)) return false;
  if (STATS.some((k) => Math.abs(after[k] - before[k]) >= MINOR_STAT)) return false;
  // Un modificador o un contrato nuevo dura meses: eso no es un resultado menor.
  return after.pending <= before.pending - 1 && after.expedientes === before.expedientes && after.extra === before.extra && (after.mods ?? 0) === (before.mods ?? 0) && (after.contracts ?? 0) === (before.contracts ?? 0) && after.ending === before.ending;
}

// La primera vez que se resuelve una carta, su resultado sale en el diálogo. `s.seen` no sirve: se anota al
// encolar la carta. `s.resultShown` (opcional; falta en partidas antiguas) se anota al resolverla.
export function firstResult(s, id) {
  return !s.resultShown?.[id];
}

export function noteResult(s, id) {
  if (!s.resultShown || typeof s.resultShown !== 'object' || Array.isArray(s.resultShown)) s.resultShown = {};
  s.resultShown[id] = true;
}

// Aviso de «no hizo su acción del mes»: en los tres primeros cierres y luego uno de cada seis.
export function idleReminder(month) {
  const n = month + 1; // número de cierre: el mes 0 es el primero
  return n <= 3 || n % 6 === 0;
}

// Confirmación de vender o rescindir con la cifra que aplica sellBusiness. `ok: false` si no hay caja.
export function sellPrompt(s, b) {
  const t = BUSINESS_TYPES[b.type];
  const value = saleValue(b);
  if (b.mode !== 'franquicia') return { ok: true, title: `Vender ${t.name}`, text: `Te dan ${money(value)}. El mercado de segunda mano es cruel.` };
  if (value < 0 && s.cash < -value) return { ok: false, title: 'Rescindir la franquicia', text: `Rescindir cuesta ${money(-value)} de indemnización (le devuelves el canon) y tienes ${money(s.cash)} en caja.` };
  return { ok: true, title: 'Rescindir la franquicia', text: `Le devuelves el canon: pagas ${money(-value)} de indemnización. Dejarás de cobrar royalties y de venderle sobaos.` };
}
