// Cadenas rivales: aparición, expansión imitando a Manolo y acciones contra ellas.
import { RIVALS, RIVAL_LEVEL_PENALTY, RIVAL_MAX_LEVEL } from '../data/rivals.js';
import { CITY_BY_ID, CITIES } from '../data/cities.js';
import { BUSINESS_TYPES } from '../data/businesses.js';
import { chance, random, weightedPick } from './rng.js';
import { addCash, addRep, addHeatHacienda, addMod, log, money, hito } from './helpers.js';
import { cityBusinessLimit, sobaoTypeId } from './actions.js';
import { checkClause } from './clauses.js';

export const rivalTotal = (r) => Object.values(r.presence).reduce((a, b) => a + b, 0);
export const rivalById = (s, id) => s.rivals.find((r) => r.id === id) || null;

// Multiplicador de demanda que sufre un negocio de Manolo por la competencia en su ciudad.
export function rivalFactor(s, b) {
  let f = 1;
  for (const r of s.rivals) {
    if (!RIVALS[r.id].targets.includes(b.type)) continue;
    const lvl = r.presence[b.city] || 0;
    if (lvl) f /= 1 + RIVAL_LEVEL_PENALTY * lvl;
  }
  return f;
}

export function tickRivals(s, report) {
  spawnRival(s);
  const phase = s.macro?.phase;
  const pace = phase === 'burbuja' ? 1.5 : phase === 'crisis' ? 0.5 : 1;
  const profitBy = {};
  for (const l of report?.lines || []) {
    const k = `${l.type}:${l.city}`;
    profitBy[k] = (profitBy[k] || 0) + (l.revenue - l.cost);
  }
  for (const r of s.rivals) {
    const def = RIVALS[r.id];
    if (r.calm > 0) {
      r.calm--;
      continue;
    }
    if (chance(s, def.aggr * 0.3 * pace)) {
      // Copian lo que te funciona: prefieren ciudades donde ganas dinero con lo que ellos venden.
      const candidates = CITIES.filter((c) => !c.hq && (r.presence[c.id] || 0) < RIVAL_MAX_LEVEL);
      const target = weightedPick(s, candidates, (c) => {
        const mine = def.targets.reduce((a, t) => a + (profitBy[`${t}:${c.id}`] || 0), 0);
        return 0.4 + c.pop + (mine > 0 ? 2.5 + mine / 6000 : 0);
      });
      if (target) {
        const lvl = (r.presence[target.id] = (r.presence[target.id] || 0) + 1);
        log(s, lvl === 1
          ? `${def.emoji} ${def.name} abre su primer local en ${target.name}.`
          : `${def.emoji} ${def.name} se refuerza en ${target.name} (presencia ${lvl}/${RIVAL_MAX_LEVEL}).`, 'bad');
      }
    }
    if (phase === 'crisis' && chance(s, 0.12)) {
      const cities = Object.keys(r.presence);
      if (cities.length) rivalHit(s, r.id, cities[Math.floor(random(s) * cities.length)], 'la crisis');
    }
  }
}

function spawnRival(s) {
  for (const [id, def] of Object.entries(RIVALS)) {
    if (s.rivals.some((r) => r.id === id) || s.flags[`rivalGone_${id}`]) continue;
    if (!def.spawn(s)) continue;
    const pool = [...def.seedCities];
    const presence = {};
    for (let i = 0; i < 2 && pool.length; i++) presence[pool.splice(Math.floor(random(s) * pool.length), 1)[0]] = 1;
    s.rivals.push({ id, presence, since: s.month, calm: 0, actions: {} });
    log(s, `${def.emoji} Nueva competencia: ${def.name} desembarca en ${Object.keys(presence).map((c) => CITY_BY_ID[c].name).join(' y ')}.`, 'bad');
    s.pending.push({ kind: 'event', id: 'rival_aparece', params: { rival: id } });
    return; // como mucho una cadena nueva al mes
  }
}

// Quita un nivel de presencia; si se queda sin locales, la cadena desaparece.
export function rivalHit(s, rivalId, city, reason = '') {
  const r = rivalById(s, rivalId);
  if (!r || !r.presence[city]) return false;
  r.presence[city]--;
  if (!r.presence[city]) delete r.presence[city];
  const def = RIVALS[rivalId];
  log(s, `${def.emoji} ${def.short} pierde fuelle en ${CITY_BY_ID[city].name}${reason ? ` (${reason})` : ''}.`, 'good');
  if (rivalTotal(r) === 0) {
    s.rivals = s.rivals.filter((x) => x !== r);
    s.flags[`rivalGone_${rivalId}`] = true;
    log(s, `🏳️ ${def.name} cierra su último local. Manolo lo celebra con un orujo.`, 'good');
  }
  return true;
}

// ---------------------------------------------------------------- Acciones
const acted = (r, city, s) => r.actions?.[city] === s.month;
const markActed = (r, city, s) => {
  r.actions ||= {};
  r.actions[city] = s.month;
};

export const RIVAL_ACTIONS = {
  guerra: { label: 'Guerra de precios', cost: 0, desc: 'Tus negocios afectados en esta ciudad ingresan un 15 % menos durante 3 meses. Al final, un 75 % de probabilidades de que el rival retroceda.' },
  resenas: { label: 'Reseñas falsas', cost: 15000, desc: '50 %: el rival retrocede. 30 %: te pillan (reputación −8).' },
  fichaje: { label: 'Fichar a su encargado', cost: 12000, desc: '60 %: el rival retrocede en esta ciudad.' },
};

export function canActOnRival(s, rivalId, city, action) {
  const r = rivalById(s, rivalId);
  if (!r || !r.presence[city]) return { ok: false, msg: 'Ese rival no está en esa ciudad.' };
  if (acted(r, city, s)) return { ok: false, msg: 'Ya has movido ficha aquí este mes.' };
  if (!s.businesses.some((b) => b.city === city && b.mode !== 'franquicia' && RIVALS[rivalId].targets.includes(b.type))) {
    return { ok: false, msg: 'No compites con ellos en esta ciudad.' };
  }
  if (action === 'guerra' && s.mods.some((m) => m.onEnd?.rival === rivalId && m.city === city)) return { ok: false, msg: 'Ya hay una guerra de precios en marcha.' };
  const a = RIVAL_ACTIONS[action];
  if (!a) return { ok: false, msg: 'Acción desconocida.' };
  if (s.cash < a.cost) return { ok: false, msg: `Necesitas ${money(a.cost)}.` };
  return { ok: true };
}

export function actOnRival(s, rivalId, city, action) {
  const check = canActOnRival(s, rivalId, city, action);
  if (!check.ok) return check;
  const r = rivalById(s, rivalId);
  const def = RIVALS[rivalId];
  const cityName = CITY_BY_ID[city].name;
  markActed(r, city, s);
  addCash(s, -RIVAL_ACTIONS[action].cost);
  let text;
  if (action === 'guerra') {
    addMod(s, { kind: 'revenue', city, types: def.targets, factor: 0.85, months: 3, label: `Guerra de precios contra ${def.short}`, onEnd: { rival: rivalId, city, chance: 0.75 } });
    text = `Declaras la guerra de precios a ${def.short} en ${cityName}. Tres meses de márgenes de risa.`;
  } else if (action === 'resenas') {
    const roll = random(s);
    if (roll < 0.5) {
      rivalHit(s, rivalId, city, 'reseñas de una estrella');
      text = `Tus 120 cuentas falsas dejan a ${def.short} de ${cityName} con 1,8 estrellas. Retroceden.`;
    } else if (roll < 0.8) {
      addRep(s, -8);
      text = `El buscador detecta que todas las reseñas salen del wifi del obrador. Sale en la prensa. Reputación −8.`;
    } else {
      text = 'Las reseñas no surten efecto: a la gente le da igual. Dinero tirado.';
    }
  } else {
    if (chance(s, 0.6)) {
      rivalHit(s, rivalId, city, 'les has robado al encargado');
      text = `Le ofreces al encargado de ${def.short} en ${cityName} un 20 % más y un coche de empresa. Acepta y se lleva media clientela.`;
    } else {
      text = 'El encargado se ríe, se queda tu oferta como "referencia" y le suben el sueldo en su empresa.';
    }
  }
  log(s, `⚔️ ${text}`, 'info');
  return { ok: true, text };
}

export function acquisitionPrice(s, rivalId) {
  const r = rivalById(s, rivalId);
  if (!r) return Infinity;
  const phase = s.macro?.phase;
  const mult = phase === 'burbuja' ? 1.4 : phase === 'crisis' ? 0.7 : 1;
  const t = BUSINESS_TYPES[RIVALS[rivalId].targets[0]];
  const perLevel = Math.max(120000, (t?.cost ?? 0) * 0.8 + (t?.license ?? 0));
  return Math.round(rivalTotal(r) * perLevel * mult);
}

// Compra la cadena: desaparece y te quedas con hasta 4 de sus locales.
export function acquireRival(s, rivalId) {
  const r = rivalById(s, rivalId);
  if (!r) return { ok: false, msg: 'Ese rival ya no existe.' };
  const price = acquisitionPrice(s, rivalId);
  if (s.cash < price) return { ok: false, msg: `La OPA cuesta ${money(price)}.` };
  const def = RIVALS[rivalId];
  addCash(s, -price);
  let typeId = def.targets[0];
  if (BUSINESS_TYPES[typeId].category === 'sobaos') typeId = sobaoTypeId(s);
  const cities = Object.entries(r.presence).sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const gained = [];
  const slots = cities.filter((city) => s.businesses.filter((b) => b.city === city).length < cityBusinessLimit(city)).slice(0, 4);
  const t = BUSINESS_TYPES[typeId];
  // Cada local vale lo que se pagó por él (como mucho, el 70 % de abrirlo nuevo).
  const each = slots.length ? Math.min(t.cost * 0.7, price / rivalTotal(r)) : 0;
  for (const city of slots) {
    s.businesses.push({ id: s.nextId++, type: typeId, city, mode: 'propia', openedMonth: s.month, value: each, lossMonths: 0, level: 1, acquired: rivalId });
    gained.push(CITY_BY_ID[city].name);
  }
  s.rivals = s.rivals.filter((x) => x !== r);
  s.flags[`rivalGone_${rivalId}`] = true;
  s.unlocked[typeId] = true;
  addHeatHacienda(s, 3);
  log(s, `🦈 OPA: compras ${def.name} por ${money(price)}${gained.length ? ` y rebautizas sus locales de ${gained.join(', ')}` : ''}.`, 'good');
  checkClause(s);
  hito(s, 'opa');
  return { ok: true, price, gained };
}
