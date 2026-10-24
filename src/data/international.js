// Mercados y socios ficticios; todos los importes son parámetros de juego en euros.
export const FOREIGN_MARKETS = [
  { id:'portugal', country:'Portugal', partner:'Mercearias do Atlântico', setup:30000, units:2800, price:2.4, shipping:0.12, turnover:38000, risk:0.025 },
  { id:'francia', country:'Francia', partner:'Maison du Goûter', setup:50000, units:4000, price:2.6, shipping:0.18, turnover:58000, risk:0.03 },
  { id:'alemania', country:'Alemania', partner:'Nordmarkt Feinkost', setup:65000, units:5000, price:2.7, shipping:0.24, turnover:72000, risk:0.03 },
  { id:'reino_unido', country:'Reino Unido', partner:'Tea Time Trading', setup:70000, units:4200, price:2.85, shipping:0.34, turnover:68000, risk:0.04 },
  { id:'mexico', country:'México', partner:'Dulces Dos Océanos', setup:85000, units:6000, price:2.9, shipping:0.45, turnover:82000, risk:0.05 },
  { id:'japon', country:'Japón', partner:'Hoshi Sweet Partners', setup:120000, units:4000, price:3.5, shipping:0.65, turnover:105000, risk:0.045 },
  {id:'italia',country:'Italia',partner:'Dolci della Valle',setup:65000,units:4200,price:2.65,shipping:0.25,turnover:65000,risk:0.035},
  {id:'paises_bajos',country:'Países Bajos',partner:'Noord Ontbijt',setup:70000,units:4000,price:2.8,shipping:0.24,turnover:72000,risk:0.03},
  {id:'belgica',country:'Bélgica',partner:'Goûter des Plaines',setup:55000,units:3200,price:2.75,shipping:0.2,turnover:56000,risk:0.03},
  {id:'polonia',country:'Polonia',partner:'Poranny Wypiek',setup:50000,units:4800,price:2.3,shipping:0.28,turnover:52000,risk:0.04},

];
export const FOREIGN_BY_ID = Object.fromEntries(FOREIGN_MARKETS.map(m => [m.id, m]));
export const DEAL_MODES = {
  private_label: { name:'Marca blanca', desc:'Fabricas en España; el socio vende con su propia marca. Consume producción y paga cada unidad servida.' },
  licence: { name:'Licencia de marca', desc:'El socio fabrica y vende con tu marca en su país. Cobras el 8 % de sus ventas; no consume tu obrador. Arriesgas tu reputación y la receta.' },
};
export const DISPUTES = {
  calidad:'Un lote vendido por el socio no cumple lo pactado. Tu nombre aparece en las quejas.',
  impago:'El socio retrasa la liquidación y deja de contestar al departamento financiero.',
  copia:'Tu socio ha registrado una marca casi idéntica y guarda una copia de la receta.',
  suministro:'Llevas dos meses sirviendo menos del 80 % del pedido. El socio exige una solución.',
};
