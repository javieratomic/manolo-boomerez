import {test,assert,assertEq} from './runner.js';
import {newGame,serialize} from '../src/core/state.js';
import {resolvePending} from '../src/core/sim.js';
import {computeEconomy} from '../src/core/economy.js';
import {upgradeBusiness,upgradeCost} from '../src/core/market.js';
import {workforcePlan} from '../src/core/workforce.js';
const api=()=>import('../src/core/portfolio.js');
const started=()=>{const s=newGame(42);resolvePending(s,0);s.cash=1e8;s.pending=[];s.clausula=null;return s;};
const shop=(id,city='madrid',extra={})=>({id,type:'express',city,mode:'propia',level:1,value:30000,cond:70,...extra});

test('Cartera: negocios actuales, filtros sin tildes y países, sin informe ni mutación',async()=>{
 const {portfolio}=await api();const s=started();s.businesses=[shop(1),shop(2,'lisboa'),shop(3,'cordoba',{type:'gimnasio'}),shop(4,'selaya',{readyMonth:12})];
 s.lastReport={lines:[{id:99,city:'madrid',revenue:1e9,cost:0}]};const before=serialize(s);
 assertEq(portfolio(s).rows.length,4);assertEq(portfolio(s,{query:'CORDOBA'}).rows[0].id,3);
 assertEq(portfolio(s,{country:'portugal'}).rows[0].id,2);assertEq(portfolio(s,{category:'servicios'}).rows[0].id,3);
 assertEq(portfolio(s,{status:'construction'}).rows[0].id,4);assertEq(portfolio(s,{status:'upgradeable'}).rows.length,3);
 assertEq(serialize(s),before);
});

test('Cartera: distingue pérdidas del franquiciado del resultado positivo de la central',async()=>{
 const {portfolio}=await api();const s=started();s.businesses=Array.from({length:20},(_,i)=>shop(i+1,'selaya',{type:'maison',mode:'franquicia'}));
 const p=portfolio(s,{status:'losses'});assert(p.rows.length>0);assert(p.rows.some(r=>r.profit>=0&&r.franchiseeProfit<0));
 assert(p.rows.every(r=>!r.upgradeable));assertEq(portfolio(s,{status:'franchise'}).rows.length,20);
});

test('Reformas conjuntas: fondos insuficientes, selección inválida, obras y franquicias no dejan cambios parciales',async()=>{
 const {upgradeBatchPlan,upgradeBatch}=await api();
 for(const ids of [[1,2],[1,999],[1,'2'],[1,3],[1,4],[]]){
  const s=started();s.businesses=[shop(1),shop(2,'barcelona'),shop(3,'valencia',{readyMonth:6}),shop(4,'bilbao',{mode:'franquicia'})];s.cash=upgradeCost(s.businesses[0]);
  const before=serialize(s);assert(!upgradeBatchPlan(s,ids).ok);assert(!upgradeBatch(s,ids).ok);assertEq(serialize(s),before);
 }
});

test('Reformas conjuntas: empleo combinado puede bloquear dos reformas que caben por separado',async()=>{
 const {upgradeBatchPlan,upgradeBatch}=await api();const s=started();s.businesses=[shop(1,'selaya'),shop(2,'selaya')];
 while(workforcePlan(s).available-workforcePlan(s).required>1)s.businesses.push(shop(s.businesses.length+1,'selaya',{type:'airbnb',level:1}));
 assertEq(workforcePlan(s).available-workforcePlan(s).required,1);
 assert(upgradeBatchPlan(s,[1]).ok);assert(upgradeBatchPlan(s,[2]).ok);
 const before=serialize(s);assert(!upgradeBatch(s,[1,2]).ok);assertEq(serialize(s),before);
});

test('Reformas conjuntas: deduplica, prevé economía global y equivale a reformas individuales',async()=>{
 const {upgradeBatchPlan,upgradeBatch}=await api();const s=started();s.businesses=[shop(1),shop(2,'barcelona')];const before=serialize(s),expected=structuredClone(s);
 const p=upgradeBatchPlan(s,[2,1,1]);assert(p.ok,p.msg);assertEq(p.ids.length,2);assertEq(p.cost,upgradeCost(s.businesses[0])+upgradeCost(s.businesses[1]));assertEq(serialize(s),before);
 for(const id of p.ids)assert(upgradeBusiness(expected,id).ok);
 assertEq(p.after.net,computeEconomy(expected).net);assertEq(p.deltaNet,p.after.net-p.before.net);
 assert(upgradeBatch(s,[2,1,1]).ok);assertEq(serialize(s),serialize(expected));
 assertEq(s.businesses[0].cond,100);
});

test('Reformas conjuntas: viviendas antiguas primero habilitan el resto independientemente del orden solicitado',async()=>{
 const {upgradeBatchPlan,upgradeBatch}=await api();const s=started();s.obrador.expansions=8;
 s.businesses=[shop(1,'selaya'),shop(2,'selaya',{type:'vivienda',housingForm:'legacy',level:1,value:8e5})];
 assert(!upgradeBatchPlan(s,[1]).ok,'Sin la reforma de vivienda no cabe la tienda');
 const p=upgradeBatchPlan(s,[1,2]);assert(p.ok,p.msg);assertEq(p.ids[0],2);assert(upgradeBatch(s,[1,2]).ok);
 assertEq(s.businesses[0].level,2);assertEq(s.businesses[1].level,2);
});

test('Reformas conjuntas: confirmar recalcula presupuesto y rechaza nivel máximo',async()=>{
 const {upgradeBatchPlan,upgradeBatch}=await api();const s=started();s.businesses=[shop(1)];assert(upgradeBatchPlan(s,[1]).ok);
 s.cash=0;const before=serialize(s);assert(!upgradeBatch(s,[1]).ok);assertEq(serialize(s),before);
 s.cash=1e8;s.businesses[0].level=10;assert(!upgradeBatchPlan(s,[1]).ok);
});

test('Reformas conjuntas: una cotización revisada no autoriza niveles ni previsiones diferentes',async()=>{
 const {upgradeBatchPlan,upgradeBatch}=await api();const s=started();s.businesses=[shop(1)];const quote=upgradeBatchPlan(s,[1]);
 assert(upgradeBusiness(s,1).ok);const before=serialize(s);
 assert(!upgradeBatch(s,[1],quote).ok);assertEq(serialize(s),before);
});

test('Cartera: selección solo de negocios visibles por filtro y aún reformables',async()=>{
 const {portfolio,portfolioSelection}=await api();const s=started();s.businesses=[shop(1),shop(2,'barcelona'),shop(3,'madrid',{mode:'franquicia'})];
 assertEq(portfolioSelection(portfolio(s,{query:'madrid'}).rows,[1,2,3,999]).join(','),'1');
});
