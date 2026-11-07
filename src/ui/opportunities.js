import {openingOpportunities,immediateOpeningTypes} from '../core/opportunities.js';
import {BUSINESS_TYPES} from '../data/businesses.js';
import {CITY_BY_ID} from '../data/cities.js';
import {sobaoTypeId} from '../core/actions.js';
import {buildMonths} from '../core/construction.js';
import {dateLabel,money,moneyShort, fillPct } from '../core/helpers.js';
import {esc} from './dom.js';
const signed=n=>`${n>=0?'+':''}${moneyShort(n)}`;
const tone=n=>n<0?'neg':'pos';
export function renderOpeningStudy(p) {
 const franchise=p.choice.mode==='franquicia';
 return `<b>Apertura en estudio: ${esc(BUSINESS_TYPES[p.choice.type].name)} · ${esc(CITY_BY_ID[p.choice.city].name)} · ${franchise?'Franquicia':'Propia'}</b>
  <p>${franchise?'Canon que recibirías':'Desembolso'}: ${money(franchise?p.fee:p.cost)}.${p.goalCash?` Premios de objetivos: ${signed(p.goalCash)}.`:''}</p>
  <p class="small">La columna Abrir incorpora esos cobros y pagos una sola vez, antes de calcular el cierre. Todavía no se ha abierto ningún negocio.</p>
  ${p.clauseBreaks?'<p class="small warn">Esta apertura rompería la cláusula del testamento. Estudiarla no cambia la partida; la confirmación real conserva su aviso.</p>':''}`;
}
export function renderOpeningReview(p) {
 const franchise=p.choice.mode==='franquicia';
 return `<p><b>${esc(BUSINESS_TYPES[p.choice.type].name)} · ${esc(CITY_BY_ID[p.choice.city].name)}</b><br>${franchise?'Franquicia':'Local propio'} · apertura inmediata.</p>
  <p>${franchise?'Canon que recibes':'Desembolso'}: <b>${money(franchise?p.fee:p.cost)}</b>.</p>
  ${p.goalCash?`<p>Premios de objetivos al abrir: <b>${signed(p.goalCash)}</b>, una sola vez.</p>`:''}
  <p>Caja después de abrir: ${moneyShort(p.before.cash)} → <b>${moneyShort(p.cashAfter)}</b>. Patrimonio: ${moneyShort(p.before.wealth)} → ${moneyShort(p.after.wealth)}.</p>
  <p>Resultado neto de la empresa en ${dateLabel(p.month)}: <b>${moneyShort(p.before.net)} → ${moneyShort(p.after.net)}</b> (<b class="${tone(p.deltaNet)}">${signed(p.deltaNet)}</b>).</p>
  <p class="small">Cobertura de demanda: ${fillPct(p.before.fill)} → ${fillPct(p.after.fill)}. Plantilla central: ${p.before.employees} → ${p.after.employees}.</p>
  ${franchise?`<p>Resultado del dueño: <b class="${tone(p.franchiseeProfit)}">${signed(p.franchiseeProfit)}/mes</b>.</p>${p.franchiseeProfit<0?'<p class="small warn">El dueño perdería dinero con estas condiciones. Si encadena cuatro meses de pérdidas quiebra: o le recompras el local devolviéndole el canon, o le dices que le ha faltado mentalidad (reputación −5 y riesgo de que te demande por el canon).</p>':''}`:''}
  ${p.deltaNet<=0?'<p class="small warn">Con las condiciones actuales, esta apertura no mejora el neto de la empresa.</p>':''}
  ${fillPct(p.after.fill)!==fillPct(p.before.fill)&&p.after.fill<p.before.fill?'<p class="small warn">La cobertura de suministro baja: el nuevo local compite por la producción disponible.</p>':''}
  ${p.clauseBreaks?'<p class="small warn">Esta apertura rompe la cláusula del testamento. Se pedirá confirmación adicional.</p>':''}
  <p class="small muted">Incluye costes generales, impuestos, mantenimiento y cambios compartidos en producción, personal y sinergias. Canon y premios no son beneficio mensual. Es una alternativa independiente con las condiciones actuales; no garantiza resultados futuros.</p>`;
}
export function renderOpportunities(s,settings={}) {
 const types=immediateOpeningTypes(s),requested=BUSINESS_TYPES[settings.type];
 if(settings.preserveType&&requested&&!buildMonths(requested.id)&&!types.some(t=>t.id===requested.id))types.push({id:requested.id,name:`${requested.name} · marca anterior`,enabled:false});
 const type=types.some(t=>t.id===settings.type)?settings.type:sobaoTypeId(s),franchisable=BUSINESS_TYPES[type].category==='sobaos';
 const filters={...settings,type,mode:franchisable?(settings.mode||'both'):'propia'},p=openingOpportunities(s,filters);
 const page=Math.max(0,Math.min(Number.isInteger(settings.page)?settings.page:0,Math.max(0,Math.ceil(p.rows.length/10)-1))),rows=p.rows.slice(page*10,(page+1)*10);
 const select=(key,label,options)=>`<label>${label}<select data-act="opening-filter" data-key="${key}">${options.map(x=>`<option value="${esc(x.id)}" ${x.id===(filters[key]||'all')?'selected':''} ${x.enabled===false?'disabled':''}>${esc(x.name)}${x.enabled===false?' (bloqueado)':''}</option>`).join('')}</select></label>`;
 return `<div class="card opening-opportunities"><h4>Comparar nuevas aperturas</h4><p class="small muted">Alternativas independientes para ${dateLabel(s.month)}. Cada una parte de tu situación actual; consultar no consume descuentos ni premios.</p>
  <div class="portfolio-filters"><div class="portfolio-search">${select('type','Negocio',types)}</div>
   ${select('mode','Modalidad',franchisable?[{id:'both',name:'Comparar ambas'},{id:'propia',name:'Propia'},{id:'franquicia',name:'Franquicia'}]:[{id:'propia',name:'Propia'}])}
   ${select('country','País',[{id:'all',name:'Todos'},...p.countries])}
   ${select('order','Orden',[{id:'all',name:'Mayor mejora neta'},{id:'cost',name:'Menor desembolso'},{id:'city',name:'Ciudad'}])}
   <label>Buscar ciudad<input type="search" data-act="opening-search" value="${esc(settings.query||'')}" placeholder="Nombre de ciudad"></label>
  </div><label class="small"><input type="checkbox" data-act="opening-filter" data-key="showBlocked" ${settings.showBlocked?'checked':''}> Mostrar bloqueadas y sus motivos</label>
  <p class="small">${p.rows.length} alternativas · ${rows.length?`${page*10+1}–${page*10+rows.length}`:'0'} visibles.</p>
  ${rows.map(r=>`<div class="opening-option"><b><a href="#" data-act="goto-city" data-city="${r.choice.city}">${esc(CITY_BY_ID[r.choice.city].name)}</a> · ${r.choice.mode==='franquicia'?'Franquicia':'Propia'}</b>
   <p class="small">${r.choice.mode==='franquicia'?`Canon: +${money(r.fee)}`:`Desembolso: ${money(r.cost)}`}</p>
   ${r.ok?`<p class="small">Cambio neto de la empresa: <b class="${tone(r.deltaNet)}">${signed(r.deltaNet)}/mes</b>. Cobertura: ${fillPct(r.after.fill)}.</p>
    ${r.choice.mode==='franquicia'?`<p class="small">Resultado del dueño: <b class="${tone(r.franchiseeProfit)}">${signed(r.franchiseeProfit)}/mes</b>${r.franchiseeProfit<0?' · riesgo de pérdidas':''}.</p>`:''}
    ${r.clauseBreaks?'<p class="small warn">Rompería la cláusula del testamento.</p>':''}`:`<p class="small warn">${esc(r.msg)}</p>`}
   <button class="btn small" data-act="opening-review" data-type="${r.choice.type}" data-city="${r.choice.city}" data-mode="${r.choice.mode}" ${r.ok?'':'disabled'}>Revisar apertura</button> <button class="btn small" data-act="opening-stress" data-type="${r.choice.type}" data-city="${r.choice.city}" data-mode="${r.choice.mode}" ${r.ok?'':'disabled'}>Probar escenarios</button>
  </div>`).join('')||'<p class="small muted">No hay alternativas disponibles con estos filtros. Activa Mostrar bloqueadas para consultar motivos.</p>'}
  <div class="portfolio-tools"><button class="btn small" data-act="opening-page" data-direction="previous" data-page="${page-1}" ${page>0?'':'disabled'}>Anterior</button><span class="small">Página ${page+1} de ${Math.max(1,Math.ceil(p.rows.length/10))}</span><button class="btn small" data-act="opening-page" data-direction="next" data-page="${page+1}" ${(page+1)*10<p.rows.length?'':'disabled'}>Siguiente</button></div>
  <p class="small muted">La mejora neta corresponde a toda la empresa, con producción y costes compartidos. Las obras con plazo se gestionan desde Ciudad y Viviendas; aquí se comparan negocios que entran en servicio al momento.</p></div>`;
}
