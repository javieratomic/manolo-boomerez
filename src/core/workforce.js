import {serviceStaff} from './serviceModel.js';
// Oferta laboral local y viviendas: funciones puras, sin caja ni simulador.
import {BUSINESS_TYPES,OBRADOR_BASE,OBRADOR_UPGRADES} from '../data/businesses.js';
import {CITY_BY_ID} from '../data/cities.js';
import {researchFactor} from '../data/market.js';
import {execBonus} from './execs.js';

export const housingBeds = b => BUSINESS_TYPES.vivienda.beds + 5*((b.level||1)-1);
export const plannedStaff = (b,s) => {
 const t=BUSINESS_TYPES[b.type];
 if(b.mode==='franquicia'||b.type==='vivienda')return 0;
 if(t.model==='service'&&s)return serviceStaff(s,b);
 if(t.model==='care')return Math.ceil(t.staff*(1+10*((b.level||1)-1)/t.beds));
 return Math.ceil(t.staff*(1+0.1*((b.level||1)-1)));
};
export function factoryInstalled(s,city='selaya') {
 let units=0;
 if(city==='selaya')units=OBRADOR_BASE.capacity+25000*(s.obrador.expansions||0)+s.obrador.upgrades.reduce((n,id)=>n+(OBRADOR_UPGRADES.find(u=>u.id===id)?.capacity||0),0);
 else units=s.businesses.filter(b=>b.type==='obrador_regional'&&b.city===city).reduce((n,b)=>n+15000*(1+0.35*((b.level||1)-1)),0);
 return units*researchFactor(s,'production')*(1+execBonus(s,'operaciones'));
}
export const factoryLaborFactor = (s,city='selaya') => researchFactor(s,'laborFactor')*(city==='selaya'&&s.obrador.upgrades.includes('robot')?0.85:1);
export function workforcePlan(s,city='selaya') {
 const c=CITY_BY_ID[city];
 const beds=s.businesses.filter(b=>b.type==='vivienda'&&b.city===city).reduce((n,b)=>n+housingBeds(b),0);
 const base=Math.round(24+16*Math.sqrt(c.pop));
 const jobs=s.businesses.filter(b=>b.city===city&&BUSINESS_TYPES[b.type].model!=='production').map(b=>({b,n:plannedStaff(b,s)}));
 const other=jobs.reduce((n,x)=>n+x.n,0);
 const service=jobs.filter(x=>BUSINESS_TYPES[x.b.type].model==='service').reduce((n,x)=>n+x.n,0);
 const installed=factoryInstalled(s,city),labor=factoryLaborFactor(s,city);
 const factory=installed>0?(city==='selaya'?3+Math.ceil(installed*labor/3000):Math.ceil(8*installed*labor/15000)):0;
 const required=other+factory,available=base+4*beds;
 const maxFactory=Math.max(0,available-other);
 const effective=Math.min(installed,Math.max(0,city==='selaya'?(maxFactory-3)*3000/labor:maxFactory*15000/(8*labor)));
 return {city,beds,base,other,service,nonService:other-service,factory,required,available,installed,effective,requiredBeds:Math.ceil(Math.max(0,required-base)/4),missingBeds:Math.ceil(Math.max(0,required-available)/4)};
}
