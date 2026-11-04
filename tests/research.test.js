import {test,assert,assertEq} from './runner.js';
import {newGame,serialize} from '../src/core/state.js';
import {resolvePending} from '../src/core/sim.js';
import {computeEconomy} from '../src/core/economy.js';
import {startRD,tickRD} from '../src/core/market.js';
import {workforcePlan} from '../src/core/workforce.js';
const api=()=>import('../src/core/research.js');
const started=()=>{const s=newGame(42);resolvePending(s,0);s.cash=1e7;s.pending=[];s.notices=[];return s;};

test('I+D: estudio puro coincide con finalizar innovación por la API real',async()=>{
 const {researchPlan}=await api();const s=started(),before=serialize(s),p=researchPlan(s,'horneado_continuo');
 assert(p.ok);assert(p.startable);assertEq(p.costDue,180000);assertEq(p.months,5);
 const c=structuredClone(s);assert(startRD(c,p.id).ok);while(c.rd)tickRD(c);const r=computeEconomy(c);
 for(const k of ['net','capacity','fill','employees'])assertEq(p.after[k],r[k],k);
 assertEq(p.before.net,computeEconomy(s).net);assertEq(serialize(s),before);
});

test('I+D: contrato nuevo y fama se incluyen sin avanzar mes ni obras',async()=>{
 const {researchPlan}=await api();const s=started();s.businesses=[{id:1,type:'telecom',city:'madrid',mode:'propia',level:1,value:3e6,readyMonth:6}];
 s.unlocked.academy=true;s.businesses.push({id:2,type:'academy',city:'barcelona',mode:'propia',level:1,value:40000,cond:100});
 for(const id of ['congelados','merch']){const p=researchPlan(s,id),c=structuredClone(s);assert(startRD(c,id).ok);while(c.rd)tickRD(c);
 assertEq(p.after.net,computeEconomy(c).net);assertEq(p.after.employees,computeEconomy(c).employees);}
 assertEq(s.month,0);assertEq(s.contracts.length,0);
});

test('I+D: plazo comparte la reducción real de Dirección de Operaciones',async()=>{
 const {researchPlan}=await api();const s=started();s.execs.operaciones={skill:3,salary:0};
 const p=researchPlan(s,'licencia_bancaria');assertEq(p.months,8);assertEq(startRD(s,p.id).months,p.months);
});

test('I+D: producción limitada muestra vivienda necesaria y capacidad efectiva',async()=>{
 const {researchPlan}=await api();const s=started();s.obrador.expansions=4;const p=researchPlan(s,'horneado_continuo');
 const w=p.workforce.find(x=>x.city==='selaya');assert(w.after.missingBeds>w.before.missingBeds);assert(w.after.required>w.before.required);
 const c=structuredClone(s);assert(startRD(c,p.id).ok);while(c.rd)tickRD(c);
 assertEq(w.after.missingBeds,workforcePlan(c,'selaya').missingBeds);assertEq(p.after.capacity,computeEconomy(c).capacity);
});

test('I+D: estudiar bloqueado o alternativo no reemplaza proyecto ni cobra gasto',async()=>{
 const {researchPlan}=await api();const s=started();assert(startRD(s,'horneado_continuo').ok);s.rd.monthsLeft=3;const before=serialize(s);
 const active=researchPlan(s,'horneado_continuo');assertEq(active.status,'active');assertEq(active.costDue,0);assertEq(active.months,3);assert(!active.startable);
 const alternative=researchPlan(s,'robots_envasado');assert(alternative.ok);assert(!alternative.startable);assertEq(alternative.costDue,320000);assert(alternative.reason);
 assertEq(serialize(s),before);
});

test('I+D: desbloqueos se explican sin ingresos ficticios ni saltarse requisitos',async()=>{
 const {researchPlan}=await api();const s=started();s.cash=0;const p=researchPlan(s,'licencia_bancaria');assert(p.ok);assert(!p.startable);assert(p.unlock.includes('Banco'));
 assertEq(p.after.net,p.before.net);assertEq(p.after.employees,p.before.employees);assert(!s.unlocked.banca);
 const foreign=researchPlan(s,'expansion_propia');assert(!foreign.startable);assert(foreign.reason.includes('marca blanca'));
 s.products.push('licencia_bancaria');assert(!researchPlan(s,'licencia_bancaria').ok);assert(!researchPlan(s,'desconocido').ok);
});
