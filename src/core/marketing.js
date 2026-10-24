import {CAMPAIGNS} from '../data/market.js';
import {CITY_BY_ID} from '../data/cities.js';
import {FOREIGN_BY_ID} from '../data/international.js';
import {isOperating} from './construction.js';
import {execBonus} from './execs.js';
import {addCash,addFama,addRep,addMod,log,money} from './helpers.js';

export const CAMPAIGN_BY_ID=Object.fromEntries(CAMPAIGNS.map(c=>[c.id,c]));
const liveDeals=s=>(s.foreignDeals||[]).filter(d=>d.months>0&&!d.dispute);
const fits=(c,type)=>!['vivienda','obrador_regional'].includes(type)&&(!c.types||c.types.includes(type));
const active=s=>s.businesses.filter(b=>isOperating(s,b));
export function marketingTerritories(s,scope) {
 if(scope==='national')return [{id:null,name:'España'}];
 if(scope==='city')return [...new Set(['selaya',...active(s).map(b=>b.city)])].map(id=>({id,name:CITY_BY_ID[id].name})).sort((a,b)=>a.name.localeCompare(b.name,'es'));
 if(scope==='international'){
  const ids=new Set([...liveDeals(s).map(d=>d.market),...active(s).map(b=>CITY_BY_ID[b.city]).filter(c=>c.foreign).map(c=>c.market)]);
  return [...ids].map(id=>({id,name:FOREIGN_BY_ID[id].country})).sort((a,b)=>a.name.localeCompare(b.name,'es'));
 }
 return [];
}
export function campaignRunning(s,id,target=null) {
 const c=CAMPAIGN_BY_ID[id];if(!c)return null;
 return s.mods.find(m=>m.campaign===id&&m.months>0&&(c.scope==='international'?m.market===target:(m.city||null)===target))||null;
}
export function campaignSelection(s,scope,requested=null) {
 const ids=marketingTerritories(s,scope).map(t=>t.id);
 return requested==null?ids:[...new Set(requested)].filter(id=>ids.includes(id));
}
function affinity(s,c,target) {
 const businesses=active(s);
 if(c.scope==='city')return target==='selaya'&&fits(c,'obrador')||businesses.some(b=>b.city===target&&fits(c,b.type));
 if(c.scope==='national')return fits(c,'obrador')||businesses.some(b=>!CITY_BY_ID[b.city].foreign&&fits(c,b.type));
 return businesses.some(b=>CITY_BY_ID[b.city].market===target&&fits(c,b.type))||liveDeals(s).some(d=>d.market===target&&fits(c,d.brand||s.brand));
}
export function campaignPlan(s,id,requested=null) {
 const c=CAMPAIGN_BY_ID[id];if(!c)return {ok:false,msg:'Campaña desconocida.',targets:[],skipped:[],cost:0};
 const all=marketingTerritories(s,c.scope),scopeIds=new Set(all.map(t=>t.id));
 if(requested!=null&&!Array.isArray(requested))return {ok:false,msg:'Lista de territorios incorrecta.',targets:[],skipped:[],cost:0};
 const ids=requested==null?all.map(t=>t.id):[...new Set(requested)];
 if(ids.some(t=>!scopeIds.has(t)))return {ok:false,msg:'Hay territorios desconocidos o sin presencia operativa para este ámbito.',targets:[],skipped:[],cost:0};
 const targets=[],skipped=[];
 for(const id of ids){const t=all.find(t=>t.id===id),running=campaignRunning(s,c.id,id);if(running)skipped.push({...t,reason:'Ya activa',months:running.months});else if(!affinity(s,c,id))skipped.push({...t,reason:'Sin negocios afines'});else targets.push(t);}
 const cost=targets.length*c.cost;
 const msg=!ids.length?'Selecciona al menos un territorio.':!targets.length?'No quedan territorios elegibles sin esta campaña activa.':c.launchMonths&&!c.launchMonths.includes(s.month%12)?'Esta campaña se contrata de septiembre a noviembre.':s.cash<cost?`Necesitas ${money(cost)} para contratar el lote completo.`:null;
 return {ok:!msg,msg,scope:c.scope,targets,skipped,cost,campaign:c};
}
export const canLaunchCampaign=(s,id,target=null)=>campaignPlan(s,id,[target]);
function commitCampaign(s,c,target) {
 addCash(s,-c.cost);
 const factor=1+(c.factor-1)*(1+execBonus(s,'marketing'));
 addMod(s,{kind:'revenue',scope:c.scope,city:c.scope==='city'?target.id:undefined,market:c.scope==='international'?target.id:undefined,factor,months:c.months,label:c.name,campaign:c.id});
 s.flags.campaignDone=true;if(c.rep)addRep(s,c.rep);if(c.fama)addFama(s,c.fama);
 log(s,`📢 ${c.name} en ${target.name}: ${money(c.cost)}, ${c.months} meses.`,'info');
}
export function launchCampaignBatch(s,id,targets=null) {
 const plan=campaignPlan(s,id,targets);if(!plan.ok)return plan;
 for(const t of plan.targets)commitCampaign(s,plan.campaign,t);
 return {ok:true,cost:plan.cost,count:plan.targets.length,targets:plan.targets,skipped:plan.skipped};
}
export const launchCampaign=(s,id,target=null)=>launchCampaignBatch(s,id,[target]);

export function campaignApplies(s,mod,category,cityId,type) {
 const c=CAMPAIGN_BY_ID[mod.campaign],city=CITY_BY_ID[cityId];
 if(!c||!city||mod.months<=0||!fits(c,type)||c.activeMonths&&!c.activeMonths.includes(s.month%12))return false;
 if(c.scope==='city')return mod.city===cityId;
 if(c.scope==='national')return !city.foreign;
 return city.foreign&&city.market===mod.market;
}
export function countryCampaignFactor(s,market,brand=s.brand) {
 let factor=1;
 for(const m of s.mods){const c=CAMPAIGN_BY_ID[m.campaign];if(c?.scope==='international'&&m.kind==='revenue'&&m.market===market&&m.months>0&&fits(c,brand)&&(!c.activeMonths||c.activeMonths.includes(s.month%12)))factor*=m.factor;}
 return factor;
}
