// "Informe de Paco": consejos automáticos a partir del estado de la partida (función pura).
import { BUSINESS_TYPES } from '../data/businesses.js';
import { CITY_BY_ID } from '../data/cities.js';
import { RIVALS } from '../data/rivals.js';
import { creditLimit } from './economy.js';
import { money } from './helpers.js';
import { nextUpgrade } from './actions.js';
import { regionalCount } from './logistics.js';
import { recidivism } from './inspections.js';

// Devuelve consejos ordenados por urgencia: { level: 'alta' | 'media' | 'baja', text, tab? }
export function advice(s) {
  const out = [];
  const r = s.lastReport;
  if (!r) return [{ level: 'baja', text: 'Cierra el primer mes y te hago un informe. Mientras, abre una tienda en una ciudad grande.', tab: 'ciudad' }];

  if (s.insolvencyMonths > 0) out.push({ level: 'alta', text: `Estás en descubierto sin crédito (${s.insolvencyMonths}/3). Vende algo o recorta gastos ya, Manolo.`, tab: 'finanzas' });
  else if (s.debt > creditLimit(s) * 0.85) out.push({ level: 'alta', text: 'La póliza está casi agotada. Si llega una crisis, el banco te cierra el grifo.', tab: 'finanzas' });

  if (r.fill < 0.9) {
    const up = nextUpgrade(s);
    const fixes = [up && `mejora el obrador (${up.name.toLowerCase()})`, s.unlocked.obrador_regional && 'abre un obrador regional'].filter(Boolean);
    const fix = fixes.length ? ` Solución: ${fixes.join(' o ')}.` : ' Ficha a alguien en Operaciones para exprimir la capacidad.';
    out.push({ level: 'alta', text: `El obrador solo cubre el ${Math.round(r.fill * 100)} % de la demanda: estás perdiendo ventas.${fix}`, tab: 'ciudad' });
  }

  if (recidivism(s) > 1) out.push({ level: 'media', text: `Marisa te tiene fichado: la próxima multa laboral lleva un agravante de ×${recidivism(s).toFixed(2).replace('.', ',')} por reincidencia.`, tab: 'plantilla' });
  if (s.heatTrabajo > 65) out.push({ level: 'alta', text: 'El radar de la Inspección de Trabajo está en rojo. Regulariza algo o ficha a alguien en RR. HH.', tab: 'plantilla' });
  if (s.heatHacienda > 65) out.push({ level: 'alta', text: `El radar de Hacienda está en rojo y debes ${money(s.evaded)} "optimizados". Una auditoría ahora dolería.`, tab: 'finanzas' });
  if (s.moral < 30) out.push({ level: 'alta', text: 'La plantilla está quemada. Riesgo de huelga y, si llega a cero, de que se queden la empresa.', tab: 'plantilla' });
  if (!s.flags.divorciado && (s.familia ?? 60) < 25) out.push({ level: 'alta', text: 'Merche está a punto de llamar a la abogada. Dedícale una acción del mes.', tab: 'manolo' });
  if (s.expedientes >= 2) out.push({ level: 'alta', text: `Llevas ${s.expedientes} expedientes penales. Uno más y vas a Soto del Real.`, tab: 'finanzas' });

  // Negocios que pierden dinero.
  const losers = r.lines.filter((l) => l.id !== 'obrador' && l.type !== 'obrador_regional' && !l.franchise && l.revenue - l.cost < -1500).sort((a, b) => (a.revenue - a.cost) - (b.revenue - b.cost));
  if (losers.length) {
    const l = losers[0];
    out.push({ level: 'media', text: `${l.label} de ${CITY_BY_ID[l.city]?.name} pierde ${money(-(l.revenue - l.cost))} al mes${losers.length > 1 ? ` (y hay ${losers.length - 1} más en pérdidas)` : ''}. ¿Reformar, hacer campaña o vender?`, tab: 'imperio' });
  }

  const shabby = s.businesses.filter((b) => b.mode !== 'franquicia' && (b.cond ?? 100) < 40).length;
  if (shabby) out.push({ level: 'media', text: `Tienes ${shabby} ${shabby === 1 ? 'local' : 'locales'} hechos un desastre (venden menos y pueden averiarse). Sube el mantenimiento o reforma.`, tab: 'finanzas' });

  // Competencia fuerte donde tienes negocio.
  for (const rv of s.rivals || []) {
    const d = RIVALS[rv.id];
    const hit = s.businesses.find((b) => d.targets.includes(b.type) && (rv.presence[b.city] || 0) >= 2);
    if (hit) {
      out.push({ level: 'media', text: `${d.short} tiene mucha presencia en ${CITY_BY_ID[hit.city].name} y te quita clientela. Plántale cara desde Mercado.`, tab: 'mercado' });
      break;
    }
  }

  if (s.macro?.phase === 'burbuja' && s.macro.months >= 6) out.push({ level: 'media', text: 'La burbuja ya dura bastante. Si tienes ladrillo que vender, quizá sea el momento; si tienes deuda, quizá sea el momento de bajarla.', tab: 'mercado' });
  if (s.macro?.phase === 'crisis') out.push({ level: 'baja', text: 'En crisis las OPA y los inmuebles salen baratos. Si tienes caja, es época de rebajas.', tab: 'mercado' });

  const farOutlets = s.businesses.filter((b) => BUSINESS_TYPES[b.type].category === 'sobaos' && ['sevilla', 'malaga', 'cordoba', 'granada', 'almeria', 'murcia', 'alicante', 'valencia', 'barcelona', 'tarragona'].includes(b.city)).length;
  if (s.unlocked.obrador_regional && regionalCount(s) === 0 && farOutlets >= 4) out.push({ level: 'media', text: `Tienes ${farOutlets} tiendas lejos de Selaya. Un obrador regional en el sur o el este te ahorraría transporte.`, tab: 'ciudad' });

  if (!Object.keys(s.execs || {}).length && s.month >= 6) out.push({ level: 'baja', text: 'Sigues sin equipo directivo. Un buen fichaje en Operaciones o RR. HH. se paga solo.', tab: 'plantilla' });
  if (!s.rd && s.cash > 150000 && s.month >= 4) out.push({ level: 'baja', text: 'El laboratorio de I+D está parado y tienes caja. Un producto nuevo vende más en todas las tiendas.', tab: 'mercado' });
  if ((s.estres ?? 0) > 70) out.push({ level: 'media', text: `Manolo, tu estrés está en ${Math.round(s.estres)}. Una escapada o unos días en Marbella antes de que te dé algo.`, tab: 'manolo' });
  if (!s.actionUsed && !(s.restMonths > 0)) out.push({ level: 'baja', text: 'Aún no has hecho la acción de Manolo de este mes.', tab: 'manolo' });

  const order = { alta: 0, media: 1, baja: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level]).slice(0, 5);
}
