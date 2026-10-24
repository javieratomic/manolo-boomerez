// Finales de partida.
export const ENDINGS = {
  bancarrota: {
    title: 'Concurso de acreedores',
    image: 'end_bancarrota', tone: 'bad',
    text: 'El juzgado mercantil de Santander declara el concurso de acreedores del imperio Boomerez. Manolo vuelve a casa de su madre, que le recibe con un sobao y un "ya te lo dijo tu padre". Ahora da charlas en LinkedIn sobre "el valor del fracaso".',
  },
  carcel: {
    title: 'Soto del Real',
    image: 'end_carcel', tone: 'bad',
    text: 'Tres expedientes después, Manolo ingresa en prisión. En el módulo 4 monta una red de reventa de sobaos a cambio de tabaco y escribe un libro de autoayuda: "Mentalidad de tiburón (entre rejas)". Lo publica una editorial de Andorra.',
  },
  cooperativa: {
    title: 'La Cooperativa',
    image: 'end_cooperativa', tone: 'bad',
    text: 'La plantilla, harta, aprovecha un vacío legal (y la paciencia de un juez laboral) para quedarse con la empresa. Nace "Sobaos Pasiegos S. Coop.", con Maripili de presidenta. Pagan bien, venden más y en la puerta hay un cartel: "Prohibida la entrada a Manolo".',
  },
  forbes: {
    title: 'Revista de millonarios (sección curiosidades)',
    image: 'end_forbes', tone: 'good',
    text: 'Manolo supera los 15 millones de patrimonio. Una revista de millonarios le dedica media página en "Fortunas peculiares", entre un señor que colecciona yates y una heredera de las pinzas para la ropa. Manolo la enmarca y la cuelga en el obrador, encima del retrato de su padre.',
  },
  tiburon: {
    title: 'Tiburón Pasiego',
    image: 'end_tiburon', tone: 'good',
    text: 'Ocho años después, el imperio Boomerez vale más de 5 millones. Manolo se compra un Audi Q8, un barco en Laredo y un hueco en una tertulia de los domingos. Su padre no lo habría aprobado. Su perfil en redes profesionales, sí.',
  },
  pyme: {
    title: 'Pyme con ínfulas',
    image: 'end_pyme', tone: 'neutral',
    text: 'El imperio es, siendo generosos, una pyme. Manolo vive bien, se queja mucho del Gobierno y en las cenas familiares cuenta que estuvo "a punto de petarlo". Su cuñado Jonathan le escucha con respeto.',
  },
  // Final voluntario (pestaña Manolo): el tono depende de cómo ha jugado (ver endingOf).
  selaya: {
    title: 'Vuelta a Selaya',
    image: 'end_selaya', tone: 'good', emoji: '🏡',
    text: 'Manolo deja el imperio y vuelve a Selaya. Por las mañanas amasa con las pasiegas en el obrador de su padre, con mantequilla de verdad; por las tardes juega al mus en el bar y pierde. Dice que es la mejor decisión empresarial de su vida. Por una vez, nadie le lleva la contraria.',
    neutral: 'Manolo anuncia su retirada en LinkedIn ("Un tiburón también necesita volver a su charca") y se instala en Selaya. Cada mañana baja al obrador a "supervisar", que consiste en probar sobaos y quejarse del precio de la mantequilla. Las pasiegas le dejan, por respeto a su padre.',
  },
  ruina_lenta: {
    title: 'Ruina lenta',
    image: 'end_ruina', tone: 'bad',
    text: 'Ocho años después, el negocio no ha llegado ni a doblar lo que valía cuando lo heredó. El obrador sigue en pie gracias a las mismas pasiegas de siempre. Manolo culpa al Gobierno, a los jóvenes, al clima y a la masa madre.',
  },
};

// Vuelta a Selaya con buen tono si ha jugado limpio un año seguido o ha respetado la receta del abuelo.
export const selayaGood = (s) => (s.flags?.legalStreak ?? 0) >= 12 || ['receta', 'publicada'].includes(s.flags?.anselmoFin);

export function endingOf(s, id) {
  const e = ENDINGS[id];
  if (id !== 'selaya' || selayaGood(s)) return e;
  return { ...e, tone: 'neutral', text: e.neutral };
}
