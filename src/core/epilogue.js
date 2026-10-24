// Epílogo, crónica y carta de Manolo: funciones puras que leen lo que ha pasado en la partida.
import { EPILOGUE, HITOS, ARC_HITOS, CARTA } from '../data/epilogues.js';
import { EVENTS } from '../data/events.js';
import { dateLabel } from './helpers.js';

export const MAX_VISIBLE = 6;

// Protagonismo de un personaje: cartas vistas con su retrato.
function weightOf(s, portrait) {
  const seen = s.seen || {};
  return EVENTS.filter((e) => e.portrait === portrait && seen[e.id] != null).length;
}

// Una línea por personaje (la primera que se cumple), ordenados por protagonismo; los fijos van siempre.
export function epilogue(s) {
  const out = EPILOGUE.map((c) => {
    const line = c.lines.find((l) => !l.when || l.when(s));
    const text = typeof line.text === 'function' ? line.text(s) : line.text;
    return { who: c.who, name: c.name, portrait: c.portrait, text, always: !!c.always, weight: weightOf(s, c.portrait) + (c.always ? 1000 : 0) };
  });
  return out.sort((a, b) => b.weight - a.weight);
}

// Hitos de la partida más los finales de los arcos, con su peso.
export function allHitos(s) {
  const list = (s.hitos || []).filter((h) => HITOS[h.id]).map((h) => ({ id: h.id, m: h.m, label: HITOS[h.id].label, peso: HITOS[h.id].peso }));
  for (const [arc, def] of Object.entries(ARC_HITOS)) {
    const v = s.flags?.[def.flag];
    if (!v || !def.label[v]) continue;
    const m = s.flags[def.monthFlag] ?? s.flags[`${arc}Month`] ?? s.month;
    // El convenio del arco y el hito «convenio» son lo mismo: una sola entrada, con el nombre del arco.
    const dup = arc === 'comite' && ['firmado', 'cedido'].includes(v) && list.find((h) => h.id === 'convenio' && Math.abs(h.m - m) <= 1);
    if (dup) dup.label = def.label[v];
    else list.push({ id: `${arc}:${v}`, m, label: def.label[v], peso: def.peso });
  }
  return list;
}

// Crónica: los 5 hitos de más peso (a igualdad, los primeros), contados en orden.
export function cronica(s, n = 5) {
  return allHitos(s)
    .sort((a, b) => b.peso - a.peso || a.m - b.m)
    .slice(0, n)
    .sort((a, b) => a.m - b.m)
    .map((h) => ({ ...h, date: dateLabel(h.m) }));
}

// La carta de Manolo a quien venga detrás: tres fragmentos de sus hitos de más peso.
export function carta(s) {
  const frags = allHitos(s)
    .filter((h) => CARTA.frag[h.id])
    .sort((a, b) => b.peso - a.peso || a.m - b.m)
    .slice(0, 3)
    .map((h) => CARTA.frag[h.id]);
  if (!frags.length) frags.push('No me pasó nada digno de contar, y eso, en esta familia, ya es mucho.');
  return [CARTA.intro, ...frags, CARTA.outro];
}
