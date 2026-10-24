// Objetivos en tres carriles (negocio, equipo y dinero): guían al jugador y dan pequeñas recompensas.
// Cada carril avanza por su cuenta; el orden de la lista decide cuál se enseña primero.
// progress(s) → [ahora, meta], opcional, para la barra del recuadro.
import { BUSINESS_TYPES } from './businesses.js';
import { patrimonio } from '../core/economy.js';
import { addCash, addFama, addRep } from '../core/helpers.js';

const outlets = (s) => s.businesses.filter((b) => BUSINESS_TYPES[b.type].category === 'sobaos').length;
// Sectores con ingresos el último mes (la producción cuenta como sobaos).
const sectors = (s) => Object.entries(s.lastReport?.revenueByCat || {}).filter(([k, v]) => k !== 'produccion' && v > 0).length;
// Algún año natural (enero-diciembre) cerrado entero con beneficio.
function greenYear(s) {
  const byYear = {};
  for (const h of s.history || []) (byYear[Math.floor(h.month / 12)] ||= []).push(h.net);
  return Object.values(byYear).some((l) => l.length === 12 && l.reduce((a, b) => a + b, 0) > 0);
}

export const LANES = [
  { id: 'negocio', emoji: '🏪', label: 'Negocio' },
  { id: 'equipo', emoji: '👥', label: 'Equipo' },
  { id: 'dinero', emoji: '💶', label: 'Dinero' },
];

export const GOALS = [
  {
    id: 'primera_tienda',
    lane: 'negocio',
    progress: (s) => [Math.min(1, outlets(s)), 1],
    text: 'Abre tu primera tienda de sobaos (pincha en una ciudad grande del mapa).',
    test: (s) => outlets(s) >= 1,
    reward(s) {
      addFama(s, 3);
      return 'Tu madre comparte la inauguración en todas sus redes sociales. Fama +3.';
    },
  },
  {
    id: 'tres_tiendas',
    lane: 'negocio',
    progress: (s) => [Math.min(3, outlets(s)), 3],
    text: 'Llega a 3 tiendas de sobaos, propias o franquiciadas.',
    test: (s) => outlets(s) >= 3,
    reward(s) {
      addCash(s, 10000);
      return 'Te conceden una subvención autonómica "al emprendimiento rural" de 10.000 €. Tú, que estás en contra de las subvenciones.';
    },
  },
  {
    id: 'mejora_obrador',
    lane: 'negocio',
    text: 'Mejora el obrador de Selaya para producir más.',
    test: (s) => s.obrador.upgrades.length >= 1,
    reward(s) {
      addRep(s, 3);
      return 'El periódico regional titula "El obrador Boomerez crece". Reputación +3.';
    },
  },
  {
    id: 'directivo',
    lane: 'equipo',
    text: 'Ficha a tu primer directivo (pestaña Plantilla → Equipo directivo).',
    test: (s) => Object.keys(s.execs || {}).length >= 1,
    reward(s) {
      addFama(s, 2);
      return 'Ya puedes decir "mi equipo" en las reuniones. Fama +2.';
    },
  },
  {
    id: 'primer_beneficio',
    lane: 'dinero',
    text: 'Cierra un mes con beneficio.',
    test: (s) => (s.lastReport?.net ?? 0) > 0,
    reward() {
      return 'Paco te enseña la cuenta de resultados en verde. Te la quieres enmarcar.';
    },
  },
  {
    id: 'diversificar',
    lane: 'negocio',
    text: 'Diversifica: abre un negocio que no sea de sobaos.',
    test: (s) => s.businesses.some((b) => BUSINESS_TYPES[b.type].category !== 'sobaos'),
    reward(s) {
      addFama(s, 5);
      return 'Ya puedes poner "Holding" en tu tarjeta de visita. Fama +5.';
    },
  },
  {
    id: 'campana',
    lane: 'negocio',
    text: 'Lanza una campaña de marketing (en una ciudad o en la pestaña Mercado).',
    test: (s) => s.mods.some((m) => m.campaign) || s.flags.campaignDone,
    reward(s) {
      s.flags.campaignDone = true;
      addRep(s, 2);
      return 'Tu cara en una valla. Tu madre la fotografía cada vez que pasa. Reputación +2.';
    },
  },
  {
    id: 'producto',
    lane: 'negocio',
    text: 'Desarrolla un producto nuevo en I+D (pestaña Mercado).',
    test: (s) => (s.products || []).length >= 1,
    reward(s) {
      addCash(s, 8000);
      return 'Te dan el premio "Innovación Pasiega" de la Cámara de Comercio: 8.000 € y una placa que pesa más que el premio.';
    },
  },
  {
    id: 'tres_sectores',
    lane: 'negocio',
    text: 'Factura en 3 sectores a la vez (sobaos, hostelería, inmobiliario, servicios o formación).',
    progress: (s) => [Math.min(3, sectors(s)), 3],
    test: (s) => sectors(s) >= 3,
    reward(s) {
      addFama(s, 4);
      return 'Ya eres un "grupo empresarial diversificado". Lo dices despacio, para que se oiga bien. Fama +4.';
    },
  },
  {
    id: 'regional',
    lane: 'negocio',
    text: 'Abre un obrador regional para fabricar cerca de tus tiendas.',
    test: (s) => s.businesses.some((b) => b.type === 'obrador_regional'),
    reward(s) {
      addRep(s, 3);
      return 'El alcalde de la ciudad corta la cinta y se hace la foto con un sobao. Reputación +3.';
    },
  },
  {
    id: 'inspeccion_limpia',
    lane: 'equipo',
    text: 'Que la Inspección de Trabajo venga y no encuentre nada.',
    test: (s) => !!s.flags.inspeccionLimpia,
    reward(s) {
      addRep(s, 3);
      return 'Marisa se va con las manos vacías y un sobao. En el pueblo se comenta. Reputación +3.';
    },
  },
  {
    id: 'tres_directivos',
    lane: 'equipo',
    text: 'Ten 3 directivos a la vez.',
    progress: (s) => [Math.min(3, Object.keys(s.execs || {}).length), 3],
    test: (s) => Object.keys(s.execs || {}).length >= 3,
    reward(s) {
      addFama(s, 3);
      return 'Ya tienes "comité de dirección". Os reunís los lunes a desayunar sobaos. Fama +3.';
    },
  },
  {
    id: 'millon',
    lane: 'dinero',
    progress: (s) => [Math.min(1e6, Math.max(0, Math.round(patrimonio(s)))), 1e6],
    text: 'Alcanza 1 millón de patrimonio.',
    test: (s) => patrimonio(s) >= 1e6,
    reward(s) {
      addFama(s, 6);
      return '¡Millonario! Te compras un Audi (de renting). Fama +6.';
    },
  },
  {
    id: 'anio_verde',
    lane: 'dinero',
    text: 'Cierra un año natural entero con beneficio.',
    test: (s) => greenYear(s),
    reward(s) {
      addCash(s, 5000);
      return 'Paco te regala una agenda de cuero "por el año". Y la Caja Cantábrica, 5.000 € de bonificación por buen cliente.';
    },
  },
  {
    id: 'cincuenta',
    lane: 'equipo',
    progress: (s) => [Math.min(50, s.lastReport?.employees ?? 0), 50],
    text: 'Da trabajo a 50 personas.',
    test: (s) => (s.lastReport?.employees ?? 0) >= 50,
    reward(s) {
      addRep(s, 4);
      return '"Yo genero empleo", repites en cada cena. Por una vez es verdad. Reputación +4.';
    },
  },
  {
    id: 'tres_millones',
    lane: 'dinero',
    progress: (s) => [Math.min(3e6, Math.max(0, Math.round(patrimonio(s)))), 3e6],
    text: 'Alcanza 3 millones de patrimonio.',
    test: (s) => patrimonio(s) >= 3e6,
    reward(s) {
      addFama(s, 8);
      return 'Te invitan a dar una charla TEDx en Torrelavega. Fama +8.';
    },
  },
  {
    id: 'tiburon',
    lane: 'dinero',
    progress: (s) => [Math.min(5e6, Math.max(0, Math.round(patrimonio(s)))), 5e6],
    text: 'Llega a 5 millones antes de 2034 para ser un Tiburón Pasiego.',
    test: (s) => patrimonio(s) >= 5e6,
    reward(s) {
      addFama(s, 10);
      return 'Ya eres oficialmente un tiburón. Ahora, a salir en una revista de millonarios (15 M€). Fama +10.';
    },
  },
  {
    id: 'forbes',
    lane: 'dinero',
    progress: (s) => [Math.min(15e6, Math.max(0, Math.round(patrimonio(s)))), 15e6],
    text: 'El sueño: 15 millones de patrimonio.',
    test: (s) => patrimonio(s) >= 15e6,
    reward() {
      return 'La revista de millonarios ya está al teléfono.';
    },
  },
];
