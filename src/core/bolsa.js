// La promesa del trimestre: cotizando, cada trimestre Manolo da una guía a los analistas y la cumple (o
// no). La credibilidad y el sentimiento del mercado mueven lo que vale tu parte. Se puede maquillar la
// cifra publicada, pero se revierte el trimestre siguiente y a veces se descubre.
import { computeEconomy } from './economy.js';
import { addFama, addRep, addHeatHacienda, addExpediente, clamp, log, money, START_YEAR, GAME_MONTHS, hito } from './helpers.js';
import { chance } from './rng.js';

export const SENT_MIN = 0.85;
export const SENT_MAX = 1.05;
export const SENT_STEP = 0.05; // lo más que se mueve el sentimiento en un trimestre (salvo un escándalo)
export const SENT_REVERT = 0.35; // cada trimestre el mercado olvida un 35 % de lo pasado (vuelve hacia 1)
export const DISCOVER_Q = 0.08; // por maquillaje pendiente y cierre de trimestre
export const DISCOVER_AUDIT = 0.25;

export const GUIAS = {
  prudente: { label: 'Prudente', d: -0.1, onPromise: {}, met: { cred: 2, sent: 0.01 }, fail: { cred: -5, sent: -0.03 } },
  en_linea: { label: 'En línea', d: 0, onPromise: {}, met: { cred: 4, sent: 0.02 }, fail: { cred: -10, sent: -0.05 } },
  optimista: { label: 'Optimista', d: 0.1, onPromise: { fama: 2 }, met: { cred: 8, sent: 0.03 }, fail: { cred: -15, sent: -0.05 } },
  tiburon: { label: 'Modo tiburón', d: 0.25, onPromise: { fama: 4 }, met: { cred: 12, sent: 0.05 }, fail: { cred: -25, sent: -0.05, junta: true } },
};

export const qOf = (m) => Math.floor(m / 3);
export const qLabel = (qi) => `T${(qi % 4) + 1} de ${START_YEAR + Math.floor(qi / 4)}`;

export function bolsaState(s) {
  const ipo = s.ipo;
  if (!ipo) return null;
  ipo.sent ??= 1;
  ipo.cred ??= 50;
  ipo.q ??= null;
  ipo.publicados ??= {};
  ipo.maquillajes ??= [];
  ipo.descubiertos ??= 0;
  ipo.racha ??= 0;
  ipo.sentMove ??= { qi: -1, d: 0 };
  return ipo;
}

export const sentiment = (s) => (s.ipo ? s.ipo.sent ?? 1 : 1);

// Mueve el sentimiento como mucho ±0,05 por trimestre (un escándalo se salta el tope, no el rango).
export function moveSent(s, d, force = false) {
  const ipo = bolsaState(s);
  if (!ipo || !d) return;
  if (!force) {
    const qi = qOf(s.month);
    if (ipo.sentMove.qi !== qi) ipo.sentMove = { qi, d: 0 };
    const lo = -SENT_STEP - ipo.sentMove.d;
    const hi = SENT_STEP - ipo.sentMove.d;
    d = Math.max(lo, Math.min(hi, d));
    ipo.sentMove.d += d;
  }
  ipo.sent = Math.max(SENT_MIN, Math.min(SENT_MAX, ipo.sent + d));
}

const addCred = (s, d) => {
  const ipo = bolsaState(s);
  if (ipo) ipo.cred = clamp(ipo.cred + d);
};

// Neto real de un trimestre (con los meses ya cerrados).
export const realQuarter = (s, qi) => s.history.filter((h) => qOf(h.month) === qi).reduce((a, h) => a + h.net, 0);
export const publishedQuarter = (s, qi) => s.ipo?.publicados?.[qi] ?? reportedQuarter(s, qi);
const maqOf = (s, qi) => (s.ipo?.maquillajes || []).filter((x) => x.qi === qi).reduce((a, x) => a + x.importe, 0);

// Lo que se publicará: el real, más lo maquillado este trimestre, menos lo maquillado el anterior.
export const reportedQuarter = (s, qi) => realQuarter(s, qi) + maqOf(s, qi) - maqOf(s, qi - 1);

// Consenso: crecimiento de los 4 últimos trimestres publicados frente a los 4 anteriores (de 0 a +50 %).
export function consensus(s, qi) {
  let a = 0;
  let b = 0;
  for (let k = 1; k <= 4; k++) {
    a += publishedQuarter(s, qi - k);
    b += publishedQuarter(s, qi - 4 - k);
  }
  return b > 0 ? clamp(a / b - 1, 0, 0.5) : 0;
}

// Cómo va el trimestre prometido: lo cerrado, lo que se espera del mes que falta y el objetivo.
// `month`: el mes que falta por cerrar (al cerrar un mes, el siguiente; en la interfaz, el actual).
export function quarterProgress(s, month = s.month) {
  const ipo = bolsaState(s);
  if (!ipo?.q) return null;
  const qi = ipo.q.qi;
  const closed = reportedQuarter(s, qi);
  const left = 3 - s.history.filter((h) => qOf(h.month) === qi).length;
  const est = closed + Math.max(0, left) * computeEconomy({ ...s, month }).net;
  return { qi, closed, est, target: ipo.q.target, ratio: ipo.q.target > 0 ? est / ipo.q.target : 1, left };
}

function judge(s, qi) {
  const ipo = bolsaState(s);
  const q = ipo.q;
  const real = reportedQuarter(s, qi);
  ipo.publicados[qi] = real;
  const g = GUIAS[q.guia] || GUIAS.en_linea;
  const ok = real >= q.target;
  const fx = ok ? g.met : g.fail;
  addCred(s, fx.cred || 0);
  // El mercado tiene memoria corta: el sentimiento vuelve hacia 1 y luego se mueve por el resultado.
  moveSent(s, (1 - ipo.sent) * SENT_REVERT + (fx.sent || 0));
  ipo.racha = ok ? ipo.racha + 1 : 0;
  ipo.lastResult = { qi, ok, real, target: q.target, guia: q.guia };
  ipo.q = null;
  log(s, ok
    ? `📈 ${qLabel(qi)}: publicas ${money(real)} y superas lo prometido (${money(q.target)}). Credibilidad +${fx.cred || 0}.`
    : `📉 ${qLabel(qi)}: publicas ${money(real)} y no llegas a lo prometido (${money(q.target)}). Credibilidad ${fx.cred}.`, ok ? 'good' : 'bad');
  if (!ok && fx.junta && s.month - (ipo.angryMonth ?? -99) >= 12) {
    ipo.angryMonth = s.month;
    s.pending.push({ kind: 'event', id: 'junta_accionistas', params: { cause: 'tiburon' } });
  }
}

// Un fondo bajista descubre los maquillajes pendientes.
export function discover(s) {
  const ipo = bolsaState(s);
  const pend = ipo.maquillajes.filter((x) => !x.descubierto);
  if (!pend.length) return false;
  for (const x of pend) x.descubierto = true;
  ipo.descubiertos++;
  hito(s, 'maquillaje');
  moveSent(s, -0.1, true);
  addCred(s, -30);
  addRep(s, -10);
  addHeatHacienda(s, 25);
  if (ipo.descubiertos >= 3) addExpediente(s, 1, 'falsedad contable');
  if (!s.pending.some((p) => p.id === 'informe_bajista')) s.pending.push({ kind: 'event', id: 'informe_bajista', params: { n: pend.length } });
  return true;
}

// Al cerrar cada mes cotizando (antes de que avance el calendario).
export function tickBolsa(s) {
  const ipo = bolsaState(s);
  if (!ipo) return;
  const m = s.month;
  const qi = qOf(m);
  if (m % 3 === 1 && ipo.q?.qi === qi && !s.pending.some((p) => p.id === 'cierre_trimestre')) {
    const pr = quarterProgress(s, m + 1); // el mes que falta es el siguiente (con su temporada)
    if (pr && pr.est < pr.target) s.pending.push({ kind: 'event', id: 'cierre_trimestre', params: { gap: Math.round(pr.target - pr.est) } });
  }
  if (m % 3 !== 2) return;
  const pend = ipo.maquillajes.filter((x) => !x.descubierto).length;
  if (pend && chance(s, Math.min(1, DISCOVER_Q * pend))) discover(s);
  if (ipo.q && ipo.q.qi === qi) judge(s, qi);
  ipo.publicados[qi] ??= reportedQuarter(s, qi); // también sin promesa, para que cuente la reversión
  // No se promete un trimestre que empieza cuando ya ha terminado la partida (salvo en modo infinito).
  if (m >= ipo.month && (s.endless || (qi + 1) * 3 < GAME_MONTHS)) queuePromise(s, qi + 1);
}

export function queuePromise(s, next) {
  const ipo = bolsaState(s);
  if (!ipo || ipo.q || s.pending.some((p) => p.id === 'promesa_trimestre')) return;
  const base = publishedQuarter(s, next - 4);
  if (base <= 0) log(s, `📊 ${qLabel(next)}: el mismo trimestre del año pasado dio pérdidas, así que los analistas no esperan nada.`, 'info');
  else s.pending.push({ kind: 'event', id: 'promesa_trimestre', params: { qi: next, base, g: consensus(s, next) } });
}

// Al seguir en modo infinito tras el final: la promesa del trimestre que no se hizo.
export function resumePromises(s) {
  if (!s.ipo) return;
  queuePromise(s, qOf(s.month) + (s.month % 3 === 0 ? 0 : 1));
}

// Una auditoría de Hacienda puede tirar del hilo de un maquillaje.
export function afterAudit(s) {
  const ipo = s.ipo && bolsaState(s);
  if (ipo && ipo.maquillajes.some((x) => !x.descubierto) && chance(s, DISCOVER_AUDIT)) discover(s);
}

export function promise(s, p, guia) {
  const ipo = bolsaState(s);
  const g = GUIAS[guia];
  const target = Math.round(p.base * (1 + p.g + g.d));
  ipo.q = { qi: p.qi, guia, target, base: p.base };
  if (g.onPromise.sent) moveSent(s, g.onPromise.sent);
  if (g.onPromise.fama) addFama(s, g.onPromise.fama);
  return target;
}
