import {test,assert,assertEq} from './runner.js';
import {newGame,serialize} from '../src/core/state.js';
import {resolvePending} from '../src/core/sim.js';
import {openBusiness,openingCost,cityBusinessLimit} from '../src/core/actions.js';
import {computeEconomy} from '../src/core/economy.js';
import {GOALS} from '../src/data/goals.js';
const api=()=>import('../src/core/opportunities.js');
const started=()=>{const s=newGame(42);resolvePending(s,0);s.cash=1e7;s.clausula=null;s.pending=[];s.goalsDone=GOALS.map(g=>g.id);return s;};
const choice=(city='madrid',mode='propia',type='express')=>({city,mode,type});

test('Aperturas: previsión usa coste real, mantenimiento y neto global de una apertura individual',async()=>{
 const {openingPlan,executeOpening}=await api();const s=started(),before=serialize(s),p=openingPlan(s,choice());assert(p.ok,p.msg);
 const c=structuredClone(s);assert(openBusiness(c,'express','madrid').ok);const r=computeEconomy(c);
 assertEq(p.cost,openingCost(s,'express','propia','madrid'));assertEq(p.after.net,r.net);assertEq(p.cashAfter,c.cash);assertEq(p.deltaNet,r.net-computeEconomy(s).net);assertEq(serialize(s),before);
 assert(executeOpening(s,choice(),p).ok);assertEq(serialize(s),serialize(c));
});

test('Aperturas: franquicia separa canon, cuentas de central y resultado del dueño',async()=>{
 const {openingPlan}=await api();const s=started(),p=openingPlan(s,choice('selaya','franquicia'));assert(p.ok);
 assertEq(p.cost,0);assertEq(p.fee,25000);assertEq(p.cashAfter-s.cash,p.fee);assert(Number.isFinite(p.franchiseeProfit));
 const c=structuredClone(s),b=openBusiness(c,'express','selaya','franquicia').business;assertEq(p.franchiseeProfit,computeEconomy(c).lines.find(l=>l.id===b.id).franchiseeProfit);
});

test('Aperturas: consultar alternativas no consume descuento ni primera empanada, y ejecutar sí',async()=>{
 const {openingPlan,openingOpportunities,executeOpening}=await api();const s=started();s.discountNext=.25;s.flags.primoSocio=true;s.unlocked.empanadas=true;
 const before=serialize(s);openingOpportunities(s,{type:'empanadas',country:'espana'});const p=openingPlan(s,choice('madrid','propia','empanadas'));
 assert(p.ok);assertEq(serialize(s),before);assert(executeOpening(s,p.choice,p).ok);assertEq(s.discountNext,0);assert(s.flags.empanadaFirstUsed);
});

test('Aperturas: extranjero, marca, cupos y plazos mantienen bloqueos reales sin mutaciones',async()=>{
 const {openingPlan}=await api();const s=started(),before=serialize(s);
 for(const c of [choice('lisboa'),choice('madrid','propia','maison'),choice('madrid','propia','vivienda'),choice('madrid','ilegal')])assert(!openingPlan(s,c).ok);
 assertEq(serialize(s),before);s.products.push('expansion_propia');s.foreignTrack.portugal={successMonths:6};assert(openingPlan(s,choice('lisboa')).ok);
 s.foreignDeals=[{id:1,market:'portugal',mode:'licence',months:12}];assert(!openingPlan(s,choice('lisboa')).ok);
 const full=started();full.businesses=Array.from({length:cityBusinessLimit('madrid')},(_,i)=>({id:i+1,type:'express',city:'madrid',mode:'franquicia',level:1,fee:25000,value:0}));full.nextId=full.businesses.length+1;
 assert(!openingPlan(full,choice('madrid','franquicia')).ok);
});

test('Aperturas: filtros por ciudad sin tildes/país/modalidad y bloqueadas son coherentes',async()=>{
 const {openingOpportunities}=await api();const s=started();const p=openingOpportunities(s,{type:'express',query:'cordoba',mode:'both'});
 assertEq(p.rows.length,2);assert(p.rows.every(r=>r.choice.city==='cordoba'));assert(p.rows.some(r=>r.choice.mode==='franquicia'));
 assertEq(openingOpportunities(s,{type:'express',country:'portugal'}).rows.length,0);
 const locked=openingOpportunities(s,{type:'express',country:'portugal',showBlocked:true});assert(locked.rows.length>0);assert(locked.rows.every(r=>!r.ok&&r.msg));
});

test('Aperturas: cotización antigua y doble ejecución no abren ni cobran dos veces',async()=>{
 const {openingPlan,executeOpening}=await api();const s=started(),p=openingPlan(s,choice());s.discountNext=.2;const before=serialize(s);
 assert(!executeOpening(s,p.choice,p).ok);assertEq(serialize(s),before);const current=openingPlan(s,p.choice);assert(executeOpening(s,p.choice,current).ok);
 const after=serialize(s);assert(!executeOpening(s,p.choice,current).ok);assertEq(serialize(s),after);
});

test('Aperturas: objetivos y cláusula previstos coinciden con todos los efectos de la acción real',async()=>{
 const {openingPlan}=await api();const s=started();s.goalsDone=[];s.businesses=[1,2].map(id=>({id,type:'express',city:'santander',mode:'propia',level:1,value:3e4}));s.nextId=3;s.clausula={id:'cornisa',broken:false,done:false,closed:false};
 const before=serialize(s),p=openingPlan(s,choice());assert(p.ok);assert(p.goalCash>0);assert(p.clauseBreaks);assertEq(serialize(s),before);
 const c=structuredClone(s);assert(openBusiness(c,'express','madrid').ok);assertEq(p.cashAfter,c.cash);assertEq(p.after.net,computeEconomy(c).net);
});

test('Aperturas: resultados independientes e invalidación al cambiar descuentos o negocio existente',async()=>{
 const {openingOpportunities}=await api();const s=started(),filter={query:'madrid',mode:'propia'};
 const a=openingOpportunities(s,filter),cost=a.rows[0].cost;a.rows[0].cost=0;a.rows[0].after.net=1e12;
 const b=openingOpportunities(s,filter);assertEq(b.rows[0].cost,cost);assert(b.rows[0].after.net!==1e12);
 s.discountNext=.2;assert(openingOpportunities(s,filter).rows[0].cost<cost);
 assert(openBusiness(s,'express','madrid').ok);assertEq(openingOpportunities(s,filter).rows[0].after.net,(await api()).openingPlan(s,choice()).after.net);
});
