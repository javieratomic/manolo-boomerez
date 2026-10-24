import {test,assert,assertEq} from './runner.js';
import {newGame,serialize,deserialize} from '../src/core/state.js';
import {openBusiness,canOpen,openingCost} from '../src/core/actions.js';
import {resolvePending,advanceMonth,currentPending} from '../src/core/sim.js';
import {computeEconomy,maintenanceCost,structureCost} from '../src/core/economy.js';
import {workforcePlan} from '../src/core/workforce.js';
import {productionSites} from '../src/core/logistics.js';
import {upgradeBusiness} from '../src/core/market.js';
import {horizonNet,forecast} from '../src/core/preview.js';
import {EVENT_BY_ID} from '../src/data/events.js';
import {driftStats} from '../src/core/sim.js';
import {europeProgress} from '../src/core/dynasty.js';

const started=()=>{const s=newGame(42);resolvePending(s,0);s.cash=1e8;s.pending=[];s.clausula=null;return s;};
const drain=s=>{while(s.pending.length)resolvePending(s,currentPending(s).choices[0].index);s.notices=[];};
const go=(s,n)=>{for(let i=0;i<n;i++){drain(s);assert(advanceMonth(s));drain(s);}};

test('Construcción: edificio de 25 apartamentos y urbanización de 10 chalets, costes y moral distintos',()=>{
 const a=started(),b=started();const apartments=openBusiness(a,'vivienda','selaya','propia','apartamentos'),chalets=openBusiness(b,'vivienda','selaya','propia','chalets');
 assert(apartments.ok);assert(chalets.ok);
 assertEq(apartments.business.housingForm,'apartamentos');assertEq(chalets.business.housingForm,'chalets');
 assert(openingCost(a,'vivienda','propia','selaya','apartamentos')>210000);
 assert(openingCost(b,'vivienda','propia','selaya','chalets')>openingCost(a,'vivienda','propia','selaya','apartamentos'));
 a.month=12;b.month=12;const ra=computeEconomy(a),rb=computeEconomy(b);
 assertEq(ra.beds,25);assertEq(rb.beds,10);assert(rb.housingMoral>ra.housingMoral);
 assert(ra.costs.otros<computeEconomy(started()).costs.otros+700,'Mantenimiento reducido');
 assertEq(maintenanceCost(a),0,'No mantenimiento porcentual adicional');
});

test('Construcción: doce meses completos sin vivienda, empleo, ingresos ni reforma anticipada',()=>{
 const s=started(),base=computeEconomy(s);const result=openBusiness(s,'vivienda','selaya');assert(result.ok);const home=result.business;
 assertEq(home.readyMonth,12);assertEq(computeEconomy(s).beds,0);assertEq(workforcePlan(s).beds,0);
 assert(!upgradeBusiness(s,home.id).ok);assertEq(computeEconomy(s).revenue,base.revenue);assertEq(structureCost(s),0);
 go(s,11);assertEq(s.month,11);assertEq(computeEconomy(s).beds,0);
 const loaded=deserialize(serialize(s));go(loaded,1);assertEq(loaded.month,12);assertEq(computeEconomy(loaded).beds,25);
 assert(computeEconomy(loaded).lines.some(l=>l.id===home.id&&l.revenue>0));
});

test('Construcción: turísticos doce meses, obrador y telecom seis sin efectos prematuros',()=>{
 for(const [type,months] of [['airbnb',12],['obrador_regional',6],['telecom',6]]){
  const s=started();s.unlocked[type]=true;const before=computeEconomy(s);const r=openBusiness(s,type,'madrid');assert(r.ok,r.msg);
  assertEq(r.business.readyMonth,months);assert(!computeEconomy(s).lines.some(l=>l.id===r.business.id&&l.revenue>0));
  if(type==='obrador_regional')assert(!productionSites(s).includes('madrid'));
  if(type==='telecom')assertEq(structureCost(s),0);
  s.month=months-1;assertEq(computeEconomy(s).capacity,before.capacity);
  s.month=months;assert(computeEconomy(s).lines.some(l=>l.id===r.business.id));
  if(type==='obrador_regional')assert(productionSites(s).includes('madrid'));
 }
});

test('Renovación: se carga una vez cada quince años y las previsiones no alteran la partida',()=>{
 const s=started();const r=openBusiness(s,'vivienda','selaya');assert(r.ok);const home=r.business;
 assertEq(home.renewalMonth,192);s.month=191;assertEq(computeEconomy(s).costs.renovaciones,0);
 s.month=192;const before=serialize(s),due=computeEconomy(s);assert(due.costs.renovaciones>100000);
 assertEq(serialize(s),before);horizonNet(s);assertEq(serialize(s),before);
 const next=forecast(s);assertEq(next.c.businesses[0].renewalMonth,372);assertEq(forecast(next.c).r.costs.renovaciones,0);
 drain(s);assert(advanceMonth(s));drain(s);assertEq(home.renewalMonth,372);
 assertEq(computeEconomy(s).costs.renovaciones,0);assertEq(deserialize(serialize(s)).businesses[0].renewalMonth,372);
});

test('Migración: viviendas previas conservan tamaño y actividad, sin renovación sorpresa',()=>{
 const s=started();s.month=200;s.businesses.push({id:s.nextId++,type:'vivienda',city:'selaya',mode:'propia',level:2,value:180000,openedMonth:0});
 const c=deserialize(serialize(s));assertEq(c.businesses[0].housingForm,'legacy');assertEq(c.businesses[0].renewalMonth,380);assertEq(computeEconomy(c).beds,15);
 assertEq(computeEconomy(c).costs.renovaciones,0);
});

test('Construcción: rechaza tipos de promoción y fechas inválidas al abrir o cargar',()=>{
 const s=started();assert(!canOpen(s,'vivienda','selaya','propia','castillo').ok);
 for(const value of [-1,1.5,'doce']){const c=started();c.businesses.push({id:1,type:'vivienda',city:'selaya',mode:'propia',level:1,value:100000,housingForm:'apartamentos',readyMonth:value});let bad=false;try{deserialize(serialize(c))}catch{bad=true}assert(bad);}
});

test('Construcción: una obra turística no genera infracciones de explotación ni venta con alquileres',()=>{
 const s=started(),base=structuredClone(s);s.unlocked.airbnb=true;s.macro.phase=base.macro.phase='burbuja';
 assert(openBusiness(s,'airbnb','barcelona','ilegal').ok);
 driftStats(base,computeEconomy(base));driftStats(s,computeEconomy(s));assertEq(s.heatHacienda,base.heatHacienda);
 assertEq(EVENT_BY_ID.fondo_buitre.weight(s),0,'No vender y alquilar un bloque sin entregar');
});

test('Construcción: un sector pendiente no cumple la meta europea antes de la entrega',()=>{
 const s=started();s.businesses=['banca','logistica','telecom'].map((type,i)=>({id:i,type,city:'madrid',mode:'propia',level:1,value:1e6,...(type==='telecom'?{readyMonth:6}:{})}));
 assertEq(europeProgress(s,2e9).sectors,2);s.month=6;assertEq(europeProgress(s,2e9).sectors,3);
});
