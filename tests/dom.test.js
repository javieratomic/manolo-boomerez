import {PRODUCTS} from '../src/data/market.js';
import {FOREIGN_MARKETS} from '../src/data/international.js';
import {MapView} from '../src/render/mapView.js';
// Regresiones del DOM real: se ejecutan en tests/index.html, sin dependencias.
import { test, assert, assertEq } from './runner.js';
import { showModal, isModalOpen } from '../src/ui/dom.js';
import { newGame } from '../src/core/state.js';
import {computeEconomy} from '../src/core/economy.js';
import { resolvePending } from '../src/core/sim.js';
import { renderManolo, renderCity, renderEmpire, renderMarket, renderResearch, renderMarketing, renderInternational, renderOnline, renderResidences, renderBenefits, renderStaff,renderFinance } from '../src/ui/panels.js';

test('DOM: I+D permite evaluar pendientes y bloqueados sin desarrollar al consultar',()=>{
 const s=newGame(42);resolvePending(s,0);s.cash=0;s.products=['congelados'];s.rd={id:'horneado_continuo',monthsLeft:3,total:5};
 const el=document.createElement('div');el.innerHTML=renderResearch(s,{status:'all'});
 assert(el.querySelector('[data-act="research-preview"][data-id="horneado_continuo"]:not(:disabled)'));
 assert(el.querySelector('[data-act="research-preview"][data-id="licencia_bancaria"]:not(:disabled)'));
 assert((el.querySelector('[data-act="research-preview"][data-id="licencia_bancaria"]').getAttribute('aria-label')||'').includes('Licencia de banca'));
 assert(!el.querySelector('[data-act="research-preview"][data-id="congelados"]'));
 assert(el.querySelector('[data-act="rd"][data-id="licencia_bancaria"]:disabled'));
});

test('DOM: evaluación de I+D muestra límite laboral y no contiene acciones de compra',async()=>{
 const {researchPlan}=await import('../src/core/research.js'),{renderResearchReview}=await import('../src/ui/research.js');
 const s=newGame(42);resolvePending(s,0);s.cash=1e7;s.obrador.expansions=4;const before=JSON.stringify(s);
 const el=document.createElement('div');el.innerHTML=renderResearchReview(researchPlan(s,'horneado_continuo'));
 for(const text of ['Actual','Con innovación','Capacidad efectiva','Selaya','Viviendas que faltan','no avanza el calendario','no es una previsión'])assert(el.textContent.includes(text),text);
 assert(!el.querySelector('[data-act]'));assertEq(JSON.stringify(s),before);
});

test('DOM: evaluación de I+D activa distingue coste ya pagado y desbloqueo sin locales ficticios',async()=>{
 const {researchPlan}=await import('../src/core/research.js'),{renderResearchReview}=await import('../src/ui/research.js');
 const s=newGame(42);resolvePending(s,0);s.rd={id:'licencia_bancaria',monthsLeft:2,total:9};
 const el=document.createElement('div');el.innerHTML=renderResearchReview(researchPlan(s,'licencia_bancaria'));
 assert(el.textContent.includes('ya se pagó'));assert(el.textContent.includes('Banco Boomerez'));assert(el.textContent.includes('no abre locales'));assert(el.textContent.includes('2 meses'));
});

test('DOM: las tarjetas de I+D muestran el plazo real reducido por Operaciones',()=>{
 const s=newGame(42);s.execs.operaciones={skill:3,salary:0};const el=document.createElement('div');el.innerHTML=renderResearch(s);
 assert(el.querySelector('[data-act="research-preview"][data-id="licencia_bancaria"]').closest('.product').textContent.includes('8 meses'));
});

test('DOM: I+D en curso conserva su plazo restante aunque cambie la dirección',()=>{
 const s=newGame(42);s.execs.operaciones={skill:3,salary:0};s.rd={id:'licencia_bancaria',monthsLeft:6,total:9};
 const el=document.createElement('div');el.innerHTML=renderResearch(s);const text=el.querySelector('[data-act="research-preview"][data-id="licencia_bancaria"]').closest('.product').textContent;
 assert(text.includes('Ya pagado'));assert(text.includes('6 meses restantes'));assert(!text.includes('8 meses'));
});

test('DOM: patrimonio reconcilia pasivos y separa exposición sin cambiar la partida',()=>{
 const s=newGame(42);s.debt=12000;s.cartilla.owed=8000;s.extraMonthly=[{ss:true,amount:400,months:6}];s.evaded=30000;s.dossier.ahorro=[10000];
 const before=JSON.stringify(s),el=document.createElement('div');el.innerHTML=renderFinance(s,{view:'wealth'});
 assert(el.querySelector('[data-act="finance-view"][data-view="wealth"][aria-pressed="true"]'));
 for(const label of ['Activos','Deudas confirmadas','Seguridad Social','Patrimonio antes de accionistas','Contingencias','Hacienda','Trabajo','sin multas adicionales','antes de crédito'])assert(el.textContent.includes(label),label);
 assertEq(JSON.stringify(s),before);assert(!el.querySelector('[data-act="borrow"]'));
});

test('DOM: patrimonio sin deudas ni contingencias no muestra ceros negativos',()=>{
 const el=document.createElement('div');el.innerHTML=renderFinance(newGame(42),{view:'wealth'});
 assert(!/[-−]0\s*€/.test(el.textContent));assert(el.textContent.includes('Sin importes acumulados'));
});

test('DOM: resultados incluyen banca, telecom y logística y admiten cierre antiguo',()=>{
 const s=newGame(42);s.lastReport={...computeEconomy(s),revenueByCat:{sobaos:100,finanzas:200,infraestructura:300,logistica:400},revenue:1000,net:100,tax:0};
 const el=document.createElement('div');el.innerHTML=renderFinance(s);
 for(const label of ['Banca','Telecomunicaciones','Logística','Deuda bancaria'])assert(el.textContent.includes(label),label);
 s.lastReport.revenueByCat={sobaos:100};el.innerHTML=renderFinance(s);assert(!el.textContent.includes('undefined'));assert(!el.textContent.includes('NaN'));
});

test('DOM: alternativas de apertura ofrecen Resistencia sin comprar y conservan ciudad y modalidad',async()=>{
 const {renderOpportunities}=await import('../src/ui/opportunities.js');const s=newGame(42);resolvePending(s,0);s.cash=1e7;
 const el=document.createElement('div');el.innerHTML=renderOpportunities(s,{query:'Madrid',mode:'both'});
 assertEq(el.querySelectorAll('[data-act="opening-stress"]').length,2);
 assert(el.querySelector('[data-act="opening-stress"][data-city="madrid"][data-mode="franquicia"]'));
});

test('DOM: Finanzas compara una apertura como Abrir, separa canon y vuelve a Aperturas',async()=>{
 const {openingPlan}=await import('../src/core/opportunities.js');const s=newGame(42);resolvePending(s,0);s.cash=1e7;
 const choice={type:'express',city:'madrid',mode:'franquicia'},quote=openingPlan(s,choice),before=JSON.stringify(s);
 const el=document.createElement('div');el.innerHTML=renderFinance(s,{view:'stress',operation:'opening',choice,quote});
 assertEq(el.querySelectorAll('.stress-comparison').length,4);assert(el.textContent.includes('Canon'));assert(el.textContent.includes('Madrid'));assert(el.textContent.includes('Abrir'));
 assert(el.querySelector('[data-act="stress-opening"]'));assert(!el.querySelector('[data-act="stress-portfolio"]'));assertEq(JSON.stringify(s),before);
});

test('DOM: pérdidas del nuevo franquiciado se muestran separadas de liquidez central',async()=>{
 const {renderStress}=await import('../src/ui/stress.js');const s=newGame(42);resolvePending(s,0);s.cash=1e7;
 s.businesses=Array.from({length:6},(_,i)=>({id:i+1,type:'express',city:'selaya',mode:'franquicia',fee:25000,level:1,value:0}));s.nextId=7;
 const el=document.createElement('div');el.innerHTML=renderStress(s,{type:'express',city:'selaya',mode:'franquicia'},null,'opening');
 assert(el.querySelector('.stress-owner-warning'));assert(el.querySelector('.stress-owner-warning').textContent.includes('4 de 4'));assert(el.textContent.includes('Resultado del nuevo franquiciado'));
});

test('DOM: retorno explícito de estudio conserva la marca anterior bloqueada, sin sustituirla',async()=>{
 const {renderOpportunities}=await import('../src/ui/opportunities.js');const s=newGame(42);resolvePending(s,0);s.cash=1e7;s.brand='maison';
 const el=document.createElement('div');el.innerHTML=renderOpportunities(s,{type:'express',preserveType:true,query:'Madrid',mode:'franquicia',showBlocked:true});
 assertEq(el.querySelector('[data-key="type"]').value,'express');assert(el.querySelector('[data-type="express"][data-act="opening-review"]:disabled'));assert(el.textContent.includes('Esa no es tu marca'));
});

test('DOM: Imperio ofrece Aperturas como subvista corta, sin añadir otra lista al resumen',()=>{
 const s=newGame(42);resolvePending(s,0);const before=JSON.stringify(s);
 const el=document.createElement('div');el.innerHTML=renderEmpire(s,{view:'openings',openings:{query:'Madrid'}});
 assert(el.querySelector('.opening-opportunities'));assert(!el.querySelector('.operations-plan'));assert(el.querySelector('[data-view="openings"][aria-pressed="true"]'));assertEq(JSON.stringify(s),before);
});

test('DOM: alternativas paginadas separan franquicia, canon, neto de central y dueño',async()=>{
 const {renderOpportunities}=await import('../src/ui/opportunities.js');const s=newGame(42);resolvePending(s,0);s.cash=1e7;
 const el=document.createElement('div');el.innerHTML=renderOpportunities(s,{query:'Madrid',mode:'both'});
 assertEq(el.querySelectorAll('.opening-option').length,2);assert(el.textContent.includes('Canon'));assert(el.textContent.includes('Resultado del dueño'));assert(el.textContent.includes('Cambio neto de la empresa'));
 assert(el.querySelector('[data-act="opening-review"][data-mode="propia"]'));assert(el.querySelector('[data-act="opening-review"][data-mode="franquicia"]'));
 el.innerHTML=renderOpportunities(s);assertEq(el.querySelectorAll('.opening-option').length,10);
});

test('DOM: Aperturas muestra motivos exteriores bloqueados y marca coherente tras rebranding',async()=>{
 const {renderOpportunities}=await import('../src/ui/opportunities.js');const s=newGame(42);resolvePending(s,0);s.cash=1e7;
 const el=document.createElement('div');el.innerHTML=renderOpportunities(s,{country:'portugal',showBlocked:true});
 assert(el.querySelectorAll('[data-act="opening-review"]:disabled').length>0);assert(el.textContent.includes('I+D'));
 s.brand='maison';el.innerHTML=renderOpportunities(s,{type:'express',query:'Madrid'});assertEq(el.querySelector('[data-key="type"]').value,'maison');
});

test('DOM: revisión de apertura distingue extras de objetivos de beneficios y avisa cláusula',async()=>{
 const {openingPlan}=await import('../src/core/opportunities.js');const {renderOpeningReview}=await import('../src/ui/opportunities.js');const s=newGame(42);resolvePending(s,0);s.cash=1e7;s.clausula={id:'cornisa',broken:false,done:false,closed:false};
 const html=renderOpeningReview(openingPlan(s,{type:'express',city:'madrid',mode:'propia'}));
 assert(html.includes('Madrid'));assert(html.includes('Desembolso'));assert(html.includes('cláusula'));assert(html.includes('costes generales'));
});

test('DOM: modo venta permite seleccionar franquicias, obras y máximos sin ofrecer ejecutar reformas',async()=>{
 const {renderPortfolio}=await import('../src/ui/portfolio.js');const s=newGame(42);resolvePending(s,0);s.cash=1e7;
 s.businesses=[{id:1,type:'express',city:'madrid',mode:'propia',level:10,value:1e5},{id:2,type:'express',city:'barcelona',mode:'franquicia',level:1,value:3e4,fee:42000},{id:3,type:'vivienda',housingForm:'apartamentos',city:'selaya',mode:'propia',level:1,value:2e6,readyMonth:12,renewalMonth:192}];
 const el=document.createElement('div');el.innerHTML=renderPortfolio(s,{operation:'sale',selected:[1,2,3]});
 assertEq(el.querySelectorAll('[data-act="portfolio-pick"]:disabled').length,0);assert(el.textContent.includes('Revisar ventas y rescisiones'));assert(el.querySelector('[data-act="portfolio-mode"][data-operation="sale"][aria-pressed="true"]'));
 assert(el.textContent.includes('indemnizaciones'));assert(!el.textContent.includes('Revisar lote de reformas'));
});

test('DOM: revisión de venta explica ingresos, pagos y capacidad perdida antes de confirmar',async()=>{
 const {saleBatchPlan}=await import('../src/core/divestment.js');const {renderSaleReview}=await import('../src/ui/divestment.js');const s=newGame(42);resolvePending(s,0);s.cash=1e7;s.obrador.expansions=8;
 s.businesses=[{id:1,type:'vivienda',housingForm:'apartamentos',city:'selaya',mode:'propia',level:1,value:2e6},{id:2,type:'express',city:'madrid',mode:'franquicia',level:1,fee:42000,value:3e4}];
 const html=renderSaleReview(saleBatchPlan(s,[1,2]));assert(html.includes('indemnizaciones'));assert(html.includes('capacidad'));assert(html.includes('Selaya'));assert(html.includes('Pagas'));assert(html.includes('Cobras'));assert(html.includes('definitiva'));
});

test('DOM: resistencia de venta usa Reestructurar y movimiento de caja firmado, sin hablar de reforma',async()=>{
 const {renderStress}=await import('../src/ui/stress.js');const s=newGame(42);resolvePending(s,0);s.cash=1e7;s.businesses=[{id:1,type:'express',city:'madrid',mode:'propia',level:1,value:1e5}];
 const el=document.createElement('div');el.innerHTML=renderStress(s,[1],null,'sale');assert(el.textContent.includes('Reestructurar'));assert(el.textContent.includes('Ventas y rescisiones'));assert(el.textContent.includes('una sola vez'));assert(!el.textContent.includes('nivel 1 → 2'));
});

test('DOM: revisión muestra los meses en que vender una obra prolonga la falta de vivienda',async()=>{
 const {saleBatchPlan}=await import('../src/core/divestment.js');const {renderSaleReview}=await import('../src/ui/divestment.js');const s=newGame(42);resolvePending(s,0);s.cash=1e7;s.obrador.expansions=8;
 s.businesses=[2,4].map((readyMonth,i)=>({id:i+1,type:'vivienda',housingForm:'apartamentos',city:'selaya',mode:'propia',level:1,value:2e6,readyMonth}));
 const el=document.createElement('div');el.innerHTML=renderSaleReview(saleBatchPlan(s,[1]));
 assert(el.textContent.includes('empeora en 2 cierres, desde Marzo 2026'));assert(el.textContent.includes('más que antes'));
});

test('DOM: Finanzas ofrece resistencia sin informe previo y explica supuestos sin probabilidades',()=>{
 const s=newGame(42);resolvePending(s,0);const before=JSON.stringify(s);
 const el=document.createElement('div');el.innerHTML=renderFinance(s,{view:'stress',ids:[]});
 assertEq(el.querySelectorAll('.stress-scenario').length,4);assert(!el.querySelector('#chart'));assert(el.textContent.includes('No son probabilidades'));assert(el.textContent.includes('tres nóminas'));assert(el.querySelector('[data-act="finance-view"]'));assertEq(JSON.stringify(s),before);
});

test('DOM: comparación de resistencia identifica lote sin botones que ejecuten inversiones',async()=>{
 const {renderStress}=await import('../src/ui/stress.js');const s=newGame(42);resolvePending(s,0);s.cash=1e7;
 s.businesses=[{id:1,type:'express',city:'madrid',mode:'propia',level:1,value:3e4}];
 const el=document.createElement('div');el.innerHTML=renderStress(s,[1]);
 assert(el.querySelector('.stress-lot'));assert(el.textContent.includes('Madrid'));assert(el.textContent.includes('nivel 1 → 2'));
 assertEq(el.querySelectorAll('.stress-comparison').length,4);assert(!el.querySelector('[data-act="portfolio-review"]'));assert(el.querySelector('[data-act="stress-current"]'));assert(el.querySelector('[data-act="stress-portfolio"]'));
});

test('DOM: lote de resistencia obsoleto deja ver las cuentas actuales',async()=>{
 const {renderStress}=await import('../src/ui/stress.js');const s=newGame(42);resolvePending(s,0);
 const el=document.createElement('div');el.innerHTML=renderStress(s,[999]);
 assert(el.querySelector('.stress-invalid'));assertEq(el.querySelectorAll('.stress-scenario').length,4);assertEq(el.querySelectorAll('.stress-comparison').length,0);
});

test('DOM: cartera permite probar escenarios del lote válido antes de comprar',async()=>{
 const {renderPortfolio}=await import('../src/ui/portfolio.js');const s=newGame(42);resolvePending(s,0);s.cash=1e7;s.businesses=[{id:1,type:'express',city:'madrid',mode:'propia',level:1,value:3e4}];
 const el=document.createElement('div');el.innerHTML=renderPortfolio(s,{selected:[1]});assert(el.querySelector('[data-act="portfolio-stress"]'));assert(!el.querySelector('[data-act="portfolio-stress"]').disabled);
});

test('DOM: cartera es una subvista de Imperio y limita la página a diez negocios sin informe',()=>{
 const s=newGame(42);resolvePending(s,0);s.businesses=Array.from({length:23},(_,i)=>({id:i+1,type:'express',city:'madrid',mode:'propia',level:1,value:3e4}));
 const el=document.createElement('div');el.innerHTML=renderEmpire(s,{view:'portfolio'});
 assertEq(el.querySelectorAll('.portfolio-business').length,10);assert(!el.querySelector('.operations-plan'));assert(el.querySelector('[data-act="empire-view"]'));
 assert(el.textContent.includes('23 negocios'));assert(el.textContent.includes('Previsión del mes actual'));
});

test('DOM: cartera excluye selección invisible o no reformable y muestra el lote de otras páginas',async()=>{
 const {renderPortfolio}=await import('../src/ui/portfolio.js');const s=newGame(42);resolvePending(s,0);s.cash=1e8;
 s.businesses=Array.from({length:12},(_,i)=>({id:i+1,type:'express',city:i===11?'barcelona':'madrid',mode:i===0?'franquicia':'propia',level:1,value:3e4}));
 const el=document.createElement('div');el.innerHTML=renderPortfolio(s,{page:1,selected:[1,2,12,999]});
 assertEq(el.querySelectorAll('.portfolio-business').length,2);assert(el.textContent.includes('2 negocios seleccionados'));
 assert(el.querySelector('[data-act="portfolio-review"]'));assert(!el.querySelector('[data-act="portfolio-review"]').disabled);
 el.innerHTML=renderPortfolio(s,{filters:{query:'barcelona'},selected:[2,12]});
 assert(el.textContent.includes('1 negocio seleccionado'));assert(el.textContent.includes('Barcelona'));
});

test('DOM: cartera distingue obras, franquicias y límite de nivel sin ofrecer reformas',async()=>{
 const {renderPortfolio}=await import('../src/ui/portfolio.js');const s=newGame(42);resolvePending(s,0);
 s.businesses=[{id:1,type:'telecom',city:'madrid',mode:'propia',level:1,value:3e6,readyMonth:6},{id:2,type:'express',city:'barcelona',mode:'franquicia',level:1,value:3e4},{id:3,type:'express',city:'valencia',mode:'propia',level:10,value:3e4}];
 const el=document.createElement('div');el.innerHTML=renderPortfolio(s);
 assertEq(el.querySelectorAll('[data-act="portfolio-pick"]:disabled').length,3);assert(el.textContent.includes('En obras'));assert(el.textContent.includes('Resultado del dueño'));assert(el.textContent.includes('Nivel máximo'));
});

test('DOM: cartera conserva visibles los filtros de un país o sector tras vender su último negocio',async()=>{
 const {renderPortfolio}=await import('../src/ui/portfolio.js');const s=newGame(42);resolvePending(s,0);
 s.businesses=[{id:1,type:'express',city:'madrid',mode:'propia',level:1,value:3e4}];
 const el=document.createElement('div');el.innerHTML=renderPortfolio(s,{filters:{country:'portugal',category:'infraestructura'}});
 assertEq(el.querySelector('[data-key="country"]').value,'portugal');assertEq(el.querySelector('[data-key="category"]').value,'infraestructura');
 assert(el.textContent.includes('sin negocios'));assertEq(el.querySelectorAll('.portfolio-business').length,0);
});

test('DOM: Imperio mantiene el informe histórico disponible pero plegado para no alargar el resumen',async()=>{
 const {computeEconomy}=await import('../src/core/economy.js');const s=newGame(42);resolvePending(s,0);s.lastReport=computeEconomy(s);
 const el=document.createElement('div');el.innerHTML=renderEmpire(s);
 const details=el.querySelector('.empire-last-report');assert(details);assert(!details.open);assert(details.querySelector('table'));
});

test('DOM: Imperio muestra plan de operaciones antes del primer cierre sin cambiar la partida',()=>{
 const s=newGame(42);resolvePending(s,0);const before=JSON.stringify(s);
 const el=document.createElement('div');el.innerHTML=renderEmpire(s);
 assert(el.querySelector('.operations-plan'),'Plan presente sin informe');assert(el.textContent.includes('Plan de operaciones'));
 assert(el.textContent.includes('Sin entregas ni renovaciones'));assertEq(JSON.stringify(s),before);
});

test('DOM: operaciones muestra fechas, viviendas reales, riesgos y enlaces de gestión',async()=>{
 const {renderOperations}=await import('../src/ui/operations.js');
 const s=newGame(42);resolvePending(s,0);s.month=11;s.obrador.expansions=10;
 s.businesses=[{id:1,type:'vivienda',housingForm:'apartamentos',city:'selaya',mode:'propia',level:1,value:2e6,readyMonth:23,renewalMonth:203},{id:2,type:'vivienda',housingForm:'chalets',city:'madrid',mode:'propia',level:1,value:3e6,readyMonth:0,renewalMonth:12}];
 const el=document.createElement('div');el.innerHTML=renderOperations(s);
 assertEq(el.querySelectorAll('.operations-metrics b')[1].textContent,'25');assert(el.textContent.includes('viviendas pendientes'));assert(el.textContent.includes('Diciembre 2027'));assert(el.textContent.includes('Enero 2027'));
 assert(el.querySelector('.operations-risks[open]'));assert(el.querySelector('[data-tab="viviendas"]'));assert(el.querySelector('[data-city="madrid"]'));
 assert(el.textContent.includes('condiciones actuales'));assert(el.textContent.includes('no es una previsión de caja'));
 assertEq(el.querySelectorAll('.operations-event').length,2);
});

test('DOM: agenda de operaciones se mantiene plegada y no ofrece cobros ni acciones nuevas',async()=>{
 const {renderOperations}=await import('../src/ui/operations.js');
 const s=newGame(42);resolvePending(s,0);s.businesses=[{id:1,type:'vivienda',housingForm:'chalets',city:'selaya',mode:'propia',level:1,value:3e6,readyMonth:12,renewalMonth:192}];
 const el=document.createElement('div');el.innerHTML=renderOperations(s);
 assert(!el.querySelector('.operations-agenda').open);assert(!el.querySelector('.operations-risks'));
 assert([...el.querySelectorAll('[data-act]')].every(x=>['tab','goto-city'].includes(x.dataset.act)));
});

test('DOM: descubierto sin renovaciones no inventa una reserva pendiente',async()=>{
 const {renderOperations}=await import('../src/ui/operations.js');
 const s=newGame(42);resolvePending(s,0);s.cash=-1000;
 assert(!renderOperations(s).includes('La caja actual no cubriría'));
});

test('DOM: la pestaña Manolo muestra la edad del mes actual', () => {
  const s = newGame(42);
  resolvePending(s, 0);
  for (const [month, age] of [[72, 61], [83, 61], [84, 62]]) {
    s.month = month;
    assert(renderManolo(s).includes(`${age} años`));
  }
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const root = () => {
  let el = document.getElementById('modal-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'modal-root';
    document.body.appendChild(el);
  }
  return el;
};

test('DOM: una elección se aplica una sola vez aunque se pulse durante el cierre', async () => {
  const el = root();
  let calls = 0;
  const done = showModal({ title: 'Elección única', choices: [{ label: 'Elegir' }], followUp: () => { calls++; } });
  const button = el.lastElementChild.querySelector('button');
  button.click();
  assertEq(calls, 0, 'guarda de apertura');
  await wait(380);
  button.click();
  button.click();
  await done;
  assertEq(calls, 1);
  assert(!isModalOpen(), 'contador a cero tras cerrar una vez');
  await wait(180);
});

test('DOM: el doble clic y Intro no pasan de una carta a la siguiente', async () => {
  const el = root();
  let calls = 0;
  const first = showModal({ title: 'Primera carta' });
  const old = el.lastElementChild.querySelector('button');
  await wait(380);
  old.click();
  await first;
  const second = showModal({ title: 'Segunda carta', choices: [{ label: 'Elegir' }], followUp: () => { calls++; } });
  old.click();
  el.lastElementChild.querySelector('button').click();
  document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assertEq(calls, 0, 'las entradas arrastradas no eligen');
  assert(isModalOpen(), 'el fondo anterior no decrementa el contador dos veces');
  await wait(380);
  el.lastElementChild.querySelector('button').click();
  await second;
  assertEq(calls, 1);
  assert(!isModalOpen());
  await wait(180);
});

test('DOM: mantener una tecla no cierra el resultado ni elige en la carta siguiente', async () => {
  const el = root();
  for (const key of ['1', 'Enter']) {
    let calls = 0;
    const done = showModal({ title: 'Tecla mantenida', choices: [{ label: 'Elegir' }], followUp: () => {
      calls++;
      return { text: 'Este resultado debe esperar una nueva pulsación.' };
    } });
    try {
      await wait(380);
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      await wait(380);
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key, repeat: true, bubbles: true }));
      assert(isModalOpen(), `${key}: la repetición no cierra el resultado`);
      assertEq(calls, 1);
    } finally {
      el.querySelector('.modal-backdrop:not(.closing) button')?.click();
      await done;
      await wait(180);
    }
    let nextCalls = 0;
    const next = showModal({ title: 'Carta siguiente', choices: [{ label: 'Elegir' }], followUp: () => { nextCalls++; } });
    try {
      await wait(380);
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key, repeat: true, bubbles: true }));
      assertEq(nextCalls, 0, `${key}: la repetición tampoco elige en la carta siguiente`);
      assert(isModalOpen());
    } finally {
      el.querySelector('.modal-backdrop:not(.closing) button')?.click();
      await next;
      await wait(180);
    }
  }
});

test('DOM: Tab y Mayús-Tab mantienen el foco dentro del diálogo', async () => {
  const el = root();
  const done = showModal({ title: 'Foco dentro del diálogo', choices: [{ label: 'Primera' }, { label: 'Última' }] });
  await wait(380);
  const buttons = el.lastElementChild.querySelectorAll('button');
  try {
    buttons[0].focus();
    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    assertEq(document.activeElement, buttons[1], 'Mayús-Tab vuelve a la última opción');
    buttons[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    assertEq(document.activeElement, buttons[0], 'Tab vuelve a la primera opción');
  } finally {
    buttons[0].click();
    await done;
    await wait(180);
  }
});

test('DOM: al cerrar se devuelve el foco al control que abrió el diálogo', async () => {
  const el = root();
  const origin = document.createElement('button');
  origin.textContent = 'Abrir diálogo';
  document.body.appendChild(origin);
  origin.focus();
  const done = showModal({ title: 'Devolver el foco' });
  await wait(380);
  el.lastElementChild.querySelector('button').click();
  await done;
  try {
    assertEq(document.activeElement, origin);
  } finally {
    origin.remove();
    await wait(180);
  }
});


test('DOM: solo la apertura de sobaos avisa de falta de producción', () => {
  const s = newGame(42); resolvePending(s, 0); s.cash = 1e7;
  s.unlocked.smash = true;
  s.contracts.push({id:'test', label:'Gran pedido', units:1e6, price:2, months:12});
  const el = document.createElement('div'); el.innerHTML = renderCity(s, 'madrid');
  const item = el.querySelector('[data-type="smash"]').closest('.open-item');
  assert(!item.textContent.includes('solo cubrirá'), 'un restaurante no depende de esos sobaos');
});

test('DOM: las franquicias muestran las dos cuentas y su riesgo antes de firmar', () => {
  const s = newGame(42); resolvePending(s, 0); s.cash = 1e7;
  const el = document.createElement('div'); el.innerHTML = renderCity(s, 'santander');
  const button = el.querySelector('[data-mode="franquicia"]');
  assert(button.closest('.franchise-offer').textContent.includes('Franquiciado:'));
  assert(button.closest('.franchise-offer').textContent.includes('Central:'));
});


test('DOM: I+D y Exterior conservan iconos por innovación y acuerdos', () => {
  const s = newGame(42); resolvePending(s, 0); s.cash = 1e7;
  const el = document.createElement('div'); el.innerHTML = renderResearch(s,{status:'all'})+renderInternational(s);
  const icons = [...el.querySelectorAll('.product img')];
  assertEq(icons.length, PRODUCTS.length);
  assertEq(new Set(icons.map(i => i.getAttribute('src'))).size, PRODUCTS.length);
  assertEq(el.querySelectorAll('.foreign-offer').length, FOREIGN_MARKETS.length);
  assertEq(el.querySelectorAll('[data-act="foreign-sign"]').length, FOREIGN_MARKETS.length*2);
  assert(el.textContent.includes('fabrican ellos'));
});


test('DOM: los acuerdos muestran céntimos en precio y transporte por unidad', () => {
  const s = newGame(42); resolvePending(s,0); s.cash=1e7;
  const el=document.createElement('div');el.innerHTML=renderInternational(s);
  const portugal=el.querySelector('.foreign-offer[data-market="portugal"]');
  assert(portugal.textContent.includes('2,40'), 'precio de venta de 2,40 €/ud');
  assert(portugal.textContent.includes('0,12'), 'el transporte de 0,12 €/ud no se muestra como gratis');
});


test('DOM: Viviendas ofrece construir ambas promociones directamente',()=>{
 const s=newGame(42);resolvePending(s,0);s.cash=1e8;
 const el=document.createElement('div');el.innerHTML=renderResidences(s);
 const button=el.querySelector('[data-act="housing-open"][data-city="selaya"]');
 assert(button&&!button.disabled);assert(button.textContent.includes('Construir'));
 assertEq(el.querySelectorAll('[data-act="housing-open"][data-city="selaya"]').length,2);
 assert(el.textContent.includes('25 apartamentos'));assert(el.textContent.includes('10 chalets'));
});

test('DOM 0.6: el mapa no intenta animar beneficios fuera de España',()=>{
 const view={cityPos:{madrid:{x:1,y:1}},pendingFloaters:[]};
 MapView.prototype.showProfits.call(view,{lines:[{city:'lisboa',revenue:2000,cost:100},{city:'madrid',revenue:4000,cost:100}]});
 assertEq(view.pendingFloaters.length,1);assertEq(view.pendingFloaters[0].city,'madrid');
});

test('DOM: vivienda muestra dos tarifas por ciudad y beneficio asistencial exige residencia',()=>{
 const s=newGame(42);resolvePending(s,0);s.cash=1e8;
 s.businesses.push({id:1,type:'vivienda',city:'madrid',mode:'propia',level:1,value:200000});
 const el=document.createElement('div');el.innerHTML=renderResidences(s);
 assert(el.querySelector('[data-act="housing-policy"][data-city="madrid"][data-group="employee"]'));
 assert(el.querySelector('[data-act="housing-policy"][data-city="madrid"][data-group="public"]'));
 el.innerHTML=renderBenefits(s);assert(el.querySelector('[name="pol-residencia"][value="descuento"]').disabled);
 s.businesses.push({id:2,type:'residencia',city:'madrid',mode:'propia',level:1,value:1e6});
 el.innerHTML=renderBenefits(s);assert(!el.querySelector('[name="pol-residencia"][value="descuento"]').disabled);
});

test('DOM: las obras muestran plazo, bloquean reforma y se entregan con su capacidad',()=>{
 const s=newGame(42);resolvePending(s,0);s.cash=1e8;
 s.businesses.push({id:1,type:'vivienda',housingForm:'apartamentos',city:'selaya',mode:'propia',level:1,value:1e6,readyMonth:12,renewalMonth:192});
 const el=document.createElement('div');el.innerHTML=renderCity(s,'selaya');
 assert(el.textContent.includes('En construcción: quedan 12 meses'));
 assert(el.querySelector('[data-act="upgrade-biz"][data-id="1"]').disabled);
 s.month=12;el.innerHTML=renderResidences(s);assert(el.textContent.includes('25 viviendas disponibles'));
 assert(el.textContent.includes('renovación en 180 meses'));
});

test('DOM: reputación local y etapas de las campanadas son visibles',()=>{
 const s=newGame(42);resolvePending(s,0);
 const el=document.createElement('div');el.innerHTML=renderCity(s,'salamanca');assert(el.querySelector('.local-relations'));assert(el.textContent.includes('Reputación:'));
 el.innerHTML=renderMarketing(s);assert(el.querySelector('.new-year-tradition'));assert(el.textContent.includes('0/4'));assert(el.textContent.includes('patrocinios exitosos'));
});

test('DOM: Mercado centraliza marketing por ciudades y países con presupuesto de lote',()=>{
 const s=newGame(42);resolvePending(s,0);s.cash=1e7;s.businesses.push({id:1,type:'express',city:'madrid',mode:'propia',level:1,value:30000});
 const el=document.createElement('div');el.innerHTML=renderMarketing(s);
 assert(el.querySelector('.marketing-hub'));assertEq(el.querySelectorAll('.marketing-scope').length,3);
 assert(el.querySelector('[data-act="marketing-target"][value="madrid"]').checked);
 assert(el.querySelector('[data-act="campaign-batch"][data-id="buzoneo"]'));assert(el.textContent.includes('Lote:'));
 el.innerHTML=renderMarketing(s,{city:[],international:[]});assert(el.querySelector('[data-act="campaign-batch"][data-id="buzoneo"]').disabled);
});

test('DOM: una selección de marketing no queda bloqueada por territorios que ya no tienes',()=>{
 const s=newGame(42);resolvePending(s,0);s.cash=1e7;s.businesses.push({id:1,type:'express',city:'barcelona',mode:'propia',level:1,value:30000});
 const el=document.createElement('div');el.innerHTML=renderMarketing(s,{city:['madrid','barcelona']});
 assert(!el.querySelector('[data-act="marketing-target"][value="madrid"]'));
 assert(!el.querySelector('[data-act="campaign-batch"][data-id="buzoneo"]').disabled);
});

test('DOM: Mercado ofrece venta online con previsión, envíos desglosados y pausa',()=>{
 const s=newGame(42);resolvePending(s,0);s.cash=1e7;
 const el=document.createElement('div');el.innerHTML=renderOnline(s);assert(el.querySelector('[data-act="online-open"]'));assert(el.textContent.includes('Paquetería a domicilio'));assert(el.textContent.includes('Cambio previsto en resultado total'));
 assert(el.textContent.includes('3,80 €'));assert(el.textContent.includes('6,90 €'));
 s.online={level:1,active:true,shipping:'incluido'};el.innerHTML=renderOnline(s);assert(el.querySelector('[data-act="online-toggle"]'));assert(el.querySelector('[data-act="online-shipping"][value="compartidos"]'));
});

test('DOM: las pantallas de expansión y equipo no siguen mezcladas',async()=>{
 const p=await import('../src/ui/panels.js');const s=newGame(42);resolvePending(s,0);s.cash=1e8;
 const el=document.createElement('div');el.innerHTML=p.renderMarket(s);
 assert(!el.querySelector('.products'));assert(!el.querySelector('.online-channel'));assert(!el.querySelector('.marketing-hub'));
 el.innerHTML=p.renderResearch(s);assert(el.querySelector('.products'));assert(!el.querySelector('.marketing-hub'));
 el.innerHTML=p.renderOnline(s);assert(el.querySelector('.online-channel'));
 el.innerHTML=p.renderMarketing(s);assert(el.querySelector('.marketing-hub'));
 el.innerHTML=p.renderStaff(s);assert(!el.querySelector('.housing-card'));assert(!el.querySelector('[data-act="hire"]'));assert(!el.querySelector('[name="pol-reparto"]'));
 el.innerHTML=p.renderBenefits(s);assert(el.querySelector('[name="pol-reparto"]'));
 el.innerHTML=p.renderResidences(s);assert(el.querySelector('.housing-card'));
});

test('DOM: I+D filtra investigados y producción sin ocultar el proyecto en marcha',async()=>{
 const {renderResearch}=await import('../src/ui/panels.js');const s=newGame(42);resolvePending(s,0);s.products=['relleno'];s.rd={id:'robots_envasado',monthsLeft:2,total:6};
 const el=document.createElement('div');el.innerHTML=renderResearch(s,{status:'pending',category:'production'});
 assert(!el.textContent.includes('Sobao relleno de crema'));assert(el.querySelector('.rd-now'));assert(el.querySelectorAll('.product').length<PRODUCTS.length);
 el.innerHTML=renderResearch(s,{status:'completed',category:'all'});assertEq(el.querySelectorAll('.product').length,1);assert(el.textContent.includes('Sobao relleno de crema'));
});

test('DOM: todas las innovaciones tienen un área y fidelización/congelados se encuentran',()=>{
 const s=newGame(42);resolvePending(s,0);const el=document.createElement('div'),ids=new Set();
 for(const category of ['production','costs','sobaos','business','foreign']){el.innerHTML=renderResearch(s,{status:'all',category});for(const b of el.querySelectorAll('[data-act="rd"]'))ids.add(b.dataset.id);}
 assertEq(ids.size,PRODUCTS.length,'No debe haber proyectos que solo aparezcan en Todas');
 el.innerHTML=renderResearch(s,{status:'all',category:'business'});assert(el.querySelector('[data-id="app"]'));
 el.innerHTML=renderResearch(s,{status:'all',category:'sobaos'});assert(el.querySelector('[data-id="congelados"]'));
});
