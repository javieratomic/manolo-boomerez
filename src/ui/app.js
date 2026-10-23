// Controlador principal de la interfaz.
import { $, esc, showModal, toast, confirmModal, isModalOpen } from './dom.js';
import { TABS, renderCity, renderEmpire, renderMarket, renderStaff, renderFinance, renderManolo, renderNews, drawChart, drawCategoryChart, manoloMood, renderWhy, whyTitle } from './panels.js';
import { macroFx } from '../core/macro.js';
import { MapView } from '../render/mapView.js';
import { initAssets, imageUrl, hasArt } from '../render/assets.js';
import { newGame, saveToStorage, loadFromStorage, clearStorage, serialize, deserialize, DIFFICULTIES } from '../core/state.js';
import { advanceMonth, currentPending, resolvePending, checkEnding, score, pickQuote } from '../core/sim.js';
import { patrimonio } from '../core/economy.js';
import { openBusiness, sellBusiness, buyUpgrade, setPolicy, togglePerk, borrow, repay, doManoloAction, dropMonthlyCost, currentGoal, goalNumber, checkGoals, rebrand, canRebrand, franchiseFee, LOAN_STEP } from '../core/actions.js';
import { play, isMuted, setMuted } from './sound.js';
import { startMusic, isMusicOn, setMusic } from './music.js';
import { checkAchievements } from './achievements.js';
import { loadRecords, addRecord } from './records.js';
import { actOnRival, acquireRival, acquisitionPrice } from '../core/rivals.js';
import { launchCampaign, startRD, upgradeBusiness, CAMPAIGN_BY_ID, PRODUCT_BY_ID } from '../core/market.js';
import { hireExec, fireExec, refreshCandidates, execOf, severance } from '../core/execs.js';
import { RIVALS } from '../data/rivals.js';
import { clauseStatus, clauseWarn } from '../core/clauses.js';
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
    startGame(newGame(undefined, diffs[i][0]));
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
        ${list.map((r, i) => `<tr><td>${i + 1}</td><td><b>${esc(r.title)}</b>${r.clausulaOk ? ' <span title="Cláusula del testamento cumplida">📜</span>' : ''}<div class="small muted">${esc(r.brand === 'maison' ? 'Maison' : 'Express')} · ${esc(diff(r.difficulty))} · ${r.months} meses · ${esc(r.date)}</div></td><td>${moneyShort(r.patrimonio)}</td><td>${r.score.toLocaleString('es-ES')}</td></tr>`).join('')}
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
  refreshCandidates(s);
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

function renderHUD(s) {
  const pat = patrimonio(s);
  $('#hud').innerHTML = `
    <div class="hud-brand">${esc(s.brand === 'maison' ? 'Maison Boomerez' : 'Boomerez S.L.')}</div>
    ${hudItem('icon_calendar', '📅', 'Fecha', `<span class="long">${dateLabel(s.month)}</span><span class="short">${dateLabel(s.month).slice(0, 3)} ${String(dateLabel(s.month)).slice(-2)}</span>`, `<span class="hud-sub">${s.endless ? `Mes ${s.month + 1} · ♾️` : `Mes ${Math.min(s.month + 1, GAME_MONTHS)}/${GAME_MONTHS}`}</span>`)}
    ${hudItem('icon_cash', '💶', 'Caja', `<span class="${s.cash < 0 ? 'neg' : ''}">${moneyShort(s.cash)}</span>`, '', 'Dinero disponible. Si baja de cero, el banco tira de la póliza.')}
    ${hudItem('icon_debt', '🏦', 'Deuda', moneyShort(s.debt), '', 'Lo que debes a la Caja Cantábrica. Genera intereses cada mes.')}
    ${hudItem('icon_patrimonio', '🏰', 'Patrimonio', moneyShort(pat), '', 'Caja − deuda + valor del obrador, los negocios y los caprichos. Es lo que cuenta para los finales.')}
    ${hudItem('icon_macro', macroFx(s).emoji, 'Economía', macroFx(s).label, '', macroFx(s).desc)}
    ${hudItem('icon_rep', '⭐', 'Reputación', Math.round(s.rep), meter(s.rep), 'Imagen pública. Multiplica la demanda de todos tus negocios.', 'rep')}
    ${hudItem('icon_moral', '🙂', 'Moral', Math.round(s.moral), meter(s.moral), 'Ánimo de la plantilla. Baja: peor servicio, denuncias y huelgas. Dos meses a 0: la plantilla se queda la empresa.', 'moral')}
    ${hudItem('icon_fama', '📣', 'Fama', Math.round(s.fama), meter(s.fama), 'Lo conocido que es Manolo. Impulsa la Maison y la Academy. Se desvanece si no la alimentas.', 'fama')}
    ${hudItem('icon_inspeccion', '🔎', 'Insp. Trabajo', Math.round(s.heatTrabajo), meter(s.heatTrabajo, true), 'Radar de la Inspección de Trabajo: cuanto más alto, más probable es una visita.', 'heatTrabajo')}
    ${hudItem('icon_hacienda', '🏛️', 'Hacienda', Math.round(s.heatHacienda), meter(s.heatHacienda, true), 'Radar de Hacienda: cuanto más alto, más probable es una auditoría.', 'heatHacienda')}
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

function renderGoal(s) {
  const g = currentGoal(s);
  const c = clauseStatus(s);
  const clause = c && c.state !== 'rota' ? `<span class="goal-clause ${c.state}">📜 ${esc(c.state === 'cumplida' ? `${c.def.title} · ¡cumplida!` : c.short)}</span>` : '';
  const el = $('#goal-chip');
  el.hidden = (!g && !clause) || !!s.ending;
  el.innerHTML = `${g ? `<span class="goal-kicker">🎯 Objetivo ${goalNumber(s)}</span>${esc(g.text)}` : ''}${clause}`;
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
    case 'repay':
      res = repay(s, el.dataset.amount === 'all' ? Infinity : LOAN_STEP);
      if (res.ok) toast(`Devueltos ${money(res.amount)}`, 'info');
      break;
    case 'manolo':
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
  if (el.dataset.act !== 'policy' || !game.s) return;
  const res = setPolicy(game.s, el.dataset.key, el.value);
  if (!res.ok) toast(res.msg, 'bad');
  renderAll();
}

async function showMenu() {
  const i = await showModal({
    title: 'Menú',
    text: 'La partida se guarda automáticamente en este navegador.',
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

function showHelp() {
  return showModal({
    title: 'Cómo se juega',
    wide: true,
    html: `
      <p>Cada turno es <b>un mes</b>. Tienes <b>8 años</b> para convertir el obrador de tu padre en un imperio... o en un caso de estudio. Sigue los <b>objetivos</b> del recuadro del mapa si no sabes por dónde empezar.</p>
      <h4>El negocio</h4>
      <ul>
        <li>📍 <b>Haz clic en una ciudad</b> para abrir negocios: tiendas de sobaos, pisos para la plantilla, pisos turísticos, tabernas, smash burgers, empanadas, gimnasios, coworkings, residencias de mayores... La estimación te dice cuánto ganarías al mes.</li>
        <li>🏭 Los sobaos salen del <b>obrador de Selaya</b>. Si no da abasto, mejóralo o tus tiendas venderán menos.</li>
        <li>🤝 Puedes <b>vender franquicias</b>: cobras el canon y el riesgo lo corre el franquiciado.</li>
        <li>🔨 Cada negocio propio se puede <b>reformar</b> (3 niveles) y cada ciudad admite <b>campañas de marketing</b>.</li>
        <li>🏢 Cuantos más negocios, más <b>estructura central</b>: crecer tiene rendimientos decrecientes.</li>
      </ul>
      <h4>El mercado (pestaña 📊)</h4>
      <ul>
        <li>📈 La economía pasa por <b>expansión, burbuja, crisis y recuperación</b>. En burbuja todo vale más (y luego cae); en crisis se compra barato.</li>
        <li>⚔️ <b>Cadenas rivales</b> aparecen y te copian donde ganas dinero. Puedes declararles una guerra de precios, robarles al encargado... o comprarlas con una OPA.</li>
        <li>🧪 <b>I+D</b>: desarrolla productos nuevos (quesada, sobao proteico, congelados...).</li>
      </ul>
      <h4>La gente</h4>
      <ul>
        <li>👷 En <b>Plantilla</b> eliges cuánto "optimizar" sueldos, horas y becarios, y fichas a tu <b>equipo directivo</b> (cada uno con su manía).</li>
        <li>🔎 Los <b>radares</b> de Inspección y Hacienda suben con las malas prácticas. Cuanto más altos, más visitas.</li>
        <li>😎 Manolo hace <b>una acción al mes</b> (LinkedIn, el bar, el alcalde, una cena con Merche...), se compra <b>caprichos</b> y puede sacar la empresa a <b>Bolsa</b>. Ojo con descuidar a Merche: estáis en gananciales.</li>
      </ul>
      <p>⌨️ Atajos: <b>Espacio</b> cierra el mes, <b>1-7</b> cambia de pestaña y <b>1-4</b> elige opción en las cartas.</p>
      <p><b>Finales:</b> bancarrota, prisión, que la plantilla se quede la empresa... o salir en la lista de millonarios de una revista económica (sección curiosidades).</p>`,
  });
}

// ------------------------------------------------------------ Bucle de mes
async function endMonth() {
  const s = game.s;
  if (!s || game.busy || s.ending || s.pending.length || isModalOpen()) return;
  game.busy = true;
  const prev = { rep: s.rep, moral: s.moral, fama: s.fama, ht: s.heatTrabajo, hh: s.heatHacienda };
  const r = advanceMonth(s);
  renderAll();
  if (r) {
    game.map.showProfits(r);
    play(r.net >= 0 ? 'cash' : 'loss');
    await showReport(r, prev);
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

function delta(label, a, b, invert = false) {
  const d = Math.round(b - a);
  if (!d) return '';
  const good = invert ? d < 0 : d > 0;
  return `<span class="delta ${good ? 'pos' : 'neg'}">${label} ${d > 0 ? '+' : ''}${d}</span>`;
}

function showReport(r, prev) {
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
        ${delta('Reputación', prev.rep, s.rep)}${delta('Moral', prev.moral, s.moral)}${delta('Fama', prev.fama, s.fama)}
        ${delta('Radar Inspección', prev.ht, s.heatTrabajo, true)}${delta('Radar Hacienda', prev.hh, s.heatHacienda, true)}
      </div>
      ${s.insolvencyMonths ? `<p class="neg"><b>🚨 Descubierto sin crédito: mes ${s.insolvencyMonths} de 3.</b></p>` : ''}
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
    if (p.event.memory && custom(s, p.pending.id).streak >= 3) {
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
  const html = `${e.text.split('\n').map((t) => `<p>${esc(t)}</p>`).join('')}
    <table class="tbl pl">
      <tr><td>Meses al frente</td><td>${s.month}</td></tr>
      <tr><td>Patrimonio final</td><td>${money(patrimonio(s))}</td></tr>
      <tr><td>Patrimonio máximo</td><td>${money(s.stats.maxPatrimonio)}</td></tr>
      <tr><td>Negocios abiertos</td><td>${s.stats.abiertos}</td></tr>
      <tr><td>Inspecciones de Trabajo</td><td>${s.stats.inspecciones}</td></tr>
      <tr><td>Auditorías de Hacienda</td><td>${s.stats.auditorias}</td></tr>
      <tr><td>Multas pagadas</td><td>${money(s.stats.multas)}</td></tr>
      ${cl ? `<tr><td>📜 Cláusula: ${esc(cl.def.title)}</td><td class="${cl.state === 'cumplida' ? 'pos' : cl.state === 'rota' ? 'neg' : ''}">${cl.state === 'cumplida' ? `Cumplida (×${String(cl.def.mult).replace('.', ',')})` : cl.state === 'rota' ? 'Rota' : 'No cumplida'}</td></tr>` : ''}
      <tr class="total"><td>Puntuación Boomerez</td><td>${score(s).toLocaleString('es-ES')}</td></tr>
    </table>
    <h4>Evolución del patrimonio</h4>
    <canvas id="chart-ending" height="140"></canvas>`;
  const rank = s.recorded ? -1 : addRecord({
    title: e.title, ending: id, patrimonio: Math.round(patrimonio(s)), score: score(s), months: s.month,
    brand: s.brand, difficulty: s.difficulty || 'normal', date: new Date().toLocaleDateString('es-ES'),
    clausula: cl?.def.id ?? null, clausulaOk: cl?.state === 'cumplida',
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
    log(s, '♾️ Manolo decide que jubilarse es de pobres. Modo infinito activado.', 'info');
    renderAll();
    return;
  }
  clearStorage();
  // Se difiere para que la cola de sucesos actual termine antes de empezar otra partida.
  setTimeout(() => (i === 0 ? startGame(newGame(undefined, s.difficulty)) : showTitle()));
}
