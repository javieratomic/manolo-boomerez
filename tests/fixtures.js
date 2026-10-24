// Edificios ya entregados para pruebas históricas centradas en otros sistemas.
import {openBusiness as beginConstruction} from '../src/core/actions.js';
export function openBusiness(s,...args) {
 const r=beginConstruction(s,...args);
 if(r.ok){r.business.readyMonth=s.month;r.business.delivered=true;}
 return r;
}
