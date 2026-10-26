import {test,assert,assertEq} from './runner.js';
import {newGame,serialize,deserialize} from '../src/core/state.js';
import {resolvePending} from '../src/core/sim.js';
import {computeEconomy} from '../src/core/economy.js';
import {upgradeBatch,upgradeBatchPlan} from '../src/core/portfolio.js';
import {renovationCost} from '../src/core/construction.js';
import {foreignDemand} from '../src/core/international.js';
import {signAgreement} from '../src/core/international.js';
import {openOnline} from '../src/core/online.js';
import {refreshCandidates,hireExec} from '../src/core/execs.js';
const api=()=>import('../src/core/stress.js');
const started=()=>{const s=newGame(42);resolvePending(s,0);s.cash=1e7;s.pending=[];s.clausula=null;return s;};
const shop=(id,extra={})=>({id,type:'express',city:'madrid',mode:'propia',level:1,value:3e4,cond:80,...extra});
const home=(id,renewalMonth)=>shop(id,{type:'vivienda',housingForm:'apartamentos',city:'selaya',value:2e6,readyMonth:0,renewalMonth});

test('Resistencia: cuatro escenarios puros y actual coincide con economía real',async()=>{
 const {stressReport}=await api();const s=started();s.businesses=[shop(1)];const before=serialize(s),r=computeEconomy(s),p=stressReport(s);
 assertEq(p.rows.length,4);assertEq(p.rows[0].current.net,r.net);assertEq(p.rows[0].current.closingCash,s.cash+r.net);
 assertEq(p.rows[0].investment,null);assertEq(p.comparison,null);assertEq(serialize(s),before);
 stressReport(s);assertEq(serialize(s),before);
});

test('Resistencia: demanda, base salarial y combinación reutilizan las reglas completas del juego',async()=>{
 const {stressReport}=await api();const s=started();s.businesses=[shop(1),shop(2,{type:'gimnasio',city:'barcelona'})];const p=stressReport(s);
 for(const [index,demand,wages] of [[1,.85,1],[2,1,1.1],[3,.85,1.1]]){
  const c=structuredClone(s);if(demand!==1)c.mods.push({kind:'revenue',factor:demand,months:1,label:'Supuesto de demanda'});c.wageIndex=(c.wageIndex||1)*wages;
  const r=computeEconomy(c);assertEq(p.rows[index].current.net,r.net);assertEq(p.rows[index].current.payroll,r.costs.salarios+r.costs.directivos);
  assertEq(p.rows[index].current.employees,r.employees);assertEq(p.rows[index].current.fill,r.fill);
 }
});

test('Resistencia: inversión se descuenta una vez y previsión equivale a aplicar lote en copia',async()=>{
 const {stressReport}=await api();const s=started();s.businesses=[shop(1),shop(2,{city:'barcelona'})];const before=serialize(s),p=stressReport(s,[2,1,1]);
 const c=structuredClone(s);assert(upgradeBatch(c,[1,2]).ok);const r=computeEconomy(c);
 assert(p.comparison.ok);assertEq(p.comparison.ids.length,2);assertEq(p.rows[0].investment.closingCash,s.cash-p.comparison.cost+r.net);
 assertEq(p.rows[0].investment.net,r.net);assertEq(p.rows[0].deltaNet,upgradeBatchPlan(s,[1,2]).deltaNet);
 assertEq(serialize(s),before);
});

test('Resistencia: renovar este mes ya entra en resultado y no vuelve a entrar en colchón futuro',async()=>{
 const {stressReport}=await api();const s=started();s.month=200;s.businesses=[home(1,190),home(2,212),home(3,213)];
 const r=stressReport(s).rows[0].current;
 assertEq(r.renewalsNow,renovationCost(s.businesses[0]));assertEq(r.renewalsFuture,renovationCost(s.businesses[1]));
 assertEq(r.reserve,3*r.payroll+r.renewalsFuture);assertEq(r.margin,r.closingCash-r.reserve);
 assertEq(s.businesses[0].renewalMonth,190);
});

test('Resistencia: lote obsoleto o no financiable conserva escenarios actuales sin compras parciales',async()=>{
 const {stressReport}=await api();const s=started();s.businesses=[shop(1)];s.cash=0;const before=serialize(s);
 for(const ids of [[1],[999]]){const p=stressReport(s,ids);assert(!p.comparison.ok);assertEq(p.rows.length,4);assert(p.rows.every(x=>x.investment===null));}
 assertEq(serialize(s),before);
});

test('Resistencia: pedidos extranjeros y regalías no sufren una reducción ficticia de demanda',async()=>{
 const {stressReport}=await api();const s=started();assert(signAgreement(s,'portugal','licence',false).ok);const baseDemand=foreignDemand(s);
 const c=structuredClone(s);c.mods.push({kind:'revenue',factor:.85,months:1});assertEq(foreignDemand(c),baseDemand);
 const p=stressReport(s);assertEq(p.rows[0].current.foreignRevenue,p.rows[1].current.foreignRevenue,'La licencia mantiene ingresos aunque cambien las ventas del mostrador');
});

test('Resistencia: carga conserva resultados y caja negativa se distingue de colchón insuficiente',async()=>{
 const {stressReport}=await api();const s=started();s.cash=-1e6;const p=stressReport(s);assertEq(p.rows[0].current.status,'deficit');
 assertEq(JSON.stringify(stressReport(deserialize(serialize(s)))),JSON.stringify(p));
 s.cash=10000;const thin=stressReport(s).rows[0].current;assert(thin.closingCash>0);assert(thin.margin<0);assertEq(thin.status,'thin');
});

test('Resistencia: online, becas y directivos mantienen sus reglas bajo presión salarial y comercial',async()=>{
 const {stressReport}=await api();const s=started();s.obrador.expansions=2;s.policies.becarios='legion';
 assert(openOnline(s).ok);refreshCandidates(s);assert(hireExec(s,s.candidates.find(x=>x.pos==='finanzas').id).ok);
 const p=stressReport(s),c=structuredClone(s);c.mods.push({kind:'revenue',factor:.85,months:1});c.wageIndex*=1.1;
 const expected=computeEconomy(c);assert(expected.online.potentialUnits>0);assertEq(p.rows[3].current.net,expected.net);
 assert(p.rows[2].current.payroll<p.rows[0].current.payroll*1.1,'Las becas y sueldos fijos no se indexan');
});

test('Resistencia: reformar turísticos aumenta también la renovación futura que habrá que reservar',async()=>{
 const {stressReport}=await api();const s=started();s.businesses=[shop(1,{type:'airbnb',renewalMonth:6,readyMonth:0,value:12e5})];
 const p=stressReport(s,[1]);assert(p.comparison.ok);assert(p.rows[0].investment.renewalsFuture>p.rows[0].current.renewalsFuture);
 const c=structuredClone(s);assert(upgradeBatch(c,[1]).ok);assertEq(p.rows[0].investment.renewalsFuture,renovationCost(c.businesses[0]));
});

test('Resistencia: un lote ya reformado no se convierte silenciosamente en una propuesta de otro nivel',async()=>{
 const {stressReport}=await api();const s=started();s.businesses=[shop(1)];const quote=upgradeBatchPlan(s,[1]);
 assert(upgradeBatch(s,[1]).ok);const before=serialize(s),p=stressReport(s,[1],quote.items);
 assert(!p.comparison.ok);assert(p.rows.every(x=>x.investment===null));assertEq(serialize(s),before);
});
