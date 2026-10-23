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
    name: 'Residencial Boomerez', short: 'Residencial',
    cost: 210000, staff: 0, upkeep: 700, beds: 10, realEstate: true,
    sprite: 'bld_vivienda', color: '#9a9183', letter: 'R',
    desc: 'Pisos para tu plantilla. El alquiler sale directamente de la nómina. Así nadie se va... ni se queja.',
  },
  airbnb: {
    id: 'airbnb', category: 'inmobiliario',
    name: 'Apartamentos Turísticos "Casa Manolo"', short: 'Casa Manolo',
    cost: 260000, staff: 1, upkeep: 1500, flats: 6, realEstate: true,
    sprite: 'bld_airbnb', color: '#2f8fc4', letter: 'A',
    desc: 'Seis pisos turísticos con candado de llaves en la farola. Los vecinos encantados.',
  },
  smash: {
    id: 'smash', category: 'hosteleria',
    name: 'Manolo Smash Club', short: 'Smash',
    cost: 110000, staff: 5, rentBase: 3000, baseRevenue: 24000, cogs: 0.33, trend: 'smash',
    sprite: 'bld_smash', color: '#d4402b', letter: 'B',
    desc: 'Hamburguesas aplastadas, luz de neón rosa y música que no te deja hablar. Mientras dure la moda.',
  },
  empanadas: {
    id: 'empanadas', category: 'hosteleria',
    name: 'Empanadas El Gaucho Pasiego', short: 'Empanadas',
    cost: 45000, staff: 3, rentBase: 1200, baseRevenue: 13000, cogs: 0.3, trend: 'empanadas',
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
  andorra: {
    name: 'Sociedad patrimonial en Andorra', monthly: 1000, setup: 40000,
    desc: 'Declaras todavía menos (−30 %). Si Hacienda te pilla, la auditoría es un 50 % más dura.',
  },
};
