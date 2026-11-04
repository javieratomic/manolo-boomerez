// Alertas por ciudad para las insignias del mapa (función pura). Nunca avisa de inspecciones.
import { hasCondition } from './economy.js';
import { moneyShort,dateLabel } from './helpers.js';

export const ALERT_EMOJI = { perdidas: '📉', franquicia: '🚩', averia: '🛠️', ilegal: '🔑', rival: '⚔️', obrador: '🏭', huelga: '🪧' };

export function cityAlerts(s) {
  const out = {};
  const add = (city, a) => (out[city] ||= []).push(a);
  const r = s.lastReport;
  const byId = new Map(s.businesses.map((b) => [b.id, b]));
  if (r) {
    const period=Number.isSafeInteger(r.month)&&r.month>=0?`Último cierre (${dateLabel(r.month)}): `:'Último cierre: ';
    for (const l of r.lines) {
      if (l.id === 'obrador' || !byId.has(l.id)) continue;
      const p = l.revenue - l.cost;
      if (p < -1500) add(l.city, { kind: 'perdidas', level: p < -5000 ? 3 : 2, text: `${period}${l.label} perdió ${moneyShort(-p)}.`, tab: 'ciudad', businessId: l.id });
      if (l.rivalF != null && l.rivalF <= 0.77) add(l.city, { kind: 'rival', level: 2, text: `${period}${l.label}: la competencia le restó un ${Math.round((1 - l.rivalF) * 100)} % de clientela.`, tab: 'ciudad', businessId: l.id });
    }
    if (r.fill < 0.95) add('selaya', { kind: 'obrador', level: r.fill < 0.85 ? 3 : 2, text: `${period}El obrador cubrió el ${Math.round(r.fill * 100)} % de la demanda.`, tab: 'ciudad' });
  }
  for (const b of s.businesses) {
    if (b.mode === 'franquicia' && (b.lossMonths || 0) >= 2) add(b.city, { kind: 'franquicia', level: b.lossMonths >= 3 ? 3 : 2, text: b.lossMonths >= 3 ? 'El franquiciado quiebra si pierde otro mes' : `El franquiciado lleva ${b.lossMonths} meses en pérdidas`, tab: 'ciudad', businessId: b.id });
    if (hasCondition(b) && (b.cond ?? 100) < 40) add(b.city, { kind: 'averia', level: (b.cond ?? 100) < 30 ? 3 : 2, text: (b.cond ?? 100) < 30 ? 'Local hecho polvo: un 6 % de avería cada mes' : 'Local descuidado: vende menos', tab: 'ciudad', businessId: b.id });
    if (b.ilegal) add(b.city, { kind: 'ilegal', level: 1, text: 'Pisos turísticos sin licencia', tab: 'ciudad', businessId: b.id });
  }
  if (s.mods.some((m) => m.kind === 'strike')) {
    for (const city of new Set(s.businesses.map((b) => b.city).concat('selaya'))) add(city, { kind: 'huelga', level: 2, text: 'Huelga en marcha', tab: 'plantilla' });
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => b.level - a.level);
  return out;
}
