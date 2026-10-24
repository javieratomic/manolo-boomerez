import {PRODUCTS} from '../src/data/market.js';
import {FOREIGN_MARKETS} from '../src/data/international.js';
import {MapView} from '../src/render/mapView.js';
// Regresiones del DOM real: se ejecutan en tests/index.html, sin dependencias.
import { test, assert, assertEq } from './runner.js';
import { showModal, isModalOpen } from '../src/ui/dom.js';
import { newGame } from '../src/core/state.js';
import { resolvePending } from '../src/core/sim.js';
import { renderManolo, renderCity, renderEmpire, renderMarket, renderStaff } from '../src/ui/panels.js';

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


test('DOM: Mercado muestra iconos por innovación y los dos acuerdos extranjeros', () => {
  const s = newGame(42); resolvePending(s, 0); s.cash = 1e7;
  const el = document.createElement('div'); el.innerHTML = renderMarket(s);
  const icons = [...el.querySelectorAll('.product img')];
  assertEq(icons.length, PRODUCTS.length);
  assertEq(new Set(icons.map(i => i.getAttribute('src'))).size, PRODUCTS.length);
  assertEq(el.querySelectorAll('.foreign-offer').length, FOREIGN_MARKETS.length);
  assertEq(el.querySelectorAll('[data-act="foreign-sign"]').length, FOREIGN_MARKETS.length*2);
  assert(el.textContent.includes('fabrican ellos'));
});


test('DOM: los acuerdos muestran céntimos en precio y transporte por unidad', () => {
  const s = newGame(42); resolvePending(s,0); s.cash=1e7;
  const el=document.createElement('div');el.innerHTML=renderMarket(s);
  const portugal=el.querySelector('.foreign-offer[data-market="portugal"]');
  assert(portugal.textContent.includes('2,40'), 'precio de venta de 2,40 €/ud');
  assert(portugal.textContent.includes('0,12'), 'el transporte de 0,12 €/ud no se muestra como gratis');
});


test('DOM 0.6: Plantilla ofrece comprar viviendas directamente',()=>{
 const s=newGame(42);resolvePending(s,0);s.cash=1e8;
 const el=document.createElement('div');el.innerHTML=renderStaff(s);
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
 const el=document.createElement('div');el.innerHTML=renderStaff(s);
 assert(el.querySelector('[data-act="housing-policy"][data-city="madrid"][data-group="employee"]'));
 assert(el.querySelector('[data-act="housing-policy"][data-city="madrid"][data-group="public"]'));
 assert(el.querySelector('[name="pol-residencia"][value="descuento"]').disabled);
 s.businesses.push({id:2,type:'residencia',city:'madrid',mode:'propia',level:1,value:1e6});
 el.innerHTML=renderStaff(s);assert(!el.querySelector('[name="pol-residencia"][value="descuento"]').disabled);
});

test('DOM: las obras muestran plazo, bloquean reforma y se entregan con su capacidad',()=>{
 const s=newGame(42);resolvePending(s,0);s.cash=1e8;
 s.businesses.push({id:1,type:'vivienda',housingForm:'apartamentos',city:'selaya',mode:'propia',level:1,value:1e6,readyMonth:12,renewalMonth:192});
 const el=document.createElement('div');el.innerHTML=renderCity(s,'selaya');
 assert(el.textContent.includes('En construcción: quedan 12 meses'));
 assert(el.querySelector('[data-act="upgrade-biz"][data-id="1"]').disabled);
 s.month=12;el.innerHTML=renderStaff(s);assert(el.textContent.includes('25 viviendas disponibles'));
 assert(el.textContent.includes('renovación en 180 meses'));
});
