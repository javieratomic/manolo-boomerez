import {workforcePlan} from '../core/workforce.js';
import {renderOperations} from './operations.js';
import {ONLINE_LEVELS,ONLINE_SHIPPING} from '../data/online.js';
import {canOpenOnline,canUpgradeOnline} from '../core/online.js';
import {campaignPlan,marketingTerritories,campaignSelection} from '../core/marketing.js';
import {LOCAL_RULES,NEW_YEAR_STAGES} from '../data/localEvents.js';
import {localState,localMemoryText} from '../core/localEvents.js';
import {sponsorshipTerms} from '../data/eventsNewYear.js';
import {HOUSING_FORMS,housingSpec} from '../data/housing.js';
import {isOperating,buildMonths,businessName,businessSprite,renovationCost,isResidential} from '../core/construction.js';
import {housingTerms,PUBLIC_RENTS} from '../core/housing.js';
import {businessSynergies} from '../core/synergies.js';
import {leaderAge,successor,europeProgress} from '../core/dynasty.js';
import {FOREIGN_CITIES} from '../data/foreignCities.js';
import { FOREIGN_MARKETS, FOREIGN_BY_ID, DEAL_MODES } from '../data/international.js';
import { agreementTerms, canSignAgreement } from '../core/international.js';
// Paneles laterales. Cada render devuelve HTML; las acciones van por atributos data-act.
import { canRetire, RETIRE_MONTH } from '../core/sim.js';
import { esc } from './dom.js';
import { imageUrl, hasArt } from '../render/assets.js';

// Usa el arte si ya está entregado; si no, el emoji.
const artOr = (id, emoji, cls = 'emoji') => (hasArt(id) ? `<img src="${imageUrl(id)}" alt="" class="art-icon">` : `<span class="${cls}">${emoji}</span>`);
import { CITY_BY_ID, CITIES, ALL_CITIES, HQ_CITY } from '../data/cities.js';
import { BUSINESS_TYPES, PERKS } from '../data/businesses.js';
import { POLICIES } from '../data/policies.js';
import { MANOLO_ACTIONS } from '../data/manoloActions.js';
import { computeEconomy, estimateOpening, obradorCapacity, patrimonio, creditLimit, averageWage, ssOwed } from '../core/economy.js';
import { canOpen, upgradeRequirements, openingCost, sobaoTypeId, nextUpgrade, saleValue, canRebrand, franchiseFee, needsLicense, LOAN_STEP } from '../core/actions.js';
import { nearestSite, transportCost } from '../core/logistics.js';
import { advice } from '../core/advice.js';
import { PARTIES } from '../data/politics.js';
import { nextElectionMonth } from '../core/politics.js';
import { RIVALS, RIVAL_MAX_LEVEL } from '../data/rivals.js';
import { CAMPAIGNS, PRODUCTS, MAX_LEVEL } from '../data/market.js';
import { POSITIONS, TRAITS } from '../data/execs.js';
import { RIVAL_ACTIONS, canActOnRival, acquisitionPrice, rivalTotal } from '../core/rivals.js';
import { canLaunchCampaign, campaignRunning, canStartRD, upgradeCost, upgradeEffect, PRODUCT_BY_ID } from '../core/market.js';
import { execOf, signingFee, severance, CANDIDATE_REFRESH } from '../core/execs.js';
import { LUJOS } from '../data/lujo.js';
import { ownsLujo, canIPO, companyValuation, ipoPremium, annualProfit, IPO_FLOAT, IPO_LOCKUP, lockupEnd, inLockup } from '../core/life.js';
import { grossPatrimonio } from '../core/economy.js';
import { money, moneyShort, dateLabel } from '../core/helpers.js';
import { haciendaDebt } from '../core/inspections.js';
import { clauseStatus } from '../core/clauses.js';
import { liquidacion, convenioDemand, credibilidad, profitRatio, K as PK } from '../core/plantilla.js';
import { canAsk, maxLoan, breaksPromise, COND_TEXT, condDesc, MAMA } from '../core/cartilla.js';
import { bolsaState, quarterProgress, qLabel, GUIAS } from '../core/bolsa.js';
import { epilogue, cronica, carta, allHitos, MAX_VISIBLE } from '../core/epilogue.js';
import { codex } from '../core/codex.js';
import { HEIR_LABEL } from '../data/eventsVelas.js';
import { collectRefranes, REFRAN_COUNT } from './refranero.js';
import { seedCode } from '../core/seed.js';
import { CLAUSE_PRIZE } from '../data/clauses.js';
import { policyPreview, previewBase, riskInfo, blame, HORIZON } from '../core/preview.js';
import { difficultyOf } from '../core/state.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { PHASES } from '../data/macro.js';
import { macroFx } from '../core/macro.js';
import { isUnlocked, unlockedCount } from './achievements.js';

export {TABS} from './navigation.js';

const LOCK_HINTS = {
  vivienda: 'Disponible desde la herencia para alojar a tu plantilla local.',
  airbnb: 'Se desbloquea en el mes 12 o con 250.000 € en caja.',
  smash: 'Se desbloquea con 4 tiendas de sobaos o en el mes 18.',
  empanadas: 'Rodrigo debe aparecer y debes asociarte con él: 10 % de ventas; primer local −30 %.',
  academy: 'Se desbloquea con fama 25.',
  obrador_regional: 'Se desbloquea con 6 tiendas de sobaos o en el mes 24.',
  taberna: 'Se desbloquea con 2 tiendas de sobaos o en el mes 6.',
  gimnasio: 'Se desbloquea en el mes 12 o con 5 tiendas de sobaos.',
  coworking: 'Se desbloquea con fama 35 o con la Academy abierta.',
  banca: 'Investiga Licencia de banca comercial en I+D.',
  telecom: 'Investiga Red de telecomunicaciones del grupo.',
  logistica: 'Investiga Plataforma logística integrada.',
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
  const urgent = advice(s).find((t) => t.level === 'alta');
  const own = ALL_CITIES.filter((x) => s.businesses.some((b) => b.city === x.id) || x.hq);
  const others = ALL_CITIES.filter((x) => !own.includes(x));
  const goTo = `<label class="goto small"><span>Ir a…</span><select data-act="goto-select" aria-label="Ir a una ciudad">
      <option value="">${esc(c.name)}</option>
      <optgroup label="Tus ciudades (${own.length})">${own.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</optgroup>
      <optgroup label="Sin negocios">${others.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</optgroup>
    </select></label>`;
  let html = goTo;
  html += urgent ? `<div class="card advice-line small"><a href="#" data-act="tab" data-tab="${urgent.tab || 'imperio'}">📋 Paco: ${esc(urgent.text)}</a></div>` : '';
  html += `
    <div class="card city-head">
      <div class="row between"><h3>${esc(c.name)}</h3><span class="muted">${esc(c.region)}</span></div>
      <p class="blurb">${esc(c.blurb)}</p><p class="small muted">Los precios de apertura incluyen el coste local del suelo y de acondicionar el local.</p>
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

  html+=renderLocalRelations(s,c.id);
  if (c.hq) html += renderObrador(s);

  if (here.length) {
    html += `<div class="card"><h4>Tus negocios aquí</h4><ul class="biz-list">`;
    for (const b of here) {
      const t = BUSINESS_TYPES[b.type];
      const l = lineFor(s, b.id);
      const profit = l ? l.revenue - l.cost : null;
      html += `<li class="biz">
        <img src="${imageUrl(businessSprite(b))}" alt="" class="biz-icon">
        <div class="grow">
          <div><b>${esc(businessName(b))}</b>${b.mode === 'franquicia' ? ' <span class="tag">Franquicia</span>' : ` <span class="stars" title="Nivel de reforma">Nivel ${b.level||1}/${MAX_LEVEL}</span>`}</div>
          ${!isOperating(s,b)?`<p class="small construction-status">🏗️ En construcción: quedan ${b.readyMonth-s.month} meses. Sin actividad hasta la entrega.</p>`:''}
          ${isResidential(b)&&isOperating(s,b)?`<p class="small">🔧 Renovación en ${Math.max(0,(b.renewalMonth??s.month+180)-s.month)} meses · estimación ${moneyShort(renovationCost(b))}. Cada 15 años.</p>`:''}
          <div class="muted small">${profit == null ? 'Recién abierto' : `${b.mode === 'franquicia' ? 'Central' : 'Último mes'}: <span class="${cls(profit)}">${signed(profit)}</span>`}
          ${l?.franchise ? ` · Franquiciado: <span class="${cls(l.franchiseeProfit)}">${signed(l.franchiseeProfit)}</span>${b.lossMonths ? ` (${b.lossMonths} ${b.lossMonths === 1 ? 'mes' : 'meses'} en pérdidas)` : ''}` : ''}
          ${l?.surplusBonus > 0 ? ` · Sobaos de cortesía: +${(l.surplusBonus * 100).toFixed(1).replace('.', ',')} %` : ''}
          ${l?.occupied != null ? ` · ${Math.floor(l.occupied)}/${b.type==='vivienda'?housingSpec(b).units:t.beds + (t.model==='care'?10:5) * ((b.level || 1) - 1)} plazas ocupadas` : ''}</div>
          ${businessSynergies(s,b).learning ? '<div class="small pos">🤝 Academy + coworking en esta ciudad: demanda +15 %.</div>' : ''}
          ${b.type==='gimnasio' ? `<div class="small">🥐 Sobaos vendidos aquí el mes anterior: ${Math.round(s.citySobaoSales?.[b.city]||0).toLocaleString('es-ES')} · demanda del gimnasio +${(businessSynergies(s,b).fitness*100).toFixed(1).replace('.',',')} % (máximo 35 %).</div>` : ''}
          ${b.type==='vivienda'&&l ? `<div class="small">Empleados: ${l.employeeOccupied} · Público: ${l.publicOccupied}. <a href="#" data-act="tab" data-tab="viviendas">Gestionar tarifas por ciudad</a></div>` : ''}
          ${l?.employeeFamilies>0 ? `<div class="small">Beneficio asistencial: ${Math.floor(l.employeeFamilies)} familiares · descuentos ${money(l.employeeDiscount)}/mes.</div>` : ''}
          ${b.mode === 'franquicia' ? '' : `<div class="cond" title="Estado de conservación: ${Math.round(b.cond ?? 100)}/100">${bar(b.cond ?? 100, 100, (b.cond ?? 100) < 40 ? 'danger' : 'ok')}</div>`}
        </div>
        <div class="biz-actions">
          ${upgradeCost(b) != null ? `<button class="btn small" data-act="upgrade-biz" data-id="${b.id}" ${s.cash >= upgradeCost(b)&&isOperating(s,b) ? '' : 'disabled'} title="Reforma: ${upgradeEffect(b)}">Reformar ${moneyShort(upgradeCost(b))}</button>` : ''}
          <button class="btn small ghost" data-act="sell" data-id="${b.id}">${b.mode === 'franquicia' ? `Rescindir (−${moneyShort(-saleValue(b))})` : `Vender ${moneyShort(saleValue(b))}`}</button>
        </div>
      </li>`;
    }
    html += `</ul></div>`;
  }

  if (here.some((b) => b.mode !== 'franquicia') || c.hq) html += renderLocalMarketing(s, c);

  html += `<div class="card"><h4>Abrir en ${esc(c.name)}</h4><div class="open-list">`;
  const types = [sobaoTypeId(s), 'vivienda', 'airbnb', 'taberna', 'smash', 'empanadas', 'gimnasio', 'coworking', 'residencia', 'academy', 'obrador_regional','banca','telecom','logistica'];
  const lockedTypes = [];
  html += '<p class="small">🏘️ <a href="#" data-act="tab" data-tab="viviendas">Construir viviendas: Equipo → Viviendas</a></p>';
  for (const id of types) {
    const t = BUSINESS_TYPES[id];
    if (c.hq && t.category !== 'sobaos' && !['vivienda', 'taberna', 'residencia'].includes(id)) continue;
    const locked = t.category !== 'sobaos' && !s.unlocked[id];
    if (locked) {
      lockedTypes.push(id);
      continue;
    }
    const own = canOpen(s, id, c.id, 'propia');
    const est = !locked ? estimateOpening(s, id, c.id, 'propia') : null;
    html += `<div class="open-item ${locked ? 'locked' : ''}">
      <img src="${imageUrl(t.sprite)}" alt="" class="biz-icon">
      <div class="grow">
        <div><b>${esc(t.name)}</b></div>
        ${buildMonths(id)?`<div class="small construction-status">🏗️ Obra: ${buildMonths(id)} meses. Se paga al iniciar; sin ingresos hasta la entrega.</div>`:''}
        <div class="small muted">${esc(t.desc)}</div>
        ${locked ? `<div class="small lock">🔒 ${esc(LOCK_HINTS[id])}</div>` : `<div class="small">Estimación: <b class="${cls(est.delta)}">${signed(est.delta)}/mes</b> antes de impuestos${t.category === 'sobaos' && est.fillAfter < 0.999 ? ` · <span class="warn">el obrador solo cubrirá el ${Math.round(est.fillAfter * 100)} % de la demanda</span>` : ''}</div>`}
        ${!locked ? `<div class="row gap wrap">
          ${id==='vivienda'?housingBuildButtons(s,c.id):`<button class="btn small primary" data-act="open" data-type="${id}" data-mode="propia" ${own.ok ? '' : 'disabled'} title="${esc(own.msg || '')}">${buildMonths(id)?'Construir':needsLicense(id, c.id) ? 'Abrir con licencia' : 'Abrir'} (${moneyShort(openingCost(s, id, 'propia', c.id))})</button>`}
          ${needsLicense(id, c.id) ? `<button class="btn small ghost" data-act="open" data-type="${id}" data-mode="ilegal" ${canOpen(s, id, c.id, 'ilegal').ok ? '' : 'disabled'} title="Sin licencia: más barato, pero el ayuntamiento puede multarte y Hacienda se fija.">Sin licencia (${moneyShort(openingCost(s, id, 'ilegal', c.id))})</button>` : ''}
          ${t.category === 'sobaos' ? renderFranchiseButton(s, id, c.id) : ''}
        </div>${!own.ok && own.msg ? `<div class="small muted">${esc(own.msg)}</div>` : ''}` : ''}
      </div>
    </div>`;
  }
  html += `</div>`;
  if (lockedTypes.length) {
    html += `<details class="locked-list"><summary>🔒 Por desbloquear (${lockedTypes.length})</summary><ul>
      ${lockedTypes.map((id) => `<li><img src="${imageUrl(BUSINESS_TYPES[id].sprite)}" alt="" class="biz-icon small"><div><b>${esc(BUSINESS_TYPES[id].name)}</b><div class="small muted">${esc(LOCK_HINTS[id])}</div></div></li>`).join('')}
    </ul></details>`;
  }
  html += `</div>`;
  return html;
}

function renderLocalRelations(s,city) {
 const ids=Object.keys(LOCAL_RULES).filter(id=>LOCAL_RULES[id][0]===city);
 if(!ids.length)return '';
 return `<div class="card local-relations"><h4>🤝 Relación con la ciudad</h4><p class="small">Reputación: <b>${Math.round(s.rep)}/100</b>. La reputación cambia las invitaciones y los conflictos. Los acuerdos y abusos anteriores se recuerdan.</p>${ids.filter(id=>localState(s,id).visits).map(id=>{const p=localState(s,id);return `<p class="small">${esc(localMemoryText(s,id))}<br>Ediciones: ${p.visits} · Acuerdos: ${p.successes} · Confianza local: ${p.standing>0?'+':''}${p.standing}${id==='ciudad_salamanca'?` · ${esc(NEW_YEAR_STAGES[p.level])} (${p.level}/4)`:''}</p>`}).join('')}${city==='salamanca'?'<p class="small">Las campanadas con minisobaos pueden extenderse por España tras varios patrocinios exitosos. Consulta el progreso en Marketing.</p>':''}</div>`;
}
function renderNewYearTradition(s) {
 const p=localState(s,'ciudad_salamanca'),terms=sponsorshipTerms(s);
 const hasPresence=s.businesses.some(b=>b.city==='salamanca'&&isOperating(s,b));
 return `<div class="card new-year-tradition"><h4>🎆 Campanadas con minisobaos</h4><p><b>${esc(NEW_YEAR_STAGES[p.level])} · ${p.level}/4</b></p><p class="small">${p.level>=4?'Tradición consolidada: demanda española de sobaos +15 % cada diciembre, incluso sin renovar el patrocinio. Con reputación inferior a 30, el bonus se reduce a la mitad.':'Cuatro patrocinios exitosos en años distintos pueden convertir la Nochevieja Universitaria de Salamanca en una tradición nacional. Cada extensión requiere más reputación y una inversión mayor.'}</p><p class="small">Siguiente patrocinio: ${money(terms.cost)} · reputación ${terms.rep} · moral 35 · suministro reciente y previsto ≥90 %.</p>${hasPresence?'':'<p class="small muted">Necesitas un negocio operativo en Salamanca para recibir la propuesta en noviembre y decidir en diciembre.</p>'}${p.visits?`<p class="small">${esc(localMemoryText(s,'ciudad_salamanca'))}</p>`:''}</div>`;
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
  return `<div class="franchise-offer"><button class="btn small" data-act="open" data-type="${id}" data-mode="franquicia" ${f.ok ? '' : 'disabled'}
    title="Un incauto paga el canon y monta la tienda. Tú cobras ${moneyShort(est.delta)}/mes aprox.">Vender franquicia (+${moneyShort(franchiseFee(s, id))})</button>
    <div class="small">Central: <span class="${cls(est.delta)}">${signed(est.delta)}/mes</span> · Franquiciado: <span class="${cls(est.franchiseeProfit)}">${signed(est.franchiseeProfit)}/mes</span></div>
    <div class="small ${est.franchiseeProfit < 0 ? 'warn' : 'muted'}">${est.franchiseeProfit < 0 ? '⚠️ Nace con pérdidas para su dueño. Cuatro meses seguidos pueden llevarlo a la quiebra.' : 'La quiebra depende de sus cuentas: venta al público menos producto, canon mensual, salarios y alquiler.'}</div></div>`;
}

function renderObrador(s) {
  const cap = obradorCapacity(s);
  const r = computeEconomy(s);
  const fill = r.fill;
  const up = nextUpgrade(s);
  const workforce=workforcePlan(s,'selaya'), nextWorkforce=upgradeRequirements(s);
  const ing = POLICIES.ingredientes;
  return `<div class="card obrador">
    <div class="row gap"><img src="${imageUrl(s.obrador.upgrades.includes('nave') ? 'bld_obrador_3' : s.obrador.upgrades.length ? 'bld_obrador_2' : 'bld_obrador_1')}" class="biz-icon big" alt="">
      <div class="grow"><h4>Obrador Boomerez</h4>
      <div class="small">Capacidad: <b>${Math.round(cap).toLocaleString('es-ES')}</b> uds/mes · Demanda: <b>${Math.round(r.totalDemand).toLocaleString('es-ES')}</b></div>
      ${bar(Math.min(r.totalDemand, cap), cap, fill < 0.999 ? 'danger' : 'ok')}
      <div class="small ${fill < 0.999 ? 'warn' : 'muted'}">${fill < 0.999 ? `⚠️ No das abasto: solo sirves el ${Math.round(fill * 100)} % de la demanda.` : `Hay capacidad libre.${r.bonusUnits > 0 ? ` ${Math.round(r.bonusUnits)} sobaos de cortesía: hasta +5 % de ingresos en otros negocios.` : ''}`}</div></div>
    </div>
    ${up ? `<div class="small">Plantilla para capacidad instalada: ${workforce.required} · Oferta local: ${workforce.available} (${workforce.beds} plazas de vivienda).</div><div class="upgrade"><div><b>${esc(up.name)}</b> · +${up.capacity.toLocaleString('es-ES')} uds/mes</div><div class="small muted">${esc(up.desc)}</div>
      <button class="btn small primary" data-act="upgrade" ${s.cash >= up.cost && nextWorkforce.missingBeds===0 ? '' : 'disabled'}>Comprar (${moneyShort(up.cost)})</button>${nextWorkforce.missingBeds ? `<p class="small warn">Para esta ampliación faltan ${nextWorkforce.missingBeds} plazas en Selaya. <a href="#" data-act="tab" data-tab="viviendas">Construir viviendas</a></p>` : ''}</div>` : '<div class="small muted">El obrador está a tope de mejoras.</div>'}
    ${policyGroup(s, 'ingredientes', ing)}
    ${renderRebrand(s)}
    ${s.contracts.length ? `<div class="small">Contratos: ${s.contracts.map((c) => `${esc(c.label)} (${c.units.toLocaleString('es-ES')} uds/mes, ${c.months > 120 ? 'indefinido' : `${c.months} ${c.months === 1 ? 'mes' : 'meses'}`})`).join(', ')}</div>` : ''}
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

// ------------------------------------------------------------- Previsiones
// Se recalculan solo cuando cambia algo que las afecta (cada previsión simula unos meses sobre una copia).
// La clave es el estado entero salvo el registro y el historial (unos 50 KB: menos de 1 ms), para no dejar
// fuera nada que lea la previsión (gastos fijos, contratos, banderas, estado de los locales...).
let pvCache = { key: '', base: null, map: {} };
const pvSkip = new Set(['log', 'history', 'notices', 'quote']);
function previewCache(s) {
  const key = JSON.stringify(s, (k, v) => (pvSkip.has(k) ? undefined : v));
  if (pvCache.key !== key) pvCache = { key, base: previewBase(s), map: {} };
  return pvCache;
}
function previewOf(s, key, opt) {
  const c = previewCache(s);
  return (c.map[`${key}:${opt}`] ||= policyPreview(s, key, opt, c.base));
}

const LABOR_KEYS = ['salario', 'horas', 'becarios', 'alquiler'];
const fmt1 = (v) => `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1).replace('.', ',')}`;
const signMoney = (v) => `${v > 0 ? '+' : '−'}${moneyShort(Math.abs(v))}`;

// Hasta 4 cifras bajo una opción: lo que cambiaría el mes que viene respecto a lo que tienes ahora.
function policyChips(s, key, id) {
  const p = previewOf(s, key, id);
  const chips = [];
  if (Math.abs(p.net) >= 50) chips.push([cls(p.net), `${signMoney(p.net)}/mes`]);
  if (Math.abs(p.moral) >= 0.05) chips.push([cls(p.moral), `Moral ${fmt1(p.moral)}/mes`]);
  if (Math.abs(p.rep) >= 0.05) chips.push([cls(p.rep), `Reputación ${fmt1(p.rep)}/mes`]);
  if (Math.abs(p.heatTrabajo) >= 0.05) chips.push([cls(-p.heatTrabajo), `Radar Trabajo ${fmt1(p.heatTrabajo)}/mes`]);
  if (Math.abs(p.heatHacienda) >= 0.05) chips.push([cls(-p.heatHacienda), `Radar Hacienda ${fmt1(p.heatHacienda)}/mes`]);
  if (Math.abs(p.agravio) >= 0.05) chips.push([cls(-p.agravio), `Agravio ${fmt1(p.agravio)}/mes`]);
  // Lo que se ahorra frente al convenio se apunta como deuda latente con la Seguridad Social.
  const debt = LABOR_KEYS.includes(key) && Math.abs(p.saving) >= 50 ? (p.saving > 0 ? ['neg', `+${moneyShort(p.saving)}/mes de deuda con la Seguridad Social`] : ['pos', `${signMoney(p.saving)}/mes de deuda con la Seguridad Social`]) : null;
  // La multa siempre se ve: es justo lo que más importa en las opciones más tentadoras.
  const fine = LABOR_KEYS.includes(key) && (p.fine > 0 || p.liq > 0) ? ['neg', `Multa si viene: ${moneyShort(p.fine)}${p.liq > 0 ? ` + liquidación ${moneyShort(p.liq)}` : ''}`] : null;
  const mama = breaksPromise(s, key, id) ? ['neg', '⚠️ Rompe la promesa a tu madre'] : null;
  const extra = [mama, debt, fine].filter(Boolean);
  const shown = [...chips.slice(0, 4 - extra.length), ...extra];
  let html = shown.length ? `<span class="pv-chips">${shown.map(([c, t]) => `<span class="pv-chip ${c}">${esc(t)}</span>`).join('')}</span>` : '';
  if (key === 'contabilidad' && id !== 'limpia' && previewCache(s).base.f.r.profit <= 0 && p.heatHacienda > 0) html += '<span class="pv-note">Este mes no hay beneficio: no te ahorrarías impuestos, solo subiría el radar.</span>';
  else if (Math.abs(p.net6) >= 100) html += `<span class="pv-note">A ${HORIZON} meses: <b class="${cls(p.net6)}">${signMoney(p.net6)}</b>, ya descontadas la moral, las multas y la liquidación esperadas.</span>`;
  return html;
}

function pvFootnote(s) {
  const n = previewCache(s).base.f.r.employees;
  return `<p class="small muted pv-foot">Cifras del mes que viene con tu plantilla actual (${n} personas), si no pasa nada más.</p>`;
}

function policyGroup(s, key, def, locked = false) {
  const first = Object.keys(def.options)[0];
  return `<fieldset class="policy"><legend>${esc(def.label)}</legend>
    ${Object.entries(def.options)
      .map(([id, o]) => {
        const on = s.policies[key] === id;
        const off = locked && id !== first;
        return `<label class="opt ${on ? 'on' : ''}">
        <input type="radio" name="pol-${key}" data-act="policy" data-key="${key}" value="${id}" ${on ? 'checked' : ''} ${off ? 'disabled' : ''}>
        <span><b>${esc(o.label)}</b>${on ? ' <span class="tag">Actual</span>' : ''}<small>${esc(o.desc)}</small>${on ? '' : `${off ? '<span class="pv-note">Lo que Manolo se está perdiendo:</span>' : ''}${policyChips(s, key, id)}`}</span></label>`;
      })
      .join('')}
  </fieldset>`;
}

// ------------------------------------------------------------- ¿Por qué?
const WHY = {
  moral: { label: 'Moral de la plantilla', good: 1, paco: 'La moral no se arregla con una pizza el viernes, Manolo. Bueno, un poco sí.' },
  rep: { label: 'Reputación', good: 1, paco: 'Lo que sale en el periódico no se tapa con un post en LinkedIn.' },
  fama: { label: 'Fama de Manolo', good: 1, paco: 'La fama se gasta sola. Si no sales en ningún sitio, te olvidan.' },
  heatTrabajo: { label: 'Radar de la Inspección de Trabajo', good: -1, paco: 'El radar no baja por mirarlo fijamente, Manolo.' },
  heatHacienda: { label: 'Radar de Hacienda', good: -1, paco: 'Don Fermín no se olvida de nada. Yo tampoco, y eso que te cobro poco.' },
  agravio: { label: 'Agravio de la plantilla', good: -1, paco: 'Manolo, la plantilla también sabe leer el Registro Mercantil.' },
};
export const WHY_STATS = Object.keys(WHY);
export const whyTitle = (stat) => WHY[stat]?.label || '';

const pct100 = (x) => `${Math.round(x * 100)} %`;
const meses = (n) => `${n} ${n === 1 ? 'mes' : 'meses'}`;
const factor = (x) => `×${x.toFixed(2).replace('.', ',')}`;
const dec1 = (v) => v.toFixed(1).replace('.', ',');

function riskText(s, stat, risk) {
  switch (stat) {
    case 'heatTrabajo': {
      const t = risk.trabajo;
      if (t.wait) return `Marisa no puede volver hasta dentro de ${meses(t.wait)}.`;
      const liq = t.liq > 0 ? ` Además liquidaría ${money(t.liq)} de lo ahorrado frente al convenio (${PK.LIQ_WINDOW} meses ×${(PK.LIQ_K * difficultyOf(s).fines).toFixed(2).replace('.', ',')}).` : '';
      const fine = t.fine > 0 ? ` Si viene, multa de ${money(t.fine)}${t.recidivism > 1 ? ` (con agravante ${factor(t.recidivism)} por reincidente)` : ''}.${liq}` : liq || ' Si viniera ahora, no encontraría nada.';
      return `Probabilidad de visita al cerrar el mes: <b>${pct100(t.chance)}</b>.${fine}`;
    }
    case 'heatHacienda': {
      const h = risk.hacienda;
      const debt = h.debt > 0 ? ` Te reclamaría ${money(h.debt)}${h.delito ? ': por encima de 120.000 € es delito fiscal y puede acabar en expediente' : ''}.` : ' Ahora mismo no hay nada que reclamar.';
      if (h.wait) return `Don Fermín no puede volver hasta dentro de ${meses(h.wait)}.${debt}`;
      return `Probabilidad de auditoría al cerrar el mes: <b>${pct100(h.chance)}</b>.${debt}`;
    }
    case 'moral': {
      const m = risk.moral;
      let t = `La plantilla rinde al <b>${factor(m.factor)}</b>.`;
      if (m.strike > 0) t += m.general ? ` Huelga general (comité): ${pct100(m.strike)} al cerrar el mes.` : ` Por debajo de 25 puede haber huelga: ${pct100(m.strike)} al cerrar el mes.`;
      if (m.zeroMonths >= 2) t += ' Si cierras el mes así, serán 2 meses seguidos a cero y la plantilla se queda la empresa.';
      else if (m.zeroMonths > 0) t += ` Al cerrar el mes llevará ${meses(m.zeroMonths)} a cero: a los 2, la plantilla se queda la empresa.`;
      return t;
    }
    case 'rep':
      return `La demanda de todos tus negocios va al <b>${factor(risk.rep.factor)}</b>.`;
    case 'agravio': {
      const a = risk.agravio;
      let t = `Beneficio por cabeza: <b>${dec1(a.ratio)} sueldos</b> al mes. Te resta ${dec1(a.moralCost)} de moral al mes.`;
      if (a.comite && a.paz > 0) t += ` Con el comité en paz social ${meses(a.paz)} más, no habrá huelga general; después, a partir de ${PK.STRIKE_AT} de agravio, puede haberla.`;
      else if (a.comite) t += a.strike > 0 ? ` Con el comité y el agravio en ${PK.STRIKE_AT} o más: huelga general ${pct100(a.strike)} al cerrar el mes.` : ` Con el comité, a partir de ${PK.STRIKE_AT} puede haber huelga general.`;
      else t += ` Cuando la plantilla pase de ${PK.COMITE_AT} personas habrá comité de empresa.`;
      return t;
    }
    case 'fama':
      return `La fama hace vender a la Maison y a la Academy, y se desvanece sola (−0,5 al mes y un 3 % más). La Academy se desbloquea con 25 y el coworking con 35.`;
    default:
      return '';
  }
}

export function renderWhy(s, stat) {
  const w = WHY[stat];
  const c = previewCache(s);
  const b = blame(s, stat, c.base);
  const tone = (v) => (v * w.good >= 0 ? 'pos' : 'neg');
  const rows = b.rows
    .sort((x, y) => Math.abs(y.value) - Math.abs(x.value))
    .map((x) => `<li><span>${esc(x.label)}: <i>${esc(x.option)}</i></span><b class="${tone(x.value)}">${fmt1(x.value)}</b></li>`)
    .join('');
  const rest = (Math.abs(b.rest) >= 0.05 ? `<li class="rest"><span>Resto (tamaño, directivos, tendencia natural, enfriamiento)</span><b class="${tone(b.rest)}">${fmt1(b.rest)}</b></li>` : '') +
    (b.clamp ? `<li class="rest"><span>Tope: no puede ${b.clamp > 0 ? 'bajar de 0' : 'subir de 100'}</span><b>${fmt1(b.clamp)}</b></li>` : '');
  return `<p class="why-head"><b>${dec1(b.from)} → ${dec1(b.to)}</b> <span class="${tone(b.total)}">(${Math.abs(b.total) < 0.05 ? '=' : fmt1(b.total)})</span> el mes que viene, si no pasa nada.</p>
    ${rows || rest ? `<h4>Qué lo mueve</h4><ul class="why">${rows}${rest}</ul>` : ''}
    ${!b.rows.length ? '<p class="small muted">Ninguna de tus políticas lo está empujando: todo es tendencia natural.</p>' : ''}
    <h4>Riesgo</h4><p>${riskText(s, stat, riskInfo(s, c.base.f))}</p>
    <p class="small muted">Paco, el gestor: «${esc(w.paco)}»</p>`;
}

// ------------------------------------------------------------------ Imperio
export function renderEmpire(s) {
  const r = s.lastReport;
  const pat = patrimonio(s);
  let html = renderEuropeanGoal(s)+`<div class="card kpis">
    <div><span class="muted small">Patrimonio</span><b>${moneyShort(pat)}</b></div>
    <div><span class="muted small">Negocios</span><b>${s.businesses.length + 1}</b></div>
    <div><span class="muted small">Plantilla</span><b>${r ? r.employees : '—'}</b></div>
    <div><span class="muted small">Beneficio último mes</span><b class="${r ? cls(r.net) : ''}">${r ? moneyShort(r.net) : '—'}</b></div>
  </div>`;
  html += renderAdvice(s);
  html += renderOperations(s);
  if (!r) return html;
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
      html += `<tr><td>${esc(l.label)}${l.franchise ? ` <span class="tag">Franquicia</span><div class="small">Su dueño: <span class="${cls(l.franchiseeProfit)}">${signed(l.franchiseeProfit)}/mes</span></div>` : ''}</td><td>${moneyShort(l.revenue)}</td><td class="${cls(p)}">${moneyShort(p)}</td></tr>`;
    }
  }
  html += `</tbody></table><p class="small muted">Resultado de la central, sin costes generales ni impuestos. Cada franquiciado lleva sus propias cuentas; quiebra tras cuatro meses consecutivos de pérdidas.</p></div>`;
  return html;
}

// ------------------------------------------------------------------ Mercado
const unitMoney = n => n.toLocaleString('es-ES', {style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
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
    ${renderGov(s)}
    ${renderRivals(s)}
    `;
}

export function renderOnline(s) {
 const opened=s.online?.level>0,base=computeEconomy(s);
 const report=opened?base:computeEconomy({...s,online:{level:1,active:true,shipping:'incluido'}});
 const o=report.online,level=opened?s.online.level:1,plan=ONLINE_LEVELS[level],check=opened?canUpgradeOnline(s):canOpenOnline(s);
 const rows=[['Ventas de producto',o.productRevenue],['Portes cobrados al cliente',o.chargedShipping],['Materias primas',-o.materials],['Paquetería a domicilio',-o.shipping],['Cajas y embalaje',-o.packaging],['Comisiones de cobro (3 %)',-o.payments],['Reserva de incidencias (2 % producto)',-o.returns],['Personal de preparación en Selaya',-o.wages],['Plataforma y atención digital',-o.fixed]];
 return `<div class="card online-channel"><h3>🛒 Venta online de sobaos</h3><p class="small">Tienda propia para la Península, en cajas de seis. Primero se atienden tiendas y contratos; la web solo acepta pedidos con el excedente real, antes de los regalos de cortesía. La paquetería cuesta más por unidad que abastecer tus propias tiendas.</p><p><b>${esc(plan.name)}</b>${opened&&!s.online.active?' · En pausa':''}</p><div class="chips"><span class="chip">Tráfico potencial: ${o.potentialOrders.toLocaleString('es-ES')} pedidos/mes</span><span class="chip">Aceptados: ${o.orders.toLocaleString('es-ES')} · ${o.units.toLocaleString('es-ES')} uds</span><span class="chip">Precio: ${o.unitPrice.toFixed(2).replace('.',',')} €/ud</span><span class="chip">Paquetería: ${o.parcelCost.toFixed(2).replace('.',',')} €/pedido</span><span class="chip">Margen variable: ${(o.contributionMargin*100).toFixed(1).replace('.',',')} %</span></div><p class="small">Personal previsto: ${plan.staff} · Personal disponible: ${o.staff} · Límite del nivel: ${plan.maxOrders.toLocaleString('es-ES')} pedidos/mes. Campañas nacionales, fama, reputación, I+D y temporada atraen demanda; no sustituyen al stock.</p>${opened?`<fieldset class="online-shipping"><legend>Portes al cliente</legend>${Object.entries(ONLINE_SHIPPING).map(([id,p])=>`<label><input type="radio" name="online-shipping" data-act="online-shipping" value="${id}" ${s.online.shipping===id?'checked':''}> ${esc(p.label)}${id==='compartidos'?' (18 % menos demanda)':''}</label>`).join('')}</fieldset>`:''}<details class="online-breakdown" open><summary>${opened?'Previsión mensual del canal':'Previsión mensual si abres ahora'}</summary><table class="tbl">${rows.map(([label,amount])=>`<tr><td>${esc(label)}</td><td class="${cls(amount)}">${signed(amount)}</td></tr>`).join('')}<tr class="total"><td>Resultado del canal antes de impuestos</td><td class="${cls(o.profit)}">${signed(o.profit)}</td></tr></table><p class="small muted">La fabricación y los gastos comunes se cuentan en la empresa. ${!opened?`Cambio previsto en resultado total: <b>${signed(report.net-base.net)}/mes</b>, tras impuestos.`:''}</p></details>${o.active&&o.potentialOrders>o.orders?'<p class="small warn">Parte de la demanda no se acepta por falta de excedente, personal o capacidad de preparación. No se contabiliza como venta.</p>':''}<div class="row gap wrap">${!opened?`<button class="btn small primary" data-act="online-open" ${check.ok?'':'disabled'}>Abrir tienda online (${moneyShort(ONLINE_LEVELS[1].cost)})</button>`:`<button class="btn small" data-act="online-toggle">${s.online.active?'Pausar canal':'Reactivar canal'}</button>${level<3?`<button class="btn small primary" data-act="online-upgrade" ${check.ok?'':'disabled'}>Ampliar: ${esc(ONLINE_LEVELS[level+1].name)} (${moneyShort(ONLINE_LEVELS[level+1].cost)})</button>`:''}`}</div>${!check.ok&&(!opened||level<3)?`<p class="small muted">${esc(check.msg)}</p>`:''}<p class="small muted">Pausado no vende ni cobra cuota o nóminas de preparación. Al reactivarlo se comprueba de nuevo la oferta laboral. Tarifas medias de juego, no precios reales de transporte.</p></div>`;
}
export function renderMarketing(s,selection={}) {
 return renderMarketingHub(s,selection)+renderNewYearTradition(s);
}
function renderMarketingHub(s,selection) {
 const group=(scope,title)=>{
  const territories=marketingTerritories(s,scope),selected=campaignSelection(s,scope,selection[scope]);
  return `<details class="marketing-scope" data-scope="${scope}" open><summary><b>${title}</b></summary>${scope==='national'?'<p class="small">Un único presupuesto para España. No promociona directamente negocios extranjeros.</p>':`<p class="small">${scope==='city'?'Presupuesto por ciudad operativa, incluyendo franquicias.':'Presupuesto por país con locales operativos o acuerdos activos. Un país se cuenta una sola vez.'}</p><div class="row gap wrap"><button class="btn small ghost" data-act="marketing-select" data-scope="${scope}" data-value="all">Todos</button><button class="btn small ghost" data-act="marketing-select" data-scope="${scope}" data-value="none">Ninguno</button></div><fieldset class="marketing-targets"><legend>${scope==='city'?'Ciudades seleccionadas':'Países seleccionados'}</legend>${territories.length?territories.map(t=>`<label><input type="checkbox" data-act="marketing-target" data-scope="${scope}" value="${t.id}" ${selected.includes(t.id)?'checked':''}> ${esc(t.name)}</label>`).join(''):'<p class="small muted">Todavía no tienes presencia operativa para este ámbito.</p>'}</fieldset>`}<div class="campaigns">${CAMPAIGNS.filter(c=>c.scope===scope).map(c=>{
    if(scope==='national')return campaignRow(s,c);
    const plan=campaignPlan(s,c.id,selected),noun=scope==='city'?'ciudades':'países';
    return `<div class="campaign marketing-campaign"><div class="grow"><b>${esc(c.name)}</b><div class="small">${money(c.cost)} por ${scope==='city'?'ciudad':'país'} · ${c.months} meses · demanda +${Math.round((c.factor-1)*100)} %</div><p class="small muted">${esc(c.desc)}</p><div class="small batch-quote">Lote: <b>${plan.targets.length} ${noun} · ${money(plan.cost)}</b>${plan.skipped.length?` · ${plan.skipped.length} omitidos (ya activos o sin negocios afines)`:''}</div>${!plan.ok?`<div class="small muted">${esc(plan.msg)}</div>`:''}</div><button class="btn small primary" data-act="campaign-batch" data-id="${c.id}" data-scope="${scope}" ${plan.ok?'':'disabled'}>Revisar y lanzar en ${plan.targets.length} ${noun}</button></div>`;
   }).join('')}</div></details>`;
 };
 return `<div class="card marketing-hub"><h3>📢 Central de marketing</h3><p class="small">Selecciona territorios y contrata cada campaña en todos ellos desde aquí. El lote omite campañas ya activas y destinos sin negocios afines. Se cobra el total completo al contratar; elevar la demanda requiere capacidad para atenderla.</p>${execOf(s,'marketing')?'<p class="small">Tu responsable de Marketing mejora la eficacia de cada campaña.</p>':''}${group('national','🇪🇸 Campañas nacionales')}${group('city','📍 Campañas locales en lote')}${group('international','🌍 Campañas internacionales')}</div>`;
}

export function renderInternational(s) {
  const r = computeEconomy(s);
  return `<div class="card"><h4>🌍 Acuerdos internacionales</h4>
    <p class="small">Marca blanca: fabricas tú para la marca del socio. Licencia: fabrican ellos con tu marca y te pagan el 8 % de sus ventas. Acuerdos exclusivos de 24 meses. Los socios y sus cifras son ficticios.</p>
    <div class="foreign-territories"><h4>Abrir tus propios negocios en Europa</h4><p class="small">Completa seis meses de marca blanca con al menos el 90 % del pedido servido en el país e investiga Despliegue comercial internacional en I+D. Las licencias no cuentan para este acceso. El mapa principal sigue mostrando España; gestiona estas filiales desde aquí.</p>${[...new Set(FOREIGN_CITIES.map(c=>c.market))].map(id=>`<div class="small"><b>${esc(FOREIGN_BY_ID[id].country)}</b> · Marca blanca cumplida: ${s.foreignTrack?.[id]?.successMonths||0}/6 meses<div class="row gap wrap">${FOREIGN_CITIES.filter(c=>c.market===id).map(c=>`<button class="btn small" data-act="goto-city" data-city="${c.id}">${esc(c.name)}</button>`).join('')}</div></div>`).join('')}</div><p class="small muted">Imprevistos: lotes defectuosos, impagos y copias de tu receta. Una auditoría cuesta 900 €/mes y reduce un 60 % el riesgo mensual; no lo elimina. Dos meses con menos del 80 % de suministro también abren conflicto.</p>
    ${(s.foreignDeals || []).map(d => {
      const l = r.lines.find(l => l.dealId === d.id);
      return `<div class="foreign-active"><b>${esc(FOREIGN_BY_ID[d.market].country)} · ${esc(DEAL_MODES[d.mode].name)}</b>
        <div class="small">${d.months} meses restantes · ${d.brand === 'maison' ? 'Maison Boomerez' : 'Sobaos Manolo Express'} · ${d.audit ? 'Con auditoría' : 'Sin auditoría'}${d.dispute ? ' · ⚠️ Suspendido por conflicto' : ` · Ingresos previstos: ${money(l?.revenue || 0)}/mes · Costes directos: ${money(l?.cost || 0)}/mes`}</div>
        <button class="btn small ghost" data-act="foreign-end" data-id="${d.id}" ${s.cash < 5000 ? 'disabled' : ''}>Rescindir (5.000 €)</button></div>`;
    }).join('')}
    ${FOREIGN_MARKETS.filter(m => !(s.foreignDeals || []).some(d => d.market === m.id)).map(m => `<details class="foreign-offer" data-market="${m.id}"><summary><b>${esc(m.country)}</b> · ${esc(m.partner)}</summary>
      <label class="small"><input type="checkbox" class="foreign-audit" checked> Auditoría independiente: 900 €/mes</label>
      ${Object.entries(DEAL_MODES).map(([mode,def]) => {
        const terms = agreementTerms(m.id,mode,false), audited = agreementTerms(m.id,mode,true);
        const ok = canSignAgreement(s,m.id,mode,true);
        return `<div class="foreign-mode"><b>${esc(def.name)}</b><p class="small muted">${esc(def.desc)}</p>
          <div class="small">${mode === 'private_label' ? `${terms.units.toLocaleString('es-ES')} uds/mes a ${unitMoney(m.price)}/ud; transporte ${unitMoney(m.shipping)}/ud.` : `Ventas estimadas del socio: ${money(m.turnover)}/mes (varían con tu reputación).`}</div>
          <div class="small">Riesgo mensual: ${(audited.risk*100).toFixed(1)} % con auditoría / ${(terms.risk*100).toFixed(1)} % sin ella.</div>
          <button class="btn small" data-act="foreign-sign" data-market="${m.id}" data-mode="${mode}" ${ok.ok ? '' : 'disabled'} title="${esc(ok.msg || '')}">Firmar (${moneyShort(terms.setup)})</button></div>`;
      }).join('')}
    </details>`).join('')}
  </div>`;
}

function renderGov(s) {
  const p = PARTIES[s.gov?.party];
  const next = nextElectionMonth(s.month);
  return `<div class="card"><h4>🗳️ Gobierno</h4>
    ${p ? `<div><b style="color:${p.color}">${p.emoji} ${esc(p.name)}</b></div><p class="small">${esc(p.summary)}</p>`
      : '<p class="small">Gobierno en funciones: nadie se atreve a cambiar nada. Reglas de siempre.</p>'}
    <p class="small muted">${next != null ? `Próximas elecciones: ${dateLabel(next)}.` : 'No hay más elecciones a la vista.'}</p>
  </div>`;
}

function renderRivals(s) {
  if (!s.rivals?.length) {
    return '<div class="card"><h4>Competencia</h4><p class="small muted">De momento nadie te hace sombra. En cuanto huelan dinero, aparecerán.</p></div>';
  }
  return `<div class="card"><h4>Competencia</h4>
    <p class="small muted">Cada punto de presencia rival en una ciudad le resta clientela a tus negocios del ramo: un 13 % con uno, un 23 % con dos y un 31 % con tres. Y te copian: van a donde ganas dinero.</p>
    ${s.rivals.map((r) => {
      const d = RIVALS[r.id];
      const price = acquisitionPrice(s, r.id);
      const all = Object.entries(r.presence).sort((a, b) => b[1] - a[1]);
      const mine = new Set(s.businesses.filter((b) => d.targets.includes(b.type) && b.mode !== 'franquicia').map((b) => b.city));
      const cities = all.filter(([c]) => mine.has(c));
      const others = all.filter(([c]) => !mine.has(c));
      return `<div class="rival-card" style="--rc:${d.color}">
        <div class="row between"><b>${artOr(`logo_rival_${r.id}`, d.emoji)} ${esc(d.name)}</b><span class="small muted">${rivalTotal(r)} ${rivalTotal(r) === 1 ? 'local' : 'locales'}${r.calm ? ' · en pausa' : ''}</span></div>
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

function researchAreas(p) {
 const areas=[];
 if(p.production||p.laborFactor)areas.push('production');
 if(['laborFactor','fixedFactor','materialFactor','transportFactor','structureFactor'].some(k=>p[k]))areas.push('costs');
 if(p.contract||p.effects.some(e=>e.category==='sobaos'||e.types?.some(t=>['express','maison','obrador'].includes(t))))areas.push('sobaos');
 if(p.whiteSuccess)areas.push('foreign');
 if(p.opens||p.requires||p.effects.some(e=>!e.category&&!e.types||e.types?.some(t=>!['express','maison','obrador'].includes(t))))areas.push('business');
 return areas.length?areas:['business'];
}
export function renderResearch(s,filters={}) {
  const rd = s.rd;
  const status=filters.status||'pending',category=filters.category||'all';
  const categories={all:'Todas las áreas',production:'Producción y automatización',costs:'Reducción de costes',sobaos:'Productos de sobaos',business:'Servicios y nuevos negocios',foreign:'Expansión exterior'};
  const matches=p=>category==='all'||researchAreas(p).includes(category);
  const shown=PRODUCTS.filter(p=>(status==='all'||(status==='completed')===s.products.includes(p.id))&&matches(p));
  return `<div class="card research-panel"><h3>🧪 Investigación y desarrollo</h3><p class="small">${s.products.length} innovaciones terminadas. Filtra por estado y área para encontrar el siguiente proyecto.</p><div class="row gap wrap research-filters">${[['pending','Pendientes'],['completed','Investigados'],['all','Todos']].map(([id,name])=>`<button class="btn small ${status===id?'primary':'ghost'}" data-act="research-status" data-value="${id}" aria-pressed="${status===id}">${name}</button>`).join('')}<label class="small">Área <select data-act="research-category" aria-label="Área de investigación">${Object.entries(categories).map(([id,name])=>`<option value="${id}" ${category===id?'selected':''}>${name}</option>`).join('')}</select></label></div>
    ${rd ? `<div class="rd-now"><b>En desarrollo:</b> ${esc(PRODUCT_BY_ID[rd.id]?.name||rd.id)} · ${rd.monthsLeft === 1 ? 'falta 1 mes' : `faltan ${rd.monthsLeft} meses`} ${bar(rd.total - rd.monthsLeft, rd.total, 'ok')}</div>`
      : '<p class="small muted">El "laboratorio" (la trastienda del obrador, con una pizarra) está libre.</p>'}
    <p class="small muted">${shown.length} proyectos en esta selección.</p>
    <div class="products">
      ${shown.map((p) => {
        const has = s.products.includes(p.id);
        const ok = canStartRD(s, p.id);
        return `<div class="product ${has ? 'on' : ''}">
          <img src="${p.icon}" class="biz-icon" width="64" height="64" alt="">
          <div class="grow"><b>${has ? '✅ ' : ''}${esc(p.name)}</b> ${has ? '' : `<span class="muted small">${moneyShort(p.cost)} · ${p.months} ${p.months === 1 ? 'mes' : 'meses'}</span>`}
            <div class="small muted">${esc(p.desc)}</div></div>
          ${has ? '' : `<button class="btn small" data-act="rd" data-id="${p.id}" ${ok.ok ? '' : 'disabled'} title="${esc(ok.msg || '')}">Desarrollar</button>`}
        </div>`;
      }).join('')}
    </div></div>`;
}

function renderHousing(s,r) {
 const cities=[...new Set(['selaya',...s.businesses.filter(b=>b.mode!=='franquicia').map(b=>b.city)])];
 const select=(city,group,terms)=>`<label class="small housing-tariff">${group==='employee'?'Tarifa empleados':'Tarifa público'} <select data-act="housing-policy" data-city="${city}" data-group="${group}" aria-label="${group==='employee'?'Alquiler empleados':'Alquiler público'} en ${esc(CITY_BY_ID[city].name)}">${Object.entries(group==='employee'?POLICIES.alquiler.options:PUBLIC_RENTS).map(([id,opt])=>{const t=housingTerms({...s,housingPolicies:{...s.housingPolicies,[city]:{...s.housingPolicies?.[city],[group]:id}}},city);return `<option value="${id}" ${terms[group]===id?'selected':''}>${esc(opt.label.split(' (')[0])} · ${money(group==='employee'?t.employeeRent:t.publicRent)}/vivienda</option>`}).join('')}</select></label>`;
 return `<div class="card housing-card"><h3>🏘️ Viviendas para empleados y público</h3><p class="small">La plantilla local tiene prioridad. Las plazas libres se alquilan al público; este no cuenta como control laboral. Tarifas base por vivienda y mes, ajustadas al mercado de cada ciudad. Los chalets multiplican la tarifa por 1,5; las reformas la mejoran un 3 % por nivel. Un alquiler público alto reduce la demanda.</p><p class="small muted">Cada plaza de vivienda permite atraer a cuatro trabajadores más. Las grandes ampliaciones necesitan plazas suficientes.</p>
 ${cities.map(city=>{const p=workforcePlan(s,city),local=r.lines.filter(l=>l.city===city),staff=local.reduce((n,l)=>n+l.staff,0),homes=local.filter(l=>l.type==='vivienda'),terms=housingTerms(s,city),properties=s.businesses.filter(b=>b.type==='vivienda'&&b.city===city);return `<div class="housing-city"><b>${esc(CITY_BY_ID[city].name)}</b><div class="small">${staff} trabajadores hoy · ${p.beds} viviendas disponibles · Oferta laboral ${p.available} · Plantilla de capacidad instalada ${p.required}</div>${homes.length?`<p class="small">Alojados: ${homes.reduce((n,l)=>n+l.employeeOccupied,0)} empleados y ${homes.reduce((n,l)=>n+l.publicOccupied,0)} del público.</p>${select(city,'employee',terms)}${select(city,'public',terms)}`:''}${properties.map(b=>`<p class="small">${esc(businessName(b))}: ${isOperating(s,b)?`${housingSpec(b).units} viviendas · mantenimiento ${money(housingSpec(b).upkeep)}/mes · renovación en ${Math.max(0,(b.renewalMonth??s.month+180)-s.month)} meses (${moneyShort(renovationCost(b))} estimados)`:`🏗️ entrega en ${b.readyMonth-s.month} meses`}</p>`).join('')}${p.missingBeds?`<p class="small warn">Faltan ${p.missingBeds} viviendas para la capacidad instalada.</p>`:''}${housingBuildButtons(s,city,'housing-open')}</div>`;}).join('')}
 </div>`;
}
function housingBuildButtons(s,city,act='open') {
 return Object.entries(HOUSING_FORMS).filter(([id])=>id!=='legacy').map(([id,f])=>{const ok=canOpen(s,'vivienda',city,'propia',id);return `<div class="housing-project"><img class="biz-icon" src="${imageUrl(f.sprite)}" alt=""><div><b>${esc(f.name)}</b><p class="small">12 meses de obra · ${money(f.upkeep)}/mes de mantenimiento · moral +${f.moral} con toda la plantilla alojada aquí · renovación del 20 % cada 15 años.${id==='chalets'?' Alquiler por vivienda ×1,5.':''}</p><button class="btn small primary" data-act="${act}" data-type="vivienda" data-mode="propia" data-form="${id}" data-city="${city}" ${ok.ok?'':'disabled'} title="${esc(ok.msg||'')}">Construir (${moneyShort(openingCost(s,'vivienda','propia',city,id))})</button></div></div>`}).join('');
}
function renderEuropeanGoal(s) {
 if(s.campaign!=='europe')return '';
 const p=europeProgress(s,patrimonio(s));return `<div class="card european-goal"><h3>🇪🇺 El imperio económico europeo</h3><p class="small">Campaña continua: la empresa pasa a sus sucesores. Sin límite de ocho años.</p><div class="chips"><span class="chip">Patrimonio ${moneyShort(p.wealth)} / 1.000 M€</span><span class="chip">Países propios ${p.countries}/8</span><span class="chip">Banca, telecom y logística ${p.sectors}/3</span></div></div>`;
}

// ---------------------------------------------------------------- Plantilla
export function renderStaff(s) {
  const r = previewCache(s).base.f.r; // la plantilla de ahora (con lo abierto o vendido este mes)
  const locked = s.flags.forcedLegal > 0;
  const liq = liquidacion(s);
  const agr = Math.round(s.agravio || 0);
  return `<div class="card kpis">
      <div><span class="muted small">Empleados</span><b>${r.employees}</b></div>
      <div><span class="muted small">Coste medio</span><b>${money(averageWage(s))}</b></div>
      <div><span class="muted small">Moral</span><b>${Math.round(s.moral)}</b></div>
      <div><span class="muted small">Control</span><b>${Math.round(r.control * 100)} %</b></div>
      <button type="button" class="kpi-btn" data-act="explain" data-stat="agravio" title="¿Por qué?"><span class="muted small">Agravio</span><b class="${agr >= PK.STRIKE_AT ? 'neg' : ''}">${agr}</b>${meterBar(agr)}</button>
    </div>
    ${liq > 0 ? `<div class="card warn">🧮 Deuda latente con la Seguridad Social: <b>${money(liq)}</b>. Es lo que Marisa liquidaría hoy (lo ahorrado frente al convenio en los últimos ${PK.LIQ_WINDOW} meses, ×${(PK.LIQ_K * difficultyOf(s).fines).toFixed(2).replace('.', ',')}); lo más antiguo prescribe.${ssOwed(s) > 0 ? ` Aplazamiento pendiente: ${money(ssOwed(s))}.` : ''}</div>` : ''}
    ${locked ? `<div class="card warn">⚖️ ${s.flags.forcedBy === 'convenio' ? 'Por el convenio firmado' : 'Tras la inspección'}, durante ${s.flags.forcedLegal} ${s.flags.forcedLegal === 1 ? 'mes' : 'meses'} más solo puedes aplicar condiciones legales.</div>` : ''}
    ${renderComite(s, r)}
    <div class="card">
      <p class="small muted">Las condiciones "emprendedoras" abaratan costes, pero bajan la moral y encienden el radar de la Inspección de Trabajo. Las plantillas grandes llaman más la atención.</p>
      ${policyGroup(s, 'salario', POLICIES.salario, locked)}
      ${policyGroup(s, 'horas', POLICIES.horas, locked)}
      ${policyGroup(s, 'becarios', POLICIES.becarios, locked)}
      <p class="small"><a href="#" data-act="tab" data-tab="viviendas">Viviendas y alquileres</a> · <a href="#" data-act="tab" data-tab="beneficios">Beneficios y reparto</a> · <a href="#" data-act="tab" data-tab="direccion">Equipo directivo</a></p>
      ${pvFootnote(s)}
    </div>`;
}

export function renderBenefits(s) {
 const r=previewCache(s).base.f.r;
 return `<div class="card"><h3>🎁 Beneficios para la plantilla</h3>
      ${policyGroup(s, 'reparto', POLICIES.reparto)}
      ${policyGroup(s,'residencia',POLICIES.residencia,!s.businesses.some(b=>b.type==='residencia'))}
      <p class="small">Beneficio asistencial usado: <b>${Math.floor(r.residenceBenefit.beneficiaries)}</b> familiares · descuentos ${money(r.residenceBenefit.discount)}/mes · moral +${r.residenceBenefit.moral.toFixed(1).replace('.',',')}/mes. ${s.businesses.some(b=>b.type==='residencia')?'':'Necesitas una residencia propia.'}</p>
      <p class="small muted">El agravio sube con el beneficio por cabeza (en sueldos de lo que cobran), los caprichos y la Bolsa. Resta moral cada mes y, con comité, trae huelgas generales. Repartir lo alivia y es deducible.</p>
      ${pvFootnote(s)}</div>`;
}
export function renderResidences(s) {
 const r=previewCache(s).base.f.r;
 return renderHousing(s,r);
}
export function renderManagement(s) {return renderExecs(s);}

const meterBar = (v) => `<div class="meter ${v >= PK.STRIKE_AT ? 'hot' : v >= 30 ? 'warm' : 'good'}"><span style="width:${Math.round(Math.min(100, v))}%"></span></div>`;

function renderComite(s, r) {
  const c = s.comite;
  if (!c) return '';
  const fecha = (m) => dateLabel(m).toLowerCase().replace(' ', ' de ');
  let next = c.nextConvenio;
  while (next % 12 !== 2) next++;
  const d = convenioDemand(s);
  const ratio = s.plantilla?.ratio ?? profitRatio(s, r);
  const cred = credibilidad(s);
  return `<div class="card comite"><div class="row gap"><img src="${imageUrl('portrait_empleada_maripili')}" class="portrait-sm" alt="">
    <div class="grow"><h4>Comité de empresa</h4><div class="small muted">Presidenta: Maripili. Desde ${fecha(c.since)}.</div></div></div>
    <table class="tbl pl small">
      <tr><td>Beneficio por cabeza</td><td>${ratio.toFixed(1).replace('.', ',')} sueldos/mes</td></tr>
      <tr><td>Plus del convenio de empresa</td><td>${c.plus > 0 ? `+${(c.plus * 100).toFixed(1).replace('.', ',')} %` : '—'}</td></tr>
      <tr><td>Paz social</td><td>${c.paz > 0 ? `${c.paz} ${c.paz === 1 ? 'mes' : 'meses'}` : 'no'}</td></tr>
      <tr><td>Próxima revisión</td><td>${fecha(next)} · hoy pedirían ${d > 0 ? `un ${(d * 100).toFixed(1).replace('.0', '').replace('.', ',')} %` : 'nada'}</td></tr>
      ${c.prometido != null ? `<tr><td>Promesa pendiente</td><td class="warn">«El año que viene, sin falta» (${fecha(c.prometido)})</td></tr>` : ''}
      <tr><td>Huelgas generales</td><td>${c.huelgas || 0}</td></tr>
      ${cred < 1 ? `<tr><td>Credibilidad</td><td class="neg">${Math.round(cred * 100)} % (promesas rotas)</td></tr>` : ''}
    </table>
  </div>`;
}

function renderExecs(s) {
  const next = CANDIDATE_REFRESH - (s.month - (s.candidatesMonth ?? 0));
  return `<div class="card"><h4>Equipo directivo</h4>
    <p class="small muted">Directivos con nombre y apellidos (y manías). La headhunter cobra un mes de sueldo; despedir cuesta tres. Nuevos currículums en ${Math.min(CANDIDATE_REFRESH, Math.max(1, next))} ${Math.max(1, next) === 1 ? 'mes' : 'meses'}.</p>
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
function renderCartilla(s) {
  const c = s.cartilla;
  if (!c) return '';
  const fecha = (m) => dateLabel(m).toLowerCase().replace(' ', ' de ');
  const n = s.flags.refranero ?? 0;
  const ask = canAsk(s);
  const max = ask.ok ? maxLoan(s) : 0;
  const rows = c.entradas.slice(-6).reverse().map((e) => `<tr><td>${esc(dateLabel(e.m).slice(0, 3))} ${String(dateLabel(e.m)).slice(-2)}</td><td>${esc(e.concepto)}<div class="refran">«${esc(e.refran)}»</div></td><td class="${e.haber ? 'pos' : e.debe ? 'neg' : ''}">${e.haber ? `+${moneyShort(e.haber)}` : e.debe ? `−${moneyShort(e.debe)}` : '—'}</td></tr>`).join('');
  const state = c.embargo
    ? `<p class="small warn">🥘 Embargo materno: tu madre se queda lo que vende el mostrador de Selaya (${c.embargo.months} ${c.embargo.months === 1 ? 'mes' : 'meses'} más). Le debes ${money(c.owed)}.</p>`
    : c.owed > 0
      ? `<p class="small">Le debes <b>${money(c.owed)}</b>, sin intereses. Vence en ${fecha(c.due)}.</p>
         <div class="pv-chips">${(c.conds || []).map((k) => `<span class="pv-chip" title="${esc(condDesc(k))}">🤝 ${esc(COND_TEXT[k])}</span>`).join('')}</div>`
      : '';
  return `<div class="card cartilla"><h4>${artOr('portrait_madre', '👵', 'emoji')} La cartilla de Doña Remedios</h4>
    <div class="libreta-head small">Caja Cantábrica · Titular: Remedios Boomerez · Saldo: <b>${money(c.saldo)}</b></div>
    <div class="small">Confianza en su hijo: <b>${Math.round(c.confianza)}</b>/100</div>
    ${bar(c.confianza, 100, c.confianza < MAMA.MIN_CONF ? 'danger' : 'ok')}
    ${state}
    ${rows ? `<table class="tbl libreta small"><tbody>${rows}</tbody></table>` : '<p class="small muted">Sin movimientos. Tu madre presta sin intereses, pero siempre con una condición.</p>'}
    <div class="row gap wrap">
      ${c.owed > 0 ? `<button class="btn small" data-act="mama-repay" ${c.embargo ? 'disabled' : ''}>Devolverle ${moneyShort(c.owed)}</button>` : `
      <button class="btn small" data-act="mama-ask" data-amount="20000" ${ask.ok && max >= 20000 ? '' : 'disabled'}>Pedirle 20 k€</button>
      <button class="btn small" data-act="mama-ask" data-amount="50000" ${ask.ok && max >= 50000 ? '' : 'disabled'}>Pedirle 50 k€</button>
      <button class="btn small" data-act="mama-ask" data-amount="max" ${ask.ok ? '' : 'disabled'}>Lo que pueda${ask.ok ? ` (${moneyShort(max)})` : ''}</button>`}
    </div>
    ${!c.owed && !ask.ok ? `<p class="small muted">${esc(ask.msg)}</p>` : ''}
    <p class="small muted">📖 Refranero: ${n}/${REFRAN_COUNT}</p>
  </div>`;
}

export function renderFinance(s) {
  const r = s.lastReport;
  const limit = creditLimit(s);
  let html = renderEuropeanGoal(s)+`<div class="card kpis">
    <div><span class="muted small">Caja</span><b class="${cls(s.cash)}">${moneyShort(s.cash)}</b></div>
    <div><span class="muted small">Deuda</span><b>${moneyShort(s.debt)}</b></div>
    <div><span class="muted small">Límite de crédito</span><b>${moneyShort(limit)}</b></div>
    <div><span class="muted small">Cuota "optimizada"</span><b class="${s.evaded > 0 ? 'neg' : ''}">${moneyShort(haciendaDebt(s))}</b></div>
  </div>
  <div class="card"><h4>Caja Cantábrica · Póliza de crédito</h4>
    <p class="small muted">Interés del ${((difficultyOf(s).interest + macroFx(s).interest) * 100).toFixed(2).replace('.', ',')} % mensual. Si te quedas en descubierto, el banco tira de la póliza automáticamente. Si no queda margen durante 3 meses: concurso de acreedores.</p>
    ${bar(s.debt, limit, s.debt / limit > 0.8 ? 'danger' : '')}
    <div class="row gap wrap">
      <button class="btn small" data-act="borrow" ${s.debt + 1 > limit ? 'disabled' : ''}>Pedir ${moneyShort(LOAN_STEP)}</button>
      <button class="btn small" data-act="borrow" data-amount="100000" ${s.debt + 1 > limit ? 'disabled' : ''}>Pedir 100 k€</button>
      <button class="btn small ghost" data-act="repay" ${s.debt <= 0 || s.cash <= 0 ? 'disabled' : ''}>Devolver ${moneyShort(LOAN_STEP)}</button>
      <button class="btn small ghost" data-act="repay" data-amount="all" ${s.debt <= 0 || s.cash <= 0 ? 'disabled' : ''}>Devolver todo</button>
    </div>
  </div>
  ${renderCartilla(s)}`;
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
      ${c.mantenimiento ? `<tr><td>Mantenimiento</td><td class="neg">−${money(c.mantenimiento)}</td></tr>` : ''}
      ${c.renovaciones ? `<tr><td>Renovaciones inmobiliarias (ciclo de 15 años)</td><td class="neg">−${money(c.renovaciones)}</td></tr>` : ''}
      ${c.directivos ? `<tr><td>Directivos</td><td class="neg">−${money(c.directivos)}</td></tr>` : ''}
      ${c.estructura ? `<tr><td title="Oficinas, gestorías y abogados: crece más deprisa que el número de negocios. Operaciones lo reduce.">Estructura central</td><td class="neg">−${money(c.estructura)}</td></tr>` : ''}
      <tr><td>Materias primas</td><td class="neg">−${money(c.materias)}</td></tr>
      ${c.transporte ? `<tr><td>Transporte</td><td class="neg">−${money(c.transporte)}</td></tr>` : ''}
      <tr><td>Alquileres</td><td class="neg">−${money(c.alquileres)}</td></tr>
      <tr><td>Otros gastos</td><td class="neg">−${money(c.otros)}</td></tr>
      ${c.asesores ? `<tr><td>Asesores</td><td class="neg">−${money(c.asesores)}</td></tr>` : ''}
      ${c.personales ? `<tr><td>Gastos personales de Manolo</td><td class="neg">−${money(c.personales)}</td></tr>` : ''}
      ${c.intereses ? `<tr><td>Intereses</td><td class="neg">−${money(c.intereses)}</td></tr>` : ''}
      ${c.reparto ? `<tr><td title="Paga de beneficios o participación: un porcentaje del beneficio antes de impuestos.">Reparto con la plantilla</td><td class="neg">−${money(c.reparto)}</td></tr>` : ''}
      <tr><td>Impuesto de Sociedades</td><td class="neg">−${money(r.tax)}</td></tr>
      <tr class="total"><td>Resultado neto</td><td class="${cls(r.net)}">${signed(r.net)}</td></tr>
    </table>${r.evaded > 0 ? `<p class="small warn">Este mes has "optimizado" ${money(r.evaded)} de impuestos.</p>` : ''}</div>`;
  }
  if (s.extraMonthly.length) {
    html += `<div class="card"><h4>Gastos fijos extra</h4><ul class="perk-list">
      ${s.extraMonthly.map((x, i) => `<li class="perk"><div class="grow"><b>${esc(x.label)}</b> <span class="muted small">${money(x.amount)}/mes${x.months != null ? ` · ${x.months} ${x.months === 1 ? 'mes' : 'meses'} más` : ''}</span></div>
        ${x.locked ? `<span class="tag" title="${x.kevin ? 'Condición de tu madre: se va cuando le devuelvas el préstamo.' : 'Aplazamiento con la Seguridad Social: no se puede quitar.'}">🔒</span>` : `<button class="btn small ghost" data-act="drop-cost" data-index="${i}">Quitar</button>`}</li>`).join('')}
    </ul></div>`;
  }
  html += `<div class="card">${policyGroup(s, 'contabilidad', POLICIES.contabilidad)}${pvFootnote(s)}</div>
  <div class="card">${policyGroup(s, 'mantenimiento', POLICIES.mantenimiento)}
    <p class="small muted">Cada local tiene un estado de conservación: los descuidados venden menos (hasta un −25 %) y pueden sufrir averías. Una reforma los deja como nuevos.</p></div>
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

function renderPromesa(s) {
  const ipo = bolsaState(s);
  if (!ipo) return '';
  const pr = quarterProgress(s);
  const mine = grossPatrimonio(s) * (1 - ipo.float);
  const sent = (ipo.sent ?? 1).toFixed(2).replace('.', ',');
  const last = ipo.lastResult ? `<p class="small ${ipo.lastResult.ok ? 'pos' : 'neg'}">Último trimestre (${qLabel(ipo.lastResult.qi)}): ${ipo.lastResult.ok ? 'cumpliste' : 'no llegaste'} (${moneyShort(ipo.lastResult.real)} de ${moneyShort(ipo.lastResult.target)}).</p>` : '';
  const pend = (ipo.maquillajes || []).filter((x) => !x.descubierto).length;
  return `<div class="promesa"><h4>📈 La promesa del trimestre</h4>
    ${pr ? `<div class="small">${qLabel(pr.qi)} · guía «${esc(GUIAS[ipo.q.guia]?.label ?? ipo.q.guia)}»: objetivo <b>${moneyShort(pr.target)}</b>. Llevas ${moneyShort(pr.closed)} y con lo que se espera irías al <b class="${pr.ratio >= 1 ? 'pos' : 'neg'}">${Math.round(pr.ratio * 100)} %</b>.</div>${bar(Math.min(pr.est, pr.target), Math.max(1, pr.target), pr.ratio >= 1 ? 'ok' : 'danger')}` : '<p class="small muted">Al cerrar cada trimestre darás una guía para el siguiente.</p>'}
    ${last}
    <div class="small">Credibilidad ante los analistas: <b>${Math.round(ipo.cred ?? 50)}</b>/100 · Sentimiento del mercado: <b>×${sent}</b>${ipo.racha >= 2 ? ` · ${ipo.racha} promesas cumplidas seguidas` : ''}</div>
    <div class="small">Tu ${Math.round((1 - ipo.float) * 100)} % vale hoy <b>${moneyShort(mine * (ipo.sent ?? 1))}</b> (sentimiento ×${sent}).</div>
    ${pend ? `<p class="small warn">🧟 Cadáveres en el armario: ${pend}. Cada cierre de trimestre (y cada auditoría) pueden salir a la luz.</p>` : ''}
  </div>`;
}

function renderIPO(s) {
  const equity = grossPatrimonio(s);
  if (s.ipo) {
    const p = s.ipo.price;
    return `<div class="card"><h4>🔔 Boomerez S.A. en Bolsa</h4>
      <div class="kpis"><div><span class="muted small">Cotización</span><b class="${p >= 100 ? 'pos' : 'neg'}">${p.toFixed(1).replace('.', ',')} €</b></div>
      <div><span class="muted small">Máximo</span><b>${s.ipo.peak.toFixed(1).replace('.', ',')} €</b></div></div>
      <p class="small muted">Salió a 100 €. Los accionistas tienen el ${Math.round(s.ipo.float * 100)} % de la empresa, así que tu patrimonio es el ${Math.round((1 - s.ipo.float) * 100)} % del total, al precio que diga el mercado. Si el sentimiento baja a 0,90, habrá junta de accionistas furiosa.</p>
      ${renderPromesa(s)}
      ${inLockup(s) ? `<p class="small warn">🔒 Periodo de bloqueo: la revista de millonarios no te saca hasta ${dateLabel(lockupEnd(s)).toLowerCase().replace(' ', ' de ')}.</p>` : ''}
    </div>`;
  }
  const ok = canIPO(s, equity);
  const val = companyValuation(s, equity);
  return `<div class="card"><h4>🔔 Salir a Bolsa</h4>
    <p class="small">Vendes el ${Math.round(IPO_FLOAT * 100)} % de la empresa a inversores. Valoración estimada hoy: <b>${moneyShort(val)}</b>: mitad lo que hay en libros y mitad 6 veces el beneficio de los últimos 12 meses (${moneyShort(annualProfit(s))}), por la prima de mercado ×${ipoPremium(s).toFixed(2).replace('.', ',')}. Recibirías unos <b>${moneyShort(val * IPO_FLOAT * 0.96)}</b> tras comisiones.</p>
    <p class="small muted">Requiere una valoración de empresa de al menos <b>1.000 M€</b> y tres años de cuentas. Después hay ${IPO_LOCKUP} meses de bloqueo.</p>
    <p class="small muted">Truco de tiburón: en plena burbuja, con mucha fama, los inversores pagan más de lo que vale. Después tendrás que dar explicaciones cada vez que caiga la acción.</p>
    <button class="btn small primary" data-act="ipo" ${ok.ok ? '' : 'disabled'}>Salir a Bolsa</button>
    ${ok.ok ? '' : `<div class="small muted">${esc(ok.msg)}</div>`}
  </div>`;
}

function renderAdvice(s) {
  const tips = advice(s);
  if (!tips.length) return '<div class="card advice"><h4>📋 Informe de Paco</h4><p class="small">"Todo en orden, Manolo. Sospechosamente en orden."</p></div>';
  return `<div class="card advice"><h4>📋 Informe de Paco, tu gestor</h4><ul>
    ${tips.map((t) => `<li class="tip ${t.level}">${t.tab ? `<a href="#" data-act="tab" data-tab="${t.tab}">` : ''}${esc(t.text)}${t.tab ? '</a>' : ''}</li>`).join('')}
  </ul></div>`;
}

export const CAT_COLORS = { finanzas:'#315f7b',infraestructura:'#7163aa',logistica:'#598267', sobaos: '#e8a33a', hosteleria: '#d4402b', inmobiliario: '#2f8fc4', servicios: '#16a085', formacion: '#7a4fa0' };
export const CAT_LABELS = { finanzas:'Banca',infraestructura:'Telecomunicaciones',logistica:'Logística', sobaos: 'Sobaos', hosteleria: 'Hostelería', inmobiliario: 'Inmobiliario', servicios: 'Servicios', formacion: 'Formación' };

// Áreas apiladas de ingresos por sector y línea de beneficio neto.
export function drawCategoryChart(canvas, s) {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 300;
  const h = 170;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.height = `${h}px`;
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
  canvas.style.height = `${h}px`;
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
      <img src="${imageUrl(s.dynasty?.generation?s.dynasty.portrait:`portrait_manolo_${mood}`)}" alt="Dirigente" class="portrait-lg">
      <div class="grow">
        <h3>${esc(s.dynasty?.name||'Manolo Boomerez')}</h3>
        <div class="small muted">${leaderAge(s)} años · Generación ${(s.dynasty?.generation||0)+1} · Dirección del grupo</div>
        <div class="chips">
          <span class="chip">📣 Fama: <b>${Math.round(s.fama)}</b></span>
          <span class="chip">⚖️ Expedientes: <b>${s.expedientes}/3</b></span>
          <span class="chip" title="Con este código, otra persona puede jugar la misma partida (menú → semilla).">🎲 <b>${seedCode(s.seed)}</b>${s.flags.reto ? ` · reto ${esc(s.flags.reto)}` : ''}</span>
          <span class="chip" title="Sube con el tamaño del imperio, LinkedIn y el bar; baja con Marbella, la familia, el pádel y un buen equipo directivo. Por encima de 80, susto. Tres meses por encima de 90 pueden provocar un fallecimiento; el reposo protege. A los 80 años toma el mando un sucesor.">🫀 Estrés: <b class="${(s.estres ?? 20) > 70 ? 'neg' : ''}">${Math.round(s.estres ?? 20)}</b></span>
        </div>
        <blockquote>"${esc(s.quote || 'Yo a vuestra edad ya tenía un Audi.')}"</blockquote>
      </div>
    </div>
    <div class="card"><h4>Acción del mes ${s.actionUsed ? '<span class="tag">Hecha</span>' : ''}${s.restMonths > 0 ? `<span class="tag">Reposo: ${s.restMonths} m</span>` : ''}</h4>
      <p class="small muted">La dirección puede hacer una cosa al mes. Las demás las hace la plantilla.</p>
      <div class="actions">
        ${MANOLO_ACTIONS.map((a) => `<button class="action" data-act="manolo" data-id="${a.id}" ${s.actionUsed || s.restMonths > 0 || (a.cost && s.cash < a.cost) ? 'disabled' : ''}>
          ${artOr(a.icon, a.emoji)}<span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span></button>`).join('')}
      </div>
    </div>
    ${renderEuropeanGoal(s)}
    ${s.campaign==='europe'?`<div class="card"><h4>📜 Sucesión del imperio</h4><p class="small">Sucesor designado: <b>${esc(successor(s,'designado').name)}</b>. El nombramiento evita improvisar un relevo. La empresa conserva todos sus activos.</p><div class="row gap wrap">${(s.dynasty?.generation?['profesional','familia','plantilla']:['vanessa','kevin','profesional','plantilla']).map(key=>`<button class="btn small" data-act="heir-name" data-heir="${key}">${esc(successor(s,key).name)}</button>`).join('')}</div>${(s.dynasty?.history||[]).map(h=>`<p class="small">${esc(h.name)} · ${h.age} años · ${esc(h.cause)}</p>`).join('')}</div>`:''}
    ${renderRetire(s)}
    ${renderClause(s)}
    ${renderBio(s)}
    ${s.flags.founderGone?'':renderFamily(s)}
    ${renderLujos(s)}
    <div class="card"><h4>Logros (${unlockedCount()}/${ACHIEVEMENTS.length})</h4>
      <p class="small muted">Se guardan en este navegador entre partidas.</p>
      <div class="achievements">
        ${ACHIEVEMENTS.map((a) => `<div class="ach ${isUnlocked(a.id) ? 'on' : ''}" title="${esc(a.desc)}"><span class="emoji">${isUnlocked(a.id) ? a.emoji : '🔒'}</span><span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span></div>`).join('')}
      </div>
    </div>`;
}

// «Vuelta a Selaya»: aparece a partir del mes 72; el botón explica por qué no se puede todavía.
function renderRetire(s) {
  if ((s.campaign==='europe'?leaderAge(s)<60:s.month<RETIRE_MONTH) || s.ending) return '';
  const ok = canRetire(s);
  if(s.campaign==='europe')return `<div class="card"><h4>📜 Relevo voluntario</h4><p class="small">Deja la dirección a tu sucesor; la campaña continúa con el mismo imperio.</p><button class="btn small" data-act="retire" ${ok.ok?'':'disabled'} title="${esc(ok.msg||'')}">Ceder el mando</button></div>`;
  return `<div class="card"><h4>🏡 Vuelta a Selaya</h4>
    <p class="small">Deja el imperio y vuelve al obrador de tu padre. La partida termina con la puntuación de hoy; la cláusula del testamento no se cobra.</p>
    <button class="btn small" data-act="retire" ${ok.ok ? '' : `disabled title="${esc(ok.msg)}"`}>Retirarse a Selaya</button>
    ${ok.ok ? '' : `<p class="small muted">${esc(ok.msg)}</p>`}
  </div>`;
}

// Biografía no autorizada: los hitos de la partida en orden.
function renderBio(s) {
  const hs = allHitos(s).sort((a, b) => a.m - b.m);
  if (!hs.length) return '';
  const heir = HEIR_LABEL(s);
  return `<div class="card bio"><h4>📖 Biografía no autorizada</h4>
    <ul class="timeline small">${hs.map((h) => `<li><span class="muted">${esc(dateLabel(h.m))}</span> ${esc(h.label)}</li>`).join('')}</ul>
    ${heir ? `<p class="small muted">Heredero: <b>${esc(heir)}</b>.</p>` : ''}
  </div>`;
}

// Ventana del final: ¿qué fue de...?, la carta de Manolo y la crónica (plegadas en móvil).
export function renderEpilogue(s) {
  const narrow = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 600px)').matches;
  const people = epilogue(s);
  const row = (p) => `<li><img src="${imageUrl(p.portrait)}" alt="" class="epi-portrait"><div><b>${esc(p.name)}</b><div class="small">${esc(p.text)}</div></div></li>`;
  const shown = people.slice(0, MAX_VISIBLE);
  const rest = people.slice(MAX_VISIBLE);
  const block = (title, body, open = false) => (narrow ? `<details class="digest" ${open ? 'open' : ''}><summary>${title}</summary>${body}</details>` : `<h4>${title}</h4>${body}`);
  const crono = cronica(s);
  let html = block('¿Qué fue de...?', `<ul class="epilogue">${shown.map(row).join('')}</ul>${rest.length ? `<details><summary class="small">Ver todos (${rest.length} más)</summary><ul class="epilogue">${rest.map(row).join('')}</ul></details>` : ''}`, true);
  html += block('La carta de Manolo', `<div class="carta">${carta(s).map((t) => `<p>${esc(t)}</p>`).join('')}</div>`);
  if (crono.length) html += block('Crónica', `<ul class="timeline small">${crono.map((h) => `<li><span class="muted">${esc(h.date)}</span> ${esc(h.label)}</li>`).join('')}</ul>`);
  return html;
}

function renderClause(s) {
  const c = clauseStatus(s);
  if (!c) return '';
  const tag = { vigente: '<span class="tag">En vigor</span>', rota: '<span class="tag bad">Rota</span>', cerrada: '<span class="tag">No cumplida</span>', cumplida: '<span class="tag good">Cumplida</span>' }[c.state];
  const prize = `puntuación ×${String(c.def.mult).replace('.', ',')} y el prado de Vega de Pas con 40 vacas pasiegas (${moneyShort(CLAUSE_PRIZE)})`;
  const status = {
    vigente: `${esc(c.short)}. Si terminas la partida (pyme, tiburón o revista) cumpliéndola: ${prize}.`,
    rota: `La rompiste en ${dateLabel(s.clausula.brokenMonth ?? s.month).toLowerCase().replace(' ', ' de ')}. Las vacas, para la Cofradía.`,
    cumplida: `Cumplida en ${dateLabel(s.clausula.doneMonth ?? s.month).toLowerCase().replace(' ', ' de ')}: ${prize}.`,
    cerrada: 'La partida terminó sin cumplirla. El prado y las vacas se quedan en la notaría.',
  }[c.state];
  return `<div class="card clause ${c.state}"><h4>${hasArt('icon_clausula') ? `<img src="${imageUrl('icon_clausula')}" alt="" class="h4-icon">` : '📜'} La cláusula del testamento ${tag}</h4>
    <p class="small"><i>"${esc(c.def.notary)}"</i></p>
    <p class="small"><b>${esc(c.def.title)}:</b> ${esc(c.def.rule)}</p>
    <p class="small muted">${status}</p>
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
// El Archivo de la casa: las carpetas (lo que la partida recuerda) y la hemeroteca. En el móvil, una carpeta
// abierta cada vez, y se recuerda cuál entre repintados.
let archivoOpen = null;
export const setArchivoOpen = (id) => {
  archivoOpen = id;
};
export function renderNews(s) {
  const narrow = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 600px)').matches;
  const folders = codex(s).map((f, i) => {
    if (!f.unlocked) return `<div class="folder locked small muted">🔒 ${esc(f.title)}${f.notes ? ` · ${esc(f.notes)}` : ''}</div>`;
    const rows = f.rows.map((r) => `<tr><td>${esc(r.label)}</td><td class="${r.tone || ''}">${esc(r.value)}</td></tr>`).join('');
    const open = narrow ? (archivoOpen ? archivoOpen === f.id : i === 0) : true;
    return `<details class="folder" data-folder="${f.id}" ${narrow ? 'name="archivo"' : ''} ${open ? 'open' : ''}><summary>${f.emoji} ${esc(f.title)}</summary>
      <table class="tbl pl small"><tbody>${rows}</tbody></table>${f.notes ? `<p class="small muted">${esc(f.notes)}</p>` : ''}</details>`;
  }).join('');
  const news = s.log.length
    ? `<ul class="news">${s.log.map((n) => `<li class="${n.tone}"><span class="muted small">${dateLabel(n.month)}</span> ${esc(n.text)}</li>`).join('')}</ul>`
    : '<p class="muted">Todavía no ha pasado nada digno de titular.</p>';
  return `<div class="card"><h4>🗂️ Carpetas</h4>${folders}</div>
    <div class="card"><h4>El Sobao Digital · Hemeroteca</h4>${news}</div>`;
}

export function cityOptions() {
  return CITIES;
}
