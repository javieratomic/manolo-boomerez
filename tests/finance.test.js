import {test,assert,assertEq} from './runner.js';
import {newGame,serialize,deserialize} from '../src/core/state.js';
import {grossPatrimonio,patrimonio,ssOwed,obradorValue} from '../src/core/economy.js';
import {lujoValue} from '../src/core/life.js';
import {haciendaDebt} from '../src/core/inspections.js';
import {liquidacion} from '../src/core/plantilla.js';
import {borrow,repay} from '../src/core/actions.js';
const snapshot=async s=>(await import('../src/core/finance.js')).financeSnapshot(s);

test('Finanzas: activos y deudas reconcilian patrimonio sin mutar estado',async()=>{
 const s=newGame(42);s.cash=800000;s.debt=50000;s.cartilla.owed=12000;
 s.businesses=[{id:1,type:'express',value:45000},{id:2,type:'telecom',value:3e6,readyMonth:6}];
 s.extraMonthly=[{ss:true,amount:500,months:8},{amount:900,months:3},{ss:true,amount:100,months:0}];
 const before=serialize(s),p=await snapshot(s);
 assertEq(p.assets.factory,obradorValue(s));assertEq(p.assets.businesses,3045000);assertEq(p.assets.luxury,lujoValue(s));
 assertEq(p.assets.total,s.cash+p.assets.factory+p.assets.businesses+p.assets.luxury);
 assertEq(p.liabilities.socialSecurity,ssOwed(s));assertEq(p.liabilities.total,66000);
 assertEq(p.equity,p.assets.total-p.liabilities.total);assertEq(p.equity,grossPatrimonio(s));assertEq(p.playerWealth,patrimonio(s));
 assertEq(serialize(s),before);
});

test('Finanzas: pedir y devolver crédito no crea patrimonio ni oculta otras deudas',async()=>{
 const s=newGame(12);s.cartilla.owed=20000;const before=await snapshot(s);
 assert(borrow(s,10000).ok);let p=await snapshot(s);assertEq(p.equity,before.equity);assertEq(p.assets.cash,before.assets.cash+10000);assertEq(p.liabilities.bank,10000);
 assert(repay(s,10000).ok);p=await snapshot(s);assertEq(p.equity,before.equity);assertEq(p.liabilities.family,20000);
});

test('Finanzas: exposición es escenario separado, no vuelve a restar SS aplazada',async()=>{
 const s=newGame(7,'hacienda');s.evaded=25000;s.perks.andorra=true;s.dossier.ahorro=[1000,2000];
 s.extraMonthly=[{ss:true,amount:200,months:20}];const p=await snapshot(s);
 assertEq(p.exposure.tax,haciendaDebt(s));assertEq(p.exposure.labor,liquidacion(s));assertEq(p.exposure.total,haciendaDebt(s)+liquidacion(s));
 assertEq(p.exposure.equityAfter,p.equity-p.exposure.total);assertEq(p.exposure.cashAfter,s.cash-p.exposure.total);assertEq(p.playerWealth,patrimonio(s));
 s.dossier.ahorro=[];assertEq((await snapshot(s)).exposure.labor,0);assertEq((await snapshot(s)).liabilities.socialSecurity,4000);
});

test('Finanzas: IPO conserva signo, cuota del jugador y sentimiento incluso cero',async()=>{
 const s=newGame(12);s.cash=-2e6;s.ipo={float:.25,sent:.85};const p=await snapshot(s);
 assert(p.equity<0);assertEq(p.ownership,.75);assertEq(p.sentiment,.85);assertEq(p.playerWealth,patrimonio(s));assertEq(p.exposure.playerWealthAfter,patrimonio(s));
 s.evaded=10000;s.ipo.sent=0;const zero=await snapshot(s);assertEq(zero.playerWealth,0);assertEq(zero.exposure.playerWealthAfter,0);
});

test('Finanzas: cargar una partida conserva informe y consultar no consume RNG',async()=>{
 const s=newGame(42);s.evaded=13000;s.dossier.ahorro=[1234];const before=serialize(s),p=await snapshot(s);
 assertEq(JSON.stringify(await snapshot(deserialize(before))),JSON.stringify(p));await snapshot(s);assertEq(serialize(s),before);
});
