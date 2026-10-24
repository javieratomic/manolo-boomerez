import {test,assert,assertEq} from './runner.js';
import {newGame,serialize,deserialize} from '../src/core/state.js';
import {resolvePending,advanceMonth} from '../src/core/sim.js';
import {canIPO,doIPO,companyValuation} from '../src/core/life.js';
import {canOpen,openBusiness,sellBusiness,openingCost,checkUnlocks,setPolicy} from '../src/core/actions.js';
import {computeEconomy,grossPatrimonio} from '../src/core/economy.js';
import {EVENT_BY_ID} from '../src/data/events.js';
import {driftStats} from '../src/core/sim.js';
import {acquireRival} from '../src/core/rivals.js';
import {setHousingPolicy} from '../src/core/housing.js';
import {laborSeverity} from '../src/core/inspections.js';

const started=()=>{const s=newGame(42);resolvePending(s,0);s.cash=1e8;s.clausula=null;s.pending=[];return s;};
const biz=(s,type,city='madrid',level=1)=>{const b={id:s.nextId++,type,city,mode:'propia',level,value:1e5};s.businesses.push(b);return b;};
const line=(s,id)=>computeEconomy(s).lines.find(l=>l.id===id);

test('Bolsa: umbral de valoración de mil millones, sin deslistar sociedades antiguas',()=>{
 const s=started();s.month=40;s.rep=60;s.macro.phase='estable';s.macro.demand=1;
 assert(!canIPO(s,grossPatrimonio(s)).ok);assert(!doIPO(s,grossPatrimonio(s)).ok);
 const premium=companyValuation(s,1e9)/1e9;
 assert(!canIPO(s,1e9/premium-1).ok);assert(canIPO(s,1e9/premium).ok);
 assert(doIPO(s,1e9/premium).ok);s.cash=1e6;
 assert(deserialize(serialize(s)).ipo,'Cotización anterior se conserva');
});

test('Empanadas: solo el pacto con Rodrigo desbloquea, primera apertura al 70 % una sola vez',()=>{
 const s=started();s.month=30;checkUnlocks(s);s.unlocked.empanadas=true;
 assert(!canOpen(s,'empanadas','madrid').ok,'No basta un desbloqueo antiguo');
 const ev=EVENT_BY_ID.primo_argentino;
 const paid=started();ev.choices[0].effect(paid);checkUnlocks(paid);assert(!canOpen(paid,'empanadas','madrid').ok);
 const normal=openingCost(s,'empanadas','propia','madrid');ev.choices[1].effect(s);
 assertEq(openingCost(s,'empanadas','propia','madrid'),Math.round(normal*.7));
 const r=openBusiness(s,'empanadas','madrid');assert(r.ok,r.msg);
 const l=line(s,r.business.id);assert(l.cost>l.revenue*.1);
 sellBusiness(s,r.business.id);assertEq(openingCost(deserialize(serialize(s)),'empanadas','propia','madrid'),normal);
});

test('Sinergia: coworking y Academy se impulsan un 15 % solo en su ciudad',()=>{
 const s=started();s.fama=50;biz(s,'vivienda','madrid',10);biz(s,'vivienda','barcelona',10);
 const a=biz(s,'academy'),c=biz(s,'coworking','barcelona');
 const beforeA=line(s,a.id).revenue,beforeC=line(s,c.id).revenue;
 c.city='madrid';
 assert(line(s,a.id).revenue>beforeA*1.14);assert(line(s,c.id).revenue>0);
 c.city='barcelona';assertEq(line(s,a.id).revenue,beforeA);assertEq(line(s,c.id).revenue,beforeC);
 const s2=started();biz(s2,'vivienda','madrid',10);const cw=biz(s2,'coworking');const rev=line(s2,cw.id).revenue;biz(s2,'academy');assert(line(s2,cw.id).revenue>rev*1.14);
});

test('Gimnasio: sobaos vendidos localmente aumentan demanda el mes siguiente, con límite',()=>{
 const s=started();biz(s,'vivienda','madrid',10);const gym=biz(s,'gimnasio');const base=line(s,gym.id).revenue;
 s.citySobaoSales={barcelona:1e6};assertEq(line(s,gym.id).revenue,base);
 s.citySobaoSales={madrid:1e6};assert(line(s,gym.id).revenue>base);assert(line(s,gym.id).revenue<=base*1.351);
 s.citySobaoSales={};biz(s,'express');const r=computeEconomy(s);s.pending=[];s.cooldowns.trabajo=s.cooldowns.hacienda=99;advanceMonth(s);
 assertEq(s.citySobaoSales.madrid,r.lines.find(l=>l.type==='express').units);
 assertEq(deserialize(serialize(s)).citySobaoSales.madrid,s.citySobaoSales.madrid);
});

test('Viviendas: empleados prioritarios, vacantes públicas y alquileres locales independientes',()=>{
 const s=started();const home=biz(s,'vivienda','selaya');
 let r=computeEconomy(s),l=r.lines.find(x=>x.id===home.id);
 assert(l.publicOccupied>0,'Las vacantes se alquilan al público');assertEq(l.employeeOccupied,r.housed);
 assertEq(l.occupied,l.employeeOccupied+l.publicOccupied);assert(l.occupied<=10);
 assertEq(r.control,r.housed/r.employees,'El público no genera control laboral');
 const madrid=biz(s,'vivienda','madrid');r=computeEconomy(s);
 assert(r.lines.find(x=>x.id===madrid.id).publicRent>l.publicRent,'Madrid tiene precios locales');
 s.housingPolicies={selaya:{employee:'social',public:'premium'},madrid:{employee:'abusivo',public:'economico'}};
 const changed=computeEconomy(s);assert(changed.lines.find(x=>x.id===home.id).employeeRent<l.employeeRent);
 assert(changed.lines.find(x=>x.id===home.id).publicRent>l.publicRent);
 assertEq(deserialize(serialize(s)).housingPolicies.selaya.employee,'social');
 const noEmployees=changed.lines.find(x=>x.id===madrid.id);assertEq(noEmployees.employeeOccupied,0);assert(noEmployees.publicOccupied>0);
 const stateBefore=serialize(s);computeEconomy(s);assertEq(serialize(s),stateBefore,'Economía pura');
});

test('Viviendas: varios edificios comparten demanda pública y solo residentes empleados afectan moral',()=>{
 const s=started();for(let i=0;i<8;i++)biz(s,'vivienda','selaya');
 s.housingPolicies={selaya:{employee:'social',public:'mercado'}};
 const base=computeEconomy(s),a=structuredClone(s);driftStats(a,base);
 s.housingPolicies.selaya.public='premium';const r=computeEconomy(s),b=structuredClone(s);driftStats(b,r);
 assert(r.lines.filter(x=>x.type==='vivienda').reduce((n,l)=>n+l.publicOccupied,0)<base.beds-base.housed,'Demanda limitada, no ocupación infinita');
 assertEq(a.moral,b.moral);assertEq(a.heatTrabajo,b.heatTrabajo);assertEq(base.control,r.control);
});

test('Residencia: beneficio real limitado a plazas ocupadas y plantilla local, coste y moral visibles',()=>{
 const s=started();assert(!setPolicy(s,'residencia','descuento').ok,'Requiere residencia');
 biz(s,'vivienda','madrid',10);const care=biz(s,'residencia');const before=computeEconomy(s);
 assert(setPolicy(s,'residencia','descuento').ok);const after=computeEconomy(s);
 assert(after.residenceBenefit.beneficiaries>0);assert(after.residenceBenefit.discount>0);
 assert(line(s,care.id).revenue<before.lines.find(l=>l.id===care.id).revenue);
 assert(after.residenceBenefit.beneficiaries<=after.lines.find(l=>l.id===care.id).occupied);
 const a=structuredClone(s),b=structuredClone(s);b.policies.residencia='ninguno';driftStats(a,after);driftStats(b,before);assert(a.moral>b.moral);
 s.businesses=s.businesses.filter(x=>x.id!==care.id);assertEq(computeEconomy(s).residenceBenefit.beneficiaries,0);
});

test('Viviendas: cargar rechaza tarifas, ciudades y ventas locales inválidas',()=>{
 for(const change of [s=>s.housingPolicies={desconocida:{public:'mercado'}},s=>s.housingPolicies={madrid:{employee:'gratis'}},s=>s.citySobaoSales={madrid:-1},s=>s.citySobaoSales={madrid:'muchas'}]){
  const s=started();change(s);let rejected=false;try{deserialize(serialize(s))}catch{rejected=true}assert(rejected,'Rechazar configuración inválida');
 }
});

test('Empanadas: la OPA tampoco permite saltarse el pacto con Rodrigo',()=>{
 const s=started();s.rivals=[{id:'la_portena',presence:{madrid:1},cash:1e5}];
 const cash=s.cash;assert(!acquireRival(s,'la_portena').ok);assertEq(s.cash,cash);
 EVENT_BY_ID.primo_argentino.choices[1].effect(s);assert(acquireRival(s,'la_portena').ok);
 const price=openingCost(s,'empanadas','propia','valencia');s.businesses=[];
 assertEq(openingCost(deserialize(serialize(s)),'empanadas','propia','valencia'),price,'Adquirir consume primera apertura');
});

test('Viviendas: cambiar tarifa valida propiedad y conserva la tarifa de otra ciudad',()=>{
 const s=started();assert(!setHousingPolicy(s,'madrid','employee','social').ok);
 biz(s,'vivienda','madrid');biz(s,'vivienda','selaya');
 assert(setHousingPolicy(s,'madrid','employee','social').ok);assert(setHousingPolicy(s,'madrid','public','premium').ok);
 assert(!setHousingPolicy(s,'madrid','public','gratis').ok);
 assert(!s.housingPolicies.selaya);
 const c=deserialize(serialize(s));assertEq(c.housingPolicies.madrid.public,'premium');
});

test('Gimnasio: no crece por pedidos de sobaos que el obrador no sirve',()=>{
 const s=started();biz(s,'vivienda','madrid',10);biz(s,'express');
 s.mods.push({kind:'strike',factor:0,months:2});s.pending=[];
 const r=advanceMonth(s);assert(r);assertEq(s.citySobaoSales.madrid,0);
});

test('Viviendas: inspecciones y sucesos usan tarifas locales de empleados, no el valor legado',()=>{
 const s=started();biz(s,'vivienda','selaya');s.policies.alquiler='abusivo';
 setHousingPolicy(s,'selaya','employee','social');s.lastReport=computeEconomy(s);
 assertEq(laborSeverity(s),0);assert(!EVENT_BY_ID.vivienda_caldera.text(s).includes('alquiler abusivo'));
 setHousingPolicy(s,'selaya','employee','abusivo');s.lastReport=computeEconomy(s);
 assertEq(laborSeverity(s),1.5);assert(EVENT_BY_ID.vivienda_caldera.text(s).includes('alquiler abusivo'));
 setHousingPolicy(s,'selaya','public','premium');assertEq(laborSeverity(s),1.5);
 setHousingPolicy(s,'selaya','employee','social');biz(s,'vivienda','madrid');
 setHousingPolicy(s,'madrid','employee','abusivo');s.lastReport=computeEconomy(s);
 assertEq(laborSeverity(s),0);assert(!EVENT_BY_ID.vivienda_caldera.text(s).includes('alquiler abusivo'),'Un casero con público no explota empleados inexistentes');
});
