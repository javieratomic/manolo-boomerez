// Regresiones del DOM real: se ejecutan en tests/index.html, sin dependencias.
import { test, assert, assertEq } from './runner.js';
import { showModal, isModalOpen } from '../src/ui/dom.js';
import { newGame } from '../src/core/state.js';
import { resolvePending } from '../src/core/sim.js';
import { renderManolo } from '../src/ui/panels.js';

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
