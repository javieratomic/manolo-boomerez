// Avance mensual de la simulación y resolución de sucesos.
import { computeEconomy, policyFx, creditLimit, patrimonio, grossPatrimonio, hasCondition } from './economy.js';
import { chance, weightedPick, pick, range } from './rng.js';
import { addRep, addMoral, addFama, addHeatTrabajo, addHeatHacienda, log, money, GAME_MONTHS, clamp, custom, remember } from './helpers.js';
import { haciendaDebt, inspectionChance, auditChance, tickLaborHistory, laborVisitParams } from './inspections.js';
import { checkUnlocks } from './actions.js';
import { settleClause, clauseMult, checkClause } from './clauses.js';
import { tickAhorro, driftAgravio, tickComite, rollConvenio, strikeChance } from './plantilla.js';
import { tickCartilla, maybeRescue, isDomingo } from './cartilla.js';
import { tickBolsa, afterAudit } from './bolsa.js';
import { addStress } from './life.js';
import { tickMacro, macroFx } from './macro.js';
import { tickRivals, rivalHit } from './rivals.js';
import { tickRD } from './market.js';
import { tickExecs, execBonus, execSkill, execHeat } from './execs.js';
import { laborSeverity } from './inspections.js';
import { tickLife, tickIPO, inLockup } from './life.js';
import { tickPolitics, govFx } from './politics.js';
import { BUSINESS_TYPES } from '../data/businesses.js';
import { CITY_BY_ID } from '../data/cities.js';
import { EVENTS, EVENT_BY_ID } from '../data/events.js';
import { QUOTES, CONDITIONAL_QUOTES } from '../data/quotes.js';
import { HEADLINES } from '../data/headlines.js';

export const RANDOM_EVENT_CHANCE = 0.45;

export function advanceMonth(s) {
  if (s.ending || s.pending.length) return null;
  s.seen ||= {};
  const r = computeEconomy(s);
  s.lastReport = r;
  tickAhorro(s, r);
  s.cash += r.net;
  s.evaded += r.evaded;

  franchiseUpdates(s, r);
  driftStats(s, r);
  tickTimers(s);
  tickMacro(s);
  tickRivals(s, r);
  tickRD(s);
  tickExecs(s, laborSeverity(s));
  tickLife(s);
  ageAssets(s);
  tickIPO(s, grossPatrimonio(s), range(s, -8, 8));
  handleOverdraft(s);
  tickCartilla(s, r);
  maybeRescue(s);
  tickLaborHistory(s);
  rollVisits(s, r);
  rollScheduled(s);
  tickComite(s, r);
  rollConvenio(s);
  tickPolitics(s);
  rollRandomEvent(s);
  if (chance(s, 0.4)) log(s, `📰 ${pick(s, HEADLINES)}`, 'news');

  const pat = patrimonio(s);
  s.stats.maxPatrimonio = Math.max(s.stats.maxPatrimonio, pat);
  s.history.push({
    month: s.month, cash: Math.round(s.cash), patrimonio: Math.round(pat), revenue: Math.round(r.revenue), net: Math.round(r.net),
    cat: Object.fromEntries(Object.entries(r.revenueByCat).map(([k, v]) => [k, Math.round(v)])),
  });
  if (s.history.length > GAME_MONTHS + 12) s.history.shift();
  tickBolsa(s); // con el mes ya en el historial, por si cierra un trimestre
  // La cláusula se juzga con el resultado del mes cerrado, antes de que avance el calendario.
  checkClause(s);

  s.month++;
  s.actionUsed = false;
  // Domingo de cocido en casa de tu madre: la acción del mes ya tiene dueña.
  if (isDomingo(s)) {
    s.actionUsed = true;
    s.flags.domingo = s.month;
    s.familia = clamp((s.familia ?? 60) + 6);
    addStress(s, -4);
    log(s, '🍲 Domingo de cocido en casa de tu madre: la acción de este mes se va en la sobremesa. Familia +6, estrés −4.', 'info');
  }
  checkUnlocks(s);
  s.quote = pickQuote(s);
  return r;
}

function franchiseUpdates(s, r) {
  for (const line of r.lines) {
    if (!line.franchise) continue;
    const b = s.businesses.find((x) => x.id === line.id);
    if (!b) continue;
    b.lossMonths = line.franchiseeProfit < 0 ? (b.lossMonths || 0) + 1 : 0;
    if (b.lossMonths >= 4) {
      b.lossMonths = 0;
      s.pending.push({ kind: 'event', id: 'franquiciado_arruinado', params: { businessId: b.id, city: b.city } });
    }
    if (chance(s, 0.015)) {
      addRep(s, -4);
      log(s, `📸 El franquiciado de ${CITY_BY_ID[b.city].name} vende sobaos del supermercado en cajas de Boomerez. Reputación −4.`, 'bad');
    }
  }
}

export function driftStats(s, r) {
  const fx = policyFx(s);
  const hasHousing = s.businesses.some((b) => b.type === 'vivienda');
  const control = r.control;

  addMoral(s, fx.sal.moral + fx.hor.moral + fx.bec.moral + (hasHousing ? fx.alq.moral * control : 0) + (50 - s.moral) * 0.03 + 0.4 * execSkill(s, 'rrhh'));
  addRep(s, fx.ing.rep * (s.brand === 'maison' ? 1.5 : 1) + (s.moral < 30 ? -0.5 : 0) + (50 - s.rep) * 0.01 + 0.15 * execSkill(s, 'marketing'));
  addFama(s, -(0.5 + s.fama * 0.03) + (s.perks.fundacion ? 0.3 : 0));
  if (s.perks.fundacion) addRep(s, 0.5);

  const size = Math.min(3, 0.5 + r.employees / 40);
  const inspGain = (fx.sal.insp + fx.hor.insp + fx.bec.insp + (hasHousing ? fx.alq.insp * control : 0)) *
    size * (1 - 0.5 * control) * (s.moral < 30 ? 1.5 : 1);
  addHeatTrabajo(s, (inspGain + fx.man.insp * size) * (1 - execBonus(s, 'rrhh')) * govFx(s).inspection + execHeat(s) - 1.5);

  const hacGain = fx.sal.hac + fx.con.hac * Math.min(3, 0.5 + r.revenue / 150000) +
    (s.businesses.some((b) => b.type === 'academy') ? 0.6 : 0) + (s.perks.andorra ? 0.8 : 0) + 0.3 * (s.lujo?.length || 0) +
    0.5 * s.businesses.filter((b) => b.ilegal && b.type === 'airbnb').length;
  addHeatHacienda(s, hacGain * (1 - execBonus(s, 'finanzas')) + execHeat(s));
  addHeatHacienda(s, -1.2);

  driftAgravio(s, r);
  s.zeroMoralMonths = s.moral <= 0.5 ? s.zeroMoralMonths + 1 : 0;
  const p = s.policies;
  const legal = p.salario === 'convenio' && p.horas === 'pagadas' && p.becarios === 'ninguno' && p.contabilidad === 'limpia';
  s.flags.legalStreak = legal ? (s.flags.legalStreak ?? 0) + 1 : 0;
}

function tickTimers(s) {
  s.mods = s.mods.map((m) => ({ ...m, months: m.months - 1 }));
  // Efectos al terminar (p. ej. el desenlace de una guerra de precios).
  for (const m of s.mods) if (m.months <= 0 && m.onEnd?.rival && chance(s, m.onEnd.chance ?? 1)) rivalHit(s, m.onEnd.rival, m.onEnd.city, 'guerra de precios');
  s.mods = s.mods.filter((m) => m.months > 0);
  s.extraMonthly = s.extraMonthly
    .map((x) => (x.months == null ? x : { ...x, months: x.months - 1 }))
    .filter((x) => x.months == null || x.months > 0);
  for (const c of s.contracts) c.months--;
  const ended = s.contracts.filter((c) => c.months <= 0);
  for (const c of ended) log(s, `📄 Termina el contrato: ${c.label}.`, 'info');
  s.contracts = s.contracts.filter((c) => c.months > 0);
  for (const k of ['alcaldeShield', 'forcedLegal']) if (s.flags[k] > 0) s.flags[k]--;
  s.cooldowns.trabajo--;
  s.cooldowns.hacienda--;
  s.trends.smash = Math.max(0.55, s.trends.smash - 0.012);
  if (s.trends.empanadas < 1.3) s.trends.empanadas = Math.min(1.3, s.trends.empanadas + 0.003);
}

function ageAssets(s) {
  const man = policyFx(s).man;
  for (const b of s.businesses) {
    const t = BUSINESS_TYPES[b.type];
    if (b.mode === 'franquicia') continue;
    if (hasCondition(b)) b.cond = clamp((b.cond ?? 100) + man.drift);
    if (b.cond < 30 && !b.brokenMonth && chance(s, 0.06)) {
      b.brokenMonth = s.month;
      s.pending.push({ kind: 'event', id: 'averia', params: { businessId: b.id, city: b.city } });
    }
    if (t.realEstate) b.value *= 1 + macroFx(s).property;
    else b.value = Math.max(t.cost * 0.4, b.value * 0.99);
  }
}

function handleOverdraft(s) {
  if (s.cash < 0) {
    const room = Math.max(0, creditLimit(s) - s.debt);
    const take = Math.min(-s.cash, room);
    if (take > 0) {
      s.debt += take;
      s.cash += take;
      log(s, `🏦 La póliza de crédito cubre un descubierto de ${money(take)}.`, 'bad');
    }
  }
  if (s.cash < 0) {
    s.insolvencyMonths++;
    log(s, `🚨 Estás en descubierto y el banco no te da más. Mes ${s.insolvencyMonths} de 3 antes del concurso.`, 'bad');
  } else {
    s.insolvencyMonths = 0;
  }
}

function rollVisits(s, r) {
  if (s.cooldowns.trabajo <= 0 && chance(s, inspectionChance(s.heatTrabajo))) {
    s.pending.push({ kind: 'event', id: 'inspeccion_trabajo', params: laborVisitParams(s) });
    s.cooldowns.trabajo = 4;
    s.stats.inspecciones++;
  }
  if (s.cooldowns.hacienda <= 0 && chance(s, auditChance(s.heatHacienda))) {
    s.pending.push({ kind: 'event', id: 'auditoria_hacienda', params: { debt: haciendaDebt(s) } });
    s.cooldowns.hacienda = 6;
    s.stats.auditorias++;
  }
  // Nunca dos huelgas a la vez; con comité, la huelga es general y también la provoca el agravio.
  const striking = s.mods.some((m) => m.kind === 'strike') || s.pending.some((p) => p.id === 'huelga' || p.id === 'huelga_general');
  const st = strikeChance(s, r);
  if (!striking && st.p > 0 && chance(s, st.p)) s.pending.push({ kind: 'event', id: st.card });
  for (const b of s.businesses) {
    const strict = { estricto: 1.5, laxo: 0.5 }[govFx(s).tourism] ?? 1;
    if (b.ilegal && b.type !== 'airbnb') b.ilegal = false; // reconvertido en vivienda: ya no es un piso turístico
    if (b.ilegal && chance(s, 0.04 * strict)) s.pending.push({ kind: 'event', id: 'piso_ilegal', params: { businessId: b.id, city: b.city } });
  }
  for (const b of s.businesses) {
    if (b.type !== 'airbnb' || b.banned) continue;
    const c = CITY_BY_ID[b.city];
    if (c.tourism < 0.75) continue;
    if (c.touristLicense && !b.ilegal) continue; // con licencia pagada, la moratoria no les afecta
    const strictBan = { estricto: 1.5, laxo: 0.5 }[govFx(s).tourism] ?? 1;
    if (chance(s, (s.flags.alcaldeShield > 0 ? 0.005 : 0.02) * strictBan)) {
      b.banned = true;
      s.pending.push({ kind: 'event', id: 'pisos_prohibidos', params: { businessId: b.id, city: b.city } });
    }
  }
}

function rollScheduled(s) {
  const m = s.month % 12;
  if (m === 11) s.pending.push({ kind: 'event', id: 'navidad' });
  if (m === 6) s.pending.push({ kind: 'event', id: 'agosto' });
}

export function eligibleEvents(s) {
  s.seen ||= {};
  return EVENTS.filter((e) => {
    const w = e.weight(s);
    if (!(w > 0)) return false;
    const last = s.seen[e.id];
    if (last == null) return true;
    if (e.once) return false;
    return s.month - last >= (e.cooldown ?? 12);
  });
}

function rollRandomEvent(s) {
  const eligible = eligibleEvents(s);
  // Los pasos de arcos narrativos salen en cuanto se cumplen sus condiciones (uno por mes).
  const forced = eligible.find((e) => e.forced);
  if (forced) {
    s.pending.push({ kind: 'event', id: forced.id });
    s.seen[forced.id] = s.month;
    return;
  }
  if (s.pending.length >= 2 || !chance(s, RANDOM_EVENT_CHANCE)) return;
  const e = weightedPick(s, eligible.filter((x) => !x.forced), (x) => x.weight(s));
  if (e) {
    s.pending.push({ kind: 'event', id: e.id });
    s.seen[e.id] = s.month;
  }
}

export function currentPending(s) {
  const p = s.pending[0];
  if (!p) return null;
  const ev = EVENT_BY_ID[p.id];
  const params = p.params || {};
  // Etiquetas, pistas e imágenes pueden depender del estado (p. ej. la probabilidad real de un truco).
  const val = (x) => (typeof x === 'function' ? x(s, params) : x);
  const last = ev.memory ? custom(s, ev.id).last : null;
  const usual = (c) => {
    const h = val(c.hint);
    return last && c.key === last ? `↺ Lo de siempre (la última vez elegiste esto).${h ? ` ${h}` : ''}` : h;
  };
  return {
    pending: p,
    event: ev,
    title: val(ev.title),
    text: ev.text(s, params),
    portrait: val(ev.portrait),
    image: val(ev.image),
    choices: ev.choices.map((c, i) => ({
      index: i, label: val(c.label), hint: usual(c), key: c.key,
      available: c.available ? !!c.available(s, params) : true,
    })).filter((c) => c.available),
  };
}

export function resolvePending(s, choiceIndex) {
  const p = s.pending[0];
  if (!p) return null;
  const ev = EVENT_BY_ID[p.id];
  const params = p.params || {};
  const choice = ev.choices[choiceIndex];
  if (!choice || (choice.available && !choice.available(s, params))) throw new Error(`Opción no válida ${p.id}#${choiceIndex}`);
  s.seen ||= {};
  s.seen[p.id] = s.month;
  const result = choice.effect(s, params);
  if (ev.memory && choice.key) remember(s, p.id, choice.key);
  if (p.id === 'auditoria_hacienda') afterAudit(s); // Don Fermín puede tirar del hilo de un maquillaje
  s.pending.shift();
  s.cash = Math.round(s.cash);
  checkUnlocks(s);
  s.quote = pickQuote(s);
  return result;
}

export function checkEnding(s) {
  if (s.ending) return s.ending;
  let id = null;
  const pat = patrimonio(s);
  if (s.expedientes >= 3) id = 'carcel';
  else if (s.insolvencyMonths >= 3) id = 'bancarrota';
  else if (s.zeroMoralMonths >= 2) id = 'cooperativa';
  else if (pat >= 15e6 && !s.endless && !inLockup(s)) id = 'forbes'; // con bloqueo bursátil, espera
  else if (s.month >= GAME_MONTHS && !s.endless) id = pat >= 5e6 ? 'tiburon' : pat >= 800000 ? 'pyme' : 'ruina_lenta';
  if (id) s.ending = id;
  // El premio de la cláusula no cambia el final: se decide antes y se paga una sola vez.
  if (['pyme', 'tiburon', 'forbes'].includes(id)) settleClause(s);
  // Si la partida termina sin cumplirla, queda cerrada: el modo infinito ya no la puede cobrar.
  if (id && s.clausula && !s.clausula.done && !s.clausula.broken) s.clausula.closed = true;
  return id;
}

export function pickQuote(s) {
  const cond = CONDITIONAL_QUOTES.filter((q) => q.test(s));
  if (cond.length && chance(s, 0.6)) return pick(s, cond).text;
  return pick(s, QUOTES);
}

export function score(s) {
  const base = clamp(patrimonio(s) / 1000, -1e9, 1e9) + s.fama * 50 + s.rep * 30 - s.expedientes * 2000;
  return Math.round(base > 0 ? base * clauseMult(s) : base);
}
