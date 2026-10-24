// Arcos narrativos de varios pasos. El progreso de cada arco vive en s.flags:
//   <arco>Step  = último paso resuelto
//   <arco>Month = mes en que se resolvió (para los plazos entre pasos)
// El primer paso sale por azar (weight). Los siguientes son forced + once: salen en cuanto se cumple el plazo.
// Lo que eliges en cada paso se guarda también en s.flags y cambia lo que pasa después.
//
// Arcos: prensa (Lucía Ferrer), jonathan (Sobaoverso), comite (convenio de Maripili),
//        hojaldre (corrupción municipal), merche (crisis de los 55), anselmo (la carta del padre).
import { chance, int } from '../core/rng.js';
import { recordSanction } from '../core/inspections.js';
import {
  addCash, addRep, addMoral, addFama, addHeatTrabajo, addHeatHacienda, addExpediente, addMod, addMonthlyCost, log, money, clamp, hito,
} from '../core/helpers.js';

const employees = (s) => s.lastReport?.employees ?? 10;
const has = (s, type) => s.businesses.some((b) => b.type === type);
const fine = (s, amount) => {
  addCash(s, -amount);
  s.stats.multas += amount;
};
const addFamilia = (s, d) => {
  s.familia = clamp((s.familia ?? 60) + d);
};
const advance = (s, arc, step) => {
  s.flags[`${arc}Step`] = step;
  s.flags[`${arc}Month`] = s.month;
};
// El arco está en el paso `step` y han pasado al menos `months` meses desde que se resolvió.
const ready = (s, arc, step, months) =>
  s.flags[`${arc}Step`] === step && s.month - (s.flags[`${arc}Month`] ?? Infinity) >= months;
// Los arcos solo empiezan si queda partida para terminarlos.
const canStart = (s, from) => s.month >= from && s.month <= 80;

// =====================================================================================
// Arco 1 · El reportaje de Lucía Ferrer ("El Confidencial Pasiego")
// El resultado depende de las políticas que tengas el día que sale y de cómo la trataste.
// =====================================================================================
const POLICY_DIRT = {
  salario: { convenio: 0, minimo: 0.5, negro: 2 },
  horas: { pagadas: 0, gratis: 1, tiburon: 2 },
  becarios: { ninguno: 0, algunos: 1, legion: 2 },
  contabilidad: { limpia: 0, creativa: 1, artistica: 2 },
  ingredientes: { mantequilla: 0, margarina: 0, misteriosa: 2 },
};

function trapos(s) {
  const p = s.policies;
  const t = [];
  if (p.salario === 'negro') t.push('los falsos autónomos cobrando en sobres');
  if (p.horas === 'gratis') t.push('las horas extra "voluntarias"');
  if (p.horas === 'tiburon') t.push('los turnos de catorce horas del "modo tiburón"');
  if (p.becarios === 'algunos') t.push('los becarios encadenados');
  if (p.becarios === 'legion') t.push('la legión de becarios a 400 €');
  if (p.contabilidad !== 'limpia') t.push('una contabilidad que haría llorar a un notario');
  if (p.ingredientes === 'misteriosa') t.push('los bidones de grasa sin etiqueta');
  if (has(s, 'vivienda') && p.alquiler === 'abusivo') t.push('los alquileres abusivos que pagas a tu propia plantilla');
  return t;
}

function prensaScore(s) {
  let n = 0;
  for (const [k, table] of Object.entries(POLICY_DIRT)) n += table[s.policies[k]] ?? 0;
  if (has(s, 'vivienda') && s.policies.alquiler === 'abusivo') n += 1;
  if (s.moral < 30) n += 1;
  n += { abierto: -1, comida: 1, hostil: 1, publicidad: 2 }[s.flags.prensaTrato] ?? 0;
  n += { libre: -1, nda: 2, regulariza: -1, maripili: 1 }[s.flags.prensaPlantilla] ?? 0;
  return n;
}

// Bueno solo si hoy no hay trapos sucios que contar; las decisiones previas mueven entre regular y malo.
function prensaTier(s) {
  const n = prensaScore(s);
  if (n <= 0 && trapos(s).length === 0) return 'bueno';
  return n < 4 ? 'regular' : 'malo';
}

// Efectos del reportaje (comunes a todas las respuestas del paso 3).
function prensaImpacto(s) {
  const tier = prensaTier(s);
  if (tier === 'bueno') {
    addRep(s, 8);
    addFama(s, 4);
    addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.06, months: 6, label: 'Buena prensa' });
    return { tier, fx: 'Reportaje: reputación +8, fama +4 y ventas de sobaos +6 % durante 6 meses.' };
  }
  if (tier === 'regular') {
    addRep(s, -3);
    addFama(s, 5);
    return { tier, fx: 'Reportaje: reputación −3, fama +5.' };
  }
  addRep(s, -12);
  addFama(s, 6);
  addHeatTrabajo(s, 15);
  addHeatHacienda(s, 10);
  return { tier, fx: 'Reportaje: reputación −12, fama +6, radar de Inspección +15 y radar de Hacienda +10.' };
}

const ARC_PRENSA = [
  {
    id: 'arc_prensa_1',
    title: 'Una periodista hace preguntas',
    portrait: 'portrait_periodista', image: 'ev_arc_prensa_llamada',
    text: (s) =>
      'Te llama Lucía Ferrer, de "El Confidencial Pasiego". Voz tranquila, educada, y una libreta de espiral que se oye pasar ' +
      `por el teléfono.\n\n"Don Manuel, estoy preparando un reportaje largo sobre su empresa: ${s.businesses.length} negocios en ` +
      `${Math.max(1, Math.floor(s.month / 12))} año${s.month >= 24 ? 's' : ''}. Quería darle la oportunidad de contar su versión."\n\n` +
      'Un reportaje largo. En el periódico que lee tu madre.',
    weight: (s) => (canStart(s, 12) && s.businesses.length >= 3 ? 1.4 : 0),
    once: true,
    choices: [
      {
        label: 'Concederle la entrevista y enseñarle el obrador',
        hint: 'La transparencia ayuda... si no tienes nada que esconder.',
        effect(s) {
          advance(s, 'prensa', 1);
          s.flags.prensaTrato = 'abierto';
          addFama(s, 3);
          return 'Le enseñas el horno de tu padre, las bandejas y hasta la cámara frigorífica. Lucía lo apunta todo, también lo bueno. Te dice que volverá en unos meses. Fama +3.';
        },
      },
      {
        label: 'Invitarla a comer para "orientar el enfoque"',
        effect(s) {
          advance(s, 'prensa', 1);
          s.flags.prensaTrato = 'comida';
          addCash(s, -120);
          return 'Pides cocido para dos y dos orujos. Lucía paga lo suyo, te da las gracias y anota en la libreta: "14:35. Intenta invitarme". Pagas 120 € de cocido que te comes tú solo.';
        },
      },
      {
        label: 'Amenazarla con Don Cosme',
        effect(s) {
          advance(s, 'prensa', 1);
          s.flags.prensaTrato = 'hostil';
          addRep(s, -2);
          return '"Mi abogado ya defendía a mi padre." "Lo sé, Don Manuel. Mi abuela trabajó en su obrador." Se despide con educación. Tú no. Reputación −2.';
        },
      },
      {
        label: 'Comprar publicidad en el periódico (6.000 €) a cambio de "cariño"',
        hint: 'El director es un señor muy razonable. La periodista, no tanto.',
        effect(s) {
          advance(s, 'prensa', 1);
          s.flags.prensaTrato = 'publicidad';
          addCash(s, -6000);
          addFama(s, 2);
          return 'El director acepta encantado la campaña "Sobaos Boomerez, el sabor de la tierra". Lucía se entera de la conversación y abre una carpeta nueva. Pagas 6.000 €. Fama +2.';
        },
      },
    ],
  },
  {
    id: 'arc_prensa_2',
    title: 'Lucía habla con la plantilla',
    portrait: 'portrait_periodista', image: 'ev_arc_prensa_plantilla',
    text: (s) => {
      const intro = {
        abierto: 'Lucía ha vuelto, como prometió.',
        comida: 'Lucía ha vuelto. Esta vez trae su propio bocadillo.',
        hostil: 'Lucía no ha vuelto a llamarte. No le ha hecho falta.',
        publicidad: 'Tu anuncio sale cada domingo en la página 3. El reportaje de Lucía, cuando salga, irá en portada.',
      }[s.flags.prensaTrato] ?? 'Lucía sigue con su reportaje.';
      const t = trapos(s);
      return `${intro} Lleva semanas tomando cafés con extrabajadores, proveedores y vecinos. Hoy espera en la puerta del obrador ` +
        'a la salida del turno de mañana, y Maripili ha salido a saludarla.\n\n' +
        (t.length
          ? `Lo que la plantilla le cuente depende de lo que haya que contar. Y hay cosas que contar: ${t.slice(0, 2).join(' y ')}.`
          : 'Lo que la plantilla le cuente depende de lo que haya que contar. Y ahora mismo, sorprendentemente, no hay gran cosa.');
    },
    weight: (s) => (ready(s, 'prensa', 1, 3) ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        label: 'Que hable con quien quiera',
        effect(s) {
          advance(s, 'prensa', 2);
          s.flags.prensaPlantilla = 'libre';
          if (trapos(s).length) {
            addMoral(s, 3);
            return 'Dices en voz alta que cada cual puede hablar con libertad. Algunos no se lo creen; otros lo aprovechan. Moral +3.';
          }
          addRep(s, 2);
          return 'Hablan con libertad. Lo más grave que le cuentan es que pones la radio muy alta. Reputación +2.';
        },
      },
      {
        label: 'Hacer firmar a toda la plantilla un acuerdo de confidencialidad',
        hint: 'Nada dice "no tengo nada que esconder" como un documento de nueve páginas.',
        effect(s) {
          advance(s, 'prensa', 2);
          s.flags.prensaPlantilla = 'nda';
          addMoral(s, -6);
          addHeatTrabajo(s, 6);
          return 'Don Cosme redacta nueve páginas. Maripili las lee en voz alta en el vestuario y se oyen carcajadas. Lucía tiene una copia antes de que se seque la tinta. Moral −6, radar de Inspección +6.';
        },
      },
      {
        label: 'Regularizar a toda prisa antes de que salga',
        hint: 'Contratos, horas pagadas, fuera becarios y atrasos para todos.',
        effect(s) {
          const cost = employees(s) * 250;
          advance(s, 'prensa', 2);
          s.flags.prensaPlantilla = 'regulariza';
          addCash(s, -cost);
          Object.assign(s.policies, { salario: 'convenio', horas: 'pagadas', becarios: 'ninguno' });
          addMoral(s, 8);
          addHeatTrabajo(s, -10);
          return `Contratos de verdad, horas extra pagadas y ${money(cost)} en atrasos. La plantilla sospecha que hay una periodista detrás, y tiene razón. Moral +8, radar de Inspección −10.`;
        },
      },
      {
        label: 'Ofrecer a Maripili un ascenso para que hable bien de ti',
        effect(s) {
          advance(s, 'prensa', 2);
          s.flags.prensaPlantilla = 'maripili';
          addMoral(s, -4);
          return '"¿Encargada general, Manolo? ¿Con qué sueldo?" "Con prestigio, Maripili." Se lo cuenta a Lucía con todo detalle, incluida la palabra "prestigio". Moral −4.';
        },
      },
    ],
  },
  {
    id: 'arc_prensa_3',
    title: 'Sale el reportaje',
    portrait: 'portrait_periodista', image: 'ev_arc_prensa_portada',
    text: (s) => {
      const tier = prensaTier(s);
      const t = trapos(s);
      const head = {
        bueno: '"EL SOBAO QUE NO SE VENDIÓ". Un reportaje sorprendentemente amable: el obrador de Don Anselmo sigue en pie, la plantilla cobra lo que toca y el dueño, aunque habla demasiado de sí mismo, paga sus impuestos.',
        regular: '"LUCES Y SOMBRAS DEL IMPERIO BOOMEREZ". Un retrato con matices: buenos sobaos, crecimiento a toda prisa y un dueño que confunde a la plantilla con su público de LinkedIn.',
        malo: '"LA TRASTIENDA DEL SOBAO". Doce páginas con nóminas, audios y fotos.',
      }[tier];
      const detail = tier === 'malo' && t.length ? ` Sale todo: ${t.join(', ')}.` : '';
      return `Domingo. "El Confidencial Pasiego" abre con el reportaje de Lucía Ferrer:\n\n${head}${detail}\n\nTu madre ya te ha llamado dos veces.`;
    },
    weight: (s) => (ready(s, 'prensa', 2, 3) ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        label: 'Dar la cara y comprometerte a cambiar lo que haya que cambiar',
        effect(s) {
          const { tier, fx } = prensaImpacto(s);
          advance(s, 'prensa', 3);
          s.flags.prensaFinal = 'cara';
          if (tier === 'bueno') {
            addRep(s, 2);
            return `Das las gracias en Radio Pas e incluso mencionas a tu padre. ${fx} Por la humildad: reputación +2.`;
          }
          addRep(s, 4);
          addMoral(s, 4);
          return `Pides perdón en Radio Pas sin leer de un papel. Lucía escribe una nota breve: "Al menos, contesta". ${fx} Por dar la cara: reputación +4, moral +4.`;
        },
      },
      {
        label: 'Querellarte contra el periódico (Don Cosme, 8.000 €)',
        hint: 'Querellarse contra un periódico siempre sale en el periódico.',
        effect(s) {
          const { tier, fx } = prensaImpacto(s);
          advance(s, 'prensa', 3);
          s.flags.prensaFinal = 'querella';
          addCash(s, -8000);
          addRep(s, -4);
          if (tier === 'bueno') {
            return `Te querellas contra un reportaje que te deja BIEN porque "no mencionaba suficiente mi visión". Don Cosme te cobra 8.000 € igual. ${fx} Por la querella: reputación −4.`;
          }
          addFama(s, 4);
          return `Efecto Streisand de manual: el reportaje pasa de 3.000 lectores a 300.000. Pagas 8.000 € a Don Cosme. ${fx} Por la querella: reputación −4, fama +4.`;
        },
      },
      {
        label: 'Comprar el periódico (120.000 €)',
        hint: 'Si no puedes con ellos, cómpralos.',
        available: (s) => s.cash >= 120000,
        effect(s) {
          const { fx } = prensaImpacto(s);
          advance(s, 'prensa', 3);
          s.flags.prensaFinal = 'comprado';
          addCash(s, -120000);
          addFama(s, 3);
          log(s, '📰 Manolo Boomerez compra "El Confidencial Pasiego". Lucía Ferrer dimite esa misma tarde.', 'news');
          return `El editor te vende la cabecera "con todo el cariño", y con una deuda con la imprenta. Lucía Ferrer dimite esa misma tarde con tres compañeros. Pagas 120.000 €. ${fx} Fama +3.`;
        },
      },
      {
        label: 'Compartirlo en LinkedIn como si fuera un elogio',
        effect(s) {
          const { fx } = prensaImpacto(s);
          advance(s, 'prensa', 3);
          s.flags.prensaFinal = 'linkedin';
          addFama(s, 5);
          return `"Orgulloso de que los medios cuenten nuestra historia 🚀 #Resiliencia". 2.000 reacciones, casi todas de gente que no lo ha leído. ${fx} Fama +5.`;
        },
      },
    ],
  },
  {
    id: 'arc_prensa_4',
    title: 'El reportaje, segunda parte',
    portrait: 'portrait_periodista', image: 'ev_arc_prensa_juicio',
    text: (s) =>
      s.flags.prensaFinal === 'querella'
        ? 'Llega el juicio por tu querella contra "El Confidencial Pasiego". Lucía Ferrer aparece con tres cajas de documentación y con su abuela, que trabajó en el obrador de tu padre y viene "a mirar".\n\nDon Cosme te susurra: "Manolo, todavía estamos a tiempo de retirarla."'
        : 'Seis meses con "El Confidencial Pasiego" en tus manos: has perdido la mitad de los suscriptores y la otra mitad lo lee para reírse. Mientras tanto, Lucía Ferrer y sus compañeros han fundado "La Pasiega Libre", una cooperativa de periodistas que ya vende más que tú.',
    weight: (s) => (ready(s, 'prensa', 3, 5) && ['querella', 'comprado'].includes(s.flags.prensaFinal) ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        label: 'Seguir adelante con el juicio',
        hint: '25 %: ganas. Si no: costas y otro titular.',
        available: (s) => s.flags.prensaFinal === 'querella',
        effect(s) {
          advance(s, 'prensa', 4);
          if (chance(s, 0.25)) {
            addRep(s, 3);
            return 'El juez considera "excesivo" el tono del reportaje. Ganas. No lo publica nadie, salvo tu LinkedIn. Reputación +3.';
          }
          fine(s, 12000);
          addRep(s, -6);
          addFama(s, 3);
          return 'El juez desestima la querella y te condena en costas: 12.000 €. Lucía publica la sentencia entera, con una foto de tu cara al salir. Reputación −6, fama +3.';
        },
      },
      {
        label: 'Retirar la querella y pedir disculpas',
        available: (s) => s.flags.prensaFinal === 'querella',
        effect(s) {
          advance(s, 'prensa', 4);
          addCash(s, -3000);
          addRep(s, 3);
          return 'Pagas 3.000 € de costas y pides disculpas. La abuela de Lucía te da una palmadita: "Tu padre también era cabezota, pero rectificaba". Reputación +3.';
        },
      },
      {
        label: 'Convertirlo en el boletín oficial de tus logros',
        available: (s) => s.flags.prensaFinal !== 'querella',
        effect(s) {
          advance(s, 'prensa', 4);
          addMonthlyCost(s, 'Pérdidas de "El Confidencial Pasiego"', 3000, 12);
          addFama(s, 5);
          addRep(s, -5);
          return 'Portada semanal: "Boomerez abre otra tienda". Contraportada: "Boomerez, visto por Boomerez". Pierdes 3.000 € al mes durante un año. Fama +5, reputación −5.';
        },
      },
      {
        label: 'Vendérselo a la cooperativa de Lucía por 1 €',
        available: (s) => s.flags.prensaFinal !== 'querella',
        effect(s) {
          advance(s, 'prensa', 4);
          addCash(s, 1);
          addRep(s, 6);
          addFama(s, 2);
          return 'Les vendes la cabecera por un euro, que cobras en mano. Los 120.000 € no vuelven, pero algo de dignidad sí. Lucía te hace una última entrevista, y esta vez sales bien. Reputación +6, fama +2.';
        },
      },
    ],
  },
];

// =====================================================================================
// Arco 2 · El Sobaoverso de Jonathan (acaba en la "Operación Bizcocho")
// =====================================================================================
function jonExpo(s) {
  const f = s.flags;
  let e = { dinero: 1, marca: f.jonMarcaRetirada ? 0 : 1, plantilla: 2 }[f.jonInv] ?? 0;
  if (f.jonDiamante) e += 2;
  if (f.jonSalida) e -= 1;
  if (f.jonDenuncia) e -= 3;
  return e;
}

const ARC_JONATHAN = [
  {
    id: 'arc_jonathan_1',
    title: 'El Sobaoverso',
    portrait: 'portrait_cunado_jonathan', image: 'ev_arc_jonathan_sobaoverso',
    text: () =>
      'Jonathan aparece con unas gafas de realidad virtual en la frente y una tarjeta que dice "Visionario".\n\n' +
      '"Cuñao, el futuro es el SOBAOVERSO: un metaverso donde la gente compra parcelas virtuales en un Valle del Pas digital y hornea sobaos NFT. ' +
      'Ya tengo 200 inversores. Bueno, 200 apuntados. Bueno, mi madre y un grupo de mensajería."',
    weight: (s) => (canStart(s, 8) && s.cash > 30000 ? 1.1 : 0),
    once: true,
    choices: [
      {
        label: 'Invertir 25.000 €',
        effect(s) {
          advance(s, 'jonathan', 1);
          s.flags.jonInv = 'dinero';
          addCash(s, -25000);
          return 'Te dan una parcela virtual con vistas a una vaca pixelada. Jonathan te abraza y te llama "socio fundador". Pagas 25.000 €.';
        },
      },
      {
        label: 'Prestarle solo la marca Boomerez',
        hint: 'No cuesta nada. De momento.',
        effect(s) {
          advance(s, 'jonathan', 1);
          s.flags.jonInv = 'marca';
          addFama(s, 3);
          return '"Sobaoverso, powered by Boomerez." Tu logo gira en 3D en un vídeo con música épica. Fama +3.';
        },
      },
      {
        label: 'Invertir 10.000 € y ofrecérselo a la plantilla como "plan de pensiones"',
        hint: '¿Qué podría salir mal?',
        effect(s) {
          advance(s, 'jonathan', 1);
          s.flags.jonInv = 'plantilla';
          addCash(s, -10000);
          addMoral(s, -4);
          addHeatTrabajo(s, 4);
          return 'Das una charla en el vestuario: "Chicos, esto es mejor que un plan de pensiones". Media plantilla compra parcelas. Maripili no, pero apunta los nombres. Pagas 10.000 €. Moral −4, radar de Inspección +4.';
        },
      },
      {
        label: '"Jonathan, eso es una pirámide"',
        effect(s) {
          advance(s, 'jonathan', 1);
          s.flags.jonInv = 'nada';
          addFamilia(s, -3);
          return '"Es una estructura de crecimiento escalonado, cuñao." Se va ofendido. Merche te pide que no discutáis en Nochebuena. Familia −3.';
        },
      },
    ],
  },
  {
    id: 'arc_jonathan_2',
    title: 'Gala Diamante',
    portrait: 'portrait_cunado_jonathan', image: 'ev_arc_jonathan_gala',
    text: (s) => {
      const you = {
        dinero: 'Tu parcela virtual "vale" ya el triple. En la pantalla. No hay forma de venderla.',
        plantilla: 'Las parcelas de tu plantilla "valen" el triple. En la pantalla. Nadie ha conseguido vender ninguna.',
        marca: 'Tu logo preside el escenario, entre dos cañones de humo.',
      }[s.flags.jonInv] ?? 'Te ha invitado igualmente, en primera fila, "para que veas lo que te pierdes".';
      return 'Jonathan ha alquilado el salón de bodas más grande de Santander para la "Gala Diamante del Sobaoverso". Llega en un descapotable de alquiler, con traje de lentejuelas, y sube al escenario entre bengalas.\n\n' +
        '"¡El que trae a tres socios sube a Nivel Diamante! ¡Y el que trae a tres Diamantes, a Nivel Sobao Supremo!"\n\n' + you;
    },
    weight: (s) => (ready(s, 'jonathan', 1, 4) ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        label: 'Subir a Nivel Diamante: captar a proveedores y franquiciados',
        hint: 'Comisiones ya. Y tu nombre en todas las diapositivas.',
        effect(s) {
          const c = int(s, 18, 32) * 1000;
          advance(s, 'jonathan', 2);
          s.flags.jonDiamante = true;
          addCash(s, c);
          addFama(s, 3);
          addRep(s, -2);
          return `Convences al de la mantequilla, a dos franquiciados y al director de la Caja Cantábrica. Cobras ${money(c)} en "comisiones de bienvenida". Fama +3, reputación −2.`;
        },
      },
      {
        label: 'Intentar recuperar lo invertido',
        hint: '55 %: Jonathan te devuelve el dinero.',
        available: (s) => ['dinero', 'plantilla'].includes(s.flags.jonInv),
        effect(s) {
          advance(s, 'jonathan', 2);
          if (chance(s, 0.55)) {
            s.flags.jonSalida = true;
            const back = s.flags.jonInv === 'dinero' ? 30000 : 12000;
            addCash(s, back);
            return `Jonathan te devuelve ${money(back)} en un sobre, en el baño del salón de bodas, "para no generar pánico". Ni preguntas de dónde sale.`;
          }
          return '"Está bloqueado en staking, cuñao. Es por tu bien." Vuelves a casa con un llavero holográfico y la misma parcela.';
        },
      },
      {
        label: 'Pedirle que quite tu logo de todo esto',
        available: (s) => s.flags.jonInv === 'marca',
        effect(s) {
          advance(s, 'jonathan', 2);
          s.flags.jonMarcaRetirada = true;
          addFamilia(s, -2);
          addFama(s, -2);
          return 'Jonathan quita tu logo del escenario con cara de traición. Lo sustituye por un tiburón con gafas. Familia −2, fama −2.';
        },
      },
      {
        label: 'Denunciarlo en comisaría (de forma anónima)',
        effect(s) {
          advance(s, 'jonathan', 2);
          s.flags.jonDenuncia = true;
          addFamilia(s, -6);
          return 'Vas a comisaría con gorra y gafas de sol. El agente te reconoce por el anuncio de los sobaos: "Gracias, Don Manuel. Ya teníamos a media comarca denunciando". Merche se acabará enterando. Familia −6.';
        },
      },
      {
        label: 'Aplaudir desde la primera fila sin meterte en nada',
        effect(s) {
          advance(s, 'jonathan', 2);
          return 'Aplaudes, te comes tres canapés y te llevas una foto con Jonathan que no deberías haberte hecho.';
        },
      },
    ],
  },
  {
    id: 'arc_jonathan_3',
    title: 'Operación Bizcocho',
    portrait: 'portrait_cunado_jonathan', image: 'ev_arc_jonathan_redada',
    text: (s) => {
      const e = jonExpo(s);
      const you = e >= 3
        ? 'Tu nombre aparece 47 veces en el sumario. Hay audios tuyos captando socios "con mentalidad" y una foto tuya en la Gala Diamante, con la copa en alto.'
        : e >= 1
          ? 'Tu nombre aparece en el sumario, en un grupo de chat llamado "Cuñaos al Millón" y en una diapositiva titulada "Socios de referencia".'
          : s.flags.jonDenuncia
            ? 'Tu nombre aparece en el sumario... en la denuncia que pusiste tú. Firmaste con nombre y apellidos, porque no sabías hacerlo de otra manera.'
            : 'Tu nombre aparece en el sumario de pasada: "cuñado del investigado; no consta participación". Respiras.';
      return 'A las seis de la mañana, la Policía Nacional entra en el piso de Jonathan. En la tele lo llaman "Operación Bizcocho": una estafa piramidal con 3.000 afectados, 4 millones volatilizados y un cuñado detenido en pijama de unicornio.\n\n' +
        `${you}\n\nMerche está en la cocina con el móvil en la mano, sin saber si llorar o matar a alguien. Es su hermano.`;
    },
    weight: (s) => (ready(s, 'jonathan', 2, 4) ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        label: 'Colaborar con la policía y devolver lo cobrado',
        effect(s) {
          const e = jonExpo(s);
          const c = e > 0 ? 6000 + e * 6000 + (s.flags.jonDiamante ? 10000 : 0) : 0;
          advance(s, 'jonathan', 3);
          s.flags.jonFinal = 'colabora';
          addFamilia(s, -5);
          log(s, '🚔 Operación Bizcocho: detenido Jonathan, cuñado de Manolo Boomerez. Manolo colabora con la policía.', 'news');
          if (c > 0) {
            fine(s, c);
            addRep(s, e >= 3 ? -3 : 2);
            return `Entregas tu móvil, tus capturas y ${money(c)} en comisiones y devoluciones. El juez te deja como testigo. Merche no te habla en una semana: has declarado contra su hermano. Reputación ${e >= 3 ? '−3' : '+2'}, familia −5.`;
          }
          addRep(s, 2);
          return 'Cuentas lo poco que sabes. El inspector te da las gracias y te pide un sobao para el turno de noche. Merche no te habla en una semana. Reputación +2, familia −5.';
        },
      },
      {
        label: 'Borrar los mensajes y salirte de "Cuñaos al Millón"',
        hint: 'Destruir pruebas es delito. Y la policía ya tiene el móvil de Jonathan.',
        effect(s) {
          const e = jonExpo(s);
          advance(s, 'jonathan', 3);
          s.flags.jonFinal = 'borra';
          log(s, '🚔 Operación Bizcocho: detenido Jonathan, cuñado de Manolo Boomerez.', 'news');
          if (e <= 0) {
            addRep(s, -1);
            return 'Borras todo. No había nada que esconder, pero ahora lo parece. El inspector arquea una ceja y lo apunta. Reputación −1.';
          }
          if (chance(s, 0.2 + 0.12 * e)) {
            addExpediente(s, 1, 'obstrucción a la justicia en la Operación Bizcocho');
            fine(s, 10000);
            addRep(s, -6);
            return 'La policía tiene los mismos mensajes en el móvil de Jonathan, en la nube y en una captura que hizo tu sobrino Kevin "por si acaso". Multa de 10.000 €, reputación −6.';
          }
          return 'Tu móvil queda más limpio que una sala blanca. Los peritos no encuentran nada. Por ahora.';
        },
      },
      {
        label: 'Pagar la fianza de Jonathan (30.000 €)',
        effect(s) {
          advance(s, 'jonathan', 3);
          s.flags.jonFinal = 'fianza';
          s.flags.jonFianza = true;
          addCash(s, -30000);
          addFamilia(s, 12);
          addRep(s, -3);
          log(s, '🚔 Operación Bizcocho: Manolo Boomerez paga la fianza de su cuñado.', 'news');
          return 'Jonathan sale del calabozo en pijama de unicornio y te abraza delante de las cámaras. Merche te da el primer beso en meses. Pagas 30.000 €. Familia +12, reputación −3.';
        },
      },
      {
        label: 'Llamar a Don Cosme',
        available: (s) => s.perks.abogado,
        effect(s) {
          const e = jonExpo(s);
          advance(s, 'jonathan', 3);
          s.flags.jonFinal = 'cosme';
          addCash(s, -6000);
          if (e >= 3) fine(s, 10000);
          addRep(s, -1);
          return `Don Cosme consigue que pases de investigado a testigo con una sola frase: "Mi cliente, señoría, no sabe ni hacer un pago con el móvil". Pagas 6.000 €${e >= 3 ? ' y 10.000 € en devoluciones' : ''}. Reputación −1.`;
        },
      },
    ],
  },
  {
    id: 'arc_jonathan_4',
    title: 'Jonathan quiere empezar de cero',
    portrait: 'portrait_cunado_jonathan', image: 'ev_arc_jonathan_obrador',
    text: () =>
      'Jonathan está en libertad provisional, sin pasaporte y sin sudadera de "HODL". Se presenta en el obrador con una bolsa del súper y los ojos rojos.\n\n' +
      '"Cuñao... Merche dice que me puedes dar trabajo. De verdad. Con nómina. Sé que no me lo merezco."',
    weight: (s) => (ready(s, 'jonathan', 3, 6) && s.flags.jonFianza ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        label: 'Darle trabajo en el obrador, con contrato de convenio',
        effect(s) {
          advance(s, 'jonathan', 4);
          addMonthlyCost(s, 'Sueldo de Jonathan (obrador, convenio)', 1900);
          addFamilia(s, 10);
          addMoral(s, 2);
          return 'Jonathan aprende a amasar con Maripili, que le trata con una paciencia que no merece ninguno de los dos hombres de esta familia. A los tres meses hace los mejores sobaos del turno de noche. Cuesta 1.900 €/mes. Familia +10, moral +2.';
        },
      },
      {
        label: 'Ficharle para la Academy: "Cómo perderlo todo y renacer"',
        hint: 'Vender el fracaso también es vender.',
        available: (s) => has(s, 'academy'),
        effect(s) {
          advance(s, 'jonathan', 4);
          addMonthlyCost(s, 'Jonathan, profesor de la Academy', 2500);
          addMod(s, { kind: 'revenue', category: 'formacion', factor: 1.15, months: 12, label: 'Curso de Jonathan' });
          addFama(s, 4);
          addRep(s, -3);
          addFamilia(s, 5);
          return 'El curso de Jonathan es lo más vendido de la Academy. Nadie sabe si es sátira. Él tampoco. Ingresos de la Academy +15 % durante un año. Cobra 2.500 €/mes. Fama +4, reputación −3, familia +5.';
        },
      },
      {
        label: 'Prestarle 5.000 € para su nuevo podcast de resiliencia',
        effect(s) {
          advance(s, 'jonathan', 4);
          addCash(s, -5000);
          addFamilia(s, 4);
          addFama(s, 1);
          return 'El podcast se llama "Caer para subir". Tiene once oyentes; uno eres tú, por compromiso. Pagas 5.000 €. Familia +4, fama +1.';
        },
      },
      {
        label: 'Que se busque la vida',
        effect(s) {
          advance(s, 'jonathan', 4);
          addFamilia(s, -10);
          return 'Jonathan se va a vivir a casa de tu suegra. Las cenas familiares de este año van a ser memorables. Familia −10.';
        },
      },
    ],
  },
];

// =====================================================================================
// Arco 3 · Maripili y el I Convenio de Obradores Boomerez
// Efectos permanentes vía s.wageIndex. Bien negociado acaba en firma; mal, en huelga.
// =====================================================================================
const comiteBien = (s) =>
  s.flags.comiteNeg === 'negocia' || (s.flags.comiteActitud === 'colabora' && s.flags.comiteNeg === 'largas');

const ARC_COMITE = [
  {
    id: 'arc_comite_1',
    title: 'Maripili quiere un convenio',
    portrait: 'portrait_empleada_maripili', image: 'ev_arc_comite_sobre',
    text: (s) =>
      'Maripili deja encima de tu mesa un sobre de papel de estraza. Dentro hay un calendario, una lista de nombres y el Estatuto de los Trabajadores subrayado en tres colores.\n\n' +
      `"Manolo, somos ${employees(s)}. Queremos una comisión negociadora y un convenio de empresa: con tablas salariales, registro horario y todo lo que tu padre nos prometía en las cenas de Navidad."`,
    weight: (s) => (!s.comite && canStart(s, 10) && employees(s) >= 25 ? (s.moral < 50 ? 2 : 1.3) : 0),
    once: true,
    choices: [
      {
        label: 'Facilitarlo: ceder la sala y poner café del bueno',
        effect(s) {
          advance(s, 'comite', 1);
          s.flags.comiteActitud = 'colabora';
          addMoral(s, 5);
          return 'Cedes la "sala de juntas" (la cocina del obrador) y pones café del bueno. Maripili desconfía de tanta amabilidad, pero lo anota a tu favor. Moral +5.';
        },
      },
      {
        label: 'Ofrecerle a Maripili ser encargada general a cambio de olvidarlo',
        effect(s) {
          advance(s, 'comite', 1);
          s.flags.comiteActitud = 'soborno';
          addMoral(s, -3);
          return '"Manolo, eso mismo le ofreció tu padre a mi madre en 1979. Y le dijo que no." Moral −3.';
        },
      },
      {
        label: 'Despedir a Maripili por "bajo rendimiento"',
        hint: 'Un despido por represalia. Los jueces de lo social leen mucho.',
        effect(s) {
          const c = int(s, 15, 25) * 1000;
          advance(s, 'comite', 1);
          s.flags.comiteActitud = 'represalia';
          fine(s, c);
          addMoral(s, -12);
          addHeatTrabajo(s, 18);
          addRep(s, -4);
          return `El juzgado declara el despido nulo por vulnerar derechos fundamentales. Maripili vuelve a su puesto con los salarios de tramitación y la plantilla la recibe con aplausos. Pagas ${money(c)}. Moral −12, radar de Inspección +18, reputación −4.`;
        },
      },
      {
        label: 'Montar un comité "paralelo" con tu sobrino Kevin',
        effect(s) {
          advance(s, 'comite', 1);
          s.flags.comiteActitud = 'amarillo';
          addMoral(s, -5);
          addHeatTrabajo(s, 8);
          return '"Comité de la Felicidad Boomerez": Kevin de presidente, Jonathan de secretario y tú de "observador". Moral −5, radar de Inspección +8.';
        },
      },
    ],
  },
  {
    id: 'arc_comite_2',
    title: 'La plataforma reivindicativa',
    portrait: 'portrait_empleada_maripili', image: 'ev_arc_comite_plataforma',
    text: (s) => {
      const intro = {
        colabora: 'La comisión ha trabajado en serio, en tu cocina y con tu café.',
        soborno: 'Maripili rechazó tu "ascenso" y ahora preside la comisión negociadora.',
        represalia: 'Maripili volvió readmitida por el juzgado y la eligieron presidenta de la comisión por unanimidad. Incluido Kevin.',
        amarillo: 'El comité de Kevin duró tres semanas. La plantilla eligió a Maripili con todos los votos menos dos (Kevin y su madre).',
      }[s.flags.comiteActitud] ?? 'La comisión negociadora está lista.';
      return `${intro}\n\nTe presentan su plataforma: una subida del 6 %, registro horario de verdad, el fin de los becarios encadenados` +
        `${has(s, 'vivienda') ? ', un tope al alquiler de los pisos de la plantilla' : ''} y que el sobao de la merienda deje de descontarse de la nómina.`;
    },
    weight: (s) => (ready(s, 'comite', 1, 3) ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        label: 'Negociar de buena fe',
        effect(s) {
          advance(s, 'comite', 2);
          s.flags.comiteNeg = 'negocia';
          addMoral(s, 3);
          return 'Te sientas, escuchas y no miras el móvil. Maripili te mira como quien ve hablar a un perro. Moral +3.';
        },
      },
      {
        label: 'Dar largas: "Lo vemos después de Navidad"',
        effect(s) {
          advance(s, 'comite', 2);
          s.flags.comiteNeg = 'largas';
          addMoral(s, -4);
          return '"¿De qué Navidad, Manolo?" Nadie se ríe. Moral −4.';
        },
      },
      {
        label: 'Contraofertar: futbolín, fruta los lunes y un "Chief Happiness Officer"',
        effect(s) {
          advance(s, 'comite', 2);
          s.flags.comiteNeg = 'futbolin';
          addCash(s, -2500);
          addMoral(s, -5);
          return 'Instalas un futbolín en el vestuario y nombras a Kevin Chief Happiness Officer. La plantilla juega un partido. Contra ti, metafóricamente. Pagas 2.500 €. Moral −5.';
        },
      },
      {
        label: 'Amenazar con llevarte el obrador a Portugal',
        effect(s) {
          advance(s, 'comite', 2);
          s.flags.comiteNeg = 'amenaza';
          addMoral(s, -8);
          addRep(s, -3);
          return '"¿A Portugal? ¿Los sobaos pasiegos?" Hasta el conductor del camión de la mantequilla se ríe. Moral −8, reputación −3.';
        },
      },
    ],
  },
  {
    id: 'arc_comite_3a',
    title: 'El I Convenio de Obradores Boomerez',
    portrait: 'portrait_empleada_maripili', image: 'ev_arc_comite_firma',
    text: () =>
      'Tras catorce reuniones, seis cafeteras y una discusión épica sobre la merienda, hay un texto: el I Convenio Colectivo de Obradores Boomerez.\n\n' +
      'Maripili lo deja sobre la mesa con un bolígrafo. Es el de tu padre; lo guardaba ella.',
    weight: (s) => (ready(s, 'comite', 2, 3) && comiteBien(s) ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        label: 'Firmarlo entero',
        hint: 'Salarios +6 % para siempre, legalidad laboral y una plantilla que rinde más.',
        effect(s) {
          advance(s, 'comite', 3);
          s.flags.comiteFin = 'firmado';
          hito(s, 'convenio');
          s.wageIndex = (s.wageIndex || 1) * 1.06;
          Object.assign(s.policies, { salario: 'convenio', horas: 'pagadas', becarios: 'ninguno' });
          s.flags.forcedLegal = Math.max(s.flags.forcedLegal || 0, 12);
          s.flags.forcedBy = 'convenio';
          addMod(s, { kind: 'revenue', factor: 1.04, months: 36, label: 'Convenio Boomerez' });
          addMoral(s, 15);
          addHeatTrabajo(s, -20);
          log(s, '🤝 Se firma el I Convenio de Obradores Boomerez.', 'good');
          return 'Firmas. Maripili te da la mano y, por primera vez, te llama "Manuel". La productividad sube y la Inspección pierde interés. Costes salariales +6 % para siempre, ingresos +4 % durante 3 años, moral +15, radar de Inspección −20.';
        },
      },
      {
        label: 'Firmar una versión "light" (subida del 3 %)',
        effect(s) {
          advance(s, 'comite', 3);
          s.flags.comiteFin = 'light';
          s.wageIndex = (s.wageIndex || 1) * 1.03;
          s.policies.salario = 'convenio';
          addMoral(s, 6);
          return 'Regateas como en un rastrillo. Queda una subida del 3 % y un registro horario "flexible". Maripili firma con la boca pequeña. Salario de convenio para toda la plantilla y costes salariales +3 % para siempre, moral +6.';
        },
      },
      {
        label: 'Levantarte de la mesa en el último minuto',
        hint: 'Muy de película. Poco de empresa.',
        effect(s) {
          advance(s, 'comite', 3);
          s.flags.comiteFin = 'roto';
          addMod(s, { kind: 'strike', factor: 0.7, months: 1, label: 'Paro por el convenio' });
          addMoral(s, -12);
          addRep(s, -2);
          return 'Te levantas diciendo "esto no es lo que hablamos". Lo era. Paro de un mes. Producción −30 %, moral −12, reputación −2.';
        },
      },
    ],
  },
  {
    id: 'arc_comite_3b',
    title: 'Huelga indefinida',
    portrait: 'portrait_empleada_maripili', image: 'ev_arc_comite_huelga',
    text: (s) => {
      const why = {
        largas: 'Llevas meses diciendo "después de Navidad". Ya ha pasado la Navidad. Dos veces, según Maripili.',
        futbolin: 'El futbolín sigue en el vestuario. Lo están usando para apoyar las pancartas.',
        amenaza: 'Lo de Portugal salió en la radio. En Portugal también.',
      }[s.flags.comiteNeg] ?? 'La negociación no ha ido a ninguna parte.';
      return `${why} La asamblea vota huelga indefinida: ${Math.max(6, employees(s) - 2)} votos a favor y 2 en contra (Kevin y el robot amasador, que no vota, pero Kevin lo cuenta).\n\n` +
        'Piquete pacífico a la puerta del obrador. La pancarta dice: "SIN CONVENIO NO HAY SOBAO".';
    },
    weight: (s) => (ready(s, 'comite', 2, 3) && !comiteBien(s) ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        label: 'Ceder y firmar el convenio',
        effect(s) {
          advance(s, 'comite', 3);
          s.flags.comiteFin = 'cedido';
          hito(s, 'convenio');
          s.wageIndex = (s.wageIndex || 1) * 1.07;
          Object.assign(s.policies, { salario: 'convenio', horas: 'pagadas' });
          addMoral(s, 12);
          addRep(s, 2);
          return 'Firmas sobre el capó del Audi, delante del piquete. Primero, aplausos irónicos; luego, sinceros. Salario de convenio y horas extra pagadas; costes salariales +7 % para siempre, moral +12, reputación +2.';
        },
      },
      {
        label: 'Aguantar el pulso',
        effect(s) {
          advance(s, 'comite', 3);
          s.flags.comiteFin = 'huelga';
          addMod(s, { kind: 'strike', factor: 0.55, months: 2, label: 'Huelga indefinida' });
          addRep(s, -6);
          addMoral(s, 4);
          return 'Dos meses de huelga. Los vecinos llevan caldo al piquete y el pueblo entero compra sobaos de otro obrador "por solidaridad". Producción a poco más de la mitad durante 2 meses. Reputación −6, moral +4 (la plantilla, al menos, está unida).';
        },
      },
      {
        label: 'Traer trabajadores de una ETT para sustituirlos',
        hint: 'Sustituir a huelguistas es ilegal. La Inspección lo sabe.',
        effect(s) {
          advance(s, 'comite', 3);
          s.flags.comiteFin = 'esquiroles';
          addHeatTrabajo(s, 22);
          addRep(s, -8);
          addMoral(s, -10);
          if (chance(s, 0.6)) {
            const c = int(s, 20, 40) * 1000;
            fine(s, c);
            recordSanction(s);
            return `La inspectora Marisa Ortega se presenta el segundo día, cuenta las cabezas y saca el bolígrafo. Multa por vulnerar el derecho de huelga: ${money(c)}. Radar de Inspección +22, reputación −8, moral −10.`;
          }
          return 'Los de la ETT aguantan tres días; al cuarto se unen al piquete. Radar de Inspección +22, reputación −8, moral −10.';
        },
      },
      {
        label: 'Pedirle a Don Cosme una mediación',
        available: (s) => s.perks.abogado,
        effect(s) {
          advance(s, 'comite', 3);
          s.flags.comiteFin = 'mediado';
          addCash(s, -4000);
          s.wageIndex = (s.wageIndex || 1) * 1.04;
          s.policies.salario = 'convenio';
          addMoral(s, 8);
          return 'Don Cosme os encierra a Maripili y a ti en una sala con sobaos y no os deja salir hasta que firméis. Subida del 4 %. Pagas 4.000 € de minuta. Salario de convenio para toda la plantilla y costes salariales +4 % para siempre, moral +8.';
        },
      },
    ],
  },
];

// =====================================================================================
// Arco 4 · Operación Hojaldre (corrupción municipal)
// Solo si Manolo ha tenido tratos con el alcalde (acción "Comida con el alcalde", favores en las fiestas,
// la recalificación del prado) o si Hacienda ya le tiene muy vigilado.
// =====================================================================================
const hojaldreLink = (s) =>
  s.flags.alcaldeShield != null || s.flags.alcaldeAmigo || s.flags.alcaldeGrabacion ||
  s.seen?.pisos_prohibidos != null || s.heatHacienda >= 40;

function hojaldreVinculo(s) {
  if (s.flags.alcaldeAmigo) return 'En una libreta del alcalde, entre "orquesta" y "recalificaciones", aparece tu nombre subrayado dos veces.';
  if (s.flags.alcaldeShield != null) return 'Tú comiste con él. Varias veces. Pagabas tú, con factura y con chuletón.';
  if (s.flags.alcaldeGrabacion) return 'Tú tienes en el móvil una carpeta llamada "Seguro de vida" con un audio del alcalde pidiéndote un donativo entre el chuletón y el orujo.';
  if (s.seen?.pisos_prohibidos != null) return 'En el sumario aparecen las licencias de pisos turísticos de media comarca. Las tuyas llevan un pósit amarillo.';
  return 'Hacienda ha cruzado tus facturas con las del ayuntamiento y hay un par que se parecen demasiado.';
}

function hojaldreExpo(s) {
  const f = s.flags;
  let e = { testigo: -2, abogado: -1, destruye: 2, huye: 1 }[f.hojaldreRol] ?? 0;
  e += { verdad: -1, calla: 0, culpa: 1, sobaos: 2 }[f.hojaldreDecl] ?? 0;
  if (f.alcaldeAmigo || f.alcaldeShield != null) e += 1;
  if (f.alcaldeGrabacion) e -= 2;
  return e;
}

const ARC_HOJALDRE = [
  {
    id: 'arc_hojaldre_1',
    title: 'Operación Hojaldre',
    portrait: 'portrait_alcalde', image: 'ev_arc_hojaldre_registro',
    text: (s) =>
      'La Guardia Civil entra en el ayuntamiento con cajas de cartón vacías y sale con cajas llenas. Los telediarios lo llaman "Operación Hojaldre": licencias a cambio de comidas, una recalificación con vistas al río y un alcalde que declaraba catorce chuletones al mes como "gastos de protocolo".\n\n' +
      `${hojaldreVinculo(s)}\n\nEsa noche, el alcalde te llama desde una cabina (no sabías que quedaban cabinas): "Manolo, tú de los chuletones no sabes nada, ¿eh? Nada."`,
    weight: (s) => (canStart(s, 18) && hojaldreLink(s) ? 3 : 0),
    once: true,
    choices: [
      {
        label: 'Presentarte en el juzgado para contar lo que sabes',
        effect(s) {
          advance(s, 'hojaldre', 1);
          s.flags.hojaldreRol = 'testigo';
          addRep(s, 2);
          return 'La jueza agradece tu colaboración y te cita como testigo. En el pueblo te miran raro: unos como a un héroe y otros como a un chivato. Reputación +2.';
        },
      },
      {
        label: 'Quemar las facturas de los chuletones en el horno del obrador',
        hint: 'Destruir pruebas. Muy pasiego. Muy delito.',
        effect(s) {
          advance(s, 'hojaldre', 1);
          s.flags.hojaldreRol = 'destruye';
          addHeatHacienda(s, 6);
          return 'El papel térmico arde mal y la hornada de esa noche sabe a ticket. Un becario te ha visto. Radar de Hacienda +6.';
        },
      },
      {
        label: 'Llamar a Don Cosme',
        available: (s) => s.perks.abogado,
        effect(s) {
          advance(s, 'hojaldre', 1);
          s.flags.hojaldreRol = 'abogado';
          addCash(s, -6000);
          return 'Don Cosme abre una carpeta nueva: "Hojaldre. Boomerez, segunda generación". Ya defendió a tu padre en un asunto de 1987 del que nadie habla. Pagas 6.000 €.';
        },
      },
      {
        label: 'Irte un mes a Marbella hasta que escampe',
        effect(s) {
          advance(s, 'hojaldre', 1);
          s.flags.hojaldreRol = 'huye';
          addCash(s, -8000);
          addRep(s, -4);
          addFama(s, 2);
          return 'Subes stories desde un beach club mientras tu nombre sale en el telediario. La combinación no ayuda. Pagas 8.000 €. Reputación −4, fama +2.';
        },
      },
    ],
  },
  {
    id: 'arc_hojaldre_2',
    title: 'Citado a declarar',
    portrait: 'portrait_alcalde', image: 'ev_arc_hojaldre_juzgado',
    text: (s) => {
      const rol = s.flags.hojaldreRol;
      return `El juzgado de instrucción de Torrelavega te cita a declarar ${rol === 'testigo' ? 'como testigo' : 'como investigado'}. ` +
        'En el sumario hay una libreta del alcalde con tu nombre: "M. Boomerez: 3 chuletones, 1 licencia, 1 caja de sobaos (de los buenos)".' +
        (rol === 'destruye' ? ' El becario que te vio quemar las facturas también está citado.' : '') +
        (rol === 'huye' ? ' La jueza ha visto tus stories de Marbella. Todas.' : '');
    },
    weight: (s) => (ready(s, 'hojaldre', 1, 3) ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        label: 'Contar la verdad: comidas a cambio de licencias',
        effect(s) {
          advance(s, 'hojaldre', 2);
          s.flags.hojaldreDecl = 'verdad';
          addRep(s, -3);
          return 'Lo cuentas todo, con fechas y postres. La fiscal toma notas con cara de "por fin uno". Reputación −3.';
        },
      },
      {
        label: 'Acogerte a tu derecho a no declarar',
        effect(s) {
          advance(s, 'hojaldre', 2);
          s.flags.hojaldreDecl = 'calla';
          return 'Dices "me acojo a mi derecho a no declarar" con voz de serie de abogados. La jueza bosteza. Sales en quince minutos.';
        },
      },
      {
        label: 'Culpar al alcalde: "Me obligaba a invitarle"',
        effect(s) {
          advance(s, 'hojaldre', 2);
          s.flags.hojaldreDecl = 'culpa';
          addFama(s, 2);
          return '"Señoría, yo era una víctima del chuletón." La sala se ríe. La fiscal, no. Fama +2.';
        },
      },
      {
        label: 'Llevar una caja de sobaos "para el personal del juzgado"',
        hint: '40 %: alguien lo interpreta como lo que es.',
        effect(s) {
          advance(s, 'hojaldre', 2);
          s.flags.hojaldreDecl = 'sobaos';
          if (chance(s, 0.4)) {
            addExpediente(s, 1, 'intento de cohecho en la Operación Hojaldre');
            addRep(s, -5);
            return 'La letrada de la Administración de Justicia levanta acta de la caja, la fotografía y la devuelve precintada. "Caja de sobaos, tamaño familiar, ofrecida durante una declaración". Reputación −5.';
          }
          return 'El personal del juzgado se come los sobaos y la jueza no se entera. El ujier te guiña un ojo. No sabes si eso es bueno.';
        },
      },
    ],
  },
  {
    id: 'arc_hojaldre_3',
    title: 'El juicio de la Operación Hojaldre',
    portrait: 'portrait_alcalde', image: 'ev_arc_hojaldre_juicio',
    text: (s) => {
      const e = hojaldreExpo(s);
      const you = e <= 0
        ? 'La fiscal te tiene como testigo de cargo y te trata con una cortesía que te desconcierta.'
        : e <= 2
          ? 'La fiscal pide para ti una multa y la prohibición de contratar con la Administración.'
          : 'La fiscal pide para ti dos años por cohecho y obstrucción. Hasta el alcalde te mira con lástima.';
      return `Nueve meses después de los registros empieza el juicio. El alcalde llega con el traje de las fiestas, pero sin la banda.\n\n${you}`;
    },
    weight: (s) => (ready(s, 'hojaldre', 2, 4) ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        label: 'Aceptar un acuerdo con la fiscalía',
        hint: 'Pagas según lo pringado que estés. Si lo estás mucho, con antecedentes.',
        effect(s) {
          const e = hojaldreExpo(s);
          const amount = Math.max(6000, 15000 + 8000 * e);
          advance(s, 'hojaldre', 3);
          s.flags.hojaldreFin = 'conformidad';
          fine(s, amount);
          log(s, '⚖️ Operación Hojaldre: el alcalde, inhabilitado. Manolo Boomerez llega a un acuerdo con la fiscalía.', 'news');
          if (e >= 3) {
            addExpediente(s, 1, 'cohecho (conformidad en la Operación Hojaldre)');
            addRep(s, -6);
            return `Firmas la conformidad: ${money(amount)} y unos antecedentes que no caben en LinkedIn. Reputación −6.`;
          }
          addRep(s, -2);
          return `Firmas un acuerdo: multa de ${money(amount)} y el compromiso de no volver a invitar a un cargo público ni a un café. Reputación −2.`;
        },
      },
      {
        label: 'Ir a juicio y defender tu inocencia',
        hint: 'Cuanto más pringado, más riesgo de condena.',
        effect(s) {
          const e = hojaldreExpo(s);
          advance(s, 'hojaldre', 3);
          s.flags.hojaldreFin = 'juicio';
          addCash(s, -10000);
          if (chance(s, clamp(0.1 + 0.15 * e, 0.05, 0.85))) {
            addExpediente(s, 1, 'cohecho en la Operación Hojaldre');
            fine(s, 30000);
            addRep(s, -10);
            log(s, '⚖️ Operación Hojaldre: condenados el alcalde y el empresario Manolo Boomerez.', 'news');
            return `Condenado.${s.flags.hojaldreDecl === 'culpa' ? ' La jueza cita textualmente tu frase sobre el chuletón.' : ''} Pagas 10.000 € de abogados y 30.000 € de multa. Reputación −10.`;
          }
          addRep(s, 4);
          addFama(s, 4);
          log(s, '⚖️ Operación Hojaldre: condenado el alcalde; absuelto el empresario Manolo Boomerez.', 'news');
          return 'Absuelto. Sales del juzgado con los brazos en alto, como si hubieras ganado algo más que no ir a la cárcel. Pagas 10.000 € de abogados. Reputación +4, fama +4.';
        },
      },
      {
        label: 'Tirar de la manta y declarar contra toda la trama',
        hint: 'El alcalde no te lo perdonará. La fiscal, quizá sí.',
        effect(s) {
          const e = hojaldreExpo(s);
          const grab = s.flags.alcaldeGrabacion;
          const amount = grab ? 0 : 6000 + 4000 * Math.max(0, e);
          advance(s, 'hojaldre', 3);
          s.flags.hojaldreFin = 'manta';
          s.flags.alcaldeShield = 0;
          s.flags.alcaldeEnemigo = true;
          if (amount) fine(s, amount);
          addRep(s, 5);
          addFama(s, 6);
          log(s, '⚖️ Operación Hojaldre: el testimonio de Manolo Boomerez hunde al alcalde.', 'news');
          return (grab
            ? 'Pones en la sala el audio del prado: el chuletón, el orujo y el "donativo". El alcalde se tapa la cara. La fiscal te da las gracias.'
            : `Hablas tres horas: chuletones, licencias, la orquesta de las fiestas... Multa reducida por colaborar: ${money(amount)}.`) +
            ' Se acabaron los favores del ayuntamiento: cualquier protección municipal que tuvieras desaparece hoy. Reputación +5, fama +6.';
        },
      },
    ],
  },
];

// =====================================================================================
// Arco 5 · Merche y la crisis de los 55
// Usa s.familia (0-100). Coopera con el sistema de divorcio: si la relación cae mucho, lo resuelve él.
// =====================================================================================
const mercheOk = (s) => !s.flags.divorciado;
const mercheTraicion = (s) => s.flags.mercheDecision === 'socia' && s.policies.contabilidad !== 'limpia';
const mercheBien = (s) => (s.familia ?? 60) >= 40 && !mercheTraicion(s);

const ARC_MERCHE = [
  {
    id: 'arc_merche_1',
    title: 'La crisis de los 55',
    portrait: 'portrait_esposa_merche', image: 'ev_arc_merche_crisis',
    text: (s) =>
      'Merche, tu mujer, te encuentra a las dos de la mañana en la cocina viendo vídeos de "hombres de alto valor", con una chupa de cuero que todavía lleva la etiqueta.\n\n' +
      '"Manolo, ¿qué te pasa?"\n"Nada, Merche. Que tengo 55 años y todavía no he vivido."\n' +
      `"Tienes un obrador, una hija, la casa pagada y ${s.businesses.length === 1 ? 'un negocio' : `${s.businesses.length} negocios`}."\n"Por eso. Me falta algo."`,
    weight: (s) => (canStart(s, 6) && mercheOk(s) && (s.fama >= 30 || s.cash >= 120000) ? 1.1 : 0),
    once: true,
    choices: [
      {
        label: 'Comprarte un descapotable rojo (55.000 €)',
        effect(s) {
          advance(s, 'merche', 1);
          s.flags.mercheRumbo = 'coche';
          addCash(s, -55000);
          addFama(s, 4);
          addFamilia(s, -6);
          return 'Lo aparcas delante del obrador ocupando las dos plazas de carga y descarga. Las pasiegas lo bautizan "el Cortisol". Pagas 55.000 €. Fama +4, familia −6.';
        },
      },
      {
        label: 'Apuntarte a un máster de "liderazgo disruptivo" en Madrid',
        effect(s) {
          advance(s, 'merche', 1);
          s.flags.mercheRumbo = 'master';
          addCash(s, -14000);
          addFama(s, 5);
          addFamilia(s, -10);
          return 'Pasas las semanas en Madrid y vuelves los viernes hablando de "sinergias" y "ecosistemas". Merche cena con Vanessa. Pagas 14.000 €. Fama +5, familia −10.';
        },
      },
      {
        label: 'Un injerto capilar en el extranjero (4.000 €)',
        effect(s) {
          advance(s, 'merche', 1);
          s.flags.mercheRumbo = 'pelo';
          addCash(s, -4000);
          addFama(s, 2);
          return 'Vuelves con la cabeza vendada y tres mil folículos nuevos. Merche se ríe tanto que se le olvida enfadarse. Pagas 4.000 €. Fama +2.';
        },
      },
      {
        label: 'Hablarlo con Merche, de verdad',
        effect(s) {
          advance(s, 'merche', 1);
          s.flags.mercheRumbo = 'hablar';
          addFamilia(s, 8);
          return 'Habláis hasta las cinco: de tu padre, de Vanessa, de lo cansada que está ella. No recuerdas la última vez que se lo preguntaste. Familia +8.';
        },
      },
    ],
  },
  {
    id: 'arc_merche_2',
    title: 'Merche pone las cartas sobre la mesa',
    portrait: 'portrait_esposa_merche', image: 'ev_arc_merche_carpeta',
    text: (s) => {
      const intro = {
        coche: 'El descapotable lleva tres semanas en el taller porque no sabes ponerle la capota.',
        master: 'Has vuelto del máster con un diploma y una forma nueva de decir "sinergia".',
        pelo: 'El pelo te está saliendo. Merche dice que pareces un kiwi.',
        hablar: 'Desde aquella noche en la cocina habláis más. Por eso Merche se atreve.',
      }[s.flags.mercheRumbo] ?? '';
      return `${intro}\n\nMerche deja una carpeta en la mesa: treinta años de facturas, nóminas y declaraciones del obrador, todas hechas por ella, a mano y sin cobrar.\n\n` +
        '"Tu padre decía que la que llevaba esto de verdad era yo. Tú nunca me lo has preguntado. Quiero un sueldo, quiero ser socia y quiero que me consultes. O me voy un año a Oaxaca a hacer cerámica con mi prima Toñi."';
    },
    weight: (s) => (ready(s, 'merche', 1, 3) && mercheOk(s) ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        label: 'Hacerla socia y directora financiera',
        hint: 'Sueldo de 2.400 €/mes. Las cuentas, limpias (y que sigan así).',
        effect(s) {
          advance(s, 'merche', 2);
          s.flags.mercheDecision = 'socia';
          addMonthlyCost(s, 'Sueldo de Merche (directora financiera)', 2400);
          s.policies.contabilidad = 'limpia';
          addHeatHacienda(s, -12);
          addFamilia(s, 15);
          return 'Merche se instala en el despacho de tu padre y lo primero que hace es poner la contabilidad limpia: "Aquí no se defrauda ni un céntimo, Manolo". Cobra 2.400 €/mes. Familia +15, radar de Hacienda −12.';
        },
      },
      {
        label: 'Regalarle un viaje a Cancún para los dos (9.000 €)',
        effect(s) {
          advance(s, 'merche', 2);
          s.flags.mercheDecision = 'viaje';
          addCash(s, -9000);
          addFamilia(s, 4);
          return 'Te pasas el viaje haciendo videollamadas con Paco desde la tumbona. Merche lee tres novelas y toma una decisión. Pagas 9.000 €. Familia +4.';
        },
      },
      {
        label: 'Ir a terapia de pareja (180 €/mes durante un año)',
        effect(s) {
          advance(s, 'merche', 2);
          s.flags.mercheDecision = 'terapia';
          addMonthlyCost(s, 'Terapia de pareja', 180, 12);
          addFamilia(s, 10);
          return 'En la primera sesión, la terapeuta te pide que dejes el móvil en el coche. Lo intentas con todas tus fuerzas. Familia +10.';
        },
      },
      {
        label: '"Ahora no, Merche, que estamos escalando"',
        effect(s) {
          advance(s, 'merche', 2);
          s.flags.mercheDecision = 'ignora';
          addFamilia(s, -15);
          return 'Merche no dice nada. Recoge la carpeta y se pone a mirar vuelos a Oaxaca. Familia −15.';
        },
      },
    ],
  },
  {
    id: 'arc_merche_3',
    title: 'Treinta años casados',
    portrait: 'portrait_esposa_merche', image: 'ev_arc_merche_aniversario',
    text: (s) => {
      const pre = s.flags.mercheDecision === 'ignora' ? 'Merche se fue un mes a Oaxaca. Ha vuelto morena, con un jarrón de barro y las ideas muy claras.\n\n' : '';
      if (mercheTraicion(s)) {
        return `${pre}Merche ha encontrado una segunda contabilidad en un pendrive con forma de sobao. Era tuya. Justo el día de vuestro aniversario.\n\n"Me hiciste socia para tener a quién echarle la culpa, ¿verdad?"`;
      }
      if (mercheBien(s)) {
        return `${pre}Treinta años casados. Merche ha reservado mesa en el restaurante donde le pediste matrimonio, el de los manteles de cuadros. Esta noche, por primera vez en mucho tiempo, os reís igual que entonces.`;
      }
      return `${pre}Treinta años casados, y Merche ha pasado el aniversario en casa de su madre. Te ha dejado una nota en la nevera: "Hablemos. De verdad o con abogados. Tú eliges."`;
    },
    weight: (s) => (ready(s, 'merche', 2, 6) && mercheOk(s) ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        label: 'Renovar los votos en la ermita, con todo el pueblo (12.000 €)',
        available: (s) => mercheBien(s),
        effect(s) {
          advance(s, 'merche', 3);
          s.flags.mercheFin = 'votos';
          addCash(s, -12000);
          addFamilia(s, 10);
          addRep(s, 4);
          addFama(s, 3);
          return 'Media Selaya en la ermita. Maripili lleva los anillos y Vanessa lee un poema que no rima. Lloras más que en el entierro de tu padre (y eso que lloraste). Pagas 12.000 €. Familia +10, reputación +4, fama +3.';
        },
      },
      {
        label: 'Una cena tranquila, sin móvil',
        available: (s) => mercheBien(s),
        effect(s) {
          advance(s, 'merche', 3);
          s.flags.mercheFin = 'cena';
          addFamilia(s, 6);
          addFama(s, -2);
          return 'Dejas el móvil en casa. Te pierdes cuarenta notificaciones de LinkedIn y ganas una noche entera. Familia +6, fama −2.';
        },
      },
      {
        label: 'Pedir perdón de verdad (y vender lo que haya que vender)',
        available: (s) => !mercheBien(s),
        effect(s) {
          advance(s, 'merche', 3);
          s.flags.mercheFin = 'perdon';
          const coche = s.flags.mercheRumbo === 'coche';
          const traicion = mercheTraicion(s);
          if (coche) addCash(s, 30000);
          if (traicion) {
            s.policies.contabilidad = 'limpia';
            addHeatHacienda(s, -5);
          }
          addFamilia(s, 14);
          return (coche ? 'Vendes el descapotable por 30.000 € (perdiendo 25.000, como manda la tradición). ' : '') +
            (traicion ? 'Formateas el pendrive delante de ella y vuelves a la contabilidad limpia. ' : '') +
            `Pides perdón sin frases de LinkedIn. Merche tarda en contestar. Luego dice: "Los domingos, sin móvil". Familia +14${traicion ? ', radar de Hacienda −5' : ''}.`;
        },
      },
      {
        label: 'Mudarte "una temporada" al despacho del obrador',
        available: (s) => !mercheBien(s),
        effect(s) {
          advance(s, 'merche', 3);
          s.flags.mercheFin = 'despacho';
          addFamilia(s, -4);
          addMoral(s, -2);
          addFama(s, 1);
          return 'Duermes en el sofá del despacho, debajo del retrato de tu padre, que te mira como siempre. El turno de mañana te encuentra en calzoncillos. Familia −4, moral −2, fama +1.';
        },
      },
      {
        label: '"Mi abogado hablará con tu abogada"',
        hint: 'Estáis en gananciales.',
        available: (s) => !mercheBien(s),
        effect(s) {
          advance(s, 'merche', 3);
          s.flags.mercheFin = 'abogados';
          addFamilia(s, -25);
          addRep(s, -2);
          return 'Merche asiente despacio. Sabe perfectamente lo que es el régimen de gananciales, porque lleva treinta años haciendo tus papeles. Familia −25, reputación −2.';
        },
      },
    ],
  },
];

// =====================================================================================
// Arco 6 · La lata del desván: la carta de Don Anselmo y la receta de la abuela
// =====================================================================================
const ARC_ANSELMO = [
  {
    id: 'arc_anselmo_1',
    title: 'La lata del desván',
    portrait: 'portrait_hija_vanessa', image: 'ev_arc_anselmo_lata',
    text: () =>
      'Vanessa sube al desván del obrador a tomar medidas, porque quieres convertirlo en "Boomerez Lab, espacio de cocreación". Baja con una lata de galletas oxidada.\n\n' +
      'Dentro no hay galletas (nunca las hay). Hay una libreta con tapas de hule y la letra de tu abuela, y un sobre con la letra de tu padre: "Para Manolo. Ábrela cuando hayas hecho alguna tontería gorda. Tardarás poco."',
    weight: (s) => (canStart(s, 15) ? (s.policies.ingredientes !== 'mantequilla' || s.moral < 40 ? 1.4 : 1) : 0),
    once: true,
    choices: [
      {
        label: 'Abrirla esa misma noche, solo, en el obrador',
        effect(s) {
          advance(s, 'anselmo', 1);
          s.flags.anselmoModo = 'solo';
          return 'Esperas a que se vaya el turno de noche. Enciendes el horno de tu padre, por costumbre, y te sientas en un saco de harina con la lata en las rodillas.';
        },
      },
      {
        label: 'Abrirla con Merche y Vanessa',
        effect(s) {
          advance(s, 'anselmo', 1);
          s.flags.anselmoModo = 'familia';
          addFamilia(s, 5);
          return 'Merche hace café. Vanessa pone el móvil boca abajo, que en ella es un gesto de amor. Familia +5.';
        },
      },
      {
        label: '"Ya la leeré. Ahora hay que facturar"',
        effect(s) {
          advance(s, 'anselmo', 1);
          s.flags.anselmoModo = 'prisa';
          return 'La guardas en el cajón de las facturas, debajo de los tickets de marisquería. Allí estará a salvo. O no.';
        },
      },
    ],
  },
  {
    id: 'arc_anselmo_2',
    title: 'La carta de tu padre',
    portrait: 'portrait_padre_anselmo', image: 'ev_arc_anselmo_carta',
    text: (s) =>
      (s.flags.anselmoModo === 'prisa' ? 'Meses después, buscando un ticket para Hacienda, aparece el sobre. Esta vez lo abres.\n\n' : '') +
      '"Manolo:\n\nSi estás leyendo esto, ya te has metido en algún lío. No pasa nada; yo también me metí en unos cuantos y tu madre me sacó de casi todos.\n\n' +
      'Sé que querrás hacerlo grande. Hazlo, si quieres. Pero acuérdate de que este obrador lo levantaron las mujeres que madrugan, no yo. A la gente se le paga lo que vale y a su hora. ' +
      'Y el sobao no tiene prisa: mantequilla de la buena, el limón rallado fino y el tiempo que pida la masa.\n\n' +
      'No te lo dije nunca, porque en esta familia no se dicen esas cosas: estoy orgulloso de ti. O lo estaré. Eso ya depende de ti.\n\nTu padre.\n\nP. D.: El Audi era de alquiler."' +
      (s.policies.ingredientes === 'misteriosa' ? '\n\nLevantas la vista. Al fondo del obrador, los bidones sin etiqueta te devuelven la mirada.' : ''),
    weight: (s) =>
      s.flags.anselmoStep === 1 && s.month - (s.flags.anselmoMonth ?? Infinity) >= (s.flags.anselmoModo === 'prisa' ? 8 : 1) ? 1 : 0,
    once: true, forced: true,
    choices: [
      {
        label: 'Leérsela en voz alta a la plantilla',
        effect(s) {
          advance(s, 'anselmo', 2);
          s.flags.anselmoLectura = 'plantilla';
          addMoral(s, 8);
          addRep(s, 2);
          return 'Cuando llegas a lo de "las mujeres que madrugan", Maripili se quita el gorro. Nadie dice nada durante un rato largo. Moral +8, reputación +2.';
        },
      },
      {
        label: 'Guardarla en la cartera y no decir nada',
        effect(s) {
          advance(s, 'anselmo', 2);
          s.flags.anselmoLectura = 'privada';
          addFamilia(s, 4);
          return 'La guardas en la cartera, junto a la foto del Audi. Esa noche llamas a tu madre solo para preguntarle qué tal está. Se asusta muchísimo. Familia +4.';
        },
      },
      {
        label: 'Enmarcarla y usarla en la próxima campaña de publicidad',
        hint: 'El duelo también es contenido.',
        effect(s) {
          advance(s, 'anselmo', 2);
          s.flags.anselmoLectura = 'marketing';
          addFama(s, 7);
          addRep(s, -2);
          addMoral(s, -3);
          return '"Sobaos Boomerez: orgullo de padre." La carta, en las marquesinas de los autobuses, con la posdata recortada. Fama +7, reputación −2, moral −3.';
        },
      },
    ],
  },
  {
    id: 'arc_anselmo_3',
    title: 'La receta de la abuela',
    portrait: 'portrait_padre_anselmo', image: 'ev_arc_anselmo_receta',
    text: (s) =>
      'La libreta de tu abuela tiene manchas de mantequilla de los años cincuenta y una receta que no se parece a la que usáis ahora: menos azúcar, más reposo, mantequilla de vacas con nombre propio y un ingrediente que solo dice "lo de siempre", subrayado dos veces.\n\n' +
      'Vanessa lo ha descifrado: una pizca de sal y un chorrito de anís.' +
      (s.policies.ingredientes !== 'mantequilla' ? ' Con la grasa que usáis ahora, la receta no sale.' : '') +
      '\n\nTu padre la guardó sesenta años. Ahora decides tú.',
    weight: (s) => (ready(s, 'anselmo', 2, 2) ? 1 : 0),
    once: true, forced: true,
    choices: [
      {
        label: 'Volver a la receta original en todas las tiendas',
        hint: 'Mantequilla de verdad. Ventas de sobaos +10 % durante 6 años, reputación +6.',
        effect(s) {
          advance(s, 'anselmo', 3);
          s.flags.anselmoFin = 'receta';
          s.policies.ingredientes = 'mantequilla';
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.1, months: 72, label: 'La receta de la abuela' });
          addRep(s, 6);
          const extra = s.flags.anselmoLectura === 'plantilla';
          if (extra) addMoral(s, 4);
          log(s, '📜 Vuelve la receta de la abuela Boomerez. El sobao sabe otra vez a sobao.', 'good');
          return `Mantequilla pasiega, limón rallado fino, reposo y "lo de siempre". La primera hornada huele a 1958. Los clientes vuelven y no saben por qué. Ventas de sobaos +10 % durante 6 años, reputación +6${extra ? ', moral +4 (la plantilla sabe lo que significa)' : ''}.`;
        },
      },
      {
        label: 'Lanzar una edición limitada "Receta Anselmo" a precio de joya',
        effect(s) {
          advance(s, 'anselmo', 3);
          s.flags.anselmoFin = 'edicion';
          const maison = s.brand === 'maison';
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: maison ? 1.12 : 1.06, months: 24, label: 'Edición Receta Anselmo' });
          addFama(s, 5);
          return `Caja de madera, número de serie y la foto de tu padre con boina. Se agota cada semana. Ventas de sobaos +${maison ? 12 : 6} % durante 2 años. Fama +5.`;
        },
      },
      {
        label: 'Vender la receta a una multinacional de bollería (60.000 €)',
        hint: 'Dinero rápido. Y tu madre se enterará.',
        effect(s) {
          advance(s, 'anselmo', 3);
          s.flags.anselmoFin = 'vendida';
          addCash(s, 60000);
          addRep(s, -8);
          addFamilia(s, -8);
          addMoral(s, -6);
          return 'Te pagan 60.000 € y lanzan "Sobaos Tradición Abuela" en bolsas de seis. Saben a cartón con prisa. Tu madre no te coge el teléfono. Reputación −8, familia −8, moral −6.';
        },
      },
      {
        label: 'Regalarla a todos los obradores del valle',
        effect(s) {
          advance(s, 'anselmo', 3);
          s.flags.anselmoFin = 'publicada';
          addRep(s, 10);
          addMoral(s, 4);
          addFama(s, 3);
          return 'Entregas una copia de la receta al Consejo Regulador del Sobao Pasiego. Los obradores del valle te mandan una caja de sus sobaos, hechos con la receta de tu abuela. Están buenísimos: peor para ti y mejor para todos. Reputación +10, moral +4, fama +3.';
        },
      },
    ],
  },
];

export const ARC_EVENTS = [...ARC_PRENSA, ...ARC_JONATHAN, ...ARC_COMITE, ...ARC_HOJALDRE, ...ARC_MERCHE, ...ARC_ANSELMO];
