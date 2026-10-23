// Caprichos de Manolo. Se pagan con la tarjeta de la empresa (Hacienda toma nota).
// upkeep: gasto mensual · drift: variación mensual del valor (negativo = se deprecia)

export const LUJOS = [
  { id: 'reloj', emoji: '⌚', name: 'Reloj suizo de edición limitada', cost: 25000, upkeep: 0, drift: -0.003, fama: 2, familia: 0, hac: 2,
    desc: 'Pesa más que un sobao. Lo enseña en cada apretón de manos.' },
  { id: 'coche', emoji: '🚙', name: 'Todoterreno alemán de alta gama', cost: 95000, upkeep: 900, drift: -0.012, fama: 4, familia: 2, hac: 3,
    desc: 'Negro, con lunas tintadas. Lo aparca en la plaza para personas con movilidad reducida "solo un momento".' },
  { id: 'palco', emoji: '🏟️', name: 'Palco VIP en el estadio', cost: 80000, upkeep: 2000, drift: -0.02, fama: 5, familia: -2, hac: 2, credit: 150000,
    desc: 'Networking con constructores, banqueros y algún concejal. Tu límite de crédito sube 150.000 €.' },
  { id: 'cuadro', emoji: '🖼️', name: 'Cuadro de un artista contemporáneo', cost: 200000, upkeep: 0, drift: 0.004, fama: 3, familia: 4, hac: 8,
    desc: 'Un lienzo azul con una raya roja. Vanessa dice que es bueno. Hacienda dice que es sospechoso.' },
  { id: 'caballo', emoji: '🐎', name: 'Caballo de carreras "Sobaíto"', cost: 120000, upkeep: 2500, drift: -0.01, fama: 6, familia: -3, hac: 3,
    desc: 'Corre en el hipódromo los domingos. Pierde casi siempre, pero sale en las fotos.' },
  { id: 'yate', emoji: '🛥️', name: 'Yate en el puerto de Laredo', cost: 450000, upkeep: 4500, drift: -0.008, fama: 10, familia: 6, hac: 6,
    desc: 'Se llama "Mentalidad de Tiburón". Merche lo usa más que tú.' },
  { id: 'chalet', emoji: '🏡', name: 'Chalet en Marbella', cost: 1200000, upkeep: 3500, drift: 0.004, fama: 8, familia: 10, hac: 8, realEstate: true,
    desc: 'Piscina infinita, vistas al mar y un vecino que fue concejal de urbanismo.' },
];

export const LUJO_BY_ID = Object.fromEntries(LUJOS.map((l) => [l.id, l]));
