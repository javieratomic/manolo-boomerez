// Cifras que no cuadraban entre pantallas (auditoría con jugadores simulados, frente B).
import { test, assert, assertEq } from './runner.js';
import { newGame } from '../src/core/state.js';
import { advanceMonth, resolvePending } from '../src/core/sim.js';
import { computeEconomy, estimateOpening, patrimonio } from '../src/core/economy.js';
import { openingCost, sobaoTypeId } from '../src/core/actions.js';
import { openingPlan, openingOpportunities, openingDelta, starterOpenings } from '../src/core/opportunities.js';
import { renderOpportunities } from '../src/ui/opportunities.js';
import { netDrivers, monthDigest, obradorNote, yearWealth, honestRadarText, revenueMods, MAX_DRIVERS } from '../src/core/digest.js';
import { playGame } from './bot.js';
import { launchCampaign } from '../src/core/market.js';
import { doManoloAction } from '../src/core/actions.js';

const fresh = (seed = 7) => { const s = newGame(seed, 'normal', 'classic'); resolvePending(s, 0); s.notices = []; return s; };
const resolveAll = (s) => { while (s.pending.length) resolvePending(s, 0); };

test('números: Ciudades recomendadas da la misma cifra que Imperio → Aperturas', () => {
  const s = fresh(), type = sobaoTypeId(s);
  // Antes: Sevilla propia +2540 €/mes (antes de impuestos) frente a +1905 €/mes en Aperturas.
  const pre = estimateOpening(s, type, 'sevilla', 'propia').delta, plan = openingPlan(s, { type, city: 'sevilla', mode: 'propia' });
  assert(plan.ok, plan.msg);
  assert(Math.abs(pre - plan.deltaNet) > 100, 'el caso de partida sigue reproduciendo la diferencia (impuestos)');
  assertEq(openingDelta(s, type, 'sevilla', 'propia').delta, plan.deltaNet);
  const rows = starterOpenings(s);
  assert(rows.length > 0);
  const study = openingOpportunities(s, { type, mode: 'both', country: 'espana' }).rows;
  for (const r of rows) {
    const same = study.find((x) => x.choice.city === r.city && x.choice.mode === r.mode);
    assertEq(r.delta, same.deltaNet, `${r.city} ${r.mode}`);
  }
});

test('números: una apertura bloqueada solo por caja enseña su estimación y no se hunde', () => {
  const s = fresh(), type = sobaoTypeId(s), cost = openingCost(s, type, 'propia', 'sevilla');
  const rich = structuredClone(s); rich.cash = cost;
  const ref = openingPlan(rich, { type, city: 'sevilla', mode: 'propia' });
  s.cash = 1000;
  const p = openingPlan(s, { type, city: 'sevilla', mode: 'propia' });
  assert(!p.ok && /en caja/.test(p.msg), p.msg);
  assertEq(p.cashShort, cost - 1000);
  assertEq(Math.round(p.deltaNet), Math.round(ref.deltaNet));
  // Bloqueada por otra cosa: sin estimación.
  assertEq(openingPlan(s, { type, city: 'lisboa', mode: 'propia' }).deltaNet, undefined);
  const rows = openingOpportunities(s, { type, mode: 'propia', country: 'espana', showBlocked: true }).rows;
  const i = rows.findIndex((r) => r.choice.city === 'sevilla');
  assert(i >= 0 && rows.slice(0, i).every((r) => r.deltaNet >= p.deltaNet), 'ordenada por su mejora, no al final');
  const html = renderOpportunities(s, { type, mode: 'propia', country: 'espana', showBlocked: true, query: 'sevilla' });
  assert(/Si tuvieras la caja, cambio neto de la empresa/.test(html), html);
  assert(/Te faltan/.test(html));
});

test('números: las partidas del «Por qué» suman la variación del neto', () => {
  let checked = 0, prev = null;
  playGame(4, { months: 30, diversify: true, smart: true, leverage: true, hook: (s) => {
    const r = s.lastReport;
    if (prev && r && prev.month === r.month - 1) {
      const d = monthDigest(prev, r, s, s.log[0], []);
      assert(d.drivers.length <= MAX_DRIVERS);
      const listed = [...d.drivers, ...(d.rest ? [d.rest] : [])].reduce((a, x) => a + x.delta, 0);
      const min = Math.max(500, 0.03 * Math.abs(prev.net));
      assert(Math.abs(listed - (r.net - prev.net)) < min, `mes ${r.month}: ${Math.round(listed)} frente a ${Math.round(r.net - prev.net)}`);
      if (d.rest) assertEq(Math.round(listed), Math.round(r.net - prev.net));
      checked++;
    }
    prev = r;
  } });
  assert(checked > 20);
});

test('números: un modificador de ingresos de un mes aparece en el parte', () => {
  const s = fresh();
  s.mods.push({ kind: 'revenue', factor: 0.93, months: 1, label: 'Vacaciones' });
  const mods = s.mods.map((m) => ({ ...m })), prev = computeEconomy(s), head = s.log[0];
  const r = advanceMonth(s);
  assert(!s.mods.some((m) => m.label === 'Vacaciones'), 'ya ha caducado al escribir el parte');
  const d = monthDigest(prev, r, s, head, mods);
  assert(d.revenueMods.some((m) => m.text === 'Vacaciones: demanda −7 %'), JSON.stringify(d.revenueMods));
  resolveAll(s);
});

test('números: el parte del obrador dice el mes y no contradice el panel', () => {
  let note = null, now = null;
  // Partida real: cierre de enero al 99 % y febrero con capacidad libre (12.000 frente a 11.297).
  playGame(4, { months: 2, diversify: true, smart: true, leverage: true, hook: (s) => {
    if (s.month !== 1) return;
    note = obradorNote(s.lastReport, s); now = computeEconomy(s);
  } });
  assert(note, 'se reproduce el cierre por debajo del 100 %');
  assert(now.fill >= 0.999);
  assert(!note.short);
  assert(/^En enero de \d{4} el obrador sirvió/.test(note.text), note.text);
  assert(/Para febrero de \d{4} .*hay capacidad libre/.test(note.text), note.text);
  assertEq(obradorNote({ ...now, fill: 1 }, fresh()), null);
});

test('números: el balance anual usa el patrimonio del HUD al empezar y al acabar', () => {
  const s = fresh(5);
  const start = Math.round(patrimonio(s));
  s.yearOpen = { month: 0, patrimonio: start };
  let r = null;
  for (let i = 0; i < 12; i++) { r = advanceMonth(s); resolveAll(s); }
  assertEq(r.month, 11);
  const y = yearWealth(s, r);
  assertEq(y.start, start); // antes: el cierre de enero
  assert(s.history[0].patrimonio !== start, 'el cierre de enero no es el inicio');
  assertEq(y.end, Math.round(patrimonio(s)));
  assert(/^1 de enero de \d{4}$/.test(y.startLabel), y.startLabel);
  delete s.yearOpen;
  const old = yearWealth(s, r);
  assert(/^cierre de enero de \d{4}$/.test(old.startLabel), old.startLabel);
});

test('números: un radar no baja más de lo que marcaba', () => {
  const t = 'Se va, y tacha algo en su carpeta. Radar de Inspección −40.';
  assertEq(honestRadarText(t, { heatTrabajo: 4 }, { heatTrabajo: 0 }), 'Se va, y tacha algo en su carpeta. Radar de Inspección −4 (estaba en 4 y no baja de 0).');
  assertEq(honestRadarText(t, { heatTrabajo: 50 }, { heatTrabajo: 10 }), t);
  assertEq(honestRadarText('Radar de Hacienda −50.', { heatHacienda: 12 }, { heatHacienda: 0 }), 'Radar de Hacienda −12 (estaba en 12 y no baja de 0).');
  assertEq(honestRadarText('Moral +8, radar de Inspección −10.', { heatTrabajo: 3 }, { heatTrabajo: 0 }), 'Moral +8, radar de Inspección −3 (estaba en 3 y no baja de 0).');
});

test('números: netDrivers sigue limitado y en orden', () => {
  const s = fresh(), prev = computeEconomy(s), r = JSON.parse(JSON.stringify(prev));
  r.month++; r.revenueByCat.sobaos -= 5000; r.costs.estructura += 1000; r.costs.intereses += 800; r.costs.salarios += 700; r.net = prev.net - 7500;
  const d = netDrivers(prev, r, s);
  assertEq(d.length, MAX_DRIVERS);
  const md = monthDigest(prev, r, s, s.log[0], []);
  assertEq(md.rest?.label, 'Resto de partidas');
  assertEq(Math.round(md.rest.delta), -700);
});

test('números: una campaña de temporada solo sale en el parte de los meses en que suma', () => {
  const s = fresh();
  for (let i = 0; i < 8; i++) { s.cash = 1e6; advanceMonth(s); resolveAll(s); }
  s.cash = 1e6;
  assertEq(s.month % 12, 8);
  assert(launchCampaign(s, 'navidad').ok);
  const seen = {};
  for (let i = 0; i < 3; i++) {
    const mods = s.mods.map((m) => ({ ...m })), prev = s.lastReport, head = s.log[0];
    const r = advanceMonth(s);
    seen[r.month % 12] = monthDigest(prev, r, s, head, mods).revenueMods.map((m) => m.text);
    resolveAll(s);
  }
  // Antes: «Campaña de regalos de Navidad: ingresos +20 %» también en septiembre y octubre, sin sumar nada.
  assertEq(seen[8].length, 0, JSON.stringify(seen[8]));
  assertEq(seen[9].length, 0, JSON.stringify(seen[9]));
  assert(seen[10].some((t) => /^Campaña de regalos de Navidad \(.*Express.*\): demanda \+20 %$/.test(t)), JSON.stringify(seen[10]));
});

test('números: el parte dice a qué tipos y país toca un modificador de ingresos', () => {
  const [a] = revenueMods([{ kind: 'revenue', city: 'sevilla', types: ['express'], factor: 0.5, months: 1, label: 'Avería' }], 3);
  // «demanda», como Marketing: el factor multiplica lo que se pide (bizMult), no lo vendido con el obrador lleno.
  assertEq(a.text, 'Avería en Sevilla (Express): demanda −50 %');
  assertEq(a.cats.join(), 'sobaos');
  const [b] = revenueMods([{ kind: 'revenue', scope: 'international', market: 'francia', campaign: 'redes_exterior', factor: 1.1, months: 4, label: 'Redes y buscadores adaptados' }], 3);
  assert(/^Redes y buscadores adaptados en Francia: demanda \+10 %$/.test(b.text), b.text);
});

test('números: el radar de las acciones de Manolo y el «radar −N» de la Inspección no exageran', () => {
  const s = fresh();
  s.heatHacienda = 3;
  const before = { heatHacienda: s.heatHacienda }, res = doManoloAction(s, 'cuentas');
  assert(res.ok);
  assertEq(s.heatHacienda, 0);
  assert(/Radar de Hacienda −10\.$/.test(res.text), 'el texto nominal sigue diciendo −10');
  assert(/Radar de Hacienda −3 \(estaba en 3 y no baja de 0\)\.$/.test(honestRadarText(res.text, before, s)));
  const t = 'Vanessa te regulariza la empresa en una semana. La Inspección pierde interés por ti (radar −30) y la plantilla la adora. Moral +12.';
  assertEq(honestRadarText(t, { heatTrabajo: 5 }, { heatTrabajo: 0 }), t.replace('(radar −30)', '(radar −5 (estaba en 5 y no baja de 0))'));
  assertEq(honestRadarText(t, { heatTrabajo: 50 }, { heatTrabajo: 20 }), t);
  // El «radar −N» a secas sin la Inspección en la frase no se toca.
  assertEq(honestRadarText('Hacienda te mira menos (radar −30).', { heatTrabajo: 5 }, { heatTrabajo: 0 }), 'Hacienda te mira menos (radar −30).');
});

test('números: las cuentas compartidas entre filas dan la misma cotización que calcularlas en cada una', () => {
  // La caché de opciones calcula computeEconomy(s) una vez por instantánea (antes, una por fila: >50 ms en Ciudad).
  const s = fresh(), type = sobaoTypeId(s), eco = computeEconomy(s);
  for (const cash of [s.cash, 100]) {
    s.cash = cash;
    for (const mode of ['propia', 'franquicia']) {
      const own = openingPlan(s, { type, city: 'sevilla', mode }), shared = openingPlan(s, { type, city: 'sevilla', mode }, eco);
      assertEq(JSON.stringify(shared), JSON.stringify(own), `${mode} con ${cash} €`);
      assertEq(openingDelta(s, type, 'sevilla', mode).delta, own.deltaNet ?? null);
    }
  }
  assert(openingPlan(s, { type, city: 'sevilla', mode: 'propia' }).cashShort > 0, 'con 100 € se prueba la rama de falta de caja');
});

// --- Resultados de cartas, rescisión de franquicias y aviso de acción del mes (clave results).
import { firstResult, noteResult, idleReminder, sellPrompt } from '../src/core/results.js';
import { serialize, deserialize } from '../src/core/state.js';
import { sellBusiness, saleValue } from '../src/core/actions.js';
import { money } from '../src/core/helpers.js';

test('números: la primera resolución de una carta cuenta como primera aunque sim.js ya la marcara vista al encolarla', () => {
  const s = newGame(7, 'normal', 'classic');
  let firsts = 0, queuedSeen = 0;
  for (let m = 0; m < 24; m++) {
    while (s.pending.length) {
      const id = s.pending[0].id;
      if (firstResult(s, id)) { firsts++; if (s.seen?.[id] != null) queuedSeen++; }
      noteResult(s, id);
      assert(!firstResult(s, id), `${id} ya no es primera`);
      resolvePending(s, 0);
    }
    advanceMonth(s);
  }
  // Antes: s.seen decidía y 13 de 19 primeras apariciones (semilla 7) iban a un toast sin «Continuar».
  assert(firsts >= 10 && queuedSeen >= 5, `${firsts} primeras, ${queuedSeen} ya en s.seen`);
});

test('números: resultShown es opcional y se conserva al guardar y cargar', () => {
  const s = fresh();
  assert(!('resultShown' in s));
  const old = deserialize(serialize(s));
  assert(firstResult(old, 'cualquiera'), 'partida antigua sin registro: todo es primera vez');
  noteResult(old, 'cualquiera');
  const back = deserialize(serialize(old));
  assert(!firstResult(back, 'cualquiera'));
  back.resultShown = null; // un registro roto no rompe nada
  assert(firstResult(back, 'x')); noteResult(back, 'x'); assert(!firstResult(back, 'x'));
});

test('números: rescindir una franquicia dice el canon que devuelve y se niega sin caja, como sellBusiness', () => {
  const s = fresh(), type = sobaoTypeId(s);
  const b = { id: 9001, type, city: 'sevilla', mode: 'franquicia', fee: 30000, value: 0 };
  s.businesses.push(b);
  assertEq(saleValue(b), -30000);
  s.cash = 50000;
  const q = sellPrompt(s, b);
  assert(q.ok && q.text.includes(money(30000)), q.text);
  assert(q.text.includes('canon'));
  s.cash = 1000;
  const no = sellPrompt(s, b);
  assert(!no.ok && no.text.includes(money(30000)) && no.text.includes(money(1000)), no.text);
  assert(!sellBusiness(s, b.id).ok, 'sellBusiness también se niega');
  s.cash = 50000;
  assert(sellBusiness(s, b.id).ok);
  assertEq(s.cash, 20000);
  // La venta normal sigue diciendo lo que cobra.
  const own = { id: 9002, type, city: 'sevilla', mode: 'propia', value: 100000 };
  assert(sellPrompt(s, own).text.includes(money(saleValue(own))));
});

test('números: el aviso de acción del mes sale en los tres primeros cierres y luego uno de cada seis', () => {
  const shown = Array.from({ length: 48 }, (_, m) => m).filter(idleReminder);
  assertEq(shown.join(','), '0,1,2,5,11,17,23,29,35,41,47');
  assert(Array.from({ length: 12 }, (_, m) => m).filter(idleReminder).length <= 5, 'antes: 12 de 12');
});
