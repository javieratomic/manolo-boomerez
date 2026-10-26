import {stressReport,STRESS_SCENARIOS} from '../core/stress.js';
import {CITY_BY_ID} from '../data/cities.js';
import {dateLabel,money,moneyShort} from '../core/helpers.js';
import {esc} from './dom.js';

const labels={deficit:'Caja insuficiente',thin:'Bajo el colchón',covered:'Colchón cubierto'};
const tone=x=>x<0?'neg':'pos';
const statusTone=x=>x==='deficit'?'neg':x==='thin'?'warn':'pos';
function metrics(current,investment,sale=false) {
 const rows=[
  ['Resultado de este mes',x=>x.net,moneyShort,true],['Caja tras el cierre',x=>x.closingCash,moneyShort,true],
  ['Tres nóminas',x=>3*x.payroll],['Renovaciones futuras · 12 meses',x=>x.renewalsFuture],
  ['Colchón de referencia',x=>x.reserve],['Margen sobre el colchón',x=>x.margin,moneyShort,true],
  ['Renovaciones de este cierre · ya incluidas',x=>x.renewalsNow],['Plantilla',x=>x.employees,String],
  ['Cobertura de demanda',x=>x.fill,x=>`${Math.round(x*100)} %`],
 ];
 return `<table class="tbl stress-metrics ${investment?'stress-comparison':''}"><thead><tr><th>Indicador</th><th>${investment?'Mantener':'Empresa actual'}</th>${investment?`<th>${sale?'Reestructurar':'Reformar'}</th>`:''}</tr></thead><tbody>
  ${rows.map(([name,read,format=moneyShort,colored])=>`<tr><td>${name}</td>${[current,...(investment?[investment]:[])].map(x=>{const value=read(x);return `<td class="${colored?tone(value):''}">${esc(format(value))}</td>`;}).join('')}</tr>`).join('')}
 </tbody></table>`;
}
export function renderStress(s,ids=[],expectedItems=null,operation='upgrade') {
 const sale=operation==='sale',report=stressReport(s,ids,expectedItems,operation),plan=report.comparison,compared=!!plan?.ok;
 const stressed=report.rows.filter(x=>(x.investment||x.current).status!=='covered').length;
 return `<div class="card stress-panel"><h4>Pruebas de resistencia</h4><p class="small muted">Un cierre de ${dateLabel(s.month)}, bajo cuatro supuestos. No son probabilidades ni una predicción de sucesos.</p>
  ${plan?`<div class="stress-lot">${plan.ok?`<b>Lote en estudio: ${sale?'Ventas y rescisiones':'Reformas'} · ${plan.items.length} negocios · ${sale?`${plan.cashDelta>=0?'+':''}${money(plan.cashDelta)}`:money(plan.cost)}</b><details><summary>Ver negocios y ${sale?'operaciones':'niveles'}</summary><ul>${plan.items.map(x=>`<li>${esc(x.name)} · ${esc(CITY_BY_ID[x.city].name)} · #${x.id}: ${sale?`${x.mode==='franquicia'?'rescindir':'vender'} (${x.value>=0?'+':''}${money(x.value)})`:`nivel ${x.from} → ${x.to}`}</li>`).join('')}</ul></details><p class="small">${sale?'La columna Reestructurar suma las ventas y resta indemnizaciones una sola vez.':'La columna Reformar descuenta esta inversión una sola vez.'} Todavía no se ha ejecutado el lote.</p>`:`<p class="stress-invalid warn">El lote ya no es válido: ${esc(plan.msg)} Se muestran las cuentas actuales, sin aplicar la operación.</p>`}
   <button class="btn small" data-act="stress-portfolio">Volver al lote en cartera</button> <button class="btn small ghost" data-act="stress-current">Quitar comparación</button></div>`:'<p class="small">Para comparar una decisión, selecciona negocios en la cartera y pulsa Probar escenarios. Aquí puedes comprobar la empresa actual sin ejecutar operaciones.</p><button class="btn small" data-act="stress-portfolio">Abrir cartera</button>'}
  <p class="small ${stressed?'warn':'pos'}">${compared?'Con el lote':'En la empresa actual'}, ${stressed} de 4 supuestos dejan la caja tras el cierre por debajo del colchón de referencia.</p>
  <p class="small muted">Colchón orientativo: tres nóminas de plantilla y directivos, más renovaciones de los 12 meses posteriores a este cierre. No bloquea dinero ni impide invertir.</p>
  ${report.rows.map((r,i)=>{const a=STRESS_SCENARIOS[i],result=r.investment||r.current;return `<details class="stress-scenario" ${i===0?'open':''}><summary><b>${esc(a.label)}</b><span class="small">${compared?`${moneyShort(r.current.net)} → ${moneyShort(result.net)}`:moneyShort(result.net)} /mes · <span class="${statusTone(result.status)}">${labels[result.status]}</span></span></summary><p class="small">${esc(a.description)}</p>${metrics(r.current,r.investment,sale)}</details>`;}).join('')}
  <p class="small muted">Caja antes de nuevo crédito, ventas de activos o sucesos. No se avanza el calendario: las obras siguen en su estado actual, sin completar I+D ni cambiar mercado, moral o fama. Los importes de renovación usan costes de reposición actuales; las de este mes ya están descontadas del resultado y no se suman otra vez al colchón futuro.</p></div>`;
}
