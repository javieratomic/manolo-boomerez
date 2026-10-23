// Paneles laterales. Cada render devuelve HTML; las acciones van por atributos data-act.
import { esc } from './dom.js';
import { imageUrl, hasArt } from '../render/assets.js';

// Usa el arte si ya está entregado; si no, el emoji.
const artOr = (id, emoji, cls = 'emoji') => (hasArt(id) ? `<img src="${imageUrl(id)}" alt="" class="art-icon">` : `<span class="${cls}">${emoji}</span>`);
import { CITY_BY_ID, CITIES, HQ_CITY } from '../data/cities.js';
import { BUSINESS_TYPES, PERKS } from '../data/businesses.js';
import { POLICIES } from '../data/policies.js';
import { MANOLO_ACTIONS } from '../data/manoloActions.js';
import { computeEconomy, estimateOpening, obradorCapacity, patrimonio, creditLimit, averageWage } from '../core/economy.js';
import { canOpen, openingCost, sobaoTypeId, nextUpgrade, saleValue, canRebrand, franchiseFee, needsLicense, LOAN_STEP } from '../core/actions.js';
import { nearestSite, transportCost } from '../core/logistics.js';
import { RIVALS, RIVAL_MAX_LEVEL } from '../data/rivals.js';
import { CAMPAIGNS, PRODUCTS, MAX_LEVEL } from '../data/market.js';
import { POSITIONS, TRAITS } from '../data/execs.js';
import { RIVAL_ACTIONS, canActOnRival, acquisitionPrice, rivalTotal } from '../core/rivals.js';
import { canLaunchCampaign, campaignRunning, canStartRD, upgradeCost, PRODUCT_BY_ID } from '../core/market.js';
import { execOf, signingFee, severance, CANDIDATE_REFRESH } from '../core/execs.js';
import { LUJOS } from '../data/lujo.js';
import { ownsLujo, canIPO, companyValuation, ipoPremium, annualProfit, IPO_FLOAT } from '../core/life.js';
import { grossPatrimonio } from '../core/economy.js';
import { money, moneyShort, dateLabel } from '../core/helpers.js';
import { haciendaDebt } from '../core/inspections.js';
import { difficultyOf } from '../core/state.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { PHASES } from '../data/macro.js';
import { macroFx } from '../core/macro.js';
import { isUnlocked, unlockedCount } from './achievements.js';

export const TABS = [
  { id: 'ciudad', label: 'Ciudad', emoji: '📍' },
  { id: 'imperio', label: 'Imperio', emoji: '🏰' },
  { id: 'mercado', label: 'Mercado', emoji: '📊' },
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
  obrador_regional: 'Se desbloquea con 6 tiendas de sobaos o en el mes 24.',
  taberna: 'Se desbloquea con 2 tiendas de sobaos o en el mes 6.',
  gimnasio: 'Se desbloquea en el mes 12 o con 5 tiendas de sobaos.',
  coworking: 'Se desbloquea con fama 35 o con la Academy abierta.',
  residencia: 'Se desbloquea en el mes 24 o con 2 millones de patrimonio.',
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
        ${transportChip(s, c.id)}
        ${c.touristLicense ? '<span class="chip" title="Para abrir pisos turísticos hace falta comprar una licencia (o arriesgarse sin ella).">🧳 Licencias turísticas restringidas</span>' : ''}
      </div>`}
      ${rivalChips(s, c.id)}
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
          <div><b>${esc(t.name)}</b>${b.mode === 'franquicia' ? ' <span class="tag">Franquicia</span>' : ` <span class="stars" title="Nivel de reforma">${'★'.repeat(b.level || 1)}${'☆'.repeat(MAX_LEVEL - (b.level || 1))}</span>`}</div>
          <div class="muted small">${profit == null ? 'Recién abierto' : `Último mes: <span class="${cls(profit)}">${signed(profit)}</span>`}
          ${l?.franchise ? ` · Franquiciado: <span class="${cls(l.franchiseeProfit)}">${signed(l.franchiseeProfit)}</span>${b.lossMonths ? ` (${b.lossMonths} meses en pérdidas)` : ''}` : ''}
          ${l?.occupied != null ? ` · ${l.occupied}/${t.beds + 5 * ((b.level || 1) - 1)} plazas ocupadas` : ''}</div>
        </div>
        <div class="biz-actions">
          ${upgradeCost(b) != null ? `<button class="btn small" data-act="upgrade-biz" data-id="${b.id}" ${s.cash >= upgradeCost(b) ? '' : 'disabled'} title="Reforma: +15 % de clientela${b.type === 'vivienda' ? ' y 5 plazas más' : b.type === 'airbnb' ? ' y 2 pisos más' : ''}">Reformar ${moneyShort(upgradeCost(b))}</button>` : ''}
          <button class="btn small ghost" data-act="sell" data-id="${b.id}">${b.mode === 'franquicia' ? 'Rescindir' : `Vender ${moneyShort(saleValue(b))}`}</button>
        </div>
      </li>`;
    }
    html += `</ul></div>`;
  }

  if (here.some((b) => b.mode !== 'franquicia') || c.hq) html += renderLocalMarketing(s, c);

  html += `<div class="card"><h4>Abrir en ${esc(c.name)}</h4><div class="open-list">`;
  const types = [sobaoTypeId(s), 'vivienda', 'airbnb', 'taberna', 'smash', 'empanadas', 'gimnasio', 'coworking', 'residencia', 'academy', 'obrador_regional'];
  for (const id of types) {
    const t = BUSINESS_TYPES[id];
    if (c.hq && t.category !== 'sobaos' && !['vivienda', 'taberna', 'residencia'].includes(id)) continue;
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
          <button class="btn small primary" data-act="open" data-type="${id}" data-mode="propia" ${own.ok ? '' : 'disabled'} title="${esc(own.msg || '')}">${needsLicense(id, c.id) ? 'Abrir con licencia' : 'Abrir'} (${moneyShort(openingCost(s, id, 'propia', c.id))})</button>
          ${needsLicense(id, c.id) ? `<button class="btn small ghost" data-act="open" data-type="${id}" data-mode="ilegal" ${canOpen(s, id, c.id, 'ilegal').ok ? '' : 'disabled'} title="Sin licencia: más barato, pero el ayuntamiento puede multarte y Hacienda se fija.">Sin licencia (${moneyShort(openingCost(s, id, 'ilegal', c.id))})</button>` : ''}
          ${t.category === 'sobaos' ? renderFranchiseButton(s, id, c.id) : ''}
        </div>${!own.ok && own.msg ? `<div class="small muted">${esc(own.msg)}</div>` : ''}` : ''}
      </div>
    </div>`;
  }
  html += `</div></div>`;
  return html;
}

function transportChip(s, cityId) {
  const n = nearestSite(s, cityId);
  if (!n || n.km === 0) return '<span class="chip">🚚 Obrador en la ciudad</span>';
  const cost = transportCost(s, cityId);
  return `<span class="chip" title="Cada sobao viaja desde el obrador más cercano (${esc(CITY_BY_ID[n.city].name)}). Un obrador regional cerca lo abarata.">🚚 ${Math.round(n.km)} km · +${cost.toFixed(2).replace('.', ',')} €/sobao</span>`;
}

function rivalChips(s, cityId) {
  const here = (s.rivals || []).filter((r) => r.presence[cityId]);
  if (!here.length) return '';
  return `<div class="chips rivals">${here
    .map((r) => {
      const d = RIVALS[r.id];
      const lvl = r.presence[cityId];
      return `<span class="chip rival" style="--rc:${d.color}" title="${esc(d.name)}: quita clientela a ${esc(d.targets.map((t) => BUSINESS_TYPES[t]?.short || t).join(', '))}">${d.emoji} ${esc(d.short)} ${'●'.repeat(lvl)}${'○'.repeat(RIVAL_MAX_LEVEL - lvl)}</span>`;
    })
    .join('')}</div>`;
}

function renderLocalMarketing(s, c) {
  return `<div class="card"><h4>Marketing en ${esc(c.name)}</h4><div class="campaigns">
    ${CAMPAIGNS.filter((x) => x.scope === 'city').map((x) => campaignRow(s, x, c.id)).join('')}
  </div></div>`;
}

function campaignRow(s, x, city = null) {
  const running = campaignRunning(s, x.id, city);
  const ok = canLaunchCampaign(s, x.id, city);
  return `<div class="campaign ${running ? 'on' : ''}">
    <div class="grow"><b>${esc(x.name)}</b> <span class="muted small">${moneyShort(x.cost)} · ${x.months} meses · demanda +${Math.round((x.factor - 1) * 100)} %</span>
      <div class="small muted">${esc(x.desc)}</div></div>
    ${running ? `<span class="tag">En marcha: ${running.months} m</span>` : `<button class="btn small" data-act="campaign" data-id="${x.id}" ${city ? `data-city="${city}"` : ''} ${ok.ok ? '' : 'disabled'} title="${esc(ok.msg || '')}">Lanzar</button>`}
  </div>`;
}

function renderFranchiseButton(s, id, cityId) {
  const t = BUSINESS_TYPES[id];
  const f = canOpen(s, id, cityId, 'franquicia');
  const est = estimateOpening(s, id, cityId, 'franquicia');
  return `<button class="btn small" data-act="open" data-type="${id}" data-mode="franquicia" ${f.ok ? '' : 'disabled'}
    title="Un incauto paga el canon y monta la tienda. Tú cobras ${moneyShort(est.delta)}/mes aprox.">Vender franquicia (+${moneyShort(franchiseFee(s, id))})</button>`;
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
  html += `<div class="card"><h4>Ingresos por sector</h4>
    <canvas id="chart-cat" height="170"></canvas>
    <div class="legend">${Object.entries(CAT_COLORS).map(([k, c]) => `<span><i style="background:${c}"></i>${CAT_LABELS[k]}</span>`).join('')}<span><i class="line"></i>Beneficio neto</span></div>
  </div>`;
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

// ------------------------------------------------------------------ Mercado
const pct = (f) => `${f >= 1 ? '+' : '−'}${Math.round(Math.abs(f - 1) * 100)} %`;

export function renderMarket(s) {
  const p = macroFx(s);
  const order = ['recuperacion', 'expansion', 'burbuja', 'crisis'];
  return `<div class="card macro macro-${s.macro.phase}">
      <div class="kicker">Ciclo económico</div>
      <h3>${p.emoji} ${esc(p.label)}</h3>
      <p class="small">${esc(p.desc)}</p>
      <div class="cycle">${order.map((id) => `<span class="${id === s.macro.phase ? 'on' : ''}">${PHASES[id].emoji} ${esc(PHASES[id].label)}</span>`).join('<span class="arrow">→</span>')}</div>
      <div class="chips">
        <span class="chip">🛒 Demanda: <b>${pct(p.demand)}</b></span>
        <span class="chip">🧳 Turismo: <b>${pct(p.tourism)}</b></span>
        <span class="chip">🧱 Ladrillo: <b>${p.property >= 0 ? '+' : '−'}${Math.abs(p.property * 100).toFixed(1).replace('.', ',')} %/mes</b></span>
        <span class="chip">🏦 Crédito: <b>${pct(p.credit)}</b></span>
      </div>
      <p class="small muted">Lleva ${s.macro.months} ${s.macro.months === 1 ? 'mes' : 'meses'} en esta fase. Nadie sabe cuánto durará (bueno, los economistas dicen que sí, pero cada uno una cosa).</p>
    </div>
    ${renderRivals(s)}
    <div class="card"><h4>Campañas nacionales</h4><div class="campaigns">
      ${CAMPAIGNS.filter((x) => x.scope === 'national').map((x) => campaignRow(s, x)).join('')}
    </div>${execOf(s, 'marketing') ? '<p class="small muted">Tu responsable de Marketing hace que las campañas rindan más.</p>' : ''}</div>
    ${renderRD(s)}`;
}

function renderRivals(s) {
  if (!s.rivals?.length) {
    return '<div class="card"><h4>Competencia</h4><p class="small muted">De momento nadie te hace sombra. En cuanto huelan dinero, aparecerán.</p></div>';
  }
  return `<div class="card"><h4>Competencia</h4>
    <p class="small muted">Cada punto de presencia rival en una ciudad le quita un 15 % de clientela a tus negocios del ramo. Y te copian: van a donde ganas dinero.</p>
    ${s.rivals.map((r) => {
      const d = RIVALS[r.id];
      const price = acquisitionPrice(s, r.id);
      const all = Object.entries(r.presence).sort((a, b) => b[1] - a[1]);
      const mine = new Set(s.businesses.filter((b) => d.targets.includes(b.type) && b.mode !== 'franquicia').map((b) => b.city));
      const cities = all.filter(([c]) => mine.has(c));
      const others = all.filter(([c]) => !mine.has(c));
      return `<div class="rival-card" style="--rc:${d.color}">
        <div class="row between"><b>${artOr(`logo_rival_${r.id}`, d.emoji)} ${esc(d.name)}</b><span class="small muted">${rivalTotal(r)} locales${r.calm ? ' · en pausa' : ''}</span></div>
        <div class="small muted">${esc(d.desc)}</div>
        <div class="small">Compite con: ${esc(d.targets.map((t) => BUSINESS_TYPES[t]?.name || t).join(', '))}</div>
        ${cities.length ? `<details class="rival-details"><summary>Plantarles cara (${cities.length} ${cities.length === 1 ? 'ciudad' : 'ciudades'} donde coincidís)</summary>` : ''}
        <table class="tbl rival-cities">${cities.map(([city, lvl]) => `<tr>
          <td>${esc(CITY_BY_ID[city].name)} <span class="dots">${'●'.repeat(lvl)}${'○'.repeat(RIVAL_MAX_LEVEL - lvl)}</span></td>
          <td>${Object.entries(RIVAL_ACTIONS).map(([a, def]) => {
            const ok = canActOnRival(s, r.id, city, a);
            return `<button class="btn tiny" data-act="rival-act" data-rival="${r.id}" data-city="${city}" data-action="${a}" ${ok.ok ? '' : 'disabled'} title="${esc(def.desc + (ok.msg ? ` (${ok.msg})` : ''))}">${esc(def.label)}${def.cost ? ` ${moneyShort(def.cost)}` : ''}</button>`;
          }).join('')}</td></tr>`).join('')}</table>
        ${cities.length ? '</details>' : '<div class="small muted">No coincidís en ninguna ciudad: de momento no te quita clientela.</div>'}
        ${others.length ? `<div class="small muted">También en: ${others.map(([c, l]) => `${esc(CITY_BY_ID[c].name)} ${'●'.repeat(l)}`).join(' · ')}</div>` : ''}
        <button class="btn small primary" data-act="rival-buy" data-rival="${r.id}" ${s.cash >= price ? '' : 'disabled'}>Lanzar una OPA (${moneyShort(price)})</button>
        <span class="small muted">Te quedas con hasta 4 de sus locales. Más barato en crisis.</span>
      </div>`;
    }).join('')}
  </div>`;
}

function renderRD(s) {
  const rd = s.rd;
  return `<div class="card"><h4>I+D: nuevos productos</h4>
    ${rd ? `<div class="rd-now"><b>En desarrollo:</b> ${esc(PRODUCT_BY_ID[rd.id].name)} · faltan ${rd.monthsLeft} meses ${bar(rd.total - rd.monthsLeft, rd.total, 'ok')}</div>`
      : '<p class="small muted">El "laboratorio" (la trastienda del obrador, con una pizarra) está libre.</p>'}
    <div class="products">
      ${PRODUCTS.map((p) => {
        const has = s.products.includes(p.id);
        const ok = canStartRD(s, p.id);
        return `<div class="product ${has ? 'on' : ''}">
          <div class="grow"><b>${has ? '✅ ' : ''}${esc(p.name)}</b> ${has ? '' : `<span class="muted small">${moneyShort(p.cost)} · ${p.months} meses</span>`}
            <div class="small muted">${esc(p.desc)}</div></div>
          ${has ? '' : `<button class="btn small" data-act="rd" data-id="${p.id}" ${ok.ok ? '' : 'disabled'} title="${esc(ok.msg || '')}">Desarrollar</button>`}
        </div>`;
      }).join('')}
    </div></div>`;
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
    </div>
    ${renderExecs(s)}`;
}

function renderExecs(s) {
  const next = CANDIDATE_REFRESH - (s.month - (s.candidatesMonth ?? 0));
  return `<div class="card"><h4>Equipo directivo</h4>
    <p class="small muted">Directivos con nombre y apellidos (y manías). La headhunter cobra un mes de sueldo; despedir cuesta tres. Nuevos currículums en ${Math.min(CANDIDATE_REFRESH, Math.max(1, next))} ${next === 1 ? "mes" : "meses"}.</p>
    ${Object.entries(POSITIONS).map(([pos, p]) => {
      const e = execOf(s, pos);
      const cands = (s.candidates || []).filter((c) => c.pos === pos);
      return `<div class="exec-pos">
        <div class="exec-title">${p.emoji} <b>${esc(p.label)}</b> <span class="small muted">${esc(p.effect)}</span></div>
        ${e ? execRow(e, `<button class="btn small ghost" data-act="fire" data-pos="${pos}">Despedir (${moneyShort(severance(e))})</button>`)
          : cands.length ? cands.map((c) => execRow(c, `<button class="btn small primary" data-act="hire" data-id="${c.id}" ${s.cash >= signingFee(c) ? '' : 'disabled'}>Fichar (${moneyShort(signingFee(c))})</button>`)).join('')
          : '<div class="small muted">Puesto vacante. No hay candidatos ahora mismo.</div>'}
      </div>`;
    }).join('')}
  </div>`;
}

function execRow(e, button) {
  const t = TRAITS[e.trait];
  return `<div class="exec">
    <img src="${imageUrl(e.portrait)}" alt="" class="exec-portrait">
    <div class="grow"><b>${esc(e.name)}</b>${e.note ? ` <span class="small muted">(${esc(e.note)})</span>` : ''}
      <div class="small"><span class="stars">${'★'.repeat(e.skill)}${'☆'.repeat(3 - e.skill)}</span> · ${money(e.salary)}/mes · <span class="tag" title="${esc(t.desc)}">${esc(t.label)}</span></div>
    </div>${button}</div>`;
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
      ${r.revenueByCat.servicios ? `<tr><td>&nbsp;· Servicios</td><td>${money(r.revenueByCat.servicios)}</td></tr>` : ''}
      <tr><td>Salarios</td><td class="neg">−${money(c.salarios)}</td></tr>
      ${c.directivos ? `<tr><td>Directivos</td><td class="neg">−${money(c.directivos)}</td></tr>` : ''}
      ${c.estructura ? `<tr><td title="Oficinas, gestorías y abogados: crece más deprisa que el número de negocios. Operaciones lo reduce.">Estructura central</td><td class="neg">−${money(c.estructura)}</td></tr>` : ''}
      <tr><td>Materias primas</td><td class="neg">−${money(c.materias)}</td></tr>
      ${c.transporte ? `<tr><td>Transporte</td><td class="neg">−${money(c.transporte)}</td></tr>` : ''}
      <tr><td>Alquileres</td><td class="neg">−${money(c.alquileres)}</td></tr>
      <tr><td>Otros gastos</td><td class="neg">−${money(c.otros)}</td></tr>
      ${c.asesores ? `<tr><td>Asesores</td><td class="neg">−${money(c.asesores)}</td></tr>` : ''}
      ${c.personales ? `<tr><td>Gastos personales de Manolo</td><td class="neg">−${money(c.personales)}</td></tr>` : ''}
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
  ${renderIPO(s)}
  <div class="card"><h4>Evolución del patrimonio</h4><canvas id="chart" height="140"></canvas></div>`;
  return html;
}

function renderIPO(s) {
  const equity = grossPatrimonio(s);
  if (s.ipo) {
    const p = s.ipo.price;
    return `<div class="card"><h4>🔔 Boomerez S.A. en Bolsa</h4>
      <div class="kpis"><div><span class="muted small">Cotización</span><b class="${p >= 100 ? 'pos' : 'neg'}">${p.toFixed(1).replace('.', ',')} €</b></div>
      <div><span class="muted small">Máximo</span><b>${s.ipo.peak.toFixed(1).replace('.', ',')} €</b></div></div>
      <p class="small muted">Salió a 100 €. Los accionistas tienen el ${Math.round(s.ipo.float * 100)} % de la empresa, así que tu patrimonio es el ${Math.round((1 - s.ipo.float) * 100)} % del total. Si la acción cae un 30 % desde su máximo, habrá junta de accionistas furiosa.</p>
    </div>`;
  }
  const ok = canIPO(s, equity);
  const val = companyValuation(s, equity);
  return `<div class="card"><h4>🔔 Salir a Bolsa</h4>
    <p class="small">Vendes el ${Math.round(IPO_FLOAT * 100)} % de la empresa a inversores. Valoración estimada hoy: <b>${moneyShort(val)}</b> (prima de mercado ×${ipoPremium(s).toFixed(2).replace('.', ',')}; beneficio de los últimos 12 meses: ${moneyShort(annualProfit(s))}). Recibirías unos <b>${moneyShort(val * IPO_FLOAT * 0.96)}</b> tras comisiones.</p>
    <p class="small muted">Truco de tiburón: en plena burbuja, con mucha fama, los inversores pagan más de lo que vale. Después tendrás que dar explicaciones cada vez que caiga la acción.</p>
    <button class="btn small primary" data-act="ipo" ${ok.ok ? '' : 'disabled'}>Salir a Bolsa</button>
    ${ok.ok ? '' : `<div class="small muted">${esc(ok.msg)}</div>`}
  </div>`;
}

export const CAT_COLORS = { sobaos: '#e8a33a', hosteleria: '#d4402b', inmobiliario: '#2f8fc4', servicios: '#16a085', formacion: '#7a4fa0' };
export const CAT_LABELS = { sobaos: 'Sobaos', hosteleria: 'Hostelería', inmobiliario: 'Inmobiliario', servicios: 'Servicios', formacion: 'Formación' };

// Áreas apiladas de ingresos por sector y línea de beneficio neto.
export function drawCategoryChart(canvas, s) {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 300;
  const h = 170;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const data = s.history.filter((x) => x.cat);
  if (data.length < 2) {
    ctx.fillStyle = '#8a7d6b';
    ctx.font = '13px system-ui';
    ctx.fillText('Aún no hay datos suficientes.', 10, 80);
    return;
  }
  const keys = Object.keys(CAT_COLORS);
  const max = Math.max(1, ...data.map((d) => keys.reduce((a, k) => a + (d.cat[k] || 0), 0)));
  const min = Math.min(0, ...data.map((d) => d.net));
  const x = (i) => 6 + (i / (data.length - 1)) * (w - 12);
  const y = (v) => h - 16 - ((v - min) / (max - min)) * (h - 28);
  const base = new Array(data.length).fill(0);
  for (const k of keys) {
    ctx.beginPath();
    data.forEach((d, i) => (i ? ctx.lineTo(x(i), y(base[i] + (d.cat[k] || 0))) : ctx.moveTo(x(i), y(base[i] + (d.cat[k] || 0)))));
    for (let i = data.length - 1; i >= 0; i--) ctx.lineTo(x(i), y(base[i]));
    ctx.closePath();
    ctx.fillStyle = CAT_COLORS[k];
    ctx.globalAlpha = 0.75;
    ctx.fill();
    ctx.globalAlpha = 1;
    data.forEach((d, i) => (base[i] += d.cat[k] || 0));
  }
  ctx.beginPath();
  data.forEach((d, i) => (i ? ctx.lineTo(x(i), y(d.net)) : ctx.moveTo(x(i), y(d.net))));
  ctx.strokeStyle = '#2e2318';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.moveTo(0, y(0));
  ctx.lineTo(w, y(0));
  ctx.stroke();
  ctx.fillStyle = '#5b4a36';
  ctx.font = '11px system-ui';
  ctx.fillText(`${moneyShort(max)}/mes`, 8, 12);
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
          ${artOr(a.icon, a.emoji)}<span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span></button>`).join('')}
      </div>
    </div>
    ${renderFamily(s)}
    ${renderLujos(s)}
    <div class="card"><h4>Logros (${unlockedCount()}/${ACHIEVEMENTS.length})</h4>
      <p class="small muted">Se guardan en este navegador entre partidas.</p>
      <div class="achievements">
        ${ACHIEVEMENTS.map((a) => `<div class="ach ${isUnlocked(a.id) ? 'on' : ''}" title="${esc(a.desc)}"><span class="emoji">${isUnlocked(a.id) ? a.emoji : '🔒'}</span><span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span></div>`).join('')}
      </div>
    </div>`;
}

function renderFamily(s) {
  if (s.flags.divorciado) {
    return '<div class="card"><h4>💔 Vida personal</h4><p class="small">Divorciado. Merche está feliz en el chalet. Manolo vive en un ático con una máquina de remo que no usa y dice que "está en su mejor momento".</p></div>';
  }
  const f = Math.round(s.familia ?? 60);
  const mood = f >= 70 ? 'Merche te sonríe en el desayuno.' : f >= 40 ? 'Merche te habla con frases cortas.' : f >= 20 ? 'Merche ha empezado a ir a clases de pádel con un monitor de 30 años.' : '⚠️ Merche ha pedido cita con una abogada.';
  return `<div class="card"><h4>❤️ Familia</h4>
    <div class="small">Relación con Merche: <b>${f}/100</b></div>
    ${bar(f, 100, f < 25 ? 'danger' : 'ok')}
    <p class="small muted">${mood} Cuanto más grande el imperio, menos tiempo pasas en casa. Por debajo de 15 te pide el divorcio (y estáis en gananciales).</p>
  </div>`;
}

function renderLujos(s) {
  return `<div class="card"><h4>Caprichos de Manolo</h4>
    <p class="small muted">Se pagan con la tarjeta de la empresa: dan fama, alegran (o no) a la familia y cuentan en tu patrimonio, pero Hacienda vigila los "signos externos de riqueza".</p>
    <div class="products">${LUJOS.map((l) => {
      const owned = (s.lujo || []).find((x) => x.id === l.id);
      return `<div class="product ${owned ? 'on' : ''}">
        ${artOr(`icon_lujo_${l.id}`, l.emoji, 'emoji big')}
        <div class="grow"><b>${esc(l.name)}</b> <span class="small muted">${owned ? `vale ${moneyShort(owned.value)}` : moneyShort(l.cost)}${l.upkeep ? ` · ${moneyShort(l.upkeep)}/mes` : ''}</span>
          <div class="small muted">${esc(l.desc)} Fama +${l.fama}${l.familia ? `, familia ${l.familia > 0 ? '+' : '−'}${Math.abs(l.familia)}` : ''}.</div></div>
        ${owned ? `<button class="btn small ghost" data-act="lujo-sell" data-id="${l.id}">Vender</button>`
          : `<button class="btn small" data-act="lujo-buy" data-id="${l.id}" ${s.cash >= l.cost ? '' : 'disabled'}>Comprar</button>`}
      </div>`;
    }).join('')}</div></div>`;
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
