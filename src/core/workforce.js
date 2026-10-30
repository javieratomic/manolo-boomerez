import {serviceStaff} from './serviceModel.js';
import {onlineStaff} from '../data/online.js';
import {housingSpec} from '../data/housing.js';
import {isOperating} from './construction.js';
// Oferta laboral local y viviendas: funciones puras, sin caja ni simulador.
import {BUSINESS_TYPES,OBRADOR_BASE,OBRADOR_UPGRADES} from '../data/businesses.js';
import {CITY_BY_ID} from '../data/cities.js';
import {researchFactor} from '../data/market.js';
import {execBonus} from './execs.js';
import {dateLabel} from './helpers.js';

export const housingBeds = b => housingSpec(b).units;
// `ready` decide qué obras cuentan como entregadas (por defecto, las de hoy).
export const plannedStaff = (b,s,ready=null) => {
 const t=BUSINESS_TYPES[b.type];
 if(s&&!(ready?ready(b):isOperating(s,b)))return 0;
 if(b.mode==='franquicia'||b.type==='vivienda')return 0;
 if(t.model==='service'&&s)return serviceStaff(s,b);
 if(t.model==='care')return Math.ceil(t.staff*(1+10*((b.level||1)-1)/t.beds));
 return Math.ceil(t.staff*(1+0.1*((b.level||1)-1)));
};
export function factoryInstalled(s,city='selaya',ready=b=>isOperating(s,b)) {
 let units=0;
 if(city==='selaya')units=OBRADOR_BASE.capacity+25000*(s.obrador.expansions||0)+s.obrador.upgrades.reduce((n,id)=>n+(OBRADOR_UPGRADES.find(u=>u.id===id)?.capacity||0),0);
 else units=s.businesses.filter(b=>b.type==='obrador_regional'&&b.city===city&&ready(b)).reduce((n,b)=>n+15000*(1+0.35*((b.level||1)-1)),0);
 return units*researchFactor(s,'production')*(1+execBonus(s,'operaciones'));
}
export const factoryLaborFactor = (s,city='selaya') => researchFactor(s,'laborFactor')*(city==='selaya'&&s.obrador.upgrades.includes('robot')?0.85:1);
// Plazas que faltarán en el peor de los meses que vienen: hoy y cada entrega de obra pendiente en la ciudad.
// Un local en obras no contrata todavía, pero contratará: abrir otro a su lado no puede saltarse esa cuenta.
// Solo cambia qué obras están entregadas; la demanda y la temporada son las de hoy. Devuelve {missing, month}.
export function missingBedsAhead(s,city) {
 const months=[...new Set(s.businesses.filter(b=>b.city===city&&b.readyMonth!=null&&b.readyMonth>s.month).map(b=>b.readyMonth))].sort((a,b)=>a-b);
 let worst={missing:workforcePlan(s,city).missingBeds,month:s.month};
 for(const m of months){const missing=workforcePlan(s,city,m).missingBeds;if(missing>worst.missing)worst={missing,month:m};}
 return worst;
}
// Falta de vivienda hoy o cuando se entregue una obra de la ciudad (las viviendas tardan 12 meses en llegar).
export function bedsMessage(s,gap,cityName) {
  if(gap.month<=s.month)return `Faltan ${gap.missing} plazas de vivienda para contratar en ${cityName}. Cómpralas desde Equipo → Viviendas.`;
  return `Cuando se entregue la obra de ${dateLabel(gap.month).toLowerCase().replace(" ", " de ")} faltarán ${gap.missing} plazas de vivienda en ${cityName}. Una vivienda nueva tarda 12 meses: espera a esa entrega o a tener plazas de sobra.`;
}
export function workforcePlan(s,city='selaya',at=s.month) {
 const c=CITY_BY_ID[city];
 const ready=at===s.month?b=>isOperating(s,b):b=>b.readyMonth==null||at>=b.readyMonth;
 const beds=s.businesses.filter(b=>b.type==='vivienda'&&b.city===city&&ready(b)).reduce((n,b)=>n+housingBeds(b),0);
 const base=Math.round(24+16*Math.sqrt(c.pop));
 const jobs=s.businesses.filter(b=>b.city===city&&BUSINESS_TYPES[b.type].model!=='production').map(b=>({b,n:plannedStaff(b,s,ready)}));
 const online=city==='selaya'?onlineStaff(s):0;
 const other=jobs.reduce((n,x)=>n+x.n,0)+online;
 const service=jobs.filter(x=>BUSINESS_TYPES[x.b.type].model==='service').reduce((n,x)=>n+x.n,0);
 const installed=factoryInstalled(s,city,ready),labor=factoryLaborFactor(s,city);
 const factory=installed>0?(city==='selaya'?3+Math.ceil(installed*labor/3000):Math.ceil(8*installed*labor/15000)):0;
 const required=other+factory,available=base+4*beds;
 const maxFactory=Math.max(0,available-other);
 const effective=Math.min(installed,Math.max(0,city==='selaya'?(maxFactory-3)*3000/labor:maxFactory*15000/(8*labor)));
 return {city,beds,base,other,service,nonService:other-service,onlineStaff:Math.floor(online*Math.min(1,available/Math.max(1,other))),factory,required,available,installed,effective,requiredBeds:Math.ceil(Math.max(0,required-base)/4),missingBeds:Math.ceil(Math.max(0,required-available)/4)};
}
