// Tarifas por plaza residencial, con prioridad de acceso para empleados locales.
import {CITY_BY_ID} from '../data/cities.js';
import {POLICIES} from '../data/policies.js';

export const PUBLIC_RENTS={
 cerrado:{label:'Solo empleados',factor:0,demand:0},
 economico:{label:'Económico',factor:0.8,demand:0.95},
 mercado:{label:'Mercado',factor:1,demand:0.8},
 premium:{label:'Premium',factor:1.3,demand:0.5},
};
export function housingTerms(s,city) {
 const local=s.housingPolicies?.[city]||{};
 const employee=local.employee||s.policies.alquiler,publicKey=local.public||'mercado';
 const e=POLICIES.alquiler.options[employee],p=PUBLIC_RENTS[publicKey],c=CITY_BY_ID[city];
 const scale=Math.pow(c.rent/0.9,0.7);
 return {employee,public:publicKey,employeeRent:Math.round(e.rent*scale),publicRent:Math.round(700*scale*p.factor),publicDemand:Math.floor((8+12*c.pop)*p.demand),moral:e.moral,insp:e.insp};
}
export function setHousingPolicy(s,city,group,value) {
 if(!CITY_BY_ID[city]||!['employee','public'].includes(group)||!(group==='employee'?Object.hasOwn(POLICIES.alquiler.options,value):Object.hasOwn(PUBLIC_RENTS,value)))return {ok:false,msg:'Tarifa o ciudad desconocida.'};
 if(!s.businesses.some(b=>b.type==='vivienda'&&b.city===city))return {ok:false,msg:'Primero compra viviendas en esta ciudad.'};
 s.housingPolicies||={};s.housingPolicies[city]||={};s.housingPolicies[city][group]=value;
 return {ok:true};
}

export const hasAbusiveHousing=s=>s.businesses.some(b=>{
 if(b.type!=='vivienda'||housingTerms(s,b.city).employee!=='abusivo')return false;
 const lines=s.lastReport?.lines||[];
 const local=lines.find(l=>l.id===b.id&&l.type==='vivienda');
 if(typeof local?.employeeOccupied==='number')return local.employeeOccupied>0;
 return (s.lastReport?.housed||0)>0&&lines.some(l=>l.city===b.city&&l.staff>0);
});
export function housingLaborSeverity(s) {
 const r=s.lastReport;
 const homes=s.businesses.filter(b=>b.type==='vivienda');
 if(!homes.length||!r?.control)return 0;
 const rate=city=>({social:0,mercado:0.2,abusivo:1.5})[housingTerms(s,city).employee];
 const lines=(r.lines||[]).filter(l=>l.type==='vivienda'&&typeof l.employeeOccupied==='number');
 if(lines.length)return lines.reduce((n,l)=>n+(homes.some(b=>b.id===l.id)?rate(l.city)*l.employeeOccupied:0),0)/Math.max(1,r.employees);
 // Informes de partidas antiguas sin desglose: reparto por plazas, manteniendo su control.
 const beds=b=>10+5*((b.level||1)-1),total=homes.reduce((n,b)=>n+beds(b),0);
 return homes.reduce((n,b)=>n+rate(b.city)*beds(b),0)/total*r.control;
}
