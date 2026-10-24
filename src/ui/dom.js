// Utilidades de DOM: escape, modales y avisos.
import { imageUrl } from '../render/assets.js';

export const $ = (sel, root = document) => root.querySelector(sel);

export function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const paragraphs = (text) =>
  esc(text)
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

let modalOpen = 0;
let lastClose = -Infinity;
export const isModalOpen = () => modalOpen > 0;
// Para no cerrar el mes con la misma pulsación que cierra un diálogo.
export const msSinceModal = () => performance.now() - lastClose;

const choiceButtons = (choices) =>
  choices
    .map(
      (c, i) => `<button class="choice ${c.primary ? 'primary' : ''} ${c.danger ? 'danger' : ''}" data-i="${i}">
        <span class="choice-key">${i + 1}</span>
        <span class="choice-text"><strong>${esc(c.label)}</strong>${c.hint ? `<small>${esc(c.hint)}</small>` : ''}</span>
      </button>`,
    )
    .join('');

/**
 * Muestra un modal y resuelve con el índice de la opción elegida.
 * opts: { title, kicker?, image?, portrait?, html?, text?, choices: [{label, hint?, primary?, danger?}], wide?, dismissable?, followUp? }
 * `followUp(i)`: al elegir, devuelve `{ text }` para enseñar el resultado en el mismo diálogo (con un
 * «Continuar») o nada para cerrarlo ya. La promesa se resuelve con la opción elegida.
 */
export function showModal(opts) {
  return new Promise((resolve) => {
    const root = $('#modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    let choices = opts.choices?.length ? opts.choices : [{ label: 'Continuar', primary: true }];
    let picked = null;
    let closed = false;
    let openedAt = performance.now();
    wrap.innerHTML = `
      <div class="modal ${opts.wide ? 'wide' : ''} ${opts.className || ''}" role="dialog" aria-modal="true" aria-label="${esc(opts.title)}">
        ${opts.image ? `<div class="modal-image"><img src="${imageUrl(opts.image)}" alt=""></div>` : ''}
        <div class="modal-content">
          <div class="modal-head">
            ${opts.portrait ? `<img class="modal-portrait" src="${imageUrl(opts.portrait)}" alt="">` : ''}
            <div>
              ${opts.kicker ? `<div class="kicker">${esc(opts.kicker)}</div>` : ''}
              <h2>${esc(opts.title)}</h2>
            </div>
          </div>
          <div class="modal-body">${opts.html ?? paragraphs(opts.text || '')}</div>
          <div class="modal-choices">${choiceButtons(choices)}</div>
        </div>
      </div>`;
    modalOpen++;
    const finish = (i) => {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey, true);
      wrap.classList.add('closing');
      setTimeout(() => wrap.remove(), 160);
      modalOpen--;
      lastClose = performance.now();
      resolve(i);
    };
    const close = (i) => {
      if (closed || performance.now() - openedAt < 350) return;
      if (picked != null) return finish(picked);
      picked = i;
      const res = opts.followUp && i >= 0 ? opts.followUp(i) : null;
      if (!res?.text) return finish(i);
      // El resultado sustituye al texto y a las opciones, sin otro fondo ni otra animación.
      openedAt = performance.now();
      choices = [{ label: 'Continuar', primary: true }];
      const kicker = wrap.querySelector('.kicker');
      if (kicker) kicker.textContent = 'Resultado';
      const body = wrap.querySelector('.modal-body');
      body.setAttribute('aria-live', 'polite');
      body.innerHTML = `<p class="picked">${esc(opts.choices[i]?.label ?? '')}</p>${paragraphs(res.text)}`;
      body.scrollTop = 0;
      wrap.querySelector('.modal-choices').innerHTML = choiceButtons(choices);
      wrap.querySelector('.modal-content')?.scrollTo?.(0, 0);
      wrap.querySelector('button.choice')?.focus({ preventScroll: true });
    };
    const onKey = (e) => {
      if (wrap !== root.lastElementChild) return;
      const n = parseInt(e.key, 10);
      // Una tecla mantenida puede seguir repitiéndose tras cambiar de resultado o de carta.
      if (e.repeat && ((n >= 1 && n <= choices.length) || e.key === 'Enter' || e.key === 'Escape')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (n >= 1 && n <= choices.length) {
        e.preventDefault();
        e.stopPropagation();
        close(n - 1);
      } else if (e.key === 'Escape' && opts.dismissable) {
        e.stopPropagation();
        close(-1);
      } else if (e.key === 'Enter' && choices.length === 1) {
        e.preventDefault();
        e.stopPropagation();
        close(0);
      }
    };
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('button.choice');
      if (b) close(Number(b.dataset.i));
      else if (e.target === wrap && opts.dismissable) close(-1);
    });
    document.addEventListener('keydown', onKey, true);
    root.appendChild(wrap);
    requestAnimationFrame(() => wrap.querySelector('button.choice')?.focus({ preventScroll: true }));
  });
}

export function toast(text, tone = 'info', ms = 2600) {
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = `toast ${tone}`;
  el.textContent = text;
  el.addEventListener('click', () => el.remove()); // un toque lo cierra
  root.appendChild(el);
  setTimeout(() => el.classList.add('out'), ms);
  setTimeout(() => el.remove(), ms + 400);
}

export async function confirmModal(title, text, yes = 'Sí', no = 'Cancelar') {
  const i = await showModal({ title, text, choices: [{ label: yes, primary: true }, { label: no }], dismissable: true });
  return i === 0;
}
