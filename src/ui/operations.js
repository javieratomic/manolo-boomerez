import {operationsPlan} from '../core/operations.js';
import {CITY_BY_ID} from '../data/cities.js';
import {dateLabel,moneyShort} from '../core/helpers.js';
import {esc} from './dom.js';

const cityLink=city=>`<a href="#" data-act="goto-city" data-city="${esc(city)}">${esc(CITY_BY_ID[city].name)}</a>`;

export function renderOperations(s) {
 const p=operationsPlan(s);
 const agenda=[...p.projects.map(x=>({...x,kind:'entrega'})),...p.renewals.map(x=>({...x,kind:'renovación'}))]
  .sort((a,b)=>a.month-b.month||a.city.localeCompare(b.city)||a.id-b.id);
 const risks=p.shortages.length?`<details class="operations-risks" open><summary>⚠️ Vivienda necesaria en ${p.shortages.length} ${p.shortages.length===1?'ciudad':'ciudades'}</summary>
  ${p.shortages.map(r=>`<div class="operations-item"><b>${cityLink(r.city)}</b><div class="small">${r.nowMissingBeds?`Faltan ${r.nowMissingBeds} viviendas hoy.`:`Primera falta: ${dateLabel(r.firstMonth)} (${r.firstMissingBeds} viviendas).`} Máximo: ${r.peakMissingBeds} en ${dateLabel(r.peakMonth)}; ${r.peakRequired} puestos previstos frente a ${r.peakAvailable} trabajadores disponibles.</div></div>`).join('')}
  <p class="small"><a href="#" data-act="tab" data-tab="viviendas">Planificar viviendas y consultar alquileres</a> · Cada promoción tarda 12 meses.</p></details>`:
  '<p class="small pos">La oferta laboral cubre la plantilla prevista durante los próximos 12 meses.</p>';
 return `<div class="card operations-plan"><h4>Plan de operaciones</h4><p class="small muted">Hoy y hasta ${dateLabel(p.to)} · Inversiones ya contratadas.</p>
  <div class="operations-metrics"><div><b>${p.projects.length}</b><span>obras por entregar</span></div><div><b>${p.pendingHomes}</b><span>viviendas pendientes</span></div><div><b>${moneyShort(p.renewalReserve)}</b><span>renovaciones estimadas</span></div></div>
  ${risks}${p.renewalReserve>0&&p.renewalReserve>s.cash?'<p class="small warn">La caja actual no cubriría toda la reserva de renovaciones del período.</p>':''}
  ${agenda.length?`<details class="operations-agenda"><summary>Ver agenda: ${agenda.length} ${agenda.length===1?'hito':'hitos'}</summary>${agenda.map(x=>`<div class="operations-item operations-event"><div><b>${x.month===p.from?'Este mes':dateLabel(x.month)}</b> · ${x.kind==='entrega'?'🏗️ Entrega':'🔧 Renovación'}<div>${esc(x.name)} · ${cityLink(x.city)}</div></div><div class="small">${x.kind==='renovación'?`${moneyShort(x.cost)} estimados`:x.homes?`+${x.homes} viviendas`:'Entrada en servicio'}</div></div>`).join('')}</details>`:'<p class="small muted">Sin entregas ni renovaciones programadas en este período.</p>'}
  ${p.laterProjects?`<p class="small muted">${p.laterProjects} obras quedan fuera de estos 12 meses.</p>`:''}
  <p class="small muted">Plantilla con las condiciones actuales y la estacionalidad del calendario. No anticipa sucesos, cambios de mercado ni I+D futura; no es una previsión de caja. La reserva usa el coste de renovación actual. Consultar este plan no cobra nada.</p>
 </div>`;
}
