// Sucesos sueltos adicionales: negocios nuevos y existentes, plantilla, familia, calendario español y ciclo económico.
// Calendario: el suceso se sortea al cerrar el mes m y se juega al empezar el m + 1, así que un modificador
// de 1 mes afecta al mes siguiente (p. ej., el Black Friday se sortea al cerrar octubre).
import { chance, int } from '../core/rng.js';
import { recordSanction } from '../core/inspections.js';
import {
  addCash, addRep, addMoral, addFama, addHeatTrabajo, addHeatHacienda, addMod, addMonthlyCost, log, money, clamp,
} from '../core/helpers.js';

const employees = (s) => s.lastReport?.employees ?? 10;
const has = (s, type) => s.businesses.some((b) => b.type === type);
const count = (s, type) => s.businesses.filter((b) => b.type === type).length;
const ownCount = (s, type) => s.businesses.filter((b) => b.type === type && b.mode !== 'franquicia').length;
const moy = (s) => s.month % 12;
const fine = (s, amount) => {
  addCash(s, -amount);
  s.stats.multas += amount;
};
const addFamilia = (s, d) => {
  s.familia = clamp((s.familia ?? 60) + d);
};

// Inmueble que le interesa al fondo de inversión (primero los turísticos; nunca uno que ya le hayas vendido).
const fondoTarget = (s) => {
  const ok = (b, type) => b.type === type && b.mode !== 'franquicia' && !b.leased && b.value > 0;
  return s.businesses.find((b) => ok(b, 'airbnb')) || s.businesses.find((b) => ok(b, 'vivienda')) || null;
};
const fondoOffer = (b) => Math.round((b?.value ?? 0) * 1.35);

export const EXTRA_EVENTS = [
  // ------------------------------------------------------------ Negocios nuevos
  {
    id: 'residencia_motin',
    title: 'Motín en la residencia',
    portrait: 'portrait_vecina', image: 'ev_residencia_motin',
    text: () =>
      'Doña Pura, 93 años, la residente más veterana de la Residencia Golden Age Boomerez, ha convocado una asamblea en el comedor. Fue pasiega en el obrador de tu padre durante cuarenta años y no ha perdido la costumbre de reivindicar.\n\n' +
      'Sus exigencias: que la cena no sea "puré de lo que sobró", que por la noche haya más de una gerocultora para cuarenta residentes y que nadie le cambie de canal en el concurso de la tarde.',
    weight: (s) => (has(s, 'residencia') ? 1.3 : 0),
    cooldown: 18,
    choices: [
      {
        label: 'Reforzar la plantilla nocturna (4.000 €/mes)',
        effect(s) {
          addMonthlyCost(s, 'Refuerzo nocturno de la residencia', 4000);
          addRep(s, 5);
          addMoral(s, 4);
          return 'Contratas a dos gerocultoras más para el turno de noche. Doña Pura te da un beso en la frente, "como a un niño bueno". Reputación +5, moral +4.';
        },
      },
      {
        label: 'Mejorar el menú solo el día de visita de las familias',
        hint: '60 %: cuela.',
        effect(s) {
          if (chance(s, 0.6)) {
            return 'Ese domingo hay merluza en salsa verde; el lunes vuelve el puré. Las familias se van contentas. Doña Pura, no, y lo apunta.';
          }
          addRep(s, -8);
          addHeatTrabajo(s, 6);
          return 'Una nieta graba el puré del lunes y lo compara con la merluza del domingo: 1,2 millones de visualizaciones. Reputación −8, radar de Inspección +6.';
        },
      },
      {
        label: 'Nombrar a Doña Pura "asesora de calidad" (300 €/mes)',
        effect(s) {
          addMonthlyCost(s, 'Doña Pura, asesora de calidad', 300);
          addRep(s, 3);
          addFama(s, 2);
          return 'Doña Pura acepta el cargo, la acreditación plastificada y los 300 € al mes. En su primera semana despide al proveedor de purés. Reputación +3, fama +2.';
        },
      },
      {
        label: 'Recordarle que "a su edad no se puede tener todo"',
        effect(s) {
          addRep(s, -6);
          addMoral(s, -3);
          return 'Lo dices delante de cuarenta jubilados que oyen perfectamente cuando les interesa. Doña Pura llama a la radio. Reputación −6, moral −3.';
        },
      },
    ],
  },
  {
    id: 'gimnasio_bajas',
    title: 'Los socios fantasma',
    portrait: 'portrait_gestor_paco', image: 'ev_gimnasio_bajas',
    text: () =>
      'Paco revisa los números del gimnasio "Boomer Fit 24h": el 40 % de los socios paga cada mes y no ha venido nunca. "Manolo, eso no es un problema. Eso es el modelo de negocio."\n\n' +
      'El problema es que algunos quieren darse de baja, y el formulario está en la página nueve de la web, detrás de un captcha con fotos de sobaos.',
    weight: (s) => (has(s, 'gimnasio') ? 1.3 : 0),
    cooldown: 18,
    choices: [
      {
        label: 'Poner un botón de baja visible',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'servicios', factor: 0.94, months: 6, label: 'Bajas del gimnasio' });
          addRep(s, 4);
          return 'Baja a un clic. Se van trescientos socios fantasma y entran cincuenta que vienen de verdad. Ingresos de servicios −6 % durante 6 meses, reputación +4.';
        },
      },
      {
        label: 'Baja solo presencial: los martes, de 10:00 a 10:15, en Selaya',
        hint: 'Más ingresos... hasta que llegue Consumo.',
        effect(s) {
          const extra = count(s, 'gimnasio') * 4000;
          addCash(s, extra);
          if (chance(s, 0.4)) {
            fine(s, 15000);
            addRep(s, -6);
            return `Ingresas ${money(extra)} de cuotas que nadie quería pagar, hasta que una asociación de consumidores organiza una excursión en autobús a Selaya para darse de baja en grupo. Sale en el telediario. Multa de Consumo: 15.000 €. Reputación −6.`;
          }
          addRep(s, -3);
          return `Ingresas ${money(extra)} de cuotas que nadie quería pagar. Los martes por la mañana hay cola en el obrador de gente en chándal. Reputación −3.`;
        },
      },
      {
        label: 'Subir la cuota "por la inflación" sin avisar',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'servicios', factor: 1.08, months: 12, label: 'Subida de cuotas' });
          addRep(s, -4);
          return 'Nadie lo nota, porque nadie va. Ingresos de servicios +8 % durante un año. Reputación −4.';
        },
      },
    ],
  },
  {
    id: 'coworking_iker',
    title: 'Un retiro urbano en el coworking',
    portrait: 'portrait_coach', image: 'ev_coworking_cabina',
    text: () =>
      'En tu coworking "Hustle Hub", justo al lado de la sala "Mindset", hay una cabina telefónica insonorizada. Desde hace tres meses alguien vive dentro: Iker "Mindset" Lasa, con una esterilla, un hervidor y catorce kilos de proteína en polvo.\n\n' +
      '"Manolo, no estoy viviendo aquí. Estoy haciendo un retiro urbano. Y te estoy dando visibilidad."',
    weight: (s) => (has(s, 'coworking') ? 1.3 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'Cobrarle los tres meses atrasados (2.400 €)',
        hint: '50 %: paga en euros.',
        effect(s) {
          if (chance(s, 0.5)) {
            addCash(s, 2400);
            return 'Iker paga con una transferencia con el concepto "abundancia". Cobras 2.400 €.';
          }
          addFama(s, 1);
          return 'Iker te paga con un curso online, "Desapego financiero", valorado en 2.400 €. Lo tienes en el correo, sin abrir. Fama +1.';
        },
      },
      {
        label: 'Nombrarle community manager a cambio del alquiler',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'servicios', factor: 1.06, months: 8, label: 'Desayunos de Iker' });
          addFama(s, 4);
          return 'Iker organiza "desayunos de alto rendimiento" a las seis de la mañana. Se apuntan cuarenta nómadas digitales. Ingresos de servicios +6 % durante 8 meses. Fama +4.';
        },
      },
      {
        label: 'Echarle con el evento de networking más aburrido de la historia',
        effect(s) {
          addRep(s, 1);
          return 'Paco da una charla de tres horas sobre el IVA intracomunitario. Iker aguanta veinticinco minutos y huye con la esterilla. Un asistente te da las gracias: era justo lo que necesitaba. Reputación +1.';
        },
      },
    ],
  },
  {
    id: 'taberna_pinchos',
    title: 'Concurso de pinchos',
    portrait: 'portrait_manolo_thinking', image: 'ev_taberna_pinchos',
    text: () =>
      '"La Taberna del Emprendedor" se presenta al concurso de pinchos de la ciudad. El jurado lo preside un crítico con boina que lleva treinta años sin sonreír.\n\n' +
      'Rosario, tu cocinera, propone su tortilla de patata poco hecha con pimientos de su huerta. Tú propones un "Sobao Smash de morcilla con espuma de orujo".',
    weight: (s) => (has(s, 'taberna') ? 1.3 : 0),
    cooldown: 12,
    choices: [
      {
        label: 'Presentar la tortilla de Rosario, con su nombre',
        effect(s) {
          addMoral(s, 3);
          if (chance(s, 0.6)) {
            addMod(s, { kind: 'revenue', category: 'hosteleria', factor: 1.08, months: 6, label: 'Premio de pinchos' });
            addRep(s, 4);
            return 'Primer premio. Dicen que el crítico sonrió, aunque nadie tiene pruebas. La foto de Rosario con el trofeo preside la barra. Hostelería +8 % durante 6 meses, reputación +4, moral +3.';
          }
          addRep(s, 2);
          return 'Segundo premio. Rosario está encantada de ver su nombre en el cartel. Reputación +2, moral +3.';
        },
      },
      {
        label: 'Presentar tu "Sobao Smash de morcilla"',
        hint: '30 %: genialidad. 70 %: la morcilla gana a la espuma.',
        effect(s) {
          addFama(s, 5);
          if (chance(s, 0.3)) {
            addRep(s, 3);
            return 'El jurado no entiende nada y le da el premio a la innovación. Fama +5, reputación +3.';
          }
          addRep(s, -3);
          return 'La espuma de orujo se corta y la morcilla se te sale por los lados del sobao. El crítico lo prueba y pide agua. Fama +5, reputación −3.';
        },
      },
      {
        label: 'Comprar croquetas congeladas y decir que son caseras',
        hint: '50 %: nadie lo nota.',
        effect(s) {
          if (chance(s, 0.5)) {
            addRep(s, 1);
            return 'Quedáis terceros con unas croquetas industriales. Rosario no te dirige la palabra en una semana. Reputación +1.';
          }
          fine(s, 3000);
          addRep(s, -7);
          addMoral(s, -3);
          return 'El crítico encuentra pegada a la croqueta la etiqueta del congelado, con el código de barras. Descalificación, multa de 3.000 € por fraude en el etiquetado y foto en el periódico. Reputación −7, moral −3.';
        },
      },
    ],
  },

  // ------------------------------------------------------------ Negocios de siempre
  {
    id: 'express_dependiente',
    title: 'El dependiente más rápido de España',
    portrait: 'portrait_manolo_happy', image: 'ev_express_dependiente',
    text: () =>
      'Un cliente graba a Sergio, dependiente de uno de tus Sobaos Manolo Express, atendiendo él solo la cola de la mañana: cobra, empaqueta, friega, repone, sonríe y le indica el camino a una turista japonesa. El vídeo, "El dependiente más rápido de España", lleva tres millones de visitas.\n\n' +
      'Los comentarios se dividen entre "¡qué crack!" y "¿por qué está solo?".',
    weight: (s) => (has(s, 'express') ? 1 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'Poner un segundo dependiente en cada tienda Express propia',
        available: (s) => ownCount(s, 'express') > 0,
        effect(s) {
          const c = ownCount(s, 'express') * 1500;
          addMonthlyCost(s, 'Segundo dependiente en las tiendas Express', c);
          addRep(s, 5);
          addMoral(s, 5);
          return `Sergio, por fin, puede ir al baño. Los comentarios cambian a "así sí". Cuesta ${money(c)} al mes. Reputación +5, moral +5.`;
        },
      },
      {
        label: 'Usar el vídeo en tu publicidad sin preguntarle',
        hint: 'Su cara, tu anuncio. ¿Qué podría salir mal?',
        effect(s) {
          addFama(s, 6);
          addMoral(s, -4);
          if (chance(s, 0.35)) {
            fine(s, 6000);
            addRep(s, -4);
            return 'Sergio te reclama por usar su imagen sin permiso y gana. Pagas 6.000 € y él lo celebra con otro vídeo. Fama +6, moral −4, reputación −4.';
          }
          return '"Velocidad Boomerez: lo hacemos todo, y rápido." Sergio se ve en una marquesina sin haber firmado nada. Fama +6, moral −4.';
        },
      },
      {
        label: 'Ficharle como imagen de marca, con contrato y subida',
        effect(s) {
          addMonthlyCost(s, 'Sergio, imagen de marca', 900, 24);
          addFama(s, 5);
          addMoral(s, 3);
          addRep(s, 2);
          return 'Sergio firma su primer contrato de imagen y te pide una cosa: que en el anuncio salga también su compañera de la tarde. Cuesta 900 € al mes durante dos años. Fama +5, moral +3, reputación +2.';
        },
      },
    ],
  },
  {
    id: 'maison_critico',
    title: 'Un crítico en la Maison',
    portrait: 'portrait_manolo_scared', image: 'ev_maison_critico',
    text: (s) =>
      'Te avisan desde la Maison Boomerez: en la mesa del fondo hay un señor solo, con pajarita, que corta el sobao con cuchillo y tenedor y toma notas en francés. Es Monsieur Delacroix-Puyol, el crítico más temido de la "Guía Gourmet Ibérica".' +
      ({ margarina: ' Y hoy los sobaos llevan margarina.', misteriosa: ' Y hoy los sobaos llevan lo de los bidones.' }[s.policies.ingredientes] ?? ''),
    weight: (s) => (has(s, 'maison') ? 1.2 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'Dejarle comer tranquilo',
        hint: 'Lo que diga dependerá de lo que lleve el sobao.',
        effect(s) {
          const ing = s.policies.ingredientes;
          if (ing === 'mantequilla') {
            addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.1, months: 12, label: 'Reseña de la Guía Gourmet' });
            addRep(s, 6);
            addFama(s, 4);
            return 'Reseña: "El mejor sobao de la península, y exagero poco". Ventas de sobaos +10 % durante un año. Reputación +6, fama +4.';
          }
          if (ing === 'margarina') {
            addRep(s, -4);
            addFama(s, 2);
            return 'Reseña: "Correcto. Se nota que alguna vez fue bueno". Reputación −4, fama +2.';
          }
          addRep(s, -10);
          addFama(s, 3);
          return 'Reseña: "Un bollo con la textura de una sobremesa de hospital". Reputación −10, fama +3.';
        },
      },
      {
        label: 'Servirle a escondidas un sobao "especial" con mantequilla de verdad',
        hint: '50 %: se da cuenta del truco.',
        available: (s) => s.policies.ingredientes !== 'mantequilla',
        effect(s) {
          if (chance(s, 0.5)) {
            addRep(s, -3);
            addFama(s, 3);
            return 'Reseña: "El sobao de mi mesa, excelente. El de la mesa de al lado, no. Interesante". Reputación −3, fama +3.';
          }
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.06, months: 8, label: 'Reseña de la Guía Gourmet' });
          addRep(s, 3);
          return 'Reseña excelente de un sobao que no come nadie más. Los clientes llegan y notan la diferencia, pero ya están dentro. Ventas de sobaos +6 % durante 8 meses, reputación +3.';
        },
      },
      {
        label: 'Sentarte con él a explicarle tu "visión"',
        effect(s) {
          addFama(s, 3);
          addRep(s, -3);
          return 'Le hablas cuarenta minutos de escalabilidad. Su reseña: "El sobao, notable. La sobremesa, un castigo". Fama +3, reputación −3.';
        },
      },
    ],
  },
  {
    id: 'vivienda_caldera',
    title: 'Se rompe la caldera del Residencial',
    portrait: 'portrait_empleada_maripili', image: 'ev_vivienda_caldera',
    text: (s) =>
      'Hace un frío que pela y se ha roto la caldera central del Residencial Boomerez. Tu plantilla duerme con el abrigo puesto. Maripili te manda una foto del termómetro del pasillo: 9 °C.\n\n' +
      `"Manolo, aquí viven tus trabajadoras. Y sus críos."${s.policies.alquiler === 'abusivo' ? ' "Y pagan 850 € por una habitación."' : ''}`,
    weight: (s) => (has(s, 'vivienda') && [9, 10, 11, 0].includes(moy(s)) ? 2 : 0),
    cooldown: 12,
    choices: [
      {
        label: 'Cambiar la caldera por una nueva (9.000 €)',
        effect(s) {
          addCash(s, -9000);
          addMoral(s, 4);
          return 'El técnico viene esa misma tarde, porque pagas urgencia. Por la noche el pasillo está a 21 °C y alguien ha dejado un sobao en tu coche, de agradecimiento. Moral +4.';
        },
      },
      {
        label: 'Repartir mantas con el logo de la empresa',
        effect(s) {
          addCash(s, -400);
          addMoral(s, -6);
          addHeatTrabajo(s, s.policies.alquiler === 'abusivo' ? 6 : 3);
          return `Mantas polares naranjas con el lema "Boomerez: el calor de una familia". Nadie le ve la gracia. Moral −6, radar de Inspección +${s.policies.alquiler === 'abusivo' ? 6 : 3}.`;
        },
      },
      {
        label: 'Arreglarla y descontar la reparación de las nóminas',
        hint: 'Que el casero cobre las averías a sus inquilinos por nómina es ilegal.',
        effect(s) {
          addMoral(s, -10);
          addHeatTrabajo(s, 12);
          if (chance(s, 0.35)) {
            const c = employees(s) * 150;
            fine(s, c);
            recordSanction(s);
            return `Maripili lleva las nóminas a la Inspección. Devuelves los descuentos y pagas una multa: ${money(c)} en total. Moral −10, radar de Inspección +12.`;
          }
          return 'En la nómina aparece una línea nueva: "Contribución al confort térmico". Nadie se ríe. Moral −10, radar de Inspección +12.';
        },
      },
    ],
  },
  {
    id: 'airbnb_despedida',
    title: 'Despedida de soltero en Casa Manolo',
    portrait: 'portrait_vecina', image: 'ev_airbnb_despedida',
    text: () =>
      'Catorce señores de Valladolid disfrazados de vikingos celebran una despedida de soltero en uno de tus apartamentos "Casa Manolo". A las cuatro de la mañana cantan pasodobles en el balcón con un altavoz del tamaño de una nevera.\n\n' +
      'La vecina del cuarto, Doña Asun, te llama. No es la primera vez.',
    weight: (s) => (has(s, 'airbnb') ? 1.2 : 0),
    cooldown: 12,
    choices: [
      {
        label: 'Quedarte la fianza y prohibir las despedidas',
        effect(s) {
          addCash(s, 1500);
          addMod(s, { kind: 'revenue', category: 'inmobiliario', factor: 0.95, months: 12, label: 'Sin despedidas' });
          addRep(s, 3);
          return 'Te quedas la fianza (1.500 €) y cuelgas un cartel nuevo: prohibidos las despedidas, los vikingos y los altavoces. Doña Asun te manda un táper de croquetas. Ingresos inmobiliarios −5 % durante un año, reputación +3.';
        },
      },
      {
        label: 'Lanzar el "Pack Despedida Casa Manolo" oficial',
        hint: 'Más ingresos y más llamadas de Doña Asun. 40 %: multa municipal.',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'inmobiliario', factor: 1.1, months: 12, label: 'Pack Despedida' });
          addRep(s, -5);
          if (chance(s, 0.4)) {
            fine(s, 9000);
            return 'Cascos con cuernos, cajas de sobaos "picantes" y altavoz incluido. El ayuntamiento te multa por actividad molesta: 9.000 €. Ingresos inmobiliarios +10 % durante un año, reputación −5.';
          }
          return 'Cascos con cuernos, cajas de sobaos "picantes" y altavoz incluido. Se agota todos los fines de semana. Ingresos inmobiliarios +10 % durante un año, reputación −5.';
        },
      },
      {
        label: 'Ir en persona a pedirles que bajen la música',
        effect(s) {
          if (chance(s, 0.5)) {
            addFama(s, 3);
            addRep(s, 1);
            return 'Los vikingos te reconocen de LinkedIn y te sacan a hombros. Bajan la música a las cinco. Doña Asun lo agradece a medias. Fama +3, reputación +1.';
          }
          addRep(s, -2);
          addFamilia(s, -3);
          return 'Acabas en la foto de grupo con un casco con cuernos y una copa en la mano. La foto llega a Merche antes que tú. Reputación −2, familia −3.';
        },
      },
    ],
  },
  {
    id: 'smash_desinfla',
    title: 'El smash ya no es tendencia',
    portrait: 'portrait_hija_vanessa', image: 'ev_smash_desinfla',
    text: (s) =>
      'Los foodies han decidido que el smash "es de boomers". La moda ahora es la croqueta de autor y tus Manolo Smash Club tienen mesas vacías los viernes. ' +
      `Tirón del smash: ${Math.round((s.trends?.smash ?? 1) * 100)} %.\n\nVanessa, que de esto sabe, dice que hay que reinventarse o salir a tiempo.`,
    weight: (s) => (has(s, 'smash') && (s.trends?.smash ?? 1) < 0.95 ? 1.3 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'Reinventarlo: "Smash de cocido montañés" (15.000 €)',
        hint: '55 %: vuelve la cola.',
        effect(s) {
          addCash(s, -15000);
          if (chance(s, 0.55)) {
            s.trends.smash = Math.min(1.4, s.trends.smash + 0.2);
            return 'Hamburguesa de compango, pan de sobao y caldo para mojar. Los foodies vuelven, ahora con ironía. Tirón del smash +20 %.';
          }
          s.trends.smash = Math.min(1.4, s.trends.smash + 0.05);
          return 'El cocido aplastado sabe a lunes. Algunos repiten, por cariño. Tirón del smash +5 %.';
        },
      },
      {
        label: 'Vender un Smash Club a un fondo de inversión',
        hint: 'Te pagan un 30 % más de lo que vale. Y el local deja de ser tuyo.',
        available: (s) => s.businesses.some((b) => b.type === 'smash' && b.mode !== 'franquicia'),
        effect(s) {
          const b = s.businesses.find((x) => x.type === 'smash' && x.mode !== 'franquicia');
          if (!b) return 'Al final no hay nada que vender. El fondo se va a buscar otra moda que comprar.';
          const v = Math.round((b.value || 66000) * 1.3);
          s.businesses = s.businesses.filter((x) => x !== b);
          addCash(s, v);
          log(s, `💼 Vendes uno de tus Manolo Smash Club a un fondo por ${money(v)}.`, 'info');
          return `Unos señores con chaleco acolchado te compran uno de tus Smash Club por ${money(v)}. Dicen que van a "escalarlo". Lo cierran a los cuatro meses, pero eso ya no es problema tuyo. Cierras un negocio.`;
        },
      },
      {
        label: 'Aguantar: "Las modas vuelven"',
        effect(s) {
          addRep(s, 1);
          return 'Tu padre decía lo mismo de las hombreras, y acertó a medias. Los clientes de siempre agradecen que no cambies la carta. Reputación +1.';
        },
      },
    ],
  },
  {
    id: 'empanadas_final',
    title: 'Argentina juega la final',
    portrait: 'portrait_primo_argentino', image: 'ev_empanadas_final',
    text: () =>
      'Argentina juega la final de un gran torneo de fútbol y tu primo Rodrigo tiene un plan para Empanadas El Gaucho Pasiego: pantalla gigante, bandera en la fachada y una empanada gratis por cada gol argentino.\n\n' +
      '"Che, Manolo, va a ser histórico."',
    weight: (s) => (has(s, 'empanadas') ? 1 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'Pantalla gigante y empanadas gratis por gol (5.000 €)',
        hint: '50 %: noche épica. 50 %: goleada (de las caras).',
        effect(s) {
          addCash(s, -5000);
          if (chance(s, 0.5)) {
            s.trends.empanadas = Math.min(1.5, s.trends.empanadas + 0.1);
            addRep(s, 3);
            return 'Argentina gana 3-2 en la prórroga y Rodrigo llora encima de la freidora. Las colas duran un mes. Tirón de las empanadas +10 %, reputación +3.';
          }
          addCash(s, -4000);
          addFama(s, 3);
          return 'Argentina marca siete goles en la final más loca de la historia. Regalas tres mil empanadas: 4.000 € más. Rodrigo dice que valió la pena. Fama +3.';
        },
      },
      {
        label: 'Pantalla, pero empanadas a "precio de final" (+50 %)',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'hosteleria', factor: 1.05, months: 1, label: 'Precios de final' });
          addRep(s, -3);
          return 'Ganas bien esa noche, aunque un cliente te grita "¡ladrón!" en tres acentos distintos. Hostelería +5 % este mes, reputación −3.';
        },
      },
      {
        label: 'Poner otro deporte "para no politizar"',
        effect(s) {
          addFama(s, 3);
          addRep(s, -2);
          return 'Pones un torneo de petanca. Rodrigo deja de hablarte durante dos asados. Fama +3, reputación −2.';
        },
      },
    ],
  },
  {
    id: 'academy_reembolso',
    title: 'Un alumno pide el reembolso',
    portrait: 'portrait_franquiciado', image: 'ev_academy_reembolso',
    text: () =>
      'Ernesto, 52 años, alumno de tu curso "Mentalidad de Tiburón" (997 €), siguió tus consejos al pie de la letra: dejó su plaza de funcionario, pidió un crédito y abrió una tienda de fundas de móvil "con mentalidad". Ha cerrado a los cuatro meses.\n\n' +
      'Ahora quiere su dinero y que le expliques el módulo 7: "El fracaso es una opinión".',
    weight: (s) => (has(s, 'academy') ? 1.2 : 0),
    cooldown: 18,
    choices: [
      {
        label: 'Devolverle el dinero a él y a otros 19 alumnos descontentos',
        effect(s) {
          addCash(s, -19940);
          addRep(s, 5);
          addFama(s, -3);
          return 'Devuelves 19.940 € y le pides perdón a Ernesto en persona. Él te pide un trabajo. Le das uno en el obrador, de verdad. Reputación +5, fama −3.';
        },
      },
      {
        label: 'Ofrecerle el curso avanzado con un 50 % de descuento',
        effect(s) {
          addCash(s, 500);
          addRep(s, -4);
          return 'Increíblemente, Ernesto acepta. El curso avanzado se titula "El fracaso como activo". Cobras 500 €. Reputación −4.';
        },
      },
      {
        label: 'Usar su caso como ejemplo de "falta de mentalidad" en clase',
        hint: '30 %: denuncia por publicidad engañosa.',
        effect(s) {
          addFama(s, 4);
          addRep(s, -6);
          if (chance(s, 0.3)) {
            fine(s, 8000);
            addHeatHacienda(s, 5);
            return 'Ernesto denuncia a la Academy ante Consumo por publicidad engañosa. Multa de 8.000 € y Hacienda pregunta cuánto facturas en "mentalidad". Fama +4, reputación −6, radar de Hacienda +5.';
          }
          return 'Tus alumnos aplauden. Uno graba la clase y Ernesto la ve. Fama +4, reputación −6.';
        },
      },
    ],
  },

  // ------------------------------------------------------------ Plantilla
  {
    id: 'becario_genio',
    title: 'El becario que lo automatizó todo',
    portrait: 'portrait_becario', image: 'ev_becario_genio',
    text: () =>
      'Iván, uno de tus becarios (400 € al mes), ha programado en sus ratos libres una aplicación que organiza los turnos, calcula la masa del día y avisa cuando falta mantequilla. Ahorra tres horas diarias de oficina.\n\n' +
      'La ha llamado "AnselmoBot".',
    weight: (s) => (s.policies.becarios !== 'ninguno' ? 1.5 : 0),
    cooldown: 30,
    choices: [
      {
        label: 'Contratarle como responsable de sistemas (2.300 €/mes)',
        effect(s) {
          addMonthlyCost(s, 'Iván, responsable de sistemas', 2300);
          addMod(s, { kind: 'labor', factor: 0.97, months: 36, label: 'AnselmoBot' });
          addMoral(s, 4);
          return 'Iván firma su primer contrato indefinido y llama a su madre desde el baño. Costes laborales −3 % durante 3 años. Cobra 2.300 €/mes. Moral +4.';
        },
      },
      {
        label: 'Quedarte la aplicación y despedirle al acabar la beca',
        hint: '40 %: el código era suyo.',
        effect(s) {
          addMoral(s, -6);
          if (chance(s, 0.4)) {
            addCash(s, -12000);
            addMod(s, { kind: 'labor', factor: 0.97, months: 36, label: 'AnselmoBot' });
            return 'Iván había registrado el código a su nombre. Te vende la licencia por 12.000 € y te desea "mucha mentalidad". Costes laborales −3 % durante 3 años. Moral −6.';
          }
          addMod(s, { kind: 'labor', factor: 0.97, months: 12, label: 'AnselmoBot (sin mantenimiento)' });
          return 'AnselmoBot funciona... hasta que se actualiza el móvil de Paco y nadie sabe arreglarlo. Costes laborales −3 % durante un año. Moral −6.';
        },
      },
      {
        label: 'Venderla a otras pastelerías como "Boomerez Software"',
        hint: 'Sin preguntarle a Iván.',
        effect(s) {
          addCash(s, 15000);
          addMoral(s, -4);
          addRep(s, -3);
          if (chance(s, 0.5)) {
            fine(s, 15000);
            addRep(s, -4);
            return 'Ingresas 15.000 € en licencias, hasta que Iván lo cuenta en un hilo con capturas del código. Le pagas 15.000 € en un acuerdo extrajudicial. Moral −4, reputación −7.';
          }
          return 'Vendes treinta licencias por 15.000 €. Iván se entera por un cliente y se va a una empresa de Bilbao. Moral −4, reputación −3.';
        },
      },
    ],
  },
  {
    id: 'jubilacion_conchi',
    title: 'Se jubila Conchi',
    portrait: 'portrait_empleada_maripili', image: 'ev_jubilacion_conchi',
    text: () =>
      'Conchi se jubila. Entró en el obrador con dieciséis años, cuando tu padre aún tenía pelo, y en cuarenta y ocho años no ha faltado ni un día, salvo en sus tres partos (y el día de uno vino por la tarde).\n\n' +
      'La plantilla ha preparado una despedida en el obrador y te mira, esperando a ver qué dices.',
    weight: (s) => (s.month >= 12 ? 0.8 : 0),
    once: true,
    choices: [
      {
        label: 'Fiesta, placa y un reloj de oro (3.000 €)',
        effect(s) {
          addCash(s, -3000);
          addMoral(s, 7);
          addRep(s, 2);
          return 'Conchi llora, tú lloras y Maripili finge que no llora. La placa dice: "A Conchi, que amasó este imperio". Por una vez, es verdad. Moral +7, reputación +2.';
        },
      },
      {
        label: 'Proponerle que siga como "asesora autónoma" a media jornada',
        hint: 'Jubilada y trabajando para ti en negro. A la Seguridad Social no le va a gustar.',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.03, months: 12, label: 'Conchi asesora' });
          addHeatTrabajo(s, 8);
          addMoral(s, -3);
          return 'Conchi acepta "por no dejarte tirado". Sigue viniendo a las cinco de la mañana sin contrato. Los sobaos salen mejor y la Inspección toma nota. Ventas de sobaos +3 % durante un año, radar de Inspección +8, moral −3.';
        },
      },
      {
        label: 'Un sobao con una vela y vuelta al trabajo',
        effect(s) {
          addMoral(s, -7);
          return 'Conchi sopla la vela. "Igualito que tu padre", dice. No es un cumplido: tu padre le regaló un viaje a Benidorm por sus veinticinco años en el obrador. Moral −7.';
        },
      },
    ],
  },

  // ------------------------------------------------------------ Familia
  {
    id: 'madre_visita',
    title: 'Tu madre viene al obrador',
    portrait: 'portrait_madre', image: 'ev_madre_visita',
    text: (s) => {
      const opinion = {
        mantequilla: '"Hijo, está bueno. Le falta un poco de horno, pero está bueno."',
        margarina: '"Manolo. Esto es margarina. A mí no me engañas, que te he parido yo."',
        misteriosa: '"Manolo, ¿qué es esto? Esto no lo comía ni tu abuelo en la posguerra."',
      }[s.policies.ingredientes] ?? '"Hijo, esto sabe raro."';
      return 'Tu madre, Doña Remedios, 81 años, se presenta en el obrador sin avisar, con un táper de croquetas y su bastón de aluminio. Prueba un sobao de la bandeja.\n\n' +
        `${opinion}\n\nLuego mira a la plantilla, te mira a ti y pregunta: "¿Y tú a estas chicas les pagas bien?"`;
    },
    weight: (s) => (s.month >= 4 ? 0.8 : 0),
    cooldown: 20,
    choices: [
      {
        label: 'Decirle la verdad sobre los sueldos',
        effect(s) {
          if (s.policies.salario === 'convenio' && s.policies.horas === 'pagadas') {
            addFamilia(s, 5);
            addMoral(s, 2);
            return '"Convenio y horas pagadas, mamá." Tu madre asiente: "Como tu padre". Es lo más bonito que te ha dicho en diez años. Familia +5, moral +2.';
          }
          addFamilia(s, -4);
          addMoral(s, 4);
          return 'Tu madre se sienta, saca las gafas y te pide las nóminas. Delante de todos. Te da una colleja que se oye en Torrelavega. La plantilla la adora. Familia −4, moral +4.';
        },
      },
      {
        label: 'Repartir las croquetas y cambiar de tema',
        effect(s) {
          addMoral(s, 2);
          addFamilia(s, 2);
          return 'Las croquetas desaparecen en dos minutos. Tu madre se va contenta, con el táper vacío y la duda. Moral +2, familia +2.';
        },
      },
      {
        label: 'Explicarle que ahora eres un "joven emprendedor"',
        effect(s) {
          addFamilia(s, -3);
          addFama(s, 1);
          return '"¿Joven? Tienes 55 años y todavía te plancho las camisas." La plantilla aplaude. Familia −3, fama +1.';
        },
      },
      {
        label: 'Prometerle volver a la mantequilla de verdad',
        available: (s) => s.policies.ingredientes !== 'mantequilla',
        effect(s) {
          s.policies.ingredientes = 'mantequilla';
          addFamilia(s, 6);
          addRep(s, 2);
          return 'Tu madre te pellizca la mejilla delante de todos. Los costes suben, pero el sobao vuelve a saber a sobao. Ingredientes: mantequilla pasiega. Familia +6, reputación +2.';
        },
      },
    ],
  },

  // ------------------------------------------------------------ Calendario español
  {
    id: 'fiestas_patronales',
    title: 'Las fiestas del pueblo',
    portrait: 'portrait_alcalde', image: 'ev_fiestas_patronales',
    text: () =>
      'Llegan las fiestas de Selaya. La comisión de fiestas (cuatro jubilados y una chica con una carpeta) te pide que patrocines la orquesta.\n\n' +
      'El alcalde se acerca por detrás, te pasa el brazo por el hombro y te susurra: "Manolo, si la pagas tú entera, lo de la licencia de la terraza lo vemos con cariño."',
    weight: (s) => ([6, 7].includes(moy(s)) ? 2.5 : 0),
    cooldown: 10,
    choices: [
      {
        label: 'Patrocinar la orquesta sin pedir nada a cambio (5.000 €)',
        effect(s) {
          addCash(s, -5000);
          addRep(s, 4);
          addMoral(s, 3);
          return 'La orquesta toca hasta las seis. Baila la plantilla, baila tu madre y bailas tú, fatal. Reputación +4, moral +3.';
        },
      },
      {
        label: 'Pagarlo todo "a cambio de cariño" con la licencia (8.000 €)',
        hint: 'El alcalde será tu amigo. Demasiado.',
        effect(s) {
          addCash(s, -8000);
          s.flags.alcaldeAmigo = true;
          s.flags.alcaldeShield = Math.max(s.flags.alcaldeShield || 0, 4);
          addHeatHacienda(s, 4);
          addRep(s, 2);
          return 'Pagas orquesta, cohetes y una paella para seiscientas personas. Desde el escenario, el alcalde te llama "el mejor vecino de Selaya". Tendrás tu licencia y, durante 4 meses, el ayuntamiento te mirará con buenos ojos. Reputación +2, radar de Hacienda +4.';
        },
      },
      {
        label: 'Montar una caseta de sobaos a "precio de fiestas"',
        effect(s) {
          addCash(s, 3000);
          addRep(s, -2);
          return 'Sobaos a 3 € la unidad "porque es fiesta". Ganas 3.000 € y un apodo nuevo en las peñas. Reputación −2.';
        },
      },
      {
        label: '"Este año no hay presupuesto"',
        effect(s) {
          addRep(s, -3);
          return 'La comisión tiene buena memoria y mejor megafonía: "¡Y gracias a todos los comercios! Menos a uno". Reputación −3.';
        },
      },
    ],
  },
  {
    id: 'black_friday',
    title: 'Se acerca el Black Friday',
    portrait: 'portrait_gestor_paco', image: 'ev_black_friday',
    text: () =>
      'Llega el Black Friday y cada uno tiene su idea. Paco propone la clásica: subir los precios un 30 % a principios de mes y "rebajarlos" un 30 % el día del Black Friday.' +
      'Vanessa propone un descuento de verdad y una campaña bonita. Kevin propone un "Black Sobao Month" que dure del 1 de noviembre al 6 de enero.',
    weight: (s) => (moy(s) === 9 && s.month >= 9 ? 3.5 : 0),
    cooldown: 10,
    choices: [
      {
        label: 'Descuento real del 20 %',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.05, months: 1, label: 'Black Friday' });
          addRep(s, 3);
          return 'Las colas llegan a la esquina. Ganas poco por sobao y mucho en clientela. Ventas de sobaos +5 % en noviembre, reputación +3.';
        },
      },
      {
        label: 'La de Paco: inflar y luego "rebajar"',
        hint: '60 %: nadie compara precios.',
        effect(s) {
          addMod(s, { kind: 'revenue', factor: 1.06, months: 1, label: 'Falso Black Friday' });
          if (chance(s, 0.4)) {
            const c = int(s, 8, 15) * 1000;
            fine(s, c);
            addRep(s, -6);
            return `Una asociación de consumidores compara tus precios de septiembre y de noviembre y lo cuenta en el telediario. Multa de Consumo: ${money(c)}. Ingresos +6 % en noviembre, reputación −6.`;
          }
          return 'Nadie compara. Ingresos +6 % en noviembre. Te sientes un lobo de Wall Street (de Selaya).';
        },
      },
      {
        label: 'El "Black Sobao Month" de Kevin',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.04, months: 2, label: 'Black Sobao Month' });
          addFama(s, 3);
          addMoral(s, -3);
          return 'Dos meses de ofertas, turnos dobles y Kevin con un megáfono en la puerta. Ventas de sobaos +4 % durante 2 meses. Fama +3, moral −3 (la plantilla lo ha disfrutado menos).';
        },
      },
      {
        label: '"Yo no celebro fiestas americanas"',
        effect(s) {
          addRep(s, 1);
          addFama(s, 1);
          return 'Lo dices en Radio Pas con una gorra de béisbol puesta. Nadie lo nota, salvo todo el mundo. Reputación +1, fama +1.';
        },
      },
    ],
  },
  {
    id: 'cuesta_enero',
    title: 'La cuesta de enero',
    portrait: 'portrait_empleada_maripili', image: 'ev_cuesta_enero',
    text: (s) =>
      'Enero. Las rebajas vacían los bolsillos, los Reyes han dejado las tarjetas temblando y en el obrador nadie llega a fin de mes' +
      `${s.macro?.phase === 'crisis' ? ', y con la crisis, menos todavía' : ''}. Maripili te trae una lista: ${Math.max(3, Math.round(employees(s) / 6))} compañeras piden un anticipo de la nómina de febrero.`,
    weight: (s) => (moy(s) === 11 && s.month >= 11 ? 3.5 : 0),
    cooldown: 10,
    choices: [
      {
        label: 'Adelantar las nóminas sin intereses',
        effect(s) {
          addMoral(s, 5);
          return 'Firmas los anticipos sin pestañear. Maripili te mira con sospecha y luego con algo parecido al respeto. Moral +5.';
        },
      },
      {
        label: 'Prestarles el dinero al 9 % de interés',
        hint: 'Usura en el vestuario.',
        effect(s) {
          const n = Math.max(3, Math.round(employees(s) / 6));
          const c = n * 90;
          addCash(s, c);
          addMoral(s, -8);
          addHeatTrabajo(s, 6);
          return `Montas "Boomerez Finance" en el vestuario. Ganas ${money(c)} en intereses y fama de prestamista. Moral −8, radar de Inspección +6.`;
        },
      },
      {
        label: 'Montar "rebajas para la plantilla" en la tienda del obrador',
        effect(s) {
          addCash(s, 400);
          addMoral(s, 1);
          return 'Les vendes sobaos con un 10 % de descuento. A ellas, que los hacen. Lo agradecen igual, con bastante ironía. Ingresas 400 €. Moral +1.';
        },
      },
      {
        label: '"Yo también estoy en la cuesta de enero"',
        effect(s) {
          addMoral(s, -4);
          return 'Lo dices con el Audi aparcado detrás y unas gafas de esquí en la cabeza. Moral −4.';
        },
      },
    ],
  },
  {
    id: 'puente_mayo',
    title: 'El puente de mayo',
    portrait: 'portrait_manolo_thinking', image: 'ev_puente_mayo',
    text: () =>
      'Se acerca el puente de mayo y media España junta el festivo con el fin de semana. La plantilla pregunta si se cierra también el día de puente.\n\n' +
      'Tú haces cuentas en una servilleta: un puente con turistas es un puente con sobaos.',
    weight: (s) => (moy(s) === 3 && s.month >= 3 ? 3.5 : 0),
    cooldown: 10,
    choices: [
      {
        label: 'Cerrar el día de puente: puente para todos',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 0.96, months: 1, label: 'Puente de mayo' });
          addMoral(s, 5);
          return 'Cuatro días de descanso. Maripili se va a la playa y te manda una foto de sus pies. Ventas de sobaos −4 % en mayo, moral +5.';
        },
      },
      {
        label: 'Abrir con voluntarios y pagar el festivo doble',
        effect(s) {
          const c = employees(s) * 60;
          addCash(s, -c);
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.04, months: 1, label: 'Puente de mayo' });
          addMoral(s, 2);
          return `Se apunta más gente de la que esperabas. Pagas ${money(c)} en festivos dobles. Ventas de sobaos +4 % en mayo, moral +2.`;
        },
      },
      {
        label: 'Abrir con todos y "olvidarte" de pagar el festivo',
        hint: 'Los festivos se pagan. La Inspección también lo sabe.',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.04, months: 1, label: 'Puente de mayo' });
          addMoral(s, -6);
          addHeatTrabajo(s, 7);
          return 'Abres con todo el mundo y en la nómina el festivo aparece como "jornada de convivencia". Ventas de sobaos +4 % en mayo. Moral −6, radar de Inspección +7.';
        },
      },
    ],
  },
  {
    id: 'san_fermin',
    title: 'San Fermín',
    portrait: 'portrait_manolo_happy', image: 'ev_san_fermin',
    text: () =>
      'Llega julio. Kevin te enseña un vídeo: un consejero delegado madrileño corrió el encierro con una camiseta de su empresa y ahora da charlas sobre "liderazgo bajo presión".\n\n' +
      'Tú tienes 55 años, una rodilla operada y una idea.',
    weight: (s) => (moy(s) === 5 && s.month >= 5 ? 3.5 : 0),
    cooldown: 10,
    choices: [
      {
        label: 'Correr el encierro con un polo de Boomerez',
        hint: '35 %: acabas en la enfermería.',
        effect(s) {
          if (chance(s, 0.35)) {
            addCash(s, -3000);
            addFama(s, 8);
            addFamilia(s, -2);
            return 'A los veinte metros te adelanta un mozo de setenta años y tropiezas con tu propia sombra. Ningún toro te toca, pero pasas julio con muletas y 3.000 € de fisioterapia. El vídeo de la caída es lo más visto del día. Fama +8, familia −2.';
          }
          addFama(s, 10);
          return 'Corres cuarenta metros pegado a la pared y ningún toro te mira. En LinkedIn lo titulas "Así gestiono el riesgo". Fama +10.';
        },
      },
      {
        label: 'Montar un puesto de sobaos en Pamplona (6.000 €)',
        hint: '60 %: se venden como rosquillas.',
        effect(s) {
          addCash(s, -6000);
          if (chance(s, 0.6)) {
            addCash(s, 11000);
            addFama(s, 2);
            return 'El sobao resulta ser el desayuno perfecto después de una noche muy larga. Ingresas 11.000 €. Fama +2.';
          }
          addCash(s, 3000);
          return 'Llueve los nueve días y el puesto huele a sangría. Recuperas 3.000 €.';
        },
      },
      {
        label: 'Quedarte en Selaya y verlo por la tele con tu madre',
        effect(s) {
          addFamilia(s, 3);
          return 'Tu madre comenta cada carrera como si fuera la final de un mundial. Os coméis media bandeja de sobaos. Familia +3.';
        },
      },
    ],
  },
  {
    id: 'semana_santa',
    title: 'Semana Santa',
    portrait: 'portrait_madre', image: 'ev_semana_santa',
    text: () =>
      'Llega Semana Santa. Tu madre, camarera de la cofradía del pueblo, te pide que pagues las flores del paso. Vanessa propone otra cosa: lanzar la "Torrija Pasiega", hecha con sobao del día anterior.\n\n' +
      'Kevin propone una tercera: poner el logo de Boomerez en los capirotes.',
    weight: (s) => ([1, 2].includes(moy(s)) && s.month >= 1 ? 2.5 : 0),
    cooldown: 10,
    choices: [
      {
        label: 'Lanzar la "Torrija Pasiega"',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.06, months: 1, label: 'Torrija Pasiega' });
          addFama(s, 2);
          return 'Sobao del día anterior, leche, canela y miel. Las colas dan la vuelta a la iglesia. Ventas de sobaos +6 % este mes, fama +2.';
        },
      },
      {
        label: 'Pagar las flores del paso (2.000 €)',
        effect(s) {
          addCash(s, -2000);
          addFamilia(s, 5);
          addRep(s, 2);
          return 'Tu madre presume de hijo durante toda la procesión. Pagas 2.000 €. Familia +5, reputación +2.';
        },
      },
      {
        label: 'El logo en los capirotes',
        hint: 'Visibilidad garantizada. Y excomunión social.',
        effect(s) {
          addFama(s, 6);
          addRep(s, -6);
          addFamilia(s, -5);
          return 'El párroco te llama "mercader del templo" en la homilía y tu madre no te habla hasta el Domingo de Resurrección. Fama +6, reputación −6, familia −5.';
        },
      },
    ],
  },
  {
    id: 'ola_frio',
    title: 'Ola de frío',
    portrait: 'portrait_manolo_scared', image: 'ev_ola_frio',
    text: () =>
      'Una ola de frío siberiano deja medio metro de nieve en los Valles Pasiegos. El camión de la mantequilla está atrapado en el puerto, la furgoneta de reparto no arranca y media plantilla vive en pueblos aislados.\n\n' +
      'Eso sí: con este frío, todo el mundo quiere sobaos.',
    weight: (s) => ([10, 11, 0].includes(moy(s)) ? 1.8 : 0),
    cooldown: 12,
    choices: [
      {
        label: 'Pagar a un ganadero del valle para que abra paso con su tractor (3.000 €)',
        effect(s) {
          addCash(s, -3000);
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.05, months: 1, label: 'Sobaos de nevada' });
          addRep(s, 2);
          return 'Tino, el de la Vega, abre paso con su tractor y de paso recoge a medio turno de mañana. Ventas de sobaos +5 % este mes, reputación +2.';
        },
      },
      {
        label: '"Que vengan como puedan: el que quiere, puede"',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 1.02, months: 1, label: 'Sobaos de nevada' });
          addMoral(s, -8);
          addHeatTrabajo(s, 5);
          return 'Dos pasiegas llegan con esquís de fondo y otra en el tractor de su suegro. Las tres te miran en silencio. Ventas de sobaos +2 % este mes, moral −8, radar de Inspección +5.';
        },
      },
      {
        label: 'Cerrar dos días y pagar igual a todo el mundo',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 0.92, months: 1, label: 'Cierre por nevada' });
          addMoral(s, 6);
          return 'Cierras, pagas y mandas un mensaje: "Quedaos en casa". La plantilla no se lo cree. Ventas de sobaos −8 % este mes, moral +6.';
        },
      },
    ],
  },

  // ------------------------------------------------------------ Ciclo económico
  {
    id: 'fondo_buitre',
    title: 'Un fondo quiere tus pisos',
    portrait: 'portrait_banquero', image: 'ev_fondo_buitre',
    text: (s) => {
      const b = fondoTarget(s);
      const what = b?.type === 'vivienda' ? 'uno de tus edificios del Residencial Boomerez, con tu plantilla dentro' : 'uno de tus edificios de apartamentos "Casa Manolo"';
      return `Un fondo de inversión con sede en un país con mucho sol y pocos impuestos quiere comprarte ${what}. Ofrece ${money(fondoOffer(b))}, un 35 % más de lo que vale.\n\n` +
        '"Es la burbuja, Manolo. Hay que vender arriba", dice el señor del chaleco acolchado.';
    },
    weight: (s) => (s.macro?.phase === 'burbuja' && fondoTarget(s) ? 1.5 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'No vender: "El ladrillo nunca baja"',
        effect(s) {
          addFama(s, 1);
          return 'El señor del chaleco sonríe con mucha paciencia. Volverá en la crisis, a comprarlo a mitad de precio. Fama +1.';
        },
      },
      {
        label: 'Vender',
        hint: 'Un 35 % por encima de su valor. El edificio deja de ser tuyo.',
        effect(s) {
          const b = fondoTarget(s);
          if (!b) return 'Cuando vas a firmar, ya no te queda nada que vender. El fondo se va con su chaleco a otra parte.';
          const offer = fondoOffer(b);
          const vivienda = b.type === 'vivienda';
          s.businesses = s.businesses.filter((x) => x !== b);
          addCash(s, offer);
          log(s, `🏢 Vendes un inmueble a un fondo de inversión por ${money(offer)}.`, 'info');
          if (vivienda) {
            addMoral(s, -6);
            return `Firmas y cobras ${money(offer)}. Las trabajadoras que vivían allí tienen casero nuevo, que sube el alquiler a la primera ocasión. Pierdes el edificio. Moral −6.`;
          }
          return `Firmas y cobras ${money(offer)}. El fondo cambia la cerradura y la tarifa el mismo día. Pierdes el edificio.`;
        },
      },
      {
        label: 'Vendérselo y alquilárselo de vuelta',
        hint: 'Cobras ya el 90 % de la oferta y sigues explotándolo, pero pagas un alquiler para siempre.',
        effect(s) {
          const b = fondoTarget(s);
          if (!b) return 'Cuando vas a firmar, ya no te queda nada que vender. El fondo se va con su chaleco a otra parte.';
          const cash = Math.round(fondoOffer(b) * 0.9);
          const rent = Math.round(cash * 0.006);
          b.value = 0;
          b.leased = true;
          addCash(s, cash);
          addMonthlyCost(s, 'Alquiler al fondo (venta con arrendamiento posterior)', rent, null);
          s.extraMonthly[s.extraMonthly.length - 1].leaseOf = b.id;
          return `Cobras ${money(cash)} y el edificio sigue funcionando como siempre, pero ya no es tuyo: pagas ${money(rent)} al mes de alquiler. Paco lo llama "ingeniería financiera". Tu padre lo habría llamado "vender la vaca y pagar por la leche".`;
        },
      },
    ],
  },
  {
    id: 'crisis_sueldos',
    title: 'La plantilla ofrece un sacrificio',
    portrait: 'portrait_empleada_maripili', image: 'ev_crisis_sueldos',
    text: () =>
      'La crisis aprieta y Maripili trae una propuesta de la asamblea: la plantilla acepta bajarse el sueldo un 10 % durante un año, a cambio de un compromiso por escrito de que no habrá despidos.\n\n' +
      '"Lo hacemos por el obrador, Manolo. Por el obrador, no por ti."',
    weight: (s) => (s.macro?.phase === 'crisis' && employees(s) >= 15 ? 1.6 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'Aceptar y firmar el compromiso',
        effect(s) {
          addMod(s, { kind: 'labor', factor: 0.9, months: 12, label: 'Pacto de crisis' });
          addMoral(s, 3);
          s.flags.pactoCrisis = s.month;
          return 'Firmas y cumples. Durante un año nadie se va a la calle y en el obrador se trabaja con una calma rara. Costes laborales −10 % durante un año, moral +3.';
        },
      },
      {
        label: 'Aceptar la rebaja... y despedir a unos cuantos igualmente',
        hint: 'Lo que se firma, se cumple. O se paga.',
        effect(s) {
          addMod(s, { kind: 'labor', factor: 0.85, months: 12, label: 'Pacto de crisis (incumplido)' });
          addMoral(s, -15);
          addRep(s, -8);
          addHeatTrabajo(s, 12);
          return 'Firmas el lunes y el viernes despides a seis. Maripili enmarca el compromiso firmado y lo cuelga en el vestuario, junto a tu foto. Costes laborales −15 % durante un año, moral −15, reputación −8, radar de Inspección +12.';
        },
      },
      {
        label: '"Aquí no se le baja el sueldo a nadie"',
        effect(s) {
          addMoral(s, 8);
          addRep(s, 3);
          return 'Lo dices sin tiburones ni diapositivas. Maripili tarda un segundo en reaccionar. Luego aplaude, y detrás aplaude todo el obrador. Moral +8, reputación +3.';
        },
      },
    ],
  },
  {
    id: 'headhunter',
    title: 'Te roban a las pasteleras',
    portrait: 'portrait_hipster', image: 'ev_headhunter',
    text: () =>
      'Con la economía a tope, todo el mundo abre pastelerías. Una cadena de Madrid ha fichado a tres de tus mejores pasteleras con un 20 % más de sueldo y un horario humano. Y hay otras cinco con la entrevista hecha.',
    weight: (s) => (['expansion', 'burbuja'].includes(s.macro?.phase) && employees(s) >= 20 && s.month >= 12 ? 1 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'Subir el sueldo a toda la plantilla',
        effect(s) {
          s.wageIndex = (s.wageIndex || 1) * 1.03;
          addMoral(s, 6);
          return 'Subes los sueldos un 3 % a todo el mundo y las cinco cancelan la entrevista. Costes salariales +3 % para siempre, moral +6.';
        },
      },
      {
        label: 'Dejarlas ir y meter becarios',
        effect(s) {
          addMod(s, { kind: 'revenue', category: 'sobaos', factor: 0.94, months: 6, label: 'Fuga de pasteleras' });
          addMoral(s, -4);
          return 'Las que se van se llevan treinta años de oficio. Los sobaos salen "correctos", que es la palabra más triste de la repostería. Ventas de sobaos −6 % durante 6 meses, moral −4.';
        },
      },
      {
        label: 'Amenazarlas con una cláusula de no competencia que nunca firmaron',
        hint: 'Un farol jurídico. Don Cosme se tapa la cara.',
        effect(s) {
          addHeatTrabajo(s, 8);
          addMoral(s, -6);
          if (chance(s, 0.5)) {
            fine(s, 6000);
            return 'Una de ellas lleva tu carta a un abogado laboralista, que se ríe en voz alta. Pagas 6.000 € para que no lo haga en el juzgado. Moral −6, radar de Inspección +8.';
          }
          return 'Dos se asustan y se quedan. Las demás se van riéndose. Moral −6, radar de Inspección +8.';
        },
      },
    ],
  },
  {
    id: 'recalificacion_prado',
    title: 'El prado de tu padre',
    portrait: 'portrait_alcalde', image: 'ev_recalificacion_prado',
    text: () =>
      'El alcalde te invita a comer y, entre el chuletón y el orujo, te hace una propuesta: el prado de tu padre, el de las vacas junto al río, podría pasar a ser urbanizable.\n\n' +
      '"Boomerez Park: ochenta adosados. Tú pones el prado, una constructora pone los ladrillos y mi fundación pone... la ilusión. Con un donativo de 30.000 €, todo es más fácil."',
    weight: (s) => (s.month >= 10 ? 0.9 : 0),
    once: true,
    choices: [
      {
        label: 'Aceptar y hacer el "donativo" (30.000 €)',
        hint: 'La recalificación vale mucho más. Y huele mucho peor.',
        effect(s) {
          addCash(s, -30000);
          addCash(s, 85000);
          s.flags.alcaldeAmigo = true;
          addHeatHacienda(s, 15);
          addRep(s, -4);
          return 'Donas 30.000 € a la "Fundación Amigos del Progreso de Selaya" y vendes el prado recalificado a una constructora por 85.000 €. Las vacas de tu padre se mudan al prado del vecino. Radar de Hacienda +15, reputación −4.';
        },
      },
      {
        label: 'Rechazarlo con educación',
        effect(s) {
          addRep(s, 2);
          return '"Las vacas de mi padre se quedan donde están." El alcalde se ofende y, por primera vez en su mandato, paga su chuletón. Reputación +2.';
        },
      },
      {
        label: 'Donar el prado al pueblo como parque',
        effect(s) {
          addRep(s, 7);
          addFama(s, 3);
          addFamilia(s, 3);
          return 'El "Prado Don Anselmo" tiene ahora columpios, bancos y una placa con la boina de tu padre. Tu madre va a merendar allí cada tarde. Reputación +7, fama +3, familia +3.';
        },
      },
      {
        label: 'Grabar la conversación con el móvil, "por si acaso"',
        effect(s) {
          s.flags.alcaldeGrabacion = true;
          return 'Le dices que te lo pensarás mientras el móvil graba desde tu bolsillo: el chuletón, el orujo y la palabra "donativo", dos veces. Guardas el audio en una carpeta llamada "Seguro de vida".';
        },
      },
    ],
  },
];
