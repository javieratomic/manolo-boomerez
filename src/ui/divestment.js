import {CITY_BY_ID} from '../data/cities.js';
import {dateLabel,money,moneyShort} from '../core/helpers.js';
import {esc} from './dom.js';
const signed=n=>`${n>=0?'+':''}${moneyShort(n)}`;
export function renderSalePreview(p) {
 return `<p>Ingresos por ventas: <b>${money(p.proceeds)}</b> · indemnizaciones: <b>${money(p.payouts)}</b>.</p>
  <p>Movimiento inmediato de caja: <b class="${p.cashDelta<0?'neg':'pos'}">${signed(p.cashDelta)}</b>. Caja: ${moneyShort(p.before.cash)} → ${moneyShort(p.after.cash)}.</p>
  <p class="small">Patrimonio: ${moneyShort(p.before.wealth)} → ${moneyShort(p.after.wealth)}. Recuperar liquidez puede reducir el valor del imperio.</p>
  <p>Resultado de este mes: <b>${moneyShort(p.before.net)} → ${moneyShort(p.after.net)}</b> (<span class="${p.deltaNet<0?'neg':'pos'}">${signed(p.deltaNet)}</span>).</p>
  <p class="small">Capacidad: ${Math.round(p.before.capacity).toLocaleString('es-ES')} → ${Math.round(p.after.capacity).toLocaleString('es-ES')} uds. Cobertura: ${Math.round(p.before.fill*100)} % → ${Math.round(p.after.fill*100)} %. Plantilla: ${p.before.employees} → ${p.after.employees}. Viviendas: ${p.before.beds} → ${p.after.beds}.</p>
  ${p.after.capacity<p.before.capacity?'<p class="small warn">La capacidad productiva baja. Los negocios que conservas pueden perder suministro.</p>':''}
  ${p.workforceRisks.length?`<div class="small warn">Aparece o empeora la falta de vivienda:<ul>${p.workforceRisks.map(r=>`<li>${esc(CITY_BY_ID[r.city].name)}: empeora en ${r.worseMonths.length} cierres, desde ${dateLabel(r.worseMonths[0].month)}. Déficit entonces: ${r.worseMonths[0].missingBeds} viviendas; hasta ${Math.max(...r.worseMonths.map(x=>x.extraBeds))} más que antes.</li>`).join('')}</ul></div>`:''}
  ${p.campaign==='europe'&&(p.after.countries<p.before.countries||p.after.sectors<p.before.sectors)?`<p class="small warn">Retroceso europeo: países propios activos ${p.before.countries} → ${p.after.countries}; sectores estratégicos ${p.before.sectors} → ${p.after.sectors}.</p>`:''}
  ${p.after.cash<0?'<p class="small warn">La caja seguirá en descubierto después del lote.</p>':''}
  <p class="small muted">Previsión conjunta con personal, producción, sinergias, costes generales e impuestos del mes actual. Los cobros de la venta se separan del resultado operativo; las renovaciones de este mes se recalculan. No garantiza beneficios futuros.</p>`;
}
export function renderSaleReview(p) {
 return `<p><b>Venta o rescisión definitiva de ${p.items.length} negocios.</b></p><ol>${p.items.map(x=>`<li>${esc(x.name)} · ${esc(CITY_BY_ID[x.city].name)} · #${x.id}: ${x.value>=0?'Cobras':'Pagas'} ${money(Math.abs(x.value))}${x.mode==='franquicia'?' por rescisión':''}.</li>`).join('')}</ol>
 ${renderSalePreview(p)}<p>No podrás deshacer esta operación al mismo precio. Se ejecuta el lote completo o no se vende ni se cobra nada.</p>`;
}
