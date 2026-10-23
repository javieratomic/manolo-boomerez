import { EXTRA_QUOTES } from './flavorExtra.js';

// Frases de Manolo para el bocadillo. Las condicionales tienen prioridad.
const BASE_QUOTES = [
  'Yo a vuestra edad ya tenía un Audi.',
  'Esto lo he levantado yo solo. Bueno, con el obrador de mi padre. Y su dinero. Pero solo.',
  'El que quiere trabajar, trabaja. El que no, pide un sueldo.',
  'Los jóvenes no quieren esforzarse. Yo me esfuerzo muchísimo en no pagar horas extra.',
  'Me levanto a las 5. Bueno, me despierto a las 5 y me vuelvo a dormir. Pero es mentalidad.',
  'No es explotación, es formación intensiva.',
  'Yo no evado impuestos. Yo optimizo mi relación con el Estado.',
  'Soy un joven emprendedor. Joven de espíritu.',
  'El sobao es como yo: tradicional por fuera, disruptivo por dentro.',
  'Aquí somos una familia. Y en las familias no se cobran las horas extra.',
  'Si Amancio pudo, ¿por qué no yo? Él tenía Zara, yo tengo sobaos.',
  'Mi padre era un gran hombre, pero le faltaba visión de escalabilidad.',
  'Las vacaciones son para los que no tienen sueños.',
  '¿Conciliación? Yo concilio mi vida con mi empresa: la empresa gana.',
  'No me gusta la palabra "becario". Prefiero "talento en fase de inversión".',
  'Todo el mundo habla de la vivienda. Yo hago algo: se la alquilo a mis empleados.',
  'Hacienda somos todos. Pero unos más que otros, y yo menos.',
  'El networking es lo más importante. Por eso voy tanto al bar.',
  'He leído "Padre rico, padre pobre". Mi padre era de los ricos, pero no lo sabía.',
  'Un emprendedor de verdad no duerme: hace siestas estratégicas.',
  'En Andorra me entienden.',
  '¿Huelga? En mis tiempos la gente estaba agradecida de tener trabajo.',
];

export const QUOTES = [...BASE_QUOTES, ...EXTRA_QUOTES];

export const CONDITIONAL_QUOTES = [
  { test: (s) => s.heatHacienda > 60, text: 'Si viene alguien de Hacienda, yo no estoy. Estoy en una reunión. En Andorra.' },
  { test: (s) => s.heatTrabajo > 60, text: 'Kevin, si viene una señora con carpeta, los becarios a la cámara frigorífica.' },
  { test: (s) => s.moral < 25, text: 'La plantilla está rara. Deben de ser los jóvenes, que vienen así de fábrica.' },
  { test: (s) => s.cash < 0, text: 'No es que estemos en números rojos, es que estamos en fase de inversión.' },
  { test: (s) => s.rep < 25, text: 'Lo de las noticias es una campaña contra mí. Me tienen envidia.' },
  { test: (s) => s.fama > 60, text: '¿Habéis visto mi último post? 3.000 likes. Soy un referente.' },
  { test: (s) => s.expedientes >= 2, text: 'Don Cosme dice que no salga de la provincia. Mejor, aquí se come muy bien.' },
  { test: (s) => s.brand === 'maison' && s.policies.ingredientes !== 'mantequilla', text: 'La margarina, si la pones en una vitrina de mármol, es casi mantequilla.' },
  { test: (s) => s.macro?.phase === 'burbuja', text: 'Esto no baja nunca. Lo dice mi cuñado y lo dice la tele.' },
  { test: (s) => s.macro?.phase === 'burbuja', text: '¿Cómo que burbuja? Esto es crecimiento sostenible. Muy sostenible. Sostenidísimo.' },
  { test: (s) => s.macro?.phase === 'crisis', text: 'En las crisis se hacen los grandes. Yo, de momento, me estoy haciendo pequeño.' },
  { test: (s) => s.macro?.phase === 'crisis', text: 'Las crisis son oportunidades. Lo pone en una taza que me regalaron.' },
  { test: (s) => (s.familia ?? 60) < 30 && !s.flags.divorciado, text: 'Merche dice que paso más tiempo en LinkedIn que en casa. Es que en LinkedIn me valoran.' },
  { test: (s) => !!s.flags.divorciado, text: 'Ahora estoy centrado en mí. Y en mi ático. Y en mi máquina de remo.' },
  { test: (s) => (s.rivals?.length || 0) >= 3, text: 'La competencia me copia todo. Hasta las gafas de sol en la cabeza.' },
  { test: (s) => s.ipo && s.ipo.price < 90, text: 'La Bolsa es muy cortoplacista. Yo pienso en el largo plazo: el trimestre que viene.' },
  { test: (s) => s.ipo && s.ipo.price >= 120, text: 'Mis accionistas me adoran. Bueno, mis acciones. Bueno, el precio.' },
  { test: (s) => (s.lastReport?.fill ?? 1) < 0.9, text: 'Tenemos más demanda que sobaos. Es un problema de éxito, no de planificación.' },
  { test: (s) => Object.keys(s.execs || {}).length >= 4, text: 'Tengo un equipo directivo de primera. Yo solo marco la visión (y me voy al pádel).' },
  { test: (s) => (s.lujo || []).some((x) => x.id === 'yate'), text: 'El yate no es un capricho, es una sala de reuniones flotante.' },
];
