// Sucesos ligados a una ciudad concreta. Solo salen si Manolo tiene algún negocio en esa ciudad
// (en Selaya cuenta el obrador de Don Anselmo, que siempre está allí).
// Calendario: como en eventsExtra.js, el suceso se sortea al cerrar el mes m y se juega al empezar el m + 1,
// así que la ventana de moy() es el mes anterior a la fiesta y un modificador de 1 mes afecta al mes de la fiesta.
import { chance, int } from '../core/rng.js';
import {
  addCash, addRep, addMoral, addFama, addHeatTrabajo, addHeatHacienda, addMod, addMonthlyCost, money, clamp,
} from '../core/helpers.js';

const moy = (s) => s.month % 12;
// Negocios donde se desayuna, se come o se compra algo dulce.
const FOOD = ['express', 'maison', 'smash', 'empanadas', 'taberna'];
const at = (s, city, types = null) => s.businesses.some((b) => b.city === city && (!types || types.includes(b.type)));
const fine = (s, amount) => {
  addCash(s, -amount);
  s.stats.multas += amount;
};
const addFamilia = (s, d) => {
  s.familia = clamp((s.familia ?? 60) + d);
};
// Modificador de ingresos para todos los negocios de una ciudad (si ya no queda ninguno, no hace nada).
const cityMod = (s, city, factor, months, label) => addMod(s, { kind: 'revenue', city, factor, months, label });

export const CITY_EVENTS = [
  // ------------------------------------------------------------------ Pamplona
  {
    id: 'ciudad_pamplona',
    title: 'San Fermín llama a la puerta',
    portrait: 'portrait_empleada_maripili', image: 'ev_ciudad_pamplona',
    text: () =>
      'Pamplona, 6 de julio. A mediodía estalla el chupinazo y la ciudad entera se viste de blanco y rojo. La peña "Los del Último Trago" se presenta en tu local: quieren usarlo de cuartel general los nueve días, "solo para dejar las mochilas y desayunar".\n\n' +
      'Itziar, tu encargada en Pamplona, te recuerda dos cosas: que su cuadrilla no se ha perdido un encierro desde 1987 y que el día 7 es fiesta local. Maripili, desde Selaya, añade una tercera: "Manolo, ni se te ocurra."',
    weight: (s) => (at(s, 'pamplona', FOOD) && moy(s) === 5 ? 3.5 : 0),
    forced: true, // fiesta del calendario: sale en su mes si tienes negocio en la ciudad
    cooldown: 24,
    choices: [
      {
        label: 'Dar fiesta a quien la pida y abrir con refuerzos pagados (3.000 €)',
        effect(s) {
          addCash(s, -3000);
          addMoral(s, 4);
          cityMod(s, 'pamplona', 1.15, 1, 'San Fermín');
          return 'Contratas a cuatro estudiantes de refuerzo y pagas el festivo como manda el convenio. Itziar corre el encierro del día 7 y vuelve a tiempo para el turno de tarde, con la camisa intacta y una sonrisa nueva. Pagas 3.000 €. Ingresos en Pamplona +15 % en julio, moral +4.';
        },
      },
      {
        label: 'Alquilarle el local a la peña (8.000 €)',
        hint: '50 %: te lo devuelven tal y como estaba.',
        effect(s) {
          addCash(s, 8000);
          cityMod(s, 'pamplona', 0.9, 1, 'Local alquilado a la peña');
          if (chance(s, 0.5)) {
            addFama(s, 3);
            return 'La peña paga, canta, desayuna y lo deja todo como los chorros del oro. Te nombran socio de honor y te regalan un pañuelico. Cobras 8.000 €. Ingresos en Pamplona −10 % en julio, fama +3.';
          }
          addCash(s, -6000);
          addRep(s, -2);
          return 'Nueve días después, el local huele a calimocho hasta en el techo y el mostrador ha hecho de escenario para la charanga. Cobras 8.000 € y pagas 6.000 € de limpieza y carpintería. Ingresos en Pamplona −10 % en julio, reputación −2.';
        },
      },
      {
        label: 'Vender "sobaos del encierro" a 6 € la unidad',
        hint: 'Precio de fiestas. Memoria de pamplonés.',
        effect(s) {
          cityMod(s, 'pamplona', 1.25, 1, 'Sobaos del encierro');
          addRep(s, -4);
          if (chance(s, 0.35)) {
            addRep(s, -3);
            addFama(s, 3);
            return 'Se venden solos a las ocho de la mañana. Al tercer día, un periódico local publica el ranking "Los abusos de San Fermín" y sales el primero, por delante de un hostal que cobraba el balcón por minutos. Ingresos en Pamplona +25 % en julio. Reputación −7, fama +3.';
          }
          return 'Se venden solos entre el encierro y el almuerzo. Los pamploneses pagan, sonríen y lo apuntan en una libreta mental que no caduca. Ingresos en Pamplona +25 % en julio, reputación −4.';
        },
      },
      {
        label: '"Aquí se viene a trabajar, no a correr delante de vacas"',
        effect(s) {
          cityMod(s, 'pamplona', 1.1, 1, 'San Fermín');
          addMoral(s, -6);
          addHeatTrabajo(s, 5);
          return 'Itziar te explica, con mucha calma, que son toros y que el día 7 es festivo. Abres igual, con la plantilla al completo, que atiende con el pañuelo al cuello y la mirada fija en ti. Ingresos en Pamplona +10 % en julio. Moral −6, radar de Inspección +5.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ València
  {
    id: 'ciudad_valencia',
    title: 'Un ninot con tu cara',
    portrait: 'portrait_manolo_scared', image: 'ev_ciudad_valencia',
    text: () =>
      'Marzo en València: pólvora, buñuelos y monumentos de cartón piedra en cada cruce. La falla del barrio de tu negocio ha elegido el tema de este año: "El Rei del Sobao". En el centro, un ninot de cuatro metros de Manolo Boomerez, con las gafas de sol en la cabeza, sentado en un trono de becarios de cartón y con un sobao en cada mano.\n\n' +
      'La noche del 19, como manda la tradición, lo quemarán. La comisión fallera te ha invitado a la cremà. En primera fila.',
    weight: (s) => (at(s, 'valencia') && moy(s) === 1 ? 3.5 : 0),
    forced: true, // fiesta del calendario: sale en su mes si tienes negocio en la ciudad
    cooldown: 24,
    choices: [
      {
        label: 'Reírte de ti mismo y patrocinar la falla (4.000 €)',
        effect(s) {
          addCash(s, -4000);
          addRep(s, 4);
          addFama(s, 4);
          cityMod(s, 'valencia', 1.1, 1, 'Fallas');
          return 'Te haces la foto con tu ninot, invitas a la comisión a buñuelos y aguantas la cremà en primera fila sin pestañear (las cejas, algo menos). Los falleros te adoptan: "Este sí que sabe reírse." Pagas 4.000 €. Reputación +4, fama +4 e ingresos en València +10 % en marzo.';
        },
      },
      {
        label: 'Comprar votos para que indulten tu ninot (10.000 €)',
        hint: 'El ninot indultat se salva del fuego por votación popular. Muy popular.',
        effect(s) {
          addCash(s, -10000);
          if (chance(s, 0.3)) {
            addFama(s, 8);
            addRep(s, -2);
            s.flags.ninotIndultado = true;
            return 'Funciona: tu ninot se salva del fuego y acaba en un museo, entre una abuela con paella y un gato con boina. Vas a visitarlo cada vez que pasas por València. Pagas 10.000 €. Fama +8, reputación −2.';
          }
          addFama(s, 5);
          addRep(s, -6);
          return 'La comisión descubre que tres mil votos llegaron en una hora desde la misma dirección de Selaya. Tu ninot arde igual, ahora con un cartel nuevo colgado del cuello: "Indultat? No, gràcies." Pagas 10.000 €. Fama +5, reputación −6.';
        },
      },
      {
        label: 'Mandar un burofax: "Esto es un atentado contra la marca"',
        effect(s) {
          addRep(s, -5);
          addFama(s, 6);
          return 'Don Cosme redacta el burofax con mucho pesar. La comisión lo plastifica y se lo cuelga al ninot, como una medalla. La cremà abre el telediario nacional. Reputación −5, fama +6.';
        },
      },
      {
        label: 'Vender buñuelos de sobao a pie de falla',
        hint: '25 %: la pólvora y el aceite caliente no se llevan bien.',
        effect(s) {
          cityMod(s, 'valencia', 1.2, 1, 'Buñuelos de sobao');
          addMoral(s, -3);
          if (chance(s, 0.25)) {
            addCash(s, -3000);
            return 'Un petardo perdido aterriza en la freidora y el puesto se queda sin toldo y sin freidora (y tú, sin media ceja). Pagas 3.000 € de material nuevo. Aun así, ingresos en València +20 % en marzo. Moral −3.';
          }
          return 'La plantilla fríe buñuelos de sobao cinco días seguidos entre mascletà y mascletà, mientras tú das órdenes que nadie oye. Ingresos en València +20 % en marzo, moral −3.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Sevilla
  {
    id: 'ciudad_sevilla',
    title: 'Una caseta en la Feria',
    portrait: 'portrait_manolo_smug', image: 'ev_ciudad_sevilla',
    text: () =>
      'Llega la Feria de Abril. En el real hay más de mil casetas, casi todas privadas, y para entrar en las buenas hay que ser socio, cuñado de un socio o haber nacido en Triana antes de 1960.\n\n' +
      'Manolo ha decidido que este año tendrá caseta propia: "Caseta Boomerez", con rebujito, sobaos y una foto suya de dos metros en la entrada. El único problema es la lista de espera para conseguir una: once años.',
    weight: (s) => (at(s, 'sevilla') && moy(s) === 2 ? 3.5 : 0),
    forced: true, // fiesta del calendario: sale en su mes si tienes negocio en la ciudad
    cooldown: 24,
    choices: [
      {
        label: 'Ir de invitado a la caseta de un proveedor y portarte bien',
        effect(s) {
          addRep(s, 3);
          addFama(s, 2);
          return 'Te pones un traje que no es de tu talla, bailas media sevillana y, por una vez, escuchas más de lo que hablas. Un comerciante de toda la vida te encarga sobaos para su caseta del año que viene. Reputación +3, fama +2.';
        },
      },
      {
        label: 'Subarrendar una caseta "por detrás" (15.000 €)',
        hint: '40 %: el titular no sabía nada.',
        effect(s) {
          addCash(s, -15000);
          if (chance(s, 0.6)) {
            addFama(s, 8);
            cityMod(s, 'sevilla', 1.15, 1, 'Caseta Boomerez');
            return 'Durante una semana, la "Caseta Boomerez" es la más comentada del real: farolillos, rebujito y tu foto de dos metros. Pagas 15.000 €. Fama +8 e ingresos en Sevilla +15 % en abril.';
          }
          addFama(s, 3);
          addRep(s, -5);
          return 'La primera noche aparece el titular de la caseta con su familia, su abogado y sus trajes de flamenca. Te desalojan entre palmas por bulerías, y el vídeo recorre Sevilla entera. Pagas 15.000 €. Fama +3, reputación −5.';
        },
      },
      {
        label: 'Montar un puesto ambulante de sobaos a la puerta del real',
        hint: '30 %: la policía local también va a la Feria.',
        effect(s) {
          cityMod(s, 'sevilla', 1.12, 1, 'Sobaos de Feria');
          if (chance(s, 0.3)) {
            fine(s, 3000);
            addRep(s, -2);
            return 'Vendes sobaos a los que salen de madrugada hasta que la policía local te pide la licencia de venta ambulante, que no tienes. Multa de 3.000 €. Ingresos en Sevilla +12 % en abril, reputación −2.';
          }
          return 'Los sobaos resultan ser el desayuno perfecto para los que salen del real a las siete de la mañana. Ingresos en Sevilla +12 % en abril.';
        },
      },
      {
        label: 'Declarar en la radio que "la Feria está sobrevalorada"',
        effect(s) {
          addRep(s, -8);
          addFama(s, 5);
          cityMod(s, 'sevilla', 0.9, 1, 'Boicot sevillano');
          return 'Lo dices en una emisora sevillana, en directo y en plena semana de Feria. Durante un mes, en tu negocio de Sevilla solo entran turistas despistados. Reputación −8, fama +5 e ingresos en Sevilla −10 % en abril.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Marbella
  {
    id: 'ciudad_marbella',
    title: 'El cumpleaños del Barón',
    portrait: 'portrait_inversor_misterioso', image: 'ev_ciudad_marbella',
    text: (s) =>
      'Verano en Marbella. Un millonario de fortuna difusa, al que en el puerto deportivo todos llaman "el Barón", celebra su cumpleaños en un yate de sesenta metros. Su relaciones públicas ha probado tus sobaos y quiere dos mil para la fiesta, servidos en bandejas doradas.\n\n' +
      `Pagaría "a noventa días, como hacen los ricos". Y a bordo habrá gente que sale en las revistas${s.flags.divorciado ? ', y a ti, divorciado y con ático nuevo, no te vendría mal salir en alguna' : ', algo que a Merche le interesa bastante más que los sobaos'}.`,
    weight: (s) => (at(s, 'marbella') && [5, 6].includes(moy(s)) ? 2.5 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'Servir el pedido, pero cobrando por adelantado',
        effect(s) {
          addCash(s, 6000);
          return 'El Barón paga por adelantado sin pestañear: para él, 6.000 € son las propinas de un martes. Ganas 6.000 € y una foto con el capitán del yate, que es lo más parecido a un famoso que conoces.';
        },
      },
      {
        label: 'Servirlo gratis a cambio de una invitación a bordo (4.000 €)',
        hint: '50 %: te presentan a gente importante.',
        effect(s) {
          addCash(s, -4000);
          const casado = !s.flags.divorciado;
          if (chance(s, 0.5)) {
            addFama(s, 8);
            cityMod(s, 'marbella', 1.15, 2, 'Fiesta del Barón');
            if (casado) addFamilia(s, 4);
            return `Te sientan entre una presentadora de televisión y un torero retirado, y tus sobaos salen en todas las fotos de la fiesta.${casado ? ' Merche se hace un selfi con una actriz de telenovela y te perdona tres cenas.' : ''} Los sobaos te cuestan 4.000 €. Fama +8 e ingresos en Marbella +15 % durante 2 meses${casado ? ', familia +4' : ''}.`;
          }
          addFama(s, 2);
          if (casado) addFamilia(s, -3);
          return `Te dejan en la cubierta de abajo, con los camareros. El Barón te confunde con el repostero y te pide más hielo, dos veces.${casado ? ' Merche se vuelve a casa en taxi.' : ''} Los sobaos te cuestan 4.000 €. Fama +2${casado ? ', familia −3' : ''}.`;
        },
      },
      {
        label: 'Cobrarle más del doble "porque se nota que puede"',
        hint: 'El Barón no mira los precios. Su contable, sí.',
        effect(s) {
          if (chance(s, 0.6)) {
            addCash(s, 15000);
            return 'El contable del Barón paga sin rechistar y hasta te da las gracias por la factura, que encuentra "muy creativa". Ganas 15.000 €.';
          }
          addRep(s, -4);
          addFama(s, 2);
          cityMod(s, 'marbella', 0.9, 2, 'Fama de clavar');
          return 'El contable del Barón devuelve el presupuesto con una nota y lo cuenta en el club náutico. En una semana, medio puerto deportivo deja de pasar por tu negocio. No cobras nada. Ingresos en Marbella −10 % durante 2 meses, reputación −4, fama +2.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Bilbao
  {
    id: 'ciudad_bilbao',
    title: 'El examen del txoko',
    portrait: 'portrait_manolo_scared', image: 'ev_ciudad_bilbao',
    text: () =>
      'Koldo, tu proveedor de mantequilla en Bizkaia, te invita a cenar a su txoko: una sociedad gastronómica donde los socios cocinan para los socios desde hace setenta años. Es un honor enorme. También es un examen.\n\n' +
      'Alrededor de la mesa, ocho señores con jersey de lana y la mirada de quien lleva medio siglo juzgando bacalaos al pilpil. "Manolo, aquí el invitado trae el postre. Y lo hace él, delante de todos."',
    weight: (s) => (at(s, 'bilbao') ? 0.9 : 0),
    once: true,
    choices: [
      {
        label: 'Hacer los sobaos de la abuela, despacio y con mantequilla',
        effect(s) {
          addRep(s, 4);
          cityMod(s, 'bilbao', 1.1, 3, 'Bendición del txoko');
          return 'Te salen regulares, pero honrados. El socio más veterano, de noventa años, dice "no está mal, para ser de fuera", que en Bilbao es una ovación en pie. Al día siguiente lo sabe medio Bilbao. Reputación +4 e ingresos en Bilbao +10 % durante 3 meses.';
        },
      },
      {
        label: 'Llevar sobaos de la tienda y decir que los has hecho tú',
        hint: '70 %: aquí distinguen un sobao de ayer a ojo.',
        effect(s) {
          if (chance(s, 0.3)) {
            addRep(s, 2);
            return 'Cuela. Los socios asienten, mojan el sobao en el café y siguen hablando de bacalao. Koldo te guiña un ojo: él sí lo sabe, pero es tu proveedor. Reputación +2.';
          }
          addRep(s, -5);
          addFama(s, 2);
          cityMod(s, 'bilbao', 0.92, 2, 'Vergüenza en el txoko');
          return 'El socio más veterano huele el sobao, lo parte y anuncia el día y la hora a la que salió del horno: hace tres días. Se hace un silencio de catedral. Reputación −5, fama +2 e ingresos en Bilbao −8 % durante 2 meses.';
        },
      },
      {
        label: 'Presentar tu "sobao deconstruido con aire de sidra"',
        hint: '30 %: a los socios jóvenes les encanta.',
        effect(s) {
          if (chance(s, 0.3)) {
            addFama(s, 6);
            return 'Los socios mayores no lo tocan, pero los dos más jóvenes lo suben a las redes con la etiqueta "#VanguardiaPasiega". Lo comparten tres restaurantes con estrella. Fama +6.';
          }
          addRep(s, -4);
          addFama(s, 3);
          return 'La espuma de sidra se baja antes de llegar a la mesa y el sobao deconstruido parece un sobao que se ha caído al suelo. Le ponen nombre para siempre: "lo del pijo de Cantabria". Reputación −4, fama +3.';
        },
      },
      {
        label: 'Ofrecer comprar el txoko para montar un "gastro-coworking"',
        effect(s) {
          addRep(s, -8);
          addFama(s, 4);
          cityMod(s, 'bilbao', 0.88, 2, 'Vetado en el txoko');
          return 'Se hace el silencio. Te acompañan a la puerta, con mucha educación, con tu abrigo y el táper de los sobaos. La historia corre por todos los txokos de Bizkaia antes de que llegues al coche. Reputación −8, fama +4 e ingresos en Bilbao −12 % durante 2 meses.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Barcelona
  {
    id: 'ciudad_barcelona',
    title: 'Pistolas de agua',
    portrait: 'portrait_vecina', image: 'ev_ciudad_barcelona',
    text: (s) =>
      'Verano en Barcelona. Una asamblea vecinal contra la saturación turística recorre tu barrio con pancartas, silbatos y pistolas de agua. Se paran justo delante de tu negocio: en el escaparate cuelga tu cartel nuevo, "Barcelona Experience by Boomerez", y la cola de cruceristas llega a la esquina.' +
      `${at(s, 'barcelona', ['airbnb']) ? ' Dos portales más allá, los balcones de tus apartamentos de "Casa Manolo" están llenos de toallas de playa.' : ''}\n\n` +
      'Una vecina de setenta años, con la pistola de agua cargada, pregunta quién es el responsable.',
    weight: (s) => (at(s, 'barcelona', FOOD) && [4, 5, 6, 7].includes(moy(s)) ? 1.5 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'Salir a hablar, aguantar el remojón y quitar el cartel',
        effect(s) {
          addRep(s, 4);
          cityMod(s, 'barcelona', 0.95, 1, 'Menos cruceristas');
          return 'Te llevas un chorro en la camisa y otro en las gafas de sol. Escuchas veinte minutos sobre alquileres, sin interrumpir. Quitas el cartel y pones uno que dice "Botiga de barri". La vecina te da una palmadita en el brazo mojado. Reputación +4, ingresos en Barcelona −5 % este mes.';
        },
      },
      {
        label: 'Repartir sobaos gratis entre los manifestantes (1.500 €)',
        hint: '50 %: un sobao no arregla un alquiler.',
        effect(s) {
          addCash(s, -1500);
          if (chance(s, 0.5)) {
            addRep(s, 3);
            return 'Aceptan los sobaos, te dan las gracias en catalán y en castellano y siguen la marcha. Alguien escribe en la pancarta "Manolo, almenys, convida". Pagas 1.500 €. Reputación +3.';
          }
          addRep(s, -2);
          return 'Te los devuelven, mojados. "No queremos sobaos: queremos poder vivir en el barrio." Pagas 1.500 €. Reputación −2.';
        },
      },
      {
        label: 'Vender a los turistas un "tour de la protesta" (25 € por cabeza)',
        hint: 'Turismo de manifestación. Nadie lo había pensado porque es horrible.',
        effect(s) {
          addCash(s, 6000);
          addRep(s, -7);
          addFama(s, 5);
          if (chance(s, 0.4)) {
            addHeatHacienda(s, 5);
            return 'Los turistas pagan por seguir la marcha con chubasquero y sacar fotos. Ingresas 6.000 € en efectivo, sin factura y sin licencia de guía. Los vecinos te ven con la banderita al frente del grupo. Reputación −7, fama +5, radar de Hacienda +5.';
          }
          return 'Los turistas pagan por seguir la marcha con chubasquero y sacar fotos. Ingresas 6.000 €. Los vecinos te ven con la banderita al frente del grupo y te dedican un cántico nuevo. Reputación −7, fama +5.';
        },
      },
      {
        label: 'Llamar a la policía municipal',
        effect(s) {
          addRep(s, -6);
          addFama(s, 3);
          return 'Llegan dos agentes, comprueban que las pistolas son de agua y se toman un café. La foto de la vecina empapando tu cartel abre todos los digitales. Reputación −6, fama +3.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Madrid
  {
    id: 'ciudad_madrid',
    title: 'La Pantera no tiene etiqueta',
    portrait: 'portrait_gestor_paco', image: 'ev_ciudad_madrid',
    text: () =>
      'Madrid amplía su zona de bajas emisiones: desde el lunes, los vehículos sin etiqueta ambiental no pueden entrar en el centro. La furgoneta de reparto de Boomerez es una diésel de 2004 con 640.000 kilómetros, la que compró tu padre y que tú llamas cariñosamente "la Pantera".\n\n' +
      'Paco ya ha hecho la cuenta de las multas: "Manolo, a este ritmo la Pantera te va a salir más cara que un piso en el centro. Y ya es decir."',
    weight: (s) => (at(s, 'madrid') && s.month >= 6 ? 0.9 : 0),
    once: true,
    choices: [
      {
        label: 'Comprar una furgoneta eléctrica (28.000 €)',
        effect(s) {
          addCash(s, -28000);
          addRep(s, 3);
          addFama(s, 1);
          return 'La Pantera se jubila en Selaya, donde tu madre la usa para ir a misa a veinte por hora. La furgoneta nueva no hace ruido y la plantilla de Madrid te lo agradece cada mañana. Pagas 28.000 €. Reputación +3, fama +1.';
        },
      },
      {
        label: 'Contratar a un repartidor en bici de carga (900 €/mes durante un año)',
        effect(s) {
          addMonthlyCost(s, 'Reparto en bici de carga por Madrid', 900, 12);
          addRep(s, 2);
          cityMod(s, 'madrid', 1.04, 6, 'Reparto en bici');
          return 'Contratas a Rubén, repartidor con contrato y piernas de ciclista profesional, que cruza el centro con ochenta cajas de sobaos y llega antes que cualquier furgoneta. Cuesta 900 € al mes durante un año. Reputación +2 e ingresos en Madrid +4 % durante 6 meses.';
        },
      },
      {
        label: 'Seguir entrando con la Pantera "porque nadie mira"',
        hint: '"Las cámaras no leen matrículas de pueblo", según Kevin.',
        effect(s) {
          if (chance(s, 0.5)) {
            return 'Durante un mes, no llega nada. Kevin se siente un genio de la logística. Tú también. Paco, no: "Las multas llegan, Manolo. Es lo único que llega siempre."';
          }
          const c = int(s, 6, 12) * 1000;
          fine(s, c);
          addRep(s, -3);
          return `Llegan todas las multas a la vez, en un sobre que pesa como un sobao de kilo. Y la Pantera sale en un reportaje sobre la contaminación: "El último dinosaurio del centro". Pagas ${money(c)}. Reputación −3.`;
        },
      },
      {
        label: 'Pegarle una etiqueta ambiental hecha por Kevin',
        hint: '30 %: de lejos da el pego.',
        effect(s) {
          if (chance(s, 0.3)) {
            return 'Cuela. De lejos, la pegatina de Kevin parece oficial. De cerca, es la de un melón de la frutería, pintada con rotulador verde. De momento, nadie se acerca.';
          }
          fine(s, 9000);
          addRep(s, -4);
          addFama(s, 3);
          return 'Un agente de movilidad se acerca, mira la pegatina, mira a Kevin y saca la libreta. Multa de 9.000 € por manipular el distintivo. La foto de la Pantera con su etiqueta de melón se hace viral. Reputación −4, fama +3.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Palma
  {
    id: 'ciudad_palma',
    title: 'Siete cruceros un martes',
    portrait: 'portrait_comercial', image: 'ev_ciudad_palma',
    text: () =>
      'Récord en el puerto de Palma: siete cruceros atracan el mismo martes y desembarcan veinticinco mil personas con pulsera de todo incluido y cuatro horas libres. La naviera "Cruceros Brisa Azul" te propone meter tu negocio en su excursión "Palma auténtica", con una parada de diez minutos en tu local.\n\n' +
      'A cambio, quieren un 35 % de comisión sobre todo lo que gaste cada pasajero. Los vecinos del casco antiguo, que los martes no pueden ni salir del portal, también tienen una propuesta para ti.',
    weight: (s) => (at(s, 'palma', FOOD) && [3, 4, 5, 6, 7, 8].includes(moy(s)) ? 1.2 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'Quedarte con la clientela de siempre',
        effect(s) {
          addRep(s, 3);
          return 'Sigues sirviendo a los vecinos, a los repartidores y a algún turista despistado que entra por casualidad. La panadera de enfrente te saluda por primera vez. Reputación +3.';
        },
      },
      {
        label: 'Entrar en la excursión de la naviera',
        effect(s) {
          cityMod(s, 'palma', 1.2, 3, 'Cruceristas');
          addRep(s, -3);
          addMoral(s, -2);
          return 'Tu local se llena tres veces al día de golpe y se vacía a los diez minutos, como una marea con riñonera. Ingresos en Palma +20 % durante 3 meses, después de comisiones. Los vecinos ya no entran. Reputación −3, moral −2.';
        },
      },
      {
        label: 'Subir los precios los días de crucero ("tarifa dinámica")',
        hint: '¿Quién va a volver para quejarse?',
        effect(s) {
          cityMod(s, 'palma', 1.15, 2, 'Tarifa dinámica');
          if (chance(s, 0.4)) {
            addRep(s, -6);
            addFama(s, 3);
            return 'Un crucerista fotografía las dos pizarras, la del lunes y la del martes, y la reseña sale traducida a cinco idiomas: "El sobao más caro del Mediterráneo". Ingresos en Palma +15 % durante 2 meses. Reputación −6, fama +3.';
          }
          addRep(s, -2);
          return 'Los cruceristas pagan sin mirar, con el reloj en la mano. Los vecinos sí miran, y se cambian de acera. Ingresos en Palma +15 % durante 2 meses, reputación −2.';
        },
      },
      {
        label: 'Firmar el manifiesto vecinal contra los cruceros',
        effect(s) {
          addRep(s, 5);
          addFama(s, 2);
          cityMod(s, 'palma', 0.93, 2, 'Fuera de los folletos');
          return 'Las navieras te borran de todos sus folletos en una mañana. Los vecinos, en cambio, te traen ensaimadas y te presentan a sus primos. Reputación +5, fama +2 e ingresos en Palma −7 % durante 2 meses.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Zaragoza
  {
    id: 'ciudad_zaragoza',
    title: 'Tu madre, en la Ofrenda',
    portrait: 'portrait_madre', image: 'ev_ciudad_zaragoza',
    text: () =>
      'Octubre en Zaragoza: fiestas del Pilar. Tu madre ha decidido que este año desfilará en la Ofrenda de Flores, vestida de baturra y con un ramo de claveles "como Dios manda". Ya tiene el traje, el pañuelo y una amiga zaragozana de la parroquia que la espera en la estación.\n\n' +
      'Tu negocio de Zaragoza, mientras tanto, queda en plena ruta de la Ofrenda: doscientas mil personas pasarán por delante. Y el cierzo sopla a ochenta kilómetros por hora.',
    weight: (s) => (at(s, 'zaragoza') && moy(s) === 8 ? 3.5 : 0),
    forced: true, // fiesta del calendario: sale en su mes si tienes negocio en la ciudad
    cooldown: 24,
    choices: [
      {
        label: 'Acompañar a tu madre en la Ofrenda, vestido de baturro',
        effect(s) {
          addFamilia(s, 6);
          addFama(s, 2);
          return 'Desfilas con cachirulo y faja, sujetando a tu madre con un brazo y el ramo con el otro. En la plaza, el cierzo te arranca el cachirulo y lo manda hacia el Ebro. Tu madre sale en la tele autonómica; tú, de espaldas, persiguiendo un pañuelo. Familia +6, fama +2.';
        },
      },
      {
        label: 'Abrir todo el día durante las fiestas, con turnos pagados (2.500 €)',
        effect(s) {
          addCash(s, -2500);
          cityMod(s, 'zaragoza', 1.15, 1, 'Fiestas del Pilar');
          addMoral(s, 1);
          return 'Organizas turnos, pagas los festivos y pones una mesa de sobaos en la puerta para los que vuelven de la Ofrenda. Pagas 2.500 € en turnos extra. Ingresos en Zaragoza +15 % en octubre, moral +1.';
        },
      },
      {
        label: 'Ofrecer un sobao de flores gigante con tu logo',
        hint: 'Publicidad en el sitio más visto de Aragón. ¿Qué podría salir mal?',
        effect(s) {
          addFama(s, 7);
          addRep(s, -4);
          addFamilia(s, -5);
          return 'Cuatro metros de claveles con forma de sobao y tu logo en el centro. Los organizadores lo colocan detrás de un manto de flores de verdad, donde solo se ve el logo. Tu madre finge no conocerte durante todo el desfile. Fama +7, reputación −4, familia −5.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Santander
  {
    id: 'ciudad_santander',
    title: 'Curso de verano: caso Boomerez',
    portrait: 'portrait_hija_vanessa', image: 'ev_ciudad_santander',
    text: () =>
      'Verano en Santander. En el palacio junto a la bahía se celebran los cursos de verano de la universidad, y este año uno se titula "Precariedad 4.0: el empresario hecho a sí mismo (con herencia)". El caso práctico del martes es, con nombre y apellidos, Boomerez S.L.\n\n' +
      'Vanessa se ha matriculado y te manda el programa con tres emojis de calavera. Y en Santander, donde el sobao es asunto de la tierra, el curso ya es la comidilla de todas las terrazas.',
    weight: (s) => (at(s, 'santander') && [5, 6].includes(moy(s)) && s.month >= 12 ? 2.5 : 0),
    once: true,
    choices: [
      {
        label: 'Asistir de oyente y tomar apuntes',
        effect(s) {
          addRep(s, 3);
          addFamilia(s, 3);
          return 'Te sientas en la última fila, con las gafas de sol puestas dentro del aula. Aguantas tres horas sin interrumpir, lo que Vanessa considera tu mayor logro empresarial. Al salir, el profesor te da la mano. Reputación +3, familia +3.';
        },
      },
      {
        label: 'Pedir el turno de réplica y dar tu propia ponencia',
        hint: '50 %: el auditorio te aplaude, por pura sorpresa.',
        effect(s) {
          addFama(s, 5);
          if (chance(s, 0.5)) {
            addRep(s, 2);
            return 'Defiendes tu empresa con datos de verdad, que te ha preparado Paco la noche antes. El auditorio no te da la razón, pero te aplaude por haber traído números. Fama +5, reputación +2.';
          }
          addRep(s, -5);
          addFamilia(s, -2);
          return 'Cuando dices "yo empecé desde abajo", el profesor proyecta en la pantalla el testamento de tu padre. Vanessa se tapa la cara con el programa. Fama +5, reputación −5, familia −2.';
        },
      },
      {
        label: 'Patrocinar el café de los descansos para "suavizar el tono" (5.000 €)',
        hint: '40 %: los profesores también leen las etiquetas.',
        effect(s) {
          addCash(s, -5000);
          if (chance(s, 0.6)) {
            addFama(s, 3);
            addRep(s, 1);
            return 'Durante una semana, cientos de universitarios toman café con sobaos Boomerez entre ponencia y ponencia. Algunos hasta repiten. Pagas 5.000 €. Fama +3, reputación +1.';
          }
          addFama(s, 4);
          addRep(s, -3);
          return 'El profesor coge una bolsita de azúcar con tu logo, la levanta ante el auditorio y la usa como ejemplo práctico de "lavado de imagen". Ovación. Pagas 5.000 €. Fama +4, reputación −3.';
        },
      },
      {
        label: 'Llamar al rector "como cántabro y como contribuyente"',
        effect(s) {
          addRep(s, -6);
          addFama(s, 4);
          addFamilia(s, -3);
          return 'El rector te pasa con su secretaria, la secretaria con el contestador y el contestador con Vanessa, que te pide por favor que no la vuelvas a avergonzar. Lo de "contribuyente", además, le hace mucha gracia a Paco. Reputación −6, fama +4, familia −3.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ A Coruña
  {
    id: 'ciudad_coruna',
    title: 'Cuarenta días de orballo',
    portrait: 'portrait_manolo_angry', image: 'ev_ciudad_coruna',
    text: () =>
      'A Coruña lleva cuarenta días seguidos de lluvia. No es una tormenta: es el orballo de siempre, que no moja pero empapa, con rachas de viento en el paseo marítimo que dan la vuelta a los paraguas. Brais, tu encargado, dice que es lo normal. Tú estás convencido de que es una conspiración meteorológica contra el sobao.\n\n' +
      'La buena noticia: con este tiempo apetece algo dulce y caliente. La mala: nadie sale de casa.',
    weight: (s) => (at(s, 'coruna', FOOD) && [9, 10, 11, 0, 1].includes(moy(s)) ? 1.2 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'Regalar un paraguas Boomerez con cada caja (2.000 €)',
        effect(s) {
          addCash(s, -2000);
          addRep(s, 2);
          cityMod(s, 'coruna', 1.1, 2, 'Paraguas Boomerez');
          return 'El viento del paseo se lleva la mitad de los paraguas al mar, pero la otra mitad se ve por toda la ciudad, abierta y con tu logo. Pagas 2.000 €. Ingresos en A Coruña +10 % durante 2 meses, reputación +2.';
        },
      },
      {
        label: 'Reparto a domicilio en furgoneta (600 €/mes durante 6 meses)',
        effect(s) {
          addMonthlyCost(s, 'Reparto a domicilio en A Coruña', 600, 6);
          cityMod(s, 'coruna', 1.15, 3, 'Sobaos a domicilio');
          return 'Brais organiza un reparto por barrios con una furgoneta de alquiler y una lona en el techo. Las señoras de Monte Alto ya no tienen que bajar a la calle. Cuesta 600 € al mes durante 6 meses. Ingresos en A Coruña +15 % durante 3 meses.';
        },
      },
      {
        label: 'Cobrar un "suplemento por climatología adversa"',
        hint: 'Si los taxis lo hacen...',
        effect(s) {
          cityMod(s, 'coruna', 1.08, 2, 'Suplemento de lluvia');
          addRep(s, -5);
          if (chance(s, 0.3)) {
            fine(s, 3000);
            return 'Una clienta jubilada, exfuncionaria de Consumo, fotografía el ticket y lo manda a quien corresponde. Multa de 3.000 €. Ingresos en A Coruña +8 % durante 2 meses, reputación −5.';
          }
          return 'Cobras 20 céntimos más "por lluvia". Los coruñeses pagan con cara de no haber visto nunca nada igual, y eso que han visto mucho. Ingresos en A Coruña +8 % durante 2 meses, reputación −5.';
        },
      },
      {
        label: 'Escribir al Gobierno para exigir que "haga algo con el tiempo"',
        effect(s) {
          addFama(s, 3);
          addRep(s, -2);
          return 'Un ministerio te contesta a los tres meses con un formulario de once páginas. Lo lees en la radio local como prueba de "la desidia del Estado". En A Coruña no se lo toman como tú esperabas. Fama +3, reputación −2.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Valladolid
  {
    id: 'ciudad_valladolid',
    title: 'Niebla, helada y funcionarios',
    portrait: 'portrait_manolo_scared', image: 'ev_ciudad_valladolid',
    text: () =>
      'Invierno en Valladolid: nueve días de niebla del Pisuerga, cuatro bajo cero a mediodía y unas aceras que parecen pistas de patinaje. Aun así, a las diez y media en punto, los funcionarios de la delegación de Hacienda de enfrente bajan a desayunar a tu local. Siempre los mismos dieciocho, siempre café con leche y algo dulce.\n\n' +
      'Hoy la calefacción está estropeada, la plantilla atiende con guantes de lana y los dieciocho funcionarios miran el termómetro de la pared como quien mira una factura sin IVA.',
    weight: (s) => (at(s, 'valladolid', FOOD) && [10, 11, 0].includes(moy(s)) ? 1.5 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'Arreglar la calefacción hoy mismo (3.500 €)',
        effect(s) {
          addCash(s, -3500);
          addMoral(s, 4);
          addRep(s, 1);
          return 'El técnico llega en dos horas y cobra como si hubiera venido andando desde Burgos. A las diez y media, los funcionarios desayunan sin abrigo por primera vez en una semana. Pagas 3.500 €. Moral +4, reputación +1.';
        },
      },
      {
        label: 'Lanzar el "Desayuno Funcionario": café, sobao y caldo caliente (1.500 €)',
        effect(s) {
          addCash(s, -1500);
          cityMod(s, 'valladolid', 1.12, 2, 'Desayuno Funcionario');
          return 'Arreglas la calefacción de aquella manera (el caldo hay que calentarlo en algún sitio) y pones el menú en una pizarra. Los dieciocho de siempre se convierten en cuarenta. Pagas 1.500 €. Ingresos en Valladolid +12 % durante 2 meses.';
        },
      },
      {
        label: '"El frío espabila": esperar a la primavera',
        hint: 'El que aguanta, gana. O no.',
        effect(s) {
          addMoral(s, -6);
          addHeatTrabajo(s, 6);
          if (chance(s, 0.4)) {
            addHeatHacienda(s, 5);
            cityMod(s, 'valladolid', 0.9, 2, 'Desbandada funcionarial');
            return 'Dos dependientas cogen la baja por un catarro de los que hacen historia y los funcionarios se mudan a la cafetería de al lado. Uno de ellos, ya puesto, se acuerda de tu nombre en el trabajo. Moral −6, radar de Inspección +6, radar de Hacienda +5 e ingresos en Valladolid −10 % durante 2 meses.';
          }
          return 'La plantilla aguanta el invierno con dos jerséis y mucha dignidad. Los funcionarios, también, pero se lo comentan entre ellos. Moral −6, radar de Inspección +6.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Córdoba
  {
    id: 'ciudad_cordoba',
    title: 'El concurso de patios',
    portrait: 'portrait_vecina', image: 'ev_ciudad_cordoba',
    text: () =>
      'Mayo en Córdoba: los vecinos abren sus patios llenos de geranios y macetas azules, y media España hace cola para verlos. Doña Rafaela, la vecina de al lado de tu negocio, lleva cuarenta años cuidando trescientas macetas a mano, con una caña y un cubo, y ganó el concurso en 1998.\n\n' +
      'El patio trasero de tu local está lleno de cajas de cartón y de un compresor que ronca. A Manolo se le ha ocurrido una idea para el concurso de este año.',
    weight: (s) => (at(s, 'cordoba') && moy(s) === 3 ? 3.5 : 0),
    forced: true, // fiesta del calendario: sale en su mes si tienes negocio en la ciudad
    cooldown: 24,
    choices: [
      {
        label: 'Pedirle consejo a Doña Rafaela y plantar de verdad (2.500 €)',
        effect(s) {
          addCash(s, -2500);
          addRep(s, 4);
          cityMod(s, 'cordoba', 1.08, 1, 'Patio Boomerez');
          return 'Doña Rafaela te riñe durante una tarde entera y luego te regala esquejes. Tu patio no gana nada, pero la gente entra a verlo y sale con sobaos. Pagas 2.500 €. Reputación +4, ingresos en Córdoba +8 % en mayo.';
        },
      },
      {
        label: 'Llenarlo de geranios de plástico y presentarte al concurso',
        hint: '30 %: el jurado se ha dejado las gafas de cerca.',
        effect(s) {
          if (chance(s, 0.3)) {
            addFama(s, 5);
            cityMod(s, 'cordoba', 1.1, 1, 'Mención especial');
            return 'El jurado te da una mención especial a "la constancia en el riego". Doña Rafaela, que sí lleva gafas, no dice nada. Todavía. Fama +5, ingresos en Córdoba +10 % en mayo.';
          }
          addRep(s, -6);
          addFama(s, 3);
          return 'Un miembro del jurado riega una maceta para lucirse y el agua resbala por las hojas sin mojar nada. Te descalifican por "patio de atrezo" y Doña Rafaela lo cuenta en la radio. Reputación −6, fama +3.';
        },
      },
      {
        label: 'Cobrar 5 € por entrar al patio de Doña Rafaela a través de tu local',
        hint: 'Su patio, tu taquilla.',
        effect(s) {
          addCash(s, 4000);
          addRep(s, -8);
          if (chance(s, 0.4)) {
            fine(s, 2000);
            return 'Doña Rafaela tarda tres días en enterarse y treinta segundos en tapiar la puerta con macetas. Te denuncia la asociación de patios. Ingresas 4.000 € y pagas 2.000 € de multa. Reputación −8.';
          }
          return 'Durante una semana, cientos de turistas pagan 5 € por cruzar tu almacén para ver unas flores que no son tuyas. Ingresas 4.000 €. Cuando Doña Rafaela se entera, el barrio entero deja de saludarte. Reputación −8.';
        },
      },
      {
        label: 'Pagar el agua de los patios de toda la calle (5.000 €)',
        effect(s) {
          addCash(s, -5000);
          addRep(s, 6);
          addFama(s, 2);
          return 'Los vecinos colocan una placa pequeñita junto a la fuente: "Agua cortesía de un señor de Cantabria". Doña Rafaela te invita a un salmorejo. Pagas 5.000 €. Reputación +6, fama +2.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Toledo
  {
    id: 'ciudad_toledo',
    title: 'Los turistas de un día',
    portrait: 'portrait_manolo_thinking', image: 'ev_ciudad_toledo',
    text: () =>
      'Toledo recibe cada mañana decenas de autobuses de turistas que llegan a las diez, ven la catedral, compran mazapán y se marchan a las cuatro sin haber pisado un solo comercio que no venda espadas. Julián, un guía con un paraguas amarillo y treinta años de oficio, te hace una propuesta: llevar a sus grupos a tu local como "parada gastronómica".\n\n' +
      'Su comisión es razonable. Lo que no tiene claro es qué historia contar: "La de verdad no vende, Manolo. Necesito una leyenda."',
    weight: (s) => (at(s, 'toledo', FOOD) ? 0.9 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'Aceptar, pero con la historia verdadera',
        effect(s) {
          addRep(s, 2);
          cityMod(s, 'toledo', 1.1, 3, 'Parada gastronómica');
          return 'Julián cuenta la historia tal cual: un obrador de Selaya, una abuela, una receta y un señor de 55 años con gafas de sol. A los turistas les encanta igual. Ingresos en Toledo +10 % durante 3 meses, reputación +2.';
        },
      },
      {
        label: 'Aceptar, con la leyenda del "sobao de los reyes visigodos"',
        hint: '35 %: Toledo está lleno de historiadores.',
        effect(s) {
          cityMod(s, 'toledo', 1.15, 3, 'Leyenda visigoda');
          if (chance(s, 0.35)) {
            addRep(s, -5);
            addFama(s, 3);
            return 'Un catedrático jubilado desmonta la leyenda en el periódico local con siete notas a pie de página: los visigodos no tenían mantequilla pasiega ni horno eléctrico. Ingresos en Toledo +15 % durante 3 meses. Reputación −5, fama +3.';
          }
          addFama(s, 2);
          return 'Julián narra con voz grave cómo un rey visigodo cambió una corona por un sobao. Los turistas hacen fotos al sobao como si fuera una reliquia. Ingresos en Toledo +15 % durante 3 meses, fama +2.';
        },
      },
      {
        label: 'Lanzar el "mazapán de sobao"',
        hint: '40 %: los obradores de mazapán no se lo toman bien.',
        effect(s) {
          cityMod(s, 'toledo', 1.12, 2, 'Mazapán de sobao');
          if (chance(s, 0.4)) {
            addRep(s, -4);
            return 'Los obradores de mazapán de toda la vida lo consideran una declaración de guerra y lo dicen en la televisión regional, con mucha educación y muchos datos. Ingresos en Toledo +12 % durante 2 meses, reputación −4.';
          }
          addFama(s, 2);
          return 'Es un mazapán con forma de sobao, o un sobao con sabor a mazapán: nadie lo tiene claro, pero se vende. Ingresos en Toledo +12 % durante 2 meses, fama +2.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Tarragona
  {
    id: 'ciudad_tarragona',
    title: 'Legionarios a treinta y ocho grados',
    portrait: 'portrait_comercial', image: 'ev_ciudad_tarragona',
    text: () =>
      'El parque temático de la Costa Daurada, "Imperium Park" (montañas rusas romanas, gladiadores en chanclas y un Coliseo de fibra de vidrio), te ofrece un quiosco dentro del recinto para todo el verano: dos millones de visitantes, colas de cuarenta minutos y ni una sombra.\n\n' +
      'El director comercial pone una única condición: tu personal tiene que ir vestido de legionario romano. Con casco. A treinta y ocho grados.',
    weight: (s) => (at(s, 'tarragona') && [4, 5].includes(moy(s)) ? 2.5 : 0),
    once: true,
    choices: [
      {
        label: 'Rechazarlo con amabilidad y seguir con lo tuyo',
        effect(s) {
          addMoral(s, 3);
          return 'Le das las gracias al director y le regalas una caja de sobaos. La plantilla de Tarragona te lo agradece con un alivio que se nota desde Reus. Moral +3.';
        },
      },
      {
        label: 'Aceptar con túnicas ligeras y turnos cortos (5.000 €)',
        effect(s) {
          addCash(s, -5000);
          addMoral(s, 1);
          cityMod(s, 'tarragona', 1.2, 3, 'Quiosco en Imperium Park');
          return 'Negocias túnicas de lino, gorra en lugar de casco y turnos de cuatro horas con agua fría. El director refunfuña, pero firma. Pagas 5.000 € de montaje. Ingresos en Tarragona +20 % durante 3 meses, moral +1.';
        },
      },
      {
        label: 'Aceptar con armadura completa, "por la experiencia del cliente"',
        hint: '35 %: golpe de calor de un centurión.',
        effect(s) {
          cityMod(s, 'tarragona', 1.25, 3, 'Quiosco en Imperium Park');
          addMoral(s, -6);
          if (chance(s, 0.35)) {
            fine(s, 6000);
            addHeatTrabajo(s, 10);
            return 'Un legionario se desmaya en la cola de la montaña rusa y lo atienden los gladiadores, que llevan menos ropa. La Inspección viene a ver las armaduras: multa de 6.000 €. Ingresos en Tarragona +25 % durante 3 meses. Moral −6, radar de Inspección +10.';
          }
          addHeatTrabajo(s, 4);
          return 'La plantilla aguanta el verano dentro de una armadura de plástico que hierve al sol. Los niños les piden fotos; ellos les piden agua. Ingresos en Tarragona +25 % durante 3 meses. Moral −6, radar de Inspección +4.';
        },
      },
      {
        label: 'Disfrazarte tú de emperador y presidir el quiosco',
        effect(s) {
          addFama(s, 6);
          addRep(s, -2);
          return 'Pasas una tarde con corona de laurel y sábana morada, con el pulgar hacia arriba o hacia abajo según compren o no. Un niño te pregunta si eres el malo de la película. Su madre le dice que sí. Fama +6, reputación −2.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Almería
  {
    id: 'ciudad_almeria',
    title: 'Rodaje en el desierto',
    portrait: 'portrait_manolo_smug', image: 'ev_ciudad_almeria',
    text: () =>
      'En el desierto de Tabernas, a media hora de tu negocio, una productora rueda un wéstern de los de antes: polvo, duelos al sol y un poblado de madera que lleva sesenta años haciendo de Arizona. Necesitan catering para doscientas personas durante seis semanas, con el termómetro a cuarenta y dos grados.\n\n' +
      'También necesitan figurantes. La directora de casting te ha visto en un vídeo de las redes y dice que tienes "cara de cacique de película".',
    weight: (s) => (at(s, 'almeria') ? 0.9 : 0),
    once: true,
    choices: [
      {
        label: 'Servir el catering con sobaos de nevera y mucha agua',
        effect(s) {
          addCash(s, 9000);
          addRep(s, 2);
          return 'Sobaos fríos, fruta, agua a mares y una sombrilla para cada técnico. El equipo de rodaje te pone en los créditos como "Catering Boomerez, Selaya". Ganas 9.000 €. Reputación +2.';
        },
      },
      {
        label: 'Hacer de figurante: "el cacique del pueblo"',
        hint: '50 %: te dan una frase.',
        effect(s) {
          addFama(s, 4);
          if (chance(s, 0.5)) {
            addFama(s, 4);
            return 'Te dan una frase: "Este pueblo es mío." La dices con tanta convicción que el director la deja en el tráiler. Llevas tres meses repitiéndola en todas las cenas. Fama +8.';
          }
          addRep(s, -2);
          return 'Tu única escena consiste en caerte de un caballo de cartón al ver llegar al protagonista. Hacen falta veintidós tomas. La número nueve acaba en las redes. Fama +4, reputación −2.';
        },
      },
      {
        label: 'Hacer el catering con sobaos "de ayer" para ahorrar',
        hint: 'Con cuarenta y dos grados, "de ayer" es mucho decir.',
        effect(s) {
          addCash(s, 14000);
          if (chance(s, 0.4)) {
            fine(s, 8000);
            addRep(s, -6);
            return 'A la segunda semana, medio equipo técnico se pasa la mañana haciendo cola en los baños del poblado. Se para el rodaje y llega Sanidad. Ingresas 14.000 € y pagas 8.000 € de multa. Reputación −6.';
          }
          return 'Nadie dice nada: con el calor que hace, todo sabe a polvo. Ingresas 14.000 €. La directora de producción te mira de una manera que no te gusta.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Las Palmas
  {
    id: 'ciudad_laspalmas',
    title: 'La murga canta sobre ti',
    portrait: 'portrait_manolo_happy', image: 'ev_ciudad_laspalmas',
    text: () =>
      'Febrero en Las Palmas de Gran Canaria: carnaval. Durante tres semanas la ciudad entera se disfraza, hay murgas en cada plaza y la gran gala llena el parque hasta la madrugada. Tu plantilla canaria quiere cerrar el martes de carnaval, "como todo el mundo".\n\n' +
      'Además, una murga del barrio ha compuesto una canción sobre ti: "El sobao que vino en avión (y llegó aplastao)". Va por la tercera estrofa y ya es la más coreada del carnaval.',
    weight: (s) => (at(s, 'laspalmas') && moy(s) === 0 ? 3.5 : 0),
    forced: true, // fiesta del calendario: sale en su mes si tienes negocio en la ciudad
    cooldown: 24,
    choices: [
      {
        label: 'Cerrar el martes de carnaval y disfrazarte con la plantilla',
        effect(s) {
          addMoral(s, 5);
          addFama(s, 2);
          cityMod(s, 'laspalmas', 0.95, 1, 'Martes de carnaval');
          return 'Te disfrazas de sobao gigante y sales con la plantilla al desfile. La murga te ve, te señala y canta la tercera estrofa mirándote a los ojos. Tú la cantas con ellos. Moral +5, fama +2, ingresos en Las Palmas −5 % en febrero.';
        },
      },
      {
        label: 'Patrocinar a la murga a cambio de cambiar la letra (4.000 €)',
        hint: '50 %: las murgas son muy suyas.',
        effect(s) {
          addCash(s, -4000);
          if (chance(s, 0.5)) {
            addFama(s, 4);
            addRep(s, 2);
            return 'La murga acepta y estrena "El sobao que vino en avión (y conquistó el corazón)". Rima peor, pero suena en todas las guaguas. Pagas 4.000 €. Fama +4, reputación +2.';
          }
          addFama(s, 6);
          addRep(s, -4);
          return 'La murga acepta el dinero y añade una cuarta estrofa: "Nos quiso comprar la letra / con dinero de la caja B". Es la más coreada del carnaval. Pagas 4.000 €. Fama +6, reputación −4.';
        },
      },
      {
        label: 'Abrir 24 horas para el gentío con "sobao de carnaval" a 4 €',
        hint: 'Tres semanas de fiesta, tres semanas de turnos.',
        effect(s) {
          cityMod(s, 'laspalmas', 1.2, 1, 'Sobao de carnaval');
          addMoral(s, -5);
          addHeatTrabajo(s, 4);
          return 'El local no cierra ni de día ni de noche, y la plantilla trabaja disfrazada, por si acaso. Ingresos en Las Palmas +20 % en febrero. Moral −5, radar de Inspección +4.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Granada
  {
    id: 'ciudad_granada',
    title: '¿Y la tapa?',
    portrait: 'portrait_manolo_thinking', image: 'ev_ciudad_granada',
    text: () =>
      'En Granada, con cada caña te ponen una tapa gratis: una tortilla, unas migas, a veces un plato de cuchara. Los granadinos lo consideran un derecho fundamental, como el aire o la sombra en agosto.\n\n' +
      'Tu local cobra todo aparte y la clientela no lo entiende. Una señora te lo explica con mucha paciencia: "Mire usted, si yo pido un café, usted me pone algo. Si no, ¿a qué vengo?"',
    weight: (s) => (at(s, 'granada', FOOD) ? 0.9 : 0),
    cooldown: 24,
    choices: [
      {
        label: 'Poner un minisobao gratis con cada café (1.200 €/mes durante 6 meses)',
        effect(s) {
          addMonthlyCost(s, 'Minisobao de cortesía en Granada', 1200, 6);
          addRep(s, 3);
          cityMod(s, 'granada', 1.15, 6, 'Tapa de sobao');
          return 'El minisobao de cortesía es un éxito: la señora vuelve cada mañana con dos amigas. Cuesta 1.200 € al mes durante 6 meses. Ingresos en Granada +15 % durante 6 meses, reputación +3.';
        },
      },
      {
        label: 'Poner tres cacahuetes y llamarlo "tapa de autor"',
        hint: '40 %: cuela como concepto.',
        effect(s) {
          if (chance(s, 0.4)) {
            addFama(s, 3);
            return 'Un bloguero gastronómico lo descubre y lo celebra con ironía: "Minimalismo pasiego: tres cacahuetes que interpelan". Durante un mes, vienen a fotografiarlo. Fama +3.';
          }
          addRep(s, -5);
          cityMod(s, 'granada', 0.92, 2, 'Tapa de autor');
          return 'La señora mira los tres cacahuetes, te mira a ti y se va sin terminarse el café. Al día siguiente lo sabe todo el barrio. Reputación −5, ingresos en Granada −8 % durante 2 meses.';
        },
      },
      {
        label: 'Tapa gratis, pero subir el café a 3,50 €',
        hint: 'Lo gratis también se puede facturar.',
        effect(s) {
          cityMod(s, 'granada', 1.08, 3, 'Café con tapa');
          addRep(s, -3);
          return 'Pones tapa, sí, y subes el café un euro. Los granadinos hacen la cuenta en dos segundos, pero el sitio es bonito. Ingresos en Granada +8 % durante 3 meses, reputación −3.';
        },
      },
      {
        label: 'Colgar un cartel: "Lo gratis no existe. Emprende."',
        effect(s) {
          addRep(s, -4);
          addFama(s, 2);
          cityMod(s, 'granada', 0.9, 2, 'Cartel de Manolo');
          return 'El cartel sale en todos los grupos del barrio y alguien lo corrige a rotulador: "Lo gratis no existe. Emprende. Y pon tapa." Reputación −4, fama +2, ingresos en Granada −10 % durante 2 meses.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Murcia
  {
    id: 'ciudad_murcia',
    title: 'El Sobajote',
    portrait: 'portrait_manolo_smug', image: 'ev_ciudad_murcia',
    text: () =>
      'Murcia celebra el Bando de la Huerta: la ciudad entera sale a la calle vestida de huertano, con zaragüelles, refajos y alpargatas, y en cada barraca hay michirones, zarangollo y paparajotes. El paparajote, para quien no lo sepa, es una hoja de limonero rebozada y frita: se come la masa y la hoja se deja en el plato.\n\n' +
      'Manolo ha tenido una idea que considera "la fusión del siglo": el Sobajote. Las vecinas de la huerta, por su parte, le ofrecen montar una barraca juntos.',
    weight: (s) => (at(s, 'murcia') && moy(s) === 2 ? 3.5 : 0),
    forced: true, // fiesta del calendario: sale en su mes si tienes negocio en la ciudad
    cooldown: 24,
    choices: [
      {
        label: 'Olvidar el Sobajote y montar la barraca con las vecinas (3.000 €)',
        effect(s) {
          addCash(s, -3000);
          addRep(s, 4);
          cityMod(s, 'murcia', 1.08, 1, 'Barraca del Bando');
          return 'Las vecinas fríen paparajotes de verdad; tú pones los sobaos, y cada cosa en su plato. Te enseñan a doblar el pañuelo de huertano y casi te sale. Pagas 3.000 €. Reputación +4, ingresos en Murcia +8 % en abril.';
        },
      },
      {
        label: 'Lanzar el Sobajote: sobao rebozado con hoja de limonero',
        hint: '50 %: los turistas no saben que la hoja no se come.',
        effect(s) {
          cityMod(s, 'murcia', 1.12, 1, 'Sobajote');
          addFama(s, 4);
          if (chance(s, 0.5)) {
            addRep(s, -3);
            return 'Un turista se come el Sobajote entero, con hoja, y escribe una reseña de una estrella: "Sabe a jardín". La reseña se hace famosa en toda la Región. Ingresos en Murcia +12 % en abril. Fama +4, reputación −3.';
          }
          addRep(s, 1);
          return 'Contra todo pronóstico, gusta. Los murcianos lo prueban por curiosidad y repiten por educación. Ingresos en Murcia +12 % en abril. Fama +4, reputación +1.';
        },
      },
      {
        label: 'Vestirte de huertano y repartir folletos en el desfile',
        effect(s) {
          addFama(s, 3);
          addRep(s, 1);
          return 'Te pones las alpargatas del revés y el pañuelo como un bandolero, pero repartes mil folletos con una sonrisa que da hasta ternura. Una abuela te recoloca la faja sin pedirte permiso. Fama +3, reputación +1.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Alicante
  {
    id: 'ciudad_alicante',
    title: 'El sobao sin nada',
    portrait: 'portrait_manolo_neutral', image: 'ev_ciudad_alicante',
    text: () =>
      'Ingrid, presidenta del Club de Residentes Internacionales de la Costa Blanca (setecientos jubilados del norte de Europa, con buena pensión, mucho tiempo libre y una hoja de cálculo para cada cosa), se presenta en tu local con una propuesta por escrito en tres idiomas.\n\n' +
      'Sus socios quieren un sobao sin azúcar, sin lactosa, sin gluten y "con menos sobao". A cambio, lo pedirán cada mañana con el café. Setecientas personas, todos los días del año.',
    weight: (s) => (at(s, 'alicante', FOOD) ? 0.9 : 0),
    once: true,
    choices: [
      {
        label: 'Desarrollar de verdad el sobao "Ligero Costa Blanca" (6.000 €)',
        effect(s) {
          addCash(s, -6000);
          addRep(s, 3);
          cityMod(s, 'alicante', 1.15, 6, 'Socios del club');
          return 'Las pasteleras del obrador hacen catorce pruebas. La primera sabe a esponja; la novena, a sobao. Ingrid la aprueba con un 7,5 en su hoja de cálculo, que en su escala es un sobresaliente. Pagas 6.000 €. Ingresos en Alicante +15 % durante 6 meses, reputación +3.';
        },
      },
      {
        label: 'Venderles el de siempre con una etiqueta que ponga "SIN"',
        hint: 'Ingrid fue ingeniera de control de calidad durante treinta años.',
        effect(s) {
          if (chance(s, 0.25)) {
            cityMod(s, 'alicante', 1.12, 3, 'Sobao "SIN"');
            return 'Durante tres meses, setecientos jubilados desayunan felices un sobao con todo. Alguno dice que nunca se había encontrado tan bien. Ingresos en Alicante +12 % durante 3 meses.';
          }
          fine(s, 8000);
          addRep(s, -7);
          return 'Ingrid manda un sobao a un laboratorio de su país y el informe vuelve en una semana, traducido y con gráficas. Consumo te multa con 8.000 € por etiquetado engañoso y el club te borra de su boletín. Reputación −7.';
        },
      },
      {
        label: 'Recomendarles una buena residencia de mayores, que es lo suyo',
        effect(s) {
          addRep(s, -4);
          addFama(s, 1);
          return 'Ingrid te mira por encima de las gafas: "Tenemos sesenta y ocho años, señor Boomerez, no noventa y ocho." El club organiza un torneo de petanca solo para comentar lo que les has dicho. Reputación −4, fama +1.';
        },
      },
      {
        label: '"Esto es España: aquí el sobao lleva azúcar"',
        effect(s) {
          addRep(s, -3);
          addFama(s, 2);
          cityMod(s, 'alicante', 0.95, 2, 'Club de residentes');
          return 'Ingrid toma nota en tres idiomas. Al día siguiente, el club desayuna en la cafetería de enfrente, que ha empezado a hacer magdalenas sin nada. Reputación −3, fama +2, ingresos en Alicante −5 % durante 2 meses.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Salamanca
  {
    id: 'ciudad_salamanca',
    title: 'Nochevieja Universitaria',
    portrait: 'portrait_becario', image: 'ev_ciudad_salamanca',
    text: () =>
      'Salamanca, mediados de diciembre. Miles de estudiantes celebran la Nochevieja Universitaria en la Plaza Mayor dos semanas antes de tiempo, porque en la Nochevieja de verdad estarán en sus pueblos. Hay campanadas, gominolas en lugar de uvas y un frío que corta el aliento.\n\n' +
      'Un grupo de estudiantes de Económicas te propone hacer las campanadas con doce minisobaos. Ya lo tienen calculado: si cada estudiante compra una bolsa a 2 €...',
    weight: (s) => (at(s, 'salamanca') && moy(s) === 10 ? 3.5 : 0),
    forced: true, // fiesta del calendario: sale en su mes si tienes negocio en la ciudad
    cooldown: 24,
    choices: [
      {
        label: 'Vender bolsas de doce minisobaos a 2 €',
        effect(s) {
          addFama(s, 3);
          cityMod(s, 'salamanca', 1.15, 1, 'Campanadas de sobao');
          return 'Los estudiantes de Económicas montan el puesto, cobran su parte y te mandan un análisis de márgenes en una servilleta. Diez mil estudiantes se comen doce minisobaos a la vez. Ingresos en Salamanca +15 % en diciembre, fama +3.';
        },
      },
      {
        label: 'Regalar las bolsas a cambio de que se graben con tu logo (3.000 €)',
        hint: '30 %: el "reto Boomerez" se te va de las manos.',
        effect(s) {
          addCash(s, -3000);
          if (chance(s, 0.3)) {
            addFama(s, 4);
            addRep(s, -3);
            return 'Alguien sube un vídeo comiéndose doce sobaos de tamaño normal en doce campanadas: nace el "reto Boomerez". Los médicos de urgencias piden en la radio que nadie lo imite. Pagas 3.000 €. Fama +4, reputación −3.';
          }
          addFama(s, 6);
          return 'Diez mil móviles graban las campanadas con tu logo al fondo. Durante una semana eres "el señor de los sobaos de Nochevieja". Pagas 3.000 €. Fama +6.';
        },
      },
      {
        label: 'Ofrecerles "prácticas" a cambio de repartir gratis',
        hint: 'Becarios de Nochevieja. ¿Qué podría salir mal?',
        effect(s) {
          cityMod(s, 'salamanca', 1.18, 1, 'Becarios de Nochevieja');
          addHeatTrabajo(s, 6);
          if (chance(s, 0.4)) {
            addRep(s, -5);
            return 'Los estudiantes reparten, pero uno de ellos es delegado de Derecho y cuelga el "convenio de prácticas" en el tablón de la facultad, subrayado en fosforito. Ingresos en Salamanca +18 % en diciembre. Radar de Inspección +6, reputación −5.';
          }
          return 'Reparten con muchas ganas y apuntándolo todo, porque la semana que viene tienen examen de Derecho del Trabajo. Ingresos en Salamanca +18 % en diciembre, radar de Inspección +6.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Oviedo
  {
    id: 'ciudad_oviedo',
    title: 'Carbayón contra sobao',
    portrait: 'portrait_presentadora', image: 'ev_ciudad_oviedo',
    text: () =>
      'La televisión autonómica de Asturias prepara un especial para la tarde: "Duelo en la frontera". Carbayón contra sobao pasiego. El carbayón (hojaldre, almendra, yema y un baño de azúcar) lo defiende Doña Covadonga, confitera de Oviedo con cincuenta años de oficio. El sobao, tú.\n\n' +
      'Un jurado de seis vecinos elegidos al azar en la calle dará el veredicto en directo. En Oviedo, la apuesta ya está seis a cero.',
    weight: (s) => (at(s, 'oviedo') ? 0.9 : 0),
    once: true,
    choices: [
      {
        label: 'Ir con humildad y reconocer que el carbayón es una maravilla',
        effect(s) {
          addRep(s, 4);
          cityMod(s, 'oviedo', 1.08, 3, 'Paz en la frontera');
          return 'Pierdes cuatro a dos, pero lo dices en directo: "El carbayón es una maravilla y Doña Covadonga, una artista." Ella te abraza y te da su tarjeta. Medio Oviedo se acerca a probar "el sobao del señor educado". Reputación +4, ingresos en Oviedo +8 % durante 3 meses.';
        },
      },
      {
        label: 'Ir a ganar: los sobaos de la abuela y Maripili de asesora',
        hint: '50 %: Maripili es tu mejor arma.',
        effect(s) {
          if (chance(s, 0.5)) {
            addFama(s, 6);
            cityMod(s, 'oviedo', 1.15, 3, 'Victoria en el duelo');
            return 'Maripili sale al plató, explica la receta mejor que tú y gana cuatro a dos. Doña Covadonga exige revancha para el año que viene. Fama +6, ingresos en Oviedo +15 % durante 3 meses.';
          }
          addFama(s, 3);
          addRep(s, 1);
          return 'Pierdes cinco a uno. El único voto a favor es de un señor de Reinosa que pasaba por allí. Maripili te consuela: "Por lo menos no has dicho ninguna tontería." Fama +3, reputación +1.';
        },
      },
      {
        label: 'Decir en directo que el carbayón "es un sobao que se ha caído en almendra"',
        effect(s) {
          addFama(s, 7);
          addRep(s, -7);
          cityMod(s, 'oviedo', 0.88, 3, 'Ofensa al carbayón');
          return 'Doña Covadonga no contesta: solo te mira. El jurado vota seis a cero y la audiencia del programa bate su récord. En tu negocio de Oviedo entran poco más que tus empleados. Fama +7, reputación −7, ingresos en Oviedo −12 % durante 3 meses.';
        },
      },
      {
        label: 'Proponer en directo una fusión: el "Carbasobao"',
        hint: '50 %: Doña Covadonga tiene sentido del humor.',
        effect(s) {
          addFama(s, 4);
          if (chance(s, 0.5)) {
            cityMod(s, 'oviedo', 1.12, 4, 'Carbasobao');
            return 'Doña Covadonga se ríe y acepta, con una condición: la receta es suya y lleva su nombre delante del tuyo. El Carbasobao Covadonga & Boomerez arrasa en Oviedo. Fama +4, ingresos en Oviedo +12 % durante 4 meses.';
          }
          addRep(s, -2);
          return 'Doña Covadonga contesta, muy despacio: "Antes cierro." El plató aplaude durante un minuto entero. Fama +4, reputación −2.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Vitoria-Gasteiz
  {
    id: 'ciudad_vitoria',
    title: 'El Distintivo Verde',
    portrait: 'portrait_inspector_sanidad', image: 'ev_ciudad_vitoria',
    text: () =>
      'Vitoria-Gasteiz, capital verde: un anillo de parques, bicis por todas partes y un ayuntamiento que concede el "Distintivo Verde Gasteiz" a los comercios sostenibles. Con él sales en la guía municipal, en los autobuses y en el mapa de los turistas.\n\n' +
      'Iñaki, el técnico municipal, ha hecho la auditoría con una tableta y una lista de cuarenta puntos. Tu local suspende en treinta y ocho: bandejas de plástico, luces encendidas toda la noche, la furgoneta en doble fila y un contenedor donde va todo junto.',
    weight: (s) => (at(s, 'vitoria') ? 0.9 : 0),
    cooldown: 30,
    choices: [
      {
        label: 'Hacer los deberes de verdad (8.000 €)',
        effect(s) {
          addCash(s, -8000);
          addRep(s, 5);
          cityMod(s, 'vitoria', 1.1, 6, 'Distintivo Verde');
          return 'Cambias las bandejas, pones temporizadores en las luces y aprendes, por fin, qué va en cada contenedor. Seis semanas después, Iñaki repasa los cuarenta puntos y te entrega el distintivo sin una sonrisa, que en él es entusiasmo. Pagas 8.000 €. Reputación +5 e ingresos en Vitoria +10 % durante 6 meses.';
        },
      },
      {
        label: 'Pintar la fachada de verde y poner una maceta en la puerta',
        hint: 'Lavado de imagen, en sentido literal.',
        effect(s) {
          addRep(s, -4);
          addFama(s, 3);
          return 'Iñaki fotografía la maceta (de plástico) y la fachada (verde pistacho) para la charla anual del ayuntamiento, en el apartado "Lo que no es sostenible". Te reconocen en toda Vitoria. Reputación −4, fama +3.';
        },
      },
      {
        label: 'Encargar un informe a una consultora de sostenibilidad (3.000 €)',
        hint: '50 %: la consultora es de tu cuñado.',
        effect(s) {
          addCash(s, -3000);
          if (chance(s, 0.5)) {
            cityMod(s, 'vitoria', 1.06, 4, 'Distintivo Verde (provisional)');
            return 'La consultora hace un trabajo serio y Iñaki te concede un distintivo provisional "a revisar en seis meses". Pagas 3.000 €. Ingresos en Vitoria +6 % durante 4 meses.';
          }
          addRep(s, -2);
          return 'La consultora resulta ser Jonathan, con una hoja verde en el logo y un informe de ochenta páginas sacado de internet. Iñaki lee el índice y te devuelve el informe. Pagas 3.000 €. Reputación −2.';
        },
      },
    ],
  },

  // ------------------------------------------------------------------ Selaya
  {
    id: 'ciudad_selaya',
    title: 'Selaya se vacía',
    portrait: 'portrait_alcalde', image: 'ev_ciudad_selaya',
    text: (s) =>
      'El alcalde de Selaya te para a la salida de misa con cara de funeral: la escuela del pueblo cerrará en septiembre si no llegan al menos cuatro niños más. Los jóvenes se van a Santander, a Madrid o a Berlín, y en el valle ya quedan más vacas que vecinos.\n\n' +
      `"Manolo, tu padre siempre decía que el obrador era del pueblo. Ahora tienes ${s.businesses.length > 1 ? `${s.businesses.length} negocios por toda España` : 'un imperio en marcha'}. ¿Vas a hacer algo por Selaya o solo por tu cuenta corriente?"`,
    // El obrador está siempre en Selaya: basta con que el imperio haya crecido un poco.
    weight: (s) => (s.month >= 18 && s.businesses.length >= 3 ? (at(s, 'selaya') ? 1.4 : 1) : 0),
    once: true,
    choices: [
      {
        label: 'Ofrecer trabajo fijo y vivienda a familias que vengan al valle (4.000 €/mes durante un año)',
        effect(s) {
          addMonthlyCost(s, 'Plan "Vuelve al valle"', 4000, 12);
          addRep(s, 6);
          addMoral(s, 4);
          addFamilia(s, 3);
          s.flags.selayaEscuela = 'familias';
          return 'Llegan tres familias de Santander y una de Valladolid, con cinco niños en total. La escuela no cierra y tu madre presume de hijo en la panadería. Cuesta 4.000 € al mes durante un año. Reputación +6, moral +4, familia +3.';
        },
      },
      {
        label: 'Patrocinar la escuela a cambio de ponerle tu nombre (20.000 €)',
        hint: 'Si hay que salvar la escuela, que se note quién la salva.',
        effect(s) {
          addCash(s, -20000);
          addFama(s, 6);
          addRep(s, 2);
          addFamilia(s, -2);
          s.flags.selayaEscuela = 'nombre';
          return 'La escuela se llamará "CEIP Manolo Boomerez". Tu madre te dice que tu padre le habría puesto el nombre de la abuela. Los niños, que siguen siendo pocos, te llaman "el señor del cartel". Pagas 20.000 €. Fama +6, reputación +2, familia −2.';
        },
      },
      {
        label: 'Pedir una subvención por despoblación "por estar en Selaya" (y no contratar a nadie)',
        hint: 'El dinero contra la despoblación, para quien no se despuebla.',
        effect(s) {
          addCash(s, 25000);
          addHeatHacienda(s, 10);
          s.flags.selayaEscuela = 'subvencion';
          if (chance(s, 0.35)) {
            fine(s, 30000);
            addRep(s, -6);
            return 'Cobras 25.000 € de ayudas al reto demográfico. A los seis meses, una auditoría comprueba que no has creado ni un empleo y te reclama la subvención con intereses: 30.000 €. La escuela cierra igual. Radar de Hacienda +10, reputación −6.';
          }
          addRep(s, -2);
          return 'Cobras 25.000 € de ayudas al reto demográfico por mantener el obrador donde ya estaba. La escuela cierra en septiembre y el alcalde ya no te saluda en misa. Radar de Hacienda +10, reputación −2.';
        },
      },
      {
        label: '"Los pueblos se vacían porque la gente no quiere trabajar"',
        effect(s) {
          addRep(s, -6);
          addFamilia(s, -4);
          addFama(s, 2);
          return 'Lo dices en la puerta de la iglesia, delante de media Selaya, incluida tu madre, que se fue a Bilbao a servir a los quince años. El silencio dura hasta la Navidad. Reputación −6, familia −4, fama +2.';
        },
      },
    ],
  },
];
