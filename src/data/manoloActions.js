// Acciones personales de Manolo: una por mes.
import { chance, int, pick } from '../core/rng.js';
import { addCash, addFama, addRep, addMoral, addHeatHacienda, addHeatTrabajo, log } from '../core/helpers.js';

export const MANOLO_ACTIONS = [
  {
    id: 'linkedin',
    name: 'Publicar una reflexión en LinkedIn',
    desc: 'Sube la fama (menos cuanto más famoso eres). Riesgo de ridículo viral.',
    icon: 'icon_action_linkedin', emoji: '💼',
    run(s) {
      const posts = [
        '"Hoy he despedido a un becario. Esto es lo que me enseñó sobre liderazgo 🧵"',
        '"Me levanto a las 4:30. Los sobaos no se hacen solos (los hace mi plantilla)."',
        '"Mi padre me dejó una empresa. Yo le he dejado un legado. #Mindset"',
        '"Los jóvenes de hoy no quieren trabajar. Por eso les pago como si no trabajaran."',
        '"¿Vacaciones? Mi vacación es ver crecer mi EBITDA."',
      ];
      const post = pick(s, posts);
      if (chance(s, 0.15)) {
        addFama(s, 12);
        addRep(s, -6);
        return `Publicas: ${post}\n\nSe hace viral... como meme. Te comparten 40.000 veces con el comentario "señor, no". Fama +12, reputación −6.`;
      }
      // Cuanto más famoso, menos te aporta otro post.
      const f = Math.max(1, Math.round(int(s, 5, 9) * (1 - s.fama / 130)));
      addFama(s, f);
      return `Publicas: ${post}\n\n${int(s, 80, 400)} reacciones, casi todas de coaches. Fama +${f}.`;
    },
  },
  {
    id: 'bar',
    name: 'Networking en el bar de Paco',
    desc: 'Cosas del bar: oportunidades, chivatazos o resaca.',
    icon: 'icon_action_bar', emoji: '🍺',
    run(s) {
      const r = int(s, 1, 10);
      if (r <= 4) {
        s.discountNext = 0.25;
        return 'Un conocido de un primo te consigue un local "a buen precio". Tu próxima apertura cuesta un 25 % menos.';
      }
      if (r <= 7) {
        addHeatTrabajo(s, -10);
        return 'El cuñado de un inspector te cuenta, tras tres orujos, que "están mirando mucho la hostelería". Te pones serio un par de semanas. Radar de Inspección −10.';
      }
      addCash(s, -180);
      return 'Invitas a todo el bar para demostrar que te va bien. 180 € y una resaca de las que hacen historia. No sacas nada en claro.';
    },
  },
  {
    id: 'alcalde',
    name: 'Comida con el alcalde (3.000 €)',
    desc: 'Te protege de normativas municipales 6 meses. A Hacienda no le hace gracia.',
    icon: 'icon_action_alcalde', emoji: '🏛️', cost: 3000,
    run(s) {
      addCash(s, -3000);
      s.flags.alcaldeShield = 6;
      addHeatHacienda(s, 3);
      return 'Chuletón, vino de reserva y puro. El alcalde te llama "un generador de riqueza". Durante 6 meses, las ordenanzas municipales te afectarán menos. Radar de Hacienda +3.';
    },
  },
  {
    id: 'charla',
    name: 'Charla motivacional a la plantilla',
    desc: 'Si pagas bien, sube la moral. Si no... depende.',
    icon: 'icon_action_charla', emoji: '📣',
    run(s) {
      if (s.policies.salario === 'convenio' && s.policies.horas === 'pagadas') {
        addMoral(s, 6);
        return 'Hablas de "la familia Boomerez" y, como pagas lo que toca, hasta te aplauden. Moral +6.';
      }
      if (chance(s, 0.5)) {
        addMoral(s, 3);
        return 'Proyectas una diapositiva con un tiburón y la palabra RESILIENCIA. Alguno se motiva. Moral +3.';
      }
      addMoral(s, -5);
      return 'Les dices que "el que no esté a gusto ya sabe dónde está la puerta". Alguien murmura "en la Inspección". Moral −5.';
    },
  },
  {
    id: 'cuentas',
    name: 'Revisar las cuentas con el gestor',
    desc: 'Radar de Hacienda −10. Aburrido pero útil.',
    icon: 'icon_action_cuentas', emoji: '🧾',
    run(s) {
      addHeatHacienda(s, -10);
      return 'Pasáis la tarde cuadrando tickets. Descubres que tu padre declaraba hasta los sobaos que regalaba. Radar de Hacienda −10.';
    },
  },
  {
    id: 'padel',
    name: 'Pádel con inversores',
    desc: 'Puede ampliar tu crédito bancario. Fama +2.',
    icon: 'icon_action_padel', emoji: '🎾',
    run(s) {
      addFama(s, 2);
      if (chance(s, 0.4)) {
        s.creditBonus += 100000;
        return 'Pierdes a propósito contra el director de la Caja Cantábrica. Te amplía la póliza en 100.000 €. Fama +2.';
      }
      return 'Ganas 6-0 6-0 al director del banco. Muy satisfactorio. Ninguna consecuencia financiera positiva. Fama +2.';
    },
  },
  {
    id: 'marbella',
    name: 'Desconectar en Marbella (6.000 €)',
    desc: 'Manolo descansa. La plantilla también (de él). Merche no va invitada: familia −8.',
    icon: 'icon_action_marbella', emoji: '🏖️', cost: 6000,
    run(s) {
      addCash(s, -6000);
      addMoral(s, 4);
      s.familia = Math.max(0, (s.familia ?? 60) - 8);
      log(s, '🏖️ Manolo sube 14 stories desde un beach club de Marbella.', 'info');
      return 'Una semana en un beach club, subiendo stories con el hashtag #NeverStopGrinding. Sin ti en la oficina, la plantilla trabaja más tranquila. Moral +4.';
    },
  },
];

MANOLO_ACTIONS.push(
  {
    id: 'cena',
    name: 'Cena familiar sin el móvil',
    desc: 'Familia +12. Manolo aguanta sin mirar LinkedIn (casi).',
    icon: 'icon_action_cena', emoji: '🍲',
    run(s) {
      s.familia = Math.min(100, (s.familia ?? 60) + 12);
      return s.flags.divorciado
        ? 'Cenas con tu madre, que te pregunta si comes bien. Te sienta de maravilla.'
        : 'Cocido montañés en casa de tu suegra. Mantienes el móvil boca abajo 47 minutos, tu récord personal. Familia +12.';
    },
  },
  {
    id: 'escapada',
    name: 'Escapada romántica con Merche (8.000 €)',
    desc: 'Familia +22 y moral +2 (sin el jefe todo va mejor).',
    icon: 'icon_action_escapada', emoji: '💐', cost: 8000,
    run(s) {
      addCash(s, -8000);
      addMoral(s, 2);
      s.familia = Math.min(100, (s.familia ?? 60) + 22);
      return s.flags.divorciado
        ? 'Te vas solo a un balneario de Cantabria. Sale caro, pero duermes como un bebé. Moral +2.'
        : 'Un fin de semana en un parador. Merche recuerda por qué se casó contigo (el chiste de los sobaos, que sigue haciéndole gracia). Familia +22.';
    },
  },
);

export const ACTION_BY_ID = Object.fromEntries(MANOLO_ACTIONS.map((a) => [a.id, a]));
