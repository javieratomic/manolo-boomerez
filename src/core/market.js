import {workforcePlan} from './workforce.js';
import {decemberTradition} from './localEvents.js';
import {isOperating} from './construction.js';
// Marketing, I+D y reformas de negocios.
import { CAMPAIGNS, PRODUCTS, UPGRADE_COST, MAX_LEVEL, LEVEL_BONUS } from '../data/market.js';
import { BUSINESS_TYPES } from '../data/businesses.js';
import { CITY_BY_ID } from '../data/cities.js';
import { addCash, addRep, addFama, addHeatHacienda, addMod, log, money } from './helpers.js';
import { execBonus } from './execs.js';

export const CAMPAIGN_BY_ID = Object.fromEntries(CAMPAIGNS.map((c) => [c.id, c]));
export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

// ---------------------------------------------------------------- Campañas
export function campaignRunning(s, id, city = null) {
  return s.mods.find((m) => m.campaign === id && (m.city || null) === city) || null;
}

export function canLaunchCampaign(s, id, city = null) {
  const c = CAMPAIGN_BY_ID[id];
  if (!c) return { ok: false, msg: 'Campaña desconocida.' };
  if ((c.scope === 'city') !== !!city) return { ok: false, msg: 'Ámbito incorrecto.' };
  if (city && !s.businesses.some((b) => b.city === city && b.mode !== 'franquicia') && !CITY_BY_ID[city]?.hq) return { ok: false, msg: 'No tienes negocios propios aquí.' };
  const running = campaignRunning(s, id, city);
  if (running) return { ok: false, msg: `Ya está en marcha (${running.months} meses más).` };
  if (s.cash < c.cost) return { ok: false, msg: `Necesitas ${money(c.cost)}.` };
  return { ok: true, cost: c.cost };
}

export function launchCampaign(s, id, city = null) {
  const check = canLaunchCampaign(s, id, city);
  if (!check.ok) return check;
  const c = CAMPAIGN_BY_ID[id];
  addCash(s, -c.cost);
  const boost = 1 + (c.factor - 1) * (1 + execBonus(s, 'marketing'));
  addMod(s, { kind: 'revenue', city: city || undefined, factor: boost, months: c.months, label: c.name, campaign: id });
  s.flags.campaignDone = true;
  if (c.rep) addRep(s, c.rep);
  if (c.fama) addFama(s, c.fama);
  log(s, `📢 Campaña: ${c.name}${city ? ` en ${CITY_BY_ID[city].name}` : ' en toda España'}.`, 'info');
  return { ok: true };
}

// ---------------------------------------------------------------------- I+D
export function canStartRD(s, id) {
  const p = PRODUCT_BY_ID[id];
  if (!p) return { ok: false, msg: 'Proyecto desconocido.' };
  if (s.products.includes(id)) return { ok: false, msg: 'Ya lo tienes en el catálogo.' };
  if (p.whiteSuccess && !Object.values(s.foreignTrack||{}).some(x=>x.successMonths>=p.whiteSuccess)) return {ok:false,msg:'Primero cumple seis meses de marca blanca sirviendo al menos el 90 % del pedido en un país.'};
  if (s.rd) return { ok: false, msg: 'El laboratorio (la trastienda del obrador) ya está ocupado.' };
  if (p.requires && !s.unlocked[p.requires] && !s.businesses.some((b) => b.type === p.requires)) return { ok: false, msg: `Requiere: ${BUSINESS_TYPES[p.requires]?.name || p.requires}.` };
  if (s.cash < p.cost) return { ok: false, msg: `Necesitas ${money(p.cost)}.` };
  return { ok: true };
}

export function startRD(s, id) {
  const check = canStartRD(s, id);
  if (!check.ok) return check;
  const p = PRODUCT_BY_ID[id];
  addCash(s, -p.cost);
  const months = Math.max(1, Math.round(p.months * (1 - execBonus(s, 'operaciones') * 0.5)));
  s.rd = { id, monthsLeft: months, total: months };
  log(s, `🧪 Empieza el desarrollo de "${p.name}" (${months} meses).`, 'info');
  return { ok: true, months };
}

export function tickRD(s) {
  if (!s.rd) return null;
  s.rd.monthsLeft--;
  if (s.rd.monthsLeft > 0) return null;
  const p = PRODUCT_BY_ID[s.rd.id];
  s.rd = null;
  s.products.push(p.id);
  if(p.opens)s.unlocked[p.opens]=true;
  if (p.fama) addFama(s, p.fama);
  if (p.hac) addHeatHacienda(s, p.hac);
  if (p.contract) s.contracts.push({ id: p.id, label: p.name, units: p.contract.units, price: p.contract.price, months: 999 });
  log(s, `🧁 Nuevo producto en el catálogo: ${p.name}.`, 'good');
  s.notices ||= [];
  s.notices.push({ kicker: '🧪 I+D', title: 'I+D terminado', text: `${p.name}\n\n${p.desc}` });
  return p.id;
}

// Multiplicador de demanda por los productos del catálogo.
export function productFactor(s, type, category, city, month) {
  let f = decemberTradition(s,type,category,city,month);
  for (const id of s.products) {
    const p = PRODUCT_BY_ID[id];
    if (!p) continue;
    for (const e of p.effects) {
      if (e.category && e.category !== category) continue;
      if (e.types && !e.types.includes(type)) continue;
      if (e.minWealth && city.wealth < e.minWealth) continue;
      if (e.minPop && city.pop < e.minPop) continue;
      if (e.months && !e.months.includes(month)) continue;
      f *= e.factor;
    }
  }
  return f;
}

// ---------------------------------------------------------------- Reformas
export const levelFactor = (b) => 1 + LEVEL_BONUS * ((b.level || 1) - 1);

export function upgradeEffect(b) {
  return { obrador_regional: '+5.250 uds/mes de capacidad instalada', vivienda: b.housingForm&&b.housingForm!=='legacy'?'+3 % de renta y mejor calidad':'+5 plazas', airbnb: '+2 pisos turísticos', residencia: '+10 plazas' }[b.type] || `+${Math.round(LEVEL_BONUS * 100)} % de clientela`;
}

export function upgradeCost(b) {
  const lvl = b.level || 1;
  if (lvl >= MAX_LEVEL || b.mode === 'franquicia') return null;
  return Math.round(BUSINESS_TYPES[b.type].cost * (UPGRADE_COST[lvl-1] ?? 1.0*1.45**(lvl-2)));
}

export function upgradeBusiness(s, id) {
  const b = s.businesses.find((x) => x.id === id);
  if (!b) return { ok: false, msg: 'No existe.' };
  if(!isOperating(s,b))return {ok:false,msg:'La construcción debe terminar antes de reformar.'};
  const cost = upgradeCost(b);
  if (cost == null) return { ok: false, msg: b.mode === 'franquicia' ? 'Las franquicias las reforma el franquiciado (o nadie).' : 'Ya está al máximo.' };
  if (s.cash < cost) return { ok: false, msg: `Necesitas ${money(cost)}.` };
  b.level=(b.level||1)+1;
  let plan;try{plan=workforcePlan(s,b.city);}finally{b.level--;}
  if(b.type!=='vivienda'&&plan.missingBeds>0)return {ok:false,msg:`Faltan ${plan.missingBeds} plazas de vivienda en ${CITY_BY_ID[b.city].name}. Ve a Plantilla.`};
  addCash(s, -cost);
  b.level = (b.level || 1) + 1;
  b.cond = 100; // la reforma lo deja como nuevo
  b.value = (b.value || 0) + cost * 0.8;
  log(s, `🔨 Reformas ${BUSINESS_TYPES[b.type].name} de ${CITY_BY_ID[b.city].name} (nivel ${b.level}).`, 'good');
  return { ok: true, level: b.level };
}
