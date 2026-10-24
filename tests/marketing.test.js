import {test,assert,assertEq} from './runner.js';
import {newGame,serialize,deserialize} from '../src/core/state.js';
import {resolvePending,advanceMonth,currentPending} from '../src/core/sim.js';
import {CAMPAIGNS} from '../src/data/market.js';
import {launchCampaign,canLaunchCampaign} from '../src/core/market.js';
import {computeEconomy,modFactor} from '../src/core/economy.js';
import {signAgreement,foreignDemand} from '../src/core/international.js';

const started=()=>{const s=newGame(42);resolvePending(s,0);s.cash=1e8;s.pending=[];s.clausula=null;return s;};
const add=(s,type,city,extra={})=>s.businesses.push({id:s.nextId++,type,city,mode:'propia',level:1,value:100000,...extra});

test('Marketing: hay variedad nacional, local e internacional y se preservan ids antiguos',()=>{
 for(const scope of ['national','city','international'])assert(CAMPAIGNS.filter(c=>c.scope===scope).length>=6,scope);
 for(const id of ['buzoneo','vallas','futbol','radio','influencers','tele'])assert(CAMPAIGNS.some(c=>c.id===id));
 assertEq(new Set(CAMPAIGNS.map(c=>c.id)).size,CAMPAIGNS.length);
});

test('Marketing: campañas nacionales no se filtran a negocios extranjeros',()=>{
 const s=started();add(s,'express','madrid');add(s,'express','lisboa');
 assert(launchCampaign(s,'radio').ok);
 assert(modFactor(s,'revenue','sobaos','madrid','express')>1);
 assertEq(modFactor(s,'revenue','sobaos','lisboa','express'),1);
});

test('Marketing: una obra no habilita campaña local, una franquicia operativa sí',()=>{
 const s=started();add(s,'airbnb','madrid',{readyMonth:12});assert(!canLaunchCampaign(s,'buzoneo','madrid').ok);
 add(s,'express','barcelona',{mode:'franquicia'});assert(canLaunchCampaign(s,'buzoneo','barcelona').ok);
});

test('Marketing: lote central cobra territorios únicos y omite campañas activas',async()=>{
 const {campaignPlan,launchCampaignBatch}=await import('../src/core/marketing.js');
 const s=started();add(s,'express','madrid');add(s,'express','madrid');add(s,'express','barcelona');
 assert(launchCampaign(s,'buzoneo','madrid').ok);
 const before=serialize(s),plan=campaignPlan(s,'buzoneo',['madrid','barcelona','barcelona','selaya']);
 assertEq(serialize(s),before);assert(plan.ok);assertEq(plan.targets.length,2);assertEq(plan.cost,5000);
 const cash=s.cash;assert(launchCampaignBatch(s,'buzoneo',['madrid','barcelona','barcelona','selaya']).ok);assertEq(cash-s.cash,5000);
 const after=serialize(s);assert(!launchCampaignBatch(s,'buzoneo',['madrid','barcelona','selaya']).ok);assertEq(serialize(s),after);
});

test('Marketing: falta de presupuesto y destinos inválidos no dejan un lote a medias',async()=>{
 const {launchCampaignBatch}=await import('../src/core/marketing.js');const s=started();add(s,'express','madrid');s.cash=3000;
 for(const targets of [['madrid','selaya'],['madrid','inventada']]){const before=serialize(s);assert(!launchCampaignBatch(s,'buzoneo',targets).ok);assertEq(serialize(s),before);}
});

test('Marketing internacional: país único, aumento de pedidos de marca blanca y licencia sin consumo',async()=>{
 const {marketingTerritories}=await import('../src/core/marketing.js');const white=started();signAgreement(white,'portugal','private_label',false);add(white,'express','lisboa');add(white,'express','porto');
 assertEq(marketingTerritories(white,'international').filter(t=>t.id==='portugal').length,1);
 const c=CAMPAIGNS.find(c=>c.scope==='international');assert(c);const before=foreignDemand(white);assert(launchCampaign(white,c.id,'portugal').ok);assert(foreignDemand(white)>before);
 const licence=started();signAgreement(licence,'francia','licence',false);const base=computeEconomy(licence);assert(launchCampaign(licence,c.id,'francia').ok);const after=computeEconomy(licence);
 assertEq(after.totalDemand,base.totalDemand);assert(after.lines.find(l=>l.foreign).revenue>base.lines.find(l=>l.foreign).revenue);
 assertEq(deserialize(serialize(licence)).mods.find(m=>m.campaign===c.id).market,'francia');
});

test('Marketing: el lote equivale a lanzamientos individuales y omite destinos no afines',async()=>{
 const {launchCampaignBatch,campaignPlan}=await import('../src/core/marketing.js');const s=started();add(s,'express','madrid');add(s,'banca','barcelona');
 const p=campaignPlan(s,'degustaciones',['madrid','barcelona','selaya']);assertEq(p.targets.length,2);assertEq(p.skipped[0].id,'barcelona');
 const one=structuredClone(s),batch=structuredClone(s);launchCampaign(one,'buzoneo','madrid');launchCampaign(one,'buzoneo','selaya');launchCampaignBatch(batch,'buzoneo',['madrid','selaya']);
 assertEq(one.cash,batch.cash);assertEq(one.rep,batch.rep);assertEq(one.fama,batch.fama);assertEq(computeEconomy(one).net,computeEconomy(batch).net);
});

test('Marketing: caducidad, ventana navideña, carga antigua y ámbito inválido',()=>{
 const s=started();assert(!canLaunchCampaign(s,'navidad').ok);s.month=8;assert(launchCampaign(s,'navidad').ok);assertEq(modFactor(s,'revenue','sobaos','selaya','obrador'),1);
 s.month=10;assert(modFactor(s,'revenue','sobaos','selaya','obrador')>1);
 const legacy=started();launchCampaign(legacy,'radio');delete legacy.mods[0].scope;const c=deserialize(serialize(legacy));assert(modFactor(c,'revenue','sobaos','selaya','obrador')>1);
 for(let i=0;i<3;i++){while(c.pending.length)resolvePending(c,currentPending(c).choices[0].index);advanceMonth(c);}
 assert(!c.mods.some(m=>m.campaign==='radio'));
 const invalid=started();launchCampaign(invalid,'radio');invalid.mods[0].market='portugal';let rejected=false;try{deserialize(serialize(invalid))}catch{rejected=true}assert(rejected);
});

test('Marketing internacional: conflictos y obras sin presencia no permiten gastar',()=>{
 const s=started(),id=CAMPAIGNS.find(c=>c.scope==='international').id;add(s,'express','lisboa',{readyMonth:12});assert(!canLaunchCampaign(s,id,'portugal').ok);
 signAgreement(s,'francia','private_label',false);s.foreignDeals[0].dispute='calidad';assert(!canLaunchCampaign(s,id,'francia').ok);
});
