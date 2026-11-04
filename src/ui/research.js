import {CITY_BY_ID} from '../data/cities.js';
import {money,moneyShort} from '../core/helpers.js';
import {esc} from './dom.js';

const tone=x=>x<0?'neg':'pos';
const row=(label,before,after,format=moneyShort)=>`<tr><td>${label}</td><td>${format(before)}</td><td>${format(after)}</td></tr>`;
export function renderResearchReview(p) {
 if(!p.ok)return `<p class="warn">${esc(p.msg)}</p>`;
 const changed=p.workforce.filter(w=>w.before.required!==w.after.required||w.before.missingBeds||w.after.missingBeds);
 const delta=p.after.net-p.before.net;
 return `<div class="research-review"><p class="small">${esc(p.description)}</p>
  <p><b>Coste pendiente: ${money(p.costDue)}</b> · ${p.months} ${p.months===1?'mes':'meses'} ${p.status==='active'?'restantes':'de desarrollo con tu dirección actual'}.</p>
  ${p.status==='active'?'<p class="small muted">El coste ya se pagó al iniciar este proyecto.</p>':!p.startable?`<p class="small warn">No puedes iniciarlo ahora: ${esc(p.reason)}</p>`:''}
  <p class="small muted">Supuesto: la innovación estuviera terminada hoy, con el imperio y las condiciones actuales. El coste anterior es una inversión única y no está restado del beneficio mensual.</p>
  <table class="tbl"><thead><tr><th>Indicador</th><th>Actual</th><th>Con innovación</th></tr></thead><tbody>
   ${row('Resultado neto /mes',p.before.net,p.after.net)}${row('Capacidad efectiva de sobaos',p.before.capacity,p.after.capacity,x=>Math.round(x).toLocaleString('es-ES'))}
   ${row('Cobertura de demanda',p.before.fill,p.after.fill,x=>`${Math.round(x*100)} %`)}${row('Empleados en actividad',p.before.employees,p.after.employees,String)}
  </tbody></table><p class="small ${tone(delta)}">Cambio de resultado mensual: ${delta>=0?'+':''}${money(delta)}.</p>
  ${p.unlock?`<p class="small"><b>Desbloquea: ${esc(p.unlock)}.</b> La investigación no abre locales; su coste y sus ingresos futuros no están incluidos.</p>`:''}
  ${changed.length?`<h4>Personal y vivienda por ciudad</h4>${changed.map(w=>`<div class="research-workforce"><b>${esc(CITY_BY_ID[w.city].name)}</b><table class="tbl"><thead><tr><th>Capacidad instalada</th><th>Actual</th><th>Con innovación</th></tr></thead><tbody>
   ${row('Plantilla necesaria',w.before.required,w.after.required,String)}${row('Oferta laboral',w.before.available,w.after.available,String)}${row('Viviendas que faltan',w.before.missingBeds,w.after.missingBeds,String)}
  </tbody></table>${w.after.missingBeds?'<p class="small warn">La capacidad instalada queda limitada por falta de vivienda. Puedes construirla en Equipo → Viviendas; tarda un año.</p>':''}</div>`).join('')}`:''}
  <p class="small muted">Consultar no gasta dinero, no inicia ni termina proyectos y no avanza el calendario. Este supuesto no es una previsión del mes de entrega: no completa obras ni otras investigaciones, no financia el coste ni simula cambios de mercado, eventos o decisiones futuras.</p>
 </div>`;
}
