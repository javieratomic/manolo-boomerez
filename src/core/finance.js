// Foto del balance actual. Las contingencias se estudian aparte: no son deuda bancaria
// ni cambian el patrimonio usado por los objetivos del juego.
import {obradorValue,grossPatrimonio,patrimonio,ssOwed} from './economy.js';
import {lujoValue} from './life.js';
import {haciendaDebt} from './inspections.js';
import {liquidacion} from './plantilla.js';

export function financeSnapshot(s) {
 const assets={cash:s.cash,factory:obradorValue(s),businesses:s.businesses.reduce((n,b)=>n+(b.value||0),0),luxury:lujoValue(s)};
 assets.total=assets.cash+assets.factory+assets.businesses+assets.luxury;
 const liabilities={bank:s.debt,family:s.cartilla?.owed||0,socialSecurity:ssOwed(s)};
 liabilities.total=liabilities.bank+liabilities.family+liabilities.socialSecurity;
 const equity=grossPatrimonio(s),ownership=1-(s.ipo?.float||0),sentiment=s.ipo?s.ipo.sent??1:1;
 const tax=haciendaDebt(s),labor=liquidacion(s),total=tax+labor;
 const exposure={tax,labor,total,cashAfter:s.cash-total,equityAfter:equity-total,playerWealthAfter:(equity-total)*ownership*sentiment};
 return {assets,liabilities,equity,ownership,sentiment,playerWealth:patrimonio(s),exposure};
}
