// La cuenta de la plantilla: lo que Manolo se ahorra pagando por debajo del convenio acaba liquidado,
// el beneficio por cabeza genera agravio y, con más de 50 personas, hay comité, convenio cada marzo y
// huelga general. Todo determinista salvo las tiradas con s.rng.
import { legalWage, policyWage, policyFx } from './economy.js';
import { addMoral, addRep, clamp, log, addMonthlyCost, money, hito } from './helpers.js';
import { difficultyOf } from './state.js';

export const K = {
  LIQ_WINDOW: 24, // meses que mira Marisa (lo anterior prescribe)
  LIQ_K: 1.2, // diferencias salariales más cuotas y recargo
  LIQ_UPFRONT: 0.25, // lo que se paga al momento
  LIQ_SURCHARGE: 0.05, // recargo del aplazamiento
  LIQ_MIN_CUOTAS: 18,
  LIQ_MAX_CUOTAS: 48,
  LIQ_MAX_SHARE: 0.12, // la cuota no pasa del 12 % de lo que facturas (si cabe en 48 meses)
  AGR_RATIO: 55, // peso del beneficio por cabeza (en sueldos) en el agravio
  AGR_R0: 0.3, // por debajo de 0,3 sueldos de beneficio por cabeza no molesta
  AGR_LUJO: 3,
  AGR_BOLSA: 8,
  AGR_PLUS: 300, // cada punto de plus de convenio quita 3 de agravio
  AGR_SPEED: 0.15,
  AGR_MORAL: 0.04, // moral que resta cada punto de agravio al mes
  COMITE_AT: 50,
  STRIKE_AT: 45,
  STRIKE_DIV: 200,
  PAGA_UNICA: 400,
  PAGA_HUELGA: 300,
};

// ------------------------------------------------------------------ Liquidación
// Lo que se ahorra cada mes frente al convenio (sin contar los pactos legales de los sucesos).
export const monthlySaving = (s, employees) => Math.round(Math.max(0, legalWage(s) - policyWage(s)) * (employees || 0));

export function tickAhorro(s, r) {
  const d = (s.dossier ||= { trucos: {}, sanciones: [], historial: [] });
  d.ahorro = [...(d.ahorro || []), monthlySaving(s, r.employees)].slice(-K.LIQ_WINDOW);
}

export const ahorroTotal = (s) => (s.dossier?.ahorro || []).reduce((a, b) => a + b, 0);
export const ahorroMeses = (s) => (s.dossier?.ahorro || []).filter((x) => x > 0).length;
export const liquidacion = (s) => Math.round(ahorroTotal(s) * K.LIQ_K * difficultyOf(s).fines);

// Cuántas cuotas: 18 como mínimo, más si la cuota pasara del 12 % de la facturación (hasta 48).
export function liqCuotas(s, total) {
  const h = s.history.slice(-3);
  const rev = h.length ? h.reduce((a, x) => a + x.revenue, 0) / h.length : s.lastReport?.revenue || 1;
  return clamp(Math.ceil(total / (K.LIQ_MAX_SHARE * Math.max(1, rev))), K.LIQ_MIN_CUOTAS, K.LIQ_MAX_CUOTAS);
}

// Paga una liquidación: un 25 % al momento (sin dejar la caja en negativo) y el resto aplazado con recargo.
export function liquidate(s, amount) {
  amount = Math.round(amount || 0);
  if (amount <= 0) return '';
  const now = Math.round(Math.min(amount * K.LIQ_UPFRONT, Math.max(0, s.cash)));
  s.cash -= now;
  s.stats.liquidado = (s.stats.liquidado || 0) + amount;
  s.stats.maxLiquidacion = Math.max(s.stats.maxLiquidacion || 0, amount);
  if (amount >= 100000) hito(s, 'liquidacion');
  const rest = amount - now;
  if (rest <= 0) return ` Liquidación de cuotas y diferencias salariales: ${money(amount)}, pagada al momento.`;
  const total = Math.round(rest * (1 + K.LIQ_SURCHARGE));
  const n = liqCuotas(s, total);
  addMonthlyCost(s, 'Aplazamiento con la Seguridad Social', Math.round(total / n), n);
  s.extraMonthly[s.extraMonthly.length - 1].locked = true;
  return ` Liquidación de cuotas y diferencias salariales: ${money(amount)} (${money(now)} ahora y el resto en ${n} cuotas de ${money(total / n)}).`;
}

// ------------------------------------------------------------------ Agravio
const lujoPeso = (s) => (s.lujo || []).reduce((a, x) => a + (['yate', 'chalet'].includes(x.id) ? 2 : 1), 0);

// Beneficio por cabeza en sueldos de los que cobran (explotar sube el cociente).
export function profitRatio(s, r) {
  const pre = Math.max(0, r.profit + (r.costs.reparto || 0));
  return r.employees ? pre / r.employees / Math.max(1, policyWage(s)) : 0;
}

// Hacia dónde va el agravio con lo de ahora (sin la inercia).
export function agravioTarget(s, ratio) {
  const fx = policyFx(s);
  const raw = K.AGR_RATIO * Math.max(0, ratio - K.AGR_R0) + K.AGR_LUJO * lujoPeso(s) + (s.ipo ? K.AGR_BOLSA : 0) - K.AGR_PLUS * (s.comite?.plus || 0);
  return clamp(raw * (1 - (fx.rep?.alivio || 0)));
}

// Va dentro de driftStats, así que las previsiones lo calculan igual que el cierre.
export function driftAgravio(s, r) {
  const fx = policyFx(s);
  const now = profitRatio(s, r);
  s.plantilla ||= { ratio: 0 };
  s.plantilla.ratio = s.plantilla.ratio ? 0.6 * s.plantilla.ratio + 0.4 * now : now;
  const target = agravioTarget(s, s.plantilla.ratio);
  s.agravio = clamp((s.agravio || 0) + (target - (s.agravio || 0)) * K.AGR_SPEED);
  addMoral(s, -K.AGR_MORAL * s.agravio + (fx.rep?.moral || 0));
  if (fx.rep?.rep) addRep(s, fx.rep.rep);
  if (s.policies.reparto === 'participacion') s.flags.participacionMeses = (s.flags.participacionMeses ?? 0) + 1;
  else s.flags.participacionMeses = 0;
}

// ------------------------------------------------------------------ Comité
export function newComite(s) {
  return { since: s.month, plus: 0, paz: s.flags.comiteFin === 'firmado' ? 12 : 0, nextConvenio: s.month + 6, prometido: null, rotas: [], extra: 0, huelgas: 0, firmas: 0 };
}

// El comité se forma con 50 personas en plantilla (o al cerrar el arco del convenio), nunca a mitad del arco.
export function tickComite(s, r) {
  if (!s.comite) {
    const step = s.flags.comiteStep;
    if ((r.employees >= K.COMITE_AT && step == null) || step === 3) {
      const t0 = { firmado: -10, roto: 10, huelga: 10, esquiroles: 20 }[s.flags.comiteFin] ?? 0;
      s.agravio = clamp((s.agravio || 0) + t0);
      s.comite = newComite(s);
      hito(s, 'comite');
      s.pending.push({ kind: 'event', id: 'comite_nace' });
    }
    return;
  }
  if (s.comite.paz > 0) s.comite.paz--;
}

// Subida que pediría Maripili hoy (fracción): 1 % con agravio 25, 2 % con 40, 3 % con 55.
export function convenioDemand(s) {
  const pts = Math.round(2 * Math.max(0, ((s.agravio || 0) - 10) / 15)) / 2 + (s.comite?.extra || 0);
  return clamp(pts, 0, 6) / 100;
}

export const isConvenioMonth = (s, m) => !!s.comite && m % 12 === 2 && m >= s.comite.nextConvenio;

export function rollConvenio(s) {
  const c = s.comite;
  if (!isConvenioMonth(s, s.month)) return;
  const d = convenioDemand(s);
  if (d <= 0 && c.prometido == null) {
    c.paz = 12;
    c.nextConvenio = s.month + 12;
    log(s, '🤝 Maripili prorroga el convenio un año sin pedir subida: "Con que no lo estropees, Manolo."', 'good');
    return;
  }
  s.pending.push({ kind: 'event', id: 'convenio_anual', params: { d } });
}

// Probabilidad de huelga al cerrar: sin comité, la de siempre por moral; con comité, también por agravio.
export function strikeChance(s, r) {
  const control = r.control ?? 0;
  const pMoral = s.moral < 25 ? 0.15 * (1 - 0.7 * control) : 0;
  if (!s.comite) return { p: pMoral, card: 'huelga' };
  if (s.comite.paz > 0) return { p: 0, card: 'huelga_general' };
  const pAgr = (s.agravio || 0) >= K.STRIKE_AT ? (((s.agravio || 0) - 40) / K.STRIKE_DIV) * (1 - 0.5 * control) : 0;
  return { p: Math.max(pMoral, pAgr), card: 'huelga_general' };
}

// Promesas rotas en los últimos 24 meses: cada una quita un 25 % de lo que se cree Maripili.
export const credibilidad = (s) => clamp(1 - 0.25 * (s.comite?.rotas || []).filter((m) => s.month - m <= 24).length, 0.25, 1);
