// Sucesos ligados a sistemas: competencia y directivos.
import { chance } from '../core/rng.js';
import { addCash, addRep, addMoral, addFama, addHeatTrabajo, addMod, money } from '../core/helpers.js';
import { RIVALS } from './rivals.js';
import { BUSINESS_TYPES } from './businesses.js';
import { CITY_BY_ID } from './cities.js';
import { POSITIONS } from './execs.js';
import { LEGAL_LABOR } from './policies.js';
import { rivalHit, rivalTotal } from '../core/rivals.js';
import { execOf, fireExec } from '../core/execs.js';

const biggestRival = (s) => [...(s.rivals || [])].sort((a, b) => rivalTotal(b) - rivalTotal(a))[0] || null;
const biggestCity = (r) => Object.entries(r.presence).sort((a, b) => b[1] - a[1])[0]?.[0];

// Negocio de Manolo más valioso que interesa a alguna cadena rival.
function coveted(s) {
  const wanted = new Set((s.rivals || []).flatMap((r) => RIVALS[r.id].targets));
  return [...s.businesses].filter((b) => b.mode !== 'franquicia' && wanted.has(b.type)).sort((a, b) => b.value - a.value)[0] || null;
}

export const SYSTEM_EVENTS = [
  {
    id: 'rival_aparece',
    title: 'Llega la competencia',
    portrait: 'portrait_hipster', image: 'ev_rival',
    text: (s, p) => {
      const d = RIVALS[p.rival];
      return `${d.emoji} ${d.name} acaba de desembarcar en el mercado.\n\n${d.desc}\n\nEn las ciudades donde estén, tus negocios del ramo venderán menos. Puedes plantarles cara desde la pestaña Mercado.`;
    },
    weight: () => 0,
    choices: [
      {
        label: 'Ignorarlos: "No tienen mi historia"',
        effect(s, p) {
          return `Manolo decide que ${RIVALS[p.rival].short} "no es competencia, es un homenaje". Ya veremos.`;
        },
      },
      {
        label: 'Probar su producto de incógnito',
        effect(s, p) {
          addFama(s, 1);
          return `Vas con gorra y gafas (las de sol, bajadas por una vez). Lo de ${RIVALS[p.rival].short} está bueno. Muy bueno. No se lo dices a nadie.`;
        },
      },
      {
        label: 'Carta amenazante de Don Cosme (3.000 €)',
        hint: '50 %: se lo piensan y frenan su expansión 6 meses.',
        effect(s, p) {
          addCash(s, -3000);
          const r = s.rivals.find((x) => x.id === p.rival);
          if (r && chance(s, 0.5)) {
            r.calm = 6;
            return 'La carta, en papel timbrado y con latinajos, les asusta. Frenan su expansión unos meses.';
          }
          return 'Su abogada responde con una carta el doble de larga y la mitad de amable. No sirve de nada.';
        },
      },
    ],
  },
  {
    id: 'rival_copia',
    title: 'Te están copiando',
    portrait: 'portrait_hipster', image: 'ev_rival_copia',
    text: (s) => {
      const r = biggestRival(s);
      return `${RIVALS[r.id].name} acaba de lanzar algo sospechosamente parecido a lo tuyo: mismo logo en otro color, mismo eslogan con dos palabras cambiadas. Manolo está indignado ("¡Esto es mío!"), aunque él también se lo copió a alguien.`;
    },
    weight: (s) => (s.rivals?.length ? 1 : 0), cooldown: 14,
    choices: [
      {
        label: 'Demandarles por plagio (15.000 €)',
        hint: '45 %: ganas una indemnización y retroceden.',
        effect(s) {
          const r = biggestRival(s);
          addCash(s, -15000);
          if (chance(s, 0.45)) {
            addCash(s, 25000);
            rivalHit(s, r.id, biggestCity(r), 'sentencia por plagio');
            return `El juez te da la razón. ${RIVALS[r.id].short} te paga 25.000 € y cierra un local.`;
          }
          addRep(s, -2);
          return 'El juez considera que "un sobao es un sobao". Pierdes y encima sales en el periódico. Reputación −2.';
        },
      },
      {
        label: 'Contraatacar con una campaña "El original"',
        hint: 'Ventas de sobaos +6 % durante 6 meses (8.000 €).',
        effect(s) {
          addCash(s, -8000);
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.06, months: 6, label: 'Campaña "El original"' });
          return 'Lanzas "Boomerez: el original desde 1962". Funciona. Ventas de sobaos +6 % durante 6 meses.';
        },
      },
      {
        label: 'Copiarles tú a ellos',
        effect(s) {
          addFama(s, 2);
          return 'Copias su copia. El mercado ya no sabe quién es quién. Fama +2 por la polémica.';
        },
      },
    ],
  },
  {
    id: 'rival_oferta_compra',
    title: 'Una oferta que no puedes rechazar',
    portrait: 'portrait_inversor_misterioso', image: 'ev_rival_oferta',
    text: (s) => {
      const b = coveted(s);
      if (!b) return 'Un ejecutivo de una cadena rival quería comprarte un negocio, pero ya no tienes nada que le interese.';
      return `Un ejecutivo de una cadena rival te ofrece comprar tu ${BUSINESS_TYPES[b.type].name} de ${CITY_BY_ID[b.city].name} por ${money(b.value * 1.6)}: un 60 % más de lo que vale. "Considéralo un cumplido, Manolo."`;
    },
    weight: (s) => (coveted(s) ? 0.8 : 0), cooldown: 18,
    choices: [
      {
        label: 'Vender',
        available: (s) => !!coveted(s),
        effect(s) {
          const b = coveted(s);
          const price = b.value * 1.6;
          addCash(s, price);
          s.businesses = s.businesses.filter((x) => x !== b);
          const r = s.rivals.find((x) => RIVALS[x.id].targets.includes(b.type));
          if (r) r.presence[b.city] = Math.min(3, (r.presence[b.city] || 0) + 1);
          return `Vendes por ${money(price)}. El lunes siguiente ya han cambiado el rótulo. Tu ex clientela, también.`;
        },
      },
      {
        label: '"No está en venta. Yo compro, no vendo"',
        effect(s) {
          addFama(s, 2);
          return 'Lo dices con las gafas de sol puestas, en interior. Fama +2.';
        },
      },
    ],
  },
  {
    id: 'directivo_fichaje',
    title: 'Te quieren robar a un directivo',
    portrait: 'portrait_exec_3', image: 'ev_fichaje',
    text: (s, p) => {
      const e = execOf(s, p.pos);
      return e
        ? `${e.name}, tu responsable de ${POSITIONS[p.pos].label}, ha recibido una oferta de la competencia. Te lo cuenta "por transparencia" (traducción: quiere más dinero). Cobra ${money(e.salary)} al mes.`
        : 'Un directivo tuyo ha recibido una oferta de la competencia, pero ya no trabaja aquí.';
    },
    weight: () => 0,
    choices: [
      {
        label: 'Subirle el sueldo un 30 %',
        available: (s, p) => !!execOf(s, p.pos),
        effect(s, p) {
          const e = execOf(s, p.pos);
          e.salary = Math.round(e.salary * 1.3);
          return `${e.name} se queda, ahora por ${money(e.salary)} al mes. Te da un abrazo que te parece excesivo.`;
        },
      },
      {
        label: 'Recordarle la cláusula de no competencia',
        hint: '40 %: se queda sin subida.',
        available: (s, p) => !!execOf(s, p.pos),
        effect(s, p) {
          const e = execOf(s, p.pos);
          if (chance(s, 0.4)) return `${e.name} lee la cláusula, palidece y se queda. De momento.`;
          fireExec(s, p.pos, 'se va con la competencia (la cláusula estaba mal redactada)');
          return `${e.name} se va con la competencia. Don Cosme admite que la cláusula la copió de un contrato de 1983.`;
        },
      },
      {
        label: 'Dejarle marchar',
        effect(s, p) {
          if (execOf(s, p.pos)) fireExec(s, p.pos, 'se va con la competencia');
          return '"Nadie es imprescindible." Lo dices tú, que heredaste la empresa.';
        },
      },
    ],
  },
  {
    id: 'directivo_chivato',
    title: 'Un directivo con principios',
    portrait: 'portrait_exec_5', image: 'ev_chivato',
    text: (s, p) => {
      const e = execOf(s, p.pos);
      return `${e ? e.name : 'Uno de tus directivos'} entra en tu despacho y cierra la puerta. "Manolo, lo de los falsos autónomos y las horas extra no pagadas tiene que acabar. O lo arreglas o voy a la Inspección."`;
    },
    weight: () => 0,
    choices: [
      {
        label: 'Hacerle caso y regularizar',
        effect(s) {
          Object.assign(s.policies, LEGAL_LABOR);
          addMoral(s, 6);
          addHeatTrabajo(s, -10);
          return 'Regularizas a la plantilla. Te cuesta dinero y orgullo. Moral +6, radar de Trabajo −10.';
        },
      },
      {
        label: 'Despedirle fulminantemente',
        effect(s, p) {
          if (execOf(s, p.pos)) fireExec(s, p.pos);
          addHeatTrabajo(s, 25);
          addMoral(s, -5);
          return 'Le despides. Se va directo a la Inspección con una memoria USB llena de pruebas. Radar de Trabajo +25, moral −5.';
        },
      },
      {
        label: 'Comprar su silencio (30.000 €)',
        hint: '50 %: acepta.',
        effect(s, p) {
          addCash(s, -30000);
          if (chance(s, 0.5)) return 'Acepta el "bonus por objetivos". Se queda, pero ya no te mira a los ojos.';
          if (execOf(s, p.pos)) fireExec(s, p.pos, 'dimite indignado');
          addHeatTrabajo(s, 20);
          addRep(s, -5);
          return 'Te devuelve el sobre, dimite y lo cuenta todo. Radar de Trabajo +20, reputación −5.';
        },
      },
    ],
  },
];
