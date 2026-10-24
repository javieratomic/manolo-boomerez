// Logros: se guardan entre partidas (ver src/ui/achievements.js).
import { BUSINESS_TYPES } from './businesses.js';
import { ENDINGS } from './endings.js';
import { patrimonio } from '../core/economy.js';
import { CLAUSES } from './clauses.js';
import { REFRAN_COUNT } from './refranes.js';

const count = (s, type) => s.businesses.filter((b) => b.type === type).length;

export const ACHIEVEMENTS = [
  { id: 'primer_sobao', emoji: '🥐', name: 'El primer sobao', desc: 'Abre tu primera tienda de sobaos.', test: (s) => s.businesses.some((b) => BUSINESS_TYPES[b.type].category === 'sobaos') },
  { id: 'franquiciador', emoji: '🤝', name: 'Vendedor de sueños', desc: 'Ten 5 franquicias a la vez.', test: (s) => s.businesses.filter((b) => b.mode === 'franquicia').length >= 5 },
  { id: 'casero', emoji: '🔑', name: 'Casero y patrón', desc: 'Aloja a 30 empleados en tus pisos.', test: (s) => (s.lastReport?.housed ?? 0) >= 30 },
  { id: 'becarios', emoji: '🎓', name: 'Escuela de vida', desc: 'Ten una legión de becarios con más de 40 personas en plantilla.', test: (s) => s.policies.becarios === 'legion' && (s.lastReport?.employees ?? 0) > 40 },
  { id: 'visita_guiada', emoji: '🔎', name: 'Visita guiada', desc: 'Recibe 3 inspecciones de Trabajo en una partida.', test: (s) => s.stats.inspecciones >= 3 },
  { id: 'amigo_hacienda', emoji: '🏛️', name: 'Cliente preferente', desc: 'Sufre 3 auditorías de Hacienda en una partida.', test: (s) => s.stats.auditorias >= 3 },
  { id: 'andorrano', emoji: '🏔️', name: 'Residente fiscal en el Pirineo', desc: 'Monta la sociedad en Andorra.', test: (s) => s.andorraPaid },
  { id: 'influencer', emoji: '📣', name: 'Thought leader', desc: 'Llega a 80 de fama.', test: (s) => s.fama >= 80 },
  { id: 'cancelado', emoji: '🙊', name: 'Cancelado', desc: 'Hunde tu reputación por debajo de 10.', test: (s) => s.rep < 10 },
  { id: 'como_tu_padre', emoji: '🧓', name: 'Como tu padre', desc: 'Pasa 24 meses seguidos con todo en regla (convenio, horas pagadas, sin becarios y contabilidad limpia).', test: (s) => (s.flags.legalStreak ?? 0) >= 24 },
  { id: 'burbuja', emoji: '🍔', name: 'Burbuja aplastada', desc: 'Ten 5 Manolo Smash Club a la vez.', test: (s) => count(s, 'smash') >= 5 },
  { id: 'gaucho', emoji: '🥟', name: 'Gaucho de adopción', desc: 'Ten 6 empanaderías a la vez.', test: (s) => count(s, 'empanadas') >= 6 },
  { id: 'ladrillo', emoji: '🧱', name: 'Ladrillo, que nunca baja', desc: 'Ten 10 inmuebles (residenciales o pisos turísticos).', test: (s) => count(s, 'vivienda') + count(s, 'airbnb') >= 10 },
  { id: 'susto', emoji: '🫀', name: 'Ni un infarto para a un tiburón', desc: 'Llévate un susto en la pista de pádel por estrés.', test: (s) => s.flags.sustoMonth != null },
  { id: 'campanazo', emoji: '🔔', name: 'Campanazo', desc: 'Saca la empresa a Bolsa.', test: (s) => !!s.ipo },
  { id: 'soltero', emoji: '💔', name: 'Soltero de oro', desc: 'Consigue que Merche te pida el divorcio.', test: (s) => !!s.flags.divorciado },
  { id: 'nuevo_rico', emoji: '🛥️', name: 'Nuevo rico', desc: 'Ten a la vez el yate y el chalet en Marbella.', test: (s) => ['yate', 'chalet'].every((id) => (s.lujo || []).some((x) => x.id === id)) },
  { id: 'opa', emoji: '🦈', name: 'Depredador', desc: 'Compra una cadena rival con una OPA.', test: (s) => s.businesses.some((b) => b.acquired) },
  { id: 'millonario', emoji: '💰', name: 'Millonario (de patrimonio)', desc: 'Alcanza 1 millón de patrimonio.', test: (s) => patrimonio(s) >= 1e6 },
  ...Object.entries(ENDINGS).map(([id, e]) => ({
    id: `final_${id}`, emoji: e.tone === 'good' ? '🏆' : e.tone === 'bad' ? '💀' : '🎬', name: `Final: ${e.title}`, desc: 'Consigue este final.',
    test: (s) => s.ending === id,
  })),
  ...CLAUSES.map((c) => ({ id: `clausula_${c.id}`, emoji: '📜', name: `Cláusula: ${c.title}`, desc: `Acaba una partida cumpliendo la cláusula «${c.title}».`, test: (s) => s.clausula?.id === c.id && s.clausula.done })),
  { id: 'albacea', emoji: '⚖️', name: 'Albacea de ti mismo', desc: 'Cumple la cláusula del testamento y acaba en la revista de millonarios.', test: (s) => !!s.clausula?.done && s.ending === 'forbes' },
  { id: 'paz_social', emoji: '🤝', name: 'Paz social', desc: 'Firma 3 revisiones del convenio en una partida.', test: (s) => (s.comite?.firmas ?? 0) >= 3 },
  { id: 'del_valle', emoji: '🐄', name: 'Del valle, para el valle', desc: 'Mantén 36 meses seguidos la participación del 8 % para la plantilla.', test: (s) => (s.flags.participacionMeses ?? 0) >= 36 },
  { id: 'beneficios_record', emoji: '🪧', name: 'Beneficios récord, sueldos de risa', desc: 'Sufre una huelga general.', test: (s) => (s.stats.huelgas ?? 0) >= 1 },
  { id: 'calculadora_marisa', emoji: '🧮', name: 'La calculadora de Marisa', desc: 'Que Marisa te liquide más de 1 M€ de una vez (aunque lo pagues a plazos).', test: (s) => (s.stats.maxLiquidacion ?? 0) > 1e6 },
  { id: 'hijo_de_tu_madre', emoji: '🧓', name: 'Hijo de tu madre', desc: 'Devuelve a tiempo 3 préstamos de la cartilla de Doña Remedios.', test: (s) => (s.cartilla?.devueltos ?? 0) >= 3 },
  { id: 'embargo_materno', emoji: '🥘', name: 'Embargo materno', desc: 'Dile a tu madre "No tengo, mamá" y deja que te embargue.', test: (s) => !!s.flags.embargado },
  { id: 'refranero', emoji: '📖', name: 'Refranero completo', desc: `Colecciona los ${REFRAN_COUNT} refranes de la cartilla (entre partidas).`, test: (s) => (s.flags.refranero ?? 0) >= REFRAN_COUNT },
  { id: 'hombre_de_palabra', emoji: '🎤', name: 'Hombre de palabra', desc: 'Cumple 8 promesas del trimestre seguidas cotizando en Bolsa.', test: (s) => (s.ipo?.racha ?? 0) >= 8 },
  { id: 'sobao_hueco', emoji: '🥐', name: 'El sobao está hueco', desc: 'Que un fondo bajista descubra que has maquillado las cuentas.', test: (s) => (s.ipo?.descubiertos ?? 0) >= 1 },
  { id: 'sucesion', emoji: '📜', name: 'Sucesión ordenada', desc: 'Elige heredero ante el notario de Villacarriedo.', test: (s) => !!s.sucesion?.heir && s.sucesion.heir !== 'nadie' },
  { id: 'las_que_madrugan', emoji: '🧑‍🍳', name: 'Las que madrugan', desc: 'Deja la empresa en herencia a la plantilla.', test: (s) => s.sucesion?.heir === 'plantilla' },
];
