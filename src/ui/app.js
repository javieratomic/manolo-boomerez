import {nominateHeir} from '../core/dynasty.js';
import {researchPlan} from '../core/research.js';
import {renderResearchReview} from './research.js';
import {prepareOffline} from './offline.js';
import {portfolio,portfolioSelection,upgradeBatchPlan,upgradeBatch} from '../core/portfolio.js';
import {renderUpgradeReview} from './portfolio.js';
import {saleBatchPlan,saleBatch} from '../core/divestment.js';
import {renderSaleReview} from './divestment.js';
import {openingPlan,executeOpening} from '../core/opportunities.js';
import {renderOpeningReview} from './opportunities.js';
import {openOnline,upgradeOnline,toggleOnline,setOnlineShipping} from '../core/online.js';
import {campaignPlan,launchCampaignBatch,marketingTerritories,campaignSelection} from '../core/marketing.js';
import {setHousingPolicy} from '../core/housing.js';
import { signAgreement, endAgreement, agreementTerms } from '../core/international.js';
import { FOREIGN_BY_ID, DEAL_MODES } from '../data/international.js';
// Controlador principal de la interfaz.
import { $, esc, showModal, toast, confirmModal, isModalOpen, msSinceModal } from './dom.js';
import { TABS, renderCity, renderEmpire, renderMarket, renderResearch,renderMarketing,renderInternational,renderOnline,renderResidences,renderManagement,renderBenefits,renderStaff, renderFinance, renderManolo, renderNews, drawChart, drawCategoryChart, manoloMood, renderWhy, whyTitle, renderEpilogue, setArchivoOpen } from './panels.js';
import {groupForTab,renderNavigation} from './navigation.js';
import { macroFx } from '../core/macro.js';
import { MapView } from '../render/mapView.js';
import { initAssets, imageUrl, hasArt } from '../render/assets.js';
import { newGame, saveToStorage, loadFromStorage, clearStorage, serialize, deserialize, DIFFICULTIES, GAME_VERSION } from '../core/state.js';
import { seedCode, parseSeed, isoWeekKey, weekSeed } from '../core/seed.js';
import { advanceMonth, currentPending, resolvePending, checkEnding, score, pickQuote, retire } from '../core/sim.js';
import { patrimonio, estimateOpening } from '../core/economy.js';
import { openBusiness, sellBusiness, buyUpgrade, setPolicy, togglePerk, borrow, repay, doManoloAction, dropMonthlyCost, currentGoal, currentGoals, goalNumber, checkGoals, rebrand, canRebrand, franchiseFee, LOAN_STEP } from '../core/actions.js';
import { GOALS, LANES } from '../data/goals.js';
import { HELP_PAGES, helpChoices } from '../data/help.js';
import { play, isMuted, setMuted } from './sound.js';
import { startMusic, isMusicOn, setMusic } from './music.js';
import { checkAchievements } from './achievements.js';
import { loadRecords, addRecord } from './records.js';
import { actOnRival, acquireRival, acquisitionPrice } from '../core/rivals.js';
import { launchCampaign, startRD, upgradeBusiness, CAMPAIGN_BY_ID, PRODUCT_BY_ID } from '../core/market.js';
import { hireExec, fireExec, refreshCandidates, execOf, severance } from '../core/execs.js';
import { RIVALS } from '../data/rivals.js';
import { clauseStatus, clauseWarn } from '../core/clauses.js';
import { monthDigest, fmtDelta } from '../core/digest.js';
import { resultSnapshot, isMinorResult } from '../core/results.js';
import { askLoan, repayEarly } from '../core/cartilla.js';
import { collectRefranes } from './refranero.js';
import { resumePromises } from '../core/bolsa.js';
import { cityAlerts, ALERT_EMOJI } from '../core/mapInfo.js';
import { buyLujo, sellLujo, doIPO, IPO_FLOAT } from '../core/life.js';
import { LUJO_BY_ID } from '../data/lujo.js';
import { grossPatrimonio } from '../core/economy.js';
import { money, moneyShort, dateLabel, GAME_MONTHS, START_YEAR, log, custom } from '../core/helpers.js';
import { HQ_CITY, CITY_BY_ID } from '../data/cities.js';
import { BUSINESS_TYPES } from '../data/businesses.js';
import { endingOf,canContinueEnding } from '../data/endings.js';

const game = { s: null, tab: 'ciudad', city: HQ_CITY, map: null, busy: false };
window.__boomerez = game; // para depurar desde la consola

const BIG_TEXT_KEY = 'manolo-boomerez-big-text';

function setBigText(on) {
  document.body.classList.toggle('big-text', on);
  try {
    localStorage.setItem(BIG_TEXT_KEY, on ? '1' : '0');
  } catch {
    /* sin almacenamiento: solo para esta sesión */
  }
  if (game.map) requestAnimationFrame(() => game.map.resize());
}

export async function boot() {
  try {
    document.body.classList.toggle('big-text', localStorage.getItem(BIG_TEXT_KEY) === '1');
  } catch {
    /* sin almacenamiento */
  }
  await initAssets();
  setupTitle();
  bindGlobal();
  prepareOffline();
}

// ------------------------------------------------------------------ Título
function setupTitle() {
  $('.title-version').textContent = `v${GAME_VERSION}`;
  const title = $('#title-screen');
  if (hasArt('bg_title')) title.style.backgroundImage = `url(${imageUrl('bg_title')})`;
  if (hasArt('logo_game')) $('#title-logo').innerHTML = `<img src="${imageUrl('logo_game')}" alt="Manolo Boomerez S.L.">`;
  $('#title-portrait').src = imageUrl('portrait_manolo_smug');
  const saved = loadFromStorage();
  const cont = $('#btn-continue');
  cont.hidden = !saved;
  $('#continue-label').textContent=saved?.ending?'Ver desenlace':'Continuar';
  if (saved) cont.querySelector('small').textContent = `${dateLabel(saved.month)} · ${moneyShort(patrimonio(saved))}`;
  $('#btn-new').onclick = async () => {
    // Semilla opcional: el mismo código da la misma partida (para compartir retos).
    const code = $('#seed-input').value.trim();
    const seed = code ? parseSeed(code) : undefined;
    if (code && seed == null) {
      toast('Código de semilla no válido: letras y cifras, como mucho 1Z141Z3 (p. ej. 1ODLXA).', 'bad');
      return;
    }
    if (saved && !(await confirmModal('¿Empezar de cero?', 'Se perderá la partida guardada. Manolo no se arrepiente de nada, pero tú quizá sí.', 'Nueva partida'))) return;
    const diffs = Object.entries(DIFFICULTIES);
    const i = await showModal({
      title: 'Elige la dificultad',
      kicker: 'Nueva partida',
      portrait: 'portrait_manolo_smug',
      text: '"¿Dificultad? Para un tiburón como yo no existe la dificultad." — Manolo',
      choices: diffs.map(([, d], k) => ({ label: d.label, hint: d.desc, primary: k === 1 })),
      dismissable: true,
    });
    if (i < 0) return;
    clearStorage();
    startGame(newGame(seed, diffs[i][0]));
  };
  $('#btn-week').onclick = async () => {
    const key = isoWeekKey(new Date());
    const seed = weekSeed(key);
    const preview = newGame(seed, 'normal','classic');
    const clause = clauseStatus(preview);
    const text = `Esta semana (${key}) todo el mundo juega la misma partida: misma semilla, mismos sucesos si eliges lo mismo y la misma cláusula del testamento. Dificultad normal.\n\nCódigo: ${seedCode(seed)}${clause ? `\nCláusula: «${clause.def.title}» (${clause.def.rule})` : ''}\n\nCompara tu puntuación del Salón de la fama con la de tus amigos.`;
    if (!(await confirmModal('🗓️ Reto de la semana', text, 'Empezar'))) return;
    if (saved && !(await confirmModal('¿Empezar de cero?', 'Se perderá la partida guardada.', 'Empezar el reto'))) return;
    clearStorage();
    preview.flags.reto = key;
    startGame(preview);
  };
  cont.onclick = () => startGame(loadFromStorage());
  $('#btn-help').onclick = showHelp;
  $('#btn-records').onclick = showRecords;
}

function showRecords() {
  const list = loadRecords();
  const diff = (d) => DIFFICULTIES[d]?.label.split(' (')[0] || d;
  const html = list.length
    ? `<table class="tbl pl records"><thead><tr><th>#</th><th>Final</th><th>Patrimonio</th><th>Puntos</th></tr></thead><tbody>
        ${list.map((r, i) => `<tr><td>${i + 1}</td><td><b>${esc(r.title)}</b>${r.ending === 'selaya' ? ' <span title="Se retiró a Selaya">🏡</span>' : ''}${r.clausulaOk ? ' <span title="Cláusula del testamento cumplida">📜</span>' : ''}<div class="small muted">${esc(r.brand === 'maison' ? 'Maison' : 'Express')} · ${esc(diff(r.difficulty))} · ${r.months} meses · ${esc(r.date)}${r.seed ? ` · 🎲 ${esc(r.seed)}` : ''}${r.reto ? ` · reto ${esc(r.reto)}` : ''}</div></td><td>${moneyShort(r.patrimonio)}</td><td>${r.score.toLocaleString('es-ES')}</td></tr>`).join('')}
      </tbody></table>`
    : '<p>Todavía no has terminado ninguna partida. El salón está vacío, como la agenda de Manolo un lunes por la mañana.</p>';
  return showModal({ title: 'Salón de la fama', kicker: '🏆 Tus mejores imperios', html, wide: true, dismissable: true });
}

function showTitle() {
  $('#game').hidden = true;
  $('#title-screen').hidden = false;
  setupTitle();
}

function startGame(s) {
  game.s = s;
  game.marketingSelection={};
  game.panelScroll={};game.renderedPanel=null;game.lastTabs={};game.researchFilters={status:'pending',category:'all'};game.researchReviewOpen=false;
  game.empire={view:'summary',filters:{},selected:[],page:0,operation:'upgrade',openings:{}};game.portfolioReviewOpen=false;game.openingReviewOpen=false;
  game.finance={view:'balance',ids:[],items:null,operation:'upgrade',choice:null,quote:null};
  game.bubble = null;
  game.city = HQ_CITY;
  game.tab = 'ciudad';
  if (!s.quote) s.quote = pickQuote(s);
  // Solo en una partida nueva: al cargar no se toca el generador (la misma semilla debe dar la misma partida).
  if (s.candidatesMonth < 0) refreshCandidates(s);
  $('#title-screen').hidden = true;
  $('#game').hidden = false;
  if (!game.map) {
    game.map = new MapView($('#map'), {
      getState: () => game.s,
      onHover: (id, p) => showTip(id, p),
      onCityClick: (id) => {
        game.city = id;
        game.tab = 'ciudad';
        renderAll();
        document.body.classList.add('panel-open');
      },
      // La insignia de alertas abre la ciudad igual; tocar el mar cierra el panel en el móvil.
      onBadgeClick: (id) => {
        game.city = id;
        game.tab = 'ciudad';
        renderAll();
        document.body.classList.add('panel-open');
        const a = cityAlerts(game.s)[id]?.[0];
        if (a) toast(`${ALERT_EMOJI[a.kind] || '⚠️'} ${a.text}`, a.level >= 3 ? 'bad' : 'info', 3500);
      },
      onEmptyClick: () => document.body.classList.remove('panel-open'),
    });
  }
  game.map.select(HQ_CITY);
  requestAnimationFrame(() => game.map.resize());
  renderAll();
  processQueue();
}

// ------------------------------------------------------------------- Render
function renderAll() {
  const s = game.s;
  if (!s) return;
  if (s.cartilla) s.flags.refranero = collectRefranes(s.cartilla.entradas.map((e) => e.refran));
  renderHUD(s);
  renderTabs();
  renderPanel(s);
  renderManoloBox(s);
  renderGoal(s);
  game.map.dirty = true;
  saveToStorage(s);
  const fresh = checkAchievements(s);
  if (fresh.length) play('goal');
  // Si llegan muchos de golpe (p. ej. al importar una partida), un solo aviso.
  if (fresh.length > 2) toast(`🏆 ${fresh.length} logros nuevos (pestaña Manolo)`, 'good');
  else for (const a of fresh) toast(`🏆 Logro: ${a.name}`, 'good');
}

function hudItem(icon, emoji, label, value, extra = '', title = '', stat = '') {
  const img = hasArt(icon) ? `<img src="${imageUrl(icon)}" alt="">` : `<span class="emoji">${emoji}</span>`;
  const inner = `${img}<div><span class="hud-label">${label}</span><span class="hud-value">${value}</span>${extra}</div>`;
  // Los indicadores que se mueven solos se pueden tocar para ver por qué (en móvil no hay title).
  if (stat) return `<button type="button" class="hud-item" data-act="explain" data-stat="${stat}" title="${esc(`${title} Toca para ver por qué se mueve.`)}">${inner}</button>`;
  return `<div class="hud-item" title="${esc(title || label)}">${inner}</div>`;
}

function meter(v, danger = false) {
  return `<div class="meter ${danger ? (v > 66 ? 'hot' : v > 40 ? 'warm' : '') : v < 25 ? 'hot' : v < 45 ? 'warm' : 'good'}"><span style="width:${Math.round(v)}%"></span></div>`;
}

// Los indicadores del HUD. En pantallas estrechas solo se ven Fecha, Caja, Patrimonio, Moral y el radar
// más caliente; el resto (clase hud-secondary) está en la hoja «⋯».
function hudItems(s) {
  const pat = patrimonio(s);
  const hotT = s.heatTrabajo >= s.heatHacienda;
  const sec = (html) => html.replace('class="hud-item"', 'class="hud-item hud-secondary"');
  return `
    ${hudItem('icon_calendar', '📅', 'Fecha', `<span class="long">${dateLabel(s.month)}</span><span class="short">${dateLabel(s.month).slice(0, 3)} ${String(dateLabel(s.month)).slice(-2)}</span>`, `<span class="hud-sub">${s.endless || s.campaign==='europe' ? `Mes ${s.month + 1} · ♾️` : `Mes ${Math.min(s.month + 1, GAME_MONTHS)}/${GAME_MONTHS}`}</span>`)}
    ${hudItem('icon_cash', '💶', 'Caja', `<span class="${s.cash < 0 ? 'neg' : ''}">${moneyShort(s.cash)}</span>`, '', 'Dinero disponible. Si baja de cero, el banco tira de la póliza.')}
    ${sec(hudItem('icon_debt', '🏦', 'Deuda', moneyShort(s.debt), '', `Lo que debes a la Caja Cantábrica. Genera intereses cada mes.${s.cartilla?.owed > 0 ? ` Además debes ${money(s.cartilla.owed)} a tu madre.` : ''}`))}
    ${hudItem('icon_patrimonio', '🏰', 'Patrimonio', moneyShort(pat), '', 'Caja − deuda + valor del obrador, los negocios y los caprichos. Es lo que cuenta para los finales.')}
    ${sec(hudItem('icon_macro', macroFx(s).emoji, 'Economía', macroFx(s).label, '', macroFx(s).desc))}
    ${sec(hudItem('icon_rep', '⭐', 'Reputación', Math.round(s.rep), meter(s.rep), 'Imagen pública. Multiplica la demanda de todos tus negocios.', 'rep'))}
    ${hudItem('icon_moral', '🙂', 'Moral', Math.round(s.moral), meter(s.moral), 'Ánimo de la plantilla. Baja: peor servicio, denuncias y huelgas. Dos meses a 0: la plantilla se queda la empresa.', 'moral')}
    ${sec(hudItem('icon_fama', '📣', 'Fama', Math.round(s.fama), meter(s.fama), 'Lo conocido que es Manolo. Impulsa la Maison y la Academy. Se desvanece si no la alimentas.', 'fama'))}
    ${(hotT ? (x) => x : sec)(hudItem('icon_inspeccion', '🔎', 'Insp. Trabajo', Math.round(s.heatTrabajo), meter(s.heatTrabajo, true), 'Radar de la Inspección de Trabajo: cuanto más alto, más probable es una visita.', 'heatTrabajo'))}
    ${(hotT ? sec : (x) => x)(hudItem('icon_hacienda', '🏛️', 'Hacienda', Math.round(s.heatHacienda), meter(s.heatHacienda, true), 'Radar de Hacienda: cuanto más alto, más probable es una auditoría.', 'heatHacienda'))}`;
}

function renderHUD(s) {
  $('#hud').innerHTML = `
    <div class="hud-brand">${esc(s.brand === 'maison' ? 'Maison Boomerez' : 'Boomerez S.L.')}</div>
    ${hudItems(s)}
    <button class="btn small ghost hud-more" data-act="hud-more" aria-label="Todos los indicadores">⋯</button>
    <button class="btn small ghost hud-menu" data-act="menu" aria-label="Menú">☰</button>`;
}

function renderTabs() {
  const root=$('#tabs'),focused=document.activeElement;
  const focusTab=root.contains(focused)?focused.dataset.tab:null,focusGroup=root.contains(focused)?focused.dataset.group:null;
  game.lastTabs||={};game.lastTabs[groupForTab(game.tab).id]=game.tab;
  root.innerHTML=renderNavigation(game.tab);
  if(focusTab)root.querySelector(`[data-tab="${focusTab}"]`)?.focus({preventScroll:true});
  else if(focusGroup)root.querySelector(`[data-group="${focusGroup}"]`)?.focus({preventScroll:true});
}

function renderPanel(s) {
  const body = $('#panel-body');
  const active=document.activeElement;
  const focus=body.contains(active)?{act:active.dataset.act,value:active.dataset.value,key:active.dataset.key,id:active.dataset.id,city:active.dataset.city,mode:active.dataset.mode,view:active.dataset.view,operation:active.dataset.operation,direction:active.dataset.direction,start:active.selectionStart,end:active.selectionEnd}:null;
  const panel=game.tab==='ciudad'?`ciudad:${game.city}`:game.tab;
  game.panelScroll||={};
  if(game.renderedPanel&&!game.resetPanelScroll)game.panelScroll[game.renderedPanel]=body.scrollTop;
  const scroll=game.resetPanelScroll?0:game.panelScroll[panel]||0;game.resetPanelScroll=false;
  const map = {
    ciudad: () => renderCity(s, game.city),
    imperio: () => {
      const data=game.empire.view==='portfolio'?portfolio(s,game.empire.filters):null;
      if(data)game.empire.selected=portfolioSelection(data.rows,game.empire.selected,game.empire.operation);
      return renderEmpire(s,game.empire,data);
    },
    mercado: () => renderMarket(s),
    marketing:()=>renderMarketing(s,game.marketingSelection),
    rd:()=>renderResearch(s,game.researchFilters),
    exterior:()=>renderInternational(s),
    online:()=>renderOnline(s),
    viviendas:()=>renderResidences(s),
    direccion:()=>renderManagement(s),
    beneficios:()=>renderBenefits(s),
    plantilla: () => renderStaff(s),
    finanzas: () => renderFinance(s,game.finance),
    manolo: () => renderManolo(s),
    noticias: () => renderNews(s),
  };
  body.innerHTML = map[game.tab]();
  body.scrollTop = scroll;
  game.renderedPanel=panel;
  if(game.tab==='rd'&&['research-status','research-category','research-preview'].includes(focus?.act)){
    const controls=[...body.querySelectorAll(`[data-act="${focus.act}"]`)];
    (focus.act==='research-status'?controls.find(el=>el.dataset.value===focus.value):focus.act==='research-preview'?controls.find(el=>el.dataset.id===focus.id):controls[0])?.focus({preventScroll:true});
  }
  if(game.tab==='imperio'&&(focus?.act?.startsWith('portfolio-')||focus?.act?.startsWith('opening-')||focus?.act==='empire-view')){
    const controls=[...body.querySelectorAll(`[data-act="${focus.act}"]`)];
    const el=controls.find(x=>!x.disabled&&(!focus.key||x.dataset.key===focus.key)&&(!focus.id||x.dataset.id===focus.id)&&(!focus.city||x.dataset.city===focus.city)&&(!focus.mode||x.dataset.mode===focus.mode)&&(!focus.view||x.dataset.view===focus.view)&&(!focus.operation||x.dataset.operation===focus.operation)&&(!focus.direction||x.dataset.direction===focus.direction))||controls.find(x=>!x.disabled);
    el?.focus({preventScroll:true});
    if(el&&['portfolio-search','opening-search'].includes(focus.act)&&focus.start!=null)el.setSelectionRange(focus.start,focus.end);
  }
  if(game.tab==='finanzas'&&['finance-view','stress-current','portfolio-stress','opening-stress','opening-review'].includes(focus?.act)){
    body.querySelector(`[data-act="finance-view"][data-view="${focus.act==='finance-view'?focus.view:'stress'}"]`)?.focus({preventScroll:true});
  }
  if(game.tab==='imperio'&&focus?.act==='stress-portfolio')body.querySelector('[data-act="empire-view"][data-view="portfolio"]')?.focus({preventScroll:true});
  if(game.tab==='imperio'&&focus?.act==='stress-opening')body.querySelector('[data-act="empire-view"][data-view="openings"]')?.focus({preventScroll:true});
  if (game.tab === 'finanzas') drawChart($('#chart'), s);
  if (game.tab === 'imperio') drawCategoryChart($('#chart-cat'), s);
  const btn = $('#end-month');
  btn.disabled = game.busy || !!s.ending || s.pending.length > 0;
  btn.innerHTML = `Cerrar ${esc(dateLabel(s.month))} <span>▶</span>`;
}

function showTip(id, p) {
  const tip = $('#map-tip');
  const s = game.s;
  if (!id || !s || isModalOpen()) {
    tip.hidden = true;
    return;
  }
  const c = CITY_BY_ID[id];
  const here = s.businesses.filter((b) => b.city === id);
  const lines = s.lastReport?.lines.filter((l) => l.city === id) || [];
  const profit = lines.reduce((a, l) => a + l.revenue - l.cost, 0);
  tip.innerHTML = `<b>${esc(c.name)}</b> <span class="muted">${esc(c.region)}</span>
    <div>${here.length || c.hq ? `${here.length + (c.hq ? 1 : 0)} negocio(s) · último mes <b class="${profit >= 0 ? 'pos' : 'neg'}">${moneyShort(profit)}</b>` : 'Sin negocios todavía'}</div>`;
  tip.hidden = false;
  const wrap = $('#map-wrap').getBoundingClientRect();
  tip.style.left = `${Math.min(p.x + 14, wrap.width - tip.offsetWidth - 8)}px`;
  tip.style.top = `${Math.max(8, p.y - tip.offsetHeight - 10)}px`;
}

// Un objetivo por carril (🏪 negocio, 👥 equipo, 💶 dinero); en pantallas estrechas, el más cercano y «+N».
function goalLine(s, g) {
  const lane = LANES.find((l) => l.id === g.lane);
  const p = g.progress?.(s);
  const prog = p ? ` <span class="goal-prog">${p[1] >= 1e5 ? `${moneyShort(p[0])}/${moneyShort(p[1])}` : `${p[0]}/${p[1]}`}</span>` : '';
  return `<span class="goal-line">${lane?.emoji ?? '🎯'} ${esc(g.text)}${prog}</span>`;
}

function renderGoal(s) {
  const goals = currentGoals(s);
  const c = clauseStatus(s);
  const clause = c && ['vigente', 'cumplida'].includes(c.state) ? `<span class="goal-clause ${c.state}">📜 ${esc(c.state === 'cumplida' ? `${c.def.title} · ¡cumplida!` : c.short)}</span>` : '';
  const el = $('#goal-chip');
  el.hidden = (!goals.length && !clause && s.campaign!=='europe') || !!s.ending;
  const done = goalNumber(s) - 1;
  const closeness = (g) => {
    const p = g.progress?.(s);
    return p ? p[0] / p[1] : 0;
  };
  const sorted = [...goals].sort((a, b) => closeness(b) - closeness(a));
  const narrow = window.matchMedia('(max-width: 860px)').matches;
  const lines = narrow && sorted.length > 1 && !game.goalsOpen
    ? `${goalLine(s, sorted[0])}<button type="button" class="goal-more" data-act="goals-more">+${sorted.length - 1}</button>`
    : goals.map((g) => goalLine(s, g)).join('') + (narrow && sorted.length > 1 ? '<button type="button" class="goal-more" data-act="goals-more">−</button>' : '');
  el.innerHTML = `${s.campaign==='europe'?'<span class="goal-clause">🇪🇺 Meta: 1.000 M€ · 8 países · banca, telecom y logística</span>':''}${goals.length ? `<span class="goal-kicker">🎯 Objetivos · ${done}/${GOALS.length}</span>${lines}` : ''}${clause}`;
}

// Si una acción rompería la cláusula del testamento, se pregunta antes.
async function clauseOk(s, mutate) {
  const warn = clauseWarn(s, mutate);
  return !warn || confirmModal('📜 La cláusula del testamento', warn, 'Me da igual');
}

async function showNotices() {
  const s = game.s;
  while (s?.notices?.length) {
    const n = s.notices.shift();
    play('goal');
    await showModal({ title: n.title, kicker: n.kicker || '🎯 Objetivo', portrait: 'portrait_manolo_happy', text: n.text });
  }
  renderAll();
}

function renderManoloBox(s) {
  $('#manolo-portrait').src = imageUrl(s.dynasty?.generation?s.dynasty.portrait:`portrait_manolo_${manoloMood(s)}`);
  const b = game.bubble?.month === s.month ? game.bubble.text : null;
  $('#manolo-bubble').textContent = b || s.quote || '';
  $('#manolo-bubble').classList.toggle('action', !!b);
}

// ------------------------------------------------------------------ Acciones
function bindGlobal() {
  document.addEventListener('pointerdown', () => game.s && startMusic(), { passive: true });
  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('input', onInput);
  document.addEventListener('toggle', (e) => {
    const d = e.target;
    if (d instanceof HTMLDetailsElement && d.dataset.folder && d.open) setArchivoOpen(d.dataset.folder);
  }, true);
  $('#end-month').addEventListener('click', endMonth);
  $('#manolo-box').addEventListener('click', () => {
    game.tab = 'manolo';
    renderAll();
    document.body.classList.add('panel-open');
  });
  document.addEventListener('keydown', (e) => {
    if (!game.s || $('#game').hidden || isModalOpen()) return;
    if (e.target.matches('input, textarea, select')) return;
    // Con un botón o enlace enfocado, Espacio/Intro lo pulsan a él, no cierran el mes. Y la pulsación que
    // acaba de cerrar un diálogo tampoco (400 ms).
    if ((e.code === 'Space' || e.key === 'Enter') && !e.target.closest('button, a, summary')) {
      e.preventDefault();
      if (msSinceModal() >= 400) endMonth();
    }
    if (e.key === ',' || e.key === '.') {
      e.preventDefault();
      cycleAlerts(e.key === '.' ? 1 : -1);
    }
    const idx = '1234567'.indexOf(e.key);
    if (idx >= 0 && !e.ctrlKey && !e.metaKey) {
      game.tab = TABS[idx].id;
      renderAll();
    }
  });
}

// Teclas , y .: la ciudad con alerta anterior o siguiente (en el orden de la lista de ciudades).
function cycleAlerts(dir) {
  const s = game.s;
  const alerts = cityAlerts(s);
  const ids = Object.keys(CITY_BY_ID).filter((id) => alerts[id]?.length);
  if (!ids.length) {
    toast('Ninguna ciudad con alertas en el mapa.', 'info');
    return;
  }
  const k = ids.indexOf(game.city);
  const id = ids[k < 0 ? (dir > 0 ? 0 : ids.length - 1) : (k + dir + ids.length) % ids.length];
  game.city = id;
  game.tab = 'ciudad';
  game.map.select(id);
  game.map.focusCity(id);
  renderAll();
  document.body.classList.add('panel-open');
  const a = alerts[id][0];
  const text = `${CITY_BY_ID[id].name}: ${ALERT_EMOJI[a.kind] || '⚠️'} ${a.text}`;
  $('#map-live').textContent = text;
  toast(text, a.level >= 3 ? 'bad' : 'info', 3500);
}

async function onClick(e) {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled || el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
  const s = game.s;
  const act = el.dataset.act;
  if (act !== 'menu' && !s) return;
  e.preventDefault();
  let res = null;
  switch (act) {
    case 'opening-stress':
      res=studyOpening({type:el.dataset.type,city:el.dataset.city,mode:el.dataset.mode});
      break;
    case 'stress-opening': {
      const choice=game.finance.choice;
      game.empire.view='openings';if(choice)game.empire.openings={type:choice.type,preserveType:true,mode:choice.mode,country:'all',query:CITY_BY_ID[choice.city]?.name||'',showBlocked:true,page:0};
      game.tab='imperio';game.resetPanelScroll=true;
      break;
    }
    case 'opening-page':
      game.empire.openings.page=Math.max(0,Number(el.dataset.page)||0);game.resetPanelScroll=true;
      break;
    case 'opening-review': {
      if(game.openingReviewOpen)return;
      const choice={type:el.dataset.type,city:el.dataset.city,mode:el.dataset.mode},plan=openingPlan(s,choice);
      if(!plan.ok){res=plan;break;}
      game.openingReviewOpen=true;
      try {
        const picked=await showModal({title:'Revisar nueva apertura',html:renderOpeningReview(plan),dismissable:true,choices:[{label:'Cancelar'},{label:choice.mode==='franquicia'?'Firmar franquicia':'Abrir local',primary:true},{label:'Probar escenarios'}]});
        if(picked===2){res=studyOpening(choice);break;}
        if(picked!==1)return;
        if(!await clauseOk(s,c=>openBusiness(c,choice.type,choice.city,choice.mode)))return;
        res=executeOpening(s,choice,plan);
        if(res.ok){play(choice.mode==='franquicia'?'cash':'build');toast(`🏪 Apertura en ${CITY_BY_ID[choice.city].name}`,'good');}
      } finally {game.openingReviewOpen=false;}
      break;
    }
    case 'finance-view':
      game.finance.view=el.dataset.view;game.resetPanelScroll=true;
      break;
    case 'portfolio-stress': {
      const ids=portfolioSelection(portfolio(s,game.empire.filters).rows,game.empire.selected,game.empire.operation);
      if(!ids.length){res={ok:false,msg:'Selecciona negocios reformables en la cartera.'};break;}
      const operation=game.empire.operation,quote=(operation==='sale'?saleBatchPlan:upgradeBatchPlan)(s,ids);
      game.finance={view:'stress',ids,items:quote.ok?quote.items:null,operation};game.tab='finanzas';game.resetPanelScroll=true;
      break;
    }
    case 'stress-current':
      game.finance.ids=[];game.finance.items=null;game.finance.choice=null;game.finance.quote=null;game.resetPanelScroll=true;
      break;
    case 'stress-portfolio':
      if(game.finance.ids.length){game.empire.filters={};game.empire.operation=game.finance.operation||'upgrade';game.empire.selected=portfolioSelection(portfolio(s).rows,game.finance.ids,game.empire.operation);game.empire.page=0;}
      game.empire.view='portfolio';game.tab='imperio';game.resetPanelScroll=true;
      break;
    case 'empire-view':
      game.empire.view=el.dataset.view;game.resetPanelScroll=true;
      break;
    case 'portfolio-mode':
      game.empire.operation=el.dataset.operation==='sale'?'sale':'upgrade';game.empire.selected=[];game.empire.page=0;game.resetPanelScroll=true;
      break;
    case 'portfolio-page':
      game.empire.page=Math.max(0,Number(el.dataset.page)||0);game.resetPanelScroll=true;
      break;
    case 'portfolio-all':
      game.empire.selected=portfolio(s,game.empire.filters).rows.filter(r=>game.empire.operation==='sale'||r.upgradeable).map(r=>r.id);
      break;
    case 'portfolio-clear':
      game.empire.selected=[];
      break;
    case 'portfolio-review': {
      if(game.portfolioReviewOpen)return;
      const ids=portfolioSelection(portfolio(s,game.empire.filters).rows,game.empire.selected,game.empire.operation),sale=game.empire.operation==='sale',plan=(sale?saleBatchPlan:upgradeBatchPlan)(s,ids);
      if(!plan.ok){res=plan;break;}
      game.portfolioReviewOpen=true;
      try {
        const choice=await showModal({title:sale?'Revisar ventas y rescisiones':'Revisar reformas conjuntas',html:sale?renderSaleReview(plan):renderUpgradeReview(plan),dismissable:true,choices:[{label:'Cancelar'},{label:sale?'Vender y rescindir definitivamente':'Confirmar reformas',primary:!sale,danger:sale}]});
        if(choice!==1)return;
        res=(sale?saleBatch:upgradeBatch)(s,ids,plan);
        if(res.ok){game.empire.selected=[];play(sale?'cash':'build');toast(sale?`💼 ${res.count} operaciones · ${res.cashDelta>=0?'+':''}${money(res.cashDelta)}`:`🔨 ${res.count} reformas · ${money(res.cost)}`,'good');}
      } finally {game.portfolioReviewOpen=false;}
      break;
    }
    case 'tab':
      play('click');
      game.tab = el.dataset.tab;
      document.body.classList.add('panel-open');
      break;
    case 'nav-group': {
      const tabs=TABS.filter(t=>t.group===el.dataset.group);
      if(!tabs.length)return;
      play('click');document.body.classList.add('panel-open');
      const last=game.lastTabs?.[el.dataset.group];game.tab=tabs.some(t=>t.id===last)?last:tabs[0].id;
      break;
    }
    case 'research-status':
      game.researchFilters||={};game.researchFilters.status=el.dataset.value;game.resetPanelScroll=true;
      break;
    case 'goto-city':
      game.city = el.dataset.city;
      game.tab = 'ciudad';
      game.map.select(game.city);
      game.map.focusCity(game.city);
      break;
    case 'housing-open':
      res=openBusiness(s,'vivienda',el.dataset.city,'propia',el.dataset.form);
      if(res.ok)toast(`🏗️ Obra iniciada en ${CITY_BY_ID[el.dataset.city].name}. Entrega en 12 meses.`,'good');
      break;
    case 'heir-name':
      res=nominateHeir(s,el.dataset.heir);
      break;
    case 'open': {
      const t = BUSINESS_TYPES[el.dataset.type];
      if (el.dataset.mode === 'franquicia') {
        const est = estimateOpening(s, el.dataset.type, game.city, 'franquicia');
        const ok = await confirmModal(`Vender una franquicia de ${t.name}`,
          `Un emprendedor local te paga ${money(franchiseFee(s, el.dataset.type))} de canon y monta la tienda con su dinero. Tú le vendes los sobaos a precio mayorista y cobras un 5 % de royalties.\n\nEstimación mensual de la central: ${money(est.delta)}. Del franquiciado: ${money(est.franchiseeProfit)}.${est.franchiseeProfit < 0 ? ' Ya empieza perdiendo dinero.' : ''}\n\nSi el franquiciado pierde dinero 4 meses seguidos, quebrará... y vendrá a pedirte explicaciones.`, 'Firmar');
        if (!ok) return;
      }
      if (el.dataset.mode === 'ilegal' && !(await confirmModal('Pisos sin licencia', 'Abres los pisos turísticos sin licencia. Te ahorras 120.000 €, pero cada mes hay una probabilidad de que el ayuntamiento te pille (multa de 40.000 € o más) y el radar de Hacienda sube.', 'Arriesgarse'))) return;
      if (!(await clauseOk(s, (c) => openBusiness(c, el.dataset.type, game.city, el.dataset.mode)))) return;
      res = openBusiness(s, el.dataset.type, game.city, el.dataset.mode,el.dataset.form);
      if (res.ok) play(el.dataset.mode === 'franquicia' ? 'cash' : 'build');
      if (res.ok && el.dataset.mode === 'ilegal') toast(`🙈 Pisos "de temporada" abiertos en ${CITY_BY_ID[game.city].name}`, 'bad');
      else if (res.ok) toast(el.dataset.mode === 'franquicia' ? `🤝 Franquicia vendida en ${CITY_BY_ID[game.city].name}` : `🏗️ Abres ${t.name} en ${CITY_BY_ID[game.city].name}`, 'good');
      break;
    }
    case 'sell': {
      const b = s.businesses.find((x) => x.id === Number(el.dataset.id));
      if (!b) return;
      const t = BUSINESS_TYPES[b.type];
      const ok = await confirmModal(b.mode === 'franquicia' ? 'Rescindir la franquicia' : `Vender ${t.name}`,
        b.mode === 'franquicia' ? 'Dejarás de cobrar royalties y de venderle sobaos.' : `Te dan ${money(Math.round((b.value || 0) * (t.realEstate ? 0.9 : 0.6)))}. El mercado de segunda mano es cruel.`, 'Hacerlo');
      if (!ok) return;
      res = sellBusiness(s, b.id);
      break;
    }
    case 'upgrade':
      res = buyUpgrade(s);
      if (res.ok) {
        play('build');
        toast(`🏭 ${res.upgrade.name}`, 'good');
      }
      break;
    case 'perk':
      res = togglePerk(s, el.dataset.id);
      break;
    case 'borrow':
      if (!(await clauseOk(s, (c) => borrow(c, Number(el.dataset.amount) || LOAN_STEP)))) return;
      res = borrow(s, Number(el.dataset.amount) || LOAN_STEP);
      if (res.ok) toast(`🏦 +${money(res.amount)} de la póliza`, 'info');
      break;
    case 'mama-ask':
      res = askLoan(s, el.dataset.amount === 'max' ? 'max' : Number(el.dataset.amount));
      if (res.ok) {
        play('cash');
        renderAll();
        await showModal({ title: 'La cartilla de Doña Remedios', kicker: 'Préstamo', portrait: 'portrait_madre', image: 'ev_cartilla', text: res.text });
      }
      break;
    case 'mama-repay': {
      const owed = s.cartilla?.owed || 0;
      if (!(await confirmModal('Devolverle el dinero a tu madre', `Le devuelves ${money(owed)}${s.cash < owed ? ': la caja no llega, así que la póliza cubrirá el descubierto al cerrar el mes' : ''}. Se acaban las condiciones.`, 'Devolver'))) return;
      res = repayEarly(s);
      if (res.ok) toast(`👵 «${res.refran}»`, 'good', 4000);
      break;
    }
    case 'repay':
      res = repay(s, el.dataset.amount === 'all' ? Infinity : LOAN_STEP);
      if (res.ok) toast(`Devueltos ${money(res.amount)}`, 'info');
      break;
    case 'manolo':
      if (!(await clauseOk(s, (c) => doManoloAction(c, el.dataset.id)))) return;
      res = doManoloAction(s, el.dataset.id);
      // El resultado va al bocadillo de Manolo (hasta el cierre) y a un toast; no para el juego.
      if (res.ok) {
        game.bubble = { month: s.month, text: res.text };
        toast(`😎 ${res.text}`, 'info', Math.max(2600, res.text.length * 45));
      }
      break;
    case 'upgrade-biz':
      res = upgradeBusiness(s, Number(el.dataset.id));
      if (res.ok) {
        play('build');
        toast(`🔨 Reforma terminada: nivel ${res.level}`, 'good');
      }
      break;
    case 'campaign':
      res = launchCampaign(s, el.dataset.id, el.dataset.city || null);
      if (res.ok) {
        play('cash');
        toast(`📢 ${CAMPAIGN_BY_ID[el.dataset.id].name}`, 'good');
      }
      break;
    case 'online-open':
      res=openOnline(s);if(res.ok){play('cash');toast('🛒 Tienda online abierta. Solo acepta pedidos con excedente real.','good');}
      break;
    case 'online-upgrade':
      res=upgradeOnline(s);if(res.ok){play('cash');toast('🛒 Canal online ampliado.','good');}
      break;
    case 'online-toggle':
      res=toggleOnline(s);
      break;
    case 'marketing-select':
      game.marketingSelection||={};game.marketingSelection[el.dataset.scope]=el.dataset.value==='all'?null:[];
      break;
    case 'campaign-batch': {
      const c=CAMPAIGN_BY_ID[el.dataset.id],targets=campaignSelection(s,c.scope,game.marketingSelection?.[c.scope]);
      const plan=campaignPlan(s,c.id,targets);
      if(!plan.ok){toast(plan.msg,'bad');return;}
      const text=`${plan.targets.length} territorios: ${plan.targets.map(t=>t.name).join(', ')}.\n\nCoste total: ${money(plan.cost)}. Duración: ${c.months} meses por territorio.\n\n${plan.skipped.length?`Se omiten ${plan.skipped.length} destinos ya activos o sin negocios afines.\n\n`:''}El lote se contrata completo o no se cobra nada. Las campañas elevan la demanda; comprueba la capacidad del obrador.`;
      if(!await confirmModal(c.name,text,'Contratar lote'))return;
      res=launchCampaignBatch(s,c.id,targets);
      if(res.ok){play('cash');toast(`📢 ${res.count} territorios · ${money(res.cost)}`,'good');}
      break;
    }
    case 'foreign-sign': {
      const market = el.dataset.market, mode = el.dataset.mode;
      const audit = el.closest('.foreign-offer').querySelector('.foreign-audit').checked;
      const terms = agreementTerms(market, mode, audit);
      const text = `${DEAL_MODES[mode].desc}\n\nInversión: ${money(terms.setup)}. Duración: 24 meses. Auditorías: ${money(terms.monthly)}/mes. Riesgo de incidente: ${(terms.risk * 100).toFixed(1)} % cada mes. Rescindir antes de plazo cuesta 5.000 €. Los incidentes pueden costar dinero y reputación.${mode === 'private_label' ? '\n\nEl pedido compite con tus tiendas por la capacidad del obrador. Dos meses por debajo del 80 % provocan conflicto.' : '\n\nEl socio recibe tu marca y receta; puede incumplir la calidad o copiarla.'}`;
      if (!(await confirmModal(`Acuerdo en ${FOREIGN_BY_ID[market].country}`, text, 'Firmar'))) return;
      if (!(await clauseOk(s, c => signAgreement(c,market,mode,audit)))) return;
      res = signAgreement(s,market,mode,audit);
      if (res.ok) toast(`🌍 Acuerdo firmado en ${FOREIGN_BY_ID[market].country}`, 'good');
      break;
    }
    case 'foreign-end':
      if (!(await confirmModal('Rescindir acuerdo extranjero', 'Pagas 5.000 €. Se detienen las ventas o royalties y se cancela cualquier conflicto pendiente de este acuerdo.', 'Rescindir'))) return;
      res = endAgreement(s,Number(el.dataset.id));
      break;
    case 'research-preview': {
      if(game.researchReviewOpen)return;
      const plan=researchPlan(s,el.dataset.id);
      if(!plan.ok){res=plan;break;}
      game.researchReviewOpen=true;
      try{await showModal({title:plan.name,kicker:'I+D · Evaluación sin invertir',wide:true,html:renderResearchReview(plan),choices:[{label:'Cerrar evaluación',primary:true}],dismissable:true});}
      finally{game.researchReviewOpen=false;}
      break;
    }
    case 'rd':
      res = startRD(s, el.dataset.id);
      if (res.ok) toast(`🧪 ${PRODUCT_BY_ID[el.dataset.id].name}: ${res.months} ${res.months === 1 ? 'mes' : 'meses'}`, 'good');
      break;
    case 'rival-act':
      res = actOnRival(s, el.dataset.rival, el.dataset.city, el.dataset.action);
      if (res.ok) {
        renderAll();
        await showModal({ title: RIVALS[el.dataset.rival].name, kicker: 'Competencia', portrait: 'portrait_manolo_smug', text: res.text });
      }
      break;
    case 'rival-buy': {
      const d = RIVALS[el.dataset.rival];
      if (!(await confirmModal(`OPA sobre ${d.name}`, `Vas a comprar la cadena entera por ${money(acquisitionPrice(s, el.dataset.rival))}. Desaparecerá del mercado y te quedarás con hasta 4 de sus mejores locales.`, 'Comprar'))) return;
      if (!(await clauseOk(s, (c) => acquireRival(c, el.dataset.rival)))) return;
      res = acquireRival(s, el.dataset.rival);
      if (res.ok) {
        play('goal');
        renderAll();
        await showModal({ title: 'OPA completada', kicker: '🦈 Tiburón', portrait: 'portrait_manolo_happy', text: `${d.name} ya es tuya.${res.gained.length ? ` Rebautizas sus locales de ${res.gained.join(', ')}.` : ''}\n\nManolo se hace una foto estrechando la mano de los antiguos dueños. Ellos sonríen: acaban de venderte una cadena por bastante más de lo que valía.` });
      }
      break;
    }
    case 'lujo-buy':
      if (!(await clauseOk(s, (c) => buyLujo(c, el.dataset.id)))) return;
      res = buyLujo(s, el.dataset.id);
      if (res.ok) {
        play('cash');
        toast(`${LUJO_BY_ID[el.dataset.id].emoji} ¡Nuevo capricho!`, 'good');
      }
      break;
    case 'lujo-sell': {
      if (!(await confirmModal('Vender capricho', `¿Vendes ${LUJO_BY_ID[el.dataset.id].name}? Te darán menos de lo que vale. Mucho menos de lo que pagaste.`, 'Vender'))) return;
      res = sellLujo(s, el.dataset.id);
      break;
    }
    case 'ipo': {
      if (!(await confirmModal('Salir a Bolsa', `Vas a vender el ${Math.round(IPO_FLOAT * 100)} % de la empresa a inversores. Te llevarás mucho dinero, pero a partir de ahora tu patrimonio será solo el ${Math.round((1 - IPO_FLOAT) * 100)} % y tendrás que rendir cuentas a los accionistas. No hay vuelta atrás.`, 'Tocar la campana'))) return;
      res = doIPO(s, grossPatrimonio(s));
      if (res.ok) {
        play('ending');
        renderAll();
        await showModal({ title: '¡Campanazo!', kicker: '🔔 Bolsa', portrait: 'portrait_manolo_happy', text: `Boomerez S.A. cotiza en Bolsa. Valoración: ${money(res.valuation)}. Ingresas ${money(res.raised - res.fee)} (los bancos se quedan ${money(res.fee)} por organizar el sarao).\n\nManolo toca la campana tan fuerte que se le caen las gafas de sol de la calva.` });
      }
      break;
    }
    case 'retire': {
      if (!(await confirmModal(s.campaign==='europe'?'Relevo voluntario':'Vuelta a Selaya', s.campaign==='europe'?'Tu sucesor toma el mando. Conservas todas las empresas y continúa la campaña europea.': 'Manolo deja el imperio y vuelve al pueblo. La partida termina ahora, con la puntuación de hoy, y la cláusula del testamento no se cobra. No hay modo infinito.', 'Retirarse', 'Todavía no'))) return;
      res = retire(s);
      if (res.ok) {
        renderAll();
        if(res.succession)await processQueue();else await showEnding('selaya');
        return;
      }
      break;
    }
    case 'hire':
      res = hireExec(s, el.dataset.id);
      if (res.ok) toast(`🤝 Bienvenido/a, ${res.exec.name}`, 'good');
      break;
    case 'fire': {
      const e = execOf(s, el.dataset.pos);
      if (!e || !(await confirmModal('Despedir', `¿Despides a ${e.name}? La indemnización es de ${money(severance(e))}.${e.trait === 'enchufado' ? ' Es de la familia: habrá consecuencias en casa.' : ''}`, 'Despedir'))) return;
      if (!(await clauseOk(s, (c) => fireExec(c, el.dataset.pos)))) return;
      res = fireExec(s, el.dataset.pos);
      break;
    }
    case 'rebrand': {
      const r = canRebrand(s);
      if (!(await confirmModal('Rebranding', `Vas a convertir todas tus tiendas de sobaos en ${BUSINESS_TYPES[r.to].name} por ${money(r.cost)}. Manolo ya ha encargado las tarjetas de visita nuevas.`, 'Adelante'))) return;
      res = rebrand(s);
      if (res.ok) {
        play('build');
        toast(`🔁 Ahora eres ${BUSINESS_TYPES[res.to].name}`, 'good');
      }
      break;
    }
    case 'drop-cost': {
      const x = s.extraMonthly[Number(el.dataset.index)];
      if (!x || !(await confirmModal('Quitar gasto', `¿Dejas de pagar "${x.label}"? Si es un familiar, la próxima cena va a ser tensa.`, 'Quitar'))) return;
      res = dropMonthlyCost(s, Number(el.dataset.index));
      break;
    }
    case 'zoom-in':
    case 'zoom-out': {
      const m = game.map;
      m.zoomAt(m.w / 2, m.h / 2, act === 'zoom-in' ? 1.35 : 1 / 1.35);
      return;
    }
    case 'zoom-fit':
      game.map.fit();
      return;
    case 'menu':
      return showMenu();
    case 'toggle-panel':
      document.body.classList.toggle('panel-open');
      return;
    case 'hud-more':
      return showModal({ title: 'Indicadores', kicker: 'Imperio Boomerez', html: `<div class="hud-sheet">${hudItems(s)}</div>`, dismissable: true, choices: [{ label: 'Cerrar', primary: true }] });
    case 'goals-more':
      game.goalsOpen = !game.goalsOpen;
      renderGoal(s);
      return;
    case 'explain':
      play('click');
      return showModal({ kicker: '¿Por qué?', title: whyTitle(el.dataset.stat), html: renderWhy(s, el.dataset.stat), dismissable: true, className: 'why-modal', choices: [{ label: 'Entendido', primary: true }] });
    default:
      return;
  }
  if (res && !res.ok && res.msg) toast(res.msg, 'bad');
  renderAll();
  await showNotices();
}

function onChange(e) {
  const el = e.target;
  if(el.dataset.act==='opening-filter'&&game.s){setOpeningFilter(el.dataset.key,el.type==='checkbox'?el.checked:el.value);return;}
  if(el.dataset.act==='portfolio-filter'&&game.s){setPortfolioFilter(el.dataset.key,el.value);return;}
  if(el.dataset.act==='portfolio-pick'&&game.s){
    const ids=new Set(portfolioSelection(portfolio(game.s,game.empire.filters).rows,game.empire.selected,game.empire.operation));
    if(el.checked)ids.add(Number(el.dataset.id));else ids.delete(Number(el.dataset.id));
    game.empire.selected=[...ids];renderAll();return;
  }
  if(el.dataset.act==='research-category'&&game.s){game.researchFilters||={};game.researchFilters.category=el.value;game.resetPanelScroll=true;renderAll();return;}
  if(el.dataset.act==='online-shipping'&&game.s){const res=setOnlineShipping(game.s,el.value);if(!res.ok)toast(res.msg,'bad');renderAll();return;}
  if(el.dataset.act==='marketing-target'&&game.s){
    const scope=el.dataset.scope;game.marketingSelection||={};
    const selected=new Set(campaignSelection(game.s,scope,game.marketingSelection[scope]));
    if(el.checked)selected.add(el.value);else selected.delete(el.value);
    game.marketingSelection[scope]=[...selected];renderAll();return;
  }
  if(el.dataset.act==='housing-policy'&&game.s) {
    const res=setHousingPolicy(game.s,el.dataset.city,el.dataset.group,el.value);
    if(!res.ok)toast(res.msg,'bad');
    renderAll();return;
  }
  if (el.dataset.act === 'goto-select' && game.s && el.value) {
    game.city = el.value;
    game.tab = 'ciudad';
    game.map.select(game.city);
    game.map.focusCity(game.city);
    renderAll();
    return;
  }
  if (el.dataset.act !== 'policy' || !game.s) return;
  const res = setPolicy(game.s, el.dataset.key, el.value);
  if (!res.ok) toast(res.msg, 'bad');
  renderAll();
}

function setPortfolioFilter(key,value) {
  game.empire.filters[key]=value;game.empire.selected=[];game.empire.page=0;game.resetPanelScroll=true;renderAll();
}
function onInput(e) {
  if(e.target.dataset.act==='portfolio-search'&&game.s)setPortfolioFilter('query',e.target.value);
  if(e.target.dataset.act==='opening-search'&&game.s)setOpeningFilter('query',e.target.value);
}
function setOpeningFilter(key,value) {
  if(key==='type')game.empire.openings.preserveType=false;
  game.empire.openings[key]=value;game.empire.openings.page=0;game.resetPanelScroll=true;renderAll();
}
function studyOpening(choice) {
  const quote=openingPlan(game.s,choice);if(!quote.ok)return quote;
  game.finance={view:'stress',ids:[],items:null,operation:'opening',choice,quote};game.tab='finanzas';game.resetPanelScroll=true;
  return {ok:true};
}

async function showMenu() {
  const i = await showModal({
    title: 'Menú',
    text: `La partida se guarda automáticamente en este navegador.\n\n🎲 Semilla: ${seedCode(game.s?.seed ?? 0)}${game.s?.flags?.reto ? ` · reto de la semana ${game.s.flags.reto}` : ''}. Con el mismo código, otra persona juega la misma partida.`,
    choices: [
      { label: 'Seguir jugando', primary: true },
      { label: 'Cómo se juega' },
      { label: isMuted() ? 'Activar los efectos de sonido' : 'Silenciar los efectos de sonido' },
      { label: isMusicOn() ? 'Quitar la música' : 'Poner la música (pasodoble lo-fi)' },
      { label: 'Volver al título' },
      { label: 'Reiniciar partida', danger: true },
      { label: 'Exportar partida a un archivo', hint: 'Para llevártela a otro dispositivo.' },
      { label: 'Importar partida desde un archivo' },
      { label: document.body.classList.contains('big-text') ? 'Texto de tamaño normal' : 'Texto más grande' },
    ],
    dismissable: true,
  });
  if (i === 6) exportSave();
  if (i === 7) importSave();
  if (i === 8) setBigText(!document.body.classList.contains('big-text'));
  if (i === 1) showHelp();
  if (i === 2) {
    setMuted(!isMuted());
    play('click');
    toast(isMuted() ? '🔇 Efectos desactivados' : '🔊 Efectos activados');
  }
  if (i === 3) {
    setMusic(!isMusicOn());
    toast(isMusicOn() ? '🎺 Suena el pasodoble' : '🔇 Música desactivada');
  }
  if (i === 4) showTitle();
  if (i === 5 && (await confirmModal('¿Reiniciar?', 'Perderás la partida actual.', 'Reiniciar'))) {
    clearStorage();
    startGame(newGame(undefined, game.s.difficulty));
  }
}

function exportSave() {
  const s = game.s;
  const blob = new Blob([serialize(s)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `boomerez-${dateLabel(s.month).replace(' ', '-').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('💾 Partida exportada');
}

function importSave() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const s = deserialize(await file.text());
      if (!(await confirmModal('Importar partida', `Se cargará la partida de ${dateLabel(s.month).toLowerCase()} y se perderá la actual.`, 'Importar'))) return;
      startGame(s);
      toast('📂 Partida importada', 'good');
    } catch {
      toast('Ese archivo no es una partida de Manolo Boomerez.', 'bad');
    }
  };
  input.click();
}

// Ayuda en cinco páginas con «Siguiente» y «Anterior».
async function showHelp() {
  let i = 0;
  while (i >= 0) {
    const page = HELP_PAGES[i];
    const choices = helpChoices(i);
    const k = await showModal({ title: page.title, kicker: `Cómo se juega · ${i + 1}/${HELP_PAGES.length}`, wide: true, html: page.html, choices, dismissable: true });
    i = k < 0 ? -1 : choices[k].go;
  }
}

// ------------------------------------------------------------ Bucle de mes
async function endMonth() {
  const s = game.s;
  if (!s || game.busy || s.ending || s.pending.length || isModalOpen()) return;
  game.busy = true;
  game.bubble = null;
  const prev = { rep: s.rep, moral: s.moral, fama: s.fama, ht: s.heatTrabajo, hh: s.heatHacienda, agr: s.agravio || 0 };
  const prevReport = s.lastReport;
  const head = s.log[0];
  const r = advanceMonth(s);
  renderAll();
  if (r) {
    game.map.showProfits(r);
    play(r.net >= 0 ? 'cash' : 'loss');
    await showReport(r, prev, monthDigest(prevReport, r, s, head));
    game.map.playProfits();
    const nAlerts = Object.values(cityAlerts(s)).reduce((a, l) => a + l.length, 0);
    $('#map-live').textContent = `${dateLabel(r.month)}: resultado ${moneyShort(r.net)}, ${s.businesses.length} negocios${nAlerts ? `, ${nAlerts} ${nAlerts === 1 ? 'alerta' : 'alertas'} en el mapa` : ''}.`;
    if (r.month % 12 === 11) await showYearSummary(s, r);
  }
  game.busy = false;
  await processQueue();
}

// Resumen de diciembre: balance del año y el inevitable post de LinkedIn.
function showYearSummary(s, r) {
  const year = START_YEAR + Math.floor(r.month / 12);
  const months = s.history.filter((h) => Math.floor(h.month / 12) === Math.floor(r.month / 12));
  const revenue = months.reduce((a, h) => a + h.revenue, 0);
  const net = months.reduce((a, h) => a + h.net, 0);
  const startPat = s.history.find((h) => h.month === r.month - 12)?.patrimonio ?? months[0]?.patrimonio ?? 0;
  const endPat = months[months.length - 1]?.patrimonio ?? 0;
  const lines = r.lines.filter((l) => l.id !== 'obrador' && l.type !== 'obrador_regional').map((l) => ({ ...l, p: l.revenue - l.cost })).sort((a, b) => b.p - a.p);
  const best = lines[0];
  const worst = lines[lines.length - 1];
  const opened = s.businesses.filter((b) => Math.floor((b.openedMonth ?? -1) / 12) === Math.floor(r.month / 12)).length;
  const post = net > 0
    ? `${year}: un año de crecimiento, aprendizaje y resiliencia. Hemos facturado ${moneyShort(revenue)} con un equipo increíble (al que pago lo justo). Gracias a todos los que no creyeron en mí: sois mi gasolina. 🦈 #Mindset #Emprendimiento #Sobaos`
    : `${year}: un año de aprendizaje. No hemos perdido ${moneyShort(-net)}: hemos invertido en experiencia. Los grandes también caen. Yo me levanto. 🦈 #Resiliencia #NeverGiveUp`;
  const html = `<div class="report">
      <div class="report-big ${net >= 0 ? 'pos' : 'neg'}">${net >= 0 ? '+' : '−'}${money(Math.abs(net))}</div>
      <div class="muted small">Beneficio neto de ${year}</div>
      <table class="tbl pl">
        <tr><td>Facturación del año</td><td>${money(revenue)}</td></tr>
        <tr><td>Patrimonio</td><td>${moneyShort(startPat)} → <b>${moneyShort(endPat)}</b></td></tr>
        <tr><td>Negocios abiertos este año</td><td>${opened}</td></tr>
        ${best ? `<tr><td>Mejor negocio (diciembre)</td><td>${esc(best.label)} · ${esc(CITY_BY_ID[best.city]?.name || '')} <span class="pos">${moneyShort(best.p)}</span></td></tr>` : ''}
        ${worst && worst !== best ? `<tr><td>Peor negocio (diciembre)</td><td>${esc(worst.label)} · ${esc(CITY_BY_ID[worst.city]?.name || '')} <span class="${worst.p >= 0 ? 'pos' : 'neg'}">${moneyShort(worst.p)}</span></td></tr>` : ''}
      </table>
      <div class="linkedin"><div class="kicker">Manolo publica en LinkedIn</div><p>${esc(post)}</p></div>
    </div>`;
  return showModal({ title: `Balance de ${year}`, kicker: 'Fin de año', portrait: `portrait_manolo_${net >= 0 ? 'happy' : 'thinking'}`, html });
}

function delta(label, a, b, invert = false, stat = '') {
  const d = Math.round(b - a);
  if (!d) return '';
  const good = invert ? d < 0 : d > 0;
  const text = `${label} ${d > 0 ? '+' : ''}${d}`;
  // Tocar la variación abre el «¿Por qué?» de ese indicador.
  if (stat) return `<button type="button" class="delta ${good ? 'pos' : 'neg'}" data-act="explain" data-stat="${stat}" title="¿Por qué?">${text}</button>`;
  return `<span class="delta ${good ? 'pos' : 'neg'}">${text}</span>`;
}

// Parte del mes: qué ha movido el neto, qué ha pasado y qué viene. En móvil, los dos últimos plegados.
function digestHtml(d) {
  if (!d) return '';
  const narrow = window.matchMedia('(max-width: 600px)').matches;
  const block = (title, body) => (narrow ? `<details class="digest"><summary>${title}</summary>${body}</details>` : `<h4>${title}</h4>${body}`);
  let html = '';
  if (d.drivers.length) {
    html += `<h4>Por qué ${d.prevNet != null ? `(frente a ${fmtDelta(d.prevNet).replace('+', '')} el mes pasado)` : ''}</h4><ul class="why digest-drivers">
      ${d.drivers.map((x) => `<li><span>${esc(x.label)}${x.reason ? `<small>${esc(x.reason)}</small>` : ''}</span><b class="${x.delta >= 0 ? 'pos' : 'neg'}">${fmtDelta(x.delta)}</b></li>`).join('')}</ul>`;
  }
  if (d.fresh.items.length) {
    html += block('Este mes', `<ul class="digest-list">${d.fresh.items.map((e) => `<li class="${e.tone}">${esc(e.text)}</li>`).join('')}</ul>${d.fresh.more ? `<p class="small muted">…y ${d.fresh.more} más en el Archivo.</p>` : ''}`);
  }
  if (d.upcoming.length) html += block('Próximamente', `<ul class="digest-list">${d.upcoming.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`);
  return html;
}

function showReport(r, prev, digest) {
  const s = game.s;
  const html = `
    <div class="report">
      <div class="report-big ${r.net >= 0 ? 'pos' : 'neg'}">${r.net >= 0 ? '+' : '−'}${money(Math.abs(r.net))}</div>
      <div class="muted small">Resultado neto del mes</div>
      <table class="tbl pl">
        <tr><td>Ingresos</td><td class="pos">${money(r.revenue)}</td></tr>
        <tr><td>Costes</td><td class="neg">−${money(r.totalCost)}</td></tr>
        <tr><td>Impuestos</td><td class="neg">−${money(r.tax)}</td></tr>
      </table>
      ${r.fill < 0.999 ? `<p class="warn small">⚠️ El obrador solo ha servido el ${Math.round(r.fill * 100)} % de la demanda de sobaos. ¡Mejóralo!</p>` : ''}
      ${r.evaded > 0 ? `<p class="small">🧾 Impuestos "optimizados" este mes: ${money(r.evaded)}.</p>` : ''}
      <div class="deltas">
        ${delta('Reputación', prev.rep, s.rep, false, 'rep')}${delta('Moral', prev.moral, s.moral, false, 'moral')}${delta('Fama', prev.fama, s.fama, false, 'fama')}
        ${delta('Radar Inspección', prev.ht, s.heatTrabajo, true, 'heatTrabajo')}${delta('Radar Hacienda', prev.hh, s.heatHacienda, true, 'heatHacienda')}${prev.agr != null ? delta('Agravio', prev.agr, s.agravio || 0, true, 'agravio') : ''}
      </div>
      ${s.insolvencyMonths ? `<p class="neg"><b>🚨 Descubierto sin crédito: mes ${s.insolvencyMonths} de 3.</b></p>` : ''}
      ${digestHtml(digest)}
    </div>`;
  return showModal({ title: `Cierre de ${dateLabel(r.month)}`, kicker: 'Informe mensual', portrait: `portrait_manolo_${manoloMood(s)}`, html });
}

async function processQueue() {
  if (game.queueRunning) return;
  game.queueRunning = true;
  try {
    await runQueue(game.s);
  } finally {
    game.queueRunning = false;
  }
}

async function runQueue(s) {
  while (s.pending.length && game.s === s) {
    const p = currentPending(s);
    play(['inspeccion_trabajo', 'auditoria_hacienda', 'sanidad'].includes(p.pending.id) ? 'stamp' : 'event');
    let resolved = false;
    // Al elegir se resuelve la carta y el resultado sale en el mismo diálogo, salvo que sea menor (o una
    // costumbre repetida por tercera vez seguida): entonces va a un toast y al registro.
    const resolve = (i) => {
      const before = resultSnapshot(s);
      const result = resolvePending(s, p.choices[Math.max(0, i)].index);
      resolved = true;
      renderAll();
      const repeat = p.event.quickRepeat && custom(s, p.pending.id).streak >= 3;
      if (repeat || isMinorResult(p.pending.id, result, before, resultSnapshot(s))) {
        log(s, `${repeat ? '↺' : '•'} ${p.title}: ${result}`, 'info');
        toast(`${repeat ? '↺ ' : ''}${p.title}: ${result}`, 'info', Math.max(2600, result.length * 45));
        return null;
      }
      return { text: result };
    };
    const i = await showModal({
      title: p.title,
      kicker: 'Suceso',
      image: p.image,
      portrait: p.portrait,
      text: p.text,
      choices: p.choices.map((c, k) => ({ label: c.label, hint: c.hint, primary: k === 0 })),
      followUp: resolve,
    });
    if (!resolved) resolve(i);
  }
  if (game.s !== s) return;
  checkGoals(s);
  await showNotices();
  const end = checkEnding(s);
  renderAll();
  if (end) {
    await showEnding(end);
    if (game.s === s && !s.ending && s.pending.length) await runQueue(s);
  }
}

async function showEnding(id) {
  const s = game.s;
  const e = endingOf(s, id);
  play('ending');
  const cl = clauseStatus(s);
  const etext = e.text + (id === 'bancarrota' && s.cartilla?.rescatado ? '\nEsta vez tu madre no abre la puerta.' : '');
  const html = `${etext.split('\n').map((t) => `<p>${esc(t)}</p>`).join('')}
    <table class="tbl pl">
      <tr><td>Meses al frente</td><td>${s.month}</td></tr>
      <tr><td>Patrimonio final</td><td>${money(patrimonio(s))}</td></tr>
      <tr><td>Patrimonio máximo</td><td>${money(s.stats.maxPatrimonio)}</td></tr>
      <tr><td>Negocios abiertos</td><td>${s.stats.abiertos}</td></tr>
      <tr><td>Inspecciones de Trabajo</td><td>${s.stats.inspecciones}</td></tr>
      <tr><td>Auditorías de Hacienda</td><td>${s.stats.auditorias}</td></tr>
      <tr><td>Multas pagadas</td><td>${money(s.stats.multas)}</td></tr>
      <tr><td>🎲 Semilla</td><td>${seedCode(s.seed)}${s.flags.reto ? ` · reto ${esc(s.flags.reto)}` : ''}</td></tr>
      ${cl ? `<tr><td>📜 Cláusula: ${esc(cl.def.title)}</td><td class="${cl.state === 'cumplida' ? 'pos' : cl.state === 'rota' ? 'neg' : ''}">${cl.state === 'cumplida' ? `Cumplida (×${String(cl.def.mult).replace('.', ',')})` : cl.state === 'rota' ? 'Rota' : 'No cumplida'}</td></tr>` : ''}
      <tr class="total"><td>Puntuación Boomerez</td><td>${score(s).toLocaleString('es-ES')}</td></tr>
    </table>
    <h4>Evolución del patrimonio</h4>
    <canvas id="chart-ending" height="140"></canvas>
    ${renderEpilogue(s)}`;
  const rank = s.recorded ? -1 : addRecord({
    title: e.title, ending: id, patrimonio: Math.round(patrimonio(s)), score: score(s), months: s.month,
    brand: s.brand, difficulty: s.difficulty || 'normal', date: new Date().toLocaleDateString('es-ES'),
    clausula: cl?.def.id ?? null, clausulaOk: cl?.state === 'cumplida',
    seed: seedCode(s.seed), reto: s.flags.reto || null, version: s.gameVersion || GAME_VERSION,
    heredero: s.sucesion?.heir ?? null,
  });
  // Una empresa que alcanza sus objetivos puede seguir; los finales terminales conservan su cierre.
  const canContinue = canContinueEnding(id);
  const choices = [{ label: 'Nueva partida', primary: true }, { label: 'Volver al título' }];
  if (canContinue) choices.push({ label: 'Seguir jugando (modo infinito)', hint: rank >= 0 ? 'Sin límite de tiempo. El récord ya está guardado.' : 'Sin límite de tiempo.' });
  requestAnimationFrame(() => drawChart($('#chart-ending'), s));
  s.recorded = true;
  saveToStorage(s); // Reabrir el desenlace no vuelve a insertar su récord.
  const i = await showModal({ title: e.title, kicker: rank >= 0 ? `FIN · Puesto ${rank + 1} del Salón de la fama` : 'FIN', image: e.image, html, wide: true, className: `ending ${e.tone}`, choices });
  if (i === 2) {
    s.ending = null;
    s.endless = true;
    resumePromises(s);
    log(s, '♾️ Manolo decide que jubilarse es de pobres. Modo infinito activado.', 'info');
    renderAll();
    return;
  }
  if(i===0)clearStorage(); // Volver al título conserva el desenlace y la empresa.
  // Se difiere para que la cola de sucesos actual termine antes de empezar otra partida.
  setTimeout(() => (i === 0 ? startGame(newGame(undefined, s.difficulty)) : showTitle()));
}
