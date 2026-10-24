import {test,assert,assertEq} from './runner.js';
import {newGame,serialize,deserialize} from '../src/core/state.js';
import {resolvePending,currentPending,eligibleEvents,advanceMonth} from '../src/core/sim.js';
import {EVENT_BY_ID} from '../src/data/events.js';
import {productFactor} from '../src/core/market.js';
import {CITY_BY_ID} from '../src/data/cities.js';

const started=(city='salamanca')=>{const s=newGame(42);resolvePending(s,0);s.pending=[];s.clausula=null;s.cash=1e7;s.rep=80;s.moral=70;s.month=11;s.obrador.upgrades=['linea2'];s.businesses.push({id:s.nextId++,type:'express',city,mode:'propia',level:1,value:30000});return s;};
const choose=(s,id,index)=>{s.pending=[{kind:'event',id}];return resolvePending(s,index);};

test('Fiestas: ninot y patios son historias puntuales y dependen de reputación',()=>{
 for(const [id,city,month] of [['ciudad_valencia','valencia',1],['ciudad_cordoba','cordoba',3]]){
  const s=started(city);s.month=month;const e=EVENT_BY_ID[id];assert(e.once);assert(!e.forced);
  s.rep=15;const low=e.weight(s);s.rep=85;assert(e.weight(s)!==low);
  choose(s,id,0);s.month=month+12;assert(!eligibleEvents(s).some(x=>x.id===id));
 }
});

test('Fiestas: San Fermín y Ofrenda vuelven al año siguiente y recuerdan la elección',()=>{
 for(const [id,city,month] of [['ciudad_pamplona','pamplona',5],['ciudad_zaragoza','zaragoza',8]]){
  const s=started(city);s.month=month+1;choose(s,id,0);const memory=serialize(s.localEvents);
  s.month=month+12;assert(eligibleEvents(s).some(e=>e.id===id),'Debe volver cada año');
  const text=EVENT_BY_ID[id].text(s);assert(text.includes('La última vez'));
  const c=deserialize(serialize(s));assertEq(serialize(c.localEvents),memory);
 }
});

test('Fiestas: repetir un abuso cuesta más reputación, los acuerdos buenos mejoran el siguiente año',()=>{
 const s=started('pamplona');s.month=6;choose(s,'ciudad_pamplona',3);s.month=18;
 const rep=s.rep;choose(s,'ciudad_pamplona',3);assert(rep-s.rep>=2);
 const good=started('zaragoza');good.month=9;choose(good,'ciudad_zaragoza',1);good.month=21;choose(good,'ciudad_zaragoza',1);
 assert(good.mods.some(m=>m.localEvent==='ciudad_zaragoza'&&m.factor>1));
});

test('Nochevieja: cuatro patrocinios en años distintos crean tradición nacional, sin duplicar edición',()=>{
 const s=started();
 for(let year=0;year<4;year++){
  s.month=11+12*year;s.rep=85;s.moral=70;s.lastReport={fill:1};s.mods=[];
  choose(s,'ciudad_salamanca',0);
  assertEq(s.localEvents.ciudad_salamanca.level,year+1);
  const cash=s.cash,visits=s.localEvents.ciudad_salamanca.visits,count=s.customs.ciudad_salamanca.count;choose(s,'ciudad_salamanca',0);assertEq(s.cash,cash);assertEq(s.localEvents.ciudad_salamanca.level,year+1);assertEq(s.localEvents.ciudad_salamanca.visits,visits);assertEq(s.customs.ciudad_salamanca.count,count);
 }
 s.month=11+12*5;
 assertEq(productFactor(s,'express','sobaos',CITY_BY_ID.madrid,11),1.15);
 assertEq(productFactor(s,'express','sobaos',CITY_BY_ID.madrid,0),1);
 assertEq(productFactor(s,'express','sobaos',CITY_BY_ID.lisboa,11),1);
 assertEq(productFactor(s,'gimnasio','servicios',CITY_BY_ID.madrid,11),1);
 const c=deserialize(serialize(s));assertEq(c.localEvents.ciudad_salamanca.level,4);
 const before=serialize(s);productFactor(s,'express','sobaos',CITY_BY_ID.madrid,11);assertEq(serialize(s),before);
});

test('Nochevieja: reputación, plantilla y suministro impiden comprar éxitos ficticios',()=>{
 for(const mutate of [s=>s.rep=10,s=>s.moral=10,s=>s.lastReport={fill:0.2}]){
  const s=started();mutate(s);const result=EVENT_BY_ID.ciudad_salamanca.choices[0].effect(s,{});
  assert((s.localEvents?.ciudad_salamanca?.level||0)===0);assert(typeof result==='string');
 }
});

test('Fiestas: una obra no recibe invitaciones ni las lecturas cambian el azar',()=>{
 const s=started('valencia');s.month=1;s.businesses[0].readyMonth=12;
 assertEq(EVENT_BY_ID.ciudad_valencia.weight(s),0);
 const before=serialize(s);EVENT_BY_ID.ciudad_valencia.text(s);EVENT_BY_ID.ciudad_valencia.weight(s);assertEq(serialize(s),before);
});

test('Fiestas: dos celebraciones del mismo mes no se quitan el turno',()=>{
 const s=started('sevilla');s.month=2;s.businesses.push({id:s.nextId++,type:'express',city:'murcia',mode:'propia',level:1,value:30000});
 advanceMonth(s);assert(s.pending.some(p=>p.id==='ciudad_sevilla'));assert(s.pending.some(p=>p.id==='ciudad_murcia'));
});

test('Fiestas: migración no inventa patrocinios y se rechaza memoria incoherente',()=>{
 const s=started('cordoba');s.month=15;s.seen.ciudad_cordoba=3;delete s.localEvents;
 const old=deserialize(serialize(s));assertEq(Object.keys(old.localEvents).length,0);assert(!eligibleEvents(old).some(e=>e.id==='ciudad_cordoba'));
 const c=started();choose(c,'ciudad_salamanca',0);c.localEvents.ciudad_salamanca.level=5;
 let bad=false;try{deserialize(serialize(c))}catch{bad=true}assert(bad);
});

test('Fiestas: los folletos de Murcia y patrocinios exitosos se recuerdan como acuerdos',()=>{
 const s=started('murcia');s.month=3;choose(s,'ciudad_murcia',2);assertEq(s.localEvents.ciudad_murcia.lastOutcome,'acuerdo');
 s.month=15;const rep=s.rep;choose(s,'ciudad_murcia',2);assertEq(s.rep,rep+1);assertEq(s.localEvents.ciudad_murcia.failures,0);
 let successful=false;for(let seed=1;seed<20&&!successful;seed++){
  const c=started('laspalmas');c.rng=seed;c.month=1;const before=c.rep;choose(c,'ciudad_laspalmas',1);
  if(c.rep>before){assertEq(c.localEvents.ciudad_laspalmas.lastOutcome,'acuerdo');successful=true;}
 }
 assert(successful);
});
