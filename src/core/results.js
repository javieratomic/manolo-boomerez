// ¿Merece ventana el resultado de una carta? Los menores (texto corto y poco efecto) van a un toast y al
// registro; lo serio (inspecciones, auditorías, huelgas, la cartilla...) siempre se enseña. Función pura.
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
