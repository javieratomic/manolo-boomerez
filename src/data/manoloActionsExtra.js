// Acciones adicionales de Manolo (una por mes, con el mismo formato que las de manoloActions.js).
import { chance, int, pick } from '../core/rng.js';
import { addCash, addFama, addRep, addMoral, addHeatHacienda, addHeatTrabajo } from '../core/helpers.js';
import { BUSINESS_TYPES } from './businesses.js';
import { CITY_BY_ID } from './cities.js';

// Como en LinkedIn: cuanto más famoso es ya Manolo, menos fama le da otra foto.
const famaGain = (s, min, max) => Math.max(1, Math.round(int(s, min, max) * (1 - s.fama / 130)));

export const EXTRA_ACTIONS = [
  {
    id: 'visita_sorpresa',
    name: 'Visita sorpresa a uno de tus negocios',
    desc: 'Moral y reputación si te limitas a mirar. Si te pones a "ayudar", puede acabar en vídeo.',
    icon: 'icon_action_visita_sorpresa', emoji: '🕶️',
    run(s) {
      const own = s.businesses.filter((b) => b.mode !== 'franquicia' && (BUSINESS_TYPES[b.type]?.staff ?? 0) > 0);
      const b = own.length ? pick(s, own) : null;
      const where = b ? `tu ${BUSINESS_TYPES[b.type].short} de ${CITY_BY_ID[b.city]?.name ?? 'provincias'}` : 'el obrador de Selaya';
      const r = int(s, 1, 10);
      if (r <= 5) {
        addMoral(s, 3);
        addRep(s, 2);
        return `Te presentas sin avisar en ${where}, con gabardina y gafas de sol, como en las películas de espías. Todo funciona como un reloj. La encargada te ofrece un café y te explica, con mucha paciencia, cómo se hace lo que tú creías que hacías tú. Moral +3, reputación +2.`;
      }
      if (r <= 8) {
        addCash(s, -1500);
        addMoral(s, 5);
        return `En ${where} descubres que la cámara frigorífica lleva un mes goteando y que la plantilla la mantiene viva con cinta americana y fe. Por una vez escuchas, llamas al técnico y lo pagas en el acto: 1.500 €. Moral +5.`;
      }
      addRep(s, -5);
      addFama(s, 3);
      addMoral(s, -3);
      return `En ${where} decides enseñar "cómo se hacen las cosas de verdad": te pones a ayudar, rompes la cafetera del personal y le explicas a un cliente de toda la vida lo que es la excelencia. Alguien lo graba. Reputación −5, fama +3, moral −3.`;
    },
  },
  {
    id: 'congreso',
    name: 'Ponencia en un congreso de emprendedores (3.000 €)',
    desc: 'Fama (menos cuanto más famoso eres). Puede salir un banquero... o una pregunta incómoda.',
    icon: 'icon_action_congreso', emoji: '🎤', cost: 3000,
    run(s) {
      addCash(s, -3000);
      const f = famaGain(s, 5, 9);
      addFama(s, f);
      const intro = 'Pagas 3.000 € de "patrocinio" para dar la ponencia inaugural del III Congreso Nacional de Emprendedores Disruptivos, en el salón de un hotel de polígono. Título: "De Selaya al mundo: escalar sin red".';
      const r = int(s, 1, 10);
      if (r <= 2) {
        s.creditBonus += 50000;
        return `${intro}\n\nAl acabar se te acerca el director de riesgos de un banco regional: le ha encantado la diapositiva del tiburón. Te amplía la póliza en 50.000 €. Fama +${f}.`;
      }
      if (r <= 5) {
        addRep(s, -4);
        return `${intro}\n\nEn el turno de preguntas, una estudiante levanta la mano: "¿Y cuánto le dejó su padre para empezar?". El silencio dura once segundos, y alguien lo cronometra. Fama +${f}, reputación −4.`;
      }
      return `${intro}\n\nHablas cincuenta minutos en un turno de veinte. Te aplauden con muchas ganas, sobre todo cuando terminas. Fama +${f}.`;
    },
  },
  {
    id: 'golf',
    name: 'Golf con un exministro (4.000 €)',
    desc: 'Contactos al más alto nivel: puede calmar a Hacienda... o salir en la foto equivocada.',
    icon: 'icon_action_golf', emoji: '⛳', cost: 4000,
    run(s) {
      addCash(s, -4000);
      addFama(s, 2);
      const intro = 'Dieciocho hoyos con Don Baltasar Pinedo, exministro de Fomento Rural y hoy consejero de nueve empresas a las que no sabría situar en un mapa. Pagas tú el campo, el carrito y el aperitivo: 4.000 €.';
      const r = int(s, 1, 10);
      if (r <= 4) {
        addHeatHacienda(s, -8);
        return `${intro}\n\nEn el hoyo 12 te presenta a su asesor fiscal, un señor que habla muy bajito y sabe muchísimo. En una tarde, te deja los papeles más ordenados que la letra de tu padre. Radar de Hacienda −8, fama +2.`;
      }
      if (r <= 7) {
        return `${intro}\n\nDon Baltasar se pasa los dieciocho hoyos empezando frases con "cuando yo era ministro" y te gana por trece golpes. Te llevas una gorra con su escudo y ninguna idea. Fama +2.`;
      }
      addRep(s, -5);
      addHeatHacienda(s, 6);
      addFama(s, 3);
      return `${intro}\n\nAl día siguiente, la foto de los dos en el green abre la sección de tribunales: Don Baltasar está investigado en el "caso Hoyo 19", por unas comisiones en campos de golf. Tú sales sonriendo y con el pulgar levantado. Reputación −5, radar de Hacienda +6, fama +5.`;
    },
  },
  {
    id: 'portada',
    name: 'Posar para la portada de una revista de negocios (2.500 €)',
    desc: 'Mucha fama. Pero la entrevista la hace una periodista que pregunta.',
    icon: 'icon_action_portada', emoji: '📸', cost: 2500,
    run(s) {
      addCash(s, -2500);
      const f = famaGain(s, 6, 10);
      addFama(s, f);
      const intro = 'La revista "Líderes & Capital" te dedica la portada a cambio de un "reportaje patrocinado" de 2.500 €. Posas de brazos cruzados delante del obrador, con la camisa blanca remangada y la mirada perdida en el horizonte (en la gasolinera de enfrente).';
      const p = s.policies;
      const dirty = p.salario !== 'convenio' || p.horas !== 'pagadas' || p.becarios !== 'ninguno';
      if (dirty && chance(s, 0.35)) {
        addRep(s, -5);
        addMoral(s, -3);
        return `${intro}\n\nEn la entrevista se te escapa: "Mis empleados son como de la familia: no se les paga, se les quiere." La frase sale en grande, entre comillas, y aparece recortada y pegada en todos los vestuarios del grupo. Fama +${f}, reputación −5, moral −3.`;
      }
      if (chance(s, 0.15)) {
        addFama(s, 3);
        addRep(s, -2);
        return `${intro}\n\nEl número sale con un titular que no esperabas, "El joven emprendedor de 55 años", y en la sección de curiosidades, entre un pulpo que juega al ajedrez y un pueblo sin cobertura. Fama +${f + 3}, reputación −2.`;
      }
      addRep(s, 1);
      return `${intro}\n\nLa portada queda espectacular. Tu madre compra veinte ejemplares y los reparte a la salida de misa. Fama +${f}, reputación +1.`;
    },
  },
  {
    id: 'mentor',
    name: 'Mentorizar a una joven emprendedora',
    desc: 'Manolo comparte su sabiduría. Lo difícil es que alguien la quiera.',
    icon: 'icon_action_mentor', emoji: '🎓',
    run(s) {
      const intro = 'La cámara de comercio te asigna una "mentorizada": Nerea, 24 años, ingeniera, con una cooperativa de reparto en bicicleta que ya da beneficios. Te escucha dos horas en una cafetería, con la libreta abierta.';
      const r = int(s, 1, 10);
      if (r <= 4) {
        addFama(s, 4);
        return `${intro}\n\nNo apunta nada de lo que dices, pero te da las gracias en público "por recordarle por qué hace las cosas como las hace". Tú lo compartes como un elogio. Fama +4.`;
      }
      if (r <= 7) {
        addHeatHacienda(s, -6);
        addRep(s, 1);
        return `${intro}\n\nA la media hora, Nerea te pide el portátil y te reorganiza la facturación con una hoja de cálculo que entiende hasta Paco. Al final, el mentorizado eres tú. Radar de Hacienda −6, reputación +1.`;
      }
      addRep(s, -4);
      addFama(s, 3);
      addHeatTrabajo(s, 4);
      return `${intro}\n\nLe explicas con todo detalle tu "truco de los becarios". Una semana después, Nerea lo cuenta en un pódcast de emprendimiento como ejemplo de lo que no se debe hacer. Con tu nombre. Reputación −4, fama +3, radar de Inspección +4.`;
    },
  },
];
