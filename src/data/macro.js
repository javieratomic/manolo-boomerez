// Ciclo económico español, versión documental de La 2 contada por un tertuliano.
export const PHASES = {
  recuperacion: {
    label: 'Recuperación', emoji: '🌱', next: 'expansion', min: 10, max: 18,
    demand: 0.96, tourism: 0.97, property: 0.002, credit: 0.9, interest: 0,
    desc: 'La economía levanta cabeza, despacito. Los bancos vuelven a coger el teléfono.',
  },
  expansion: {
    label: 'Expansión', emoji: '📈', next: 'burbuja', min: 14, max: 24,
    demand: 1.04, tourism: 1.04, property: 0.005, credit: 1, interest: 0.0003,
    desc: 'Todo va bien. Se abren bares, se venden pisos y todo el mundo tiene un primo que se ha hecho rico.',
  },
  burbuja: {
    label: 'Burbuja', emoji: '🫧', next: 'crisis', min: 8, max: 14,
    demand: 1.12, tourism: 1.12, property: 0.012, credit: 1.25, interest: 0.0008,
    desc: '"Esto no baja nunca", dicen en la tele. Los pisos suben cada mes. Tu cuñado ha dejado su trabajo para hacer trading.',
  },
  crisis: {
    label: 'Crisis', emoji: '📉', next: 'recuperacion', min: 8, max: 16,
    demand: 0.82, tourism: 0.85, property: -0.012, credit: 0.65, interest: 0.0015,
    desc: 'Los bancos cierran el grifo, el ladrillo se hunde y los tertulianos piden "reformas estructurales".',
  },
};
