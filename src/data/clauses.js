// Cláusulas del testamento de Don Anselmo: un reto opcional por partida, elegido por la semilla.
// Si al terminar (pyme, tiburón o revista) la cláusula sigue en pie y se cumple, la puntuación se
// multiplica y Manolo hereda el prado de Vega de Pas con 40 vacas pasiegas.
//  { id, title, mult, notary, rule, short(s, c) -> texto breve (≤ 40), broken(s, c), met(s, c), track?(s, c) }
import { CITY_BY_ID } from './cities.js';
import { patrimonio } from '../core/economy.js';
import { dateLabel } from '../core/helpers.js';

export const CLAUSE_PRIZE = 300000;
export const CORNISA = ['Galicia', 'Asturias', 'Cantabria', 'País Vasco', 'Navarra', 'Castilla y León'];
export const PRISA_GOAL = 5e6;
export const PRISA_MONTH = 60;
export const BOUTIQUE_MAX = 12;

// Ingresos de los últimos 12 meses por sector; el sobao junta tiendas y producción.
export function lastYearByCat(s) {
  const out = {};
  for (const h of (s.history || []).slice(-12)) {
    for (const [k, v] of Object.entries(h.cat || {})) {
      const key = k === 'produccion' ? 'sobaos' : k;
      out[key] = (out[key] || 0) + v;
    }
  }
  return out;
}

// Cuánto vende el sobao frente al sector que más vende después de él (≥ 1: el sobao va primero).
export function sobaoLead(s) {
  const cats = lastYearByCat(s);
  const rival = Math.max(0, ...Object.entries(cats).filter(([k]) => k !== 'sobaos').map(([, v]) => v));
  return rival > 0 ? (cats.sobaos || 0) / rival : 1;
}

export const CLAUSES = [
  {
    id: 'boutique',
    title: 'Pocos y bien hechos',
    mult: 1.75,
    notary: 'Que nunca tenga más de doce negocios. Los Boomerez no somos una plaga.',
    rule: `Nunca más de ${BOUTIQUE_MAX} negocios, franquicias y obradores incluidos.`,
    short: (s) => `Pocos y bien hechos · ${s.businesses.length}/${BOUTIQUE_MAX}`,
    broken: (s) => s.businesses.length > BOUTIQUE_MAX,
    met: () => true,
  },
  {
    id: 'cornisa',
    title: 'De aquí no se sale',
    mult: 2.5,
    notary: 'Que no baje de la Cornisa ni de Castilla. Más al sur hace calor y la mantequilla se derrite.',
    rule: `Todos los negocios en ${CORNISA.slice(0, -1).join(', ')} o ${CORNISA[CORNISA.length - 1]}.`,
    short: () => 'De aquí no se sale · solo el norte',
    broken: (s) => s.businesses.some((b) => !CORNISA.includes(CITY_BY_ID[b.city]?.region)),
    met: () => true,
  },
  {
    id: 'sobao_primero',
    title: 'El sobao, lo primero',
    mult: 1.5,
    notary: 'Que el sobao sea siempre lo primero. Si un día vende más hamburguesas que sobaos, que le dé vergüenza.',
    rule: 'Al acabar, el sobao tiene que ser el sector que más ingresos dio en el último año.',
    short: (s) => `El sobao, lo primero · ${sobaoLead(s) >= 1 ? 'va primero' : 'va detrás'}`,
    broken: () => false,
    met: (s) => sobaoLead(s) >= 1,
  },
  {
    id: 'prisa',
    title: 'Antes de los sesenta',
    mult: 1.25,
    notary: 'Que demuestre que vale antes de cumplir los sesenta. Cinco millones, y rapidito.',
    // Getter: helpers.js puede no estar inicializado aún cuando se carga este módulo (importaciones circulares).
    get rule() {
      return `Llegar a 5 M€ de patrimonio antes de ${dateLabel(PRISA_MONTH).toLowerCase().replace(' ', ' de ')}, cuando Manolo cumple 60.`;
    },
    short: (s, c) => (c.reached ? 'Antes de los sesenta · ¡conseguido!' : `Antes de los sesenta · ${Math.max(0, PRISA_MONTH - s.month)} meses`),
    track: (s, c) => {
      if (s.month < PRISA_MONTH && patrimonio(s) >= PRISA_GOAL) c.reached = true;
    },
    broken: (s, c) => !c.reached && s.month >= PRISA_MONTH,
    met: (s, c) => !!c.reached,
  },
  {
    id: 'sin_humo',
    title: 'Nada de vender humo',
    mult: 1.2,
    notary: 'Que no venda humo: ni franquicias, ni cursos, ni oficinas para gente con portátil.',
    rule: 'Ni franquicias, ni Academy, ni coworking (tampoco comprados con una OPA).',
    short: () => 'Nada de vender humo',
    broken: (s) => s.businesses.some((b) => b.mode === 'franquicia' || b.type === 'academy' || b.type === 'coworking'),
    met: () => true,
  },
  {
    id: 'merche',
    title: 'Cuida de Merche',
    mult: 1.1,
    notary: 'Que cuide de Merche, que bastante le aguanta.',
    rule: 'La relación con Merche nunca baja de 50 y no hay divorcio.',
    short: (s) => `Cuida de Merche · ${Math.round(s.familia ?? 60)}/50`,
    broken: (s) => (s.familia ?? 60) < 50 || !!s.flags.divorciado,
    met: () => true,
  },
  {
    id: 'sin_bancos',
    title: 'Ni un duro de los bancos',
    mult: 1.15,
    notary: 'Que no le pida un duro a los bancos. Los Boomerez pagamos al contado.',
    rule: 'No pedir nunca un préstamo y acabar sin deuda con nadie (tampoco con tu madre). La póliza automática por un descubierto no cuenta, pero hay que devolverla.',
    short: (s) => `Ni un duro de los bancos${s.debt > 0 || (s.cartilla?.owed || 0) > 0 ? ' · debes' : ''}`,
    broken: (s) => !!s.flags.prestamoPedido,
    met: (s) => s.debt <= 0 && (s.cartilla?.owed || 0) <= 0,
  },
];

export const CLAUSE_BY_ID = Object.fromEntries(CLAUSES.map((c) => [c.id, c]));

// Elección determinista sin tocar el generador de la partida (bits altos de un hash de la semilla).
export const clauseForSeed = (seed) => CLAUSES[Math.floor(((Math.imul(seed >>> 0, 2654435761) >>> 0) / 2 ** 32) * CLAUSES.length)].id;
