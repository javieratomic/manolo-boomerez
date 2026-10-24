// La cartilla de Doña Remedios: la madre de Manolo, 81 años, le presta de su libreta de ahorros. Sin
// intereses, pero con condiciones (lo que Manolo hace mal) y con un refrán en cada apunte. Sin azar.
import { addMonthlyCost, addRep, addFama, clamp, log, money } from './helpers.js';
import { REFRANES } from '../data/refranes.js';

export const MAMA = {
  START: { cunado: 160000, normal: 120000, hacienda: 90000 },
  PENSION: 400,
  MIN_MONTH: 3,
  NEED_CASH: 25000, // solo presta si de verdad lo necesitas (o si el banco ya te ha dicho que no)
  MIN_CONF: 30,
  TERM: 12,
  PRORROGA: 6,
  VETO: 24,
  RESPIRO: 12, // tras devolver, tu madre no vuelve a prestar en un año (si no, se vive de la cartilla)
  KEVIN_WAGE: 1800,
  DOMINGO_EVERY: 3,
  EMBARGO_MONTHS: 12,
  RESCUE_TERM: 24,
  RESCUE_CUSHION: 20000,
  CASA: 150000,
};
export const KEVIN_LABEL = 'Sueldo de Kevin, jefe de mantenimiento (por tu madre)';

export const COND_TEXT = {
  ley: 'A las chicas, lo que manda la ley',
  mantequilla: 'Mantequilla de verdad, como la de tu abuela',
  domingos: 'Los domingos, a comer a casa',
  kevin: 'Que coloques a tu sobrino Kevin',
};
// Función y no constante: money() no se puede llamar al cargar el módulo (importaciones circulares).
export const condDesc = (id) => ({
  ley: 'Mientras debas, sueldos de convenio, horas pagadas y sin becarios.',
  mantequilla: 'Mientras debas, nada de margarina ni de grasa misteriosa.',
  domingos: 'Cada tres meses, la acción del mes se va en el cocido de los domingos (familia +6, estrés −4).',
  kevin: `Kevin entra de jefe de mantenimiento: ${money(MAMA.KEVIN_WAGE)} al mes y mantenimiento «con cinta americana» hasta que devuelvas.`,
}[id] ?? '');

export const newCartilla = (difficulty = 'normal') => ({
  saldo: MAMA.START[difficulty] ?? MAMA.START.normal, owed: 0, due: null, prorroga: false, confianza: 60, conds: [], condFrom: null,
  entradas: [], embargo: null, rescate: false, rescatado: false, casa: false, vetoHasta: -99, devueltos: 0, prestamos: 0, aviso: false, enfado: false,
});

const legalLabor = (s) => s.policies.salario === 'convenio' && s.policies.horas === 'pagadas' && s.policies.becarios === 'ninguno';
export const owesMama = (s) => (s.cartilla?.owed || 0) > 0;
export const hasCond = (s, id) => owesMama(s) && (s.cartilla.conds || []).includes(id);
export const addConfianza = (s, d) => {
  if (s.cartilla) s.cartilla.confianza = clamp(s.cartilla.confianza + d);
};

// La condición apunta a lo que Manolo hace mal, en este orden.
export function chooseCond(s) {
  if (!legalLabor(s)) return 'ley';
  if (s.policies.ingredientes !== 'mantequilla') return 'mantequilla';
  if ((s.familia ?? 60) < 50 || s.flags.divorciado) return 'domingos';
  return 'kevin';
}

// ¿Esta política rompería la promesa a tu madre?
export function breaksPromise(s, key, value) {
  if (!owesMama(s)) return false;
  if (hasCond(s, 'ley') && ['salario', 'horas', 'becarios'].includes(key)) return value !== { salario: 'convenio', horas: 'pagadas', becarios: 'ninguno' }[key];
  if (hasCond(s, 'mantequilla') && key === 'ingredientes') return value !== 'mantequilla';
  return false;
}
export const promiseBroken = (s) => (hasCond(s, 'ley') && !legalLabor(s)) || (hasCond(s, 'mantequilla') && s.policies.ingredientes !== 'mantequilla');

export const maxLoan = (s) => Math.floor(Math.min(s.cartilla.saldo, (s.cartilla.saldo * s.cartilla.confianza) / 100) / 10000) * 10000;

export function canAsk(s) {
  const c = s.cartilla;
  if (!c) return { ok: false, msg: 'Tu madre no tiene cartilla.' };
  if (c.owed > 0) return { ok: false, msg: 'Primero devuélvele lo que le debes.' };
  if (s.month < MAMA.MIN_MONTH) return { ok: false, msg: '"¿Ya, Manolo? Si acabas de heredar." Espera unos meses.' };
  if (s.month < c.vetoHasta) {
    const n = c.vetoHasta - s.month;
    return { ok: false, msg: c.vetoMotivo === 'respiro' ? `"Acabas de devolvérmelo, Manolo. Déjame respirar." No presta hasta dentro de ${n} ${n === 1 ? 'mes' : 'meses'}.` : `Después del embargo, tu madre no presta hasta dentro de ${n} ${n === 1 ? 'mes' : 'meses'}.` };
  }
  if (c.confianza < MAMA.MIN_CONF) return { ok: false, msg: 'Tu madre ya no se fía de ti (confianza por debajo de 30).' };
  if (s.cash >= MAMA.NEED_CASH && !s.flags.bancoNo) return { ok: false, msg: `Tu madre solo presta si de verdad lo necesitas (caja por debajo de ${money(MAMA.NEED_CASH)}) o si el banco te ha dicho que no.` };
  if (maxLoan(s) < 10000) return { ok: false, msg: 'A tu madre no le queda casi nada en la cartilla.' };
  return { ok: true, max: maxLoan(s) };
}

// Refrán del apunte: sin azar y sin repetir el último.
export function refran(s, ctx) {
  const list = REFRANES[ctx] || REFRANES.pedir;
  const c = s.cartilla;
  const last = c.entradas.at(-1)?.refran;
  let i = c.entradas.length % list.length;
  if (list[i] === last) i = (i + 1) % list.length;
  return list[i];
}

function entry(s, concepto, debe, haber, ctx) {
  const c = s.cartilla;
  const r = refran(s, ctx);
  c.entradas.push({ m: s.month, concepto, debe: Math.round(debe), haber: Math.round(haber), saldo: Math.round(c.saldo), refran: r });
  if (c.entradas.length > 24) c.entradas.shift();
  return r;
}

function applyConds(s) {
  if (!hasCond(s, 'kevin')) return;
  s.policies.mantenimiento = 'kevin';
  addMonthlyCost(s, KEVIN_LABEL, MAMA.KEVIN_WAGE);
  Object.assign(s.extraMonthly[s.extraMonthly.length - 1], { locked: true, kevin: true });
}

function releaseConds(s) {
  const c = s.cartilla;
  if ((c.conds || []).includes('kevin')) {
    s.extraMonthly = s.extraMonthly.filter((x) => !x.kevin);
    s.policies.mantenimiento = 'manitas';
  }
  c.conds = [];
  c.enfado = false;
}

export function askLoan(s, amount) {
  const check = canAsk(s);
  if (!check.ok) return check;
  const c = s.cartilla;
  const a = amount === 'max' ? check.max : Math.min(Number(amount) || 0, check.max);
  if (a < 10000) return { ok: false, msg: `Ahora mismo tu madre te dejaría como mucho ${money(check.max)}.` };
  c.saldo -= a;
  c.owed = a;
  c.due = s.month + MAMA.TERM;
  c.prorroga = false;
  c.conds = [chooseCond(s)];
  c.condFrom = s.month;
  c.prestamos++;
  s.cash += a;
  applyConds(s);
  const r = entry(s, 'Préstamo a Manolo', a, 0, 'pedir');
  let aviso = '';
  if (s.clausula?.id === 'sin_bancos' && !s.clausula.broken && !s.clausula.done && !c.aviso) {
    c.aviso = true;
    aviso = '\n\n📜 Una madre no es un banco, dice el notario. Pero el testamento pide acabar a cero con todo el mundo.';
  }
  log(s, `👵 Tu madre te presta ${money(a)} de su cartilla. Condición: «${COND_TEXT[c.conds[0]]}».`, 'info');
  if (promiseBroken(s)) aviso += '\n\n⚠️ Ahora mismo no la cumples: cámbialo antes de cerrar el mes o tu madre se enterará.';
  return { ok: true, amount: a, cond: c.conds[0], text: `Doña Remedios saca la libreta de la Caja Cantábrica, se pone las gafas y apunta: ${money(a)}, a devolver en ${MAMA.TERM} meses, sin intereses.\n\n"Con una condición, Manolo: ${COND_TEXT[c.conds[0]].toLowerCase()}." ${condDesc(c.conds[0])}\n\n«${r}»${aviso}` };
}

// Devolver lo que se debe (aunque la caja quede en negativo: la póliza lo cubrirá al cerrar el mes).
export function repayMama(s, ctx = 'devolver') {
  const c = s.cartilla;
  if (!owesMama(s)) return { ok: false, msg: 'No le debes nada a tu madre.' };
  const a = c.owed;
  s.cash -= a;
  c.saldo += a;
  c.owed = 0;
  c.due = null;
  c.embargo = null;
  if (c.vetoHasta < s.month + MAMA.RESPIRO) {
    c.vetoHasta = s.month + MAMA.RESPIRO;
    c.vetoMotivo = 'respiro';
  }
  releaseConds(s);
  const r = entry(s, 'Manolo devuelve', 0, a, ctx);
  log(s, `👵 Devuelves ${money(a)} a tu madre. «${r}»`, 'good');
  return { ok: true, amount: a, refran: r };
}

// Devolver antes de tiempo cuenta como devolver a tiempo.
export function repayEarly(s) {
  const res = repayMama(s);
  if (res.ok) {
    addConfianza(s, 10);
    s.cartilla.devueltos++;
  }
  return res;
}

// «No tengo, mamá»: se lleva el capricho más caro (si vale al menos la mitad de la deuda) o el mostrador.
export function embargar(s) {
  const c = s.cartilla;
  const lujo = [...(s.lujo || [])].sort((a, b) => b.value - a.value)[0];
  let text;
  if (lujo && lujo.value >= c.owed / 2) {
    const take = Math.min(lujo.value, c.owed);
    s.lujo = s.lujo.filter((x) => x !== lujo);
    c.owed -= take;
    c.saldo += take;
    text = `Doña Remedios se lleva ${lujo.id === 'yate' ? 'el yate' : 'tu capricho más caro'} (${money(lujo.value)}) y lo descuenta de la cartilla.`;
    entry(s, 'Embargo materno: capricho', 0, take, 'embargo');
  } else {
    text = `Doña Remedios se pone el delantal y se planta en el mostrador de Selaya: lo que se venda allí es suyo hasta cobrarse (como mucho ${MAMA.EMBARGO_MONTHS} meses).`;
    entry(s, 'Embargo materno: el mostrador', 0, 0, 'embargo');
  }
  if (c.owed > 0) c.embargo = { months: MAMA.EMBARGO_MONTHS };
  else releaseConds(s);
  c.due = null;
  c.confianza = 0;
  c.vetoHasta = s.month + MAMA.VETO;
  c.vetoMotivo = 'embargo';
  s.flags.embargado = true;
  s.familia = clamp((s.familia ?? 60) - 15);
  addRep(s, -3);
  addFama(s, -3);
  return text;
}

// Cada cierre: pensión, la Fundación, el embargo del mostrador, el vencimiento y las promesas rotas.
export function tickCartilla(s, r) {
  const c = s.cartilla;
  if (!c) return;
  c.saldo += MAMA.PENSION;
  if (s.perks.fundacion) addConfianza(s, 0.2);
  if (c.embargo) {
    const take = Math.min(r.embargo || 0, c.owed);
    c.owed -= take;
    c.saldo += take;
    c.embargo.months--;
    if (c.owed <= 0 || c.embargo.months <= 0) {
      if (c.owed > 0) log(s, `👵 Tu madre deja el mostrador: "Lo que falta (${money(c.owed)}), dalo por perdido. Como a ti."`, 'bad');
      c.owed = 0;
      c.embargo = null;
      releaseConds(s);
    }
    return;
  }
  if (!owesMama(s)) return;
  const queued = (id) => s.pending.some((p) => p.id === id);
  if (promiseBroken(s) && !c.enfado && !queued('cartilla_enfado')) {
    c.enfado = true;
    s.pending.push({ kind: 'event', id: 'cartilla_enfado' });
  } else if (c.due != null && s.month >= c.due && !queued('cartilla_vence')) {
    s.pending.push({ kind: 'event', id: 'cartilla_vence' });
  }
}

// Una vez por partida: con dos meses en descubierto, tu madre se presenta en el banco.
export function maybeRescue(s) {
  const c = s.cartilla;
  if (!c || c.rescate || s.insolvencyMonths !== 2 || s.cash >= 0) return;
  c.rescate = true;
  s.pending.push({ kind: 'event', id: 'cartilla_rescate' });
}

export function rescue(s, casa = false) {
  const c = s.cartilla;
  const need = Math.max(0, -s.cash) + MAMA.RESCUE_CUSHION;
  if (casa && !c.casa) {
    c.casa = true;
    c.saldo += MAMA.CASA;
    s.familia = clamp((s.familia ?? 60) - 10);
    entry(s, 'Hipoteca de la casa de la calle Mayor', 0, MAMA.CASA, 'rescate');
  }
  const a = Math.min(need, c.saldo);
  c.saldo -= a;
  c.owed += a;
  c.due = s.month + MAMA.RESCUE_TERM;
  c.prorroga = false;
  c.conds = ['ley', 'mantequilla'];
  c.condFrom = s.month;
  c.prestamos++;
  c.rescatado = true;
  c.enfado = false;
  s.cash += a;
  s.insolvencyMonths = 0;
  const r = entry(s, 'Rescate', a, 0, 'rescate');
  return { amount: a, refran: r };
}

// El cocido de los domingos: cada tres meses desde el préstamo se come la acción del mes.
export const isDomingo = (s) => hasCond(s, 'domingos') && s.month > s.cartilla.condFrom && (s.month - s.cartilla.condFrom) % MAMA.DOMINGO_EVERY === 0;
