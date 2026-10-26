import {stressReport,STRESS_SCENARIOS} from '../core/stress.js';
import {CITY_BY_ID} from '../data/cities.js';
import {dateLabel,money,moneyShort} from '../core/helpers.js';
import {esc} from './dom.js';
import {renderOpeningStudy} from './opportunities.js';

const labels={deficit:'Caja insuficiente',thin:'Bajo el colchón',covered:'Colchón cubierto'};
const tone=x=>x<0?'neg':'pos';
const statusTone=x=>x==='deficit'?'neg':x==='thin'?'warn':'pos';
function metrics(current,investment,alternativeLabel='Reformar') {
 const rows=[
  ['Resultado de este mes',x=>x.net,moneyShort,true],['Caja tras el cierre',x=>x.closingCash,moneyShort,true],
  ['Tres nóminas',x=>3*x.payroll],['Renovaciones futuras · 12 meses',x=>x.renewalsFuture],
  ['Colchón de referencia',x=>x.reserve],['Margen sobre el colchón',x=>x.margin,moneyShort,true],
  ['Renovaciones de este cierre · ya incluidas',x=>x.renewalsNow],['Plantilla',x=>x.employees,String],
  ['Cobertura de demanda',x=>x.fill,x=>`${Math.round(x*100)} %`],
 ];
 if(investment?.franchiseeProfit!=null)rows.push(['Resultado del nuevo franquiciado',x=>x.franchiseeProfit,v=>v==null?'—':moneyShort(v),true]);
 return `<table class="tbl stress-metrics ${investment?'stress-comparison':''}"><thead><tr><th>Indicador</th><th>${investment?'Mantener':'Empresa actual'}</th>${investment?`<th>${esc(alternativeLabel)}</th>`:''}</tr></thead><tbody>
  ${rows.map(([name,read,format=moneyShort,colored])=>`<tr><td>${name}</td>${[current,...(investment?[investment]:[])].map(x=>{const value=read(x);return `<td class="${colored&&value!=null?tone(value):''}">${esc(format(value))}</td>`;}).join('')}</tr>`).join('')}
 </tbody></table>`;
}
export function renderStress(s,ids=[],expectedItems=null,operation='upgrade') {
 const sale=operation==='sale',report=stressReport(s,ids,expectedItems,operation),plan=report.comparison,compared=!!plan?.ok;
 const opening=operation==='opening',ownerLosses=report.rows.filter(r=>r.investment?.franchiseeProfit!=null&&r.investment.franchiseeProfit<0).length;
 const stressed=report.rows.filter(x=>(x.investment||x.current).status!=='covered').length;
 return `<div class="card stress-panel"><h4>Pruebas de resistencia</h4><p class="small muted">Un cierre de ${dateLabel(s.month)}, bajo cuatro supuestos. No son probabilidades ni una predicción de sucesos.</p>
  ${plan&&opening?`<div class="stress-lot stress-opening-study">${plan.ok?renderOpeningStudy(plan):`<p class="stress-invalid warn">La apertura ya no es válida: ${esc(plan.msg)} Se muestran las cuentas actuales sin abrir.</p>`}<button class="btn small" data-act="stress-opening">Volver a Aperturas</button> <button class="btn small ghost" data-act="stress-current">Quitar comparación</button></div>`:plan?`<div class="stress-lot">${plan.ok?`<b>Lote en estudio: ${sale?'Ventas y rescisiones':'Reformas'} · ${plan.items.length} negocios · ${sale?`${plan.cashDelta>=0?'+':''}${money(plan.cashDelta)}`:money(plan.cost)}</b><details><summary>Ver negocios y ${sale?'operaciones':'niveles'}</summary><ul>${plan.items.map(x=>`<li>${esc(x.name)} · ${esc(CITY_BY_ID[x.city].name)} · #${x.id}: ${sale?`${x.mode==='franquicia'?'rescindir':'vender'} (${x.value>=0?'+':''}${money(x.value)})`:`nivel ${x.from} → ${x.to}`}</li>`).join('')}</ul></details><p class="small">${sale?'La columna Reestructurar suma las ventas y resta indemnizaciones una sola vez.':'La columna Reformar descuenta esta inversión una sola vez.'} Todavía no se ha ejecutado el lote.</p>`:`<p class="stress-invalid warn">El lote ya no es válido: ${esc(plan.msg)} Se muestran las cuentas actuales, sin aplicar la operación.</p>`}
   <button class="btn small" data-act="stress-portfolio">Volver al lote en cartera</button> <button class="btn small ghost" data-act="stress-current">Quitar comparación</button></div>`:'<p class="small">Desde Cartera puedes estudiar reformas o ventas; desde Aperturas, un nuevo negocio. Pulsa Probar escenarios para compararlo sin ejecutar operaciones.</p><button class="btn small" data-act="stress-portfolio">Abrir cartera</button> <button class="btn small" data-act="stress-opening">Comparar aperturas</button>'}
  <p class="small ${stressed?'warn':'pos'}">${compared?(opening?'Con la apertura':'Con el lote'):'En la empresa actual'}, ${stressed} de 4 supuestos dejan la caja tras el cierre por debajo del colchón de referencia.</p>
  ${ownerLosses?`<p class="small warn stress-owner-warning">El nuevo franquiciado registra pérdidas en ${ownerLosses} de 4 supuestos. La central y el franquiciado llevan cuentas separadas; no son probabilidades.</p>`:''}
  <p class="small muted">Colchón orientativo: tres nóminas de plantilla y directivos, más renovaciones de los 12 meses posteriores a este cierre. No bloquea dinero ni impide invertir.</p>
  ${report.rows.map((r,i)=>{const a=STRESS_SCENARIOS[i],result=r.investment||r.current;return `<details class="stress-scenario" ${i===0?'open':''}><summary><b>${esc(a.label)}</b><span class="small">${compared?`${moneyShort(r.current.net)} → ${moneyShort(result.net)}`:moneyShort(result.net)} /mes · <span class="${statusTone(result.status)}">${labels[result.status]}</span></span></summary><p class="small">${esc(a.description)}</p>${metrics(r.current,r.investment,opening?'Abrir':sale?'Reestructurar':'Reformar')}</details>`;}).join('')}
  <p class="small muted">Caja antes de nueva financiación u otras operaciones adicionales. Cada alternativa aplica primero los efectos inmediatos de su operación, incluidos objetivos; después calcula este cierre con los supuestos indicados, sin avanzar el calendario, completar I+D ni generar sucesos nuevos. Las renovaciones usan costes de reposición actuales; las de este mes ya están descontadas del resultado y no se suman otra vez al colchón futuro.</p></div>`;
}
