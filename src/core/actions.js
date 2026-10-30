import {workforcePlan,missingBedsAhead,bedsMessage} from './workforce.js';
import {HOUSING_FORMS} from '../data/housing.js';
import {buildMonths,businessName} from './construction.js';
// Acciones del jugador durante el mes (todas validan y devuelven { ok, msg }).
import { BUSINESS_TYPES, OBRADOR_UPGRADES, PERKS, SOBAO_TYPE_BY_BRAND, expansionUpgrade } from '../data/businesses.js';
import { CITY_BY_ID } from '../data/cities.js';
import { POLICIES } from '../data/policies.js';
import { ACTION_BY_ID } from '../data/manoloActions.js';
import { GOALS } from '../data/goals.js';
import { execBonus, execSkill } from './execs.js';
import { addStress, ACTION_STRESS } from './life.js';
import { LEGACY_GOAL_ORDER } from './state.js';
import { creditLimit } from './economy.js';
import { addCash, log, money, hito } from './helpers.js';
import { checkClause } from './clauses.js';
import { breaksPromise } from './cartilla.js';

export const LOAN_STEP = 25000;
export const FRANCHISES_PER_MONTH = 3;
export const MAX_PER_CITY = 6; // compatibilidad con herramientas anteriores
export const cityBusinessLimit = city => 6+Math.ceil(6*(CITY_BY_ID[city]?.pop||0));

export function sobaoOutlets(s) {
  return s.businesses.filter((b) => BUSINESS_TYPES[b.type].category === 'sobaos').length;
}

export function sobaoTypeId(s) {
  return SOBAO_TYPE_BY_BRAND[s.brand] || 'express';
}

// Pisos turísticos: en las ciudades saturadas hay que comprar licencia (o arriesgarse sin ella).
export const needsLicense = (typeId, cityId) => !!(BUSINESS_TYPES[typeId]?.license && CITY_BY_ID[cityId]?.touristLicense);

export function openingCost(s, typeId, mode = 'propia', cityId = null, housingForm='apartamentos') {
  const t = BUSINESS_TYPES[typeId];
  if (mode === 'franquicia') return 0;
  const license = mode === 'propia' && needsLicense(typeId, cityId) ? t.license : 0;
  const rent = CITY_BY_ID[cityId]?.rent ?? 0.9;
  const location = t.realEstate ? 0.25 + rent / 1.2 : 0.55 + 0.5 * rent;
  const cousin=typeId==='empanadas'&&s.flags.primoSocio&&!s.flags.empanadaFirstUsed&&!s.businesses.some(b=>b.type==='empanadas')?0.7:1;
  const cost=typeId==='vivienda'?(HOUSING_FORMS[housingForm]?.cost??t.cost):t.cost;
  return Math.round(cost * location * (1 - (s.discountNext || 0)) * (1 - execBonus(s, 'expansion')) * cousin + license);
}

export function franchiseFee(s, typeId) {
  return Math.round(BUSINESS_TYPES[typeId].franchiseFee * (1 + 0.1 * execSkill(s, 'expansion')));
}

export function canOpen(s, typeId, cityId, mode = 'propia', housingForm='apartamentos') {
  const t = BUSINESS_TYPES[typeId];
  const c = CITY_BY_ID[cityId];
  if (!t || !c) return { ok: false, msg: 'Negocio o ciudad desconocidos.' };
  if(typeId==='vivienda'&&!['apartamentos','chalets'].includes(housingForm))return {ok:false,msg:'Promoción residencial desconocida.'};
  if(typeId==='empanadas'&&!s.flags.primoSocio)return {ok:false,msg:'Necesitas asociarte con Rodrigo cuando aparezca el primo argentino.'};
  if(c.foreign) {
    if(!(s.products||[]).includes('expansion_propia'))return {ok:false,msg:'Investiga Despliegue comercial internacional en I+D.'};
    if((s.foreignTrack?.[c.market]?.successMonths||0)<6)return {ok:false,msg:'Necesitas seis meses de marca blanca sirviendo al menos el 90 % en este país.'};
    if((s.foreignDeals||[]).some(d=>d.market===c.market&&d.mode==='licence'))return {ok:false,msg:'Rescinde la licencia territorial antes de abrir con tu propia marca.'};
  }
  if (t.category === 'sobaos' && typeId !== sobaoTypeId(s)) return { ok: false, msg: 'Esa no es tu marca.' };
  if (t.category !== 'sobaos' && typeId !== 'vivienda' && !s.unlocked[typeId]) return { ok: false, msg: 'Aún no está desbloqueado.' };
  if (mode === 'franquicia' && t.category !== 'sobaos') return { ok: false, msg: 'Solo las tiendas de sobaos se franquician.' };
  // Sin este tope se podían colocar cientos de franquicias ruinosas en un mes y quedarse con los cánones.
  if (mode === 'franquicia' && s.businesses.filter((b) => b.mode === 'franquicia' && b.openedMonth === s.month).length >= FRANCHISES_PER_MONTH) return { ok: false, msg: `Este mes ya has colocado ${FRANCHISES_PER_MONTH} franquicias: no hay tantos incautos por semana. El mes que viene, más.` };
  if (mode === 'ilegal' && !needsLicense(typeId, cityId)) return { ok: false, msg: 'Aquí no hace falta licencia.' };
  if (t.onePerCity && s.businesses.some((b) => b.type === typeId && b.city === cityId)) return { ok: false, msg: 'Ya tienes uno en esta ciudad.' };
  if (t.unique && s.businesses.some((b) => b.type === typeId)) return { ok: false, msg: 'Solo puede haber una.' };
  if (c.hq && t.category !== 'sobaos' && !['vivienda', 'taberna', 'residencia'].includes(typeId)) return { ok: false, msg: typeId === 'obrador_regional' ? 'En Selaya ya está el obrador principal.' : 'En Selaya no hay mercado para eso.' };
  if (typeId!=='vivienda' && s.businesses.filter((b) => b.city === cityId && b.type!=='vivienda').length >= cityBusinessLimit(cityId)) return { ok: false, msg: 'Ya no caben más negocios en esta ciudad.' };
  if(typeId!=='vivienda' && mode!=='franquicia') {
    const tmp={id:-2,type:typeId,city:cityId,mode,level:1};s.businesses.push(tmp);
    let gap;try{gap=missingBedsAhead(s,cityId);}finally{s.businesses.splice(s.businesses.indexOf(tmp),1);}
    if(gap.missing>0)return {ok:false,msg:bedsMessage(s,gap,c.name)};
  }
  const cost = openingCost(s, typeId, mode, cityId,housingForm);
  if (cost > s.cash) return { ok: false, msg: `Necesitas ${money(cost)} en caja.` };
  return { ok: true, cost };
}

export function openBusiness(s, typeId, cityId, mode = 'propia',housingForm='apartamentos') {
  const check = canOpen(s, typeId, cityId, mode,housingForm);
  if (!check.ok) return check;
  const t = BUSINESS_TYPES[typeId];
  const c = CITY_BY_ID[cityId];
  const b = { id: s.nextId++, type: typeId, city: cityId, mode, openedMonth: s.month, value: 0, lossMonths: 0, level: 1 };
  if(typeId==='vivienda')b.housingForm=housingForm;
  const wait=buildMonths(typeId);
  if(wait){b.readyMonth=s.month+wait;b.delivered=false;}
  if(['vivienda','airbnb'].includes(typeId))b.renewalMonth=b.readyMonth+180;
  if (mode === 'franquicia') {
    const fee = franchiseFee(s, typeId);
    b.fee = fee;
    addCash(s, fee);
    log(s, `🤝 Un incauto de ${c.name} compra una franquicia de ${t.name} por ${money(fee)}.`, 'good');
  } else {
    addCash(s, -check.cost);
    // Los inmuebles pierden un 15 % al comprarlos (notaría, ITP, comisión del primo agente inmobiliario).
    b.value = t.realEstate ? check.cost * 0.85 : check.cost;
    if (mode === 'ilegal') {
      b.mode = 'propia';
      b.ilegal = true;
      log(s, `🙈 Los pisos de ${c.name} funcionan sin licencia turística. "Son de alquiler de temporada", dices.`, 'bad');
    }
    s.discountNext = 0;
    log(s, wait?`🏗️ Empieza la obra de ${businessName(b)} en ${c.name}. Entrega en ${wait} meses.`:`🏗️ Abres ${t.name} en ${c.name}.`, 'good');
  }
  s.businesses.push(b);
  if(typeId==='empanadas')s.flags.empanadaFirstUsed=true;
  s.stats.abiertos++;
  hito(s, mode === 'franquicia' ? 'primera_franquicia' : 'primera_tienda');
  checkUnlocks(s);
  return { ok: true, business: b };
}

export function saleValue(b) {
  const t = BUSINESS_TYPES[b.type];
  if (b.mode === 'franquicia') return -Math.round(b.fee ?? t.franchiseFee ?? 0); // indemnización al franquiciado
  return Math.round((b.value || 0) * (t.realEstate ? 0.9 : 0.6));
}

export function sellBusiness(s, businessId) {
  const i = s.businesses.findIndex((b) => b.id === businessId);
  if (i < 0) return { ok: false, msg: 'No existe.' };
  const b = s.businesses[i];
  const t = BUSINESS_TYPES[b.type];
  const value = saleValue(b);
  if (value < 0 && s.cash < -value) return { ok: false, msg: `Rescindir cuesta ${money(-value)} de indemnización.` };
  addCash(s, value);
  s.businesses.splice(i, 1);
  const c = CITY_BY_ID[b.city];
  log(s, b.mode === 'franquicia'
    ? `✂️ Rescindes la franquicia de ${c.name} y le devuelves el canon (${money(-value)}). El franquiciado llora; tú también, un poco.`
    : `💸 Vendes ${t.name} de ${c.name} por ${money(value)}.`, 'info');
  return { ok: true, value };
}

export function nextUpgrade(s) {
  return OBRADOR_UPGRADES.find((u) => !s.obrador.upgrades.includes(u.id)) || expansionUpgrade(s.obrador.expansions || 0);
}

export function upgradeRequirements(s) {
  const u=nextUpgrade(s);
  const oldExp=s.obrador.expansions||0;
  if(u.expansion)s.obrador.expansions=oldExp+1;else s.obrador.upgrades.push(u.id);
  let plan;try{plan=workforcePlan(s,'selaya');}finally{if(u.expansion)s.obrador.expansions=oldExp;else s.obrador.upgrades.pop();}
  return plan;
}

export function buyUpgrade(s) {
  const u = nextUpgrade(s);
  if (!Number.isSafeInteger(u.cost)) return { ok: false, msg: 'Esta ampliación supera el importe máximo que puede representar el juego.' };
  if (s.cash < u.cost) return { ok: false, msg: `Necesitas ${money(u.cost)}.` };
  const plan=upgradeRequirements(s);
  if(plan.missingBeds>0)return {ok:false,msg:`Antes de ampliar faltan ${plan.missingBeds} plazas de vivienda en Selaya para la nueva plantilla. Ve a Equipo → Viviendas.`};
  addCash(s, -u.cost);
  if (u.expansion) s.obrador.expansions = (s.obrador.expansions || 0) + 1;
  else s.obrador.upgrades.push(u.id);
  log(s, `🏭 Obrador mejorado: ${u.name}.`, 'good');
  return { ok: true, upgrade: u };
}

export function setPolicy(s, key, value) {
  if (!POLICIES[key]?.options[value]) return { ok: false, msg: 'Política desconocida.' };
  if(key==='residencia'&&value!=='ninguno'&&!s.businesses.some(b=>b.type==='residencia'&&b.mode!=='franquicia'))return {ok:false,msg:'Necesitas una residencia propia para ofrecer el descuento.'};
  const REPARTO_RANK = { ninguno: 0, paga: 1, participacion: 2 };
  if (key === 'reparto' && s.comite?.paz > 0 && s.comite.repartoMin && REPARTO_RANK[value] < REPARTO_RANK[s.comite.repartoMin]) {
    return { ok: false, msg: `Lo firmaste con el comité para acabar la huelga: no puedes bajarlo durante ${s.comite.paz} meses.` };
  }
  if (s.cartilla?.firme && breaksPromise(s, key, value)) return { ok: false, msg: 'Tu madre: "Me lo prometiste, Manolo." Hasta que le devuelvas el dinero, eso no se toca.' };
  if (key === 'mantenimiento' && (s.cartilla?.owed || 0) > 0 && (s.cartilla.conds || []).includes('kevin') && value !== 'kevin') {
    return { ok: false, msg: 'Tu madre: "Kevin se queda hasta que me devuelvas lo mío."' };
  }
  if (s.flags.forcedLegal > 0 && isIllegalChoice(key, value)) {
    const who = s.flags.forcedBy === 'convenio' ? 'Lo firmaste en el convenio' : 'La Inspección te vigila';
    return { ok: false, msg: `${who}: no puedes cambiar esto durante ${s.flags.forcedLegal} meses.` };
  }
  s.policies[key] = value;
  return { ok: true };
}

function isIllegalChoice(key, value) {
  return (key === 'salario' && value !== 'convenio') || (key === 'horas' && value !== 'pagadas') || (key === 'becarios' && value !== 'ninguno');
}

export function togglePerk(s, id) {
  const p = PERKS[id];
  if (!p) return { ok: false, msg: 'Asesor desconocido.' };
  if (id === 'gestor' && !s.perks.gestor && s.flags.pacoSeFue != null && s.month - s.flags.pacoSeFue < 12) {
    return { ok: false, msg: 'Paco no te coge el teléfono: "Búscate otro gestor, Manolo." (Vuelve a probar dentro de un año.)' };
  }
  if (!s.perks[id] && p.setup && !s.andorraPaid) {
    if (s.cash < p.setup) return { ok: false, msg: `Montarlo cuesta ${money(p.setup)}.` };
    addCash(s, -p.setup);
    s.andorraPaid = true;
    log(s, '🇦🇩 Constituyes "Boomerez Holding Andorra S.L.U.". El domicilio es un buzón entre otros 400 buzones.', 'info');
  }
  s.perks[id] = !s.perks[id];
  if (id === 'gestor' && s.perks.gestor) s.flags.pacoCulpas = 0; // empieza de cero con él
  return { ok: true, on: s.perks[id] };
}

export function borrow(s, amount = LOAN_STEP) {
  const limit = creditLimit(s);
  const room = limit - s.debt;
  if (room <= 0) {
    s.flags.bancoNo = s.month; // ahora tu madre sí presta (durante unos meses)
    return { ok: false, msg: 'El banco dice que no. Ni con un sobao de regalo. (Tu madre tiene una cartilla...)' };
  }
  const a = Math.min(amount, room);
  s.debt += a;
  addCash(s, a);
  s.flags.prestamoPedido = true;
  checkClause(s);
  return { ok: true, amount: a };
}

export function repay(s, amount = LOAN_STEP) {
  const a = Math.min(amount, s.debt, Math.max(0, s.cash));
  if (a <= 0) return { ok: false, msg: 'No hay nada que devolver (o no tienes con qué).' };
  s.debt -= a;
  addCash(s, -a);
  return { ok: true, amount: a };
}

export const REBRAND_COST = { maison: 150000, express: 60000 };
export const REBRAND_COOLDOWN = 24;

export function canRebrand(s) {
  const to = s.brand === 'maison' ? 'express' : 'maison';
  const last = s.flags.lastRebrand;
  if (last != null && s.month - last < REBRAND_COOLDOWN) return { ok: false, to, msg: `Tu último rebranding fue hace poco. Espera ${REBRAND_COOLDOWN - (s.month - last)} meses.` };
  if (s.cash < REBRAND_COST[to]) return { ok: false, to, msg: `Necesitas ${money(REBRAND_COST[to])}.` };
  return { ok: true, to, cost: REBRAND_COST[to] };
}

// Cambia de marca y reconvierte todas las tiendas de sobaos.
export function rebrand(s) {
  const check = canRebrand(s);
  if (!check.ok) return check;
  addCash(s, -check.cost);
  s.brand = check.to;
  for (const b of s.businesses) if (BUSINESS_TYPES[b.type].category === 'sobaos') b.type = check.to;
  s.flags.lastRebrand = s.month;
  if (check.to === 'express') {
    s.rep = Math.max(0, s.rep - 6);
    log(s, '🔁 Rebranding: la Maison pasa a ser "Sobaos Manolo Express". El mármol, a una web de segunda mano. Reputación −6.', 'info');
  } else {
    s.fama = Math.min(100, s.fama + 5);
    log(s, '🔁 Rebranding: nace "Maison Boomerez". Los neones, al contenedor. Fama +5.', 'info');
  }
  return { ok: true, to: check.to };
}

// Prescindir de un gasto fijo (sueldos de familiares, seguros del banco...).
export function dropMonthlyCost(s, index) {
  const x = s.extraMonthly[index];
  if (!x) return { ok: false, msg: 'Ese gasto ya no existe.' };
  if (x.kevin) return { ok: false, msg: 'Tu madre: "Kevin se queda hasta que me devuelvas lo mío."' };
  if (x.locked) return { ok: false, msg: 'Eso no se quita con un clic: es la Seguridad Social.' };
  s.extraMonthly.splice(index, 1);
  log(s, `✂️ Quitas el gasto: ${x.label}.`, 'info');
  return { ok: true, item: x };
}

export function doManoloAction(s, id) {
  if (s.actionUsed && s.flags.domingo === s.month) return { ok: false, msg: 'Hoy no, Manolo: es domingo de cocido en casa de tu madre.' };
  if (s.actionUsed) return { ok: false, msg: 'Manolo ya ha hecho bastante este mes. Necesita su siesta.' };
  if (s.restMonths > 0) return { ok: false, msg: `Reposo médico: ${s.restMonths} ${s.restMonths === 1 ? 'mes' : 'meses'} más sin hacer nada. Órdenes de la cardióloga (y de Merche).` };
  const a = ACTION_BY_ID[id];
  if (!a) return { ok: false, msg: 'Acción desconocida.' };
  if (a.cost && s.cash < a.cost) return { ok: false, msg: `Necesitas ${money(a.cost)}.` };
  s.actionUsed = true;
  const text = a.run(s);
  addStress(s, ACTION_STRESS[id] ?? 0);
  checkUnlocks(s);
  return { ok: true, text };
}

// month: mes en que se desbloquea por calendario (lo usa el parte del mes para avisar).
export const UNLOCKS = [
  { id: 'vivienda', test: (s) => !!s.brand, text: '🔓 Desbloqueado: Residencial Boomerez. "¿Y si mis empleados me pagan el alquiler a mí?"' },
  { id: 'airbnb', month: 12, test: (s) => s.month >= 12 || s.cash >= 250000, text: '🔓 Desbloqueado: Apartamentos turísticos "Casa Manolo".' },
  { id: 'smash', month: 18, test: (s) => sobaoOutlets(s) >= 4 || s.month >= 18, text: '🔓 Desbloqueado: Manolo Smash Club. Hay que diversificar.' },
  { id: 'empanadas', test: (s) => !!s.flags.primoSocio, text: '🔓 Desbloqueado: Empanadas El Gaucho Pasiego, en sociedad con Rodrigo.' },
  { id: 'academy', test: (s) => s.fama >= 25, text: '🔓 Desbloqueado: Boomerez Business Academy. Tu fama ya da para vender cursos.' },
  { id: 'obrador_regional', month: 24, test: (s) => sobaoOutlets(s) >= 6 || s.month >= 24, text: '🔓 Desbloqueado: obradores regionales. Fabricar cerca de las tiendas ahorra transporte.' },
  { id: 'taberna', month: 6, test: (s) => sobaoOutlets(s) >= 2 || s.month >= 6, text: '🔓 Desbloqueado: La Taberna del Emprendedor. Donde se cierran los negocios de verdad.' },
  { id: 'gimnasio', month: 12, test: (s) => s.month >= 12 || sobaoOutlets(s) >= 5, text: '🔓 Desbloqueado: Boomer Fit 24h. "Mens sana in corpore sobao."' },
  { id: 'coworking', test: (s) => s.fama >= 35 || s.businesses.some((b) => b.type === 'academy'), text: '🔓 Desbloqueado: Hustle Hub Coworking. Las startups pagan por sentarse cerca de ti.' },
  { id: 'residencia', month: 24, test: (s) => s.month >= 24 || s.stats.maxPatrimonio >= 2e6, text: '🔓 Desbloqueado: Residencia Golden Age. "La plata está en las canas", te dice un fondo.' },
];

export function checkUnlocks(s) {
  const found = [];
  for (const u of UNLOCKS) {
    if (!s.unlocked[u.id] && u.test(s)) {
      s.unlocked[u.id] = true;
      log(s, u.text, 'good');
      found.push(u.id);
    }
  }
  checkGoals(s);
  checkClause(s);
  return found;
}

// Orden de los objetivos en las partidas guardadas antes de pasar a guardarlos por id.

function goalsDone(s) {
  if (!s.goalsDone) s.goalsDone = LEGACY_GOAL_ORDER.slice(0, s.goalIndex ?? 0);
  return s.goalsDone;
}

// El primer objetivo pendiente de cada carril.
export function currentGoals(s) {
  const done = goalsDone(s);
  const out = [];
  for (const lane of ['negocio', 'equipo', 'dinero']) {
    const g = GOALS.find((x) => x.lane === lane && !done.includes(x.id));
    if (g) out.push(g);
  }
  return out;
}

// El que se enseña primero: el pendiente que va antes en la lista.
export function currentGoal(s) {
  const heads = currentGoals(s);
  return GOALS.find((g) => heads.includes(g)) || null;
}

export function goalNumber(s) {
  return goalsDone(s).length + 1;
}

// Completa objetivos en cadena y deja el aviso en s.notices para la interfaz.
export function checkGoals(s) {
  s.notices ??= [];
  // Cada carril avanza por su cuenta: se repite hasta que ningún carril cumple su objetivo actual.
  // Si se cumplen varios de golpe, un solo aviso (y nunca se pisan los avisos de otros sistemas).
  const won = [];
  let g = currentGoals(s).find((x) => x.test(s));
  while (g) {
    const text = g.reward(s);
    log(s, `🎯 Objetivo cumplido: ${g.text} ${text}`, 'good');
    won.push([g.text, text].join('\n\n'));
    goalsDone(s).push(g.id);
    g = currentGoals(s).find((x) => x.test(s));
  }
  if (won.length > 2) s.notices.push({ title: `${won.length} objetivos cumplidos`, text: won.join('\n\n—\n\n') });
  else for (const t of won) s.notices.push({ title: 'Objetivo cumplido', text: t });
}
