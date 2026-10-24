// Previsiones: «¿qué pasaría si...?» sin tocar la partida. Todo se calcula sobre copias del estado con las
// mismas funciones del cierre de mes (computeEconomy y driftStats), así que no hay fórmulas duplicadas.
import { computeEconomy, moralFactor, repFactor, policyFx, hasCondition } from './economy.js';
import { driftStats } from './sim.js';
import { laborVisitParams, haciendaDebt, inspectionChance, auditChance, tickLaborHistory, recidivism, DELITO_FISCAL } from './inspections.js';
import { clamp, unclamped } from './helpers.js';
import { POLICIES } from '../data/policies.js';
import { tickAhorro, monthlySaving, strikeChance, profitRatio, K as PK } from './plantilla.js';
import { difficultyOf } from './state.js';

export const STATS = ['moral', 'rep', 'fama', 'heatTrabajo', 'heatHacienda', 'agravio'];
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
// Lo que traería Marisa si viniera al cerrar el mes: multa (con una denuncia pendiente) y liquidación
// (con lo que se ahorra este mes incluido).
function visitAtClose(c, r) {
  const tmp = { ...c, dossier: { ...(c.dossier || {}), historial: [...(c.dossier?.historial || [])], ahorro: [...(c.dossier?.ahorro || [])] } };
  tickLaborHistory(tmp);
  if (r) tickAhorro(tmp, r);
  return laborVisitParams(tmp);
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
    if (c.cooldowns.trabajo <= 0) total -= inspectionChance(c.heatTrabajo) * laborVisitParams(c).fine;
    // Lo ahorrado este mes acabará liquidado (×1,2) si Marisa viene antes de que prescriba.
    const pCatch = 1 - (1 - inspectionChance(c.heatTrabajo)) ** PK.LIQ_WINDOW;
    total -= monthlySaving(c, r.employees) * PK.LIQ_K * difficultyOf(c).fines * pCatch;
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
  const v = visitAtClose(alt.c, alt.r);
  const out = { net: alt.r.net - base.f.r.net, evaded: alt.r.evaded - base.f.r.evaded, fine: v.fine, liq: v.liq, saving: (monthlySaving(alt.c, alt.r.employees) - monthlySaving(base.f.c, base.f.r.employees)) * PK.LIQ_K };
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
  const striking = s.mods.some((m) => m.kind === 'strike' && m.months > 1) || s.pending.some((p) => p.id === 'huelga' || p.id === 'huelga_general');
  const st = strikeChance(c, r);
  const v = visitAtClose(c, r);
  return {
    trabajo: { chance: waitT ? 0 : inspectionChance(c.heatTrabajo), wait: waitT, fine: v.fine, liq: v.liq, recidivism: recidivism(c) },
    hacienda: { chance: waitH ? 0 : auditChance(c.heatHacienda), wait: waitH, debt, delito: debt >= DELITO_FISCAL },
    moral: { strike: !striking ? st.p : 0, general: st.card === 'huelga_general', zeroMonths: c.zeroMoralMonths, factor: moralFactor(c.moral) },
    agravio: { ratio: c.plantilla?.ratio ?? profitRatio(c, r), moralCost: PK.AGR_MORAL * (c.agravio || 0), strike: !striking && st.card === 'huelga_general' ? st.p : 0, comite: !!c.comite },
    rep: { factor: repFactor(c.rep) },
    fama: { academy: c.fama >= 25, coworking: c.fama >= 35 },
  };
}

// Quién tiene la culpa de que `stat` se mueva: cada política que no está en su primera opción (la honrada)
// frente a volver a ella, y un resto con todo lo demás (tamaño, directivos, tendencia natural, enfriamiento).
// Cuánto se movería cada indicador el mes que viene si no existieran los topes de 0 y 100.
function rawDrift(s, mutate) {
  const c = clone(s);
  if (mutate) mutate(c);
  const r = computeEconomy(c);
  c.lastReport = r;
  c.cash += r.net;
  c.evaded += r.evaded;
  const before = statsOf(c);
  unclamped(() => driftStats(c, r));
  return Object.fromEntries(STATS.map((k) => [k, c[k] - before[k]]));
}

// El empujón de cada política se mide sin topes (si no, con la moral a 0 ninguna «tendría la culpa») y lo
// que se come el tope va aparte: `clamp` (negativo si choca con 100, positivo si choca con 0).
export function blame(s, stat, base = previewBase(s)) {
  const raw = rawDrift(s);
  const rows = [];
  for (const [key, def] of Object.entries(POLICIES)) {
    const first = def.honest ?? Object.keys(def.options)[0];
    const cur = s.policies[key];
    if (!cur || cur === first) continue;
    const v = raw[stat] - rawDrift(s, (c) => { c.policies[key] = first; })[stat];
    if (Math.abs(v) >= 0.05) rows.push({ key, label: def.label, option: def.options[cur].label, value: v });
  }
  const total = base.f.d[stat];
  const clampPart = total - raw[stat];
  const rest = raw[stat] - rows.reduce((a, x) => a + x.value, 0);
  return { from: s[stat], to: base.f.after[stat], total, rows, rest, clamp: Math.abs(clampPart) >= 0.05 ? clampPart : 0 };
}
