// Logros persistentes en este navegador (entre partidas).
import { ACHIEVEMENTS } from '../data/achievements.js';

const KEY = 'manolo-boomerez-logros';
let unlocked = load();

function load() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify([...unlocked]));
  } catch {
    /* sin almacenamiento: los logros solo duran esta sesión */
  }
}

export const isUnlocked = (id) => unlocked.has(id);
export const unlockedCount = () => ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length;

// Devuelve los logros conseguidos ahora mismo (para avisar).
export function checkAchievements(s) {
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (unlocked.has(a.id)) continue;
    try {
      if (a.test(s)) {
        unlocked.add(a.id);
        fresh.push(a);
      }
    } catch {
      /* un logro mal definido no debe romper la partida */
    }
  }
  if (fresh.length) save();
  return fresh;
}
