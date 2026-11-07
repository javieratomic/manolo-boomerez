// Parte del mes: por qué ha cambiado el neto respecto al mes anterior, qué ha pasado y qué viene.
// Solo lee informes y estado; no cambia nada ni usa el generador aleatorio.
import { SOBAO_SEASON, TOURISM_SEASON } from './economy.js';
import { BUSINESS_TYPES } from '../data/businesses.js';
import { CITY_BY_ID } from '../data/cities.js';
import { RIVALS } from '../data/rivals.js';
import { PHASES } from '../data/macro.js';
import { PRODUCTS } from '../data/market.js';
import { nextElectionMonth } from './politics.js';
import { CANDIDATE_REFRESH } from './execs.js';
import { UNLOCKS } from './actions.js';
import { dateLabel, moneyShort, plural } from './helpers.js';
import { convenioDemand, isConvenioMonth } from './plantilla.js';
import { MAMA, hasCond } from './cartilla.js';
import { quarterProgress, qLabel } from './bolsa.js';
import { forecast } from './preview.js';
import {isOperating,isResidential,businessName,renovationCost} from './construction.js';

export const CAT_NAMES = { finanzas:'Banca',infraestructura:'Telecomunicaciones',logistica:'Logística', sobaos: 'Sobaos', inmobiliario: 'Inmobiliario', hosteleria: 'Hostelería', formacion: 'Formación', servicios: 'Servicios', produccion: 'Producción' };
export const COST_NAMES = {
  renovaciones:'Renovaciones inmobiliarias',
  salarios: 'Salarios', directivos: 'Directivos', estructura: 'Estructura central', mantenimiento: 'Mantenimiento', alquileres: 'Alquileres',
  materias: 'Materias primas', transporte: 'Transporte', otros: 'Otros gastos', intereses: 'Intereses', asesores: 'Asesores', personales: 'Caprichos de Manolo', reparto: 'Reparto con la plantilla', impuestos: 'Impuestos',
};
export const MAX_DRIVERS = 3;

const catOf = (l) => (['obrador', 'international','online','contract'].includes(l.type) ? 'sobaos' : BUSINESS_TYPES[l.type]?.category);

// Estacionalidad media de una categoría (ponderada por ingresos de sus líneas) en un mes del año.
function seasonOf(lines, cat, m) {
  let w = 0;
  let f = 0;
  for (const l of lines) {
    if (catOf(l) !== cat || !l.revenue) continue;
    const t = BUSINESS_TYPES[l.type];
    const k = l.foreign ? 1 : cat === 'sobaos' ? SOBAO_SEASON[m] : t?.season ? t.season[m] : l.type === 'airbnb' ? TOURISM_SEASON[m] : 1;
    w += l.revenue;
    f += l.revenue * k;
  }
  return w ? f / w : 1;
}

// Motivo de la variación de los ingresos de una categoría, solo si se detecta de forma explícita.
function revenueReason(prev, r, s, cat, delta) {
  const before = new Map(prev.lines.map((l) => [l.id, l]));
  const now = new Map(r.lines.map((l) => [l.id, l]));
  // Una cadena rival que aprieta en una ciudad.
  let worst = null;
  for (const l of r.lines) {
    const p = before.get(l.id);
    if (catOf(l) !== cat || !p || l.rivalF == null || p.rivalF == null) continue;
    const drop = p.rivalF - l.rivalF;
    if (drop > 0.01 && (!worst || drop > worst.drop)) worst = { l, drop };
  }
  if (worst && delta < 0) {
    // La cadena cuya presencia ha subido en esa ciudad (no la primera que ya estaba).
    const p = before.get(worst.l.id);
    const id = Object.keys(worst.l.rivalBy || {}).find((k) => (worst.l.rivalBy[k] || 0) > (p.rivalBy?.[k] || 0));
    return `${id ? RIVALS[id].name : 'La competencia'} aprieta en ${CITY_BY_ID[worst.l.city]?.name ?? worst.l.city}`;
  }
  const up = delta > 0;
  const opened = r.lines.filter((l) => catOf(l) === cat && !before.has(l.id)).length;
  const closed = prev.lines.filter((l) => catOf(l) === cat && !now.has(l.id)).length;
  if (opened && up) return opened === 1 ? '1 apertura' : `${opened} aperturas`;
  if (closed && !up) return closed === 1 ? '1 cierre' : `${closed} cierres`;
  // Los motivos solo valen si empujan en el mismo sentido que la cifra.
  if (r.phase && prev.phase && r.phase !== prev.phase && cat !== 'formacion') {
    const k = cat === 'inmobiliario' ? 'tourism' : 'demand';
    if (((PHASES[r.phase]?.[k] ?? 1) > (PHASES[prev.phase]?.[k] ?? 1)) === up) return `cambio de ciclo: ${PHASES[r.phase]?.label ?? r.phase}`;
  }
  if ((r.strike ?? 1) < (prev.strike ?? 1) && !up && ((cat === 'sobaos' && r.fill < prev.fill) || cat === 'hosteleria' || cat === 'servicios')) return 'huelga';
  const sNow = seasonOf(r.lines, cat, r.month % 12);
  const sPrev = seasonOf(r.lines, cat, prev.month % 12);
  if (Math.abs(sNow / sPrev - 1) > 0.08 && (sNow > sPrev) === up) return sNow > sPrev ? 'temporada alta' : 'temporada baja';
  if (cat === 'sobaos' && !up && prev.fill - r.fill > 0.03) return `el obrador cubre ${Math.round((prev.fill - r.fill) * 100)} puntos menos de la demanda`;
  return null;
}

function costReason(prev, r, s, key) {
  if (key === 'estructura' && r.costs.estructura > prev.costs.estructura) return 'más negocios que coordinar desde Selaya';
  if (key === 'impuestos') {
    if (r.costs.impuestos > prev.costs.impuestos && r.profit > prev.profit) return 'más beneficio, más impuestos';
    if (r.costs.impuestos < prev.costs.impuestos && r.profit >= prev.profit) return 'Hacienda se lleva menos (contabilidad, asesores o el Gobierno)';
    return null;
  }
  if (key === 'intereses') {
    const known = prev.debt != null && r.debt != null;
    if (r.costs.intereses > prev.costs.intereses) return known ? (r.debt > prev.debt ? 'más deuda' : 'sube el tipo de interés') : null;
    if (r.costs.intereses < prev.costs.intereses && known && r.debt < prev.debt) return 'menos deuda';
    return null;
  }
  if (['salarios', 'alquileres', 'materias'].includes(key)) {
    const up = (r.costs[key] || 0) > (prev.costs?.[key] || 0);
    const opened = r.lines.filter((l) => !prev.lines.some((p) => p.id === l.id)).length;
    const closed = prev.lines.filter((l) => !r.lines.some((p) => p.id === l.id)).length;
    if (opened && up) return opened === 1 ? '1 apertura' : `${opened} aperturas`;
    if (closed && !up) return closed === 1 ? '1 cierre' : `${closed} cierres`;
  }
  return null;
}

// Las mayores variaciones (en lo que afectan al neto) entre dos informes, con su motivo si se conoce.
export function netDrivers(prev, r, s) {
  if (!prev || !r) return [];
  const items = [];
  for (const cat of Object.keys(r.revenueByCat)) {
    const d = (r.revenueByCat[cat] || 0) - (prev.revenueByCat?.[cat] || 0);
    items.push({ kind: 'ingresos', key: cat, label: `Ingresos · ${CAT_NAMES[cat] ?? cat}`, delta: d });
  }
  for (const key of Object.keys(r.costs)) {
    const d = -((r.costs[key] || 0) - (prev.costs?.[key] || 0));
    items.push({ kind: 'costes', key, label: COST_NAMES[key] ?? key, delta: d });
  }
  const min = Math.max(500, 0.03 * Math.abs(prev.net));
  return items
    .filter((x) => Math.abs(x.delta) >= min)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, MAX_DRIVERS)
    .map((x) => ({ ...x, reason: x.kind === 'ingresos' ? revenueReason(prev, r, s, x.key, x.delta) : costReason(prev, r, s, x.key) }));
}

// Lo que ha dejado el cierre en el registro (sin titulares), malas primero.
export function freshEntries(s, head, max = 5) {
  const idx = head ? s.log.indexOf(head) : -1;
  const fresh = (idx >= 0 ? s.log.slice(0, idx) : s.log.filter((e) => e.month === s.month - 1)).filter((e) => e.tone !== 'news' && !e.text.startsWith('🎯 Objetivo cumplido') && !e.text.startsWith('🔓'));
  const order = { bad: 0, good: 1 };
  const sorted = [...fresh].sort((a, b) => (order[a.tone] ?? 2) - (order[b.tone] ?? 2));
  return { items: sorted.slice(0, max), more: Math.max(0, sorted.length - max) };
}

// Lo que va a pasar al cerrar este mes o el siguiente. Nunca anuncia inspecciones ni cuánto dura el ciclo.
export function upcoming(s) {
  const out = [];
  const closes = [s.month, s.month + 1];
  const when = (m) => `al cerrar ${dateLabel(m).toLowerCase().replace(' ', ' de ')}`;
  for (const m of closes) {
    if (m % 12 === 11) out.push(`🎄 Navidad: Maripili preguntará por la cesta ${when(m)}.`);
    if (m % 12 === 6) out.push(`🏖️ Vacaciones de agosto: la plantilla preguntará ${when(m)}.`);
  }
  for (const m of closes) {
    if (isConvenioMonth(s, m)) {
      // Al cerrar este mes, con el agravio ya movido (como lo calculará la carta).
      const d = m === s.month ? convenioDemand(forecast(s).c) : convenioDemand(s);
      out.push(d > 0 || s.comite.prometido != null ? `🤝 Revisión del convenio ${when(m)}: Maripili pediría un ${(d * 100).toFixed(1).replace('.0', '').replace('.', ',')} %.` : `🤝 Revisión del convenio ${when(m)}: con el agravio así de bajo, Maripili no pediría subida.`);
    }
  }
  const c = s.cartilla;
  if (c?.owed > 0 && !c.embargo && c.due != null && c.due <= s.month + 1) out.push(`👵 Vence la cartilla de tu madre ${when(Math.max(s.month, c.due))} (le debes ${moneyShort(c.owed)}).`);
  if (hasCond(s, 'domingos') && (s.month + 1 - c.condFrom) % MAMA.DOMINGO_EVERY === 0) out.push('🍲 El mes que viene toca cocido en casa de tu madre: no habrá acción de Manolo.');
  const pr = s.ipo ? quarterProgress(s) : null;
  if (pr) for (const m of closes) if (m % 3 === 2 && Math.floor(m / 3) === pr.qi) out.push(`📈 Se cierra el ${qLabel(pr.qi)} ${when(m)}: con lo que se espera vas al ${Math.round(pr.ratio * 100)} % de lo prometido.`);
  const el = nextElectionMonth(s.month);
  if (el - s.month <= 2) out.push(`🗳️ Elecciones generales ${when(el)}.`);
  for (const mod of s.mods) if (mod.campaign && mod.months <= 1) out.push(`📢 Termina la campaña «${mod.label}»${mod.city ? ` en ${CITY_BY_ID[mod.city]?.name ?? mod.city}` : ''}.`);
  if (s.rd && s.rd.monthsLeft <= 1) out.push(`🧪 I+D: ${PRODUCTS.find((p) => p.id === s.rd.id)?.name ?? 'el producto'} estará listo ${when(s.month)}.`);
  for (const c of s.contracts) if (c.months <= 2 && c.months <= 120) out.push(`📄 Termina el contrato: ${c.label} (${c.months === 1 ? 'último mes' : '2 meses'}).`);
  if (s.flags.forcedLegal === 1) out.push('⚖️ Se acaba la legalidad forzosa: el mes que viene vuelves a decidir las condiciones.');
  if (s.restMonths === 1) out.push('🛋️ Manolo vuelve del reposo el mes que viene.');
  if (s.month - (s.candidatesMonth ?? -99) >= CANDIDATE_REFRESH) out.push(`👔 Llegan currículums nuevos de directivos ${when(s.month)}.`);
  for (const u of UNLOCKS) {
    if (u.month == null || s.unlocked[u.id]) continue;
    if (u.month > s.month && u.month <= s.month + 2) out.push(`🔓 ${BUSINESS_TYPES[u.id]?.name ?? u.id} se desbloquea como muy tarde en ${dateLabel(u.month).toLowerCase().replace(' ', ' de ')}.`);
  }
  for(const b of s.businesses){
    if(!isOperating(s,b)&&b.readyMonth-s.month<=2)out.push(`🏗️ Entrega de ${businessName(b)} en ${CITY_BY_ID[b.city].name} dentro de ${plural(b.readyMonth-s.month,'mes','meses')}.`);
    if(isResidential(b)&&isOperating(s,b)&&b.renewalMonth-s.month<=12)out.push(`🔧 Renovación de ${businessName(b)} en ${CITY_BY_ID[b.city].name}: dentro de ${Math.max(0,b.renewalMonth-s.month)} meses, ${moneyShort(renovationCost(b))} estimados.`);
  }
  if (!s.ipo && s.month + 1 >= 36 && s.month < 36) out.push('🔔 Desde el mes que viene se puede salir a Bolsa con una valoración de empresa de al menos 1.000 M€.');
  return out;
}

export function monthDigest(prev, r, s, head) {
  return { drivers: netDrivers(prev, r, s), fresh: freshEntries(s, head), upcoming: upcoming(s), prevNet: prev?.net ?? null };
}

export const fmtDelta = (v) => `${v >= 0 ? '+' : '−'}${moneyShort(Math.abs(v))}`;
