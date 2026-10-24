// Vida personal de Manolo (lujos y familia) y salida a Bolsa.
import { LUJO_BY_ID } from '../data/lujo.js';
import { addCash, addFama, addHeatHacienda, addRep, log, money, clamp, hito, GAME_MONTHS } from './helpers.js';
import { macroFx } from './macro.js';
import { checkClause } from './clauses.js';

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
  log(s, `${l.emoji} Manolo se compra: ${l.name}. Lo sube a las redes en menos de una hora.`, 'info');
  checkClause(s);
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

// ------------------------------------------------------------------ Estrés
// Efecto de cada acción de Manolo sobre su estrés.
export const ACTION_STRESS = {
  linkedin: 3, bar: 2, alcalde: 2, charla: 1, cuentas: 1, padel: -5, marbella: -25, cena: -8, escapada: -15,
  visita_sorpresa: 3, congreso: 4, golf: -4, portada: 2, mentor: -2,
};

export function addStress(s, d) {
  s.estres = clamp((s.estres ?? 20) + d);
}

function tickStress(s) {
  if (s.restMonths > 0) {
    s.restMonths--;
    addStress(s, -8);
    return;
  }
  // Cuanto más grande el imperio, más agobio; un buen equipo directivo lo reparte.
  const execs = Object.keys(s.execs || {}).length;
  addStress(s, 0.4 + Math.min(2.2, s.businesses.length / 25) - 0.35 * execs);
  if ((s.estres ?? 0) > 80 && !s.pending.some((p) => p.id === 'susto_padel') && s.month - (s.flags.sustoMonth ?? -99) >= 6) {
    s.flags.sustoMonth = s.month;
    hito(s, 'susto');
    s.pending.push({ kind: 'event', id: 'susto_padel' });
  }
}

// ----------------------------------------------------------------- Familia
export function tickLife(s) {
  tickStress(s);
  for (const x of s.lujo || []) {
    const l = LUJO_BY_ID[x.id];
    x.value *= 1 + (l.realEstate ? Math.max(l.drift, macroFx(s).property) : l.drift);
  }
  if (s.flags.divorciado) return;
  // Manolo trabaja (o dice que trabaja) demasiado.
  const empire = Math.min(1, s.businesses.length / 30);
  const before = s.familia ?? 60;
  s.familia = clamp(before - 0.25 - empire + (s.lujo?.length ? 0.3 : 0));
  if (before >= 30 && s.familia < 30) {
    log(s, '💔 Merche ya no te espera para cenar. Quizá deberías dedicarle una acción del mes.', 'bad');
    s.notices ||= [];
    s.notices.push({
      kicker: '💔 Familia',
      title: 'Merche está rara',
      text: [
        'Llegas a casa a las once y la cena está en el microondas con una nota: "Estoy en pádel". La relación con Merche ha bajado de 30.',
        'Si baja de 15, pedirá el divorcio (y estáis en gananciales). Una cena familiar o una escapada desde la pestaña Manolo ayudarían.',
      ].join('\n\n'),
    });
  }
  if (s.familia < 15 && !s.pending.some((p) => p.id === 'divorcio')) {
    s.pending.push({ kind: 'event', id: 'divorcio' });
  }
}

// Divorcio: Merche se queda con una parte de la caja y de los caprichos (régimen de gananciales).
export function divorce(s, share) {
  if (s.cartilla) s.cartilla.confianza = Math.max(0, s.cartilla.confianza - 30); // «Merche era como una hija para mí»
  hito(s, 'divorcio');
  if (s.sucesion?.heir === 'merche') {
    s.sucesion.heir = 'nadie';
    log(s, '📜 Merche sale del testamento junto con el chalet.', 'info');
  }
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
  // Si Merche trabajaba en la empresa, se va con el divorcio.
  for (const [pos, e] of Object.entries(s.execs || {})) if (e.note === 'tu mujer') delete s.execs[pos];
  return { cashPart, lost };
}

// ------------------------------------------------------------------- Bolsa
export const IPO_FLOAT = 0.25;
export const IPO_FEE = 0.04;
export const VALUATION_BLEND = 0.5; // la valoración mezcla lo que hay en libros y 6 veces el beneficio
export const IPO_LOCKUP = 6; // meses de bloqueo: la revista no te saca justo después de tocar la campana

// Patrimonio total de la empresa (sin descontar a los accionistas).
export function grossEquity(s, assets) {
  return s.cash - s.debt + assets;
}

export function annualProfit(s) {
  return s.history.slice(-12).reduce((a, h) => a + h.net, 0);
}

export function ipoPremium(s) {
  const phase = s.macro?.phase;
  const mood = { burbuja: 0.3, expansion: 0.1, recuperacion: 0, crisis: -0.3 }[phase] ?? 0;
  return Math.min(1.4, Math.max(0.6, 1 + s.fama / 500 + (s.rep - 50) / 300 + mood));
}

export function companyValuation(s, equity) {
  // Mitad libros y mitad 6 veces el beneficio anual (nunca menos que los libros), por la prima de mercado.
  const blend = (1 - VALUATION_BLEND) * equity + VALUATION_BLEND * 6 * annualProfit(s);
  return Math.max(equity, blend) * ipoPremium(s);
}

// Fin del periodo de bloqueo tras salir a Bolsa (mes a partir del cual cuenta la revista de millonarios).
export const lockupEnd = (s) => (s.ipo ? s.ipo.month + IPO_LOCKUP : null);
export const inLockup = (s) => !!s.ipo && s.month < lockupEnd(s);

export function canIPO(s, equity) {
  if (s.ipo) return { ok: false, msg: 'Ya cotizas en Bolsa.' };
  if (s.month < 36) return { ok: false, msg: 'Los bancos de inversión quieren ver al menos tres años de cuentas.' };
  if (equity < 4e6) return { ok: false, msg: 'Necesitas un patrimonio de al menos 4 millones.' };
  if (s.rep < 35) return { ok: false, msg: 'Con esa reputación, ningún banco te saca a Bolsa.' };
  if (!s.endless && s.month + IPO_LOCKUP > GAME_MONTHS) return { ok: false, msg: 'Los bancos no sacan a Bolsa una empresa a punto de cerrar el ejercicio: el bloqueo no acabaría a tiempo.' };
  return { ok: true };
}

export function doIPO(s, equity) {
  const check = canIPO(s, equity);
  if (!check.ok) return check;
  const valuation = companyValuation(s, equity);
  const raised = valuation * IPO_FLOAT;
  const fee = raised * IPO_FEE;
  addCash(s, raised - fee);
  s.ipo = { month: s.month, float: IPO_FLOAT, valuation, price: 100, peak: 100, angryMonth: -99, sent: 1, cred: 50, q: null, publicados: {}, maquillajes: [], descubiertos: 0, racha: 0, blend: true };
  addFama(s, 12);
  addRep(s, 3);
  hito(s, 'bolsa');
  log(s, `🔔 Boomerez S.A. sale a Bolsa: vende el ${Math.round(IPO_FLOAT * 100)} % por ${money(raised)} (comisiones: ${money(fee)}). Manolo toca la campana con las gafas de sol puestas.`, 'good');
  return { ok: true, raised, fee, valuation };
}

// Cotización mensual: sigue a la valoración con algo de ruido y de euforia.
export function tickIPO(s, equity, noise) {
  if (!s.ipo) return;
  const fair = (companyValuation(s, equity) / s.ipo.valuation) * 100 * (s.ipo.sent ?? 1);
  s.ipo.price = Math.max(5, s.ipo.price * 0.6 + fair * 0.4 + noise);
  s.ipo.peak = Math.max(s.ipo.peak, s.ipo.price);
  // La junta salta cuando el mercado pierde la fe (sentimiento 0,90 o menos), como mucho una vez al año.
  if ((s.ipo.sent ?? 1) <= 0.9 && s.month - s.ipo.angryMonth >= 12) {
    s.ipo.angryMonth = s.month;
    s.pending.push({ kind: 'event', id: 'junta_accionistas' });
  }
}
