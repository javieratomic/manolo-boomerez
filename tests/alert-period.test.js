import {test,assert,assertEq} from './runner.js';
import {newGame,serialize} from '../src/core/state.js';
import {resolvePending} from '../src/core/sim.js';
import {openBusiness,buyUpgrade} from '../src/core/actions.js';
import {computeEconomy} from '../src/core/economy.js';
import {cityAlerts} from '../src/core/mapInfo.js';
import {advice} from '../src/core/advice.js';
const started=()=>{const s=newGame(42);resolvePending(s,0);s.clausula=null;s.pending=[];s.cash=1e8;assert(openBusiness(s,'express','madrid').ok);s.lastReport=computeEconomy(s);s.month=1;return s;};

test('Mapa: cobertura histórica conserva fecha y pasado después de mejorar el obrador',()=>{
 const s=started();assert(s.lastReport.fill<.95);let n=0;while(computeEconomy(s).fill<.99&&n++<10)assert(buyUpgrade(s).ok);
 assertEq(computeEconomy(s).fill,1);const before=serialize(s),a=cityAlerts(s).selaya.find(a=>a.kind==='obrador');
 assert(a.text.includes('Enero 2026'));assert(a.text.includes('Último cierre'));assert(a.text.includes('cubrió'));assert(!a.text.includes('solo cubre'));assertEq(serialize(s),before);
 const paco=advice(s).find(x=>x.text.includes('obrador'));assert(paco.text.includes('Enero 2026'));assert(paco.text.includes('cobertura actual'));assert(!paco.text.includes('estás perdiendo ventas'));assertEq(serialize(s),before);
});

test('Mapa: pérdidas y competencia se atribuyen al cierre y no se inventa una fecha ausente',()=>{
 const s=started(),line=s.lastReport.lines.find(l=>l.id===s.businesses[0].id);line.revenue=1000;line.cost=11000;line.rivalF=.7;
 let a=cityAlerts(s).madrid;assert(a.find(x=>x.kind==='perdidas').text.includes('perdió'));assert(a.find(x=>x.kind==='rival').text.includes('restó'));
 assert(a.every(x=>x.text.includes('Enero 2026')));delete s.lastReport.month;a=cityAlerts(s).madrid;assert(a.every(x=>x.text.includes('Último cierre')));assert(!/undefined|NaN/.test(JSON.stringify(a)));
});

test('Mapa: conservación, franquicia y huelga siguen describiendo estado actual',()=>{
 const s=started();s.lastReport=null;s.businesses[0].cond=20;s.businesses.push({id:90,type:'express',city:'madrid',mode:'franquicia',level:1,value:0,lossMonths:3});s.mods.push({kind:'strike',factor:.5,months:1});
 const before=serialize(s),a=cityAlerts(s).madrid;for(const kind of ['averia','franquicia','huelga'])assert(a.some(x=>x.kind===kind));assert(a.every(x=>!x.text.includes('Último cierre')));assertEq(serialize(s),before);
});
