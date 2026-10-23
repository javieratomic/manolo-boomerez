// Objetivos encadenados: guían al jugador y dan pequeñas recompensas.
import { BUSINESS_TYPES } from './businesses.js';
import { patrimonio } from '../core/economy.js';
import { addCash, addFama, addRep } from '../core/helpers.js';

const outlets = (s) => s.businesses.filter((b) => BUSINESS_TYPES[b.type].category === 'sobaos').length;

export const GOALS = [
  {
    id: 'primera_tienda',
    text: 'Abre tu primera tienda de sobaos (pincha en una ciudad grande del mapa).',
    test: (s) => outlets(s) >= 1,
    reward(s) {
      addFama(s, 3);
      return 'Tu madre comparte la inauguración en Facebook. Fama +3.';
    },
  },
  {
    id: 'tres_tiendas',
    text: 'Llega a 3 tiendas de sobaos, propias o franquiciadas.',
    test: (s) => outlets(s) >= 3,
    reward(s) {
      addCash(s, 10000);
      return 'Te conceden una subvención autonómica "al emprendimiento rural" de 10.000 €. Tú, que estás en contra de las subvenciones.';
    },
  },
  {
    id: 'mejora_obrador',
    text: 'Mejora el obrador de Selaya para producir más.',
    test: (s) => s.obrador.upgrades.length >= 1,
    reward(s) {
      addRep(s, 3);
      return 'El Diario Montañés titula "El obrador Boomerez crece". Reputación +3.';
    },
  },
  {
    id: 'diversificar',
    text: 'Diversifica: abre un negocio que no sea de sobaos.',
    test: (s) => s.businesses.some((b) => BUSINESS_TYPES[b.type].category !== 'sobaos'),
    reward(s) {
      addFama(s, 5);
      return 'Ya puedes poner "Holding" en tu tarjeta de visita. Fama +5.';
    },
  },
  {
    id: 'millon',
    text: 'Alcanza 1 millón de patrimonio.',
    test: (s) => patrimonio(s) >= 1e6,
    reward(s) {
      addFama(s, 6);
      return '¡Millonario! Te compras un Audi (de renting). Fama +6.';
    },
  },
  {
    id: 'cincuenta',
    text: 'Da trabajo a 50 personas.',
    test: (s) => (s.lastReport?.employees ?? 0) >= 50,
    reward(s) {
      addRep(s, 4);
      return '"Yo genero empleo", repites en cada cena. Por una vez es verdad. Reputación +4.';
    },
  },
  {
    id: 'tres_millones',
    text: 'Alcanza 3 millones de patrimonio.',
    test: (s) => patrimonio(s) >= 3e6,
    reward(s) {
      addFama(s, 8);
      return 'Te invitan a dar una charla TEDx en Torrelavega. Fama +8.';
    },
  },
  {
    id: 'tiburon',
    text: 'Llega a 5 millones antes de 2034 para ser un Tiburón Pasiego.',
    test: (s) => patrimonio(s) >= 5e6,
    reward(s) {
      addFama(s, 10);
      return 'Ya eres oficialmente un tiburón. Ahora, a por Forbes (15 M€). Fama +10.';
    },
  },
  {
    id: 'forbes',
    text: 'El sueño: 15 millones de patrimonio.',
    test: (s) => patrimonio(s) >= 15e6,
    reward() {
      return 'Forbes ya está al teléfono.';
    },
  },
];
