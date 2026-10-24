import {newDynasty} from './dynasty.js';
import {LOCAL_RULES} from '../data/localEvents.js';
import {HOUSING_FORMS} from '../data/housing.js';
import {isResidential} from './construction.js';
import {execPortrait} from '../data/execs.js';
import {PUBLIC_RENTS} from './housing.js';
import { FOREIGN_BY_ID, DEAL_MODES, DISPUTES } from '../data/international.js';
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
export const GAME_VERSION = '0.9.0';

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

export function newGame(seed = (Date.now() ^ 0x5eed) >>> 0, difficulty = 'normal', campaign = 'europe') {
  const d = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;
  return {
    version: SAVE_VERSION,
    gameVersion: GAME_VERSION,
    seed,
    rng: seed >>> 0,
    difficulty,
    campaign,
    dynasty:newDynasty(),
    foreignTrack:{},
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
    obrador: { upgrades: [], expansions: 0 },
    businesses: [],
    nextId: 1,
    trends: { smash: 1.25, empanadas: 1.0 },
    mods: [],
    flags: {},
    seen: {},
    goalsDone: [],
    notices: [],
    wageIndex: 1,
    unlocked: { sobaos: true, vivienda:true },
    cooldowns: { trabajo: 2, hacienda: 4 },
    insolvencyMonths: 0,
    zeroMoralMonths: 0,
    actionUsed: false,
    discountNext: 0,
    extraMonthly: [],
    contracts: [],
    foreignDeals: [],
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
    citySobaoSales: {},
    housingPolicies: {},
    localEvents: {},
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
  if (s.gameVersion !== GAME_VERSION) {
    s.originalGameVersion ||= s.gameVersion;
    s.gameVersion = GAME_VERSION;
  }
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
  if (s.obrador && !('expansions' in s.obrador)) s.obrador.expansions = 0;
  s.stats.liquidado ??= 0;
  s.stats.huelgas ??= 0;
  if(s.brand&&s.unlocked)s.unlocked.vivienda=true;
  if (s.businesses.some(b=>b.type==='empanadas')) s.flags.empanadaFirstUsed=true;
  for(const b of s.businesses) {
    if(b.type==='vivienda'&&!('housingForm' in b))b.housingForm='legacy';
    if(isResidential(b)&&!('renewalMonth' in b))b.renewalMonth=(b.readyMonth??s.month)+180;
  }
  s.unlocked.empanadas=!!s.flags.primoSocio;
  s.policies = { ...DEFAULT_POLICIES, ...s.policies };
  s.version = SAVE_VERSION;
  for (const person of [...Object.values(s.execs || {}), ...(Array.isArray(s.candidates) ? s.candidates : [])]) {
    if (person && typeof person.name === 'string') person.portrait = execPortrait(person.name, person.portrait);
  }
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
  if (!Number.isSafeInteger(ready.obrador.expansions) || ready.obrador.expansions < 0 || !Number.isFinite(650000 * 1.32 ** ready.obrador.expansions)) invalid();
  for (const [key, value] of Object.entries(ready.policies)) {
    if (!Object.hasOwn(POLICIES, key) || !Object.hasOwn(POLICIES[key].options, value)) invalid();
  }
  if(!['europe','classic'].includes(ready.campaign))invalid();
  for(const [city,terms] of Object.entries(ready.housingPolicies)) {
    if(!Object.hasOwn(CITY_BY_ID,city)||!terms||typeof terms!=='object'||Array.isArray(terms))invalid();
    for(const [key,value] of Object.entries(terms))if(!['employee','public'].includes(key)||!(key==='employee'?Object.hasOwn(POLICIES.alquiler.options,value):Object.hasOwn(PUBLIC_RENTS,value)))invalid();
  }
  for(const [city,units] of Object.entries(ready.citySobaoSales))if(!Object.hasOwn(CITY_BY_ID,city)||typeof units!=='number'||!Number.isFinite(units)||units<0)invalid();
  for(const [id,p] of Object.entries(ready.localEvents)) {
    if(!Object.hasOwn(LOCAL_RULES,id)||!p||typeof p!=='object'||Array.isArray(p))invalid();
    for(const k of ['visits','successes','failures','level'])if(!Number.isSafeInteger(p[k])||p[k]<0)invalid();
    for(const k of ['lastMonth','lastYear','lastSuccessYear'])if(!Number.isSafeInteger(p[k])||p[k]<-1)invalid();
    if(p.level>4||!Number.isInteger(p.standing)||Math.abs(p.standing)>10||typeof p.lastChoice!=='string'||typeof p.lastLabel!=='string'||!['acuerdo','conflicto'].includes(p.lastOutcome))invalid();
    if(p.successes+p.failures!==p.visits||p.level>p.successes||p.lastMonth>ready.month||p.lastYear!==Math.floor(p.lastMonth/12)||p.lastSuccessYear>p.lastYear||id!=='ciudad_salamanca'&&p.level!==0)invalid();
  }
  if(!Number.isInteger(ready.dynasty.generation)||ready.dynasty.generation<0||!Number.isFinite(ready.dynasty.birthMonth)||typeof ready.dynasty.name!=='string'||!Array.isArray(ready.dynasty.history))invalid();
  for(const [country,track] of Object.entries(ready.foreignTrack))if(!Object.hasOwn(FOREIGN_BY_ID,country)||!Number.isInteger(track?.successMonths)||track.successMonths<0)invalid();
  const businessIds = new Set();
  for (const business of ready.businesses) {
    if(business.type==='vivienda'&&!Object.hasOwn(HOUSING_FORMS,business.housingForm))invalid();
    if(business.readyMonth!=null&&(!Number.isSafeInteger(business.readyMonth)||business.readyMonth<0||business.readyMonth<(business.openedMonth||0)))invalid();
    if(business.renewalMonth!=null&&(!Number.isSafeInteger(business.renewalMonth)||business.renewalMonth<0||business.renewalMonth<(business.readyMonth||0)))invalid();
    if (!business || !Object.hasOwn(BUSINESS_TYPES, business.type) || !Object.hasOwn(CITY_BY_ID, business.city) ||
      !Number.isFinite(business.value) || !Number.isInteger(business.id) || businessIds.has(business.id) ||
      (business.mode != null && !['propia', 'franquicia'].includes(business.mode))) invalid();
    businessIds.add(business.id);
  }
  const countries = new Set();
  for (const deal of ready.foreignDeals) {
    if (!Object.hasOwn(FOREIGN_BY_ID,deal.market) || !Object.hasOwn(DEAL_MODES,deal.mode) || typeof deal.audit !== 'boolean' ||
      !Number.isInteger(deal.id) || businessIds.has(deal.id) || countries.has(deal.market) || !Number.isInteger(deal.months) || deal.months < 1 || deal.months > 24 ||
      !Number.isInteger(deal.shortMonths) || deal.shortMonths < 0 || (deal.dispute !== null && !Object.hasOwn(DISPUTES,deal.dispute))) invalid();
    countries.add(deal.market); businessIds.add(deal.id);
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
