import {ONLINE_LEVELS,ONLINE_SHIPPING,ONLINE_BRANDS,ONLINE_BOX} from '../data/online.js';
import {researchFactor} from '../data/market.js';
import {workforcePlan} from './workforce.js';
import {isOperating} from './construction.js';
import {campaignApplies} from './marketing.js';
import {addCash,log,money} from './helpers.js';

export function onlineRevenueFactor(s) {
 let factor=1;
 for(const m of s.mods){
  if(m.kind!=='revenue'||m.city||m.market||m.category&&m.category!=='sobaos'||m.types&&!m.types.includes(s.brand)&&!m.types.includes('online'))continue;
  if(m.campaign&&!campaignApplies(s,m,'sobaos','selaya',s.brand))continue;
  factor*=m.factor;
 }
 return factor;
}
export function calculateOnline(s,{availableUnits=0,staff=0,wage=0,demandFactor=1,materialFactor=1}={}) {
 const state=s.online||{level:0,active:false,shipping:'incluido'},plan=ONLINE_LEVELS[state.level],brand=ONLINE_BRANDS[s.brand]||ONLINE_BRANDS.express,shippingPolicy=ONLINE_SHIPPING[state.shipping];
 const active=!!state.active&&state.level>0;
 const hub=s.businesses.some(b=>b.type==='logistica'&&b.city==='selaya'&&b.mode!=='franquicia'&&isOperating(s,b));
 const parcelCost=brand.parcel*researchFactor(s,'transportFactor')*(hub?0.85:1);
 const potentialUnits=active?Math.max(0,Math.floor(plan.demand*brand.traffic*shippingPolicy.demand*demandFactor/ONLINE_BOX)*ONLINE_BOX):0;
 const maxOrders=active?Math.floor(plan.maxOrders*staff/Math.max(1,plan.staff)):0;
 const orders=Math.max(0,Math.min(potentialUnits/ONLINE_BOX,maxOrders,Math.floor(availableUnits/ONLINE_BOX))),units=orders*ONLINE_BOX;
 const materialUnit=(s.brand==='maison'?2.6:1.05)*materialFactor;
 const productRevenue=units*brand.price,chargedShipping=orders*shippingPolicy.charge,revenue=productRevenue+chargedShipping;
 const materials=units*materialUnit,shipping=orders*parcelCost,packaging=orders*brand.packaging,payments=revenue*0.03,returns=productRevenue*0.02;
 const fixed=active?plan.monthly:0,wages=active?staff*wage:0;
 const cost=materials+shipping+packaging+payments+returns+fixed+wages;
 const unitRevenue=brand.price+shippingPolicy.charge/ONLINE_BOX;
 const unitContribution=unitRevenue-materialUnit-(parcelCost+brand.packaging)/ONLINE_BOX-unitRevenue*0.03-brand.price*0.02;
 return {level:state.level,active,potentialUnits,potentialOrders:potentialUnits/ONLINE_BOX,maxOrders,orders,units,productRevenue,chargedShipping,revenue,materials,shipping,packaging,payments,returns,fixed,wages,staff:active?staff:0,cost,profit:revenue-cost,unitContribution,contributionMargin:unitContribution/unitRevenue,parcelCost,unitPrice:brand.price};
}
function levelCheck(s,level) {
 const p=ONLINE_LEVELS[level];
 if(!s.brand)return {ok:false,msg:'Primero elige tu marca de sobaos.'};
 if(!p||level<1)return {ok:false,msg:'La plataforma ya está al máximo.'};
 if(s.cash<p.cost)return {ok:false,msg:`Necesitas ${money(p.cost)}.`};
 const projected={...s,online:{...s.online,level,active:true}};
 const labor=workforcePlan(projected,'selaya');
 if(labor.missingBeds>0)return {ok:false,msg:`Faltan ${labor.missingBeds} viviendas en Selaya para la plantilla de fabricación y venta online.`};
 return {ok:true,cost:p.cost,level};
}
export const canOpenOnline=s=>s.online?.level>0?{ok:false,msg:'La tienda online ya está abierta.'}:levelCheck(s,1);
export const canUpgradeOnline=s=>s.online?.level>0?levelCheck(s,s.online.level+1):{ok:false,msg:'Abre primero la tienda online.'};
export function openOnline(s) {
 const c=canOpenOnline(s);if(!c.ok)return c;
 addCash(s,-c.cost);s.online={level:1,active:true,shipping:'incluido'};log(s,`🛒 Abres la tienda online por ${money(c.cost)}. Solo se aceptarán pedidos con excedente real.`,'good');return {ok:true};
}
export function upgradeOnline(s) {
 const c=canUpgradeOnline(s);if(!c.ok)return c;
 addCash(s,-c.cost);s.online.level=c.level;log(s,`🛒 Amplías el canal online: ${ONLINE_LEVELS[c.level].name}, ${money(c.cost)}.`,'good');return {ok:true};
}
export function toggleOnline(s) {
 if(!s.online?.level)return {ok:false,msg:'La tienda online aún no está abierta.'};
 if(!s.online.active){const c=levelCheck({...s,cash:Infinity},s.online.level);if(!c.ok)return c;}
 s.online.active=!s.online.active;return {ok:true};
}
export function setOnlineShipping(s,id) {
 if(!Object.hasOwn(ONLINE_SHIPPING,id)||!s.online?.level)return {ok:false,msg:'Política de portes no disponible.'};
 s.online.shipping=id;return {ok:true};
}
