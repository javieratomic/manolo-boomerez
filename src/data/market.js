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
  {"id": "integral", "name": "Sobao integral de espelta", "cost": 32000, "months": 2, "effects": [{"category": "sobaos", "factor": 1.05}], "desc": "El desayuno de quien lee etiquetas. Sobaos +5 %."},
  {"id": "cafe", "name": "Café de especialidad pasiego", "cost": 48000, "months": 3, "effects": [{"types": ["taberna"], "factor": 1.09}, {"category": "sobaos", "factor": 1.03}], "desc": "Café con nombre de finca y un sobao al lado. Tabernas +9 % y sobaos +3 %.", "requires": "taberna"},
  {"id": "vegano", "name": "Receta vegetal de avena", "cost": 55000, "months": 4, "effects": [{"category": "sobaos", "factor": 1.07, "minPop": 0.6}], "desc": "Otra clientela, otra receta. Sobaos +7 % en mercados medianos y grandes."},
  {"id": "cacao", "name": "Sobao de cacao de origen", "cost": 42000, "months": 3, "effects": [{"category": "sobaos", "factor": 1.06}], "desc": "Ahora también mancha los dedos. Sobaos +6 %."},
  {"id": "helado", "name": "Helado de sobao pasiego", "cost": 65000, "months": 4, "effects": [{"types": ["taberna", "smash", "empanadas"], "factor": 1.13, "months": [4, 5, 6, 7, 8]}], "desc": "El verano ya tiene postre: hostelería +13 % de mayo a septiembre.", "requires": "taberna"},
  {"id": "menu_verde", "name": "Menú vegetal de temporada", "cost": 52000, "months": 3, "effects": [{"types": ["smash", "empanadas", "taberna"], "factor": 1.07}], "desc": "La ensalada deja de ser decoración. Hostelería +7 %.", "requires": "smash"},
  {"id": "biomecanica", "name": "Circuito de biomecánica", "cost": 85000, "months": 5, "effects": [{"types": ["gimnasio"], "factor": 1.14}], "desc": "Máquinas ajustables y programas para espaldas de oficina. Gimnasios +14 %.", "requires": "gimnasio"},
  {"id": "salas", "name": "Salas insonorizadas y reserva digital", "cost": 72000, "months": 4, "effects": [{"types": ["coworking"], "factor": 1.12}], "desc": "Las reuniones ya no se escuchan desde recepción. Coworking +12 %.", "requires": "coworking"},
  {"id": "domotica", "name": "Domótica y llegada sin esperas", "cost": 80000, "months": 4, "effects": [{"types": ["airbnb"], "factor": 1.08}], "desc": "Climatización y acceso que funcionan. Pisos turísticos +8 %.", "requires": "airbnb"},
  {"id": "rehabilitacion", "name": "Programa de rehabilitación sénior", "cost": 95000, "months": 5, "effects": [{"types": ["residencia"], "factor": 1.09}], "desc": "Fisioterapia y seguimiento real. Aumenta el atractivo de la residencia un 9 %, respetando sus plazas.", "requires": "residencia"},
  {"id": "simulador", "name": "Simulador de gestión para la Academy", "cost": 60000, "months": 4, "effects": [{"types": ["academy"], "factor": 1.13}], "desc": "Los alumnos practican sin hipotecar a su madre. Academy +13 %.", "requires": "academy"},
  {"id": "desayunos", "name": "Desayunos corporativos por reserva", "cost": 110000, "months": 5, "effects": [{"category": "sobaos", "factor": 1.06}, {"types": ["coworking", "taberna"], "factor": 1.06}], "desc": "Reuniones con menos diapositivas y más desayuno. Sobaos, coworking y tabernas +6 %."},
  {id:'horneado_continuo',name:'Horneado continuo',cost:180000,months:5,effects:[],production:1.20,desc:'Capacidad instalada del grupo +20 %. Necesita plantilla y vivienda suficientes.'},
  {id:'fermentacion_controlada',name:'Fermentación controlada',cost:240000,months:6,effects:[],production:1.15,desc:'Capacidad instalada +15 %, acumulable con el horneado continuo.'},
  {id:'robots_envasado',name:'Robots de envasado',cost:320000,months:6,effects:[],laborFactor:0.85,desc:'Personal necesario para fabricar −15 %. Libera capacidad y reduce nóminas.'},
  {id:'energia_recuperada',name:'Recuperación de calor del horno',cost:160000,months:4,effects:[],fixedFactor:0.8,desc:'Gastos fijos industriales −20 %.'},
  {id:'compra_agrupada',name:'Compra centralizada de materias',cost:140000,months:4,effects:[],materialFactor:0.94,desc:'Coste de materias primas −6 %, sin alterar la receta.'},
  {id:'rutas_predictivas',name:'Planificación predictiva de rutas',cost:190000,months:5,effects:[],transportFactor:0.85,desc:'Coste de transporte −15 %.'},
  {id:'erp_grupo',name:'ERP para el grupo empresarial',cost:260000,months:6,effects:[],structureFactor:0.85,desc:'Coste de estructura central −15 %.'},
  {id:'expansion_propia',name:'Despliegue comercial internacional',cost:350000,months:6,effects:[],whiteSuccess:6,desc:'Permite abrir locales propios en cada país europeo donde hayas cumplido seis meses de marca blanca con al menos el 90 % del pedido servido.'},
  {id:'licencia_bancaria',name:'Licencia de banca comercial',cost:650000,months:9,effects:[],opens:'banca',desc:'Desbloquea Banco Boomerez. Una oficina cuesta desde 5 M€, antes del ajuste local.'},
  {id:'red_telecom',name:'Red de telecomunicaciones del grupo',cost:450000,months:8,effects:[],opens:'telecom',desc:'Desbloquea Boomerez Telecom. Además de sus clientes, reduce costes de estructura del grupo.'},
  {id:'plataforma_logistica',name:'Plataforma logística integrada',cost:300000,months:6,effects:[],opens:'logistica',desc:'Desbloquea centros logísticos que venden servicios y abaratan las rutas que pasan por su ciudad.'},

];

// Iconos vectoriales propios de la interfaz: cada proyecto tiene una ilustración distinta.
for (const product of PRODUCTS) product.icon = `assets/ui/rd_${product.id}.svg`;

export const UPGRADE_COST = [0.6, 1.0]; // coste de pasar a nivel 2 y a nivel 3 (fracción del coste del negocio)
export const MAX_LEVEL = 10;
export const LEVEL_BONUS = 0.15; // demanda extra por nivel

const factorCache=new WeakMap();
export function researchFactor(s,key) {
 const products=s.products||[],signature=products.join('|');
 let cached=factorCache.get(s);
 if(!cached||cached.signature!==signature){
  const factors={};
  for(const p of PRODUCTS)if(products.includes(p.id))for(const k of ['production','laborFactor','fixedFactor','materialFactor','transportFactor','structureFactor'])factors[k]=(factors[k]||1)*(p[k]||1);
  cached={signature,factors};factorCache.set(s,cached);
 }
 return cached.factors[key]||1;
}
