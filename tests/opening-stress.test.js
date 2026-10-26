import {test,assert,assertEq} from './runner.js';
import {newGame,serialize} from '../src/core/state.js';
import {resolvePending} from '../src/core/sim.js';
import {openBusiness} from '../src/core/actions.js';
import {computeEconomy} from '../src/core/economy.js';
import {openingPlan} from '../src/core/opportunities.js';
import {stressReport} from '../src/core/stress.js';
import {GOALS} from '../src/data/goals.js';
const started=()=>{const s=newGame(42);resolvePending(s,0);s.cash=1e7;s.clausula=null;s.pending=[];s.goalsDone=GOALS.map(g=>g.id);return s;};
const choice={type:'express',city:'madrid',mode:'propia'};

test('Resistencia apertura: aplica negocio real y supuestos en copia, inversión una vez',()=>{
 const s=started(),quote=openingPlan(s,choice),before=serialize(s),p=stressReport(s,choice,quote,'opening');assert(p.comparison.ok,p.comparison.msg);
 for(const [i,demand,wages] of [[0,1,1],[1,.85,1],[2,1,1.1],[3,.85,1.1]]){
  const c=structuredClone(s);assert(openBusiness(c,choice.type,choice.city,choice.mode).ok);if(demand!==1)c.mods.push({kind:'revenue',factor:demand,months:1});c.wageIndex*=wages;
  const r=computeEconomy(c);assertEq(p.rows[i].investment.net,r.net);assertEq(p.rows[i].investment.closingCash,c.cash+r.net);
 }
 assertEq(serialize(s),before);assertEq(p.rows[0].investment.net,quote.after.net);
});

test('Resistencia apertura: canon y premios se cobran una vez, cláusula y descuento siguen intactos',()=>{
 const s=started();s.goalsDone=[];s.discountNext=.2;s.clausula={id:'cornisa',broken:false,done:false,closed:false};
 s.businesses=[1,2].map(id=>({id,type:'express',city:'santander',mode:'propia',level:1,value:3e4}));s.nextId=3;
 const c={...choice,mode:'franquicia'},quote=openingPlan(s,c),before=serialize(s);assert(quote.goalCash>0);assert(quote.clauseBreaks);
 const p=stressReport(s,c,quote,'opening');assert(p.comparison.ok);assertEq(p.rows[0].investment.closingCash,quote.cashAfter+quote.after.net);assertEq(serialize(s),before);
});

test('Resistencia apertura: franquiciado puede perder aunque central cubra su colchón',()=>{
 const s=started();s.businesses=Array.from({length:6},(_,i)=>({id:i+1,type:'express',city:'selaya',mode:'franquicia',fee:25000,level:1,value:0}));s.nextId=7;
 const c={...choice,city:'selaya',mode:'franquicia'},quote=openingPlan(s,c),p=stressReport(s,c,quote,'opening');assert(p.comparison.ok,p.comparison.msg);
 assert(p.rows.every(r=>r.investment.franchiseeProfit<0));assert(p.rows.every(r=>r.investment.status==='covered'));
 const after=structuredClone(s),b=openBusiness(after,c.type,c.city,c.mode).business;assertEq(p.rows[0].investment.franchiseeProfit,computeEconomy(after).lines.find(l=>l.id===b.id).franchiseeProfit);
});

test('Resistencia apertura: abrir o cambiar cotización invalida intención sin proponer otra tienda',()=>{
 for(const change of [s=>openBusiness(s,choice.type,choice.city,choice.mode),s=>{s.discountNext=.25;}]){
  const s=started(),quote=openingPlan(s,choice);change(s);const before=serialize(s),p=stressReport(s,choice,quote,'opening');
  assert(!p.comparison.ok);assertEq(p.rows.length,4);assert(p.rows.every(r=>r.investment===null));assertEq(serialize(s),before);
 }
});

test('Resistencia apertura: cambiar mes recalcula condiciones si la intención y precio se mantienen',()=>{
 const s=started(),quote=openingPlan(s,choice);s.month=1;
 const p=stressReport(s,choice,quote,'opening');assert(p.comparison.ok,p.comparison.msg);assertEq(p.month,1);assertEq(p.rows[0].investment.net,openingPlan(s,choice).after.net);
});
