// Cartera y reformas en lote: mismas reglas del negocio individual, sobre copias.
import {BUSINESS_TYPES} from '../data/businesses.js';
import {CITY_BY_ID} from '../data/cities.js';
import {FOREIGN_BY_ID} from '../data/international.js';
import {computeEconomy} from './economy.js';
import {isOperating,businessName} from './construction.js';
import {upgradeCost,upgradeBusiness} from './market.js';
import {money} from './helpers.js';
import {saleValue} from './actions.js';

const normalized=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export const portfolioSelection=(rows,ids=[],operation='upgrade')=>rows.filter(r=>(operation==='sale'||r.upgradeable)&&ids.includes(r.id)).map(r=>r.id);
export function portfolio(s,filters={}) {
 const report=computeEconomy(s),lines=new Map(report.lines.map(l=>[l.id,l]));
 const all=s.businesses.map(b=>{
  const l=lines.get(b.id),country=CITY_BY_ID[b.city].country||'espana',operating=isOperating(s,b),cost=upgradeCost(b);
  return {id:b.id,type:b.type,city:b.city,country,category:BUSINESS_TYPES[b.type].category,
   name:businessName(b),mode:b.mode,level:b.level||1,operating,readyMonth:b.readyMonth,
   revenue:l?.revenue||0,profit:(l?.revenue||0)-(l?.cost||0),franchiseeProfit:l?.franchiseeProfit??0,
   upgradeable:operating&&cost!=null,upgradeCost:cost,cashOnSale:saleValue(b)};
 });
 const countries=[...new Set(all.map(r=>r.country))].map(id=>({id,name:id==='espana'?'España':FOREIGN_BY_ID[id].country})).sort((a,b)=>a.name.localeCompare(b.name,'es'));
 const categories=[...new Set(all.map(r=>r.category))].sort();
 const query=normalized(filters.query);
 const rows=all.filter(r=>{
  if(query&&!normalized(`${r.name} ${CITY_BY_ID[r.city].name} ${r.id}`).includes(query))return false;
  if(filters.country&&filters.country!=='all'&&r.country!==filters.country)return false;
  if(filters.category&&filters.category!=='all'&&r.category!==filters.category)return false;
  if(filters.status==='losses'&&(!r.operating||(r.mode==='franquicia'?r.franchiseeProfit:r.profit)>=0))return false;
  if(filters.status==='construction'&&r.operating)return false;
  if(filters.status==='upgradeable'&&!r.upgradeable)return false;
  if(filters.status==='franchise'&&r.mode!=='franquicia')return false;
  return true;
 });
 const result=r=>r.mode==='franquicia'?r.franchiseeProfit:r.profit;
 const compare={profitDesc:(a,b)=>result(b)-result(a),city:(a,b)=>CITY_BY_ID[a.city].name.localeCompare(CITY_BY_ID[b.city].name,'es'),level:(a,b)=>a.level-b.level}[filters.order]||((a,b)=>result(a)-result(b));
 rows.sort((a,b)=>compare(a,b)||a.id-b.id);
 return {rows,total:all.length,countries,categories};
}

const summary=r=>({net:r.net,fill:r.fill,employees:r.employees,capacity:r.capacity,produced:r.produced,totalDemand:r.totalDemand});
function prepareBatch(s,selection) {
 const fail=(msg,extra={})=>({plan:{ok:false,msg,ids:[],items:[],cost:0,...extra}});
 if(!Array.isArray(selection)||!selection.length||selection.some(id=>!Number.isInteger(id)||id<=0))return fail('Selecciona negocios válidos.');
 const ids=[...new Set(selection)].sort((a,b)=>a-b),items=[];
 for(const id of ids){
  const b=s.businesses.find(x=>x.id===id);if(!b)return fail('Uno de los negocios ya no existe.');
  const cost=upgradeCost(b);
  if(!isOperating(s,b)||cost==null)return fail(`${businessName(b)} de ${CITY_BY_ID[b.city].name} no se puede reformar ahora.`);
  items.push({id,city:b.city,name:businessName(b),from:b.level||1,to:(b.level||1)+1,cost});
 }
 // Viviendas antiguas pueden aportar plazas necesarias para otras reformas del lote.
 ids.sort((a,b)=>Number(s.businesses.find(x=>x.id===b).type==='vivienda')-Number(s.businesses.find(x=>x.id===a).type==='vivienda')||a-b);
 const cost=items.reduce((n,x)=>n+x.cost,0),base={ids,items,cost,month:s.month};
 if(s.cash<cost)return fail(`Necesitas ${money(cost)} para el lote completo.`,base);
 const candidate=structuredClone(s);
 for(const id of ids){const check=upgradeBusiness(candidate,id);if(!check.ok)return fail(check.msg,base);}
 const before=summary(computeEconomy(s)),after=summary(computeEconomy(candidate));
 return {candidate,plan:{ok:true,...base,before,after,deltaNet:after.net-before.net}};
}
export const upgradeBatchPlan=(s,ids)=>prepareBatch(s,ids).plan;
const quotation=p=>JSON.stringify({month:p.month,items:p.items,cost:p.cost,before:p.before,after:p.after});
export function upgradeBatch(s,ids,reviewedPlan=null) {
 const {plan,candidate}=prepareBatch(s,ids);if(!plan.ok)return plan;
 if(reviewedPlan&&quotation(plan)!==quotation(reviewedPlan))return {ok:false,msg:'La previsión ha cambiado. Revisa de nuevo el lote antes de confirmarlo.'};
 for(const id of plan.ids){
  const b=s.businesses.find(x=>x.id===id),after=candidate.businesses.find(x=>x.id===id);
  b.level=after.level;b.cond=after.cond;b.value=after.value;
 }
 s.cash=candidate.cash;s.log=candidate.log;
 return {ok:true,count:plan.ids.length,cost:plan.cost};
}
