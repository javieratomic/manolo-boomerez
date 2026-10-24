// El Archivo de la casa: carpetas con lo que la partida recuerda (función pura). Todas las cifras salen de
// las mismas funciones del juego. Nunca dice cuándo puede venir una inspección o una auditoría.
import { trickOdds, trickCount, recidivism, recentSanctions, laborSeverity, haciendaDebt, DELITO_FISCAL } from './inspections.js';
import { liquidacion, convenioDemand, credibilidad, K as PK } from './plantilla.js';
import { custom, dateLabel, money, moneyShort } from './helpers.js';
import { COND_TEXT } from './cartilla.js';
import { consensus, qOf, qLabel, GUIAS } from './bolsa.js';
import { REFRAN_COUNT } from '../data/refranes.js';
import { EVENT_BY_ID } from '../data/events.js';

const pct = (x) => `${Math.round(x * 100)} %`;
const fecha = (m) => dateLabel(m).toLowerCase().replace(' ', ' de ');
const dec = (x, n = 1) => x.toFixed(n).replace('.', ',');
const label = (id, key) => {
  const c = EVENT_BY_ID[id]?.choices.find((x) => x.key === key);
  return typeof c?.label === 'string' ? c.label : key;
};

function marisa(s) {
  const rows = [
    { label: 'Esconder a los becarios en la cámara', value: `${pct(trickOdds(s, 'frigorifico'))} (usado ${trickCount(s, 'frigorifico')})` },
    { label: 'Sobaos y un orujo', value: `${pct(trickOdds(s, 'orujo'))} (usado ${trickCount(s, 'orujo')})` },
  ];
  const sanc = (s.dossier?.sanciones || []).filter((m) => s.month - m <= 24).sort((a, b) => a - b);
  rows.push({ label: 'Sanciones vigentes', value: sanc.length ? sanc.map((m) => `caduca en ${fecha(m + 24)}`).join(' · ') : 'ninguna' });
  rows.push({ label: 'Agravante por reincidencia', value: `×${dec(recidivism(s), 2)}`, tone: recidivism(s) > 1 ? 'neg' : '' });
  const h = s.dossier?.historial || [];
  rows.push({ label: 'Gravedad: ahora / media de 6 meses', value: `${dec(laborSeverity(s))} / ${dec(h.length ? h.reduce((a, b) => a + b, 0) / h.length : 0)}` });
  const liq = liquidacion(s);
  rows.push({ label: 'Deuda latente con la Seguridad Social', value: money(liq), tone: liq > 0 ? 'neg' : '' });
  const apl = (s.extraMonthly || []).filter((x) => x.locked && !x.kevin);
  if (apl.length) rows.push({ label: 'Aplazamientos vivos', value: apl.map((x) => `${moneyShort(x.amount)}/mes · ${x.months} meses`).join(' · ') });
  return { id: 'marisa', emoji: '🔎', title: 'La carpeta de Marisa', unlocked: true, rows,
    notes: `Inspecciones recibidas: ${s.stats.inspecciones}. Cada truco funciona peor cuantas más veces lo usas; una visita limpia tacha una sanción.` };
}

function fermin(s) {
  const debt = haciendaDebt(s);
  return { id: 'fermin', emoji: '🏛️', title: 'La carpeta de Don Fermín', unlocked: true, rows: [
    { label: 'Culpar al gestor', value: `${pct(trickOdds(s, 'gestor'))} (usado ${trickCount(s, 'gestor')})` },
    { label: 'Colar tickets', value: `${pct(trickOdds(s, 'tickets'))} (usado ${trickCount(s, 'tickets')})` },
    { label: 'Hacerse el anciano confuso', value: `${pct(trickOdds(s, 'anciano'))} (usado ${trickCount(s, 'anciano')})` },
    { label: 'Culpas a Paco', value: s.perks.gestor ? `${s.flags.pacoCulpas ?? 0}/3` : s.flags.pacoSeFue != null ? 'Paco se fue' : 'sin gestor' },
    { label: 'Cuota optimizada', value: `${money(debt)} de ${money(DELITO_FISCAL)}`, tone: debt >= DELITO_FISCAL ? 'neg' : '' },
  ], notes: `Auditorías recibidas: ${s.stats.auditorias}.` };
}

function costumbres(s) {
  const row = (id, title, next) => {
    const c = custom(s, id);
    return { label: title, value: c.count ? `${label(id, c.last)} · ${c.streak} ${c.streak === 1 ? 'vez' : 'veces'} seguidas${next ? ` · ${next(c)}` : ''}` : 'todavía nada' };
  };
  return { id: 'costumbres', emoji: '🎄', title: 'Costumbres de la casa', unlocked: Object.keys(s.customs || {}).length > 0, rows: [
    row('navidad', 'Navidad', (c) => (c.last === 'cesta' && c.streak >= 2 ? 'romperla cuesta moral −10' : '')),
    row('agosto', 'Agosto', (c) => (c.last === 'trabajar' ? (c.streak >= 2 ? 'otro año así trae una denuncia' : 'el segundo aprieta más') : (s.flags.agostoLibre ?? 0) >= 2 ? 'ya puedes cerrar «como en Francia»' : '')),
    row('franquiciado_arruinado', 'Franquiciados arruinados', (c) => (c.count >= 2 ? 'ya tienen grupo de los jueves' : '')),
  ], notes: '' };
}

function comite(s) {
  const c = s.comite;
  if (!c) return { id: 'comite', emoji: '🤝', title: 'El comité de empresa', unlocked: false, rows: [], notes: `Llega con ${PK.COMITE_AT} personas en plantilla.` };
  let next = c.nextConvenio;
  while (next % 12 !== 2) next++;
  return { id: 'comite', emoji: '🤝', title: 'El comité de empresa', unlocked: true, rows: [
    { label: 'Agravio', value: `${Math.round(s.agravio || 0)}`, tone: (s.agravio || 0) >= PK.STRIKE_AT ? 'neg' : '' },
    { label: 'Beneficio por cabeza', value: `${dec(s.plantilla?.ratio ?? 0)} sueldos/mes` },
    { label: 'Plus del convenio', value: c.plus > 0 ? `+${dec(c.plus * 100)} %` : '—' },
    { label: 'Paz social', value: c.paz > 0 ? `${c.paz} meses` : 'no' },
    { label: 'Próxima revisión', value: `${fecha(next)} (pedirían ${dec(convenioDemand(s) * 100)} %)` },
    { label: 'Promesas', value: `${c.prometido != null ? `pendiente desde ${fecha(c.prometido)}` : 'ninguna pendiente'} · rotas: ${(c.rotas || []).length} · credibilidad ${pct(credibilidad(s))}` },
    { label: 'Huelgas generales', value: `${c.huelgas || 0}` },
  ], notes: '' };
}

function cartilla(s) {
  const c = s.cartilla;
  if (!c) return { id: 'cartilla', emoji: '👵', title: 'La cartilla de mamá', unlocked: false, rows: [], notes: '' };
  return { id: 'cartilla', emoji: '👵', title: 'La cartilla de mamá', unlocked: (c.prestamos || 0) > 0, rows: [
    { label: 'Saldo de la cartilla', value: money(c.saldo) },
    { label: 'Confianza en su hijo', value: `${Math.round(c.confianza)}/100` },
    { label: 'Le debes', value: c.owed > 0 ? `${money(c.owed)} (vence en ${c.due != null ? fecha(c.due) : '—'})` : 'nada', tone: c.owed > 0 ? 'neg' : '' },
    { label: 'Condiciones', value: (c.conds || []).map((k) => COND_TEXT[k]).join(' · ') || '—' },
    { label: 'Préstamos / devueltos a tiempo', value: `${c.prestamos || 0} / ${c.devueltos || 0}` },
    { label: 'Refranero', value: `${s.flags.refranero ?? 0}/${REFRAN_COUNT}` },
  ], notes: c.embargo ? `Embargo materno en curso: ${c.embargo.months} meses más.` : '' };
}

function analistas(s) {
  const ipo = s.ipo;
  if (!ipo) return { id: 'analistas', emoji: '📈', title: 'Los analistas', unlocked: false, rows: [], notes: 'Cuando salgas a Bolsa.' };
  const next = qOf(s.month); // el trimestre en curso: solo lee trimestres ya cerrados y publicados
  return { id: 'analistas', emoji: '📈', title: 'Los analistas', unlocked: true, rows: [
    { label: `Consenso para el ${qLabel(next)}`, value: `+${pct(consensus(s, next))}` },
    { label: 'Promesa en curso', value: ipo.q ? `${GUIAS[ipo.q.guia]?.label ?? ipo.q.guia}: ${money(ipo.q.target)} (${qLabel(ipo.q.qi)})` : '—' },
    { label: 'Credibilidad', value: `${Math.round(ipo.cred ?? 50)}/100` },
    { label: 'Sentimiento del mercado', value: `×${dec(ipo.sent ?? 1, 2)}`, tone: (ipo.sent ?? 1) <= 0.9 ? 'neg' : '' },
    { label: 'Cadáveres en el armario', value: `${(ipo.maquillajes || []).filter((x) => !x.descubierto).length}` },
  ], notes: '' };
}

export function codex(s) {
  return [marisa(s), fermin(s), costumbres(s), comite(s), cartilla(s), analistas(s)];
}
