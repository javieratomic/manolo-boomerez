// Cartas de la Bolsa: la promesa del trimestre, el cierre apurado (con su maquillaje) y el informe del
// fondo bajista. La opción honrada va siempre la primera.
import { chance } from '../core/rng.js';
import { addRep, addHeatHacienda, money, moneyShort } from '../core/helpers.js';
import { GUIAS, promise, qLabel, qOf, moveSent, bolsaState, quarterProgress } from '../core/bolsa.js';
import { blamePaco } from '../core/inspections.js';

const pct = (x) => `${(x * 100).toFixed(0)} %`;
// Las cartas aguantan que no se cotice (p. ej. en el test de todas las cartas).
const ipoOf = (s) => {
  s.ipo ||= { month: s.month, float: 0.25, valuation: 1e7, price: 100, peak: 100, angryMonth: -99 };
  return bolsaState(s);
};
const guiaChoice = (key) => ({
  key,
  label: (s, p) => `${GUIAS[key].label}: ${moneyShort(Math.round((p?.base ?? 0) * (1 + (p?.g ?? 0) + GUIAS[key].d)))}`,
  hint: () => {
    const g = GUIAS[key];
    const on = [g.onPromise.sent ? `sentimiento ${g.onPromise.sent.toFixed(2).replace('.', ',')} ahora` : '', g.onPromise.fama ? `fama +${g.onPromise.fama} ahora` : ''].filter(Boolean).join(', ');
    return `${on ? `${on}. ` : ''}Si cumples: credibilidad +${g.met.cred}${g.met.sent ? ` y sentimiento +${g.met.sent.toFixed(2).replace('.', ',')}` : ''}. Si no: credibilidad ${g.fail.cred} y sentimiento ${g.fail.sent.toFixed(2).replace('.', ',')}${g.fail.junta ? ', y junta de accionistas' : ''}.`;
  },
  effect(s, p) {
    ipoOf(s);
    const target = promise(s, { qi: p?.qi ?? qOf(s.month) + 1, base: p?.base ?? 0, g: p?.g ?? 0 }, key);
    const tone = {
      prudente: 'Prometes poco y con voz de notario. Un analista bosteza.',
      en_linea: 'Dices lo que esperan oír. Los analistas asienten sin levantar la vista del móvil.',
      optimista: 'Hablas de "sinergias" y de "un trimestre histórico". Sale en la prensa económica. Fama +2.',
      tiburon: 'Prometes comerte el mercado "como un sobao: de dos bocados". Todos los titulares son tuyos. Fama +4.',
    }[key];
    return `${tone}\n\nObjetivo para el ${qLabel(p?.qi ?? qOf(s.month) + 1)}: ${money(target)} de beneficio.`;
  },
});

export const BOLSA_EVENTS = [
  {
    id: 'promesa_trimestre',
    title: 'La promesa del trimestre',
    portrait: 'portrait_banquero', image: 'ev_promesa_trimestre',
    memory: true,
    quickRepeat: true,
    text: (s, p) => `Videollamada con los analistas. Una cuadrícula de caras serias y un gráfico que sube.\n\nPara el ${qLabel(p?.qi ?? qOf(s.month) + 1)} esperan un ${pct(p?.g ?? 0)} más que el mismo trimestre del año pasado (${money(p?.base ?? 0)}). ¿Qué les dices?`,
    weight: () => 0,
    choices: [guiaChoice('prudente'), guiaChoice('en_linea'), guiaChoice('optimista'), guiaChoice('tiburon')],
  },
  {
    id: 'cierre_trimestre',
    title: 'El trimestre no llega',
    portrait: 'portrait_gestor_paco', image: 'ev_cierre_trimestre',
    text: (s, p) => {
      const pr = quarterProgress(s);
      const gap = p?.gap ?? Math.max(0, (pr?.target ?? 0) - (pr?.est ?? 0));
      return `Paco, de noche, con una hoja de cálculo impresa que llega al suelo.\n\n"Manolo, con lo que llevamos y lo que se espera del mes que falta, nos quedamos cortos: te faltan ${money(gap)}${pr?.target ? ` (un ${pct(gap / pr.target)})` : ''}. ¿Lo contamos tal cual o... lo arreglamos?"`;
    },
    weight: () => 0,
    choices: [
      {
        key: 'asumir',
        label: 'Asumirlo y explicarlo en la llamada',
        hint: 'Credibilidad −5 y sentimiento −0,02 ahora, pero sin cadáveres en el armario.',
        effect(s) {
          const ipo = ipoOf(s);
          ipo.cred = Math.max(0, ipo.cred - 5);
          moveSent(s, -0.02);
          return '"El trimestre ha sido difícil y lo vamos a contar tal cual." Un analista aplaude, solo. Credibilidad −5.';
        },
      },
      {
        key: 'franquicias',
        label: 'Adelantar la facturación a los franquiciados',
        hint: 'Mete este trimestre lo que vendes a las franquicias el mes que viene (se resta del siguiente). Cada franquicia suma un mes de pérdidas.',
        available: (s) => s.businesses.some((b) => b.mode === 'franquicia'),
        effect(s) {
          const ipo = ipoOf(s);
          const qi = ipo.q?.qi ?? qOf(s.month);
          const fr = (s.lastReport?.lines || []).filter((l) => l.franchise).reduce((a, l) => a + l.revenue, 0);
          ipo.maquillajes.push({ qi, tipo: 'franquicias', importe: Math.round(fr), descubierto: false });
          for (const b of s.businesses) if (b.mode === 'franquicia') b.extraLoss = (b.extraLoss || 0) + 1;
          return `Facturas por adelantado ${money(fr)} a los franquiciados "por la campaña que viene". Ellos pagan con cara de pocos amigos. Lo publicado sube; la caja, no.`;
        },
      },
      {
        key: 'gastos',
        label: 'Que Paco active gastos como "inversión"',
        hint: 'Pasa a activo parte del mantenimiento y la estructura del trimestre. Radar de Hacienda +6.',
        effect(s, p) {
          const ipo = ipoOf(s);
          const qi = ipo.q?.qi ?? qOf(s.month);
          const c = s.lastReport?.costs || {};
          const importe = Math.round(Math.min(p?.gap ?? Infinity, 1.5 * ((c.mantenimiento || 0) + (c.estructura || 0))));
          ipo.maquillajes.push({ qi, tipo: 'gastos', importe, descubierto: false });
          addHeatHacienda(s, 6);
          return `Paco convierte ${money(importe)} de facturas de fontanería en "inversión en activos estratégicos". Lo publicado sube; la caja, no. Radar de Hacienda +6.`;
        },
      },
    ],
  },
  {
    id: 'informe_bajista',
    title: 'EL SOBAO ESTÁ HUECO',
    portrait: 'portrait_banquero', image: 'ev_informe_bajista',
    text: (s, p) => `Un fondo bajista publica un informe de 60 páginas: "Boomerez S.A.: el sobao está hueco". Ha encontrado ${p?.n ?? 1} ${(p?.n ?? 1) === 1 ? 'apaño' : 'apaños'} en las cuentas publicadas.\n\nLa acción se desploma (sentimiento −0,10), los analistas no te cogen el teléfono (credibilidad −30), sales en todos los telediarios (reputación −10) y Hacienda toma nota (radar +25).${(s.ipo?.descubiertos ?? 0) >= 3 ? '\n\nY a la tercera, la fiscalía abre diligencias por falsedad contable.' : ''}`,
    weight: () => 0,
    choices: [
      {
        key: 'perdon',
        label: 'Pedir perdón y rehacer las cuentas',
        hint: 'Credibilidad +5.',
        effect(s) {
          const ipo = ipoOf(s);
          ipo.cred = Math.min(100, ipo.cred + 5);
          return 'Rehaces las cuentas con un auditor de verdad y pides perdón en una nota de cuatro líneas. Credibilidad +5.';
        },
      },
      {
        key: 'demandar',
        label: 'Demandar al fondo',
        hint: 'Con Don Cosme: 30 % de que el mercado te crea (sentimiento +0,05). Si no, reputación −5.',
        effect(s) {
          if (s.perks.abogado && chance(s, 0.3)) {
            moveSent(s, 0.05, true);
            return 'Don Cosme encuentra una errata en la página 42 del informe y monta un escándalo. El mercado duda del fondo. Sentimiento +0,05.';
          }
          addRep(s, -5);
          return 'La demanda dura dos días en los periódicos y siete años en el juzgado. Todo el mundo se acuerda de por qué demandabas. Reputación −5.';
        },
      },
      {
        key: 'paco',
        label: 'Culpar a Paco',
        hint: (s) => (s.perks.gestor ? `Cuenta como una culpa más (${s.flags.pacoCulpas ?? 0}/3: a la tercera, Paco se va).` : 'No tienes gestor: nadie se lo cree.'),
        effect(s) {
          const teniaGestor = !!s.perks.gestor;
          const paco = blamePaco(s);
          return teniaGestor ? `"Las cuentas las hacía mi gestor." Paco te mira por encima de las gafas y apunta algo en una libreta.${paco}` : '"Las cuentas las hacía mi gestor." No tienes gestor: nadie se lo cree.';
        },
      },
    ],
  },
];
