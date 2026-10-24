// Cartas del comité de empresa: nace, revisa el convenio cada marzo y, si se le toma el pelo, convoca
// huelga general. La opción honrada va siempre la primera.
import { chance } from '../core/rng.js';
import { addCash, addRep, addMoral, addHeatTrabajo, addMod, clamp, money, moneyShort, dateLabel } from '../core/helpers.js';
import { convenioDemand, newComite, profitRatio, K } from '../core/plantilla.js';
import { LEGAL_LABOR } from './policies.js';

const employees = (s) => s.lastReport?.employees ?? 10;
const annualNet = (s) => s.history.slice(-12).reduce((a, h) => a + h.net, 0);
const prevNet = (s) => s.history.slice(-24, -12).reduce((a, h) => a + h.net, 0);
const pct = (d) => `${(d * 100).toFixed(1).replace('.0', '').replace('.', ',')} %`;
const agr = (s, f) => {
  s.agravio = clamp(f(s.agravio || 0));
};
// Las cartas aguantan que aún no haya comité (p. ej. en los tests de todas las cartas).
const comite = (s) => (s.comite ||= newComite(s));
const strike = (s, months) => {
  if (!s.pending.some((p) => p.id === 'huelga_general')) s.pending.push({ kind: 'event', id: 'huelga_general', params: { months } });
};
const fecha = (m) => dateLabel(m).toLowerCase().replace(' ', ' de ');
const dOf = (s, p) => p?.d ?? convenioDemand(s);
const raiseCost = (s, d) => (s.lastReport?.costs?.salarios ?? employees(s) * 1900) * d;

// Romper la promesa del año pasado: agravio +20 y huelga de dos meses.
function breakPromise(s) {
  const c = comite(s);
  if (c.prometido == null) return '';
  c.rotas.push(s.month);
  c.prometido = null;
  agr(s, (a) => a + 20);
  strike(s, 2);
  return '\n\nY encima le prometiste que este año sí. Maripili cuelga en el tablón tu promesa fotocopiada y convoca huelga general de dos meses. Agravio +20.';
}

export const PLANTILLA_EVENTS = [
  {
    id: 'comite_nace',
    title: 'Nace el comité de empresa',
    portrait: 'portrait_empleada_maripili', image: 'ev_comite_nace',
    text: (s) => {
      const n = employees(s);
      return `Sois ${n}. Con más de 50 toca comité, y la candidatura de Maripili gana por ${Math.max(3, n - 2)} votos a 2 (Kevin y su madre).\n\nDeja el acta y un calendario: "Cada marzo revisamos el convenio. Trae las cuentas del Registro Mercantil, que esas no las maquilla Paco."`;
    },
    weight: () => 0,
    choices: [
      {
        key: 'felicitar',
        label: 'Felicitarla y cederle el cuarto de la mantequilla',
        hint: 'Moral +2, agravio −5.',
        effect(s) {
          comite(s);
          addMoral(s, 2);
          agr(s, (a) => a - 5);
          return 'Maripili cuelga un cartel en la puerta del cuarto: "COMITÉ. Llamar antes de entrar (también tú, Manolo)". Moral +2, agravio −5.';
        },
      },
      {
        key: 'kevin',
        label: 'Proponer a Kevin como presidente "de consenso"',
        hint: 'Moral −3, agravio +10, radar de Inspección +3.',
        effect(s) {
          comite(s);
          addMoral(s, -3);
          agr(s, (a) => a + 10);
          addHeatTrabajo(s, 3);
          return 'Kevin saca su propio voto y el de su madre. Maripili saca el acta, la fotografía y la manda a la Inspección "por si acaso". Moral −3, agravio +10, radar de Inspección +3.';
        },
      },
    ],
  },
  {
    id: 'convenio_anual',
    title: 'Revisión del convenio',
    portrait: 'portrait_empleada_maripili', image: 'ev_convenio_anual',
    memory: true,
    quickRepeat: true,
    text: (s, p) => {
      const d = dOf(s, p);
      const c = comite(s);
      const ratio = s.lastReport ? profitRatio(s, s.lastReport) : 0;
      const promesa = c.prometido != null ? `\n\nY no nos vengas con el año que viene: ya nos lo prometiste en ${fecha(c.prometido)}.` : '';
      return `Maripili llega con las cuentas del Registro Mercantil subrayadas en fosforito.\n\n"El año pasado ganasteis ${moneyShort(annualNet(s))} (${ratio.toFixed(1).replace('.', ',')} sueldos por cabeza al mes). Pedimos un ${pct(d)}: ${money(raiseCost(s, d))} al mes."${promesa}`;
    },
    weight: () => 0,
    choices: [
      {
        key: 'firmar',
        label: (s, p) => `Firmar el ${pct(dOf(s, p))}`,
        hint: 'Agravio ×0,6, moral +6, un año de paz social y 12 meses con condiciones legales.',
        effect(s, p) {
          const c = comite(s);
          const d = dOf(s, p);
          c.plus = (1 + c.plus) * (1 + d) - 1;
          c.extra = 0;
          c.paz = 12;
          c.prometido = null;
          c.nextConvenio = s.month + 12;
          c.firmas = (c.firmas || 0) + 1;
          agr(s, (a) => a * 0.6);
          addMoral(s, 6);
          Object.assign(s.policies, LEGAL_LABOR);
          s.flags.forcedLegal = Math.max(s.flags.forcedLegal || 0, 12);
          s.flags.forcedBy = 'convenio';
          return `Firmáis en la mesa de la cocina, con sobaos. Los sueldos suben un ${pct(d)} y nadie toca las condiciones en un año. Agravio ×0,6, moral +6.`;
        },
      },
      {
        key: 'paga',
        label: (s) => `Paga única de ${money(K.PAGA_UNICA)} por cabeza (${money(employees(s) * K.PAGA_UNICA)})`,
        hint: (s) => `Agravio ×0,8 y moral +4, pero el año que viene piden un punto más.${comite(s).prometido != null ? ' Rompe tu promesa del año pasado: huelga de dos meses.' : ''}`,
        effect(s) {
          const c = comite(s);
          const cost = employees(s) * K.PAGA_UNICA;
          addCash(s, -cost);
          c.extra = (c.extra || 0) + 1;
          c.nextConvenio = s.month + 12;
          agr(s, (a) => a * 0.8);
          addMoral(s, 4);
          const broken = breakPromise(s);
          return `Un sobre con ${money(K.PAGA_UNICA)} para cada uno (${money(cost)} en total) y la subida, para el año que viene. "Apuntado", dice Maripili. Agravio ×0,8, moral +4.${broken}`;
        },
      },
      {
        key: 'prometer',
        label: '"El año que viene, sin falta"',
        hint: 'Moral +2. Si el año que viene no firmas, huelga general de dos meses.',
        available: (s) => comite(s).prometido == null,
        effect(s) {
          const c = comite(s);
          c.prometido = s.month;
          c.nextConvenio = s.month + 12;
          addMoral(s, 2);
          return 'Maripili lo apunta en la agenda, con tu firma y la fecha. "Para que no se nos olvide a ninguno, Manolo." Moral +2.';
        },
      },
      {
        key: 'congelar',
        label: 'Congelar: "Son tiempos difíciles"',
        hint: (s) => `Moral −8, agravio +10 y riesgo de huelga general (${Math.round(100 * Math.min(1, 0.25 + (s.agravio || 0) / 150))} % si no hay crisis ni pérdidas).${comite(s).prometido != null ? ' Rompe tu promesa del año pasado: huelga de dos meses.' : ''}`,
        effect(s) {
          const c = comite(s);
          c.nextConvenio = s.month + 12;
          addMoral(s, -8);
          agr(s, (a) => a + 10);
          let extra = '';
          if (annualNet(s) > prevNet(s) && annualNet(s) > 0) {
            addRep(s, -3);
            extra = ' Sale en el periódico: "Congela sueldos con beneficios récord". Reputación −3.';
          }
          const broken = breakPromise(s);
          const hard = s.macro?.phase === 'crisis' || (s.lastReport?.net ?? 0) < 0;
          if (!broken && !hard && chance(s, Math.min(1, 0.25 + (s.agravio || 0) / 150))) {
            strike(s, 1);
            extra += '\n\nMaripili no discute: convoca huelga general.';
          }
          return `Les enseñas un gráfico que baja (es el de la cotización del aceite de girasol). Moral −8, agravio +10.${extra}${broken}`;
        },
      },
    ],
  },
  {
    id: 'huelga_general',
    title: 'Huelga general en Boomerez',
    portrait: 'portrait_empleada_maripili', image: 'ev_huelga_general',
    text: (s, p) => {
      const m = p?.months ?? 1 + ((s.agravio || 0) >= 60 ? 1 : 0) + ((s.agravio || 0) >= 80 ? 1 : 0);
      return `El comité para todo el grupo: obradores, tiendas, tabernas, gimnasios y la residencia. Pancarta en la puerta de Selaya: "BENEFICIOS RÉCORD, SUELDOS DE RISA".\n\nLa caja de resistencia aguanta ${m} ${m === 1 ? 'mes' : 'meses'}.`;
    },
    weight: () => 0,
    choices: [
      {
        key: 'paga',
        label: (s) => (s.policies.reparto === 'paga' ? 'Subir a la participación del 8 %' : 'Firmar la paga de beneficios (3 %)'),
        hint: 'Moral +10, agravio ×0,7 y seis meses de paz.',
        available: (s) => s.policies.reparto !== 'participacion',
        effect(s) {
          const c = comite(s);
          s.policies.reparto = s.policies.reparto === 'paga' ? 'participacion' : 'paga';
          addMoral(s, 10);
          agr(s, (a) => a * 0.7);
          c.paz = 6;
          c.huelgas++;
          s.stats.huelgas = (s.stats.huelgas || 0) + 1;
          return `Firmas ${s.policies.reparto === 'paga' ? 'una paga del 3 % del beneficio' : 'la participación: el 8 % del beneficio para la plantilla'}. Se recogen las pancartas antes de comer. Moral +10, agravio ×0,7.`;
        },
      },
      {
        key: 'convenio',
        label: (s) => `Subir al convenio y pagar ${money(K.PAGA_HUELGA)} por cabeza (${money(employees(s) * K.PAGA_HUELGA)})`,
        hint: 'Moral +15 y seis meses de paz.',
        effect(s) {
          const c = comite(s);
          addCash(s, -employees(s) * K.PAGA_HUELGA);
          s.policies.salario = 'convenio';
          addMoral(s, 15);
          c.paz = 6;
          c.huelgas++;
          s.stats.huelgas = (s.stats.huelgas || 0) + 1;
          return `Sueldos a convenio y ${money(employees(s) * K.PAGA_HUELGA)} de compensación. Maripili te da la mano delante de todos, para que conste. Moral +15.`;
        },
      },
      {
        key: 'aguantar',
        label: 'Aguantar el pulso',
        hint: 'Se para el grupo (producción y servicios al 70 %) los meses que aguante la caja de resistencia. Reputación −6.',
        effect(s, p) {
          const c = comite(s);
          const a = s.agravio || 0;
          const m = p?.months ?? 1 + (a >= 60 ? 1 : 0) + (a >= 80 ? 1 : 0);
          addMod(s, { kind: 'strike', factor: 0.7, months: m, label: 'Huelga general' });
          addRep(s, -6);
          addMoral(s, 5);
          agr(s, (x) => x - 10);
          c.huelgas++;
          s.stats.huelgas = (s.stats.huelgas || 0) + 1;
          return `${m === 1 ? 'Un mes' : `${m} meses`} de persianas a medio bajar. Las teles hacen directos en la puerta de Selaya. Reputación −6; la plantilla, unida, sale con la moral +5 y desahogada (agravio −10).`;
        },
      },
      {
        key: 'esquiroles',
        label: 'Contratar esquiroles',
        hint: 'Sustituir a huelguistas es ilegal: radar de Inspección +15, reputación −8, moral −10, agravio +10.',
        effect(s) {
          const c = comite(s);
          addHeatTrabajo(s, 15);
          addRep(s, -8);
          addMoral(s, -10);
          agr(s, (x) => x + 10);
          c.huelgas++;
          s.stats.huelgas = (s.stats.huelgas || 0) + 1;
          return 'Un autobús de una ETT trae a gente que no sabe ni dónde está el horno. Maripili lo graba todo. Radar de Inspección +15, reputación −8, moral −10, agravio +10.';
        },
      },
    ],
  },
];
