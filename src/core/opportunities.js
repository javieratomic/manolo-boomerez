// Alternativas independientes: nunca se consume un cupón ni se abre sobre el original al consultar.
import {BUSINESS_TYPES} from '../data/businesses.js';
import {ALL_CITIES,CITIES,CITY_BY_ID} from '../data/cities.js';
import {FOREIGN_BY_ID} from '../data/international.js';
import {canOpen,openBusiness,openingCost,franchiseFee,sobaoTypeId} from './actions.js';
import {buildMonths} from './construction.js';
import {computeEconomy,patrimonio} from './economy.js';

export const immediateOpeningTypes=s=>Object.values(BUSINESS_TYPES).filter(t=>!buildMonths(t.id)&&(t.category!=='sobaos'||t.id===sobaoTypeId(s))).map(t=>({
 id:t.id,name:t.name,enabled:t.category==='sobaos'||!!s.unlocked[t.id]&&(t.id!=='empanadas'||!!s.flags.primoSocio),
}));
const summary=(s,r)=>({cash:s.cash,net:r.net,fill:r.fill,capacity:r.capacity,employees:r.employees,wealth:patrimonio(s)});
// eco: computeEconomy(s) ya calculado (la caché de opciones lo comparte entre filas); si no, se calcula aquí.
export function openingPlan(s,input,eco=null) {
 const choice={type:input?.type,city:input?.city,mode:input?.mode||'propia'};
 const t=BUSINESS_TYPES[choice.type],city=CITY_BY_ID[choice.city];
 const fail=(msg,extra={})=>({ok:false,choice,msg,cost:0,fee:0,...extra});
 if(!t||!city||!['propia','franquicia'].includes(choice.mode))return fail('Negocio, ciudad o modalidad desconocidos.');
 if(buildMonths(t.id))return fail('Este comparador reúne aperturas inmediatas. Planifica esta obra desde Ciudad o Viviendas.');
 // canOpen deja la partida como estaba: se comprueba sin clonar (el clon es lo caro con muchos negocios).
 const cost=openingCost(s,t.id,choice.mode,choice.city),fee=choice.mode==='franquicia'&&t.category==='sobaos'?franchiseFee(s,t.id):0;
 const check=canOpen(s,t.id,choice.city,choice.mode);
 if(!check.ok){
  // Si solo falta caja, la estimación sigue siendo lo que hace falta para decidir si pedir un préstamo:
  // se calcula como si tuvieras justo el desembolso (la caja no cambia las cuentas del mes).
  const rich=structuredClone(s);rich.cash=Math.max(rich.cash,cost);
  if(cost<=s.cash||!canOpen(rich,t.id,choice.city,choice.mode).ok)return fail(check.msg,{cost,fee});
  const base=(eco||computeEconomy(s)).net,o=openBusiness(rich,t.id,choice.city,choice.mode);if(!o.ok)return fail(check.msg,{cost,fee});
  const r=computeEconomy(rich);
  return fail(check.msg,{cost,fee,cashShort:cost-s.cash,deltaNet:r.net-base,franchiseeProfit:choice.mode==='franquicia'?r.lines.find(l=>l.id===o.business.id).franchiseeProfit:null});
 }
 const c=structuredClone(s),before=summary(s,eco||computeEconomy(s)),opened=openBusiness(c,t.id,choice.city,choice.mode);
 if(!opened.ok)return fail(opened.msg,{cost,fee});
 const r=computeEconomy(c),after=summary(c,r),businessId=opened.business.id;
 return {ok:true,choice,month:s.month,businessId,cost,fee,before,after,cashAfter:c.cash,cashDelta:c.cash-s.cash,
  goalCash:Math.round((c.cash-s.cash-(fee-cost))*100)/100,
  deltaNet:after.net-before.net,
  franchiseeProfit:choice.mode==='franquicia'?r.lines.find(l=>l.id===businessId).franchiseeProfit:null,
  clauseBreaks:!s.clausula?.broken&&!!c.clausula?.broken,
 };
}
const quotation=p=>JSON.stringify({choice:p.choice,month:p.month,businessId:p.businessId,cost:p.cost,fee:p.fee,before:p.before,after:p.after,goalCash:p.goalCash,franchiseeProfit:p.franchiseeProfit,clauseBreaks:p.clauseBreaks});
// Ancla del estudio: conserva qué apertura y qué precio se estaban valorando, no el mes simulado.
export const openingIntent=p=>JSON.stringify({type:p?.choice?.type,city:p?.choice?.city,mode:p?.choice?.mode,businessId:p?.businessId,cost:p?.cost,fee:p?.fee,goalCash:p?.goalCash});
export function executeOpening(s,choice,reviewedPlan=null) {
 const p=openingPlan(s,choice);if(!p.ok)return p;
 if(reviewedPlan&&quotation(p)!==quotation(reviewedPlan))return {ok:false,msg:'La apertura ha cambiado. Revisa la nueva cotización antes de confirmar.'};
 return openBusiness(s,p.choice.type,p.choice.city,p.choice.mode);
}
const normalized=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
// Una sola partida en memoria. La cotización de revisión/ejecución nunca usa esta caché.
// Las cuentas actuales (computeEconomy) se calculan una vez por instantánea, no una por fila.
let cachedSnapshot=null,cachedOptions=new Map(),cachedEco=null;
const planCache=s=>{const snapshot=JSON.stringify(s);if(snapshot!==cachedSnapshot){cachedSnapshot=snapshot;cachedOptions=new Map();cachedEco=null;}
 return (type,city,mode)=>{const key=`${type}:${city}:${mode}`;if(!cachedOptions.has(key))cachedOptions.set(key,openingPlan(s,{type,city,mode},cachedEco||=computeEconomy(s)));return cachedOptions.get(key);};};
// La misma cifra que Imperio → Aperturas: cambio del neto de toda la empresa (después de impuestos y con los
// premios de objetivos que dispara la apertura). delta es null si la apertura está bloqueada por algo más que la caja.
export function openingDelta(s,type,city,mode='propia') {
 const p=planCache(s)(type,city,mode);
 return {ok:p.ok,delta:p.deltaNet??null,franchiseeProfit:p.franchiseeProfit??null,fillAfter:p.after?.fill??null,msg:p.msg??null};
}
// Ciudades recomendadas para la primera tienda (Ciudad): las mejores aperturas posibles ahora en España.
export function starterOpenings(s,n=4) {
 const type=sobaoTypeId(s),plan=planCache(s);
 return CITIES.filter(x=>!x.hq).flatMap(x=>['propia','franquicia'].map(mode=>{const p=plan(type,x.id,mode);return {city:x.id,mode,ok:p.ok,delta:p.deltaNet??null,franchiseeProfit:p.franchiseeProfit??null,fillAfter:p.after?.fill??null};}))
  .filter(r=>r.ok&&r.delta>0&&(r.mode==='propia'||r.franchiseeProfit>=0)).sort((a,b)=>b.delta-a.delta).slice(0,n);
}
export function openingOpportunities(s,filters={}) {
 const type=filters.type||sobaoTypeId(s),t=BUSINESS_TYPES[type],query=normalized(filters.query);
 const countries=[...new Set(ALL_CITIES.map(c=>c.country||'espana'))].map(id=>({id,name:id==='espana'?'España':FOREIGN_BY_ID[id].country})).sort((a,b)=>a.name.localeCompare(b.name,'es'));
 if(!t||buildMonths(type))return {rows:[],countries,type,error:'Elige un negocio de apertura inmediata.'};
 const mode=filters.mode||(t.category==='sobaos'?'both':'propia');
 if(!['both','propia','franquicia'].includes(mode))return {rows:[],countries,type,error:'Modalidad desconocida.'};
 const modes=mode==='both'?(t.category==='sobaos'?['propia','franquicia']:['propia']):[mode];
 const plan=planCache(s);
 const rows=ALL_CITIES.filter(c=>(!filters.country||filters.country==='all'||(c.country||'espana')===filters.country)&&(!query||normalized(c.name).includes(query)))
  .flatMap(c=>modes.map(mode=>plan(type,c.id,mode))).filter(r=>filters.showBlocked||r.ok);
 const compare={cost:(a,b)=>a.cost-b.cost,city:(a,b)=>CITY_BY_ID[a.choice.city].name.localeCompare(CITY_BY_ID[b.choice.city].name,'es')}[filters.order]||((a,b)=>(b.deltaNet??-Infinity)-(a.deltaNet??-Infinity));
 // Las bloqueadas solo por caja tienen estimación y se ordenan junto a las disponibles (a igualdad, primero la disponible).
 const rank=r=>r.ok?2:r.deltaNet!=null?1:0;
 rows.sort((a,b)=>Number(rank(b)>0)-Number(rank(a)>0)||compare(a,b)||rank(b)-rank(a)||a.choice.city.localeCompare(b.choice.city)||a.choice.mode.localeCompare(b.choice.mode));
 return {rows:structuredClone(rows),countries,type};
}
