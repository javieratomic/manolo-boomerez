// Regresiones de la segunda ronda de jugadores simulados (interfaz leída como texto y nombres accesibles).
import { test, assert, assertEq } from './runner.js';
import { newGame } from '../src/core/state.js';
import { resolvePending } from '../src/core/sim.js';
import { openBusiness, canOpen, sobaoTypeId } from '../src/core/actions.js';
import { obradorCapacity, estimateOpening } from '../src/core/economy.js';
import { cityAlerts } from '../src/core/mapInfo.js';
import { OBRADOR_UPGRADES } from '../src/data/businesses.js';
import { HELP_PAGES } from '../src/data/help.js';
import { CITY_BY_ID } from '../src/data/cities.js';
import { fillPct } from '../src/core/helpers.js';
import { NAV_GROUPS, TABS, renderNavigation } from '../src/ui/navigation.js';
import { renderStarterCities, starterAdvice, renderMapAlerts, housingFolded, openingFigure } from '../src/ui/panels.js';

const fresh = () => { const s = newGame(7, 'normal', 'classic'); resolvePending(s, 0); resolvePending(s, 0); s.notices = []; return s; };
const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const attrs = (h, name) => [...h.matchAll(new RegExp(`${name}="([^"]*)"`, 'g'))].map((m) => m[1]);

test('ui ronda 2: ningún área se llama igual que una pestaña y la abierta lo dice', () => {
  const tabNames = new Set(TABS.map((t) => t.label));
  for (const g of NAV_GROUPS) assert(!tabNames.has(g.label), `«${g.label}» es área y pestaña a la vez`);
  for (const t of TABS) {
    const h = renderNavigation(t.id), group = NAV_GROUPS.find((g) => g.id === t.group);
    assertEq(attrs(h, 'aria-expanded').filter((x) => x === 'true').length, 1);
    assert(h.includes(`aria-expanded="true" aria-controls="nav-sections" aria-label="Área ${group.label} (abierta): `), t.id);
    assert(h.includes(`id="nav-sections"`) && h.includes(`aria-label="Menús de ${group.label}"`), t.id);
    assert(!h.includes('aria-pressed'), 'los grupos no son interruptores');
    // El nombre accesible de cada área enumera sus menús: cambiar de área ya no es silencioso.
    for (const g of NAV_GROUPS) assert(h.includes(TABS.filter((x) => x.group === g.id).map((x) => x.label).join(', ')), g.id);
  }
});

test('ui ronda 2: las ciudades recomendadas siguen hasta 3 tiendas y avisan del obrador', () => {
  const s = fresh();
  const first = starterAdvice(s).rows[0];
  assert(first && first.delta > 0);
  assert(renderStarterCities(s, CITY_BY_ID.selaya).includes('Ciudades recomendadas'));
  openBusiness(s, s.brand, first.city, first.mode);
  const a = starterAdvice(s), h = renderStarterCities(s, CITY_BY_ID.selaya);
  assert(h.includes('Ciudades recomendadas'), 'con una tienda la tarjeta sigue');
  assert(h.includes('Tienes 1 de 3 tiendas de sobaos'));
  // Con la primera tienda el obrador de 12.000 uds ya no da: nada positivo y el aviso lleva a Selaya.
  assertEq(a.rows.length, 0); assert(a.bottleneck); assert(a.best.fillAfter < 0.999);
  assert(text(h).includes('El obrador es el cuello de botella'));
  // En Selaya «ir a Selaya» no hacía nada: el enlace baja a la tarjeta del obrador, que está en la misma pantalla.
  assert(h.includes('href="#obrador-boomerez"') && !h.includes('data-city="selaya"'), 'en Selaya enlaza a la tarjeta');
  assert(text(h).includes('Amplía el obrador más abajo, en Obrador Boomerez'));
  assert(renderStarterCities(s, CITY_BY_ID.santander).includes('data-act="goto-city" data-city="selaya"'), 'fuera de Selaya lleva allí');
  assert(!/−[\d.]+ €\/mes/.test(text(h)), 'no recomienda opciones con pérdidas');
  // Con el obrador ampliado vuelven las recomendaciones positivas y desaparece el aviso.
  for (const u of OBRADOR_UPGRADES) s.obrador.upgrades.push(u.id);
  assert(obradorCapacity(s) > 12000);
  const b = starterAdvice(s, 3);
  assert(b.rows.length > 0 && b.rows.every((r) => r.delta > 0)); assert(!b.bottleneck);
  for (const city of ['bilbao', 'madrid']) { s.cash += 1e5; assert(openBusiness(s, s.brand, city, 'propia').ok, city); }
  assertEq(renderStarterCities(s, CITY_BY_ID.selaya), '', 'con 3 tiendas desaparece');
});

test('ui ronda 2: tras la primera tienda se culpa al obrador aunque la opción de mayor delta sea un pueblo', () => {
  const s = fresh();
  assert(openBusiness(s, s.brand, 'bilbao', 'propia').ok);
  const a = starterAdvice(s), h = text(renderStarterCities(s, CITY_BY_ID.selaya));
  // La opción de mayor delta cubre más del 90 % (pierde por sí sola); antes por eso no se culpaba al obrador
  // y la tarjeta mandaba a pedir un préstamo, aunque con 1 M€ de caja las cifras son las mismas.
  assertEq(a.rows.length, 0); assert(a.bottleneck); assert(!a.loan);
  assert(a.best.fillAfter < 0.9, JSON.stringify(a.best));
  assert(h.includes(`El obrador es el cuello de botella: abriendo en ${CITY_BY_ID[a.best.city].name} solo cubrirías el ${fillPct(a.best.fillAfter)} de la demanda y ninguna tienda propia ni franquicia sana (sin pérdidas para su dueño) daría beneficio`), h);
  assert(!h.includes('préstamo'), h);
  s.cash = 1e6;
  assertEq(starterAdvice(s).rows.length, 0, 'la caja no arregla nada');
});

test('ui ronda 2: sin tope del obrador, el préstamo solo se sugiere si arregla algo', () => {
  const s = fresh();
  for (const u of OBRADOR_UPGRADES) s.obrador.upgrades.push(u.id);
  s.cash += 2e5; assert(openBusiness(s, s.brand, 'bilbao', 'propia').ok);
  // Demanda de sobaos hundida a mano: con todo el obrador ampliado nada baja del 90 % de cobertura.
  const mod = { kind: 'revenue', category: 'sobaos', factor: 0.35, months: 12 };
  s.mods.push(mod); s.cash = 500;
  let a = starterAdvice(s), h = text(renderStarterCities(s, CITY_BY_ID.selaya));
  assertEq(a.rows.length, 0); assert(!a.bottleneck && !a.loan, JSON.stringify(a));
  assert(h.includes('Ahora mismo ninguna tienda propia ni franquicia sana (sin pérdidas para su dueño) da beneficio. Compara en Imperio → Aperturas.') && !h.includes('préstamo') && !h.includes('cuello de botella'), h);
  // Con algo menos de castigo hay una tienda rentable que no puedes pagar: ahí sí, el préstamo.
  mod.factor = 0.4;
  a = starterAdvice(s); h = text(renderStarterCities(s, CITY_BY_ID.selaya));
  assertEq(a.rows.length, 0); assert(a.loan && !a.bottleneck, JSON.stringify(a));
  assert(h.includes('pide un préstamo en Finanzas'), h);
});

test('ui ronda 2: las recomendaciones marcan lo que rompería la cláusula', () => {
  const s = fresh();
  s.clausula = { id: 'cornisa', broken: false, done: false };
  const { rows } = starterAdvice(s);
  const before = JSON.stringify(s);
  const zgz = rows.find((r) => r.city === 'zaragoza'), bio = rows.find((r) => r.city === 'bilbao');
  assert(zgz?.clauseBreaks, 'Zaragoza (Aragón) rompe «De aquí no se sale»');
  assert(bio && !bio.clauseBreaks, 'Bilbao (País Vasco) la respeta');
  const h = text(renderStarterCities(s, CITY_BY_ID.selaya));
  assert(/Zaragoza · propia \([^)]*\) · \+[\d.]+ €\/mes · rompe la cláusula del testamento/.test(h), h);
  assert(!/Bilbao · propia \([^)]*\) · \+[\d.]+ €\/mes · rompe/.test(h));
  assertEq(JSON.stringify(s), before, 'consultar no cambia la partida');
  assert(!s.clausula.broken);
});

test('ui ronda 2: la vivienda se pliega si no hay caja ni faltan plazas', () => {
  const s = fresh();
  const f = housingFolded(s, 'selaya');
  assert(f && f.cost > s.cash, 'con 80 k€ y sin falta de plazas se pliega');
  s.cash = f.cost;
  assertEq(housingFolded(s, 'selaya'), null, 'si alcanza la caja, se muestra entera');
});

test('ui ronda 2: las alertas del mapa se leen como lista con enlaces a su ciudad', () => {
  const s = fresh();
  assertEq(renderMapAlerts(s), '');
  openBusiness(s, s.brand, 'bilbao', 'franquicia');
  s.businesses.find((b) => b.city === 'bilbao').lossMonths = 3;
  const n = Object.values(cityAlerts(s)).reduce((k, l) => k + l.length, 0);
  assertEq(n, 1);
  const h = renderMapAlerts(s), line = renderMapAlerts(s, true);
  assert(h.includes('Alertas en el mapa (1)'));
  assert(h.includes('data-act="goto-city" data-city="bilbao"'));
  assert(text(h).includes('El franquiciado quiebra si pierde otro mes'));
  assert(text(line).includes('1 alerta en el mapa: Bilbao'));
});

test('ui ronda 2: sin caja, solo los sobaos pagan la cifra después de impuestos en Ciudad', () => {
  const s = fresh();
  s.unlocked.taberna = true; s.cash = 0;
  // La fila de sobaos simula la apertura (la cifra de Imperio → Aperturas); el resto de negocios bloqueados por
  // caja se quedan con la estimación barata: con 99 negocios simularlos todos pasaba de 50 ms por render.
  const figure = (type) => openingFigure(s, type, 'bilbao', 'propia', canOpen(s, type, 'bilbao', 'propia'));
  for (const type of [sobaoTypeId(s), 'taberna']) assert(!canOpen(s, type, 'bilbao', 'propia').ok, type);
  assert(figure(sobaoTypeId(s)).afterTax, 'sobaos: después de impuestos');
  const tab = figure('taberna');
  assert(!tab.afterTax, 'taberna sin caja: antes de impuestos');
  assertEq(tab.delta, estimateOpening(s, 'taberna', 'bilbao', 'propia').delta);
  s.cash = 1e6;
  assert(figure('taberna').afterTax, 'con caja, también la taberna da la cifra después de impuestos');
});

test('ui ronda 2: la ayuda y los avisos dan la ruta completa a la pestaña Manolo', () => {
  const help = JSON.stringify(HELP_PAGES);
  assert(!help.includes('pestaña Manolo') && !help.includes('desde Manolo.'), 'la barra muestra Vida, no Manolo');
  assertEq(help.split('Vida → Manolo').length - 1, 3);
});

// --- Ronda 3: el «muro del obrador» tras la primera tienda (la salida, cómo pagarla y la capacidad libre).
import { financeHint, spareText } from '../src/ui/panels.js';
import { nextUpgrade } from '../src/core/actions.js';
import { creditLimit, computeEconomy } from '../src/core/economy.js';
import { canAsk } from '../src/core/cartilla.js';
import { advanceMonth, currentPending } from '../src/core/sim.js';
import { money } from '../src/core/helpers.js';
import { GOALS } from '../src/data/goals.js';

const afterFirstShop = (seed = 7) => { const s = newGame(seed, 'normal', 'classic'); resolvePending(s, 0); resolvePending(s, 0); s.notices = []; assert(openBusiness(s, s.brand, starterAdvice(s).rows[0].city, starterAdvice(s).rows[0].mode).ok); return s; };
// money usa espacio duro; text() lo convierte en espacio normal.
const eur = (x) => text(money(x));
const closeMonth = (s) => { while (currentPending(s)) resolvePending(s, 0); advanceMonth(s); while (currentPending(s)) resolvePending(s, 0); };

test('ui ronda 3: la ampliación sin caja dice cuánto falta y la póliza que queda', () => {
  const s = afterFirstShop(), up = nextUpgrade(s);
  assert(s.cash < up.cost, 'tras la primera tienda no llega la caja');
  let h = financeHint(s, up.cost);
  assert(text(h).includes(`Te faltan ${eur(up.cost - s.cash)}. Tienes ${eur(creditLimit(s) - s.debt)} de póliza disponible en Empresa → Finanzas`), h);
  assert(h.includes('data-act="tab" data-tab="finanzas"'));
  // Con la póliza casi agotada: los meses de neto que faltarían; tu madre solo si hoy prestaría.
  s.debt = creditLimit(s) - 10000; s.lastReport = { ...(s.lastReport || {}), net: 5000 };
  const rest = up.cost - s.cash - 10000, months = Math.ceil(rest / 5000);
  h = text(financeHint(s, up.cost));
  assert(h.includes(`la póliza solo tiene ${eur(10000)} disponibles`), h);
  assert(h.includes(`tardarías ${months} meses en reunir los ${eur(rest)} restantes`), h);
  assertEq(canAsk(s).ok, false); assert(!h.includes('Doña Remedios'), 'si no presta, no se menciona');
  s.month = 6; s.cash = 20000;
  assert(canAsk(s).ok, canAsk(s).msg);
  assert(text(financeHint(s, up.cost)).includes(`Doña Remedios puede prestarte hasta ${eur(canAsk(s).max)}`));
  s.cash = up.cost; assertEq(financeHint(s, up.cost), '', 'con caja no hay aviso');
});

test('ui ronda 3: el cuello de botella da la salida concreta y no hay «franquicias sanas» ocultas sin decirlo', () => {
  const s = afterFirstShop(), up = nextUpgrade(s);
  const h = text(renderStarterCities(s, CITY_BY_ID.selaya));
  assert(h.includes(`Salida: ${up.name} por ${eur(up.cost)}, +10.000 uds/mes con Sobaos Manolo Express. Te faltan ${eur(up.cost - s.cash)}.`), h);
  // Semilla 1 tras un cierre: ninguna opción sana, pero Aperturas lista franquicias que hunden a su dueño.
  const t = afterFirstShop(1); closeMonth(t);
  const a = starterAdvice(t), ht = text(renderStarterCities(t, CITY_BY_ID.selaya));
  assertEq(a.rows.length, 0); assert(a.ruinous > 0, JSON.stringify(a));
  assert(ht.includes(`Imperio → Aperturas también lista ${a.ruinous} franquicias que te darían beneficio a ti pero pérdidas a su dueño`), ht);
});

test('ui ronda 3: el obrador no dice «capacidad libre» si no cabe otra tienda', () => {
  let hits = 0;
  for (const seed of [1, 2, 3]) {
    const s = afterFirstShop(seed);
    for (let m = 0; m < 6; m++) {
      const r = computeEconomy(s), a = starterAdvice(s);
      if (r.fill >= 0.999) {
        const t = spareText(s, obradorCapacity(s) - r.totalDemand);
        assert(t.startsWith(`Quedan ${Math.round(obradorCapacity(s) - r.totalDemand).toLocaleString('es-ES')} uds/mes libres`), t);
        if (a.bottleneck) assert(!t.endsWith('cabe otra tienda.'), `${seed}/${s.month}: ${t}`);
        if (t.includes('no bastan para otra tienda')) hits++;
      }
      closeMonth(s);
    }
  }
  assert(hits > 0, 'algún mes con 11.700 de 12.000 uds el obrador dice que no cabe otra tienda');
});

test('ui ronda 3: sin apertura rentable el obrador da solo la cifra libre, sin compararla con tiendas que pierden', () => {
  // Semilla 7, mes 1: Aperturas dice que nada da beneficio; antes el obrador decía «bastan para la tienda que menos pide».
  const s = afterFirstShop(7); let seen = 0;
  for (let m = 0; m < 6; m++) {
    closeMonth(s);
    const r = computeEconomy(s), a = starterAdvice(s);
    if (r.fill < 0.999 || !a.bottleneck || a.rows.length) continue;
    const t = spareText(s, obradorCapacity(s) - r.totalDemand);
    assert(!t.includes('bastan para la tienda') && !t.includes('cabe otra tienda'), `${s.month}: ${t}`);
    if (!t.includes('no bastan para otra tienda')) assertEq(t, `Quedan ${Math.round(obradorCapacity(s) - r.totalDemand).toLocaleString('es-ES')} uds/mes libres.`, `${s.month}: ${t}`);
    seen++;
  }
  assert(seen > 0, 'la semilla 7 tiene meses con el obrador de cuello de botella y ninguna apertura rentable');
});

test('ui ronda 3: los objetivos dicen dónde se abre el obrador regional y la campaña no presupone vallas', () => {
  const g = (id) => GOALS.find((x) => x.id === id);
  assert(g('regional').text.includes('6 tiendas de sobaos') && g('regional').text.includes('mes 24') && g('regional').text.includes('«Abrir en…»'), g('regional').text);
  const s = fresh();
  assert(!g('campana').reward(s).includes('valla'));
});
