// Parte del mes: por qué ha cambiado el neto respecto al mes anterior, qué ha pasado y qué viene.
// Solo lee informes y estado; no cambia nada ni usa el generador aleatorio.
import { SOBAO_SEASON, TOURISM_SEASON, computeEconomy, patrimonio } from './economy.js';
import { BUSINESS_TYPES } from '../data/businesses.js';
import { CITY_BY_ID } from '../data/cities.js';
import { RIVALS } from '../data/rivals.js';
import { PHASES } from '../data/macro.js';
import { PRODUCTS } from '../data/market.js';
import { FOREIGN_BY_ID } from '../data/international.js';
import { CAMPAIGN_BY_ID } from './marketing.js';
import { nextElectionMonth } from './politics.js';
import { CANDIDATE_REFRESH } from './execs.js';
import { UNLOCKS } from './actions.js';
import { dateLabel, moneyShort, plural, fillPct } from './helpers.js';
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
const longDate = (m) => dateLabel(m).toLowerCase().replace(' ', ' de ');

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

// Todas las partidas (ingresos por sector y costes, impuestos incluidos): suman exactamente la variación del neto.
function driverItems(prev, r) {
  const items = [];
  for (const cat of Object.keys(r.revenueByCat)) {
    const d = (r.revenueByCat[cat] || 0) - (prev.revenueByCat?.[cat] || 0);
    items.push({ kind: 'ingresos', key: cat, label: `Ingresos · ${CAT_NAMES[cat] ?? cat}`, delta: d });
  }
  for (const key of Object.keys(r.costs)) {
    const d = -((r.costs[key] || 0) - (prev.costs?.[key] || 0));
    items.push({ kind: 'costes', key, label: COST_NAMES[key] ?? key, delta: d });
  }
  return items;
}
const driverMin = (prev) => Math.max(500, 0.03 * Math.abs(prev.net));

// Las mayores variaciones (en lo que afectan al neto) entre dos informes, con su motivo si se conoce.
export function netDrivers(prev, r, s) {
  if (!prev || !r) return [];
  const min = driverMin(prev);
  return driverItems(prev, r)
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

// Lo que las partidas listadas no explican de la variación del neto (plantilla nueva, intereses, partidas
// pequeñas...), con las dos mayores como motivo. null si es poca cosa: así la lista siempre cuadra con el neto.
export function restDriver(prev, r, drivers) {
  if (!prev || !r) return null;
  const listed = new Set(drivers.map((x) => `${x.kind}:${x.key}`));
  const others = driverItems(prev, r).filter((x) => !listed.has(`${x.kind}:${x.key}`) && Math.round(x.delta));
  const delta = r.net - prev.net - drivers.reduce((a, x) => a + x.delta, 0);
  if (Math.abs(delta) < driverMin(prev)) return null;
  const top = others.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 2).map((x) => `${x.label} ${fmtDelta(x.delta)}`);
  return { kind: 'resto', key: 'resto', label: 'Resto de partidas', delta, reason: top.length ? `entre otras: ${top.join(', ')}` : null };
}

// Modificadores de demanda (kind 'revenue': multiplican lo que se pide, no lo que se vende si el obrador no da)
// que se aplicaron en el cierre (sucesos, guerras de precios, campañas). Se pasan los
// de antes de cerrar: los de un solo mes ya han caducado cuando se escribe el parte. Con el mes cerrado, se quitan
// las campañas de temporada fuera de sus meses (como en campaignApplies); el texto dice a qué tipos y país toca.
export function revenueMods(mods = [], month = null) {
  const tName = (t) => BUSINESS_TYPES[t]?.short ?? BUSINESS_TYPES[t]?.name ?? t[0].toUpperCase() + t.slice(1);
  return mods.filter((m) => m.kind === 'revenue' && m.factor !== 1 && m.months > 0).filter((m) => {
    const c = m.campaign && CAMPAIGN_BY_ID[m.campaign];
    return !(c?.activeMonths && Number.isFinite(month) && !c.activeMonths.includes(month % 12));
  }).map((m) => {
    const pct = Math.round((m.factor - 1) * 100);
    const types = m.types ?? (m.campaign && CAMPAIGN_BY_ID[m.campaign]?.types) ?? null;
    const where = (m.city ? ` en ${CITY_BY_ID[m.city]?.name ?? m.city}` : m.market ? ` en ${FOREIGN_BY_ID[m.market]?.country ?? m.market}` : '')
      + (m.category ? ` · ${CAT_NAMES[m.category] ?? m.category}` : '') + (types?.length ? ` (${types.map(tName).join(', ')})` : '');
    const cats = m.category ? [m.category] : types ? [...new Set(types.map((t) => catOf({ type: t })).filter(Boolean))] : null;
    return { label: m.label || 'Modificador', category: m.category ?? null, cats, factor: m.factor, text: `${m.label || 'Modificador'}${where}: demanda ${pct > 0 ? '+' : '−'}${Math.abs(pct)} %` };
  });
}

// La frase del parte sobre el obrador: dice el mes al que se refiere y, si ahora sobra capacidad, lo dice también
// (el panel del obrador enseña el mes en curso, con otra temporada y otra demanda).
export function obradorNote(r, s) {
  if (!r || !(r.fill < 0.999)) return null;
  const n = (x) => Math.round(x).toLocaleString('es-ES');
  const now = computeEconomy(s);
  const closed = `En ${longDate(r.month)} el obrador sirvió ${n(r.totalDemand * r.fill)} de ${n(r.totalDemand)} sobaos pedidos (${fillPct(r.fill)} de la demanda).`;
  const ahead = now.fill >= 0.999
    ? ` Para ${longDate(s.month)} la demanda prevista es de ${n(now.totalDemand)} y la capacidad de ${n(now.capacity)}: hay capacidad libre.`
    : ` Para ${longDate(s.month)} se prevé servir el ${fillPct(now.fill)} (capacidad ${n(now.capacity)}, demanda ${n(now.totalDemand)}).`;
  return { text: closed + ahead, short: now.fill < 0.999 };
}

// Patrimonio del balance anual: el inicio es lo que marcaba el HUD al empezar enero (s.yearOpen, que guarda la
// interfaz); en partidas sin esa marca, el cierre de diciembre anterior. El final es el patrimonio actual (el del HUD).
export function yearWealth(s, r) {
  const y0 = r.month - (r.month % 12);
  const end = Math.round(patrimonio(s));
  if (s.yearOpen?.month === y0 && Number.isFinite(s.yearOpen.patrimonio)) return { start: s.yearOpen.patrimonio, end, startLabel: `1 de ${longDate(y0)}` };
  const h = s.history.find((x) => x.month === y0 - 1) ?? s.history.find((x) => x.month >= y0);
  return { start: h?.patrimonio ?? end, end, startLabel: h ? `cierre de ${longDate(h.month)}` : 'ahora' };
}

// Un resultado que promete bajar un radar más de lo que marcaba: se dice lo que ha bajado de verdad.
// El «radar −N» a secas cuenta como el de Inspección si la frase nombra a la Inspección y no a Hacienda.
const RADARS = [['heatTrabajo', /([Rr]adar (?:de (?:la )?)?(?:Inspección|Trabajo)) −(\d+)/g], ['heatHacienda', /([Rr]adar (?:de )?Hacienda) −(\d+)/g],
  ['heatTrabajo', /\b([Rr]adar) −(\d+)/g, (t) => /Inspección/.test(t) && !/Hacienda/.test(t)]];
export function honestRadarText(text, before, after) {
  if (typeof text !== 'string') return text;
  let out = text;
  for (const [k, re, when] of RADARS) {
    const b = before?.[k], a = after?.[k];
    if (!Number.isFinite(b) || !Number.isFinite(a) || (when && !when(text))) continue;
    out = out.replace(re, (m, label, n) => (a <= 0.5 && b < Number(n) ? `${label} −${Math.round(b - a)} (estaba en ${Math.round(b)} y no baja de 0)` : m));
  }
  return out;
}

export function monthDigest(prev, r, s, head, mods = s?.mods) {
  const drivers = netDrivers(prev, r, s);
  const rmods = revenueMods(mods, r?.month);
  // Un modificador de ingresos explica el sector que empuja en su mismo sentido si no había otro motivo.
  for (const x of drivers) {
    if (x.kind !== 'ingresos' || x.reason) continue;
    const m = rmods.find((m) => (!m.cats || m.cats.includes(x.key)) && (m.factor < 1) === (x.delta < 0));
    if (m) x.reason = m.text;
  }
  return { drivers, rest: restDriver(prev, r, drivers), revenueMods: rmods, fresh: freshEntries(s, head), upcoming: upcoming(s), prevNet: prev?.net ?? null };
}

export const fmtDelta = (v) => `${v >= 0 ? '+' : '−'}${moneyShort(Math.abs(v))}`;
