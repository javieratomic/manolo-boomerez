// Refranero de Doña Remedios: refranes populares (de dominio público) que apunta en la cartilla.
// Se eligen sin azar (por el número de apuntes) y nunca repite el último.
export const REFRANES = {
  pedir: [
    'Quien presta a un amigo, compra un enemigo. Pero tú eres mi hijo.',
    'Hijo eres y padre serás: lo que hicieres, tal habrás.',
    'Más vale pájaro en mano que ciento volando.',
    'No hay que vender la piel del oso antes de cazarlo.',
    'Dime con quién andas y te diré quién eres.',
  ],
  devolver: [
    'Cuentas claras, amistades largas.',
    'Quien debe y paga, no debe nada.',
    'Al buen pagador no le duelen prendas.',
    'Hombre prevenido vale por dos.',
    'Poco a poco se va lejos.',
  ],
  tarde: [
    'Más vale tarde que nunca.',
    'El que espera, desespera.',
    'No dejes para mañana lo que puedas hacer hoy.',
    'Las cuentas del Gran Capitán, en esta casa no.',
  ],
  enfado: [
    'Las palabras se las lleva el viento.',
    'Del dicho al hecho hay mucho trecho.',
    'Obras son amores, que no buenas razones.',
    'Quien avisa no es traidor.',
  ],
  embargo: [
    'A quien Dios no le da hijos, el diablo le da sobrinos.',
    'Donde las dan, las toman.',
    'Cría cuervos y te sacarán los ojos.',
    'Al que no quiere caldo, tres tazas.',
  ],
  rescate: [
    'Madre no hay más que una.',
    'A grandes males, grandes remedios.',
    'Más vale una vez colorado que ciento amarillo.',
    'No hay mal que cien años dure.',
  ],
  domingo: [
    'Barriga llena, corazón contento.',
    'Contigo, pan y cebolla. Y cocido los domingos.',
    'En casa del herrero, cuchillo de palo.',
    'Lo que no mata, engorda.',
  ],
};

export const REFRAN_COUNT = Object.values(REFRANES).reduce((a, l) => a + l.length, 0);
