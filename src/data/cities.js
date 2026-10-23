// Ciudades donde Manolo puede plantar su imperio.
// pop, wealth, tourism y rent son índices relativos (1 = ciudad media española).
// lon/lat se proyectan al mapa 2.5D (ver src/render/projection.js). Las Palmas usa
// coordenadas "de recuadro" porque Canarias se dibuja como inserto, como en los mapas del tiempo.

export const HQ_CITY = 'selaya';

export const CITIES = [
  { id: 'selaya', name: 'Selaya', region: 'Cantabria', lon: -4.25, lat: 43.0, pop: 0.1, wealth: 0.9, tourism: 0.3, rent: 0.5, hq: true,
    blurb: 'Cuna del sobao pasiego. Vacas, niebla y el obrador de tu padre.' },
  { id: 'santander', name: 'Santander', region: 'Cantabria', lon: -3.8, lat: 43.46, pop: 0.5, wealth: 1.05, tourism: 0.55, rent: 0.95,
    blurb: 'La capital. Aquí todo el mundo conoce a alguien que conoce a tu padre.' },
  { id: 'bilbao', name: 'Bilbao', region: 'País Vasco', lon: -2.93, lat: 43.26, pop: 0.9, wealth: 1.2, tourism: 0.5, rent: 1.1,
    blurb: 'Poder adquisitivo alto y paladar exigente. Te mirarán raro si vendes margarina.' },
  { id: 'donostia', name: 'Donostia', region: 'País Vasco', lon: -1.98, lat: 43.32, pop: 0.5, wealth: 1.35, tourism: 0.75, rent: 1.45,
    blurb: 'Capital mundial del pintxo. El sobao aquí es "producto de kilómetro 200".' },
  { id: 'oviedo', name: 'Oviedo', region: 'Asturias', lon: -5.85, lat: 43.36, pop: 0.5, wealth: 1.0, tourism: 0.35, rent: 0.85,
    blurb: 'Tierra de carbayones, el enemigo natural del sobao.' },
  { id: 'coruna', name: 'A Coruña', region: 'Galicia', lon: -8.41, lat: 43.36, pop: 0.6, wealth: 0.98, tourism: 0.4, rent: 0.85,
    blurb: 'Llueve, pero la gente compra. Ideal para el bollo de consuelo.' },
  { id: 'valladolid', name: 'Valladolid', region: 'Castilla y León', lon: -4.72, lat: 41.65, pop: 0.6, wealth: 0.95, tourism: 0.25, rent: 0.8,
    blurb: 'Funcionarios con horario fijo: clientela estable de desayuno.' },
  { id: 'salamanca', name: 'Salamanca', region: 'Castilla y León', lon: -5.66, lat: 40.97, pop: 0.35, wealth: 0.85, tourism: 0.5, rent: 0.75,
    blurb: 'Estudiantes sin dinero y turistas con dinero. Elige bien.' },
  { id: 'zaragoza', name: 'Zaragoza', region: 'Aragón', lon: -0.88, lat: 41.65, pop: 1.0, wealth: 1.0, tourism: 0.3, rent: 0.9,
    blurb: 'La ciudad media por excelencia. Si funciona aquí, funciona en España.' },
  { id: 'madrid', name: 'Madrid', region: 'Comunidad de Madrid', lon: -3.7, lat: 40.42, pop: 3.3, wealth: 1.3, tourism: 0.75, rent: 1.6,
    blurb: 'El sueño de todo emprendedor: alquileres imposibles y colas para todo.' },
  { id: 'barcelona', name: 'Barcelona', region: 'Cataluña', lon: 2.17, lat: 41.39, pop: 2.6, wealth: 1.25, tourism: 1.0, rent: 1.7,
    blurb: 'Turistas infinitos. Los vecinos ya no tanto.' },
  { id: 'valencia', name: 'València', region: 'Comunidad Valenciana', lon: -0.38, lat: 39.47, pop: 1.3, wealth: 1.0, tourism: 0.7, rent: 1.1,
    blurb: 'Horchata, fartons y ahora... ¿sobaos? Todo es posible.' },
  { id: 'alicante', name: 'Alicante', region: 'Comunidad Valenciana', lon: -0.48, lat: 38.35, pop: 0.6, wealth: 0.9, tourism: 0.85, rent: 1.0,
    blurb: 'Jubilados europeos con pensión alemana. Tu público objetivo.' },
  { id: 'murcia', name: 'Murcia', region: 'Región de Murcia', lon: -1.13, lat: 37.99, pop: 0.7, wealth: 0.85, tourism: 0.3, rent: 0.8,
    blurb: 'Calor, huerta y paparajotes. Competencia dura en repostería.' },
  { id: 'sevilla', name: 'Sevilla', region: 'Andalucía', lon: -5.98, lat: 37.39, pop: 1.1, wealth: 0.9, tourism: 0.8, rent: 1.0,
    blurb: 'Tiene un color especial. Y unos 45 grados en agosto.' },
  { id: 'malaga', name: 'Málaga', region: 'Andalucía', lon: -4.42, lat: 36.72, pop: 0.9, wealth: 0.98, tourism: 0.95, rent: 1.25,
    blurb: 'Nómadas digitales pagando 1.500 € por un estudio. Tu tipo de gente.' },
  { id: 'granada', name: 'Granada', region: 'Andalucía', lon: -3.6, lat: 37.18, pop: 0.5, wealth: 0.85, tourism: 0.75, rent: 0.85,
    blurb: 'Te ponen tapa con la caña. Difícil competir con lo gratis.' },
  { id: 'palma', name: 'Palma', region: 'Illes Balears', lon: 2.65, lat: 39.57, pop: 0.7, wealth: 1.15, tourism: 1.0, rent: 1.6,
    blurb: 'Yates, cruceros y alquileres de lujo. Perfecto para una Maison.' },
  { id: 'laspalmas', name: 'Las Palmas', region: 'Canarias', lon: -7.55, lat: 35.72, pop: 0.6, wealth: 0.9, tourism: 0.9, rent: 1.05, inset: true,
    blurb: 'Primavera eterna. El sobao llega en avión y algo aplastado.' },
];

export const CITY_BY_ID = Object.fromEntries(CITIES.map((c) => [c.id, c]));
