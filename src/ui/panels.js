// Paneles laterales. Cada render devuelve HTML; las acciones van por atributos data-act.
import { esc } from './dom.js';
import { imageUrl } from '../render/assets.js';
import { CITY_BY_ID, CITIES, HQ_CITY } from '../data/cities.js';
import { BUSINESS_TYPES, PERKS } from '../data/businesses.js';
import { POLICIES } from '../data/policies.js';
import { MANOLO_ACTIONS } from '../data/manoloActions.js';
import { computeEconomy, estimateOpening, obradorCapacity, patrimonio, creditLimit, averageWage } from '../core/economy.js';
import { canOpen, openingCost, sobaoTypeId, nextUpgrade, saleValue, canRebrand, LOAN_STEP } from '../core/actions.js';
import { money, moneyShort, dateLabel } from '../core/helpers.js';
import { haciendaDebt } from '../core/inspections.js';
import { difficultyOf } from '../core/state.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { isUnlocked, unlockedCount } from './achievements.js';

export const TABS = [
  { id: 'ciudad', label: 'Ciudad', emoji: '📍' },
  { id: 'imperio', label: 'Imperio', emoji: '🏰' },
  { id: 'plantilla', label: 'Plantilla', emoji: '👷' },
  { id: 'finanzas', label: 'Finanzas', emoji: '💶' },
  { id: 'manolo', label: 'Manolo', emoji: '😎' },
  { id: 'noticias', label: 'Noticias', emoji: '📰' },
];

const LOCK_HINTS = {
  vivienda: 'Se desbloquea con 3 tiendas de sobaos.',
  airbnb: 'Se desbloquea en el mes 12 o con 250.000 € en caja.',
  smash: 'Se desbloquea con 4 tiendas de sobaos o en el mes 18.',
  empanadas: 'Se desbloquea con 4 tiendas de sobaos o en el mes 18.',
  academy: 'Se desbloquea con fama 25.',
};

const level = (v, labels = ['Muy bajo', 'Bajo', 'Medio', 'Alto', 'Muy alto']) => {
  const i = v < 0.45 ? 0 : v < 0.8 ? 1 : v < 1.1 ? 2 : v < 1.4 ? 3 : 4;
  return labels[i];
};

const signed = (n) => `${n >= 0 ? '+' : '−'}${money(Math.abs(n))}`;
const cls = (n) => (n >= 0 ? 'pos' : 'neg');

function bar(value, max = 100, tone = '') {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return `<div class="bar ${tone}"><span style="width:${pct.toFixed(1)}%"></span></div>`;
}

function lineFor(s, id) {
  return s.lastReport?.lines.find((l) => l.id === id) || null;
}

// ------------------------------------------------------------------ Ciudad
export function renderCity(s, cityId) {
  const c = CITY_BY_ID[cityId] || CITY_BY_ID[HQ_CITY];
  const here = s.businesses.filter((b) => b.city === c.id);
  let html = `
    <div class="card city-head">
      <div class="row between"><h3>${esc(c.name)}</h3><span class="muted">${esc(c.region)}</span></div>
      <p class="blurb">${esc(c.blurb)}</p>
      ${c.hq ? '' : `<div class="chips">
        <span class="chip">👥 Población: <b>${level(c.pop * 1.2)}</b></span>
        <span class="chip">💰 Poder adquisitivo: <b>${level(c.wealth)}</b></span>
        <span class="chip">📸 Turismo: <b>${level(c.tourism * 1.4)}</b></span>
        <span class="chip">🏷️ Alquileres: <b>${level(c.rent)}</b></span>
      </div>`}
    </div>`;

  if (c.hq) html += renderObrador(s);

  if (here.length) {
    html += `<div class="card"><h4>Tus negocios aquí</h4><ul class="biz-list">`;
    for (const b of here) {
      const t = BUSINESS_TYPES[b.type];
      const l = lineFor(s, b.id);
      const profit = l ? l.revenue - l.cost : null;
      html += `<li class="biz">
        <img src="${imageUrl(t.sprite)}" alt="" class="biz-icon">
        <div class="grow">
          <div><b>${esc(t.name)}</b>${b.mode === 'franquicia' ? ' <span class="tag">Franquicia</span>' : ''}</div>
          <div class="muted small">${profit == null ? 'Recién abierto' : `Último mes: <span class="${cls(profit)}">${signed(profit)}</span>`}
          ${l?.franchise ? ` · Franquiciado: <span class="${cls(l.franchiseeProfit)}">${signed(l.franchiseeProfit)}</span>${b.lossMonths ? ` (${b.lossMonths} meses en pérdidas)` : ''}` : ''}
          ${l?.occupied != null ? ` · ${l.occupied}/${t.beds} plazas ocupadas` : ''}</div>
        </div>
        <button class="btn small ghost" data-act="sell" data-id="${b.id}">${b.mode === 'franquicia' ? 'Rescindir' : `Vender ${moneyShort(saleValue(b))}`}</button>
      </li>`;
    }
    html += `</ul></div>`;
  }

  html += `<div class="card"><h4>Abrir en ${esc(c.name)}</h4><div class="open-list">`;
  const types = [sobaoTypeId(s), 'vivienda', 'airbnb', 'smash', 'empanadas', 'academy'];
  for (const id of types) {
    const t = BUSINESS_TYPES[id];
    if (c.hq && !['sobaos', 'inmobiliario'].includes(t.category)) continue;
    if (c.hq && id === 'airbnb') continue;
    const locked = t.category !== 'sobaos' && !s.unlocked[id];
    const own = canOpen(s, id, c.id, 'propia');
    const est = !locked ? estimateOpening(s, id, c.id, 'propia') : null;
    html += `<div class="open-item ${locked ? 'locked' : ''}">
      <img src="${imageUrl(t.sprite)}" alt="" class="biz-icon">
      <div class="grow">
        <div><b>${esc(t.name)}</b></div>
        <div class="small muted">${esc(t.desc)}</div>
        ${locked ? `<div class="small lock">🔒 ${esc(LOCK_HINTS[id])}</div>` : `<div class="small">Estimación: <b class="${cls(est.delta)}">${signed(est.delta)}/mes</b> antes de impuestos${est.fillAfter < 0.999 ? ` · <span class="warn">el obrador solo cubrirá el ${Math.round(est.fillAfter * 100)} % de la demanda</span>` : ''}</div>`}
        ${!locked ? `<div class="row gap wrap">
          <button class="btn small primary" data-act="open" data-type="${id}" data-mode="propia" ${own.ok ? '' : 'disabled'} title="${esc(own.msg || '')}">Abrir (${moneyShort(openingCost(s, id))})</button>
          ${t.category === 'sobaos' ? renderFranchiseButton(s, id, c.id) : ''}
        </div>${!own.ok && own.msg ? `<div class="small muted">${esc(own.msg)}</div>` : ''}` : ''}
      </div>
    </div>`;
  }
  html += `</div></div>`;
  return html;
}

function renderFranchiseButton(s, id, cityId) {
  const t = BUSINESS_TYPES[id];
  const f = canOpen(s, id, cityId, 'franquicia');
  const est = estimateOpening(s, id, cityId, 'franquicia');
  return `<button class="btn small" data-act="open" data-type="${id}" data-mode="franquicia" ${f.ok ? '' : 'disabled'}
    title="Un incauto paga el canon y monta la tienda. Tú cobras ${moneyShort(est.delta)}/mes aprox.">Vender franquicia (+${moneyShort(t.franchiseFee)})</button>`;
}

function renderObrador(s) {
  const cap = obradorCapacity(s);
  const r = s.lastReport || computeEconomy(s);
  const fill = r.fill;
  const up = nextUpgrade(s);
  const ing = POLICIES.ingredientes;
  return `<div class="card obrador">
    <div class="row gap"><img src="${imageUrl(s.obrador.upgrades.includes('nave') ? 'bld_obrador_3' : s.obrador.upgrades.length ? 'bld_obrador_2' : 'bld_obrador_1')}" class="biz-icon big" alt="">
      <div class="grow"><h4>Obrador Boomerez</h4>
      <div class="small">Capacidad: <b>${Math.round(cap).toLocaleString('es-ES')}</b> uds/mes · Demanda: <b>${Math.round(r.totalDemand).toLocaleString('es-ES')}</b></div>
      ${bar(Math.min(r.totalDemand, cap), cap, fill < 0.999 ? 'danger' : 'ok')}
      <div class="small ${fill < 0.999 ? 'warn' : 'muted'}">${fill < 0.999 ? `⚠️ No das abasto: solo sirves el ${Math.round(fill * 100)} % de la demanda.` : 'Hay capacidad libre.'}</div></div>
    </div>
    ${up ? `<div class="upgrade"><div><b>${esc(up.name)}</b> · +${up.capacity.toLocaleString('es-ES')} uds/mes</div><div class="small muted">${esc(up.desc)}</div>
      <button class="btn small primary" data-act="upgrade" ${s.cash >= up.cost ? '' : 'disabled'}>Comprar (${moneyShort(up.cost)})</button></div>` : '<div class="small muted">El obrador está a tope de mejoras.</div>'}
    ${policyGroup(s, 'ingredientes', ing)}
    ${renderRebrand(s)}
    ${s.contracts.length ? `<div class="small">Contratos: ${s.contracts.map((c) => `${esc(c.label)} (${c.units.toLocaleString('es-ES')} uds/mes, ${c.months} meses)`).join(', ')}</div>` : ''}
  </div>`;
}

function renderRebrand(s) {
  if (!s.brand) return '';
  const r = canRebrand(s);
  const to = BUSINESS_TYPES[r.to];
  return `<div class="upgrade"><div><b>Marca actual:</b> ${esc(BUSINESS_TYPES[s.brand].name)}</div>
    <div class="small muted">¿Cambiar a ${esc(to.name)}? Se reconvierten todas las tiendas de sobaos${r.to === 'express' ? ' (reputación −6)' : ' (fama +5; cuida la calidad)'}.</div>
    <button class="btn small" data-act="rebrand" ${r.ok ? '' : 'disabled'} title="${esc(r.msg || '')}">Rebranding${r.cost ? ` (${moneyShort(r.cost)})` : ''}</button>
    ${!r.ok ? `<div class="small muted">${esc(r.msg)}</div>` : ''}</div>`;
}

function policyGroup(s, key, def, locked = false) {
  return `<fieldset class="policy"><legend>${esc(def.label)}</legend>
    ${Object.entries(def.options)
      .map(([id, o]) => `<label class="opt ${s.policies[key] === id ? 'on' : ''}">
        <input type="radio" name="pol-${key}" data-act="policy" data-key="${key}" value="${id}" ${s.policies[key] === id ? 'checked' : ''} ${locked && id !== Object.keys(def.options)[0] ? 'disabled' : ''}>
        <span><b>${esc(o.label)}</b><small>${esc(o.desc)}</small></span></label>`)
      .join('')}
  </fieldset>`;
}

// ------------------------------------------------------------------ Imperio
export function renderEmpire(s) {
  const r = s.lastReport;
  const pat = patrimonio(s);
  let html = `<div class="card kpis">
    <div><span class="muted small">Patrimonio</span><b>${moneyShort(pat)}</b></div>
    <div><span class="muted small">Negocios</span><b>${s.businesses.length + 1}</b></div>
    <div><span class="muted small">Plantilla</span><b>${r ? r.employees : '—'}</b></div>
    <div><span class="muted small">Beneficio último mes</span><b class="${r ? cls(r.net) : ''}">${r ? moneyShort(r.net) : '—'}</b></div>
  </div>`;
  if (!r) return html + '<div class="card muted">Cierra el primer mes para ver las cuentas del imperio.</div>';
  const groups = {};
  for (const l of r.lines) (groups[l.city] ||= []).push(l);
  const cities = Object.keys(groups).sort((a, b) => groups[b].reduce((x, l) => x + l.revenue - l.cost, 0) - groups[a].reduce((x, l) => x + l.revenue - l.cost, 0));
  html += `<div class="card"><h4>Resultado por negocio (${dateLabel(r.month)})</h4><table class="tbl"><thead><tr><th>Negocio</th><th>Ingresos</th><th>Resultado</th></tr></thead><tbody>`;
  for (const cid of cities) {
    html += `<tr class="grp"><td colspan="3"><a href="#" data-act="goto-city" data-city="${cid}">📍 ${esc(CITY_BY_ID[cid].name)}</a></td></tr>`;
    for (const l of groups[cid]) {
      const p = l.revenue - l.cost;
      html += `<tr><td>${esc(l.label)}${l.franchise ? ' <span class="tag">F</span>' : ''}</td><td>${moneyShort(l.revenue)}</td><td class="${cls(p)}">${moneyShort(p)}</td></tr>`;
    }
  }
  html += `</tbody></table><p class="small muted">Sin incluir costes generales (asesores, intereses, extras) ni impuestos.</p></div>`;
  return html;
}

// ---------------------------------------------------------------- Plantilla
export function renderStaff(s) {
  const r = s.lastReport || computeEconomy(s);
  const locked = s.flags.forcedLegal > 0;
  const hasHousing = s.businesses.some((b) => b.type === 'vivienda');
  return `<div class="card kpis">
      <div><span class="muted small">Empleados</span><b>${r.employees}</b></div>
      <div><span class="muted small">Coste medio</span><b>${money(averageWage(s))}</b></div>
      <div><span class="muted small">Moral</span><b>${Math.round(s.moral)}</b></div>
      <div><span class="muted small">Control</span><b>${Math.round(r.control * 100)} %</b></div>
    </div>
    ${locked ? `<div class="card warn">⚖️ Tras la inspección, durante ${s.flags.forcedLegal} meses más solo puedes aplicar condiciones legales.</div>` : ''}
    <div class="card">
      <p class="small muted">Las condiciones "emprendedoras" abaratan costes, pero bajan la moral y encienden el radar de la Inspección de Trabajo. Las plantillas grandes llaman más la atención.</p>
      ${policyGroup(s, 'salario', POLICIES.salario, locked)}
      ${policyGroup(s, 'horas', POLICIES.horas, locked)}
      ${policyGroup(s, 'becarios', POLICIES.becarios, locked)}
      ${hasHousing ? policyGroup(s, 'alquiler', POLICIES.alquiler) : `<p class="small muted">🔑 Cuando tengas un Residencial Boomerez podrás alojar a la plantilla (${r.housed}/${r.beds} plazas) y fijar su alquiler.</p>`}
      ${hasHousing ? `<p class="small">Alojados: <b>${r.housed}/${r.beds}</b>. Con más control hay menos denuncias y menos huelgas.</p>` : ''}
    </div>`;
}

// ---------------------------------------------------------------- Finanzas
export function renderFinance(s) {
  const r = s.lastReport;
  const limit = creditLimit(s);
  let html = `<div class="card kpis">
    <div><span class="muted small">Caja</span><b class="${cls(s.cash)}">${moneyShort(s.cash)}</b></div>
    <div><span class="muted small">Deuda</span><b>${moneyShort(s.debt)}</b></div>
    <div><span class="muted small">Límite de crédito</span><b>${moneyShort(limit)}</b></div>
    <div><span class="muted small">Cuota "optimizada"</span><b class="${s.evaded > 0 ? 'neg' : ''}">${moneyShort(haciendaDebt(s))}</b></div>
  </div>
  <div class="card"><h4>Caja Cantábrica · Póliza de crédito</h4>
    <p class="small muted">Interés del ${(difficultyOf(s).interest * 100).toFixed(2).replace('.', ',')} % mensual. Si te quedas en descubierto, el banco tira de la póliza automáticamente. Si no queda margen durante 3 meses: concurso de acreedores.</p>
    ${bar(s.debt, limit, s.debt / limit > 0.8 ? 'danger' : '')}
    <div class="row gap wrap">
      <button class="btn small" data-act="borrow" ${s.debt + 1 > limit ? 'disabled' : ''}>Pedir ${moneyShort(LOAN_STEP)}</button>
      <button class="btn small" data-act="borrow" data-amount="100000" ${s.debt + 1 > limit ? 'disabled' : ''}>Pedir 100 k€</button>
      <button class="btn small ghost" data-act="repay" ${s.debt <= 0 || s.cash <= 0 ? 'disabled' : ''}>Devolver ${moneyShort(LOAN_STEP)}</button>
      <button class="btn small ghost" data-act="repay" data-amount="all" ${s.debt <= 0 || s.cash <= 0 ? 'disabled' : ''}>Devolver todo</button>
    </div>
  </div>`;
  if (r) {
    const c = r.costs;
    html += `<div class="card"><h4>Cuenta de resultados · ${dateLabel(r.month)}</h4><table class="tbl pl">
      <tr><td>Ingresos</td><td class="pos">${money(r.revenue)}</td></tr>
      <tr><td>&nbsp;· Sobaos</td><td>${money(r.revenueByCat.sobaos)}</td></tr>
      ${r.revenueByCat.inmobiliario ? `<tr><td>&nbsp;· Inmobiliario</td><td>${money(r.revenueByCat.inmobiliario)}</td></tr>` : ''}
      ${r.revenueByCat.hosteleria ? `<tr><td>&nbsp;· Hostelería</td><td>${money(r.revenueByCat.hosteleria)}</td></tr>` : ''}
      ${r.revenueByCat.formacion ? `<tr><td>&nbsp;· Formación</td><td>${money(r.revenueByCat.formacion)}</td></tr>` : ''}
      <tr><td>Salarios</td><td class="neg">−${money(c.salarios)}</td></tr>
      <tr><td>Materias primas</td><td class="neg">−${money(c.materias)}</td></tr>
      <tr><td>Alquileres</td><td class="neg">−${money(c.alquileres)}</td></tr>
      <tr><td>Otros gastos</td><td class="neg">−${money(c.otros)}</td></tr>
      ${c.asesores ? `<tr><td>Asesores</td><td class="neg">−${money(c.asesores)}</td></tr>` : ''}
      ${c.intereses ? `<tr><td>Intereses</td><td class="neg">−${money(c.intereses)}</td></tr>` : ''}
      <tr><td>Impuesto de Sociedades</td><td class="neg">−${money(r.tax)}</td></tr>
      <tr class="total"><td>Resultado neto</td><td class="${cls(r.net)}">${signed(r.net)}</td></tr>
    </table>${r.evaded > 0 ? `<p class="small warn">Este mes has "optimizado" ${money(r.evaded)} de impuestos.</p>` : ''}</div>`;
  }
  if (s.extraMonthly.length) {
    html += `<div class="card"><h4>Gastos fijos extra</h4><ul class="perk-list">
      ${s.extraMonthly.map((x, i) => `<li class="perk"><div class="grow"><b>${esc(x.label)}</b> <span class="muted small">${money(x.amount)}/mes${x.months != null ? ` · ${x.months} meses más` : ''}</span></div>
        <button class="btn small ghost" data-act="drop-cost" data-index="${i}">Quitar</button></li>`).join('')}
    </ul></div>`;
  }
  html += `<div class="card">${policyGroup(s, 'contabilidad', POLICIES.contabilidad)}</div>
  <div class="card"><h4>Asesores</h4><ul class="perk-list">
    ${Object.entries(PERKS).map(([id, p]) => `<li class="perk ${s.perks[id] ? 'on' : ''}">
      <div class="grow"><b>${esc(p.name)}</b> <span class="muted small">${money(p.monthly)}/mes${p.setup && !s.andorraPaid ? ` + ${money(p.setup)} de alta` : ''}</span><div class="small muted">${esc(p.desc)}</div></div>
      <button class="btn small ${s.perks[id] ? 'ghost' : 'primary'}" data-act="perk" data-id="${id}">${s.perks[id] ? 'Despedir' : 'Contratar'}</button>
    </li>`).join('')}
  </ul></div>
  <div class="card"><h4>Evolución del patrimonio</h4><canvas id="chart" height="140"></canvas></div>`;
  return html;
}

export function drawChart(canvas, s) {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 300;
  const h = 140;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const data = s.history.map((x) => x.patrimonio);
  ctx.clearRect(0, 0, w, h);
  if (data.length < 2) {
    ctx.fillStyle = '#8a7d6b';
    ctx.font = '13px system-ui';
    ctx.fillText('Aún no hay datos suficientes.', 10, 70);
    return;
  }
  const min = Math.min(0, ...data);
  const max = Math.max(...data);
  const y = (v) => h - 18 - ((v - min) / (max - min || 1)) * (h - 30);
  const x = (i) => 6 + (i / (data.length - 1)) * (w - 12);
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.moveTo(0, y(0));
  ctx.lineTo(w, y(0));
  ctx.stroke();
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(232,163,58,0.45)');
  g.addColorStop(1, 'rgba(232,163,58,0)');
  ctx.beginPath();
  data.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
  ctx.lineTo(x(data.length - 1), h);
  ctx.lineTo(x(0), h);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  data.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
  ctx.strokeStyle = '#c47a12';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#5b4a36';
  ctx.font = '11px system-ui';
  ctx.fillText(moneyShort(max), 8, 12);
  ctx.fillText(moneyShort(data[data.length - 1]), w - 70, y(data[data.length - 1]) - 6);
}

// ------------------------------------------------------------------ Manolo
export function renderManolo(s) {
  const mood = manoloMood(s);
  return `<div class="card manolo-card">
      <img src="${imageUrl(`portrait_manolo_${mood}`)}" alt="Manolo" class="portrait-lg">
      <div class="grow">
        <h3>Manolo Boomerez</h3>
        <div class="small muted">55 años · Joven emprendedor · CEO & Founder (heredado)</div>
        <div class="chips">
          <span class="chip">📣 Fama: <b>${Math.round(s.fama)}</b></span>
          <span class="chip">⚖️ Expedientes: <b>${s.expedientes}/3</b></span>
        </div>
        <blockquote>"${esc(s.quote || 'Yo a vuestra edad ya tenía un Audi.')}"</blockquote>
      </div>
    </div>
    <div class="card"><h4>Acción del mes ${s.actionUsed ? '<span class="tag">Hecha</span>' : ''}</h4>
      <p class="small muted">Manolo puede hacer una cosa al mes. Las demás las hace la plantilla.</p>
      <div class="actions">
        ${MANOLO_ACTIONS.map((a) => `<button class="action" data-act="manolo" data-id="${a.id}" ${s.actionUsed || (a.cost && s.cash < a.cost) ? 'disabled' : ''}>
          <span class="emoji">${a.emoji}</span><span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span></button>`).join('')}
      </div>
    </div>
    <div class="card"><h4>Logros (${unlockedCount()}/${ACHIEVEMENTS.length})</h4>
      <p class="small muted">Se guardan en este navegador entre partidas.</p>
      <div class="achievements">
        ${ACHIEVEMENTS.map((a) => `<div class="ach ${isUnlocked(a.id) ? 'on' : ''}" title="${esc(a.desc)}"><span class="emoji">${isUnlocked(a.id) ? a.emoji : '🔒'}</span><span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span></div>`).join('')}
      </div>
    </div>`;
}

export function manoloMood(s) {
  if (s.heatHacienda > 70 || s.heatTrabajo > 70 || s.insolvencyMonths > 0) return 'scared';
  if (s.moral < 25 || s.rep < 25) return 'angry';
  if (s.lastReport && s.lastReport.net > 20000) return 'happy';
  if (s.lastReport && s.lastReport.net > 0) return 'smug';
  if (s.cash < 20000) return 'thinking';
  return 'neutral';
}

// ---------------------------------------------------------------- Noticias
export function renderNews(s) {
  if (!s.log.length) return '<div class="card muted">Todavía no ha pasado nada digno de titular.</div>';
  return `<div class="card"><h4>El Sobao Digital · Hemeroteca</h4><ul class="news">
    ${s.log.map((n) => `<li class="${n.tone}"><span class="muted small">${dateLabel(n.month)}</span> ${esc(n.text)}</li>`).join('')}
  </ul></div>`;
}

export function cityOptions() {
  return CITIES;
}
