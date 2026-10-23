// Campañas de marketing y proyectos de I+D.

export const CAMPAIGNS = [
  { id: 'buzoneo', scope: 'city', name: 'Buzoneo de folletos', cost: 2500, months: 3, factor: 1.08,
    desc: 'Tu sobrino Kevin reparte 20.000 folletos. Tira la mitad en un contenedor.' },
  { id: 'vallas', scope: 'city', name: 'Vallas publicitarias', cost: 9000, months: 4, factor: 1.15,
    desc: 'La cara de Manolo, de 8 metros, sonriendo en la rotonda de entrada.' },
  { id: 'futbol', scope: 'city', name: 'Patrocinar al equipo de fútbol local', cost: 25000, months: 12, factor: 1.18, rep: 2,
    desc: 'Tu logo en la camiseta de un equipo de Tercera RFEF. Te dejan dar el saque de honor.' },
  { id: 'radio', scope: 'national', name: 'Cuña de radio con la voz de Manolo', cost: 12000, months: 3, factor: 1.04, fama: 3, rep: -1,
    desc: '"¡Sobaos Boomerez! ¡Los de toda la vida, pero con mentalidad de tiburón!" La grabó él mismo.' },
  { id: 'influencers', scope: 'national', name: 'Campaña con influencers', cost: 30000, months: 3, factor: 1.08, fama: 5,
    desc: 'Veinte influencers comiendo sobaos con cara de éxtasis. Tres de ellos dicen que son veganos.' },
  { id: 'tele', scope: 'national', name: 'Anuncio en la tele autonómica', cost: 70000, months: 6, factor: 1.12, rep: 3,
    desc: 'Un anuncio con prados, vacas, una abuela y música de violines. La abuela es actriz.' },
];

// effects: [{ category?, types?, factor, minWealth?, minPop?, months?: [meses 0-11] }]
export const PRODUCTS = [
  { id: 'relleno', name: 'Sobao relleno de crema', cost: 40000, months: 3,
    effects: [{ category: 'sobaos', factor: 1.08 }],
    desc: 'Ventas de sobaos +8 %. Tu padre se revolvería en la tumba, pero gusta.' },
  { id: 'quesada', name: 'Quesada pasiega', cost: 30000, months: 2,
    effects: [{ category: 'sobaos', factor: 1.05 }],
    desc: 'El otro clásico de los Valles. Ventas de sobaos +5 %.' },
  { id: 'sin_gluten', name: 'Sobao sin gluten (casi)', cost: 50000, months: 4,
    effects: [{ category: 'sobaos', factor: 1.12, minWealth: 1.1 }],
    desc: 'Ventas de sobaos +12 % en ciudades ricas. "Casi" sin gluten.' },
  { id: 'proteico', name: 'Sobao proteico "Gym Bro"', cost: 60000, months: 4,
    effects: [{ category: 'sobaos', factor: 1.1, minPop: 0.9 }, { types: ['gimnasio'], factor: 1.08 }], fama: 3,
    desc: '30 g de proteína y 600 kcal. Ventas de sobaos +10 % en ciudades grandes (y algo en los gimnasios).' },
  { id: 'caja_regalo', name: 'Caja regalo gourmet', cost: 25000, months: 2,
    effects: [{ category: 'sobaos', factor: 1.3, months: [10, 11] }],
    desc: 'Lazo dorado y papel de seda. Ventas de sobaos +30 % en noviembre y diciembre.' },
  { id: 'pasiega_smash', name: 'Smash con pan de sobao', cost: 35000, months: 2, requires: 'smash',
    effects: [{ types: ['smash'], factor: 1.12 }],
    desc: 'La aberración gastronómica que todos quieren probar. Smash Club +12 %.' },
  { id: 'empanada_cocido', name: 'Empanada de cocido montañés', cost: 30000, months: 2, requires: 'empanadas',
    effects: [{ types: ['empanadas'], factor: 1.1 }],
    desc: 'Fusión cántabro-argentina. Empanaderías +10 %.' },
  { id: 'pinchos', name: 'Carta de pinchos de autor', cost: 28000, months: 2, requires: 'taberna',
    effects: [{ types: ['taberna'], factor: 1.12 }],
    desc: 'Pinchos con espuma y nombres larguísimos. Tabernas +12 %.' },
  { id: 'app', name: 'App de fidelización "Boomerez Club"', cost: 90000, months: 5, hac: 4,
    effects: [{ factor: 1.05 }],
    desc: 'Puntos, cupones y la recogida de todos los datos de tus clientes. Todos los negocios +5 %.' },
  { id: 'merch', name: 'Merchandising de Manolo', cost: 20000, months: 1, requires: 'academy', fama: 4,
    effects: [{ types: ['academy'], factor: 1.2 }],
    desc: 'Tazas con su cara y la frase "Yo a tu edad ya tenía un Audi". Academy +20 %.' },
  { id: 'congelados', name: 'Línea de sobaos congelados', cost: 120000, months: 6, contract: { units: 6000, price: 1.9 },
    effects: [],
    desc: 'Un contrato fijo con supermercados: 6.000 unidades al mes a 1,90 €. Necesitarás capacidad en el obrador.' },
  { id: 'teleasistencia', name: 'Pulsera de teleasistencia "Golden"', cost: 45000, months: 3, requires: 'residencia',
    effects: [{ types: ['residencia'], factor: 1.1 }],
    desc: 'Una pulsera que avisa si el abuelo se cae. Y si sale sin pagar. Residencias +10 %.' },
];

export const UPGRADE_COST = [0.6, 1.0]; // coste de pasar a nivel 2 y a nivel 3 (fracción del coste del negocio)
export const MAX_LEVEL = 3;
export const LEVEL_BONUS = 0.15; // demanda extra por nivel
