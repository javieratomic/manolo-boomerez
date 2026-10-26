// Fechas absolutas: cargar o prever no adelanta obras ni factura renovaciones.
import {BUSINESS_TYPES} from '../data/businesses.js';
import {CITY_BY_ID} from '../data/cities.js';
import {housingSpec} from '../data/housing.js';
import {log,money} from './helpers.js';

export const isOperating=(s,b)=>b.readyMonth==null||s.month>=b.readyMonth;
export const buildMonths=type=>({vivienda:12,airbnb:12,obrador_regional:6,telecom:6})[type]||0;
export const isResidential=b=>b.type==='vivienda'||b.type==='airbnb';
export const businessName=b=>b.type==='vivienda'?housingSpec(b).name:BUSINESS_TYPES[b.type].name;
export const businessSprite=b=>b.type==='vivienda'?housingSpec(b).sprite:BUSINESS_TYPES[b.type].sprite;
export function renovationCost(b) {
 if(!isResidential(b))return 0;
 const c=CITY_BY_ID[b.city],t=BUSINESS_TYPES[b.type];
 const base=b.type==='vivienda'?housingSpec(b).cost*housingSpec(b).units/(b.housingForm==='chalets'?10:b.housingForm==='apartamentos'?25:10):t.cost*(t.flats+2*((b.level||1)-1))/t.flats;
 return Math.round(base*(0.25+c.rent/1.2)*0.2);
}
export const renewalDue=(s,b)=>isResidential(b)&&isOperating(s,b)&&Number.isInteger(b.renewalMonth)&&s.month>=b.renewalMonth;
export function renovationSchedule(s) {
 return s.businesses.filter(b=>isResidential(b)&&Number.isInteger(b.renewalMonth)).map(b=>({
  id:b.id,city:b.city,type:b.type,name:businessName(b),month:Math.max(s.month,b.renewalMonth,b.readyMonth??s.month),cost:renovationCost(b),
 })).filter(x=>x.month<=s.month+12).sort((a,b)=>a.month-b.month||a.id-b.id);
}
export function applyRenovations(s,report,silent=false) {
 for(const charge of report.renovations||[]) {
  const b=s.businesses.find(x=>x.id===charge.id);if(!b||!renewalDue(s,b))continue;
  b.renewalMonth=s.month+180;b.cond=100;
  if(!silent)log(s,`🏘️ Renovación de ${businessName(b)} en ${CITY_BY_ID[b.city].name}: ${money(charge.cost)}. Próxima revisión en 15 años.`,'info');
 }
}
export function announceCompletions(s) {
 for(const b of s.businesses)if(b.readyMonth===s.month&&!b.delivered){
  b.delivered=true;log(s,`🏗️ Obra terminada: ${businessName(b)} en ${CITY_BY_ID[b.city].name}. Ya está disponible.`,'good');
  s.notices.push({title:'Obra terminada',text:`${businessName(b)} en ${CITY_BY_ID[b.city].name} empieza a funcionar este mes.`});
 }
}
