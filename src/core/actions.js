// Acciones del jugador durante el mes (todas validan y devuelven { ok, msg }).
import { BUSINESS_TYPES, OBRADOR_UPGRADES, PERKS, SOBAO_TYPE_BY_BRAND } from '../data/businesses.js';
import { CITY_BY_ID } from '../data/cities.js';
import { POLICIES } from '../data/policies.js';
import { ACTION_BY_ID } from '../data/manoloActions.js';
import { GOALS } from '../data/goals.js';
import { execBonus, execSkill } from './execs.js';
import { creditLimit } from './economy.js';
import { addCash, log, money } from './helpers.js';

export const LOAN_STEP = 25000;
export const MAX_PER_CITY = 6;

export function sobaoOutlets(s) {
  return s.businesses.filter((b) => BUSINESS_TYPES[b.type].category === 'sobaos').length;
}

export function sobaoTypeId(s) {
  return SOBAO_TYPE_BY_BRAND[s.brand] || 'express';
}

export function openingCost(s, typeId, mode = 'propia') {
  const t = BUSINESS_TYPES[typeId];
  if (mode === 'franquicia') return 0;
  return Math.round(t.cost * (1 - (s.discountNext || 0)) * (1 - execBonus(s, 'expansion')));
}

export function franchiseFee(s, typeId) {
  return Math.round(BUSINESS_TYPES[typeId].franchiseFee * (1 + 0.1 * execSkill(s, 'expansion')));
}

export function canOpen(s, typeId, cityId, mode = 'propia') {
  const t = BUSINESS_TYPES[typeId];
  const c = CITY_BY_ID[cityId];
  if (!t || !c) return { ok: false, msg: 'Negocio o ciudad desconocidos.' };
  if (t.category === 'sobaos' && typeId !== sobaoTypeId(s)) return { ok: false, msg: 'Esa no es tu marca.' };
  if (t.category !== 'sobaos' && !s.unlocked[typeId]) return { ok: false, msg: 'Aún no está desbloqueado.' };
  if (mode === 'franquicia' && t.category !== 'sobaos') return { ok: false, msg: 'Solo las tiendas de sobaos se franquician.' };
  if (t.unique && s.businesses.some((b) => b.type === typeId)) return { ok: false, msg: 'Solo puede haber una.' };
  if (c.hq && t.category !== 'sobaos' && !['vivienda', 'taberna', 'residencia'].includes(typeId)) return { ok: false, msg: 'En Selaya no hay mercado para eso.' };
  if (s.businesses.filter((b) => b.city === cityId).length >= MAX_PER_CITY) return { ok: false, msg: 'Ya no caben más negocios en esta ciudad.' };
  const cost = openingCost(s, typeId, mode);
  if (cost > s.cash) return { ok: false, msg: `Necesitas ${money(cost)} en caja.` };
  return { ok: true, cost };
}

export function openBusiness(s, typeId, cityId, mode = 'propia') {
  const check = canOpen(s, typeId, cityId, mode);
  if (!check.ok) return check;
  const t = BUSINESS_TYPES[typeId];
  const c = CITY_BY_ID[cityId];
  const b = { id: s.nextId++, type: typeId, city: cityId, mode, openedMonth: s.month, value: 0, lossMonths: 0, level: 1 };
  if (mode === 'franquicia') {
    const fee = franchiseFee(s, typeId);
    addCash(s, fee);
    log(s, `🤝 Un incauto de ${c.name} compra una franquicia de ${t.name} por ${money(fee)}.`, 'good');
  } else {
    addCash(s, -check.cost);
    // Los inmuebles pierden un 15 % al comprarlos (notaría, ITP, comisión del primo agente inmobiliario).
    b.value = t.realEstate ? check.cost * 0.85 : check.cost;
    s.discountNext = 0;
    log(s, `🏗️ Abres ${t.name} en ${c.name}.`, 'good');
  }
  s.businesses.push(b);
  s.stats.abiertos++;
  checkUnlocks(s);
  return { ok: true, business: b };
}

export function saleValue(b) {
  const t = BUSINESS_TYPES[b.type];
  return Math.round((b.value || 0) * (t.realEstate ? 0.9 : 0.6));
}

export function sellBusiness(s, businessId) {
  const i = s.businesses.findIndex((b) => b.id === businessId);
  if (i < 0) return { ok: false, msg: 'No existe.' };
  const b = s.businesses[i];
  const t = BUSINESS_TYPES[b.type];
  const value = saleValue(b);
  addCash(s, value);
  s.businesses.splice(i, 1);
  const c = CITY_BY_ID[b.city];
  log(s, b.mode === 'franquicia'
    ? `✂️ Rescindes la franquicia de ${c.name}. El franquiciado llora; tú no.`
    : `💸 Vendes ${t.name} de ${c.name} por ${money(value)}.`, 'info');
  return { ok: true, value };
}

export function nextUpgrade(s) {
  return OBRADOR_UPGRADES.find((u) => !s.obrador.upgrades.includes(u.id)) || null;
}

export function buyUpgrade(s) {
  const u = nextUpgrade(s);
  if (!u) return { ok: false, msg: 'El obrador ya está a tope.' };
  if (s.cash < u.cost) return { ok: false, msg: `Necesitas ${money(u.cost)}.` };
  addCash(s, -u.cost);
  s.obrador.upgrades.push(u.id);
  log(s, `🏭 Obrador mejorado: ${u.name}.`, 'good');
  return { ok: true, upgrade: u };
}

export function setPolicy(s, key, value) {
  if (!POLICIES[key]?.options[value]) return { ok: false, msg: 'Política desconocida.' };
  if (s.flags.forcedLegal > 0 && isIllegalChoice(key, value)) {
    return { ok: false, msg: `La Inspección te vigila: no puedes cambiar esto durante ${s.flags.forcedLegal} meses.` };
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
  if (!s.perks[id] && p.setup && !s.andorraPaid) {
    if (s.cash < p.setup) return { ok: false, msg: `Montarlo cuesta ${money(p.setup)}.` };
    addCash(s, -p.setup);
    s.andorraPaid = true;
    log(s, '🇦🇩 Constituyes "Boomerez Holding Andorra S.L.U.". El domicilio es un buzón entre otros 400 buzones.', 'info');
  }
  s.perks[id] = !s.perks[id];
  return { ok: true, on: s.perks[id] };
}

export function borrow(s, amount = LOAN_STEP) {
  const limit = creditLimit(s);
  const room = limit - s.debt;
  if (room <= 0) return { ok: false, msg: 'El banco dice que no. Ni con un sobao de regalo.' };
  const a = Math.min(amount, room);
  s.debt += a;
  addCash(s, a);
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
    log(s, '🔁 Rebranding: la Maison pasa a ser "Sobaos Manolo Express". El mármol, a Wallapop. Reputación −6.', 'info');
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
  s.extraMonthly.splice(index, 1);
  log(s, `✂️ Quitas el gasto: ${x.label}.`, 'info');
  return { ok: true, item: x };
}

export function doManoloAction(s, id) {
  if (s.actionUsed) return { ok: false, msg: 'Manolo ya ha hecho bastante este mes. Necesita su siesta.' };
  const a = ACTION_BY_ID[id];
  if (!a) return { ok: false, msg: 'Acción desconocida.' };
  if (a.cost && s.cash < a.cost) return { ok: false, msg: `Necesitas ${money(a.cost)}.` };
  s.actionUsed = true;
  const text = a.run(s);
  checkUnlocks(s);
  return { ok: true, text };
}

const UNLOCKS = [
  { id: 'vivienda', test: (s) => sobaoOutlets(s) >= 3, text: '🔓 Desbloqueado: Residencial Boomerez. "¿Y si mis empleados me pagan el alquiler a mí?"' },
  { id: 'airbnb', test: (s) => s.month >= 12 || s.cash >= 250000, text: '🔓 Desbloqueado: Apartamentos turísticos "Casa Manolo".' },
  { id: 'smash', test: (s) => sobaoOutlets(s) >= 4 || s.month >= 18, text: '🔓 Desbloqueado: Manolo Smash Club. Hay que diversificar.' },
  { id: 'empanadas', test: (s) => sobaoOutlets(s) >= 4 || s.month >= 18 || s.flags.primoSocio, text: '🔓 Desbloqueado: Empanadas El Gaucho Pasiego.' },
  { id: 'academy', test: (s) => s.fama >= 25, text: '🔓 Desbloqueado: Boomerez Business Academy. Tu fama ya da para vender cursos.' },
  { id: 'taberna', test: (s) => sobaoOutlets(s) >= 2 || s.month >= 6, text: '🔓 Desbloqueado: La Taberna del Emprendedor. Donde se cierran los negocios de verdad.' },
  { id: 'gimnasio', test: (s) => s.month >= 12 || sobaoOutlets(s) >= 5, text: '🔓 Desbloqueado: Boomer Fit 24h. "Mens sana in corpore sobao."' },
  { id: 'coworking', test: (s) => s.fama >= 35 || s.businesses.some((b) => b.type === 'academy'), text: '🔓 Desbloqueado: Hustle Hub Coworking. Las startups pagan por sentarse cerca de ti.' },
  { id: 'residencia', test: (s) => s.month >= 24 || s.stats.maxPatrimonio >= 2e6, text: '🔓 Desbloqueado: Residencia Golden Age. "La plata está en las canas", te dice un fondo.' },
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
  return found;
}

export function currentGoal(s) {
  return GOALS[s.goalIndex ?? 0] || null;
}

// Completa objetivos en cadena y deja el aviso en s.notices para la interfaz.
export function checkGoals(s) {
  s.goalIndex ??= 0;
  s.notices ??= [];
  let g = currentGoal(s);
  while (g && g.test(s)) {
    const text = g.reward(s);
    log(s, `🎯 Objetivo cumplido: ${g.text} ${text}`, 'good');
    s.notices.push({ title: 'Objetivo cumplido', text: [g.text, text].join('\n\n') });
    if (s.notices.length > 4) s.notices.splice(0, s.notices.length - 4);
    s.goalIndex++;
    g = currentGoal(s);
  }
}
