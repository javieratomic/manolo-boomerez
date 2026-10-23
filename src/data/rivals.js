// Cadenas rivales. Aparecen cuando Manolo entra en su terreno y se expanden copiando sus éxitos.
// targets: tipos de negocio de Manolo a los que quitan clientela.

export const RIVALS = {
  dona_rosa: {
    name: 'La Tahona de Doña Rosa', short: 'Doña Rosa', emoji: '👵', color: '#c0392b',
    targets: ['express'], aggr: 0.5, seedCities: ['madrid', 'zaragoza', 'valencia', 'sevilla', 'murcia', 'valladolid'],
    spawn: (s) => s.month >= 3,
    desc: 'Bollería industrial con nombre de abuela entrañable. La abuela no existe; el fondo de inversión que la posee, sí.',
  },
  masa: {
    name: 'MASA · Masa Madre & Specialty Coffee', short: 'MASA', emoji: '☕', color: '#5d6d5a',
    targets: ['maison', 'express'], aggr: 0.45, seedCities: ['madrid', 'barcelona', 'bilbao', 'donostia', 'valencia', 'malaga'],
    spawn: (s) => s.businesses.filter((b) => ['express', 'maison'].includes(b.type)).length >= 2,
    desc: 'Cemento visto, bombillas de filamento y sobaos "de fermentación lenta" a 6 €. Sus baristas tienen más seguidores que tú.',
  },
  burger_bros: {
    name: 'Burger Bros Smash', short: 'Burger Bros', emoji: '🍔', color: '#2c3e50',
    targets: ['smash'], aggr: 0.65, seedCities: ['madrid', 'barcelona', 'valencia', 'malaga', 'sevilla'],
    spawn: (s) => !!s.unlocked.smash,
    desc: 'Dos hermanos con gorra plana y un fondo de capital riesgo detrás. Abren un local por semana.',
  },
  la_portena: {
    name: 'Empanadas La Porteña', short: 'La Porteña', emoji: '🥟', color: '#2e86c1',
    targets: ['empanadas'], aggr: 0.4, seedCities: ['madrid', 'barcelona', 'valencia', 'palma', 'malaga'],
    spawn: (s) => !!s.unlocked.empanadas,
    desc: 'Empanadas argentinas de verdad, hechas por argentinos de verdad. Tu primo Rodrigo dice que son "una copia".',
  },
  vulture: {
    name: 'Vulture Capital Real Estate', short: 'Vulture Capital', emoji: '🦅', color: '#7d3c98',
    targets: ['airbnb'], aggr: 0.5, seedCities: ['barcelona', 'palma', 'malaga', 'madrid', 'valencia', 'alicante'],
    spawn: (s) => !!s.unlocked.airbnb,
    desc: 'Un fondo internacional que compra edificios enteros para pisos turísticos. Tiene más pisos que algunos ayuntamientos.',
  },
  gym_bros: {
    name: 'IronBros 24h', short: 'IronBros', emoji: '🏋️', color: '#d35400',
    targets: ['gimnasio'], aggr: 0.5, seedCities: ['madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza'],
    spawn: (s) => !!s.unlocked.gimnasio,
    desc: 'Gimnasios a 19,90 € con música a todo volumen y una máquina de batidos que nunca funciona.',
  },
};

export const RIVAL_LEVEL_PENALTY = 0.15; // pérdida de demanda por nivel de presencia rival
export const RIVAL_MAX_LEVEL = 3;
