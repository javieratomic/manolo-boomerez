import {portfolio,portfolioSelection,upgradeBatchPlan} from '../core/portfolio.js';
import {CITY_BY_ID} from '../data/cities.js';
import {FOREIGN_BY_ID} from '../data/international.js';
import {CAT_NAMES} from '../core/digest.js';
import {dateLabel,money,moneyShort} from '../core/helpers.js';
import {esc} from './dom.js';

export const PORTFOLIO_PAGE_SIZE=10;
const signed=n=>`${n>=0?'+':''}${moneyShort(n)}`;
const tone=n=>n<0?'neg':'pos';
const options=(rows,value)=>rows.map(r=>`<option value="${esc(r.id)}" ${r.id===value?'selected':''}>${esc(r.name)}</option>`).join('');
function resultPreview(p) {
 return `<p>Resultado mensual de toda la empresa: <b>${moneyShort(p.before.net)} → ${moneyShort(p.after.net)}</b> (<b class="${tone(p.deltaNet)}">${signed(p.deltaNet)}/mes</b>).</p>
  <p class="small">Cobertura de demanda: ${Math.round(p.before.fill*100)} % → ${Math.round(p.after.fill*100)} %. Plantilla: ${p.before.employees} → ${p.after.employees}.</p>
  ${p.deltaNet<=0?'<p class="small warn">Con las condiciones actuales, este lote no mejora el resultado mensual.</p>':''}
  <p class="small muted">Previsión conjunta con producción y personal compartidos, costes generales e impuestos. Mantiene las condiciones del mes actual; no es una garantía de beneficio futuro ni incluye la inversión como gasto mensual.</p>`;
}
export function renderUpgradeReview(p) {
 return `<p><b>${p.items.length} reformas · ${money(p.cost)}</b> de inversión inmediata.</p>
  <ol>${p.items.map(x=>`<li>${esc(x.name)} · ${esc(CITY_BY_ID[x.city].name)} · #${x.id}: nivel ${x.from} → ${x.to} (${money(x.cost)})</li>`).join('')}</ol>
  ${resultPreview(p)}<p>Se ejecuta el lote completo o no se cobra nada.</p>`;
}
export function renderPortfolio(s,settings={},data=null) {
 const filters=settings.filters||{},p=data||portfolio(s,filters),selected=portfolioSelection(p.rows,settings.selected);
 const page=Math.max(0,Math.min(Number.isInteger(settings.page)?settings.page:0,Math.max(0,Math.ceil(p.rows.length/PORTFOLIO_PAGE_SIZE)-1)));
 const visible=p.rows.slice(page*PORTFOLIO_PAGE_SIZE,(page+1)*PORTFOLIO_PAGE_SIZE),plan=selected.length?upgradeBatchPlan(s,selected):null;
 const select=(key,label,rows)=>{
  const value=filters[key]||'all';
  if(!rows.some(r=>r.id===value))rows=[...rows,{id:value,name:`${key==='country'?(FOREIGN_BY_ID[value]?.country||value):(CAT_NAMES[value]||value)} (sin negocios)`}];
  return `<label>${label}<select data-act="portfolio-filter" data-key="${key}">${options(rows,value)}</select></label>`;
 };
 return `<div class="card portfolio"><h4>Cartera de negocios</h4><p class="small muted">Previsión del mes actual: ${dateLabel(s.month)}. Solo negocios físicos actuales; el obrador central, online y los acuerdos exteriores se gestionan en sus pantallas.</p>
  <div class="portfolio-filters"><label class="portfolio-search">Buscar ciudad o negocio<input type="search" data-act="portfolio-search" value="${esc(filters.query||'')}" placeholder="Nombre, ciudad o número"></label>
  ${select('country','País',[{id:'all',name:'Todos'},...p.countries])}
  ${select('category','Sector',[{id:'all',name:'Todos'},...p.categories.map(id=>({id,name:CAT_NAMES[id]||id}))])}
  ${select('status','Estado',[{id:'all',name:'Todos'},{id:'losses',name:'En pérdidas'},{id:'construction',name:'En obras'},{id:'upgradeable',name:'Reformables'},{id:'franchise',name:'Franquicias'}])}
  ${select('order','Orden',[{id:'all',name:'Peor resultado primero'},{id:'profitDesc',name:'Mejor resultado primero'},{id:'city',name:'Ciudad'},{id:'level',name:'Menor nivel primero'}])}</div>
  <p class="small">${p.rows.length} negocios de ${p.total} · ${p.rows.length?`${page*PORTFOLIO_PAGE_SIZE+1}–${page*PORTFOLIO_PAGE_SIZE+visible.length}`:'0'} visibles.</p>
  <div class="portfolio-tools"><button class="btn small" data-act="portfolio-all" ${p.rows.some(r=>r.upgradeable)?'':'disabled'}>Seleccionar reformables del filtro</button><button class="btn small ghost" data-act="portfolio-clear" ${selected.length?'':'disabled'}>Limpiar selección</button></div>
  <p class="small muted">La selección se conserva entre páginas. Cambiar un filtro la limpia.</p>
  ${selected.length?`<div class="portfolio-selection" aria-live="polite"><b>${selected.length} ${selected.length===1?'negocio seleccionado':'negocios seleccionados'}</b> · ${money(plan.cost)}
   ${plan.ok?resultPreview(plan):`<p class="small warn">${esc(plan.msg)} No se aplicará ninguna reforma.</p>`}
   <button class="btn primary small" data-act="portfolio-review" ${plan.ok?'':'disabled'}>Revisar lote de reformas</button></div>`:''}
  ${visible.map(r=>`<div class="portfolio-business"><div class="portfolio-heading"><label><input type="checkbox" data-act="portfolio-pick" data-id="${r.id}" ${selected.includes(r.id)?'checked':''} ${r.upgradeable?'':'disabled'} aria-label="Seleccionar ${esc(r.name)} de ${esc(CITY_BY_ID[r.city].name)} número ${r.id}"><b>${esc(r.name)}</b></label><span class="tag">Nivel ${r.level}/10 · #${r.id}</span></div>
   <div class="small"><a href="#" data-act="goto-city" data-city="${r.city}">${esc(CITY_BY_ID[r.city].name)}</a> · ${r.mode==='franquicia'?'Franquicia':'Propio'}</div>
   ${r.operating?`<p class="small">Ingresos central: ${moneyShort(r.revenue)} · Resultado central: <b class="${tone(r.profit)}">${signed(r.profit)}/mes</b>${r.mode==='franquicia'?`<br>Resultado del dueño: <b class="${tone(r.franchiseeProfit)}">${signed(r.franchiseeProfit)}/mes</b>`:''}</p>`:`<p class="small">🏗️ En obras · entrega en ${dateLabel(r.readyMonth)}</p>`}
   <div class="small muted">${!r.operating?'Se podrá reformar tras la entrega.':r.mode==='franquicia'?'Las reformas corresponden al franquiciado.':r.upgradeCost==null?'Nivel máximo.':`Siguiente reforma: ${money(r.upgradeCost)}.`}</div></div>`).join('')||'<p class="small muted">No hay negocios con estos filtros.</p>'}
  <div class="portfolio-tools"><button class="btn small" data-act="portfolio-page" data-direction="previous" data-page="${page-1}" ${page>0?'':'disabled'}>Anterior</button><span class="small">Página ${page+1} de ${Math.max(1,Math.ceil(p.rows.length/PORTFOLIO_PAGE_SIZE))}</span><button class="btn small" data-act="portfolio-page" data-direction="next" data-page="${page+1}" ${(page+1)*PORTFOLIO_PAGE_SIZE<p.rows.length?'':'disabled'}>Siguiente</button></div>
  <p class="small muted">Resultado de cada negocio antes de costes generales e impuestos de la central. El filtro de pérdidas y su orden usan las cuentas del dueño en las franquicias.</p></div>`;
}
