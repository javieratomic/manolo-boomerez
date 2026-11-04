import {test,assert,assertEq} from './runner.js';
import {newGame,serialize,deserialize} from '../src/core/state.js';
import {resolvePending} from '../src/core/sim.js';
import {computeEconomy} from '../src/core/economy.js';
const state=()=>{const s=newGame(42);resolvePending(s,0);s.lastReport=computeEconomy(s);s.month=1;return s;};

test('Guardado: informe incompatible se rechaza antes de sustituir el modelo',()=>{
 const base=state(),changes=[
  s=>s.lastReport={},s=>s.lastReport=[],s=>s.lastReport.lines=null,s=>s.lastReport.costs=null,s=>s.lastReport.revenueByCat=null,
  s=>s.lastReport.lines=[null],s=>s.lastReport.lines[0].city='desconocida',s=>s.lastReport.lines[0].revenue='mil',
  s=>s.lastReport.net='mucho',s=>s.lastReport.month=-1,s=>s.lastReport.costs.salarios='nómina',
 ];
 for(const mutate of changes){const s=structuredClone(base);mutate(s);const text=serialize(s);let rejected=false;try{deserialize(text);}catch{rejected=true;}assert(rejected,'debe rechazar informe roto');assertEq(serialize(s),text);}
});

test('Guardado: informe válido admite virtuales, negocios vendidos y columnas antiguas',()=>{
 const s=state();s.lastReport.lines.push({id:99,type:'express',city:'madrid',label:'Local vendido',revenue:4000,cost:3000,staff:2});
 s.lastReport.lines.push({id:'foreign_7',type:'international',city:'selaya',label:'Acuerdo exterior',revenue:8000,cost:1000,staff:0});
 for(const key of ['renovaciones','directivos','mantenimiento','transporte','estructura','personales','reparto'])delete s.lastReport.costs[key];
 for(const key of ['finanzas','infraestructura','logistica','produccion'])delete s.lastReport.revenueByCat[key];
 const c=deserialize(serialize(s));assertEq(c.lastReport.net,s.lastReport.net);assertEq(c.lastReport.lines.length,3);assertEq(c.cash,s.cash);assertEq(c.rng,s.rng);
});

test('Guardado: antes del primer cierre el informe puede seguir vacío',()=>{
 const s=newGame(42),c=deserialize(serialize(s));assertEq(c.lastReport,null);assertEq(c.rng,s.rng);
});
