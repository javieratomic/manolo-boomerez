// Controlador principal de la interfaz.
import { $, esc, showModal, toast, confirmModal, isModalOpen } from './dom.js';
import { TABS, renderCity, renderEmpire, renderStaff, renderFinance, renderManolo, renderNews, drawChart, manoloMood } from './panels.js';
import { MapView } from '../render/mapView.js';
import { initAssets, imageUrl, hasArt } from '../render/assets.js';
import { newGame, saveToStorage, loadFromStorage, clearStorage, DIFFICULTIES } from '../core/state.js';
import { advanceMonth, currentPending, resolvePending, checkEnding, score, pickQuote } from '../core/sim.js';
import { patrimonio } from '../core/economy.js';
import { openBusiness, sellBusiness, buyUpgrade, setPolicy, togglePerk, borrow, repay, doManoloAction, dropMonthlyCost, currentGoal, checkGoals, rebrand, canRebrand, LOAN_STEP } from '../core/actions.js';
import { play, isMuted, setMuted } from './sound.js';
import { checkAchievements } from './achievements.js';
import { money, moneyShort, dateLabel, GAME_MONTHS } from '../core/helpers.js';
import { HQ_CITY, CITY_BY_ID } from '../data/cities.js';
import { BUSINESS_TYPES } from '../data/businesses.js';
import { ENDINGS } from '../data/endings.js';

const game = { s: null, tab: 'ciudad', city: HQ_CITY, map: null, busy: false };
window.__boomerez = game; // para depurar desde la consola

export async function boot() {
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
  for (const a of checkAchievements(s)) {
    play('goal');
    toast(`🏆 Logro: ${a.name}`, 'good');
  }
}

function hudItem(icon, emoji, label, value, extra = '', title = '') {
  const img = hasArt(icon) ? `<img src="${imageUrl(icon)}" alt="">` : `<span class="emoji">${emoji}</span>`;
  return `<div class="hud-item" title="${esc(title || label)}">${img}<div><span class="hud-label">${label}</span><span class="hud-value">${value}</span>${extra}</div></div>`;
}

function meter(v, danger = false) {
  return `<div class="meter ${danger ? (v > 66 ? 'hot' : v > 40 ? 'warm' : '') : v < 25 ? 'hot' : v < 45 ? 'warm' : 'good'}"><span style="width:${Math.round(v)}%"></span></div>`;
}

function renderHUD(s) {
  const pat = patrimonio(s);
  $('#hud').innerHTML = `
    <div class="hud-brand">${esc(s.brand === 'maison' ? 'Maison Boomerez' : 'Boomerez S.L.')}</div>
    ${hudItem('icon_calendar', '📅', 'Fecha', `<span class="long">${dateLabel(s.month)}</span><span class="short">${dateLabel(s.month).slice(0, 3)} ${String(dateLabel(s.month)).slice(-2)}</span>`, `<span class="hud-sub">Mes ${Math.min(s.month + 1, GAME_MONTHS)}/${GAME_MONTHS}</span>`)}
    ${hudItem('icon_cash', '💶', 'Caja', `<span class="${s.cash < 0 ? 'neg' : ''}">${moneyShort(s.cash)}</span>`, '', 'Dinero disponible. Si baja de cero, el banco tira de la póliza.')}
    ${hudItem('icon_debt', '🏦', 'Deuda', moneyShort(s.debt), '', 'Lo que debes a la Caja Cantábrica. Genera intereses cada mes.')}
    ${hudItem('icon_patrimonio', '🏰', 'Patrimonio', moneyShort(pat), '', 'Caja − deuda + valor de obrador, negocios e inmuebles. Es lo que cuenta para los finales.')}
    ${hudItem('icon_rep', '⭐', 'Reputación', Math.round(s.rep), meter(s.rep), 'Imagen pública. Multiplica la demanda de todos tus negocios.')}
    ${hudItem('icon_moral', '🙂', 'Moral', Math.round(s.moral), meter(s.moral), 'Ánimo de la plantilla. Baja: peor servicio, denuncias y huelgas. A 0: la plantilla se queda la empresa.')}
    ${hudItem('icon_fama', '📣', 'Fama', Math.round(s.fama), meter(s.fama), 'Lo conocido que es Manolo. Impulsa la Maison y la Academy. Se desvanece si no la alimentas.')}
    ${hudItem('icon_inspeccion', '🔎', 'Insp. Trabajo', Math.round(s.heatTrabajo), meter(s.heatTrabajo, true), 'Radar de la Inspección de Trabajo: cuanto más alto, más probable es una visita.')}
    ${hudItem('icon_hacienda', '🏛️', 'Hacienda', Math.round(s.heatHacienda), meter(s.heatHacienda, true), 'Radar de Hacienda: cuanto más alto, más probable es una auditoría.')}
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
    plantilla: () => renderStaff(s),
    finanzas: () => renderFinance(s),
    manolo: () => renderManolo(s),
    noticias: () => renderNews(s),
  };
  body.innerHTML = map[game.tab]();
  body.scrollTop = scroll;
  if (game.tab === 'finanzas') drawChart($('#chart'), s);
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
  const el = $('#goal-chip');
  el.hidden = !g || !!s.ending;
  if (g) el.innerHTML = `<span class="goal-kicker">🎯 Objetivo ${Math.min((s.goalIndex ?? 0) + 1, 99)}</span>${esc(g.text)}`;
}

async function showNotices() {
  const s = game.s;
  while (s?.notices?.length) {
    const n = s.notices.shift();
    play('goal');
    await showModal({ title: n.title, kicker: '🎯 Objetivo', portrait: 'portrait_manolo_happy', text: n.text });
  }
  renderAll();
}

function renderManoloBox(s) {
  $('#manolo-portrait').src = imageUrl(`portrait_manolo_${manoloMood(s)}`);
  $('#manolo-bubble').textContent = s.quote || '';
}

// ------------------------------------------------------------------ Acciones
function bindGlobal() {
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
    if (e.code === 'Space' || e.key === 'Enter') {
      e.preventDefault();
      endMonth();
    }
    const idx = '123456'.indexOf(e.key);
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
          `Un emprendedor local te paga ${money(t.franchiseFee)} de canon y monta la tienda con su dinero. Tú le vendes los sobaos a precio mayorista y cobras un 5 % de royalties.\n\nSi pierde dinero 4 meses seguidos, quebrará... y vendrá a pedirte explicaciones.`, 'Firmar');
        if (!ok) return;
      }
      res = openBusiness(s, el.dataset.type, game.city, el.dataset.mode);
      if (res.ok) play(el.dataset.mode === 'franquicia' ? 'cash' : 'build');
      if (res.ok) toast(el.dataset.mode === 'franquicia' ? `🤝 Franquicia vendida en ${CITY_BY_ID[game.city].name}` : `🏗️ ${t.name} abierto en ${CITY_BY_ID[game.city].name}`, 'good');
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
      { label: isMuted() ? 'Activar el sonido' : 'Silenciar el sonido' },
      { label: 'Volver al título' },
      { label: 'Reiniciar partida', danger: true },
    ],
    dismissable: true,
  });
  if (i === 1) showHelp();
  if (i === 2) {
    setMuted(!isMuted());
    play('click');
    toast(isMuted() ? '🔇 Sonido desactivado' : '🔊 Sonido activado');
  }
  if (i === 3) showTitle();
  if (i === 4 && (await confirmModal('¿Reiniciar?', 'Perderás la partida actual.', 'Reiniciar'))) {
    clearStorage();
    startGame(newGame());
  }
}

function showHelp() {
  return showModal({
    title: 'Cómo se juega',
    wide: true,
    html: `
      <p>Cada turno es <b>un mes</b>. Tienes <b>8 años</b> para convertir el obrador de tu padre en un imperio... o en un caso de estudio.</p>
      <ul>
        <li>📍 <b>Haz clic en una ciudad</b> del mapa para abrir negocios. La estimación te dice cuánto ganarías al mes.</li>
        <li>🏭 Los sobaos salen del <b>obrador de Selaya</b>. Si no da abasto, mejóralo o tus tiendas venderán menos.</li>
        <li>🤝 Puedes <b>vender franquicias</b>: cobras el canon y no arriesgas tu dinero. El riesgo lo corre el franquiciado.</li>
        <li>👷 En <b>Plantilla</b> eliges cuánto "optimizar" sueldos, horas y becarios. Es más barato y es más peligroso.</li>
        <li>🔎 Los <b>radares</b> de Inspección y Hacienda suben con las malas prácticas. Cuanto más altos, más visitas.</li>
        <li>😎 Manolo puede hacer <b>una acción al mes</b>: LinkedIn, el bar, el alcalde...</li>
        <li>⌨️ Atajos: <b>Espacio</b> cierra el mes, <b>1-6</b> cambia de pestaña y <b>1-4</b> elige opción en las cartas.</li>
      </ul>
      <p><b>Finales:</b> bancarrota, prisión, que la plantilla se quede la empresa... o salir en Forbes (sección curiosidades).</p>`,
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
  }
  game.busy = false;
  await processQueue();
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
  const html = `${e.text.split('\n').map((t) => `<p>${esc(t)}</p>`).join('')}
    <table class="tbl pl">
      <tr><td>Meses al frente</td><td>${s.month}</td></tr>
      <tr><td>Patrimonio final</td><td>${money(patrimonio(s))}</td></tr>
      <tr><td>Patrimonio máximo</td><td>${money(s.stats.maxPatrimonio)}</td></tr>
      <tr><td>Negocios abiertos</td><td>${s.stats.abiertos}</td></tr>
      <tr><td>Inspecciones de Trabajo</td><td>${s.stats.inspecciones}</td></tr>
      <tr><td>Auditorías de Hacienda</td><td>${s.stats.auditorias}</td></tr>
      <tr><td>Multas pagadas</td><td>${money(s.stats.multas)}</td></tr>
      <tr class="total"><td>Puntuación Boomerez</td><td>${score(s).toLocaleString('es-ES')}</td></tr>
    </table>`;
  const i = await showModal({ title: e.title, kicker: 'FIN', image: e.image, html, wide: true, className: `ending ${e.tone}`, choices: [{ label: 'Nueva partida', primary: true }, { label: 'Volver al título' }] });
  clearStorage();
  // Se difiere para que la cola de sucesos actual termine antes de empezar otra partida.
  setTimeout(() => (i === 0 ? startGame(newGame()) : showTitle()));
}
