// «Sesenta velas»: Manolo cumple 60, elige heredero ante el notario de Villacarriedo y escribe su
// propia cláusula, como hizo Don Anselmo. Tres cartas forzadas, una vez cada una.
import { addFama, addMoral, addRep, addHeatHacienda, clamp, hito } from '../core/helpers.js';
import { addStress } from '../core/life.js';
import { PRISA_MONTH } from './clauses.js';
import { addConfianza } from '../core/cartilla.js';

const f = (s) => s.flags || {};
const legalLabor = (s) => s.policies.salario === 'convenio' && s.policies.horas === 'pagadas' && s.policies.becarios === 'ninguno';
const sucesion = (s) => (s.sucesion ||= { heir: null, execName: null, clausula: null, m: null });
// La carta siguiente sale en el cierre posterior a resolver la anterior (resolvePending apunta el mes ya avanzado).
const after = (s, id) => s.seen?.[id] != null && s.month >= s.seen[id];
// El mejor directivo que no sea un enchufado (con nivel 2 o más).
function bestExec(s) {
  return Object.values(s.execs || {}).filter((e) => e.trait !== 'enchufado' && (e.skill ?? 0) >= 2).sort((a, b) => (b.skill ?? 0) - (a.skill ?? 0))[0] || null;
}
const plantillaMerece = (s) => (s.comite?.firmas ?? 0) >= 2 || ['firmado', 'cedido'].includes(f(s).comiteFin) || (f(s).participacionMeses ?? 0) >= 12;

// Lista de invitados: unas frases según lo que ha pasado.
function invitados(s) {
  const l = [];
  l.push(f(s).divorciado ? 'Merche no viene, pero manda un ramo con una tarjeta: «Felicidades, de parte de mi abogada».' : 'Merche ha organizado todo y te mira como quien mira una obra que se ha alargado treinta años.');
  if (f(s).jonFianza || f(s).jonFinal === 'fianza') l.push('Jonathan llega tarde, con la pulsera electrónica escondida bajo la manga.');
  else l.push('Jonathan te regala «un NFT de tu cara».');
  if (s.comite) l.push((s.comite.firmas ?? 0) > 0 ? 'Maripili trae una tarta con la forma del convenio firmado.' : 'Maripili viene, pero se sienta cerca de la puerta.');
  if (f(s).prensaFinal) l.push('Lucía Ferrer está en una mesa del fondo, con la libreta abierta.');
  if ((s.stats?.inspecciones ?? 0) > 0) l.push('Ha llegado una postal de Marisa: «Felicidades. Sigo vigilando».');
  l.push((s.cartilla?.prestamos ?? 0) > 0 ? 'Tu madre ha traído la cartilla, por si acaso.' : 'Tu madre ha traído croquetas para cien.');
  return l.join(' ');
}

export const VELAS_EVENTS = [
  {
    id: 'velas_1',
    title: 'Sesenta velas',
    portrait: 'portrait_manolo_happy', image: 'ev_velas_cumple',
    text: (s) => `Manolo cumple sesenta. Restaurante del pueblo, tarta con sesenta velas y globos dorados con forma de 6 y de 0.\n\n${invitados(s)}\n\nToca soplar y decir unas palabras.`,
    // Manolo empieza con 55 años: cumple sesenta en el mes 60 (enero de 2031).
    weight: (s) => (s.seen?.velas_1 == null && s.month >= PRISA_MONTH && s.month <= 90 ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        key: 'linkedin',
        label: 'Discurso de LinkedIn',
        hint: 'Fama +6, estrés +3.',
        effect(s) {
          hito(s, 'sesenta');
          addFama(s, 6);
          addStress(s, 3);
          return '"Sesenta años no son una edad: son una mentalidad." Lo grabas y lo subes antes del postre. Fama +6, estrés +3.';
        },
      },
      {
        key: 'brindis',
        label: 'Brindis por las que madrugan',
        hint: 'Moral +5 (o +1 si explotas a la plantilla y lo saben).',
        effect(s) {
          hito(s, 'sesenta');
          if (legalLabor(s)) {
            addMoral(s, 5);
            return '"Por las que madrugan, que son las que hacen los sobaos." Maripili levanta la copa. Moral +5.';
          }
          addMoral(s, 1);
          return '"Por las que madrugan." Alguien al fondo dice: "Y no cobran las horas extra". Risas incómodas. Moral +1.';
        },
      },
      {
        key: 'nunca',
        label: '"Yo no me jubilo nunca"',
        hint: 'Sin heredero por ahora. Estrés +5.',
        effect(s) {
          hito(s, 'sesenta');
          sucesion(s).heir = 'nadie';
          addStress(s, 5);
          return '"¿Jubilarme? Los tiburones mueren nadando." La cardióloga, invitada por Merche, apunta algo en una servilleta. Estrés +5.';
        },
      },
    ],
  },
  {
    id: 'velas_2',
    title: 'El notario de Villacarriedo, otra vez',
    portrait: 'portrait_padre_anselmo', image: 'ev_velas_notario',
    text: () => 'La misma notaría donde leyeron el testamento de tu padre. El mismo notario, con treinta años más y las mismas gafas. Su retrato de Don Anselmo sigue en la pared, mirándote.\n\n"Don Manuel, a cierta edad conviene dejar las cosas atadas. ¿A quién deja usted el imperio Boomerez?"',
    weight: (s) => (after(s, 'velas_1') && s.seen?.velas_2 == null ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        key: 'plantilla',
        label: 'A las que madrugan: la plantilla',
        hint: 'Solo si te lo has ganado (convenios firmados o reparto). Moral +10, agravio −10.',
        available: (s) => plantillaMerece(s),
        effect(s) {
          Object.assign(sucesion(s), { heir: 'plantilla', m: s.month });
          hito(s, 'heredero');
          addMoral(s, 10);
          s.agravio = clamp((s.agravio || 0) - 10);
          return 'Lo firmas: el día que faltes, la empresa será de quien la amasa. Maripili se entera esa misma tarde y no dice nada; solo te trae un café. Moral +10, agravio −10.';
        },
      },
      {
        key: 'vanessa',
        label: 'A Vanessa',
        hint: 'Radar de Hacienda −5: lo primero que hace es leer las cuentas.',
        available: (s) => !f(s).vanessaRival,
        effect(s) {
          Object.assign(sucesion(s), { heir: 'vanessa', m: s.month });
          hito(s, 'heredero');
          addHeatHacienda(s, -5);
          return 'Vanessa lee el testamento, luego las cuentas, luego otra vez las cuentas. "Papá, tenemos que hablar." Radar de Hacienda −5.';
        },
      },
      {
        key: 'directivo',
        label: (s) => `A ${bestExec(s)?.name ?? 'tu mejor directivo'}, tu mejor directivo`,
        hint: 'Reputación +2: el mercado lo ve como una sucesión profesional.',
        available: (s) => !!bestExec(s),
        effect(s) {
          const e = bestExec(s);
          Object.assign(sucesion(s), { heir: 'directivo', execName: e?.name ?? null, m: s.month });
          hito(s, 'heredero');
          addRep(s, 2);
          return `${e?.name ?? 'Tu directivo'} será el consejero delegado. La prensa económica lo llama "una sucesión profesional". Tu madre lo llama "darle la empresa a un extraño". Reputación +2.`;
        },
      },
      {
        key: 'merche',
        label: 'A Merche',
        hint: 'Familia +10.',
        available: (s) => !f(s).divorciado,
        effect(s) {
          Object.assign(sucesion(s), { heir: 'merche', m: s.month });
          hito(s, 'heredero');
          s.familia = clamp((s.familia ?? 60) + 10);
          return '"¿A mí? ¿Y qué hago yo con cuarenta tiendas de sobaos?" Lo sabe perfectamente: venderlas. Familia +10.';
        },
      },
      {
        key: 'kevin',
        label: 'A Kevin, tu sobrino',
        hint: 'Tu madre estará encantada (confianza +10). El resto, no: reputación −2.',
        effect(s) {
          Object.assign(sucesion(s), { heir: 'kevin', m: s.month });
          hito(s, 'heredero');
          addConfianza(s, 10);
          addRep(s, -2);
          return 'El notario se quita las gafas, las limpia y te pregunta si estás seguro. Tu madre, en cambio, te llama para darte las gracias. Confianza de tu madre +10, reputación −2.';
        },
      },
      {
        key: 'nadie',
        label: 'A nadie: "Que me entierren con el móvil"',
        hint: 'Estrés +5.',
        effect(s) {
          Object.assign(sucesion(s), { heir: 'nadie', m: s.month });
          hito(s, 'heredero');
          addStress(s, 5);
          return '"Ya veremos." El notario apunta "sin disposición" y te cobra igual. Estrés +5.';
        },
      },
    ],
  },
  {
    id: 'velas_3',
    title: 'La cláusula de Manolo',
    portrait: 'portrait_manolo_thinking', image: 'ev_velas_clausula',
    text: (s) => `Antes de firmar, el notario te recuerda la cláusula que tu padre escribió a mano en el margen.\n\n"¿Quiere usted añadir la suya, Don Manuel?" Te ofrece la pluma.${sucesion(s).heir && sucesion(s).heir !== 'nadie' ? '' : '\n\n(Aunque no haya heredero, la cláusula queda escrita.)'}`,
    weight: (s) => (after(s, 'velas_2') && s.seen?.velas_3 == null ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        key: 'dubai',
        label: '"Que abra en Dubái"',
        effect(s) {
          sucesion(s).clausula = 'dubai';
          return 'Escribes con letra grande: "Que abra en Dubái". El notario pregunta si hay sobaos en Dubái. "Todavía no", dices.';
        },
      },
      {
        key: 'horas',
        label: '"Que nunca pague horas extra"',
        effect(s) {
          sucesion(s).clausula = 'horas';
          return 'El notario lo escribe sin levantar la vista. "Esto no se sostiene ante un juez, Don Manuel." "Lo sé. Es por dejarlo dicho."';
        },
      },
      {
        key: 'tonterias',
        label: '"Que no haga tonterías"',
        effect(s) {
          sucesion(s).clausula = 'tonterias';
          return 'Lo mismo que escribió tu padre. El notario sonríe por primera vez en treinta años.';
        },
      },
      {
        key: 'receta',
        label: '"Que vuelva a la receta de la abuela"',
        available: (s) => ['receta', 'publicada'].includes(f(s).anselmoFin),
        effect(s) {
          sucesion(s).clausula = 'receta';
          return 'Escribes la receta entera en el margen, con la cantidad exacta de mantequilla. El notario se la guarda "para el expediente".';
        },
      },
    ],
  },
];

// ¿Queda «Sesenta velas» por salir o por acabar? La revista de millonarios espera (como mucho 4 cierres).
export function velasPending(s) {
  if (s.pending.some((p) => /^velas_/.test(p.id))) return true;
  if (s.seen?.velas_1 == null) return s.month >= PRISA_MONTH && s.month <= 90; // está a punto de salir
  return s.seen?.velas_3 == null;
}

export const HEIR_LABEL = (s) => ({
  plantilla: 'la plantilla', vanessa: 'Vanessa', directivo: s.sucesion?.execName || 'un directivo', merche: 'Merche', kevin: 'Kevin', nadie: 'nadie',
}[s.sucesion?.heir] ?? null);

