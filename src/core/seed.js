// Semillas que se pueden compartir: el mismo código da la misma partida (y la misma cláusula del
// testamento) mientras no cambie la versión del juego. El reto de la semana sale de la fecha.
export const MAX_SEED = 0xffffffff;

export const seedCode = (seed) => (seed >>> 0).toString(36).toUpperCase();

// Código escrito por el jugador → semilla, o null si no vale (vacío, caracteres raros o fuera de rango).
export function parseSeed(text) {
  const t = String(text ?? '').trim().toUpperCase();
  if (!/^[0-9A-Z]{1,7}$/.test(t)) return null;
  const n = parseInt(t, 36);
  return n <= MAX_SEED ? n : null;
}

// Semana ISO 8601 de una fecha local, p. ej. «2026-W43». El 1 de enero de 2027 aún es 2026-W53.
export function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day); // el jueves de esa semana decide el año
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// FNV-1a de 32 bits: misma clave, misma semilla en cualquier dispositivo.
export function weekSeed(key) {
  let h = 0x811c9dc5;
  for (const ch of key) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
