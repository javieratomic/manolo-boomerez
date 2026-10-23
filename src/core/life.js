// Vida personal de Manolo (lujos y familia) y salida a Bolsa.
import { LUJO_BY_ID } from '../data/lujo.js';
import { addCash, addFama, addHeatHacienda, addRep, log, money, clamp } from './helpers.js';
import { macroFx } from './macro.js';

// ------------------------------------------------------------------- Lujos
export const lujoValue = (s) => (s.lujo || []).reduce((a, x) => a + x.value, 0);
export const lujoUpkeep = (s) => (s.lujo || []).reduce((a, x) => a + (LUJO_BY_ID[x.id]?.upkeep || 0), 0);
export const ownsLujo = (s, id) => (s.lujo || []).some((x) => x.id === id);

export function buyLujo(s, id) {
  const l = LUJO_BY_ID[id];
  if (!l) return { ok: false, msg: 'Capricho desconocido.' };
  if (ownsLujo(s, id)) return { ok: false, msg: 'Ya lo tienes. (Manolo quería otro igual, pero no.)' };
  if (s.cash < l.cost) return { ok: false, msg: `Necesitas ${money(l.cost)}.` };
  addCash(s, -l.cost);
  s.lujo.push({ id, value: l.cost * 0.85, since: s.month });
  addFama(s, l.fama);
  s.familia = clamp((s.familia ?? 60) + l.familia);
  addHeatHacienda(s, l.hac);
  if (l.credit) s.creditBonus += l.credit;
  log(s, `${l.emoji} Manolo se compra: ${l.name}. Lo sube a Instagram en menos de una hora.`, 'info');
  return { ok: true };
}

export function sellLujo(s, id) {
  const i = (s.lujo || []).findIndex((x) => x.id === id);
  if (i < 0) return { ok: false, msg: 'No lo tienes.' };
  const item = s.lujo[i];
  const l = LUJO_BY_ID[id];
  const price = Math.round(item.value * (l.realEstate ? 0.95 : 0.8));
  addCash(s, price);
  s.lujo.splice(i, 1);
  if (l.credit) s.creditBonus -= l.credit;
  addFama(s, -Math.ceil(l.fama / 2));
  log(s, `💸 Manolo vende ${l.name} por ${money(price)} "porque ya no le motivaba".`, 'info');
  return { ok: true, price };
}

// ----------------------------------------------------------------- Familia
export function tickLife(s) {
  for (const x of s.lujo || []) {
    const l = LUJO_BY_ID[x.id];
    x.value *= 1 + (l.realEstate ? Math.max(l.drift, macroFx(s).property) : l.drift);
  }
  if (s.flags.divorciado) return;
  // Manolo trabaja (o dice que trabaja) demasiado.
  const empire = Math.min(1.2, s.businesses.length / 25);
  s.familia = clamp((s.familia ?? 60) - 0.4 - empire + (s.lujo?.length ? 0.3 : 0));
  if (s.familia < 15 && !s.pending.some((p) => p.id === 'divorcio')) {
    s.pending.push({ kind: 'event', id: 'divorcio' });
  }
}

// Divorcio: Merche se queda con una parte de la caja y de los caprichos (régimen de gananciales).
export function divorce(s, share) {
  const cashPart = Math.max(0, s.cash) * share;
  addCash(s, -cashPart);
  const kept = [];
  let lost = 0;
  for (const x of s.lujo) {
    if (LUJO_BY_ID[x.id].realEstate || x.value > 150000) {
      lost += x.value;
    } else kept.push(x);
  }
  s.lujo = kept;
  s.flags.divorciado = true;
  s.familia = 0;
  return { cashPart, lost };
}

// ------------------------------------------------------------------- Bolsa
export const IPO_FLOAT = 0.3;
export const IPO_FEE = 0.04;

// Patrimonio total de la empresa (sin descontar a los accionistas).
export function grossEquity(s, assets) {
  return s.cash - s.debt + assets;
}

export function annualProfit(s) {
  return s.history.slice(-12).reduce((a, h) => a + h.net, 0);
}

export function ipoPremium(s) {
  const phase = s.macro?.phase;
  const mood = { burbuja: 0.5, expansion: 0.2, recuperacion: 0, crisis: -0.3 }[phase] ?? 0;
  return Math.max(0.6, 1 + s.fama / 200 + (s.rep - 50) / 200 + mood);
}

export function companyValuation(s, equity) {
  return Math.max(equity, annualProfit(s) * 12) * ipoPremium(s);
}

export function canIPO(s, equity) {
  if (s.ipo) return { ok: false, msg: 'Ya cotizas en Bolsa.' };
  if (s.month < 24) return { ok: false, msg: 'Los bancos de inversión quieren ver al menos dos años de cuentas.' };
  if (equity < 3e6) return { ok: false, msg: 'Necesitas un patrimonio de al menos 3 millones.' };
  if (s.rep < 35) return { ok: false, msg: 'Con esa reputación, ningún banco te saca a Bolsa.' };
  return { ok: true };
}

export function doIPO(s, equity) {
  const check = canIPO(s, equity);
  if (!check.ok) return check;
  const valuation = companyValuation(s, equity);
  const raised = valuation * IPO_FLOAT;
  const fee = raised * IPO_FEE;
  addCash(s, raised - fee);
  s.ipo = { month: s.month, float: IPO_FLOAT, valuation, price: 100, peak: 100, angryMonth: -99 };
  addFama(s, 12);
  addRep(s, 3);
  log(s, `🔔 Boomerez S.A. sale a Bolsa: vende el ${Math.round(IPO_FLOAT * 100)} % por ${money(raised)} (comisiones: ${money(fee)}). Manolo toca la campana con las gafas de sol puestas.`, 'good');
  return { ok: true, raised, fee, valuation };
}

// Cotización mensual: sigue a la valoración con algo de ruido y de euforia.
export function tickIPO(s, equity, noise) {
  if (!s.ipo) return;
  const fair = (companyValuation(s, equity) / s.ipo.valuation) * 100;
  s.ipo.price = Math.max(5, s.ipo.price * 0.6 + fair * 0.4 + noise);
  s.ipo.peak = Math.max(s.ipo.peak, s.ipo.price);
  if (s.ipo.price < s.ipo.peak * 0.7 && s.month - s.ipo.angryMonth >= 12) {
    s.ipo.angryMonth = s.month;
    s.pending.push({ kind: 'event', id: 'junta_accionistas' });
  }
}
