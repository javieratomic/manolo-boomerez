import { DEFAULT_POLICIES } from '../data/policies.js';

export const SAVE_KEY = 'manolo-boomerez-save-v1';
export const SAVE_VERSION = 1;

export const DIFFICULTIES = {
  cunado: {
    label: 'Modo cuñado (fácil)',
    desc: 'Más herencia (150.000 €), más crédito y una Inspección que mira hacia otro lado.',
    cash: 150000, credit: 100000, heat: 0.7, fines: 0.7, interest: 0.0045,
  },
  normal: {
    label: 'Emprendedor (normal)',
    desc: 'La experiencia Boomerez tal y como la concibió su padre.',
    cash: 80000, credit: 0, heat: 1, fines: 1, interest: 0.0055,
  },
  hacienda: {
    label: 'Modo Hacienda (difícil)',
    desc: '50.000 € de herencia, intereses altos y unos inspectores con mucho café en el cuerpo.',
    cash: 50000, credit: -50000, heat: 1.3, fines: 1.3, interest: 0.0075,
  },
};

export const difficultyOf = (s) => DIFFICULTIES[s.difficulty] || DIFFICULTIES.normal;

export function newGame(seed = (Date.now() ^ 0x5eed) >>> 0, difficulty = 'normal') {
  const d = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;
  return {
    version: SAVE_VERSION,
    seed,
    rng: seed >>> 0,
    difficulty,
    month: 0,
    brand: null,
    cash: d.cash,
    debt: 0,
    creditBonus: d.credit,
    rep: 55,
    moral: 60,
    fama: 5,
    heatTrabajo: 5,
    heatHacienda: 5,
    expedientes: 0,
    evaded: 0,
    policies: { ...DEFAULT_POLICIES },
    perks: { gestor: false, abogado: false, comunicacion: false, andorra: false },
    andorraPaid: false,
    obrador: { upgrades: [] },
    businesses: [],
    nextId: 1,
    trends: { smash: 1.25, empanadas: 1.0 },
    mods: [],
    flags: {},
    seen: {},
    goalIndex: 0,
    notices: [],
    wageIndex: 1,
    unlocked: { sobaos: true },
    cooldowns: { trabajo: 2, hacienda: 4 },
    insolvencyMonths: 0,
    zeroMoralMonths: 0,
    actionUsed: false,
    discountNext: 0,
    extraMonthly: [],
    contracts: [],
    pending: [{ kind: 'event', id: 'intro_herencia' }],
    log: [],
    history: [],
    lastReport: null,
    ending: null,
    stats: { inspecciones: 0, auditorias: 0, multas: 0, maxPatrimonio: 0, abiertos: 0 },
    quote: null,
  };
}

export function serialize(state) {
  return JSON.stringify(state);
}

export function deserialize(text) {
  const s = JSON.parse(text);
  if (!s || s.version !== SAVE_VERSION) throw new Error('Partida incompatible');
  return s;
}

export function saveToStorage(state) {
  try {
    localStorage.setItem(SAVE_KEY, serialize(state));
    return true;
  } catch {
    return false;
  }
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? deserialize(raw) : null;
  } catch {
    return null;
  }
}

export function clearStorage() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* sin almacenamiento: nada que borrar */
  }
}
