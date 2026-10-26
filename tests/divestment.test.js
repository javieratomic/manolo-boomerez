import {test,assert,assertEq} from './runner.js';
import {newGame,serialize} from '../src/core/state.js';
import {resolvePending} from '../src/core/sim.js';
import {sellBusiness,saleValue} from '../src/core/actions.js';
import {computeEconomy} from '../src/core/economy.js';
import {stressReport} from '../src/core/stress.js';
import {portfolio,portfolioSelection} from '../src/core/portfolio.js';
const api=()=>import('../src/core/divestment.js');
const started=()=>{const s=newGame(42);resolvePending(s,0);s.cash=1e7;s.clausula=null;s.pending=[];return s;};
const shop=(id,extra={})=>({id,type:'express',city:'madrid',mode:'propia',level:1,value:3e4,...extra});

test('Reestructuración: ventas e indemnizaciones separadas, con precio histórico del canon',async()=>{
 const {saleBatchPlan}=await api();const s=started();s.businesses=[shop(1),shop(2,{mode:'franquicia',fee:42000})];const before=serialize(s),p=saleBatchPlan(s,[2,1,1]);
 assert(p.ok);assertEq(p.ids.join(','),'1,2');assertEq(p.proceeds,18000);assertEq(p.payouts,42000);assertEq(p.cashDelta,-24000);assertEq(p.items.length,2);assertEq(serialize(s),before);
});

test('Reestructuración: obtener caja por reventa muestra también la pérdida patrimonial',async()=>{
 const {saleBatchPlan}=await api();const s=started();s.businesses=[shop(1,{value:1e5})];const p=saleBatchPlan(s,[1]);
 assertEq(p.cashDelta,60000);assertEq(p.after.wealth-p.before.wealth,-40000);
});

test('Reestructuración: ingresos de ventas financian rescisión dentro del lote, sin depender del orden pedido',async()=>{
 const {saleBatch,saleBatchPlan}=await api();const s=started();s.cash=0;s.businesses=[shop(1,{mode:'franquicia',fee:25000}),shop(2,{value:1e5})];
 const p=saleBatchPlan(s,[1,2]);assert(p.ok,p.msg);assertEq(p.ids.join(','),'2,1');assert(saleBatch(s,[1,2]).ok);assertEq(s.cash,35000);assertEq(s.businesses.length,0);
});

test('Reestructuración: insuficiencia de fondos e ids inválidos no dejan ventas parciales',async()=>{
 const {saleBatch,saleBatchPlan}=await api();
 for(const ids of [[1,2],[1,999],[1,'2'],[]]){const s=started();s.cash=0;s.businesses=[shop(1),shop(2,{mode:'franquicia',fee:40000})];const before=serialize(s);assert(!saleBatchPlan(s,ids).ok);assert(!saleBatch(s,ids).ok);assertEq(serialize(s),before);}
});

test('Reestructuración: descubierto, obras y nivel máximo conservan reglas individuales y estado completo',async()=>{
 const {saleBatchPlan,saleBatch}=await api();const s=started();s.cash=-1e6;s.businesses=[shop(1,{level:10}),shop(2,{type:'vivienda',housingForm:'chalets',readyMonth:12,renewalMonth:192,value:3e6})];
 const expected=structuredClone(s),p=saleBatchPlan(s,[2,1]);assert(p.ok,p.msg);for(const id of p.ids)assert(sellBusiness(expected,id).ok);
 assert(saleBatch(s,[2,1],p).ok);assertEq(serialize(s),serialize(expected));
});

test('Reestructuración: vender vivienda puede crear déficit laboral y reducir producción de negocios retenidos',async()=>{
 const {saleBatchPlan}=await api();const s=started();s.obrador.expansions=8;s.businesses=[shop(1,{type:'vivienda',housingForm:'apartamentos',city:'selaya',value:2e6}),shop(2)];
 const before=serialize(s),p=saleBatchPlan(s,[1]);assert(p.ok);assert(p.after.capacity<p.before.capacity);assert(p.workforceRisks.some(r=>r.city==='selaya'));
 assertEq(p.after.beds,0);assertEq(serialize(s),before);
});

test('Reestructuración: vender último negocio extranjero y sector estratégico refleja retroceso europeo',async()=>{
 const {saleBatchPlan}=await api();const s=started();s.businesses=[shop(1,{type:'logistica',city:'lisboa',value:18e5})];const p=saleBatchPlan(s,[1]);
 assertEq(p.before.countries,2);assertEq(p.after.countries,1);assertEq(p.before.sectors,1);assertEq(p.after.sectors,0);
});

test('Reestructuración: cotización antigua se rechaza sin modificaciones y stress suma caja una vez',async()=>{
 const {saleBatchPlan,saleBatch}=await api();const s=started();s.businesses=[shop(1)];const p=saleBatchPlan(s,[1]);const stress=stressReport(s,[1],p.items,'sale');
 assert(stress.comparison.ok);const c=structuredClone(s);assert(sellBusiness(c,1).ok);assertEq(stress.rows[0].investment.closingCash,c.cash+computeEconomy(c).net);
 s.businesses[0].value*=2;const before=serialize(s);assert(!saleBatch(s,[1],p).ok);assertEq(serialize(s),before);
 assert(!stressReport(s,[1],p.items,'sale').comparison.ok);
});

test('Cartera: selección de venta admite franquicias, obras y máximos pero reforma conserva filtro anterior',async()=>{
 await api();const s=started();s.businesses=[shop(1,{level:10}),shop(2,{mode:'franquicia'}),shop(3,{readyMonth:6})];const rows=portfolio(s).rows;
 assertEq(portfolioSelection(rows,[1,2,3]).length,0);assertEq(portfolioSelection(rows,[1,2,3,999],'sale').length,3);assertEq(rows.find(r=>r.id===2).cashOnSale,saleValue(s.businesses[1]));
});

test('Reestructuración: alerta si vender una obra prolonga déficit futuro aunque el pico y el inicio no cambien',async()=>{
 const {saleBatchPlan}=await api();const s=started();s.obrador.expansions=8;
 s.businesses=[shop(1,{type:'vivienda',city:'selaya',housingForm:'apartamentos',readyMonth:2,value:2e6}),shop(2,{type:'vivienda',city:'selaya',housingForm:'apartamentos',readyMonth:4,value:2e6})];
 const p=saleBatchPlan(s,[1]);assert(p.ok);assertEq(p.before.capacity,p.after.capacity);
 const risk=p.workforceRisks.find(r=>r.city==='selaya');assert(risk,'Debe alertar déficit prolongado');
 assertEq(risk.worseMonths.map(x=>x.month).join(','),'2,3');assert(risk.worseMonths.every(x=>x.extraBeds>0));
});
