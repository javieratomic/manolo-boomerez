// Refranero de Doña Remedios: los refranes que has visto en la cartilla, guardados entre partidas.
import { REFRAN_COUNT } from '../data/refranes.js';

const KEY = 'manolo-boomerez-refranero';

export function loadRefranero() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// Apunta los refranes nuevos y devuelve cuántos llevas.
export function collectRefranes(list) {
  const known = new Set(loadRefranero());
  const before = known.size;
  for (const r of list) if (r) known.add(r);
  if (known.size !== before) {
    try {
      localStorage.setItem(KEY, JSON.stringify([...known]));
    } catch {
      /* sin almacenamiento: se cuenta igual en esta sesión */
    }
  }
  return known.size;
}

export { REFRAN_COUNT };
