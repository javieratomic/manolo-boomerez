import {test,assert,assertEq} from './runner.js';
import {newGame,serialize,deserialize} from '../src/core/state.js';
import {resolvePending} from '../src/core/sim.js';
import {computeEconomy} from '../src/core/economy.js';
import {workforcePlan} from '../src/core/workforce.js';
import {transportCost} from '../src/core/logistics.js';
import {launchCampaign} from '../src/core/market.js';
import {advice} from '../src/core/advice.js';

const started=()=>{const s=newGame(42);resolvePending(s,0);s.cash=1e8;s.pending=[];s.clausula=null;s.obrador.upgrades=['linea2'];return s;};

test('Online: abrir cobra una vez y no crea locales físicos',async()=>{
 const {openOnline}=await import('../src/core/online.js');const s=started(),cash=s.cash,count=s.businesses.length;
 assert(openOnline(s).ok);assertEq(cash-s.cash,15000);assertEq(s.businesses.length,count);assertEq(s.online.level,1);
 const before=serialize(s);assert(!openOnline(s).ok);assertEq(serialize(s),before);
});

test('Online: vende excedente en cajas completas, con producción y costes contabilizados una vez',async()=>{
 const {openOnline}=await import('../src/core/online.js');const s=started(),base=computeEconomy(s);openOnline(s);const r=computeEconomy(s),o=r.online;
 assert(o.units>0);assertEq(o.units,o.orders*6);assert(r.produced>base.produced);assert(r.produced<=r.capacity);
 assertEq(r.produced,r.totalDemand*r.fill+r.bonusUnits);
 assert(r.lines.some(l=>l.id==='online'));assertEq(r.revenue, Object.values(r.revenueByCat).reduce((a,b)=>a+b,0));
 assert(o.shipping/o.units>transportCost(s,'madrid')*2);
 const retailVariable=3.2-1.05-transportCost(s,'madrid');assert(o.unitContribution<retailVariable);
 assertEq(r.costs.transporte-base.costs.transporte,o.shipping);
});

test('Online: no roba unidades a tiendas ni contratos cuando falta capacidad',async()=>{
 const {openOnline}=await import('../src/core/online.js');const s=started();s.obrador.upgrades=[];s.contracts=[{units:20000,price:2.3,months:12,label:'Pedido mayorista'}];
 s.businesses.push({id:s.nextId++,type:'express',city:'madrid',mode:'propia',level:1,value:30000});const base=computeEconomy(s);openOnline(s);const r=computeEconomy(s);
 assertEq(r.online.units,0);assertEq(r.fill,base.fill);assertEq(r.lines.find(l=>l.type==='express').units,base.lines.find(l=>l.type==='express').units);
 assert(r.online.cost>0,'Se pagan personal y plataforma aunque no haya excedente');
});

test('Online: personal real, pausa sin costes y portes compartidos con menor demanda',async()=>{
 const {openOnline,toggleOnline,setOnlineShipping}=await import('../src/core/online.js');const s=started(),before=workforcePlan(s);openOnline(s);const r=computeEconomy(s);
 assert(workforcePlan(s).other>before.other);assert(r.online.staff>0);
 assert(setOnlineShipping(s,'compartidos').ok);const shared=computeEconomy(s);assert(shared.online.potentialUnits<r.online.potentialUnits);assert(shared.online.chargedShipping>0);
 assert(toggleOnline(s).ok);const paused=computeEconomy(s);assertEq(paused.online.units,0);assertEq(paused.online.cost,0);assertEq(paused.online.staff,0);
 assert(toggleOnline(s).ok);assert(deserialize(serialize(s)).online.active);
});

test('Online: marketing nacional aumenta tráfico, campañas locales no lo multiplican',async()=>{
 const {openOnline}=await import('../src/core/online.js');const s=started();openOnline(s);const base=computeEconomy(s).online.potentialUnits;
 launchCampaign(s,'buzoneo','selaya');assertEq(computeEconomy(s).online.potentialUnits,base);
 launchCampaign(s,'radio');assert(computeEconomy(s).online.potentialUnits>base);
 const before=serialize(s);computeEconomy(s);assertEq(serialize(s),before);
});

test('Online: guardados anteriores quedan cerrados y niveles inválidos se rechazan',()=>{
 const s=started();delete s.online;const c=deserialize(serialize(s));assertEq(c.online.level,0);assert(!c.online.active);
 for(const level of [-1,4,1.5]){const bad=started();bad.online={level,active:true,shipping:'incluido'};let rejected=false;try{deserialize(serialize(bad))}catch{rejected=true}assert(rejected);}
});

test('Online: ampliaciones validan presupuesto y viviendas sin cobros parciales',async()=>{
 const {openOnline,upgradeOnline}=await import('../src/core/online.js');const s=started();openOnline(s);const cash=s.cash;assert(upgradeOnline(s).ok);assertEq(cash-s.cash,45000);assertEq(s.online.level,2);
 s.obrador.expansions=4;const before=serialize(s);assert(!upgradeOnline(s).ok);assertEq(serialize(s),before);
 s.businesses.push({id:s.nextId++,type:'vivienda',city:'selaya',housingForm:'legacy',mode:'propia',level:1,value:1e6});assert(upgradeOnline(s).ok);assertEq(s.online.level,3);assert(!upgradeOnline(s).ok);
});

test('Online: costes y margen inferiores al retail también con Maison, sin duplicar personal',async()=>{
 const {openOnline}=await import('../src/core/online.js');const s=started();s.brand='maison';openOnline(s);const r=computeEconomy(s),o=r.online;
 assert(o.units>0);assert(o.unitContribution<10-2.6-transportCost(s,'madrid'));assert(o.shipping/o.units>transportCost(s,'madrid')*2);
 assertEq(r.employees,r.lines.reduce((n,l)=>n+l.staff,0));assertEq(o.revenue-o.cost,o.profit);
});

test('Online: se sirve antes que los regalos, sin atribuir todas sus ventas a Selaya',async()=>{
 const {openOnline}=await import('../src/core/online.js');const s=started();s.obrador.upgrades=[];s.businesses.push({id:s.nextId++,type:'taberna',city:'selaya',mode:'propia',level:1,value:70000});
 const base=computeEconomy(s);openOnline(s);const r=computeEconomy(s);assert(r.bonusUnits<base.bonusUnits);assertEq(r.sobaoSales.selaya,base.sobaoSales.selaya);
});

test('Online: el gestor dirige a Online cuando el canal pierde dinero sin stock',async()=>{
 const {openOnline}=await import('../src/core/online.js');const s=started();openOnline(s);s.contracts=[{units:100000,price:2.3,months:12,label:'Mayorista'}];s.lastReport=computeEconomy(s);
 const tips=advice(s);assert(tips.some(t=>t.tab==='online'&&t.text.toLowerCase().includes('online')));assert(!tips.some(t=>t.text.includes('Venta online')&&t.text.includes('Reformar')));
});
