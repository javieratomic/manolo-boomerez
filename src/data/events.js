// Cartas de sucesos. Cada evento:
//  { id, title, portrait, image, text(s, params), weight(s) -> número (0 = no elegible / solo por guion),
//    once?, cooldown?, forced?, choices: [{ label, hint?, available?(s, params), effect(s, params) -> texto }] }
//  forced: true -> si es elegible, sale ese mismo mes sin pasar por el azar (pasos de arcos narrativos).
import { chance, int } from '../core/rng.js';
import {
  addCash, addRep, addMoral, addFama, addHeatTrabajo, addHeatHacienda, addExpediente, addMod, addMonthlyCost, log, money,
} from '../core/helpers.js';
import { DELITO_FISCAL } from '../core/inspections.js';
import { LEGAL_LABOR } from './policies.js';
import { BUSINESS_TYPES } from './businesses.js';
import { CITY_BY_ID } from './cities.js';
import { sobaoOutlets } from '../core/actions.js';
import { MACRO_EVENTS } from './eventsMacro.js';
import { ARC_EVENTS } from './eventsArcs.js';
import { EXTRA_EVENTS } from './eventsExtra.js';
import { SYSTEM_EVENTS } from './eventsSystems.js';

const employees = (s) => s.lastReport?.employees ?? 10;
const has = (s, type) => s.businesses.some((b) => b.type === type);
const pay = (s, amount) => {
  addCash(s, -amount);
  s.stats.multas += amount;
};
const forceLegal = (s, months = 6) => {
  Object.assign(s.policies, LEGAL_LABOR);
  s.flags.forcedLegal = months;
};

const BASE_EVENTS = [
  // ---------------------------------------------------------------- Guion
  {
    id: 'intro_herencia',
    title: 'La herencia',
    portrait: 'portrait_padre_anselmo', image: 'ev_intro_herencia',
    text: () =>
      'Notaría de Villacarriedo. El notario lee el testamento de Don Anselmo Boomerez (q.e.p.d.):\n\n' +
      '"A mi hijo Manolo le dejo el obrador, la receta de la abuela y 80.000 € de ahorros. ' +
      'Que no haga tonterías."\n\n' +
      'Manolo, 55 años, joven emprendedor, se ajusta las gafas de sol sobre la cabeza. ' +
      'Va a hacer tonterías. Pero tonterías ESCALABLES.\n\n¿Qué modelo de negocio va a conquistar España?',
    weight: () => 0,
    choices: [
      {
        label: 'Sobaos Manolo Express (low-cost)',
        hint: 'Volumen, neón y precios de derribo. Funciona en ciudades grandes y populares.',
        effect(s) {
          s.brand = 'express';
          log(s, '🥐 Nace "Sobaos Manolo Express". El sobao, democratizado.', 'good');
          return '"El sobao es del pueblo, y el pueblo quiere sobaos a 3,20." Has elegido la vía del volumen. Ojo con la capacidad del obrador.';
        },
      },
      {
        label: 'Maison Boomerez (boutique delicatessen)',
        hint: 'Precio alto, poco volumen. Ciudades ricas y turísticas. La calidad importa mucho.',
        effect(s) {
          s.brand = 'maison';
          log(s, '✨ Nace "Maison Boomerez — Pâtisserie Pasiega". Con acento en la e.', 'good');
          return '"El sobao es un producto de lujo que el mercado no ha sabido valorar." Has elegido la vía gourmet. La margarina aquí no perdona.';
        },
      },
    ],
  },
  {
    id: 'navidad',
    title: 'La cesta de Navidad',
    portrait: 'portrait_empleada_maripili', image: 'ev_navidad',
    text: (s) => `Maripili, la portavoz de la plantilla, pregunta por la cesta de Navidad. Sois ${employees(s)} personas.`,
    weight: () => 0,
    choices: [
      {
        label: 'Cesta en condiciones (80 € por persona)',
        effect(s) {
          const c = employees(s) * 80;
          addCash(s, -c);
          addMoral(s, 6);
          return `Turrón, embutido y un Rioja decente. ${money(c)}. La plantilla se acuerda de tu padre con cariño, y un poco de ti. Moral +6.`;
        },
      },
      {
        label: 'Un sobao caducado y una tarjeta con tu foto',
        effect(s) {
          addCash(s, -employees(s) * 5);
          addMoral(s, -4);
          addFama(s, 2);
          return 'La tarjeta dice "Gracias por formar parte de mi sueño". Alguien la sube a Twitter. Moral −4, fama +2.';
        },
      },
      {
        label: 'Venderles participaciones de lotería con recargo',
        effect(s) {
          addCash(s, employees(s) * 15);
          addMoral(s, -6);
          if (chance(s, 0.05)) {
            addMoral(s, -30);
            return 'Toca el Gordo. A ellos. La mitad de la plantilla se despide el 23 de diciembre. Moral −36 (los que quedan te odian).';
          }
          return `Ganas ${money(employees(s) * 15)} con el recargo "de gestión". No toca nada. Moral −6.`;
        },
      },
    ],
  },
  {
    id: 'agosto',
    title: 'Vacaciones en agosto',
    portrait: 'portrait_empleada_maripili', image: 'ev_agosto',
    text: () => 'La plantilla quiere coger vacaciones en agosto, como el resto de España. Tú tienes una visión distinta.',
    weight: () => 0,
    choices: [
      {
        label: 'Que las disfruten',
        effect(s) {
          addMoral(s, 5);
          addMod(s, { kind: 'revenue', factor: 0.93, months: 1, label: 'Vacaciones' });
          return 'Rotáis turnos y nadie se muere. Moral +5. Algo menos de producción en septiembre.';
        },
      },
      {
        label: '"En agosto es cuando más se vende"',
        effect(s) {
          addMoral(s, -6);
          addHeatTrabajo(s, 4);
          return 'Les explicas que las vacaciones son "un concepto del siglo XX". Moral −6, radar de Inspección +4.';
        },
      },
    ],
  },

  // ------------------------------------------------- Inspección y Hacienda
  {
    id: 'inspeccion_trabajo',
    title: 'Inspección de Trabajo',
    portrait: 'portrait_inspectora_trabajo', image: 'ev_inspeccion',
    text: (s, p) =>
      p.fine > 0
        ? `La inspectora Marisa Ortega se presenta en el obrador sin avisar, con una carpeta muy gorda.\n\n"Buenos días, Don Manuel. Venimos por unas denuncias anónimas. Muy anónimas. Firmadas por toda la plantilla."\n\nMulta estimada: ${money(p.fine)}.`
        : 'La inspectora Marisa Ortega revisa contratos, nóminas y registros horarios.\n\n...Todo está en regla. Se la nota decepcionada.',
    weight: () => 0,
    choices: [
      {
        label: 'Ofrecerle un sobao (legal)',
        available: (s, p) => p.fine === 0,
        effect(s) {
          addHeatTrabajo(s, -40);
          addRep(s, 2);
          return '"Esto no es un soborno, ¿verdad?" "Es un sobao, señora." Se lo come. Se va. Radar de Inspección −40.';
        },
      },
      {
        label: 'Colaborar y regularizar',
        hint: 'Pagas la mitad de la multa y vuelves a la legalidad durante 6 meses.',
        available: (s, p) => p.fine > 0,
        effect(s, p) {
          pay(s, p.fine * 0.5);
          forceLegal(s);
          addHeatTrabajo(s, -50);
          addMoral(s, 8);
          return `Firmas el acta con cara de mártir. Multa: ${money(p.fine * 0.5)}. Durante 6 meses, contratos legales y horas pagadas. La plantilla no se lo cree. Moral +8.`;
        },
      },
      {
        label: 'Esconder a los becarios en la cámara frigorífica',
        hint: '55 %: no pasa nada. Si sale mal: multa ×1,5 y escándalo.',
        available: (s, p) => p.fine > 0,
        effect(s, p) {
          if (chance(s, 0.55)) {
            addHeatTrabajo(s, -15);
            addMoral(s, -5);
            return 'Tres becarios pasan 40 minutos a 2 °C entre cajas de mantequilla. La inspectora no los encuentra. Ellos a ti sí te encuentran después. Moral −5.';
          }
          pay(s, p.fine * 1.5);
          addRep(s, -12);
          forceLegal(s);
          addHeatTrabajo(s, -30);
          return `La inspectora abre la cámara para "ver la mantequilla". Encuentra a tres becarios con escarcha en las cejas. Multa: ${money(p.fine * 1.5)}. Sale en las noticias. Reputación −12.`;
        },
      },
      {
        label: 'Invitarla a sobaos y un orujo',
        hint: '30 %: se ablanda. Si no: multa ×1,3 y expediente por cohecho.',
        available: (s, p) => p.fine > 0,
        effect(s, p) {
          if (chance(s, 0.3)) {
            addHeatTrabajo(s, -30);
            return '"Bueno... por esta vez solo le pongo un requerimiento." El orujo de tu padre hace milagros. Radar de Inspección −30.';
          }
          pay(s, p.fine * 1.3);
          addExpediente(s, 1, 'intento de cohecho a una inspectora');
          addHeatTrabajo(s, -20);
          return `"¿Me está usted ofreciendo algo, Don Manuel?" Lo apunta todo. Multa: ${money(p.fine * 1.3)} y un expediente.`;
        },
      },
      {
        label: 'Llamar a Don Cosme',
        hint: 'El abogado de tu padre. Multa ×0,6 y sin intervención.',
        available: (s, p) => p.fine > 0 && s.perks.abogado,
        effect(s, p) {
          pay(s, p.fine * 0.6);
          addHeatTrabajo(s, -35);
          return `Don Cosme llega en un Mercedes de 1994 y cita jurisprudencia de 1987. Multa reducida: ${money(p.fine * 0.6)}. Puedes seguir con tus políticas (de momento).`;
        },
      },
    ],
  },
  {
    id: 'auditoria_hacienda',
    title: 'Auditoría de Hacienda',
    portrait: 'portrait_inspector_hacienda', image: 'ev_hacienda',
    text: (s, p) =>
      p.debt > 0
        ? `Don Fermín Rubalcaba, inspector de la Agencia Tributaria, te cita en Santander. Lleva manguitos. Nadie lleva manguitos desde 1970.\n\n"Hemos detectado discrepancias entre su nivel de vida y lo que declara. Su Instagram nos ha ayudado mucho."\n\nCuota defraudada estimada: ${money(p.debt)}${p.debt >= DELITO_FISCAL ? ' (supera los 120.000 €: hay riesgo de delito fiscal)' : ''}.`
        : 'Don Fermín Rubalcaba revisa tus cuentas durante tres horas. Todo cuadra. Se quita los manguitos, derrotado.',
    weight: () => 0,
    choices: [
      {
        label: 'Ofrecerle un café',
        available: (s, p) => p.debt === 0,
        effect(s) {
          addHeatHacienda(s, -50);
          return '"No acepto nada del contribuyente." Se va. Radar de Hacienda −50.';
        },
      },
      {
        label: 'Pagar la paralela',
        hint: 'Cuota + 20 % de recargo. Sin riesgo penal.',
        available: (s, p) => p.debt > 0,
        effect(s, p) {
          pay(s, p.debt * 1.2);
          s.evaded = 0;
          addHeatHacienda(s, -50);
          return `Pagas ${money(p.debt * 1.2)} con la mandíbula apretada. "Esto en Andorra no pasa", murmuras.`;
        },
      },
      {
        label: 'Culpar al gestor',
        hint: '50 % (70 % si tienes a Paco): pagas solo la cuota. Si no, ×1,5.',
        available: (s, p) => p.debt > 0,
        effect(s, p) {
          const ok = chance(s, s.perks.gestor ? 0.7 : 0.5);
          s.evaded = 0;
          addHeatHacienda(s, -40);
          if (ok) {
            pay(s, p.debt);
            return `"Yo de números no entiendo, eso lo llevaba Paco." Cuela. Pagas solo la cuota: ${money(p.debt)}.${s.perks.gestor ? ' Paco no te habla en una semana.' : ''}`;
          }
          pay(s, p.debt * 1.5);
          if (p.debt >= DELITO_FISCAL) addExpediente(s, 1, 'delito fiscal');
          return `"Su gestor dice que usted le pedía expresamente 'que no se notara'." Pagas ${money(p.debt * 1.5)}.`;
        },
      },
      {
        label: 'Colar tickets de cenas como gastos de representación',
        hint: '30 %: pagas la mitad. Si no: ×2 y expediente por falsedad.',
        available: (s, p) => p.debt > 0,
        effect(s, p) {
          s.evaded = 0;
          addHeatHacienda(s, -30);
          if (chance(s, 0.3)) {
            pay(s, p.debt * 0.5);
            return `Presentas 214 tickets de marisquerías como "reuniones estratégicas". El inspector está agotado. Pagas ${money(p.debt * 0.5)}.`;
          }
          pay(s, p.debt * 2);
          addExpediente(s, 1, 'falsedad documental');
          return `Uno de los tickets es del cumpleaños de tu hija, con la tarta en la foto. Pagas ${money(p.debt * 2)}.`;
        },
      },
      {
        label: 'Hacerse el anciano confuso',
        hint: '20 %: te tienen lástima (×0,7). Si no: ×1,5 y vídeo viral.',
        available: (s, p) => p.debt > 0,
        effect(s, p) {
          s.evaded = 0;
          addHeatHacienda(s, -35);
          if (chance(s, 0.2)) {
            pay(s, p.debt * 0.7);
            return `"¿Hacienda? ¿Qué Hacienda? Yo soy un pobre pasiego..." Te dejan pagar a plazos: ${money(p.debt * 0.7)}.`;
          }
          pay(s, p.debt * 1.5);
          addRep(s, -5);
          return `Ayer saliste en LinkedIn diciendo que eras "un joven emprendedor". El inspector te lo enseña en el móvil. Pagas ${money(p.debt * 1.5)}. Reputación −5.`;
        },
      },
    ],
  },
  {
    id: 'huelga',
    title: '¡Huelga!',
    portrait: 'portrait_empleada_maripili', image: 'ev_huelga',
    text: (s) =>
      `La plantilla está harta. Maripili aparece con una pancarta: "MANOLO, EL SOBAO ES DE QUIEN LO AMASA". La producción se para.\n\nMoral actual: ${Math.round(s.moral)}.`,
    weight: () => 0,
    choices: [
      {
        label: 'Negociar: subir al convenio y pagar 300 € por cabeza',
        effect(s) {
          const c = employees(s) * 300;
          addCash(s, -c);
          s.policies.salario = 'convenio';
          addMoral(s, 20);
          return `Firmas un acuerdo. ${money(c)} de paga extra y salario de convenio. La plantilla vuelve contenta. Moral +20.`;
        },
      },
      {
        label: 'Aguantar el pulso',
        effect(s) {
          addMod(s, { kind: 'strike', factor: 0.5, months: 1, label: 'Huelga' });
          addRep(s, -6);
          addMoral(s, 5);
          return 'Un mes de huelga. La producción baja a la mitad. La plantilla, unida, se siente mejor. Tú no. Reputación −6.';
        },
      },
      {
        label: 'Contratar esquiroles',
        effect(s) {
          addHeatTrabajo(s, 15);
          addRep(s, -8);
          addMoral(s, -10);
          return 'Traes a tu sobrino, a sus colegas del gimnasio y a un señor que pasaba por allí. Los sobaos salen cuadrados. Radar de Inspección +15, reputación −8, moral −10.';
        },
      },
    ],
  },
  {
    id: 'franquiciado_arruinado',
    title: 'Un franquiciado arruinado',
    portrait: 'portrait_franquiciado', image: 'ev_franquiciado',
    text: (s, p) => {
      const c = CITY_BY_ID[p.city];
      return `El franquiciado de ${c?.name ?? 'una ciudad'} lleva meses perdiendo dinero. Ha metido su indemnización de despido y la herencia de su madre en tu franquicia.\n\n"Me dijiste que esto era un negocio seguro, Manolo. Que el sobao no tenía techo."`;
    },
    weight: () => 0,
    choices: [
      {
        label: 'Recomprarle el local (15.000 €)',
        effect(s, p) {
          addCash(s, -15000);
          const b = s.businesses.find((x) => x.id === p.businessId);
          if (b) {
            b.mode = 'propia';
            b.value = BUSINESS_TYPES[b.type].cost * 0.5;
            b.lossMonths = 0;
          }
          addRep(s, 2);
          return 'Te quedas la tienda como propia. Él se va con algo de dignidad y 15.000 €. Reputación +2.';
        },
      },
      {
        label: '"Te ha faltado mentalidad"',
        effect(s, p) {
          s.businesses = s.businesses.filter((x) => x.id !== p.businessId);
          addRep(s, -5);
          if (chance(s, 0.4)) {
            pay(s, 30000);
            return 'Te demanda por publicidad engañosa y gana. Pagas 30.000 € y cierra la tienda. Reputación −5.';
          }
          return 'Cierra la tienda y se vuelve al pueblo. Escribe una reseña de una estrella que empieza con "Queridos futuros franquiciados...". Reputación −5.';
        },
      },
    ],
  },
  {
    id: 'pisos_prohibidos',
    title: 'El ayuntamiento prohíbe los pisos turísticos',
    portrait: 'portrait_alcalde', image: 'ev_pisos_turisticos',
    text: (s, p) => `El ayuntamiento de ${CITY_BY_ID[p.city]?.name} aprueba una moratoria de pisos turísticos. Tus apartamentos "Casa Manolo" se quedan sin licencia.`,
    weight: () => 0,
    choices: [
      {
        label: 'Reconvertirlos en Residencial Boomerez para la plantilla',
        effect(s, p) {
          const b = s.businesses.find((x) => x.id === p.businessId);
          if (b) b.type = 'vivienda';
          return '"Ahora son viviendas para mis trabajadores. Soy un benefactor." Los pisos pasan a ser residencial de empleados.';
        },
      },
      {
        label: 'Seguir alquilando "a amigos"',
        hint: 'Mantienes los ingresos y te arriesgas a una multa municipal.',
        effect(s) {
          addHeatHacienda(s, 6);
          if (chance(s, 0.5)) {
            pay(s, 30000);
            return 'Un vecino te denuncia con fotos de 23 maletas de ruedas. Multa: 30.000 €.';
          }
          return 'De momento, nadie dice nada. Los vecinos están coleccionando pruebas. Radar de Hacienda +6.';
        },
      },
      {
        label: 'Llamar al alcalde',
        available: (s) => s.flags.alcaldeShield > 0,
        effect() {
          return '"Manolo, tus pisos son de uso... cultural." Tus apartamentos tienen una excepción. Para eso sirven los chuletones.';
        },
      },
    ],
  },

  // ---------------------------------------------------------- Aleatorios
  {
    id: 'cunado_cripto',
    title: 'SobaoCoin',
    portrait: 'portrait_cunado_jonathan', image: 'ev_cripto',
    text: () => 'Tu cuñado Jonathan aparece con una sudadera de "HODL" y un plan: "SobaoCoin. La primera criptomoneda respaldada por sobaos. Mete 20.000 € y te hago rico, cuñao."',
    weight: (s) => (s.cash > 30000 ? 1 : 0), cooldown: 24,
    choices: [
      {
        label: 'Invertir 20.000 €',
        effect(s) {
          addCash(s, -20000);
          if (chance(s, 0.35)) {
            addCash(s, 60000);
            return 'Increíble: un fondo coreano compra SobaoCoin por error. Recuperas 60.000 €. Jonathan ya se ha comprado un Cupra.';
          }
          return 'SobaoCoin cae un 99,7 % cuando Jonathan pierde la contraseña de la wallet. "Es una corrección del mercado, cuñao."';
        },
      },
      {
        label: 'Invertir los ahorros del fondo social de la plantilla',
        effect(s) {
          addMoral(s, -15);
          addHeatHacienda(s, 8);
          if (chance(s, 0.4)) {
            addCash(s, 80000);
            return 'Sale bien: ganas 80.000 €. La plantilla se entera de con qué dinero los has ganado. Moral −15.';
          }
          addHeatTrabajo(s, 10);
          return 'Sale mal. El fondo social desaparece. La plantilla también se entera. Moral −15, radar de Inspección +10.';
        },
      },
      {
        label: '"Eso es de pobres, Jonathan"',
        effect(s) {
          addFama(s, 1);
          return 'Jonathan se ofende y se va a montar un podcast. Te deja en paz unos meses.';
        },
      },
    ],
  },
  {
    id: 'influencer',
    title: 'Una influencer pide sobaos gratis',
    portrait: 'portrait_influencer', image: 'ev_influencer',
    text: () => '@LaVidaDeIraia (230 k seguidores) te escribe: "Holiii, me encantaría colaborar con vuestra marca. Os hago una story a cambio de 50 cajas de sobaos y un fin de semana en Cantabria 💕"',
    weight: (s) => (s.month > 2 ? 1 : 0), cooldown: 12,
    choices: [
      {
        label: 'Aceptar la colaboración (1.200 €)',
        effect(s) {
          addCash(s, -1200);
          addFama(s, 4);
          if (chance(s, 0.6)) {
            addRep(s, 4);
            return 'La story funciona: "Este sobao es literalmente terapia." Reputación +4, fama +4.';
          }
          return 'Se come un sobao con cara de asco porque estaba a dieta. Fama +4 y poco más.';
        },
      },
      {
        label: '"¿Sabes con quién estás hablando?"',
        effect(s) {
          addRep(s, -4);
          addFama(s, 3);
          return 'Publica tu respuesta en capturas. "El señor de los sobaos me ha llamado parásita." Reputación −4, fama +3.';
        },
      },
    ],
  },
  {
    id: 'rata_tiktok',
    title: 'Vídeo viral en el obrador',
    portrait: 'portrait_becario', image: 'ev_rata',
    text: () => 'Un vídeo de TikTok con 2 millones de visitas: una rata enorme paseando por el obrador entre bandejas de sobaos. El audio de fondo es "Despacito".',
    weight: (s) => ({ mantequilla: 0.3, margarina: 0.8, misteriosa: 2 }[s.policies.ingredientes]), cooldown: 18,
    choices: [
      {
        label: 'Decir que es la mascota de la empresa',
        effect(s) {
          addRep(s, -10);
          addFama(s, 6);
          return 'Bautizas a la rata como "Sobaína" y le haces merchandising. Hay gente que lo compra. Reputación −10, fama +6.';
        },
      },
      {
        label: 'Campaña de comunicación de crisis (15.000 €)',
        effect(s) {
          addCash(s, -15000);
          addRep(s, -3);
          return 'Un comunicado con la frase "nos tomamos muy en serio la higiene". Sanidad hace una visita y todo queda en un susto. Reputación −3.';
        },
      },
      {
        label: 'Culpar al becario que grabó el vídeo',
        effect(s) {
          addRep(s, -5);
          addMoral(s, -8);
          addHeatTrabajo(s, 5);
          return 'Lo despides por "deslealtad". Sube un segundo vídeo: la rata vuelve a salir, ahora con una entrevista al becario. Reputación −5, moral −8.';
        },
      },
    ],
  },
  {
    id: 'smi',
    title: 'Sube el Salario Mínimo',
    portrait: 'portrait_manolo_angry', image: 'ev_smi',
    text: () => 'El Gobierno anuncia una subida del Salario Mínimo Interprofesional. En la tele, una tertuliana dice "los empresarios lo absorberán". Manolo escupe el café.',
    weight: (s) => (s.month >= 10 ? 1 : 0), cooldown: 24,
    choices: [
      {
        label: 'Aceptarlo con resignación',
        effect(s) {
          s.wageIndex = (s.wageIndex || 1) * 1.04;
          addMoral(s, 3);
          return 'Los costes salariales suben un 4 %. La plantilla llega a fin de mes. Moral +3.';
        },
      },
      {
        label: 'Quejarse en la radio local',
        effect(s) {
          s.wageIndex = (s.wageIndex || 1) * 1.04;
          addFama(s, 4);
          addRep(s, -2);
          return '"¡Con este Gobierno no se puede emprender!", gritas en Radio Pas. Tu madre te llama para que bajes la voz. Costes salariales +4 %, fama +4.';
        },
      },
      {
        label: 'Pasar a todo el mundo a falso autónomo',
        effect(s) {
          s.policies.salario = 'negro';
          addHeatTrabajo(s, 10);
          addMoral(s, -8);
          return '"Ahora sois empresarios de vosotros mismos. ¡Enhorabuena!" Política salarial: falsos autónomos. Radar de Inspección +10.';
        },
      },
    ],
  },
  {
    id: 'amenaza_huelga',
    title: 'Rumores de huelga',
    portrait: 'portrait_empleada_maripili', image: 'ev_huelga',
    text: () => 'En el vestuario se habla de huelga. Maripili te avisa: "Manolo, o cambias algo o esto revienta."',
    weight: (s) => (s.moral < 35 ? 3 : 0), cooldown: 6,
    choices: [
      {
        label: 'Pizza para todos (600 €)',
        effect(s) {
          addCash(s, -600);
          if (chance(s, 0.5)) {
            addMoral(s, 4);
            return 'Cuatro barbacoas familiares. Algo se calma el ambiente. Moral +4.';
          }
          addMoral(s, -3);
          return '"¿Pizza? ¿En serio?" Se la comen igual, pero se ríen de ti. Moral −3.';
        },
      },
      {
        label: 'Volver al convenio y pagar las horas extra',
        effect(s) {
          s.policies.salario = 'convenio';
          s.policies.horas = 'pagadas';
          addMoral(s, 12);
          return 'Salario de convenio y horas pagadas. La tensión baja. Moral +12.';
        },
      },
      {
        label: 'Amenazar con despidos',
        effect(s) {
          addMoral(s, -10);
          if (chance(s, 0.4)) {
            addMod(s, { kind: 'strike', factor: 0.5, months: 1, label: 'Huelga' });
            return 'Te sale el tiro por la culata: huelga de un mes. Producción a la mitad. Moral −10.';
          }
          return 'El miedo funciona... de momento. Moral −10.';
        },
      },
    ],
  },
  {
    id: 'hija_bellasartes',
    title: 'Vanessa quiere estudiar Bellas Artes',
    portrait: 'portrait_hija_vanessa', image: 'ev_hija',
    text: () => 'Tu hija Vanessa, 19 años, te anuncia en la cena que quiere estudiar Bellas Artes en Bilbao. Te atragantas con la merluza.',
    weight: () => 1, once: true,
    choices: [
      {
        label: 'Pagarle Bellas Artes (12.000 €)',
        effect(s) {
          addCash(s, -12000);
          addRep(s, 2);
          s.flags.vanessaArtista = true;
          return 'Vanessa se va a Bilbao feliz. Promete diseñarte un logo "que no parezca de 1998". Reputación +2.';
        },
      },
      {
        label: 'Obligarla a hacer ADE en una privada (25.000 €)',
        effect(s) {
          addCash(s, -25000);
          s.flags.vanessaADE = true;
          return 'Vanessa estudia ADE con cara de funeral. Aprende mucho sobre derecho laboral. Demasiado.';
        },
      },
      {
        label: 'Ponerla de Directora de Marketing (2.000 €/mes)',
        effect(s) {
          addMonthlyCost(s, 'Sueldo de Vanessa (Dir. Marketing)', 2000);
          addFama(s, 5);
          return 'Vanessa, Chief Marketing Officer a los 19. Te abre una cuenta de TikTok. Fama +5. Coste: 2.000 €/mes.';
        },
      },
    ],
  },
  {
    id: 'marca_blanca',
    title: 'Propuesta de marca blanca',
    portrait: 'portrait_comercial', image: 'ev_supermercado',
    text: (s) =>
      `La cadena de supermercados "SuperAhorro" te ofrece fabricar sus sobaos de marca blanca: 5.000 unidades al mes a 1,50 € durante dos años.${s.brand === 'maison' ? ' Para una marca boutique, esto podría ser... incómodo.' : ''}`,
    weight: (s) => (s.month >= 4 && !s.contracts.some((c) => c.id === 'marca_blanca') ? 1 : 0), once: true,
    choices: [
      {
        label: 'Firmar',
        effect(s) {
          s.contracts.push({ id: 'marca_blanca', label: 'Marca blanca SuperAhorro', units: 5000, price: 1.5, months: 24 });
          addRep(s, s.brand === 'maison' ? -8 : -2);
          return 'Tus sobaos aparecerán en un envase amarillo con la palabra "SOBAO" en Arial. Consume capacidad del obrador. Reputación ' + (s.brand === 'maison' ? '−8.' : '−2.');
        },
      },
      {
        label: 'Rechazar',
        effect() {
          return '"Mi apellido no va en una bolsa amarilla." Muy digno. Aunque no lleva tu apellido.';
        },
      },
    ],
  },
  {
    id: 'smash_trend',
    title: 'Tendencia: smash con sobao',
    portrait: 'portrait_influencer', image: 'ev_smash',
    text: () => 'Un foodie de TikTok descubre que en tu Smash Club puedes pedir la hamburguesa con un sobao en lugar de pan. #SobaoSmash es trending.',
    weight: (s) => (has(s, 'smash') ? 1.5 : 0), cooldown: 18,
    choices: [
      {
        label: 'Ponerlo en la carta oficialmente',
        effect(s) {
          s.trends.smash = Math.min(1.6, s.trends.smash + 0.25);
          return 'La "Pasiega Smash" arrasa. La moda del smash recupera fuelle (+25 %).';
        },
      },
      {
        label: 'Negarlo: "Eso es una aberración"',
        effect(s) {
          addRep(s, 2);
          return 'Tu purismo con el sobao gusta a los mayores. Los jóvenes te llaman boomer, con razón. Reputación +2.';
        },
      },
    ],
  },
  {
    id: 'vecinos_airbnb',
    title: 'Los vecinos están hartos',
    portrait: 'portrait_vecina', image: 'ev_vecinos',
    text: () => 'Los vecinos de uno de tus bloques de "Casa Manolo" cuelgan pancartas: "TURISTAS FUERA, MANOLO TAMBIÉN". La prensa local está allí.',
    weight: (s) => (has(s, 'airbnb') ? 1.5 : 0), cooldown: 10,
    choices: [
      {
        label: 'Invitar a los vecinos a sobaos',
        effect(s) {
          addCash(s, -500);
          addRep(s, -1);
          return 'Aceptan los sobaos y mantienen las pancartas. Al menos ahora están más dulces. Reputación −1.';
        },
      },
      {
        label: 'Declarar a la prensa que "la vivienda es un activo"',
        effect(s) {
          addRep(s, -8);
          addFama(s, 5);
          return 'Sales en el telediario nacional. Te hacen un meme con tu cara y un mapa del Monopoly. Reputación −8, fama +5.';
        },
      },
    ],
  },
  {
    id: 'becario_hilo',
    title: 'Un hilo viral',
    portrait: 'portrait_becario', image: 'ev_hilo',
    text: () => 'Un exbecario publica un hilo: "Trabajé 6 meses en el imperio Boomerez por 400 €. Os cuento cosas 🧵 (1/47)". Tiene muy buena memoria y capturas.',
    weight: (s) => (s.policies.becarios !== 'ninguno' ? 2 : 0), cooldown: 12,
    choices: [
      {
        label: 'Contratarle de verdad para que lo borre',
        effect(s) {
          addMonthlyCost(s, 'Exbecario recontratado', 1900, 12);
          addRep(s, -2);
          return 'Borra el hilo. Ahora cobra 1.900 € por "Responsable de Experiencia del Empleado". Reputación −2.';
        },
      },
      {
        label: 'Demandarle por difamación',
        effect(s) {
          addCash(s, -6000);
          addRep(s, -9);
          addFama(s, 5);
          return 'Efecto Streisand de manual: el hilo pasa de 2.000 a 2 millones de visualizaciones. Pagas 6.000 € al abogado. Reputación −9.';
        },
      },
      {
        label: 'Responder en LinkedIn: "La juventud no quiere esforzarse"',
        effect(s) {
          addFama(s, 8);
          addRep(s, -5);
          addHeatTrabajo(s, 5);
          return 'Te aplauden siete coaches y te critican 30.000 personas. La Inspección guarda el enlace. Fama +8, reputación −5.';
        },
      },
    ],
  },
  {
    id: 'primo_argentino',
    title: 'El primo de Buenos Aires',
    portrait: 'portrait_primo_argentino', image: 'ev_primo',
    text: () => 'Aparece Rodrigo Boomerez, primo segundo de Buenos Aires: "Che, Manolo, el tío Anselmo me prometió una parte del obrador. Lo tengo en un audio de WhatsApp de 2014."',
    weight: (s) => (s.month >= 3 ? 1 : 0), once: true,
    choices: [
      {
        label: 'Pagarle 30.000 € para que se vaya',
        effect(s) {
          addCash(s, -30000);
          return 'Rodrigo acepta el dinero y se queda a vivir en Santander igualmente. Te invita a asados.';
        },
      },
      {
        label: 'Hacerle socio de un negocio de empanadas',
        effect(s) {
          s.flags.primoSocio = true;
          s.unlocked.empanadas = true;
          log(s, '🔓 Desbloqueado: Empanadas El Gaucho Pasiego (gracias, primo).', 'good');
          return '"¡Empanadas, boludo! Mi abuela hacía las mejores de Palermo." Desbloqueas Empanadas El Gaucho Pasiego. Rodrigo se lleva un 10 % de sus ventas.';
        },
      },
      {
        label: 'Ir a juicio',
        effect(s) {
          if (chance(s, 0.5)) return 'El juez escucha el audio de WhatsApp: tu padre solo decía "Rodrigo, ¿has comido?". Ganas el juicio.';
          addCash(s, -60000);
          return 'El audio dice textualmente "el obrador es tuyo también, Rodri". Pagas 60.000 €.';
        },
      },
    ],
  },
  {
    id: 'premio_emprendedor',
    title: 'Premio Emprendedor del Año',
    portrait: 'portrait_alcalde', image: 'ev_premio',
    text: () => 'La Asociación de Comerciantes de los Valles Pasiegos te concede el premio "Emprendedor del Año". Eras el único candidato. La cena de gala la pagas tú.',
    weight: (s) => (s.month >= 6 ? 1 : 0), cooldown: 24,
    choices: [
      {
        label: 'Recogerlo con un discurso de 40 minutos (2.000 €)',
        effect(s) {
          addCash(s, -2000);
          addFama(s, 10);
          return 'Tu discurso empieza con "Yo empecé desde abajo" y no menciona a tu padre en ningún momento. Fama +10.';
        },
      },
      {
        label: 'Rechazarlo con humildad',
        effect(s) {
          addRep(s, 3);
          return 'Nadie se lo esperaba. Por un momento pareces una buena persona. Reputación +3.';
        },
      },
    ],
  },
  {
    id: 'sanidad',
    title: 'Inspección de Sanidad',
    portrait: 'portrait_inspector_sanidad', image: 'ev_sanidad',
    text: () => 'Sanidad se presenta en el obrador. El técnico olfatea uno de los bidones sin etiqueta. "¿Esto qué es?"',
    weight: (s) => (s.policies.ingredientes === 'misteriosa' ? 2 : 0), cooldown: 8,
    choices: [
      {
        label: '"Es la receta secreta de la abuela"',
        effect(s) {
          if (chance(s, 0.3)) return 'El técnico tiene una abuela pasiega y se emociona. Te deja ir con un aviso.';
          pay(s, 18000);
          addRep(s, -8);
          s.policies.ingredientes = 'margarina';
          return 'Analizan la "receta de la abuela": grasa de palma y algo que parece aceite de motor. Multa: 18.000 €. Te obligan a cambiar a margarina, como mínimo. Reputación −8.';
        },
      },
      {
        label: 'Volver a la mantequilla y pagar la sanción leve',
        effect(s) {
          pay(s, 6000);
          s.policies.ingredientes = 'mantequilla';
          return 'Multa de 6.000 € y vuelta a la mantequilla pasiega. Tu abuela respira tranquila desde el cielo.';
        },
      },
    ],
  },
  {
    id: 'rival_hipster',
    title: 'Abre la competencia',
    portrait: 'portrait_hipster', image: 'ev_rival',
    text: () => 'Abre "MASA — Sobaos de Masa Madre & Specialty Coffee": paredes de cemento, camareros con barba y sobaos a 6 € "de fermentación lenta". Te están robando clientela joven.',
    weight: (s) => (sobaoOutlets(s) >= 2 ? 1 : 0), cooldown: 18,
    choices: [
      {
        label: 'Guerra de precios',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 0.92, months: 4, label: 'Guerra de precios' });
          addRep(s, 2);
          return 'Bajas precios. Ganas menos, pero MASA cierra en tres meses. Ingresos de sobaos −8 % durante 4 meses.';
        },
      },
      {
        label: 'Copiarles la estética (20.000 €)',
        effect(s) {
          addCash(s, -20000);
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.1, months: 8, label: 'Estética hipster' });
          return 'Bombillas de filamento, madera reciclada y la palabra "craft" en todas partes. Ventas de sobaos +10 % durante 8 meses.';
        },
      },
      {
        label: 'Poner reseñas falsas de una estrella',
        effect(s) {
          if (chance(s, 0.5)) {
            addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.05, months: 4, label: 'Rival hundido' });
            return 'Tus 80 cuentas falsas surten efecto. MASA cierra. Vergonzoso, pero eficaz.';
          }
          addRep(s, -10);
          return 'Google descubre que las 80 reseñas salen de la misma IP: la del obrador. Sales en un reportaje. Reputación −10.';
        },
      },
    ],
  },
  {
    id: 'oferta_banco',
    title: 'El banco te quiere',
    portrait: 'portrait_banquero', image: 'ev_banco',
    text: () => 'El director de la Caja Cantábrica te invita a comer: "Manolo, tú eres un cliente estratégico. Te ampliamos la póliza en 200.000 €. Solo tienes que domiciliar la nómina, el seguro de hogar, el de vida, el del coche y comprarnos un plan de pensiones."',
    weight: (s) => (s.month >= 8 ? 0.8 : 0), cooldown: 24,
    choices: [
      {
        label: 'Aceptar el paquete (300 €/mes en seguros)',
        effect(s) {
          s.creditBonus += 200000;
          addMonthlyCost(s, 'Seguros vinculados del banco', 300);
          return 'Firmas 14 documentos sin leerlos. Tu límite de crédito sube en 200.000 €.';
        },
      },
      {
        label: 'Rechazar',
        effect() {
          return '"Ya volverás, Manolo. Siempre volvéis."';
        },
      },
    ],
  },
  {
    id: 'tertulia_tv',
    title: 'Invitado a una tertulia de televisión',
    portrait: 'portrait_presentadora', image: 'ev_tv',
    text: () => 'Un programa matinal nacional te invita a un debate: "¿Los jóvenes ya no quieren trabajar?". Te sientan entre una sindicalista y un economista de pelo largo.',
    weight: (s) => (s.fama >= 15 ? 1.2 : 0), cooldown: 12,
    choices: [
      {
        label: 'Modo boomer total',
        effect(s) {
          addFama(s, 12);
          addRep(s, -6);
          addMoral(s, -5);
          return '"¡Yo a su edad trabajaba 14 horas y era feliz!" (Tenías un padre con obrador.) Eres trending topic. Fama +12, reputación −6, moral −5.';
        },
      },
      {
        label: 'Moderado y conciliador',
        effect(s) {
          addFama(s, 4);
          addRep(s, 2);
          return 'Dices que "hay que escuchar a los jóvenes". Te sale tan poco natural que parece un deepfake. Fama +4, reputación +2.';
        },
      },
      {
        label: 'No ir',
        effect() {
          return 'Envían a otro empresario. Dice cosas peores que tú. Sientes envidia.';
        },
      },
    ],
  },
  {
    id: 'inversor_misterioso',
    title: 'Un inversor con maletín',
    portrait: 'portrait_inversor_misterioso', image: 'ev_maletin',
    text: () => 'Un señor con gafas de sol y acento difícil de ubicar quiere "invertir" 400.000 € en efectivo en tu empresa. "No preguntas, no facturas. Solo sobaos."',
    weight: (s) => (s.month >= 14 ? 0.7 : 0), once: true,
    choices: [
      {
        label: 'Aceptar el maletín',
        effect(s) {
          addCash(s, 400000);
          addHeatHacienda(s, 35);
          s.evaded += 90000;
          s.flags.blanqueo = true;
          return 'Cuentas 400.000 € en billetes de 500 en la mesa de la cocina. El radar de Hacienda se dispara (+35). Esto puede salir muy caro.';
        },
      },
      {
        label: 'Rechazarlo educadamente',
        effect() {
          return 'El señor sonríe, deja una tarjeta sin nombre y se va. Notas que alguien te sigue durante una semana.';
        },
      },
    ],
  },
  {
    id: 'elecciones_sindicales',
    title: 'Elecciones sindicales',
    portrait: 'portrait_empleada_maripili', image: 'ev_sindicato',
    text: (s) => `Con ${employees(s)} trabajadores, toca elegir delegados sindicales. Maripili se presenta.`,
    weight: (s) => (employees(s) >= 30 ? 1 : 0), cooldown: 36,
    choices: [
      {
        label: 'Dejar que voten libremente',
        effect(s) {
          addMoral(s, 6);
          addHeatTrabajo(s, 3);
          return 'Maripili sale delegada. Conoce el Estatuto de los Trabajadores de memoria. Moral +6.';
        },
      },
      {
        label: 'Presentar a tu sobrino Kevin',
        effect(s) {
          addMoral(s, -6);
          if (chance(s, 0.5)) {
            addHeatTrabajo(s, -8);
            return 'Kevin gana por dos votos (el suyo y el tuyo, que no eres trabajador). Nadie se queja... oficialmente. Moral −6.';
          }
          addHeatTrabajo(s, 10);
          return 'Kevin saca un voto. Maripili lo cuenta en la asamblea con todo detalle. Moral −6, radar de Inspección +10.';
        },
      },
    ],
  },
  {
    id: 'robot_aleman',
    title: 'Un comercial alemán',
    portrait: 'portrait_comercial', image: 'ev_robot',
    text: () => 'Herr Klaus Brötchen, de Teigmaschinen GmbH, te ofrece una demostración del robot amasador. "Con 20 % Rabatt, nur für Sie."',
    weight: (s) => (!s.obrador.upgrades.includes('robot') && s.obrador.upgrades.includes('linea2') ? 1 : 0), once: true,
    choices: [
      {
        label: 'Comprarlo con descuento (144.000 €)',
        available: (s) => s.cash >= 144000,
        effect(s) {
          addCash(s, -144000);
          s.obrador.upgrades.push('robot');
          return 'El robot llega en un camión de Múnich. Le pones de nombre "Anselmo II". Capacidad +15.000 uds/mes.';
        },
      },
      {
        label: '"Danke, pero no"',
        effect() {
          return 'Klaus te deja un folleto de 80 páginas en alemán. Lo usas para calzar una mesa.';
        },
      },
    ],
  },
  {
    id: 'empanada_autentica',
    title: 'Polémica en las empanadas',
    portrait: 'portrait_primo_argentino', image: 'ev_empanadas',
    text: () => 'Un influencer argentino denuncia que tus empanadas "llevan sobao triturado en la masa". El vídeo se llama "ESPAÑOLES ARRUINANDO LA EMPANADA".',
    weight: (s) => (has(s, 'empanadas') ? 1.2 : 0), cooldown: 18,
    choices: [
      {
        label: 'Abrazarlo: "Empanada Pasiega, la fusión"',
        effect(s) {
          s.trends.empanadas = Math.min(1.5, s.trends.empanadas + 0.12);
          addFama(s, 4);
          return 'El hate genera curiosidad. Las colas dan la vuelta a la manzana. Empanadas +12 %, fama +4.';
        },
      },
      {
        label: 'Negarlo todo',
        effect(s) {
          addRep(s, -3);
          return 'Un análisis de laboratorio confirma que sí, llevan sobao. Reputación −3.';
        },
      },
    ],
  },
  {
    id: 'ola_calor',
    title: 'Ola de calor',
    portrait: 'portrait_manolo_scared', image: 'ev_calor',
    text: () => '46 °C en media España. Nadie quiere sobaos. Los que hay en las vitrinas se derriten como en un cuadro de Dalí.',
    weight: (s) => ([5, 6, 7].includes(s.month % 12) ? 2 : 0), cooldown: 10,
    choices: [
      {
        label: 'Lanzar el "Sobao Helado" (8.000 €)',
        effect(s) {
          addCash(s, -8000);
          if (chance(s, 0.6)) {
            addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.08, months: 2, label: 'Sobao helado' });
            return 'Sobao congelado con nata. Un éxito inesperado. Ventas de sobaos +8 % durante 2 meses.';
          }
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 0.92, months: 1, label: 'Calor' });
          return 'El sobao helado tiene la textura de un ladrillo frío. Ventas −8 % este mes.';
        },
      },
      {
        label: 'Aguantar',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 0.88, months: 1, label: 'Calor' });
          return 'Ventas de sobaos −12 % este mes. Manolo se pasa el día en el aire acondicionado del Audi.';
        },
      },
    ],
  },
  {
    id: 'coach',
    title: 'Un coach de vida',
    portrait: 'portrait_coach', image: 'ev_coach',
    text: () => 'Un coach llamado Iker "Mindset" Lasa te ofrece un retiro en Ibiza: "Manolo, tienes un tiburón dentro. Yo te lo saco. 9.000 € y 3 días de ayahuasca."',
    weight: (s) => (s.fama >= 10 ? 0.8 : 0), once: true,
    choices: [
      {
        label: 'Ir al retiro (9.000 €)',
        effect(s) {
          addCash(s, -9000);
          addFama(s, 8);
          return 'Vuelves bronceado, descalzo y diciendo "abundancia" cada tres frases. Tu LinkedIn se multiplica. Fama +8.';
        },
      },
      {
        label: 'Contratar a Iker para la Academy',
        available: (s) => has(s, 'academy'),
        effect(s) {
          addMonthlyCost(s, 'Iker Mindset (Academy)', 2500);
          addFama(s, 6);
          addMod(s, { kind: 'revenue', category: 'formacion', factor: 1.4, months: 12, label: 'Iker Mindset' });
          return 'Iker se convierte en la estrella de la Boomerez Business Academy. Ingresos de la Academy +40 % durante un año. Cobra 2.500 €/mes.';
        },
      },
      {
        label: '"Yo ya nací tiburón"',
        effect(s) {
          addFama(s, 1);
          return 'Iker se marcha a captar a otro empresario. Lo verás en Instagram con un concejal.';
        },
      },
    ],
  },
  {
    id: 'erte',
    title: 'La idea del ERTE',
    portrait: 'portrait_gestor_paco', image: 'ev_erte',
    text: () => 'Paco, el gestor, se acerca con un café: "Manolo, se me ha ocurrido algo. Metemos a media plantilla en un ERTE... pero que sigan viniendo a trabajar. Lo paga el Estado."',
    weight: (s) => (s.month >= 6 && employees(s) >= 15 ? 0.8 : 0), cooldown: 36,
    choices: [
      {
        label: 'Hacerlo',
        effect(s) {
          const ahorro = employees(s) * 700;
          addCash(s, ahorro);
          addHeatTrabajo(s, 25);
          addMoral(s, -6);
          if (chance(s, 0.25)) addExpediente(s, 1, 'fraude en ERTE');
          return `Ahorras ${money(ahorro)} este mes. El radar de Inspección se dispara (+25). Algunos empleados cobran del SEPE y trabajan para ti a la vez. Es exactamente tan ilegal como suena.`;
        },
      },
      {
        label: '"Paco, eso es fraude"',
        effect(s) {
          addHeatHacienda(s, -3);
          return 'Paco se encoge de hombros: "Era por decir." Te sientes extrañamente orgulloso de ti mismo.';
        },
      },
    ],
  },
  {
    id: 'jefe_infiltrado',
    title: 'Jefe infiltrado',
    portrait: 'portrait_presentadora', image: 'ev_jefe_infiltrado',
    text: () => 'Un programa de televisión te propone disfrazarte de empleado nuevo y trabajar una semana de incógnito en una de tus tiendas. Con bigote postizo (encima del tuyo).',
    weight: (s) => (s.fama >= 20 && s.businesses.length >= 4 ? 1 : 0), once: true,
    choices: [
      {
        label: 'Aceptar y ser sincero en cámara',
        effect(s) {
          addCash(s, -employees(s) * 50);
          addRep(s, 8);
          addMoral(s, 8);
          addFama(s, 6);
          return 'Descubres que tu plantilla trabaja muchísimo y lloras en el capítulo final. Repartes pagas y abrazos. Reputación +8, moral +8, fama +6.';
        },
      },
      {
        label: 'Aceptar y montar un guion "motivacional"',
        effect(s) {
          addFama(s, 10);
          if (chance(s, 0.5)) {
            addRep(s, -10);
            addMoral(s, -6);
            return 'Un cámara filtra el making-of: les pedías a los empleados que "lloraran más fuerte". Fama +10, reputación −10, moral −6.';
          }
          addRep(s, 3);
          return 'El montaje te deja como un líder cercano. Nadie se cree nada, pero hay audiencia. Fama +10, reputación +3.';
        },
      },
      {
        label: 'Rechazarlo: "Yo no me disfrazo de pobre"',
        effect(s) {
          addFama(s, 2);
          return 'La frase se filtra igualmente. Fama +2.';
        },
      },
    ],
  },
  {
    id: 'okupas',
    title: 'Okupas en un piso',
    portrait: 'portrait_vecina', image: 'ev_okupas',
    text: () => 'Se ha colado gente en uno de tus pisos. Tu vecina te llama a las 7 de la mañana para contártelo con todo lujo de detalles.',
    weight: (s) => (has(s, 'vivienda') || has(s, 'airbnb') ? 0.8 : 0), cooldown: 24,
    choices: [
      {
        label: 'Vía judicial',
        effect(s) {
          addCash(s, -4000);
          addMod(s, { kind: 'revenue', category: 'inmobiliario', factor: 0.9, months: 6, label: 'Okupas' });
          return 'Abogado, juzgado y paciencia. Seis meses con ingresos inmobiliarios un 10 % más bajos y 4.000 € en costas.';
        },
      },
      {
        label: 'Contratar a una empresa de "desokupación" (12.000 €)',
        effect(s) {
          addCash(s, -12000);
          addRep(s, -5);
          return 'Llegan cuatro armarios con camiseta negra y un pitbull. Recuperas el piso en dos horas y sales en un vídeo viral. Reputación −5.';
        },
      },
      {
        label: 'Resulta que es tu sobrino Kevin',
        effect(s) {
          addMoral(s, 1);
          return 'Kevin "estaba guardando el piso para que no entraran okupas". Le pones a trabajar en el obrador. Problema resuelto (más o menos).';
        },
      },
    ],
  },
  {
    id: 'sobao_igp',
    title: 'El Consejo Regulador del Sobao',
    portrait: 'portrait_padre_anselmo', image: 'ev_igp',
    text: () => 'El Consejo Regulador de la Indicación Geográfica "Sobao Pasiego" te avisa: o vuelves a la mantequilla de verdad o te retiran el sello. Tu padre fue su presidente durante 20 años.',
    weight: (s) => (s.policies.ingredientes !== 'mantequilla' ? 1.2 : 0), cooldown: 24,
    choices: [
      {
        label: 'Volver a la mantequilla pasiega',
        effect(s) {
          s.policies.ingredientes = 'mantequilla';
          addRep(s, 5);
          return 'El sobao vuelve a saber a sobao. Los costes suben, pero los clientes lo notan. Reputación +5.';
        },
      },
      {
        label: 'Renunciar al sello: "El mercado manda"',
        effect(s) {
          addRep(s, s.brand === 'maison' ? -12 : -6);
          return `Tus cajas pasan a decir "bollo tipo sobao". La prensa regional te crucifica. Reputación ${s.brand === 'maison' ? '−12' : '−6'}.`;
        },
      },
    ],
  },
  {
    id: 'riders',
    title: 'Plataforma de reparto a domicilio',
    portrait: 'portrait_comercial', image: 'ev_riders',
    text: () => 'Una app de reparto te ofrece llevar tus hamburguesas y empanadas a domicilio. Se queda con el 35 % de cada pedido, pero vendes más.',
    weight: (s) => (has(s, 'smash') || has(s, 'empanadas') ? 1 : 0), once: true,
    choices: [
      {
        label: 'Entrar en la app',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'hosteleria', factor: 1.12, months: 24, label: 'Reparto a domicilio' });
          addMonthlyCost(s, 'Comisiones de la app de reparto', 1500 * s.businesses.filter((b) => ['smash', 'empanadas'].includes(b.type)).length, 24);
          return 'Las ventas de hostelería suben un 12 % durante dos años. Las comisiones se comen buena parte. Los riders van en bici bajo la lluvia, como manda la economía colaborativa.';
        },
      },
      {
        label: 'Montar tu propia flota de riders "autónomos"',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'hosteleria', factor: 1.15, months: 24, label: 'Riders Boomerez' });
          addHeatTrabajo(s, 15);
          return 'Riders Boomerez: chalecos naranjas y contrato mercantil. Ventas de hostelería +15 %. La Inspección ya conoce esta película (radar +15).';
        },
      },
      {
        label: 'No: "La comida se come en el local"',
        effect(s) {
          addRep(s, 1);
          return 'Tu purismo gusta a cuatro señores. Reputación +1.';
        },
      },
    ],
  },
  {
    id: 'fondos_europeos',
    title: 'Fondos europeos para digitalizar',
    portrait: 'portrait_gestor_paco', image: 'ev_fondos',
    text: () => 'Paco te cuenta que hay fondos europeos para la "transformación digital de pymes". Hay que rellenar 140 páginas de formularios. O inventárselas.',
    weight: (s) => (s.month >= 8 ? 0.8 : 0), once: true,
    choices: [
      {
        label: 'Pedirlos honradamente',
        effect(s) {
          if (chance(s, 0.5)) {
            addCash(s, 40000);
            return 'Tras ocho meses de papeleo, llegan 40.000 €. Te compras una tableta para el obrador y cinco ordenadores.';
          }
          return 'Te lo deniegan porque el formulario 34-B iba grapado en vez de clipado. Nada.';
        },
      },
      {
        label: 'Facturas infladas de "consultoría digital"',
        effect(s) {
          addCash(s, 90000);
          addHeatHacienda(s, 20);
          s.evaded += 30000;
          return 'Tu cuñado Jonathan factura 90.000 € por "implantar un ecosistema blockchain" (una web en WordPress). Cobras. El radar de Hacienda sube 20.';
        },
      },
      {
        label: 'Pasar: "Europa nos roba"',
        effect() {
          return 'No pides nada, pero te quejas igual en la sobremesa.';
        },
      },
    ],
  },
  {
    id: 'peor_jefe',
    title: 'Premio al Peor Jefe del Año',
    portrait: 'portrait_empleada_maripili', image: 'ev_peor_jefe',
    text: () => 'Un periódico digital organiza el premio "Peor Jefe del Año" a partir de las votaciones de trabajadores. Vas primero, con mucha ventaja.',
    weight: (s) => (s.moral < 30 ? 2 : 0), cooldown: 24,
    choices: [
      {
        label: 'Pedir perdón públicamente y subir sueldos',
        effect(s) {
          s.policies.salario = 'convenio';
          addMoral(s, 10);
          addRep(s, 3);
          return 'Tu comunicado parece escrito por un abogado (lo es), pero la subida es real. Moral +10, reputación +3.';
        },
      },
      {
        label: 'Ir a recogerlo en persona',
        effect(s) {
          addFama(s, 10);
          addRep(s, -6);
          return 'Te presentas con esmoquin y das un discurso de agradecimiento. Media España te odia; la otra media te sigue en redes. Fama +10, reputación −6.';
        },
      },
      {
        label: 'Amenazar al periódico con una demanda',
        effect(s) {
          addRep(s, -8);
          addCash(s, -5000);
          return 'El periódico publica tu carta de amenaza en portada. Don Cosme te cobra 5.000 € por escribirla. Reputación −8.';
        },
      },
    ],
  },
  {
    id: 'mantequilla_cara',
    title: 'La mantequilla se dispara',
    portrait: 'portrait_manolo_scared', image: 'ev_mantequilla',
    text: () => 'Una sequía en el norte de Europa dispara el precio de la mantequilla. Tus proveedores te suben la factura de golpe.',
    weight: (s) => (s.policies.ingredientes === 'mantequilla' && s.month >= 6 ? 0.8 : 0), cooldown: 30,
    choices: [
      {
        label: 'Absorber el sobrecoste (1 € extra por sobao durante 3 meses)',
        effect(s) {
          const extra = Math.round((s.lastReport?.produced ?? 8000) * 1);
          addMonthlyCost(s, 'Sobrecoste de la mantequilla', extra, 3);
          return `Mantienes la receta. Te costará unos ${money(extra)} al mes durante tres meses.`;
        },
      },
      {
        label: 'Pasarte "temporalmente" a margarina',
        effect(s) {
          s.policies.ingredientes = 'margarina';
          return 'Temporalmente. Como todo lo temporal en España. (Puedes volver a la mantequilla en el obrador cuando quieras.)';
        },
      },
    ],
  },
  {
    id: 'vanessa_vuelve',
    title: 'Vanessa ha terminado la carrera',
    portrait: 'portrait_hija_vanessa', image: 'ev_vanessa',
    text: (s) =>
      s.flags.vanessaADE
        ? 'Vanessa ha terminado ADE con matrícula de honor... y un máster en Derecho Laboral que nadie le pidió. Ha leído tus nóminas.'
        : 'Vanessa ha terminado Bellas Artes y te propone rediseñar toda la imagen de la marca. Gratis. "Bueno, a cambio de que pagues el convenio."',
    weight: (s) => ((s.flags.vanessaADE || s.flags.vanessaArtista) && s.month >= 30 ? 2 : 0), once: true,
    choices: [
      {
        label: 'Escucharla',
        effect(s) {
          if (s.flags.vanessaADE) {
            Object.assign(s.policies, { salario: 'convenio', horas: 'pagadas', becarios: 'ninguno' });
            addHeatTrabajo(s, -30);
            addMoral(s, 12);
            return 'Vanessa te regulariza la empresa en una semana. La Inspección pierde interés por ti (radar −30) y la plantilla la adora. Moral +12.';
          }
          s.policies.salario = 'convenio';
          addRep(s, 8);
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.08, months: 24, label: 'Rediseño de Vanessa' });
          return 'Nuevo logo, cajas preciosas y un escaparate que sale en revistas de diseño. Ventas de sobaos +8 % durante dos años. Reputación +8. Salarios de convenio.';
        },
      },
      {
        label: '"Cuando tengas tu empresa, decides tú"',
        effect(s) {
          addMoral(s, -3);
          s.flags.vanessaRival = true;
          return 'Vanessa se va... a montar una cooperativa de repostería con tres de tus mejores pasteleras. Moral −3.';
        },
      },
    ],
  },
  {
    id: 'cena_cunado',
    title: 'Cena familiar',
    portrait: 'portrait_cunado_jonathan', image: 'ev_cena',
    text: () => 'Cena en casa de tu suegra. Jonathan se pasa la noche explicando que "lo tuyo con los sobaos lo hace él mejor con un dropshipping de fundas de móvil".',
    weight: () => 0.6, cooldown: 18,
    choices: [
      {
        label: 'Sacar la calculadora y enseñarle tus números',
        effect(s) {
          addFama(s, 1);
          return 'Le enseñas la cuenta de resultados en el móvil. Jonathan responde con un pantallazo de su Lamborghini en un videojuego. Empate técnico.';
        },
      },
      {
        label: 'Ofrecerle un puesto de "Director de Innovación"',
        effect(s) {
          addMonthlyCost(s, 'Sueldo de Jonathan (Dir. Innovación)', 2500);
          addFama(s, 3);
          return 'Jonathan acepta, se imprime tarjetas y monta un "laboratorio de ideas" en el almacén. Cuesta 2.500 € al mes. Ideas, de momento, ninguna.';
        },
      },
    ],
  },
];

export const EVENTS = [...BASE_EVENTS, ...MACRO_EVENTS, ...SYSTEM_EVENTS, ...ARC_EVENTS, ...EXTRA_EVENTS];

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
