// Cartas de la cartilla de Doña Remedios: vence el préstamo, se entera de algo, rescata a su hijo del
// concurso y lee las nóminas en el cocido. La opción honrada va siempre la primera.
import { chance } from '../core/rng.js';
import { addMoral, clamp, money, dateLabel } from '../core/helpers.js';
import { addStress } from '../core/life.js';
import { repayMama, embargar, rescue, addConfianza, owesMama, hasCond, MAMA, COND_TEXT, newCartilla, apunte } from '../core/cartilla.js';
import { LEGAL_LABOR } from './policies.js';

// Las cartas aguantan que no haya cartilla (partidas viejas o el test de todas las cartas).
const cart = (s) => (s.cartilla ||= newCartilla(s.difficulty));
const fecha = (m) => dateLabel(m).toLowerCase().replace(' ', ' de ');
const legalLabor = (s) => s.policies.salario === 'convenio' && s.policies.horas === 'pagadas' && s.policies.becarios === 'ninguno';

export const REMEDIOS_EVENTS = [
  {
    id: 'cartilla_vence',
    title: 'Vence la cartilla de tu madre',
    portrait: 'portrait_madre', image: 'ev_cartilla_vence',
    text: (s) => {
      const c = cart(s);
      return `Doña Remedios te espera en la cocina con la libreta abierta por la última página y el bastón apoyado en la mesa. Mira el reloj de pared.\n\n"Manolo, hoy vence lo que me pediste en ${fecha(c.condFrom ?? s.month)}. Me debes ${money(c.owed)}. No te cobro intereses, pero tampoco me tomes el pelo."`;
    },
    weight: () => 0,
    choices: [
      {
        key: 'devolver',
        label: (s) => `Devolver los ${money(cart(s).owed)}`,
        hint: 'Confianza +10. Si la caja no llega, tira la póliza al cerrar el mes.',
        effect(s) {
          const c = cart(s);
          if (!owesMama(s)) return 'Ya estaba todo pagado. Tu madre te da un táper de croquetas igualmente.';
          const res = repayMama(s, 'devolver');
          addConfianza(s, 10);
          c.devueltos++;
          return `Le das un sobre con ${money(res.amount)}. Lo cuenta dos veces, delante de ti, y lo apunta en la cartilla con buena letra. Confianza +10.\n\n«${res.refran}»`;
        },
      },
      {
        key: 'prorroga',
        label: `Pedirle seis meses más`,
        hint: 'Una sola vez por préstamo. Confianza −10, familia −3.',
        available: (s) => !cart(s).prorroga,
        effect(s) {
          const c = cart(s);
          c.prorroga = true;
          c.due = s.month + MAMA.PRORROGA;
          addConfianza(s, -10);
          s.familia = clamp((s.familia ?? 60) - 3);
          return `"Seis meses. Ni uno más, que a mí no me quedan tantos." Lo apunta: vence en ${fecha(c.due)}. Confianza −10, familia −3.\n\n«${apunte(s, 'Prórroga de seis meses', 'tarde')}»`;
        },
      },
      {
        key: 'no_tengo',
        label: '"No tengo, mamá"',
        hint: 'Embargo materno: se cobra con tu capricho más caro o con el mostrador de Selaya. Confianza a 0, familia −15, reputación −3, fama −3 y no te presta en dos años.',
        effect(s) {
          if (!owesMama(s)) return 'No le debías nada. Tu madre te mira raro.';
          const text = embargar(s);
          return `${text}\n\nEn el valle se sabe todo: "Al Manolo lo ha embargado su madre". Familia −15, reputación −3, fama −3.`;
        },
      },
    ],
  },
  {
    id: 'cartilla_enfado',
    title: 'Me ha dicho la Puri que...',
    portrait: 'portrait_madre', image: 'ev_cartilla_enfado',
    text: (s) => {
      const what = hasCond(s, 'ley') && !legalLabor(s) ? 'que a las chicas les pagas por debajo de lo que manda la ley' : 'que en el obrador ya no se usa mantequilla';
      return `Doña Remedios te llama al móvil desde el teléfono fijo de casa, el del cable rizado.\n\n"Manolo, me ha dicho la Puri ${what}. Te dejé el dinero con una condición. ¿Me estás tomando por tonta?"`;
    },
    weight: () => 0,
    choices: [
      {
        key: 'volver',
        label: 'Volver atrás: "Tienes razón, mamá"',
        hint: 'Las condiciones vuelven a lo que prometiste y no podrás cambiarlas mientras le debas. Confianza −10.',
        effect(s) {
          const c = cart(s);
          if (hasCond(s, 'ley')) Object.assign(s.policies, LEGAL_LABOR);
          if (hasCond(s, 'mantequilla')) s.policies.ingredientes = 'mantequilla';
          c.enfado = false;
          c.firme = true; // ya no se puede volver a romper hasta devolverle el dinero
          addConfianza(s, -10);
          return `"Así me gusta. Y ni se te ocurra volver a las andadas mientras me debas." Cuelga sin despedirse, que es como se despide cuando está contenta. Confianza −10.\n\n«${apunte(s, 'Promesa renovada', 'enfado')}»`;
        },
      },
      {
        key: 'devolver',
        label: (s) => `Devolvérselo ya (${money(cart(s).owed)})`,
        hint: 'Te liberas de la condición. Confianza −15.',
        effect(s) {
          if (!owesMama(s)) return 'No le debías nada. Cuelga igualmente.';
          const res = repayMama(s, 'enfado');
          addConfianza(s, -15);
          return `Le haces una transferencia de ${money(res.amount)} mientras sigue hablando. "No es el dinero, Manolo. Es la educación." Confianza −15.\n\n«${res.refran}»`;
        },
      },
      {
        key: 'empresa',
        label: '"Son cosas de la empresa, mamá"',
        hint: 'Te lo reclama en 3 meses. Confianza −30, familia −10.',
        effect(s) {
          const c = cart(s);
          c.due = Math.min(c.due ?? Infinity, s.month + 3);
          addConfianza(s, -30);
          s.familia = clamp((s.familia ?? 60) - 10);
          return `"¿Cosas de la empresa? La empresa la levantó tu padre con estas manos." Te lo reclama para ${fecha(c.due)}. Confianza −30, familia −10.\n\n«${apunte(s, 'Discusión por teléfono', 'enfado')}»`;
        },
      },
    ],
  },
  {
    id: 'cartilla_rescate',
    title: 'Tu madre, en el banco',
    portrait: 'portrait_madre', image: 'ev_cartilla_rescate',
    text: (s) => {
      const c = cart(s);
      const need = Math.max(0, -s.cash) + MAMA.RESCUE_CUSHION;
      return `Dos meses en descubierto. Antes de que llegue el concurso, Doña Remedios se presenta en la sucursal de la Caja Cantábrica, golpea el mostrador con el bastón y pide hablar con el director.\n\n"Mi hijo es un desastre, pero es mi hijo. ¿Cuánto debe?" Te hacen falta unos ${money(need)}; en la cartilla tiene ${money(c.saldo)}.`;
    },
    weight: () => 0,
    choices: [
      {
        key: 'aceptar',
        label: 'Aceptar, con la cabeza baja',
        hint: (s) => `Te presta hasta ${money(Math.min(Math.max(0, -s.cash) + MAMA.RESCUE_CUSHION, cart(s).saldo))} a ${MAMA.RESCUE_TERM} meses, con dos condiciones: ${COND_TEXT.ley.toLowerCase()} y ${COND_TEXT.mantequilla.toLowerCase()}.`,
        effect(s) {
          const res = rescue(s, false);
          return `Firma delante del director, que no se atreve a mirarla. Te presta ${money(res.amount)} y se te acaba el descubierto. Condiciones: ${COND_TEXT.ley.toLowerCase()} y ${COND_TEXT.mantequilla.toLowerCase()}.\n\n«${res.refran}»`;
        },
      },
      {
        key: 'casa',
        label: 'Aceptar, y que hipoteque la casa de la calle Mayor',
        hint: `Solo si la cartilla no llega: ${money(MAMA.CASA)} más. Familia −10.`,
        available: (s) => !cart(s).casa && cart(s).saldo < Math.max(0, -s.cash) + MAMA.RESCUE_CUSHION,
        effect(s) {
          const res = rescue(s, true);
          return `Tu madre hipoteca la casa donde naciste para salvarte. Te presta ${money(res.amount)}. Merche no te habla en una semana. Familia −10.\n\n«${res.refran}»`;
        },
      },
      {
        key: 'solo',
        label: '"Mamá, yo puedo solo"',
        hint: 'Sigues en descubierto: al tercer mes, concurso de acreedores.',
        effect() {
          return '"Como tu padre. Igual de cabezota." Se va de la sucursal sin despedirse, pero deja un táper de croquetas en el mostrador.';
        },
      },
    ],
  },
  {
    id: 'remedios_domingo',
    title: 'Las nóminas en el cocido',
    portrait: 'portrait_madre', image: 'ev_remedios_domingo',
    text: () => 'Domingo de cocido montañés en casa de tu madre. Entre el pan y la berza, Doña Remedios despliega unas nóminas que no sabes de dónde ha sacado.\n\n"A ver, Manolo. Explícame esto, que la Puri dice que su nieta cobra menos que la del bar."',
    weight: (s) => ((s.cartilla?.prestamos ?? 0) > 0 && !s.flags.divorciado ? 1 : 0),
    cooldown: 12,
    choices: [
      {
        key: 'verdad',
        label: 'Enseñarle las nóminas de verdad',
        hint: 'Si todo es legal, familia +5 y confianza +5. Si no, te riñe delante de todos: confianza −10 y moral +4 (la plantilla se entera).',
        effect(s) {
          if (legalLabor(s)) {
            s.familia = clamp((s.familia ?? 60) + 5);
            addConfianza(s, 5);
            return '"Bien, hijo. Como tu padre." Te sirve otra ración de cocido. Familia +5, confianza +5.';
          }
          addConfianza(s, -10);
          addMoral(s, 4);
          return 'Te riñe delante de Merche, de los primos y del perro. El lunes, media plantilla ya lo sabe y se ríe a gusto. Confianza −10, moral +4.';
        },
      },
      {
        key: 'paco',
        label: 'Enseñarle las nóminas "de Paco"',
        hint: 'Solo con la contabilidad creativa. 50 %: te pilla (confianza −20).',
        available: (s) => s.policies.contabilidad !== 'limpia',
        effect(s) {
          if (chance(s, 0.5)) {
            addConfianza(s, -20);
            return '"Manolo, estas nóminas tienen la misma letra que las cartas de los Reyes Magos que me escribías." Confianza −20.';
          }
          addStress(s, 3);
          return 'Las mira por encima de las gafas, asiente y sigue con el cocido. No sabes si se lo ha creído. Estrés +3.';
        },
      },
      {
        key: 'enfria',
        label: '"Mamá, que se enfría el cocido"',
        hint: 'Familia −2.',
        effect(s) {
          s.familia = clamp((s.familia ?? 60) - 2);
          return '"Eso decía tu padre cuando no quería hablar de algo." Familia −2.';
        },
      },
    ],
  },
];
