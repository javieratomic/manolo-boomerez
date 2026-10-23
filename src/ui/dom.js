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
export const isModalOpen = () => modalOpen > 0;

/**
 * Muestra un modal y resuelve con el índice de la opción elegida.
 * opts: { title, kicker?, image?, portrait?, html?, text?, choices: [{label, hint?, primary?, danger?}], wide?, dismissable? }
 */
export function showModal(opts) {
  return new Promise((resolve) => {
    const root = $('#modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    const choices = opts.choices?.length ? opts.choices : [{ label: 'Continuar', primary: true }];
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
          <div class="modal-choices">
            ${choices
              .map(
                (c, i) => `<button class="choice ${c.primary ? 'primary' : ''} ${c.danger ? 'danger' : ''}" data-i="${i}">
                  <span class="choice-key">${i + 1}</span>
                  <span class="choice-text"><strong>${esc(c.label)}</strong>${c.hint ? `<small>${esc(c.hint)}</small>` : ''}</span>
                </button>`,
              )
              .join('')}
          </div>
        </div>
      </div>`;
    modalOpen++;
    const close = (i) => {
      document.removeEventListener('keydown', onKey, true);
      wrap.classList.add('closing');
      setTimeout(() => wrap.remove(), 160);
      modalOpen--;
      resolve(i);
    };
    const onKey = (e) => {
      if (wrap !== root.lastElementChild) return;
      const n = parseInt(e.key, 10);
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

export function toast(text, tone = 'info') {
  const root = $('#toast-root');
  const el = document.createElement('div');
  el.className = `toast ${tone}`;
  el.textContent = text;
  root.appendChild(el);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3000);
}

export async function confirmModal(title, text, yes = 'Sí', no = 'Cancelar') {
  const i = await showModal({ title, text, choices: [{ label: yes, primary: true }, { label: no }], dismissable: true });
  return i === 0;
}
