import {test,assert,assertEq} from './runner.js';
import {newGame,serialize,deserialize} from '../src/core/state.js';
import {resolvePending} from '../src/core/sim.js';
import {doIPO} from '../src/core/life.js';
import {grossPatrimonio} from '../src/core/economy.js';
import {tickBolsa,bolsaState} from '../src/core/bolsa.js';
import {GOALS} from '../src/data/goals.js';
const listed=(campaign='europe',month=119)=>{
 const s=newGame(42,'normal',campaign);resolvePending(s,0);s.pending=[];s.notices=[];s.clausula=null;s.goalsDone=GOALS.map(g=>g.id);s.month=month;s.cash=5e8;
 const n=Math.min(108,month+1);s.history=Array.from({length:n},(_,i)=>({month:month-n+i+1,net:4e7,revenue:6e7,cash:s.cash,patrimonio:s.cash,cat:{}}));
 s.ipo={month:30,float:.25,valuation:1e9,price:100,peak:100,angryMonth:-99};bolsaState(s);return s;
};

test('Continuidad: IPO real europeo después de ocho años sigue recibiendo promesas trimestrales',()=>{
 const s=listed();s.ipo=null;assert(doIPO(s,grossPatrimonio(s)).ok);const rng=s.rng;tickBolsa(s);tickBolsa(s);
 const cards=s.pending.filter(p=>p.id==='promesa_trimestre');assertEq(cards.length,1);assertEq(cards[0].params.qi,40);assertEq(cards[0].params.base,12e7);assertEq(s.rng,rng);
});

test('Continuidad: horizonte clásico intacto y Europa o modo infinito no se cortan en96',()=>{
 for(const month of [95,98,119])for(const campaign of ['classic','europe']){
  const s=listed(campaign,month);tickBolsa(s);assertEq(s.pending.some(p=>p.id==='promesa_trimestre'),campaign==='europe',`${campaign}/${month}`);
  if(campaign==='classic'){s.endless=true;tickBolsa(s);assert(s.pending.some(p=>p.id==='promesa_trimestre'));}
 }
 const s=listed();s.history=s.history.map(h=>({...h,net:-1000}));tickBolsa(s);assert(!s.pending.some(p=>p.id==='promesa_trimestre'));
});

test('Continuidad: promesa europea tardía se juzga y enlaza el siguiente trimestre',()=>{
 const s=listed();tickBolsa(s);assert(s.pending.some(p=>p.id==='promesa_trimestre'));resolvePending(s,0);assertEq(s.ipo.q.qi,40);
 for(let month=120;month<=122;month++)s.history.push({month,net:4e7,revenue:6e7,cash:s.cash,patrimonio:s.cash,cat:{}});
 s.month=122;tickBolsa(s);assert(s.ipo.lastResult.ok);assertEq(s.ipo.lastResult.qi,40);assert(s.ipo.cred>50);assertEq(s.pending.find(p=>p.id==='promesa_trimestre').params.qi,41);
});

test('Continuidad: Europa permite infinito y los finales terminales mantienen sus límites',async()=>{
 const {canContinueEnding}=await import('../src/data/endings.js');
 for(const id of ['europe','forbes','tiburon','pyme','ruina_lenta'])assert(canContinueEnding(id),id);
 for(const id of ['selaya','carcel','bancarrota','cooperativa','desconocido',null])assert(!canContinueEnding(id),String(id));
});

test('Continuidad: cargar admite desenlace europeo y rechaza un final desconocido',()=>{
 const s=listed();s.ending='europe';assertEq(deserialize(serialize(s)).ending,'europe');s.ending='desconocido';
 let rejected=false;try{deserialize(serialize(s));}catch{rejected=true;}assert(rejected);
});
