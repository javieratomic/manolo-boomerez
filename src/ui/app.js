// Controlador principal de la interfaz.
import { $, esc, showModal, toast, confirmModal, isModalOpen } from './dom.js';
import { TABS, renderCity, renderEmpire, renderMarket, renderStaff, renderFinance, renderManolo, renderNews, drawChart, drawCategoryChart, manoloMood, renderWhy, whyTitle, renderEpilogue, setArchivoOpen } from './panels.js';
import { macroFx } from '../core/macro.js';
import { MapView } from '../render/mapView.js';
import { initAssets, imageUrl, hasArt } from '../render/assets.js';
import { newGame, saveToStorage, loadFromStorage, clearStorage, serialize, deserialize, DIFFICULTIES, GAME_VERSION } from '../core/state.js';
import { seedCode, parseSeed, isoWeekKey, weekSeed } from '../core/seed.js';
import { advanceMonth, currentPending, resolvePending, checkEnding, score, pickQuote } from '../core/sim.js';
import { patrimonio } from '../core/economy.js';
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
import { ENDINGS } from '../data/endings.js';

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
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !location.hostname.match(/^(localhost|127\.)/)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// ------------------------------------------------------------------ Título
function setupTitle() {
  const title = $('#title-screen');
  if (hasArt('bg_title')) title.style.backgroundImage = `url(${imageUrl('bg_title')})`;
  if (hasArt('logo_game')) $('#title-logo').innerHTML = `<img src="${imageUrl('logo_game')}" alt="Manolo Boomerez S.L.">`;
  $('#title-portrait').src = imageUrl('portrait_manolo_smug');
  const saved = loadFromStorage();
  const cont = $('#btn-continue');
  cont.hidden = !saved || !!saved.ending;
  if (saved && !saved.ending) cont.querySelector('small').textContent = `${dateLabel(saved.month)} · ${moneyShort(patrimonio(saved))}`;
  $('#btn-new').onclick = async () => {
    // Semilla opcional: el mismo código da la misma partida (para compartir retos).
    const code = $('#seed-input').value.trim();
    const seed = code ? parseSeed(code) : undefined;
    if (code && seed == null) {
      toast('Código de semilla no válido: letras y cifras, como mucho 1Z141Z3 (p. ej. 1ODLXA).', 'bad');
      return;
    }
    if (saved && !saved.ending && !(await confirmModal('¿Empezar de cero?', 'Se perderá la partida guardada. Manolo no se arrepiente de nada, pero tú quizá sí.', 'Nueva partida'))) return;
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
    const preview = newGame(seed, 'normal');
    const clause = clauseStatus(preview);
    const text = `Esta semana (${key}) todo el mundo juega la misma partida: misma semilla, mismos sucesos si eliges lo mismo y la misma cláusula del testamento. Dificultad normal.\n\nCódigo: ${seedCode(seed)}${clause ? `\nCláusula: «${clause.def.title}» (${clause.def.rule})` : ''}\n\nCompara tu puntuación del Salón de la fama con la de tus amigos.`;
    if (!(await confirmModal('🗓️ Reto de la semana', text, 'Empezar'))) return;
    if (saved && !saved.ending && !(await confirmModal('¿Empezar de cero?', 'Se perderá la partida guardada.', 'Empezar el reto'))) return;
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
        ${list.map((r, i) => `<tr><td>${i + 1}</td><td><b>${esc(r.title)}</b>${r.clausulaOk ? ' <span title="Cláusula del testamento cumplida">📜</span>' : ''}<div class="small muted">${esc(r.brand === 'maison' ? 'Maison' : 'Express')} · ${esc(diff(r.difficulty))} · ${r.months} meses · ${esc(r.date)}${r.seed ? ` · 🎲 ${esc(r.seed)}` : ''}${r.reto ? ` · reto ${esc(r.reto)}` : ''}</div></td><td>${moneyShort(r.patrimonio)}</td><td>${r.score.toLocaleString('es-ES')}</td></tr>`).join('')}
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
    ${hudItem('icon_calendar', '📅', 'Fecha', `<span class="long">${dateLabel(s.month)}</span><span class="short">${dateLabel(s.month).slice(0, 3)} ${String(dateLabel(s.month)).slice(-2)}</span>`, `<span class="hud-sub">${s.endless ? `Mes ${s.month + 1} · ♾️` : `Mes ${Math.min(s.month + 1, GAME_MONTHS)}/${GAME_MONTHS}`}</span>`)}
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
  $('#tabs').innerHTML = TABS.map(
    (t) => `<button class="tab ${game.tab === t.id ? 'on' : ''}" data-act="tab" data-tab="${t.id}"><span>${t.emoji}</span><span class="tab-label">${t.label}</span></button>`,
  ).join('');
}

function renderPanel(s) {
  const body = $('#panel-body');
  const scroll = body.scrollTop;
  const map = {
    ciudad: () => renderCity(s, game.city),
    imperio: () => renderEmpire(s),
    mercado: () => renderMarket(s),
    plantilla: () => renderStaff(s),
    finanzas: () => renderFinance(s),
    manolo: () => renderManolo(s),
    noticias: () => renderNews(s),
  };
  body.innerHTML = map[game.tab]();
  body.scrollTop = scroll;
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
  el.hidden = (!goals.length && !clause) || !!s.ending;
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
  el.innerHTML = `${goals.length ? `<span class="goal-kicker">🎯 Objetivos · ${done}/${GOALS.length}</span>${lines}` : ''}${clause}`;
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
  $('#manolo-portrait').src = imageUrl(`portrait_manolo_${manoloMood(s)}`);
  $('#manolo-bubble').textContent = s.quote || '';
}

// ------------------------------------------------------------------ Acciones
function bindGlobal() {
  document.addEventListener('pointerdown', () => game.s && startMusic(), { passive: true });
  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
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
    // Con un botón o enlace enfocado, Espacio/Intro lo pulsan a él, no cierran el mes.
    if ((e.code === 'Space' || e.key === 'Enter') && !e.target.closest('button, a, summary')) {
      e.preventDefault();
      endMonth();
    }
    const idx = '1234567'.indexOf(e.key);
    if (idx >= 0 && !e.ctrlKey && !e.metaKey) {
      game.tab = TABS[idx].id;
      renderAll();
    }
  });
}

async function onClick(e) {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled || el.tagName === 'INPUT') return;
  const s = game.s;
  const act = el.dataset.act;
  if (act !== 'menu' && !s) return;
  e.preventDefault();
  let res = null;
  switch (act) {
    case 'tab':
      play('click');
      game.tab = el.dataset.tab;
      document.body.classList.add('panel-open');
      break;
    case 'goto-city':
      game.city = el.dataset.city;
      game.tab = 'ciudad';
      game.map.select(game.city);
      game.map.focusCity(game.city);
      break;
    case 'open': {
      const t = BUSINESS_TYPES[el.dataset.type];
      if (el.dataset.mode === 'franquicia') {
        const ok = await confirmModal(`Vender una franquicia de ${t.name}`,
          `Un emprendedor local te paga ${money(franchiseFee(s, el.dataset.type))} de canon y monta la tienda con su dinero. Tú le vendes los sobaos a precio mayorista y cobras un 5 % de royalties.\n\nSi pierde dinero 4 meses seguidos, quebrará... y vendrá a pedirte explicaciones.`, 'Firmar');
        if (!ok) return;
      }
      if (el.dataset.mode === 'ilegal' && !(await confirmModal('Pisos sin licencia', 'Abres los pisos turísticos sin licencia. Te ahorras 120.000 €, pero cada mes hay una probabilidad de que el ayuntamiento te pille (multa de 40.000 € o más) y el radar de Hacienda sube.', 'Arriesgarse'))) return;
      if (!(await clauseOk(s, (c) => openBusiness(c, el.dataset.type, game.city, el.dataset.mode)))) return;
      res = openBusiness(s, el.dataset.type, game.city, el.dataset.mode);
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
      if (res.ok) {
        renderAll();
        await showModal({ title: 'Manolo en acción', portrait: `portrait_manolo_${manoloMood(s)}`, text: res.text });
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
    const i = await showModal({
      title: p.title,
      kicker: 'Suceso',
      image: p.image,
      portrait: p.portrait,
      text: p.text,
      choices: p.choices.map((c, k) => ({ label: c.label, hint: c.hint, primary: k === 0 })),
    });
    const choice = p.choices[Math.max(0, i)];
    const result = resolvePending(s, choice.index);
    renderAll();
    // Costumbres de la casa: a partir de la tercera vez seguida que eliges lo mismo, el resultado no para el juego.
    if (p.event.quickRepeat && custom(s, p.pending.id).streak >= 3) {
      log(s, `↺ ${p.title}: ${result}`, 'info');
      toast(`↺ ${p.title}: ${result}`, 'info', Math.max(2600, result.length * 45));
      continue;
    }
    await showModal({ title: p.title, kicker: 'Resultado', portrait: p.portrait, text: result });
  }
  if (game.s !== s) return;
  checkGoals(s);
  await showNotices();
  const end = checkEnding(s);
  renderAll();
  if (end) await showEnding(end);
}

async function showEnding(id) {
  const s = game.s;
  const e = ENDINGS[id];
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
  // Si el final es por tiempo o por la revista de millonarios, se puede seguir jugando sin límite.
  const canContinue = ['tiburon', 'pyme', 'ruina_lenta', 'forbes'].includes(id);
  const choices = [{ label: 'Nueva partida', primary: true }, { label: 'Volver al título' }];
  if (canContinue) choices.push({ label: 'Seguir jugando (modo infinito)', hint: rank >= 0 ? 'Sin límite de tiempo. El récord ya está guardado.' : 'Sin límite de tiempo.' });
  requestAnimationFrame(() => drawChart($('#chart-ending'), s));
  s.recorded = true;
  const i = await showModal({ title: e.title, kicker: rank >= 0 ? `FIN · Puesto ${rank + 1} del Salón de la fama` : 'FIN', image: e.image, html, wide: true, className: `ending ${e.tone}`, choices });
  if (i === 2) {
    s.ending = null;
    s.endless = true;
    resumePromises(s);
    log(s, '♾️ Manolo decide que jubilarse es de pobres. Modo infinito activado.', 'info');
    renderAll();
    return;
  }
  clearStorage();
  // Se difiere para que la cola de sucesos actual termine antes de empezar otra partida.
  setTimeout(() => (i === 0 ? startGame(newGame(undefined, s.difficulty)) : showTitle()));
}
