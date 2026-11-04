// Efecto de una innovación sobre el imperio de hoy, sin simular el tiempo de desarrollo.
import {PRODUCT_BY_ID,canStartRD,researchDuration,tickRD} from './market.js';
import {BUSINESS_TYPES} from '../data/businesses.js';
import {computeEconomy} from './economy.js';
import {workforcePlan} from './workforce.js';

const metrics=r=>({net:r.net,capacity:r.capacity,fill:r.fill,employees:r.employees});
const staff=(s,city)=>{const w=workforcePlan(s,city);return {required:w.required,available:w.available,missingBeds:w.missingBeds};};
export function researchPlan(s,id) {
 const p=PRODUCT_BY_ID[id];
 if(!p)return {ok:false,msg:'Proyecto desconocido.'};
 if(s.products.includes(id))return {ok:false,msg:'Esta innovación ya está investigada.'};
 const active=s.rd?.id===id,check=canStartRD(s,id),c=structuredClone(s);
 c.rd={id,monthsLeft:1,total:1};tickRD(c);
 const cities=[...new Set(['selaya',...s.businesses.filter(b=>b.mode!=='franquicia').map(b=>b.city)])].sort();
 return {ok:true,id,name:p.name,description:p.desc,status:active?'active':check.ok?'available':'blocked',startable:check.ok,
  reason:active?'Este proyecto ya está en desarrollo; su coste se pagó al iniciarlo.':check.msg||'',
  costDue:active?0:p.cost,months:active?s.rd.monthsLeft:researchDuration(s,id),
  before:metrics(computeEconomy(s)),after:metrics(computeEconomy(c)),
  workforce:cities.map(city=>({city,before:staff(s,city),after:staff(c,city)})),
  unlock:p.opens?BUSINESS_TYPES[p.opens]?.name||p.opens:null};
}
