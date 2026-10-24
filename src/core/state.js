import { DEFAULT_POLICIES, POLICIES } from '../data/policies.js';
import { BUSINESS_TYPES } from '../data/businesses.js';
import { CITY_BY_ID } from '../data/cities.js';
import { EVENT_BY_ID } from '../data/events.js';
import { clauseForSeed } from '../data/clauses.js';
import { newCartilla } from './cartilla.js';
import { grossPatrimonio, computeEconomy } from './economy.js';

export const SAVE_KEY = 'manolo-boomerez-save-v1';
export const SAVE_VERSION = 2;
// Versión del contenido: una semilla solo reproduce la misma partida con la misma versión.
export const GAME_VERSION = '0.4.0';

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
    gameVersion: GAME_VERSION,
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
    perks: { gestor: false, abogado: false, comunicacion: false, fundacion: false, andorra: false },
    andorraPaid: false,
    obrador: { upgrades: [] },
    businesses: [],
    nextId: 1,
    trends: { smash: 1.25, empanadas: 1.0 },
    mods: [],
    flags: {},
    seen: {},
    goalsDone: [],
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
    stats: { inspecciones: 0, auditorias: 0, multas: 0, maxPatrimonio: 0, abiertos: 0, liquidado: 0, huelgas: 0 },
    quote: null,
    // --- v2: profundidad ---
    macro: { phase: 'expansion', months: 0, length: 20 },
    rivals: [],
    campaigns: [],
    products: [],
    rd: null,
    execs: {},
    candidates: [],
    candidatesMonth: -99,
    lujo: [],
    familia: 60,
    estres: 20,
    restMonths: 0,
    ipo: null,
    gov: null,
    dossier: { trucos: {}, sanciones: [], historial: [], ahorro: [] },
    agravio: 0,
    plantilla: { ratio: 0 },
    comite: null,
    cartilla: newCartilla(difficulty),
    hitos: [],
    sucesion: { heir: null, execName: null, clausula: null, m: null },
    customs: {},
    clausula: { id: clauseForSeed(seed), broken: false, done: false },
  };
}

// Rellena con valores por defecto lo que falte en partidas de versiones anteriores.
// Orden de los objetivos en las partidas que aún los guardaban por posición (goalIndex).
export const LEGACY_GOAL_ORDER = ['primera_tienda', 'tres_tiendas', 'mejora_obrador', 'diversificar', 'millon', 'cincuenta', 'tres_millones', 'tiburon', 'forbes'];

export function migrate(s) {
  if (!Array.isArray(s.goalsDone)) s.goalsDone = LEGACY_GOAL_ORDER.slice(0, s.goalIndex ?? 0);
  delete s.goalIndex;
  // Las partidas empezadas sin cláusula no heredan una a mitad.
  if (!('clausula' in s)) s.clausula = null;
  if (!('gameVersion' in s)) s.gameVersion = '0.2';
  const d = newGame(s.seed, s.difficulty || 'normal');
  for (const [k, v] of Object.entries(d)) if (!(k in s)) s[k] = v;
  // En modo infinito la partida ya terminó: una cláusula sin cumplir queda cerrada.
  if (s.endless && s.clausula && !s.clausula.done && !s.clausula.broken) s.clausula.closed = true;
  if (s.lastReport && s.lastReport.debt == null) s.lastReport.debt = s.debt;
  // 0.4: la valoración bursátil mezcla libros y beneficio; las salidas a Bolsa antiguas se reescalan una vez.
  if (s.ipo && !s.ipo.blend) {
    const E = grossPatrimonio(s);
    const P = (s.history || []).slice(-12).reduce((a, h) => a + h.net, 0);
    const oldV = Math.max(E, 6 * P);
    const newV = Math.max(E, 0.5 * E + 3 * P);
    if (oldV > 0 && newV > 0) s.ipo.valuation *= newV / oldV;
    s.ipo.blend = true;
  }
  for (const x of s.extraMonthly || []) if (x.label === 'Aplazamiento con la Seguridad Social') x.ss = true;
  // 0.4: claves anidadas que el bucle de abajo no rellena.
  if (s.dossier) s.dossier.ahorro ||= [];
  if (s.flags?.bancoNo === true) delete s.flags.bancoNo; // antes era para siempre
  s.stats.liquidado ??= 0;
  s.stats.huelgas ??= 0;
  s.policies = { ...DEFAULT_POLICIES, ...s.policies };
  s.version = SAVE_VERSION;
  return s;
}

export function serialize(state) {
  return JSON.stringify(state);
}

export function deserialize(text) {
  const s = JSON.parse(text);
  if (!s || typeof s !== 'object' || !Number.isInteger(s.version) || !(s.version >= 1 && s.version <= SAVE_VERSION) || !Array.isArray(s.businesses)) {
    throw new Error('Partida incompatible');
  }
  const ready = migrate(s);
  // Un JSON válido todavía puede contener una partida rota. Se valida antes de que la interfaz
  // sustituya la partida abierta o escriba el guardado automático.
  const defaults = newGame(ready.seed, ready.difficulty);
  const invalid = () => { throw new Error('Partida incompatible'); };
  const checkShape = (actual, template) => {
    for (const [key, value] of Object.entries(template)) {
      if (typeof value === 'number' && !Number.isFinite(actual[key])) invalid();
      if (Array.isArray(value) && !Array.isArray(actual[key])) invalid();
      if (value && typeof value === 'object' && !Array.isArray(value) && key !== 'clausula') {
        if (!actual[key] || typeof actual[key] !== 'object' || Array.isArray(actual[key])) invalid();
        checkShape(actual[key], value);
      }
    }
  };
  checkShape(ready, defaults);
  const checkData = (value) => {
    if (typeof value === 'number' && !Number.isFinite(value)) invalid();
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item == null) invalid();
        checkData(item);
      }
    } else if (value && typeof value === 'object') {
      for (const child of Object.values(value)) checkData(child);
    }
  };
  checkData(ready);
  if (!Number.isInteger(ready.month) || ready.month < 0) invalid();
  for (const [key, value] of Object.entries(ready.policies)) {
    if (!Object.hasOwn(POLICIES, key) || !Object.hasOwn(POLICIES[key].options, value)) invalid();
  }
  const businessIds = new Set();
  for (const business of ready.businesses) {
    if (!business || !Object.hasOwn(BUSINESS_TYPES, business.type) || !Object.hasOwn(CITY_BY_ID, business.city) ||
      !Number.isFinite(business.value) || !Number.isInteger(business.id) || businessIds.has(business.id) ||
      (business.mode != null && !['propia', 'franquicia'].includes(business.mode))) invalid();
    businessIds.add(business.id);
  }
  for (const pending of ready.pending) {
    if (!pending || !Object.hasOwn(EVENT_BY_ID, pending.id)) invalid();
  }
  // También comprueba las estructuras variables (modificadores, directivos, contratos...) que
  // intervienen en las cuentas, sin avanzar el mes ni cambiar el estado del azar.
  if (!Number.isFinite(computeEconomy(ready).net)) invalid();
  return ready;
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
