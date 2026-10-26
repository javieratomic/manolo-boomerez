// Supuestos de un único cierre. No simula sucesos, tiempo ni nueva financiación.
import {computeEconomy} from './economy.js';
import {renovationSchedule} from './construction.js';
import {upgradeBatchPlan,upgradeBatch} from './portfolio.js';

export const STRESS_SCENARIOS=[
 {id:'current',label:'Condiciones actuales',demand:1,wages:1,description:'El mismo mes, sin cambios de demanda ni salarios.'},
 {id:'demand',label:'Demanda comercial −15 %',demand:.85,wages:1,description:'Reduce demanda de locales, mostrador del obrador y online. Los pedidos contratados y las regalías mantienen sus condiciones.'},
 {id:'wages',label:'Salario base +10 %',demand:1,wages:1.1,description:'Sube la base salarial de la plantilla ordinaria. Las becas y los sueldos fijos de directivos se mantienen.'},
 {id:'combined',label:'Ambos cambios',demand:.85,wages:1.1,description:'Combina menos demanda comercial y mayor salario base; producción y personal se recalculan juntos.'},
];
function scenario(state,assumption) {
 const c=structuredClone(state);
 if(assumption.demand!==1)c.mods.push({kind:'revenue',factor:assumption.demand,months:1,label:'Supuesto de demanda'});
 c.wageIndex=(c.wageIndex||1)*assumption.wages;
 const r=computeEconomy(c),payroll=r.costs.salarios+r.costs.directivos;
 const renewalsFuture=renovationSchedule(c).filter(x=>x.month>c.month).reduce((n,x)=>n+x.cost,0);
 const closingCash=c.cash+r.net,reserve=3*payroll+renewalsFuture,margin=closingCash-reserve;
 return {net:r.net,revenue:r.revenue,foreignRevenue:r.lines.filter(l=>l.foreign).reduce((n,l)=>n+l.revenue,0),
  closingCash,payroll,renewalsNow:r.costs.renovaciones,renewalsFuture,reserve,margin,
  employees:r.employees,fill:r.fill,status:closingCash<0?'deficit':margin<0?'thin':'covered'};
}
export function stressReport(s,ids=[],expectedItems=null) {
 let comparison=null,alternative=null;
 if(!Array.isArray(ids)||ids.length){
  comparison=upgradeBatchPlan(s,ids);
  if(comparison.ok&&expectedItems&&JSON.stringify(comparison.items)!==JSON.stringify(expectedItems))comparison={...comparison,ok:false,msg:'Los negocios o niveles del lote han cambiado. Vuelve a seleccionarlo en la cartera.'};
  if(comparison.ok){
   alternative=structuredClone(s);
   const applied=upgradeBatch(alternative,ids,comparison);
   if(!applied.ok){comparison=applied;alternative=null;}
  }
 }
 const rows=STRESS_SCENARIOS.map(assumption=>{
  const current=scenario(s,assumption),investment=alternative?scenario(alternative,assumption):null;
  return {id:assumption.id,current,investment,deltaNet:investment?investment.net-current.net:null};
 });
 return {month:s.month,comparison,rows};
}
