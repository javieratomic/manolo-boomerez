import {playGame} from './bot.js';
import {GOALS} from '../src/data/goals.js';
import {tickLife} from '../src/core/life.js';
import {test,assert,assertEq} from './runner.js';
import {newGame,deserialize,serialize} from '../src/core/state.js';
import {resolvePending,advanceMonth,currentPending,checkEnding} from '../src/core/sim.js';
import {canOpen,openBusiness,buyUpgrade,cityBusinessLimit,sellBusiness} from '../src/core/actions.js';
import {computeEconomy,obradorCapacity} from '../src/core/economy.js';
import {upgradeBusiness,upgradeCost,startRD,tickRD} from '../src/core/market.js';
import {nominateHeir,leaderAge,tickDynasty,beginSuccession,succeed,europeProgress,successor} from '../src/core/dynasty.js';
import {workforcePlan} from '../src/core/workforce.js';
import {signAgreement,tickInternational} from '../src/core/international.js';
import {CITY_BY_ID} from '../src/data/cities.js';

const started=()=>{const s=newGame(42);resolvePending(s,0);s.cash=1e8;s.clausula=null;return s;};

test('0.6 vivienda: una partida anterior desbloquea los pisos al cargar',()=>{
 const s=started();s.unlocked.vivienda=false;s.gameVersion='0.4.0';
 const c=deserialize(serialize(s));assert(canOpen(c,'vivienda','selaya').ok);
});

test('0.6 niveles: se puede reformar hasta diez con coste creciente',()=>{
 const s=started();openBusiness(s,'express','madrid');const b=s.businesses[0];let cost=0;
 for(let n=2;n<=10;n++){assert(upgradeCost(b)>cost);cost=upgradeCost(b);assert(upgradeBusiness(s,b.id).ok);assertEq(b.level,n);}
 assertEq(upgradeCost(b),null);
});

test('0.6 mercado: Madrid admite más locales y penaliza menos la segunda tienda',()=>{
 const profits=[];
 for(const city of ['madrid','santander']) {
  const s=started();s.obrador.upgrades=['linea2','robot','nave'];
  openBusiness(s,'express',city);const before=computeEconomy(s).lines.find(l=>l.type==='express').revenue;
  openBusiness(s,'express',city);const after=computeEconomy(s).lines.find(l=>l.type==='express').revenue;
  profits.push(after/before);
 }
 assert(profits[0]>profits[1]);assert(cityBusinessLimit('madrid')>cityBusinessLimit('santander'));
});

test('0.6 fábrica: necesita viviendas antes de ampliar una plantilla grande',()=>{
 const s=started();for(let i=0;i<3;i++)assert(buyUpgrade(s).ok);
 const cash=s.cash;assert(!buyUpgrade(s).ok);assertEq(s.cash,cash);
 assert(openBusiness(s,'vivienda','selaya').ok);assert(buyUpgrade(s).ok);
 assert(workforcePlan(s,'selaya').beds>0);
});

test('0.6 I+D: capacidad y ahorro cambian producción y costes, no crean ventas mágicas',()=>{
 const s=started();const cap=obradorCapacity(s), cost=computeEconomy(s).costs.materias;
 assert(startRD(s,'horneado_continuo').ok);while(s.rd)tickRD(s);assert(obradorCapacity(s)>cap);
 assert(startRD(s,'compra_agrupada').ok);while(s.rd)tickRD(s);
 assert(computeEconomy(s).costs.materias<cost);
});

test('0.6 Academy: la red de empresas aumenta su éxito a igual fama',()=>{
 const s=started();s.unlocked.academy=true;s.fama=50;openBusiness(s,'academy','madrid');
 const revenue=()=>computeEconomy(s).lines.find(l=>l.type==='academy').revenue;
 const a=revenue();openBusiness(s,'express','sevilla');assert(revenue()>a);
});

test('0.6 exterior: solo marca blanca exitosa más I+D abre una ciudad extranjera',()=>{
 const s=started();assert(CITY_BY_ID.lisboa);assert(!canOpen(s,'express','lisboa').ok);
 signAgreement(s,'portugal','private_label',true);
 for(let n=0;n<6;n++){s.rng=42;tickInternational(s,{fill:1});}
 assertEq(s.foreignTrack.portugal.successMonths,6);
 assert(startRD(s,'expansion_propia').ok);while(s.rd)tickRD(s);
 assert(canOpen(s,'express','lisboa').ok);assert(openBusiness(s,'express','lisboa').ok);
 assert(deserialize(serialize(s)).foreignTrack.portugal.successMonths>=6);
 assert(!canOpen(s,'express','paris').ok);
});

test('0.6 sectores: I+D habilita banca, telecomunicaciones y logística rentables',()=>{
 for(const [project,type] of [['licencia_bancaria','banca'],['red_telecom','telecom'],['plataforma_logistica','logistica']]) {
  const s=started();assert(!canOpen(s,type,'madrid').ok);
  assert(startRD(s,project).ok);while(s.rd)tickRD(s);
  assert(openBusiness(s,type,'madrid').ok);
  const r=computeEconomy(s),l=r.lines.find(l=>l.type===type);assert(l.revenue>0);assert(Number.isFinite(r.net));
 }
});

test('0.6 campaña: continúa después de ocho años y de quince millones',()=>{
 const s=started();s.month=100;s.cash=2e7;assertEq(s.campaign,'europe');assertEq(checkEnding(s),null);
 assert(europeProgress(s).countries>=1);
});

test('0.6 sucesión: a los ochenta se conserva empresa y cambia el dirigente',()=>{
 const s=started();s.month=299;openBusiness(s,'express','madrid');nominateHeir(s,'vanessa');
 tickDynasty(s);assert(s.pending.some(p=>p.id==='relevo_dinastia'));
 const cash=s.cash,buildings=JSON.stringify(s.businesses);const r=succeed(s,'designado');assert(r.ok);
 assertEq(s.dynasty.generation,1);assert(leaderAge(s)<80);assertEq(JSON.stringify(s.businesses),buildings);assertEq(s.cash,cash);
 assertEq(s.ending,null);assert(!succeed(s,'designado').ok);
});

test('0.6 estrés: existe muerte por estrés y el reposo previene el riesgo',()=>{
 let found=false;
 for(let rng=1;rng<=200;rng++){
  const s=started();s.rng=rng;s.estres=100;s.dynasty.highStressMonths=2;tickDynasty(s);
  if(s.dynasty.pendingCause==='estres'){found=true;break;}
 }
 assert(found);
 const rested=started();rested.estres=100;rested.restMonths=3;rested.dynasty.highStressMonths=2;
 tickDynasty(rested);assert(!rested.dynasty.pendingCause);
});

test('0.6 dinastía: el sucesor también puede relevarse y se guarda el historial',()=>{
 const s=started();beginSuccession(s,'edad');succeed(s,'profesional');
 s.month=s.dynasty.birthMonth+80*12-1;tickDynasty(s);assert(s.dynasty.pendingCause);
 succeed(s,'profesional');assertEq(s.dynasty.generation,2);assertEq(deserialize(serialize(s)).dynasty.history.length,2);
});


test('0.6 regresión: investigar hornos no aumenta la plantilla turística',()=>{
 const s=started();s.unlocked.airbnb=true;openBusiness(s,'airbnb','madrid');
 const a=computeEconomy(s).lines.find(l=>l.type==='airbnb');
 s.products.push('horneado_continuo','fermentacion_controlada');
 const b=computeEconomy(s).lines.find(l=>l.type==='airbnb');assertEq(b.staff,a.staff);assertEq(b.cost,a.cost);
});

test('0.6 regresión: el sucesor no revive el susto personal del fundador',()=>{
 const s=started();beginSuccession(s,'edad');succeed(s);s.estres=95;tickLife(s);
 assert(!s.pending.some(p=>p.id==='susto_padel'));
});

test('0.6 regresión: la vivienda cubre los empleos reales del banco',()=>{
 const s=started();s.rep=100;s.fama=100;s.unlocked.banca=true;
 assert(!canOpen(s,'banca','madrid').ok,'56 puestos no caben en una oferta de 53');
 openBusiness(s,'vivienda','madrid');assert(openBusiness(s,'banca','madrid').ok);
 const r=computeEconomy(s),p=workforcePlan(s,'madrid');
 assertEq(p.other,r.lines.filter(l=>l.city==='madrid').reduce((n,l)=>n+l.staff,0));
});


test('0.6 regresión: vender viviendas reduce actividad y no deja empleados ficticios',()=>{
 const s=started();s.unlocked.residencia=true;
 for(let i=0;i<4;i++)openBusiness(s,'vivienda','selaya');
 openBusiness(s,'residencia','selaya');const care=s.businesses.find(b=>b.type==='residencia');
 for(let i=0;i<9;i++)assert(upgradeBusiness(s,care.id).ok);
 const before=computeEconomy(s).lines.find(l=>l.type==='residencia').revenue;
 for(const b of [...s.businesses].filter(b=>b.type==='vivienda'))sellBusiness(s,b.id);
 const r=computeEconomy(s),p=workforcePlan(s,'selaya');
 assert(r.lines.filter(l=>l.city==='selaya').reduce((n,l)=>n+l.staff,0)<=p.available);
 assert(r.lines.find(l=>l.type==='residencia').revenue<before);
});


test('0.6 meta europea: exige países y sectores y permite continuar tras ganarla',()=>{
 const s=started();s.cash=2e9;assertEq(checkEnding(s),null);
 let id=500;
 for(const city of ['lisboa','paris','berlin','londres','roma','amsterdam','bruselas'])s.businesses.push({id:id++,type:'express',city,mode:'propia',level:1,value:100000});
 for(const type of ['banca','telecom','logistica'])s.businesses.push({id:id++,type,city:'madrid',mode:'propia',level:1,value:1000000});
 assertEq(checkEnding(s),'europe');s.ending=null;s.endless=true;assertEq(checkEnding(s),null);
});


test('0.6 continuidad: mil meses y dos sucesiones sin cierre por calendario',()=>{
 const r=playGame(42,{months:1000,campaign:'europe',cities:[],action:'padel',hook:s=>{if(s.month===0){s.cash=1e8;s.clausula=null;s.goalsDone=GOALS.map(g=>g.id);}}});
 assertEq(r.state.month,1000);assertEq(r.state.ending,null);assertEq(r.state.dynasty.generation,2);
 assertEq(r.state.dynasty.history.length,2);assert(r.state.dynasty.history.every(h=>h.age===80));
 const loaded=deserialize(serialize(r.state));assertEq(loaded.dynasty.generation,2);assertEq(loaded.month,1000);
});


test('0.6 familia: los herederos envejecen también mientras esperan el relevo',()=>{
 const s=started();assertEq(successor(s,'vanessa').age,19);assertEq(successor(s,'kevin').age,24);
 s.month=300;assertEq(successor(s,'vanessa').age,44);assertEq(successor(s,'merche').age,78);
});
