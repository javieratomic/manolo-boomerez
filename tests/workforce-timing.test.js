import {test,assert,assertEq} from './runner.js';
import {newGame,serialize} from '../src/core/state.js';
import {resolvePending} from '../src/core/sim.js';
import {workforcePlan,missingBedsAhead} from '../src/core/workforce.js';
import {canOpen,openBusiness} from '../src/core/actions.js';
import {computeEconomy} from '../src/core/economy.js';
const started=()=>{const s=newGame(42);resolvePending(s,0);s.month=24;s.cash=1e8;s.clausula=null;s.pending=[];s.unlocked.telecom=true;s.unlocked.obrador_regional=true;return s;};
const telecom=(id,readyMonth=30)=>({id,type:'telecom',city:'madrid',mode:'propia',level:1,value:3e6,cond:100,openedMonth:Math.max(0,readyMonth-6),readyMonth});
const home=(id,readyMonth)=>({id,type:'vivienda',city:'madrid',mode:'propia',housingForm:'apartamentos',level:1,value:2e6,openedMonth:Math.max(0,readyMonth-12),readyMonth,renewalMonth:readyMonth+180});
const delivered=(s,at)=>{const c=structuredClone(s);c.businesses=c.businesses.filter(b=>b.readyMonth==null||b.readyMonth<=at);for(const b of c.businesses)if(b.readyMonth!=null)b.readyMonth=c.month;return c;};

test('Plantilla futura: servicios coinciden con entregar realmente las obras en copia',()=>{
 const s=started();s.businesses=[telecom(1),telecom(2)];const before=serialize(s),p=workforcePlan(s,'madrid',30),expected=workforcePlan(delivered(s,30),'madrid');
 assertEq(p.required,58);assertEq(p.missingBeds,2);assertEq(JSON.stringify(p),JSON.stringify(expected));assertEq(missingBedsAhead(s,'madrid').missing,2);assertEq(serialize(s),before);
});

test('Plantilla futura: saturación incluye solo centros entregados y suma viviendas coetáneas',()=>{
 const s=started();s.businesses=[telecom(1,30),telecom(2,31),home(3,31)];
 for(const at of [24,29,30,31,36])assertEq(JSON.stringify(workforcePlan(s,'madrid',at)),JSON.stringify(workforcePlan(delivered(s,at),'madrid')),String(at));
 assertEq(workforcePlan(s,'madrid',30).beds,0);assertEq(workforcePlan(s,'madrid',31).beds,25);assertEq(workforcePlan(s,'madrid',31).missingBeds,0);
});

test('Plantilla futura: no adelanta temporada, modificadores ni economía al consultar',()=>{
 const s=started();s.month=5;s.businesses=[telecom(1,11),{id:2,type:'taberna',city:'madrid',mode:'propia',level:1,value:40000,cond:100}];
 const before=serialize(s),economy=JSON.stringify(computeEconomy(s)),p=workforcePlan(s,'madrid',12),expected=workforcePlan(delivered(s,12),'madrid');
 assertEq(p.required,expected.required);assert(p.required!==workforcePlan({...s,month:12},'madrid').required,'conserva junio, no cambia a enero');assertEq(JSON.stringify(computeEconomy(s)),economy);assertEq(serialize(s),before);
});

test('Contratación: segunda telecom insegura se bloquea sin consumir caja, cupón ni id',()=>{
 const s=started();assert(openBusiness(s,'telecom','madrid').ok);s.discountNext=.25;const before=serialize(s);
 const check=canOpen(s,'telecom','madrid');assert(!check.ok);assert(/2 plazas de vivienda/.test(check.msg),check.msg);assert(check.msg.includes('condiciones actuales'));assert(check.msg.includes('coordina'));assert(!openBusiness(s,'telecom','madrid').ok);assertEq(serialize(s),before);
});

test('Contratación: negocio en obras espera a su entrega y puede coincidir con viviendas',()=>{
 const s=started();s.businesses=[telecom(1,24),home(2,30)];s.nextId=3;const before=serialize(s);
 assert(canOpen(s,'telecom','madrid').ok);assertEq(serialize(s),before);assert(openBusiness(s,'telecom','madrid').ok);assertEq(s.businesses.at(-1).readyMonth,30);
 const late=started();late.businesses=[telecom(1,24),home(2,31)];assert(!canOpen(late,'telecom','madrid').ok,'la vivienda no puede llegar un mes tarde');
});

test('Plantilla futura: obrador regional y franquicias conservan sus reglas al entregar',()=>{
 const s=started();s.businesses=[telecom(1,30),home(2,30),{id:3,type:'obrador_regional',city:'madrid',mode:'propia',level:2,value:4e5,readyMonth:30},{id:4,type:'express',city:'madrid',mode:'franquicia',level:1,value:0,readyMonth:30}];
 const p=workforcePlan(s,'madrid',30),expected=workforcePlan(delivered(s,30),'madrid');assertEq(JSON.stringify(p),JSON.stringify(expected));assert(p.factory>0);assert(p.installed>0);
});
