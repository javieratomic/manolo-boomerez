// Previsiones: «¿qué pasaría si...?» sin tocar la partida. Todo se calcula sobre copias del estado con las
// mismas funciones del cierre de mes (computeEconomy y driftStats), así que no hay fórmulas duplicadas.
import { computeEconomy, moralFactor, repFactor, policyFx, hasCondition } from './economy.js';
import { driftStats } from './sim.js';
import { laborFine, haciendaDebt, inspectionChance, auditChance, tickLaborHistory, recidivism, DELITO_FISCAL } from './inspections.js';
import { clamp } from './helpers.js';
import { POLICIES } from '../data/policies.js';

export const STATS = ['moral', 'rep', 'fama', 'heatTrabajo', 'heatHacienda'];
export const HORIZON = 6;

const clone = (s) => JSON.parse(JSON.stringify(s));
const statsOf = (c) => Object.fromEntries(STATS.map((k) => [k, c[k]]));

// Un mes como en advanceMonth: economía, caja, impuestos escamoteados y deriva de los indicadores.
function step(c) {
  const r = computeEconomy(c);
  c.lastReport = r;
  c.cash += r.net;
  c.evaded += r.evaded;
  const before = statsOf(c);
  driftStats(c, r);
  return { r, d: Object.fromEntries(STATS.map((k) => [k, c[k] - before[k]])) };
}

// El mes que viene si no pasa nada. `mutate` cambia la copia antes de calcular (p. ej. otra política).
export function forecast(s, mutate) {
  const c = clone(s);
  if (mutate) mutate(c);
  const { r, d } = step(c);
  return { c, r, d, after: statsOf(c) };
}

// Multa de Trabajo si Marisa viniera al cerrar el mes (el historial incluye el mes que se cierra).
function fineAtClose(c) {
  const tmp = { ...c, dossier: { ...(c.dossier || {}), historial: [...(c.dossier?.historial || [])] } };
  tickLaborHistory(tmp);
  return laborFine(tmp);
}

// Neto acumulado a varios meses, ya descontadas la moral (va dentro de la economía) y las multas esperadas.
export function horizonNet(s, mutate, months = HORIZON) {
  const c = clone(s);
  if (mutate) mutate(c);
  const man = policyFx(c).man;
  let total = 0;
  for (let i = 0; i < months; i++) {
    const { r } = step(c);
    total += r.net;
    for (const b of c.businesses) if (b.mode !== 'franquicia' && hasCondition(b)) b.cond = clamp((b.cond ?? 100) + man.drift);
    c.cooldowns.trabajo--;
    c.cooldowns.hacienda--;
    tickLaborHistory(c);
    if (c.cooldowns.trabajo <= 0) total -= inspectionChance(c.heatTrabajo) * laborFine(c);
    if (c.cooldowns.hacienda <= 0) total -= auditChance(c.heatHacienda) * haciendaDebt(c) * 1.2;
  }
  return total;
}

export function previewBase(s) {
  return { f: forecast(s), h: horizonNet(s) };
}

// Diferencia entre elegir `opt` en la política `key` y seguir como estás.
export function policyPreview(s, key, opt, base = previewBase(s)) {
  const set = (c) => {
    c.policies[key] = opt;
  };
  const alt = forecast(s, set);
  const out = { net: alt.r.net - base.f.r.net, evaded: alt.r.evaded - base.f.r.evaded, fine: fineAtClose(alt.c) };
  for (const k of STATS) out[k] = alt.d[k] - base.f.d[k];
  out.net6 = horizonNet(s, set) - base.h;
  return out;
}

// Qué riesgos hay al cerrar este mes, con los indicadores ya movidos.
export function riskInfo(s, f = forecast(s)) {
  const c = f.c;
  const r = f.r;
  const waitT = Math.max(0, s.cooldowns.trabajo - 1);
  const waitH = Math.max(0, s.cooldowns.hacienda - 1);
  const debt = haciendaDebt(c);
  // Como en el cierre: las huelgas que terminan este mes ya no cuentan cuando se tira la de la próxima.
  const striking = s.mods.some((m) => m.kind === 'strike' && m.months > 1);
  return {
    trabajo: { chance: waitT ? 0 : inspectionChance(c.heatTrabajo), wait: waitT, fine: fineAtClose(c), recidivism: recidivism(c) },
    hacienda: { chance: waitH ? 0 : auditChance(c.heatHacienda), wait: waitH, debt, delito: debt >= DELITO_FISCAL },
    moral: { strike: !striking && c.moral < 25 ? 0.15 * (1 - 0.7 * r.control) : 0, zeroMonths: c.zeroMoralMonths, factor: moralFactor(c.moral) },
    rep: { factor: repFactor(c.rep) },
    fama: { academy: c.fama >= 25, coworking: c.fama >= 35 },
  };
}

// Quién tiene la culpa de que `stat` se mueva: cada política que no está en su primera opción (la honrada)
// frente a volver a ella, y un resto con todo lo demás (tamaño, directivos, tendencia natural, enfriamiento).
// Cerca del tope (0 o 100) el recorte esconde lo que empuja cada política, así que entonces se mide con el
// indicador puesto a 50 (la tendencia natural se anula en la diferencia) y el recorte queda en el resto.
const NEAR_LIMIT = 8;

export function blame(s, stat, base = previewBase(s), get = (k, o) => policyPreview(s, k, o, base)) {
  const after = base.f.after[stat];
  const atLimit = after <= 0 || after >= 100;
  const nearLimit = after <= NEAR_LIMIT || after >= 100 - NEAR_LIMIT || s[stat] <= NEAR_LIMIT || s[stat] >= 100 - NEAR_LIMIT;
  const mid = (c) => {
    c[stat] = 50;
  };
  const midBase = nearLimit ? forecast(s, mid) : null;
  const rows = [];
  for (const [key, def] of Object.entries(POLICIES)) {
    const first = Object.keys(def.options)[0];
    const cur = s.policies[key];
    if (!cur || cur === first) continue;
    const v = nearLimit
      ? midBase.d[stat] - forecast(s, (c) => { mid(c); c.policies[key] = first; }).d[stat]
      : -get(key, first)[stat];
    if (Math.abs(v) >= 0.05) rows.push({ key, label: def.label, option: def.options[cur].label, value: v });
  }
  const total = base.f.d[stat];
  const rest = total - rows.reduce((a, x) => a + x.value, 0);
  return { from: s[stat], to: after, total, rows, rest, atLimit };
}
