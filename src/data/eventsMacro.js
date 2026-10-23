// Cartas de cambio de ciclo económico (se encolan desde core/macro.js).
import { addCash, addRep, addMoral, addFama, addHeatHacienda, addMod, money } from '../core/helpers.js';

const employees = (s) => s.lastReport?.employees ?? 10;

export const MACRO_EVENTS = [
  {
    id: 'macro_expansion',
    title: 'Vuelve la alegría',
    portrait: 'portrait_banquero', image: 'ev_macro_expansion',
    text: () => 'Los telediarios abren con récords de afiliación y de turistas. El director de la Caja Cantábrica vuelve a invitarte a comer. Empieza una fase de EXPANSIÓN: la demanda y el ladrillo suben.',
    weight: () => 0,
    choices: [
      {
        label: 'Subir precios "un poquito"',
        hint: 'Ingresos +5 % durante un año, reputación −3.',
        effect(s) {
          addMod(s, { kind: 'revenue', factor: 1.05, months: 12, label: 'Subida de precios' });
          addRep(s, -3);
          return 'Subes los precios un 10 % y lo llamas "ajuste por calidad". Los clientes refunfuñan, pero pagan.';
        },
      },
      {
        label: 'Mantener precios y ganar clientela',
        effect(s) {
          addRep(s, 3);
          return 'Tus precios de siempre en plena euforia: la gente lo valora. Reputación +3.';
        },
      },
    ],
  },
  {
    id: 'macro_burbuja',
    title: 'Esto no baja nunca',
    portrait: 'portrait_cunado_jonathan', image: 'ev_macro_burbuja',
    text: () => 'Los pisos suben cada mes, los bancos dan hipotecas al 110 % y tu cuñado Jonathan ha dejado su trabajo para "vivir del trading". Estamos en una BURBUJA. Nadie sabe cuánto durará. Bueno, todos lo saben, pero nadie lo dice.',
    weight: () => 0,
    choices: [
      {
        label: '¡A tope! Ampliar la póliza de crédito',
        hint: 'Límite de crédito +200.000 € (para siempre).',
        effect(s) {
          s.creditBonus += 200000;
          return 'El banco te amplía la póliza sin mirar los papeles. "Con lo bien que va todo, Manolo."';
        },
      },
      {
        label: 'Prudencia: amortizar parte de la deuda',
        effect(s) {
          const pay = Math.min(s.debt * 0.3, Math.max(0, s.cash));
          s.debt -= pay;
          addCash(s, -pay);
          addRep(s, 1);
          return pay > 0
            ? `Devuelves ${money(pay)} al banco. Tu gestor te mira con respeto. Tu cuñado, con lástima.`
            : 'No debes nada que amortizar. Te sientes sabio igualmente.';
        },
      },
      {
        label: 'Contárselo a todo el mundo en LinkedIn',
        effect(s) {
          addFama(s, 6);
          return '"El ladrillo es el mejor activo que existe. Fin." 4.000 likes. Fama +6.';
        },
      },
    ],
  },
  {
    id: 'macro_crisis',
    title: 'Estalla la crisis',
    portrait: 'portrait_manolo_scared', image: 'ev_macro_crisis',
    text: () => 'Quiebra un banco americano con un nombre que nadie sabía pronunciar y, tres semanas después, en Selaya nadie compra sobaos. CRISIS: baja la demanda, el ladrillo se desploma y el banco reduce tu límite de crédito.',
    weight: () => 0,
    choices: [
      {
        label: 'ERE: recortar plantilla y sueldos',
        hint: 'Costes laborales −15 % durante 8 meses; moral −12, reputación −4.',
        effect(s) {
          addMod(s, { kind: 'labor', factor: 0.85, months: 8, label: 'ERE' });
          addMoral(s, -12);
          addRep(s, -4);
          return `Anuncias el ERE en una reunión de diez minutos. Pagas ${money(employees(s) * 600)} en indemnizaciones, pero ahorras en nóminas. La plantilla que queda trabaja con miedo.`;
        },
      },
      {
        label: 'Pedir un préstamo ICO de 100.000 €',
        effect(s) {
          s.debt += 100000;
          addCash(s, 100000);
          addHeatHacienda(s, 2);
          return 'El Estado al que tanto criticas te presta 100.000 € a buen interés. Lo cuentas en las cenas como "una operación financiera".';
        },
      },
      {
        label: 'Aguantar sin despedir a nadie',
        effect(s) {
          addMoral(s, 8);
          addRep(s, 3);
          return 'Reúnes a la plantilla: "Aquí no se va nadie." Por una vez, lo de la familia Boomerez suena verdad. Moral +8, reputación +3.';
        },
      },
    ],
  },
  {
    id: 'macro_recuperacion',
    title: 'Brotes verdes',
    portrait: 'portrait_presentadora', image: 'ev_macro_recuperacion',
    text: () => 'Un ministro ve "brotes verdes". La economía entra en RECUPERACIÓN: el consumo se reanima poco a poco y los pisos dejan de caer.',
    weight: () => 0,
    choices: [
      {
        label: 'Recontratar y subir el ánimo',
        effect(s) {
          addMoral(s, 6);
          return 'Vuelves a contratar a gente del pueblo. Moral +6.';
        },
      },
      {
        label: 'Publicar "Yo nunca dejé de creer"',
        effect(s) {
          addFama(s, 5);
          return 'Tu post sobre resiliencia lo comparten 300 coaches. Fama +5.';
        },
      },
    ],
  },
];
