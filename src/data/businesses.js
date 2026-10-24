// Tipos de negocio. Los números están equilibrados en src/core/economy.js; los textos son la sátira.

export const BUSINESS_TYPES = {
  express: {
    id: 'express', category: 'sobaos', brand: 'express',
    name: 'Sobaos Manolo Express', short: 'Express',
    cost: 30000, franchiseFee: 25000, staff: 2, rentBase: 1400,
    price: 3.2, unitCost: 1.05, wholesale: 1.6, baseUnits: 3800,
    sprite: 'bld_sobaos_express', color: '#e8a33a', letter: 'S',
    desc: 'Sobaos a precio de derribo. Mostrador, neón y un dependiente que también friega.',
  },
  maison: {
    id: 'maison', category: 'sobaos', brand: 'maison',
    name: 'Maison Boomerez', short: 'Maison',
    cost: 95000, franchiseFee: 60000, staff: 3, rentBase: 2600,
    price: 10, unitCost: 2.6, wholesale: 6.5, baseUnits: 1000,
    sprite: 'bld_sobaos_maison', color: '#7a4fa0', letter: 'M',
    desc: 'Pâtisserie pasiega "de autor". Mármol, luz cálida y sobaos en vitrina, como joyas.',
  },
  vivienda: {
    id: 'vivienda', category: 'inmobiliario',
    name: 'Viviendas para empleados', short: 'Viviendas',
    cost: 210000, staff: 0, upkeep: 700, beds: 10, realEstate: true,
    sprite: 'bld_vivienda', color: '#9a9183', letter: 'R',
    desc: 'Pisos para tu plantilla. El alquiler sale directamente de la nómina. Así nadie se va... ni se queja.',
  },
  airbnb: {
    id: 'airbnb', category: 'inmobiliario', license: 120000,
    name: 'Apartamentos Turísticos "Casa Manolo"', short: 'Casa Manolo',
    cost: 260000, staff: 1, upkeep: 1500, flats: 6, realEstate: true,
    sprite: 'bld_airbnb', color: '#2f8fc4', letter: 'A',
    desc: 'Seis pisos turísticos con candado de llaves en la farola. Los vecinos encantados.',
  },
  smash: {
    id: 'smash', category: 'hosteleria',
    name: 'Manolo Smash Club', short: 'Smash',
    cost: 110000, staff: 5, rentBase: 3000, baseRevenue: 24000, cogs: 0.33, trend: 'smash',
    model: 'service', food: true, popExp: 0.5, wealthExp: 0.4,
    sprite: 'bld_smash', color: '#d4402b', letter: 'B',
    desc: 'Hamburguesas aplastadas, luz de neón rosa y música que no te deja hablar. Mientras dure la moda.',
  },
  empanadas: {
    id: 'empanadas', category: 'hosteleria',
    name: 'Empanadas El Gaucho Pasiego', short: 'Empanadas',
    cost: 45000, staff: 3, rentBase: 1200, baseRevenue: 13000, cogs: 0.3, trend: 'empanadas',
    model: 'service', food: true, popExp: 0.5, wealthExp: 0.4,
    sprite: 'bld_empanadas', color: '#4a90c8', letter: 'E',
    desc: 'Empanadas argentinas "de toda la vida" (desde el martes). La de sobao con carne es "fusión".',
  },
  academy: {
    id: 'academy', category: 'formacion',
    name: 'Boomerez Business Academy', short: 'Academy',
    cost: 20000, staff: 1, rentBase: 800, ads: 1500, unique: true,
    sprite: 'bld_academy', color: '#1f2a44', letter: '€',
    desc: 'Cursos de "Mentalidad de Tiburón" a 997 €. Temario: tener un padre con obrador.',
  },
  taberna: {
    id: 'taberna', category: 'hosteleria',
    name: 'La Taberna del Emprendedor', short: 'Taberna',
    cost: 70000, staff: 4, rentBase: 1800, baseRevenue: 17000, cogs: 0.32,
    model: 'service', food: true, popExp: 0.5, wealthExp: 0.3, tourismW: 0.4, season: [0.9, 0.9, 1, 1.05, 1.05, 1.1, 1.15, 1.15, 1.05, 1, 0.95, 1.1],
    sprite: 'bld_taberna', color: '#8e5b2b', letter: 'T',
    desc: 'Tapas, cañas y una pizarra con frases de Manolo ("El que madruga, factura"). El alcalde come gratis.',
  },
  gimnasio: {
    id: 'gimnasio', category: 'servicios',
    name: 'Boomer Fit 24h', short: 'Gimnasio',
    cost: 250000, staff: 5, rentBase: 6000, baseRevenue: 17000, cogs: 0.06,
    model: 'service', popExp: 0.6, wealthExp: 0.1, season: [1.35, 1.15, 1.05, 1, 1, 0.95, 0.75, 0.7, 1.15, 1, 0.95, 0.85],
    sprite: 'bld_gimnasio', color: '#e67e22', letter: 'G',
    desc: 'Cuota de 19,90 €, máquinas de segunda mano y monitores "autónomos". En enero no cabe un alfiler; en agosto, tampoco el aire acondicionado.',
  },
  coworking: {
    id: 'coworking', category: 'servicios',
    name: 'Hustle Hub Coworking', short: 'Coworking',
    cost: 180000, staff: 2, rentBase: 4000, baseRevenue: 14000, cogs: 0.1,
    model: 'service', popExp: 0.6, wealthExp: 0.8, famaW: true,
    sprite: 'bld_coworking', color: '#16a085', letter: 'C',
    desc: 'Mesas compartidas, kombucha de barril y una sala llamada "Mindset". Cuanto más famoso es Manolo, más startups vienen.',
  },
  obrador_regional: {
    id: 'obrador_regional', category: 'produccion',
    name: 'Obrador regional Boomerez', short: 'Obrador regional',
    cost: 380000, staff: 8, upkeep: 3000, onePerCity: true,
    model: 'production',
    sprite: 'bld_obrador_regional', color: '#a0522d', letter: 'O',
    desc: '15.000 sobaos más al mes, fabricados cerca de tus tiendas: se ahorra transporte. "Artesanos" con casco y chaleco reflectante.',
  },
  residencia: {
    id: 'residencia', category: 'servicios',
    name: 'Residencia Golden Age Boomerez', short: 'Residencia',
    cost: 650000, staff: 22, upkeep: 7000, beds: 60, cogs: 0.16, realEstate: true,
    model: 'care',
    sprite: 'bld_residencia', color: '#b2bec3', letter: '♥',
    desc: 'Sesenta plazas para "seniors" con vistas al aparcamiento. Rentable si los números cuadran... y la plantilla aguanta.',
  },
  banca: {id:'banca',category:'finanzas',name:'Banco Boomerez',short:'Banco',cost:5000000,staff:18,rentBase:9000,baseRevenue:240000,cogs:0.14,model:'service',popExp:0.55,wealthExp:0.8,sprite:'bld_banco',color:'#315f7b',letter:'€',desc:'Crédito comercial y servicios de pago. Necesita I+D de licencia bancaria y una plantilla profesional.'},
  telecom: {id:'telecom',category:'infraestructura',name:'Boomerez Telecom',short:'Telecom',cost:3000000,staff:14,rentBase:7000,baseRevenue:160000,cogs:0.22,model:'service',popExp:0.6,wealthExp:0.4,sprite:'bld_telecom',color:'#7163aa',letter:'T',desc:'Fibra, datos y atención al cliente. Cada centro abarata un 3 % la estructura del grupo, hasta un 18 %.'},
  logistica: {id:'logistica',category:'logistica',name:'Boomerez Logística',short:'Logística',cost:1800000,staff:20,rentBase:6500,baseRevenue:130000,cogs:0.26,model:'service',popExp:0.5,wealthExp:0.2,sprite:'bld_logistica',color:'#598267',letter:'L',desc:'Almacén, distribución y servicios a terceros. Transporte de sobaos −30 % en rutas con un centro en origen o destino.'},

};

export const SOBAO_TYPE_BY_BRAND = { express: 'express', maison: 'maison' };

// Mejoras del obrador (se compran en orden).
export const OBRADOR_UPGRADES = [
  { id: 'linea2', name: 'Segunda línea de horneado', cost: 120000, capacity: 10000,
    desc: 'Un horno más. Tu padre decía que no hacía falta. Tu padre no tenía visión.' },
  { id: 'robot', name: 'Robot amasador alemán (de segunda mano)', cost: 180000, capacity: 15000, laborSave: 0.85,
    desc: 'Amasa como diez pasiegas y no pide vacaciones. Las instrucciones vienen en alemán.' },
  { id: 'nave', name: 'Nave industrial en el polígono de Torrelavega', cost: 420000, capacity: 35000,
    desc: 'Adiós al obrador de la abuela. Hola, producción industrial "artesana".' },
];

export const OBRADOR_BASE = {
  capacity: 12000,
  fixedCost: 2000,
  upgradeUpkeep: 1500,
  shopUnits: 2500, shopPrice: 4.5,
  wholesaleUnits: 4000, wholesalePrice: 2.8,
  baseValue: 350000,
};

// Asesores contratables (cuota mensual).
export const PERKS = {
  gestor: {
    name: 'Gestor "Paco el Exprimidor"', monthly: 1500, portrait: 'portrait_gestor_paco',
    desc: 'El radar de Hacienda sube un 35 % menos. Tiene la oficina encima de un bar.',
  },
  abogado: {
    name: 'Abogado laboralista Don Cosme', monthly: 2000, portrait: 'portrait_abogado_cosme',
    desc: 'Rebaja un 30 % las multas laborales y te da una opción extra en las inspecciones. Ya defendía a tu padre.',
  },
  comunicacion: {
    name: 'Agencia "Relato & Humo"', monthly: 1800,
    desc: 'Los escándalos te quitan un 40 % menos de reputación. Expertos en "poner en valor".',
  },
  fundacion: {
    name: 'Fundación Boomerez', monthly: 4000,
    desc: 'Torneos de pádel benéficos y becas para hijos de amigos. Reputación +0,5/mes, fama +0,3/mes y desgrava un 10 % del impuesto de sociedades.',
  },
  andorra: {
    name: 'Sociedad patrimonial en Andorra', monthly: 1000, setup: 40000,
    desc: 'Declaras todavía menos (−30 %). Si Hacienda te pilla, la auditoría es un 50 % más dura.',
  },
};


// Tras las tres mejoras históricas, se pueden añadir módulos industriales sin un tope de niveles.
export const expansionUpgrade = (n = 0) => ({
  id: `modulo_${n + 1}`, expansion: true, name: `Módulo industrial ${n + 1}`,
  cost: Math.round(650000 * 1.32 ** n), capacity: 25000,
  desc: 'Otra nave, otra línea y más permisos. +25.000 uds/mes; mantenimiento +1.500 €/mes. La siguiente cuesta un 32 % más.',
});
export const expansionValue = (n = 0) => {
  let sum = 0;
  for (let i = 0; i < n; i++) sum += expansionUpgrade(i).cost * 0.8;
  return sum;
};
