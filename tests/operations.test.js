import {test,assert,assertEq} from './runner.js';
import {newGame,serialize,deserialize} from '../src/core/state.js';
import {resolvePending} from '../src/core/sim.js';
import {workforcePlan} from '../src/core/workforce.js';
import {renovationCost} from '../src/core/construction.js';
import {computeEconomy} from '../src/core/economy.js';

const started=()=>{const s=newGame(42);resolvePending(s,0);s.pending=[];s.cash=1e8;s.clausula=null;return s;};
const home=(id,city,readyMonth,form='apartamentos')=>({id,type:'vivienda',city,mode:'propia',level:1,value:2e6,housingForm:form,readyMonth,renewalMonth:readyMonth+180});
const plan=async s=>(await import('../src/core/operations.js')).operationsPlan(s);

test('Operaciones: partida sin informe, horizonte de doce meses y consulta pura',async()=>{
 const s=started(),before=serialize(s),economy=JSON.stringify(computeEconomy(s));
 const p=await plan(s);
 assertEq(p.from,s.month);assertEq(p.to,s.month+12);assertEq(p.projects.length,0);assertEq(p.renewals.length,0);assertEq(p.shortages.length,0);assertEq(p.timeline.length,13);
 await plan(s);assertEq(serialize(s),before);assertEq(JSON.stringify(computeEconomy(s)),economy);
});

test('Operaciones: viviendas solo en su ciudad y desde su entrega, junto a todas las obras del mes',async()=>{
 const s=started();s.obrador.expansions=10;
 s.businesses=[home(1,'madrid',6),home(2,'selaya',12),{id:3,type:'telecom',city:'selaya',mode:'propia',level:1,value:3e6,readyMonth:12}];
 const p=await plan(s),at=m=>p.timeline.find(x=>x.month===m).cities.find(x=>x.city==='selaya');
 assert(at(0).missingBeds>0);assertEq(at(6).beds,0);assertEq(at(11).beds,0);assertEq(at(12).beds,25);assertEq(at(12).missingBeds,0);
 assertEq(at(12).required,workforcePlan({...s,month:12},'selaya').required);
 assertEq(p.projects.map(x=>x.id).join(','),'1,2,3');assertEq(p.pendingHomes,50);
 const shortage=p.shortages.find(x=>x.city==='selaya');assertEq(shortage.firstMonth,0);assertEq(shortage.nowMissingBeds,at(0).missingBeds);
});

test('Operaciones: detecta hueco entre obrador de seis meses y vivienda de doce',async()=>{
 const s=started();s.businesses=[{id:1,type:'express',city:'santander',mode:'propia',level:1,value:3e4,readyMonth:6},home(2,'santander',12),{id:3,type:'obrador_regional',city:'santander',mode:'propia',level:10,value:3e5,readyMonth:6}];
 const p=await plan(s),rows=p.timeline.map(x=>x.cities.find(c=>c.city==='santander'));
 assertEq(rows[5].required,0);assert(rows[6].required>0);assert(rows[6].missingBeds>0);assertEq(rows[12].missingBeds,0);
 const risk=p.shortages.find(x=>x.city==='santander');assertEq(risk.firstMonth,6);assert(risk.peakMissingBeds>=rows[6].missingBeds);
});

test('Operaciones: renovación vencida, próxima, fuera de plazo y en obra sin duplicar cobros',async()=>{
 const s=started();s.month=200;s.businesses=[home(1,'selaya',0),home(2,'madrid',0),home(3,'valencia',0),home(4,'sevilla',206)];
 s.businesses[0].renewalMonth=190;s.businesses[1].renewalMonth=212;s.businesses[2].renewalMonth=213;s.businesses[3].renewalMonth=201;
 const p=await plan(s);assertEq(p.renewals.map(x=>x.id).join(','),'1,4,2');assertEq(p.renewals[0].month,200);assertEq(p.renewals[1].month,206);
 assertEq(p.renewalReserve,[0,1,3].reduce((n,i)=>n+renovationCost(s.businesses[i]),0));
 assertEq(s.businesses[0].renewalMonth,190);assertEq((await plan(s)).renewalReserve,p.renewalReserve);
});

test('Operaciones: franquicias no reclaman viviendas y obras fuera del horizonte se informan',async()=>{
 const s=started();s.businesses=[{id:1,type:'express',city:'madrid',mode:'franquicia',level:10,value:3e4},home(2,'madrid',13)];
 const p=await plan(s);assertEq(p.projects.length,0);assertEq(p.laterProjects,1);assertEq(p.pendingHomes,0);assertEq(p.shortages.length,0);
 assertEq(p.timeline[12].cities.find(x=>x.city==='madrid').required,0);
});

test('Operaciones: calendario y guardado conservan el plan, incluidos chalets y vivienda antigua',async()=>{
 const s=started();s.month=11;s.businesses=[home(1,'selaya',12,'chalets'),{id:2,type:'vivienda',city:'madrid',mode:'propia',level:2,value:8e5,readyMonth:0,renewalMonth:20}];s.nextId=3;
 const p=await plan(s);assertEq(p.projects[0].months,1);assertEq(p.pendingHomes,10);assertEq(p.timeline[1].cities.find(x=>x.city==='selaya').beds,10);assertEq(p.timeline[0].cities.find(x=>x.city==='madrid').beds,15);
 assertEq(JSON.stringify(await plan(deserialize(serialize(s)))),JSON.stringify(p));
});

test('Operaciones: sin obras también anticipa plantilla del pico estacional del gimnasio',async()=>{
 const s=started();s.month=7;s.businesses=[{id:1,type:'gimnasio',city:'madrid',mode:'propia',level:10,value:25e4}];
 while(workforcePlan(s,'madrid').available-workforcePlan(s,'madrid').required>=2){s.businesses.push({id:s.businesses.length+1,type:'express',city:'madrid',mode:'propia',level:1,value:3e4});}
 const p=await plan(s);assertEq(workforcePlan(s,'madrid').missingBeds,0);
 assertEq(p.projects.length,0);const risk=p.shortages.find(x=>x.city==='madrid');assert(risk,'Detecta falta futura sin entregas');
 assert(risk.firstMonth>s.month);assert(risk.peakMissingBeds>0);
 assertEq(risk.peakMonth,12,'Enero es el pico de demanda');
});
