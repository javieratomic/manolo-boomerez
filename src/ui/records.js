// Salón de la fama: las mejores partidas en este navegador.
const KEY = 'manolo-boomerez-records';
const MAX = 10;

export function loadRecords() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addRecord(rec) {
  const list = [...loadRecords(), rec].sort((a, b) => b.score - a.score).slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* sin almacenamiento: el récord no se guarda */
  }
  return list.indexOf(rec);
}
