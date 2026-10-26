// Venta y rescisión atómicas, usando los precios y reglas de la acción individual.
import {sellBusiness,saleValue} from './actions.js';
import {computeEconomy,patrimonio} from './economy.js';
import {businessName} from './construction.js';
import {operationsPlan} from './operations.js';
import {europeProgress} from './dynasty.js';

function summary(s) {
 const r=computeEconomy(s),e=europeProgress(s);
 return {cash:s.cash,wealth:patrimonio(s),net:r.net,capacity:r.capacity,fill:r.fill,employees:r.employees,beds:r.beds,countries:e.countries,sectors:e.sectors};
}
function prepareSale(s,selection) {
 const fail=(msg,extra={})=>({plan:{ok:false,msg,ids:[],items:[],proceeds:0,payouts:0,cashDelta:0,...extra}});
 if(!Array.isArray(selection)||!selection.length||selection.some(id=>!Number.isInteger(id)||id<=0))return fail('Selecciona negocios válidos para vender o rescindir.');
 const ids=[...new Set(selection)].sort((a,b)=>a-b),items=[];
 for(const id of ids){
  const b=s.businesses.find(x=>x.id===id);if(!b)return fail('Uno de los negocios ya no existe.');
  items.push({id,city:b.city,type:b.type,mode:b.mode,name:businessName(b),level:b.level||1,value:saleValue(b),readyMonth:b.readyMonth??null});
 }
 const byId=new Map(items.map(x=>[x.id,x]));
 ids.sort((a,b)=>Number(byId.get(a).value<0)-Number(byId.get(b).value<0)||a-b);
 const proceeds=items.reduce((n,x)=>n+Math.max(0,x.value),0),payouts=items.reduce((n,x)=>n+Math.max(0,-x.value),0);
 const base={month:s.month,ids,items,proceeds,payouts,cashDelta:proceeds-payouts,campaign:s.campaign};
 const candidate=structuredClone(s);
 for(const id of ids){const result=sellBusiness(candidate,id);if(!result.ok)return fail(result.msg,base);}
 const before=summary(s),after=summary(candidate),oldPlan=operationsPlan(s),newPlan=operationsPlan(candidate);
 const oldNeeds=new Map(oldPlan.timeline.flatMap(t=>t.cities.map(r=>[`${t.month}:${r.city}`,r.missingBeds])));
 const workforceRisks=newPlan.shortages.flatMap(r=>{
  const worseMonths=newPlan.timeline.flatMap(t=>{
   const missingBeds=t.cities.find(c=>c.city===r.city).missingBeds;
   const extraBeds=missingBeds-(oldNeeds.get(`${t.month}:${r.city}`)||0);
   return extraBeds>0?[{month:t.month,missingBeds,extraBeds}]:[];
  });
  return worseMonths.length?[{...r,worseMonths}]:[];
 });
 return {candidate,plan:{ok:true,...base,before,after,deltaNet:after.net-before.net,workforceRisks}};
}
export const saleBatchPlan=(s,ids)=>prepareSale(s,ids).plan;
const quotation=p=>JSON.stringify({month:p.month,items:p.items,cashDelta:p.cashDelta,before:p.before,after:p.after,workforceRisks:p.workforceRisks});
export function saleBatch(s,ids,reviewedPlan=null) {
 const {plan,candidate}=prepareSale(s,ids);if(!plan.ok)return plan;
 if(reviewedPlan&&quotation(plan)!==quotation(reviewedPlan))return {ok:false,msg:'La reestructuración ha cambiado. Revisa de nuevo el lote antes de confirmarlo.'};
 for(const id of plan.ids)s.businesses.splice(s.businesses.findIndex(b=>b.id===id),1);
 s.cash=candidate.cash;s.log=candidate.log;
 return {ok:true,count:plan.ids.length,cashDelta:plan.cashDelta,proceeds:plan.proceeds,payouts:plan.payouts};
}
