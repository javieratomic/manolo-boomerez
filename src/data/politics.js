// Elecciones (ficticias) cada cuatro años. Los dos partidos se satirizan por igual:
// cada uno cambia las reglas del juego con sus pros y sus contras para Manolo.

export const ELECTION_MONTHS = [16, 64]; // mayo de 2027 y mayo de 2031

export const PARTIES = {
  pps: {
    name: 'Partido del Progreso Sostenible (PPS)', short: 'PPS', emoji: '🌹', color: '#c0392b',
    slogan: '"Una España más justa, más verde y con más formularios"',
    effects: { wage: 1.04, inspection: 1.2, demand: 1.03, tax: 1, tourism: 'estricto' },
    summary: 'Sube el salario mínimo un 4 %, la Inspección trabaja un 20 % más y los pisos turísticos lo tienen más difícil; a cambio, la gente gasta un 3 % más.',
  },
  ale: {
    name: 'Alianza por la Libertad de Empresa (ALE)', short: 'ALE', emoji: '🦅', color: '#1f618d',
    slogan: '"Menos Estado, más emprendedores (y más rotondas)"',
    effects: { wage: 1, inspection: 0.85, demand: 0.98, tax: 0.92, tourism: 'laxo' },
    summary: 'Impuesto de sociedades un 8 % más bajo, una Inspección un 15 % más tranquila y manga ancha con los pisos turísticos; a cambio, recortes y un 2 % menos de consumo.',
  },
};
