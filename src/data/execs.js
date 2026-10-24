// Equipo directivo: puestos, rasgos y nombres para generar candidatos.

export const POSITIONS = {
  operaciones: { label: 'Dirección de Operaciones', emoji: '🏭', bonus: 0.08,
    effect: 'Capacidad del obrador +8 % por nivel, costes de estructura −16 % por nivel y proyectos de I+D más rápidos.' },
  rrhh: { label: 'Recursos Humanos', emoji: '🧑‍🤝‍🧑', bonus: 0.1,
    effect: 'Moral +0,4/mes por nivel y el radar de Trabajo sube un 10 % menos por nivel.' },
  finanzas: { label: 'Dirección Financiera', emoji: '📊', bonus: 0.1,
    effect: 'El radar de Hacienda sube un 10 % menos por nivel e intereses un 5 % más bajos por nivel.' },
  marketing: { label: 'Marketing', emoji: '📣', bonus: 0.2,
    effect: 'Campañas un 20 % más eficaces por nivel y reputación +0,15/mes por nivel.' },
  expansion: { label: 'Expansión', emoji: '🗺️', bonus: 0.06,
    effect: 'Aperturas un 6 % más baratas por nivel y canon de franquicia un 10 % más alto por nivel.' },
};

export const TRAITS = {
  leal: { label: 'Leal', desc: 'No se irá con la competencia.' },
  trepa: { label: 'Trepa', desc: 'Si hay competencia, intentarán ficharle.' },
  chivato: { label: 'Íntegro', desc: 'Si explotas a la plantilla, puede denunciarte.' },
  quemado: { label: 'Al borde del burnout', desc: 'Si la moral cae por debajo de 35, puede dimitir.' },
  tiburon: { label: 'Tiburón', desc: 'Rinde un nivel más (hasta el máximo de 3), cobra un 50 % más y es agresivo (radares +0,5/mes).' },
  enchufado: { label: 'Enchufado', desc: 'Es de la familia: barato y flojo. Despedirle te costará una cena familiar muy tensa.' },
  mba: { label: 'MBA de escuela cara', desc: 'Muy bueno en PowerPoint. Cobra un 25 % más.' },
};

export const FIRST_NAMES = ['Lucía', 'Iñigo', 'Marta', 'Borja', 'Nerea', 'Álvaro', 'Carmen', 'Javier', 'Ainhoa', 'Pelayo', 'Rocío', 'Gonzalo', 'Itziar', 'Fermín', 'Patricia', 'Unai', 'Begoña', 'Cayetano', 'Sonia', 'Rubén'];
export const LAST_NAMES = ['Ruiz de la Vega', 'Etxeberria', 'Gutiérrez', 'Sainz-Trápaga', 'Lombardero', 'Pérez de Albéniz', 'Mazón', 'Ceballos', 'Revuelta', 'Arrizabalaga', 'Quintana', 'Del Hoyo', 'Bustamante', 'Sobrado', 'Villegas', 'Cubillas'];
export const FAMILY = [
  { name: 'Kevin Boomerez', note: 'tu sobrino' },
  { name: 'Jonathan Fernández', note: 'tu cuñado' },
  { name: 'Merche Gutiérrez', note: 'tu mujer' },
];
export const EXEC_PORTRAITS = ['portrait_exec_1', 'portrait_exec_2', 'portrait_exec_3', 'portrait_exec_4', 'portrait_exec_5', 'portrait_exec_6'];

// Identidad de los personajes del catálogo; no deducirla del orden de generación.
const WOMEN = new Set(['Lucía', 'Marta', 'Nerea', 'Carmen', 'Ainhoa', 'Rocío', 'Itziar', 'Patricia', 'Begoña', 'Sonia']);
const PORTRAITS_BY_GENDER = {
  mujer: ['portrait_exec_1', 'portrait_exec_4', 'portrait_exec_5'],
  hombre: ['portrait_exec_2', 'portrait_exec_3', 'portrait_exec_6'],
};
const FAMILY_PORTRAITS = {
  'Kevin Boomerez': 'portrait_sobrino_kevin',
  'Jonathan Fernández': 'portrait_cunado_jonathan',
  'Merche Gutiérrez': 'portrait_esposa_merche',
};

export function execPortrait(name, portrait) {
  if (Object.hasOwn(FAMILY_PORTRAITS, name)) return FAMILY_PORTRAITS[name];
  const first = name?.split(' ')[0];
  if (!FIRST_NAMES.includes(first)) return portrait;
  const pool = PORTRAITS_BY_GENDER[WOMEN.has(first) ? 'mujer' : 'hombre'];
  if (pool.includes(portrait)) return portrait;
  // Reasignación estable que conserva la variedad sin consumir azar de la partida.
  const index = Math.max(0, EXEC_PORTRAITS.indexOf(portrait));
  return pool[index % pool.length];
}
