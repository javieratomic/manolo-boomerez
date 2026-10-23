import { boot } from './ui/app.js';

boot().catch((err) => {
  console.error(err);
  document.body.insertAdjacentHTML('beforeend', `<pre class="fatal">Error al arrancar: ${String(err?.message || err)}</pre>`);
});
