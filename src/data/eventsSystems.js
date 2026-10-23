// Sucesos ligados a sistemas: competencia y directivos.
import { chance } from '../core/rng.js';
import { addCash, addRep, addMoral, addFama, addHeatTrabajo, addHeatHacienda, addMod, money } from '../core/helpers.js';
import { RIVALS } from './rivals.js';
import { BUSINESS_TYPES } from './businesses.js';
import { CITY_BY_ID } from './cities.js';
import { POSITIONS } from './execs.js';
import { LEGAL_LABOR } from './policies.js';
import { rivalHit, rivalTotal } from '../core/rivals.js';
import { execOf, fireExec } from '../core/execs.js';
import { divorce, addStress } from '../core/life.js';
import { holdElection } from '../core/politics.js';
import { PARTIES } from './politics.js';

const biggestRival = (s) => [...(s.rivals || [])].sort((a, b) => rivalTotal(b) - rivalTotal(a))[0] || null;
const biggestCity = (r) => Object.entries(r.presence).sort((a, b) => b[1] - a[1])[0]?.[0];

// Negocio de Manolo más valioso que interesa a alguna cadena rival.
function coveted(s) {
  const wanted = new Set((s.rivals || []).flatMap((r) => RIVALS[r.id].targets));
  return [...s.businesses].filter((b) => b.mode !== 'franquicia' && wanted.has(b.type)).sort((a, b) => b.value - a.value)[0] || null;
}

const electionResult = (s, lean, extra = '') => {
  const r = holdElection(s, lean);
  const p = PARTIES[r.party];
  return `${extra}${extra ? '\n\n' : ''}Resultado: gana ${p.emoji} ${p.name}.\n\n${p.summary}`;
};

export const SYSTEM_EVENTS = [
  {
    id: 'averia',
    title: 'Se cae el local a trozos',
    portrait: 'portrait_becario', image: 'ev_averia',
    text: (s, p) => {
      const b = s.businesses.find((x) => x.id === p.businessId);
      return b
        ? `En tu ${BUSINESS_TYPES[b.type].name} de ${CITY_BY_ID[b.city].name} se ha roto todo a la vez: la cámara frigorífica, la persiana y una tubería que lleva años sujeta con la cinta americana de Kevin. Un cliente lo está grabando.`
        : 'Se ha roto algo en un local que ya no es tuyo. Por una vez, no es tu problema.';
    },
    weight: () => 0,
    choices: [
      {
        label: 'Reparación a fondo',
        hint: 'Cuesta el 12 % del valor del local y lo deja casi como nuevo.',
        effect(s, p) {
          const b = s.businesses.find((x) => x.id === p.businessId);
          if (!b) return 'No hay nada que reparar.';
          const cost = Math.round((b.value || 0) * 0.12);
          addCash(s, -cost);
          b.cond = 85;
          b.brokenMonth = null;
          return `Viene una cuadrilla de verdad. Factura: ${money(cost)}. El local queda casi como nuevo y Kevin, ofendido.`;
        },
      },
      {
        label: 'Que lo apañe Kevin otra vez',
        hint: 'Gratis. El local vende la mitad este mes y la reputación sufre.',
        effect(s, p) {
          const b = s.businesses.find((x) => x.id === p.businessId);
          if (b) {
            addMod(s, { kind: 'revenue', city: b.city, types: [b.type], factor: 0.5, months: 1, label: 'Avería' });
            b.cond = Math.min(100, (b.cond ?? 0) + 10);
            b.brokenMonth = null;
          }
          addRep(s, -3);
          return 'Kevin llega con tres rollos de cinta y una sonrisa. El vídeo del cliente tiene 80.000 visualizaciones. Ventas a la mitad este mes; reputación −3.';
        },
      },
    ],
  },
  {
    id: 'susto_padel',
    title: 'Un susto en la pista de pádel',
    portrait: 'portrait_manolo_scared', image: 'ev_susto_padel',
    text: () => 'En mitad de un punto decisivo contra el director del banco, a Manolo se le duerme el brazo y acaba sentado en la red. En urgencias, la cardióloga le enseña unos números peores que los de su cuenta de resultados: "Estrés, colesterol y ego. Sobre todo ego."',
    weight: () => 0,
    choices: [
      {
        label: 'Hacer caso a la médica: tres meses de reposo',
        hint: 'Sin acciones de Manolo durante 3 meses; el estrés baja mucho.',
        effect(s) {
          s.restMonths = 3;
          addStress(s, -40);
          s.familia = Math.min(100, (s.familia ?? 60) + 8);
          return 'Tres meses de paseos por el Pas, caldo y Merche vigilando el móvil. La empresa sobrevive sin ti, lo cual es preocupante. Familia +8.';
        },
      },
      {
        label: 'Coach de mindfulness a domicilio (12.000 €)',
        effect(s) {
          addCash(s, -12000);
          addStress(s, -30);
          addFama(s, 2);
          return 'Iker Lasa te enseña a respirar "desde el EBITDA". Funciona sorprendentemente bien. Fama +2.';
        },
      },
      {
        label: '"Esto es de los nervios del partido". Volver mañana',
        hint: 'Arriesgado.',
        effect(s) {
          if (chance(s, 0.4)) {
            s.restMonths = 6;
            addStress(s, -50);
            addRep(s, -3);
            return 'A la semana, segundo susto, esta vez en una reunión con inversores. Seis meses de reposo obligatorio y la noticia en la prensa económica. Reputación −3.';
          }
          addStress(s, -5);
          addFama(s, 3);
          return 'Vuelves al día siguiente y lo cuentas en LinkedIn: "Ni un infarto para a un tiburón". 2.000 likes. Tu cardióloga no le da like. Fama +3.';
        },
      },
    ],
  },
  {
    id: 'elecciones',
    title: 'Elecciones',
    portrait: 'portrait_alcalde', image: 'ev_elecciones',
    text: () => `Hay elecciones. Los dos grandes partidos se disputan el país:\n\n${PARTIES.pps.emoji} ${PARTIES.pps.name}: ${PARTIES.pps.slogan}. ${PARTIES.pps.summary}\n\n${PARTIES.ale.emoji} ${PARTIES.ale.name}: ${PARTIES.ale.slogan}. ${PARTIES.ale.summary}\n\nUn tesorero de cada partido te ha escrito "para tomar un café".`,
    weight: () => 0,
    choices: [
      {
        label: 'Donar 20.000 € a la ALE',
        hint: 'Le das un empujón (y Hacienda se fija en el sobre).',
        effect(s) {
          addCash(s, -20000);
          addHeatHacienda(s, 4);
          return electionResult(s, 1, 'Entregas un sobre en un restaurante de Madrid. El tesorero te llama "un patriota".');
        },
      },
      {
        label: 'Donar 20.000 € al PPS',
        hint: 'Le das un empujón (y Hacienda se fija en el sobre).',
        effect(s) {
          addCash(s, -20000);
          addHeatHacienda(s, 4);
          return electionResult(s, -1, 'Haces una "aportación a un think tank verde". El tesorero te llama "un empresario comprometido".');
        },
      },
      {
        label: 'Donar a los dos (35.000 €)',
        hint: 'Gane quien gane, Manolo gana.',
        effect(s) {
          addCash(s, -35000);
          addHeatHacienda(s, 6);
          addFama(s, 3);
          return electionResult(s, 0, 'Pagas una cena a cada partido. En las dos te sientan al lado del candidato. Fama +3.');
        },
      },
      {
        label: 'No meterse en política',
        effect(s) {
          return electionResult(s, 0, '"Yo no soy ni de izquierdas ni de derechas, soy de mi cuenta de resultados."');
        },
      },
    ],
  },
  {
    id: 'piso_ilegal',
    title: 'Inspección de pisos turísticos',
    portrait: 'portrait_vecina', image: 'ev_piso_ilegal',
    text: (s, p) => `Los inspectores municipales de ${CITY_BY_ID[p.city]?.name ?? 'la ciudad'} han detectado tus pisos turísticos sin licencia gracias a una vecina con prismáticos y mucho tiempo libre.`,
    weight: () => 0,
    choices: [
      {
        label: 'Regularizar: multa y licencia (160.000 €)',
        available: (s, p) => s.businesses.some((b) => b.id === p.businessId),
        effect(s, p) {
          addCash(s, -160000);
          const b = s.businesses.find((x) => x.id === p.businessId);
          if (b) {
            b.ilegal = false;
            b.value += 120000 * 0.85;
          }
          return 'Pagas 40.000 € de multa y 120.000 € de licencia. Ahora tus pisos son legales y la vecina está desolada.';
        },
      },
      {
        label: 'Pagar la multa (40.000 €) y seguir igual',
        hint: 'La próxima vez puede ser peor.',
        effect(s) {
          addCash(s, -40000);
          addRep(s, -3);
          return 'Pagas y sigues. La vecina compra unos prismáticos mejores. Reputación −3.';
        },
      },
      {
        label: 'Cerrarlos y venderlos',
        available: (s, p) => s.businesses.some((b) => b.id === p.businessId),
        effect(s, p) {
          const b = s.businesses.find((x) => x.id === p.businessId);
          const price = Math.round((b?.value || 0) * 0.8);
          addCash(s, price - 20000);
          s.businesses = s.businesses.filter((x) => x !== b);
          return `Vendes el edificio por ${money(price)} a un fondo que sí tiene licencias (y abogados). Multa reducida: 20.000 €.`;
        },
      },
    ],
  },
  {
    id: 'divorcio',
    title: 'Merche quiere el divorcio',
    portrait: 'portrait_esposa_merche', image: 'ev_divorcio',
    text: () => 'Merche te espera en la cocina con una carpeta y una abogada. "Manolo, llevas años casado con la empresa. Ahora vas a estar casado SOLO con la empresa." Estáis en régimen de gananciales.',
    weight: () => 0,
    choices: [
      {
        label: 'Acuerdo amistoso',
        hint: 'Se queda con un 30 % de la caja y los caprichos caros.',
        effect(s) {
          const r = divorce(s, 0.3);
          addFama(s, 3);
          return `Firmáis en una notaría sin gritos. Merche se queda con ${money(r.cashPart)} y los caprichos más caros (valorados en ${money(r.lost)}). Te mudas a un ático "de soltero de oro".`;
        },
      },
      {
        label: 'Pelear en los tribunales (40.000 €)',
        hint: '50 %: solo un 15 %. Si no: un 45 % y la prensa rosa.',
        effect(s) {
          addCash(s, -40000);
          if (chance(s, 0.5)) {
            const r = divorce(s, 0.15);
            return `Don Cosme saca un recibo de 1998 que lo cambia todo. Merche se queda con ${money(r.cashPart)} y los caprichos caros.`;
          }
          const r = divorce(s, 0.45);
          addRep(s, -6);
          addFama(s, 8);
          return `Salís en un programa del corazón durante tres semanas. Merche se queda con ${money(r.cashPart)} y lo mejor de tus caprichos. Reputación −6, fama +8.`;
        },
      },
      {
        label: 'Pedir perdón de verdad y bajar el ritmo',
        hint: '40 %: te da otra oportunidad.',
        effect(s) {
          if (chance(s, 0.4)) {
            s.familia = 45;
            addCash(s, -15000);
            return 'Le pides perdón sin LinkedIn de por medio. Os vais un mes a Comillas (15.000 €). Te da otra oportunidad. La última.';
          }
          const r = divorce(s, 0.3);
          return `"Demasiado tarde, Manolo." Acuerdo de divorcio: ${money(r.cashPart)} y los caprichos caros para Merche.`;
        },
      },
    ],
  },
  {
    id: 'junta_accionistas',
    title: 'Junta de accionistas furiosa',
    portrait: 'portrait_banquero', image: 'ev_junta',
    text: (s) => `La acción de Boomerez S.A. ha caído a ${Math.round(s.ipo?.price ?? 0)} € (salió a 100 €). En la junta, un fondo inglés pide tu cabeza y un jubilado de Torrelavega te tira un sobao.`,
    weight: () => 0,
    choices: [
      {
        label: 'Repartir un dividendo extraordinario',
        effect(s) {
          const d = Math.max(50000, Math.round(Math.max(0, s.cash) * 0.15));
          addCash(s, -d);
          if (s.ipo) s.ipo.price *= 1.12;
          return `Repartes ${money(d)} entre los accionistas. La acción rebota un 12 %. El jubilado te pide perdón por lo del sobao.`;
        },
      },
      {
        label: 'Prometer un "plan estratégico 2030"',
        effect(s) {
          addFama(s, 2);
          if (s.ipo) s.ipo.price *= chance(s, 0.5) ? 1.06 : 0.94;
          return 'Presentas 84 diapositivas con la palabra "sinergias". Nadie entiende nada; la acción se mueve al azar.';
        },
      },
      {
        label: 'Culpar al Gobierno',
        effect(s) {
          addRep(s, -3);
          if (s.ipo) s.ipo.price *= 0.95;
          return 'Los accionistas no votan en España. La acción cae otro 5 %. Reputación −3.';
        },
      },
    ],
  },
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
