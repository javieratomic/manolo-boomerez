// Cálculo de la gravedad de inspecciones y auditorías.

import { difficultyOf } from './state.js';
import {housingLaborSeverity} from './housing.js';
import { liquidacion, ahorroMeses } from './plantilla.js';

export const DELITO_FISCAL = 120000;

export function laborSeverity(s) {
  const p = s.policies;
  let v = 0;
  v += { convenio: 0, minimo: 0.5, negro: 3 }[p.salario];
  v += { pagadas: 0, gratis: 1, tiburon: 2.5 }[p.horas];
  v += { ninguno: 0, algunos: 1.2, legion: 2.5 }[p.becarios];
  v += housingLaborSeverity(s);
  return v;
}

// Culpar a Paco (auditorías, informes bajistas): a la tercera vez que le culpas estando contratado, se va.
export function blamePaco(s) {
  if (!s.perks.gestor) return '';
  s.flags.pacoCulpas = (s.flags.pacoCulpas ?? 0) + 1;
  if (s.flags.pacoCulpas < 3) return '';
  s.perks.gestor = false;
  s.flags.pacoCulpas = 0;
  s.flags.pacoSeFue = s.month;
  return '\n\nPaco te deja: "A la tercera, Manolo, te defiendes tú solo." No te cogerá el teléfono en un año.';
}

// ------------------------------------------------------------- Expediente
// Marisa (Trabajo) y Don Fermín (Hacienda) se acuerdan de todo: los trucos funcionan peor cada vez,
// las sanciones recientes agravan la multa y la multa mira los últimos meses, no solo el de la visita.
export const TRICKS = { trabajo: ['frigorifico', 'orujo'], hacienda: ['gestor', 'tickets', 'anciano'] };

export function dossier(s) {
  s.dossier ||= { trucos: {}, sanciones: [], historial: [] };
  s.dossier.trucos ||= {};
  s.dossier.sanciones ||= [];
  s.dossier.historial ||= [];
  return s.dossier;
}

export const trickCount = (s, id) => s.dossier?.trucos?.[id] ?? 0;

export function trickOdds(s, id) {
  const n = trickCount(s, id);
  switch (id) {
    case 'frigorifico': return 0.55 * 0.5 ** n;
    case 'orujo': return 0.3 * (1 / 3) ** n;
    case 'gestor': return Math.max(0.1, (s.perks.gestor ? 0.7 : 0.5) - 0.2 * n);
    case 'tickets': return 0.3 * 0.5 ** n;
    case 'anciano': return n ? 0 : 0.2;
    default: return 0;
  }
}

// Se apunta antes de tirar el dado: el inspector se acuerda salga bien o salga mal.
export function recordTrick(s, id) {
  const d = dossier(s);
  d.trucos[id] = (d.trucos[id] || 0) + 1;
}

export function recordSanction(s) {
  dossier(s).sanciones.push(s.month);
}

export const recentSanctions = (s) => (s.dossier?.sanciones || []).filter((m) => s.month - m <= 24).length;
export const recidivism = (s) => Math.min(1.75, 1 + 0.25 * recentSanctions(s));

// Gravedad de los últimos meses: pasarse a legal justo el mes de la visita ya no te libra.
export function tickLaborHistory(s) {
  const h = dossier(s).historial;
  h.push(laborSeverity(s));
  if (h.length > 6) h.shift();
}

// Una visita sin infracciones limpia algo el expediente de ese inspector: la sanción vigente más antigua
// (las de hace más de 24 meses ya no cuentan y se tiran).
export function clearRecord(s, who) {
  const d = dossier(s);
  if (who === 'trabajo') {
    d.sanciones = d.sanciones.filter((m) => s.month - m <= 24);
    d.sanciones.shift();
  }
  for (const id of TRICKS[who]) d.trucos[id] = Math.max(0, (d.trucos[id] || 0) - 1);
}

// Multa mínima por una denuncia concreta (p. ej. negar las vacaciones), aunque las políticas estén en regla.
export function complaintFine(s) {
  const employees = s.lastReport?.employees ?? 10;
  return Math.round((1500 + employees * 300) * (s.perks.abogado ? 0.7 : 1) * difficultyOf(s).fines * recidivism(s));
}

// Datos de una visita de Trabajo: la multa y lo que Marisa lleva en la carpeta en ese momento. Una denuncia
// por vacaciones pendiente (s.flags.denunciaVacaciones = veranos seguidos) viaja con la próxima visita.
export function laborVisitParams(s, extra = {}) {
  const veranos = extra.veranos ?? s.flags?.denunciaVacaciones ?? 0;
  const minFine = Math.max(extra.minFine ?? 0, veranos ? complaintFine(s) : 0);
  const out = { fine: Math.max(laborFine(s), minFine), liq: liquidacion(s), liqMeses: ahorroMeses(s), recid: recidivism(s), sanciones: recentSanctions(s) };
  if (veranos) Object.assign(out, { motivo: 'vacaciones', veranos });
  return out;
}

export function laborFine(s) {
  const employees = s.lastReport?.employees ?? 10;
  const h = s.dossier?.historial || [];
  const past = h.length ? h.reduce((a, b) => a + b, 0) / h.length : 0;
  const fine = Math.max(laborSeverity(s), past) * (1500 + employees * 300);
  return Math.round(fine * (s.perks.abogado ? 0.7 : 1) * difficultyOf(s).fines * recidivism(s));
}

export function haciendaDebt(s) {
  return Math.round(s.evaded * (s.perks.andorra ? 1.5 : 1) * difficultyOf(s).fines);
}

// Probabilidad mensual de visita según el radar.
export const inspectionChance = (heat) => 0.01 + Math.pow(heat / 100, 1.5) * 0.35;
export const auditChance = (heat) => 0.008 + Math.pow(heat / 100, 1.5) * 0.3;
