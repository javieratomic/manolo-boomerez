// Versión de escritorio: abre el juego en una ventana nativa, sin servidor ni navegador.
const { app, BrowserWindow, protocol, Menu, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const ROOT = path.join(__dirname, 'app');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

// app://game/... sirve los ficheros del juego como si fuera una web (los módulos ES lo necesitan).
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

async function serve(request) {
  let file;
  try {
    file = path.normalize(path.join(ROOT, decodeURIComponent(new URL(request.url).pathname)));
  } catch {
    return new Response('Petición mal formada', { status: 400 });
  }
  const rel = path.relative(ROOT, file);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return new Response('Prohibido', { status: 403 });
  try {
    const body = await fs.readFile(file);
    return new Response(body, { headers: { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' } });
  } catch {
    return new Response('No encontrado', { status: 404 });
  }
}

// SMOKE=1: abre el juego oculto, comprueba que arranca y que se puede empezar una partida, y sale.
const SMOKE = process.env.SMOKE === '1';
// La prueba usa un perfil temporal: empieza limpia y no toca las partidas guardadas de verdad.
if (SMOKE) app.setPath('userData', path.join(require('node:os').tmpdir(), `boomerez-smoke-${process.pid}`));

async function smokeTest(win) {
  const errors = [];
  win.webContents.on('console-message', (...args) => {
    // Electron cambió la firma del evento entre versiones: se aceptan las dos.
    const e = args[0];
    const level = e?.level ?? args[1];
    const message = e?.message ?? args[2];
    if (level === 'error' || level === 3) errors.push(message);
  });
  win.webContents.on('did-fail-load', (_e, code, desc, url) => errors.push(`did-fail-load ${code} ${desc} ${url}`));
  await new Promise((r) => win.webContents.once('did-finish-load', r));
  const result = await win.webContents.executeJavaScript(`(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    // Espera a que el título esté listo (carga del manifiesto de arte incluida).
    for (let i = 0; i < 50 && !document.getElementById('title-portrait').getAttribute('src'); i++) await sleep(100);
    await sleep(300);
    document.getElementById('btn-new').click();
    const pick = async (i) => {
      const buttons = () => document.querySelectorAll('#modal-root .modal-backdrop:not(.closing) button.choice');
      for (let n = 0; n < 100 && !buttons().length; n++) await sleep(50);
      // Cada diálogo protege su apertura frente a pulsaciones arrastradas.
      await sleep(450);
      const button = buttons()[i];
      if (!button) throw new Error('Falta la opción ' + i + ' en el smoke test');
      button.click();
    };
    await pick(1); // dificultad normal
    await pick(0); // marca Express
    await pick(0); // resultado de la herencia
    await sleep(200);
    document.getElementById('end-month').click();
    await sleep(800);
    return {
      title: document.title,
      month: window.__boomerez?.s?.month,
      booted: typeof window.__boomerez,
      gameVisible: !document.getElementById('game').hidden,
      modal: document.querySelector('#modal-root h2')?.textContent || null,
      fatal: document.querySelector('.fatal')?.textContent || null,
    };
  })()`);
  console.log(JSON.stringify({ ...result, errors }));
  app.exit(result.month >= 1 && !result.fatal && !errors.length ? 0 : 1);
}

function createWindow() {
  const win = new BrowserWindow({
    show: !SMOKE,
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'Manolo Boomerez S.L.',
    backgroundColor: '#f6ecd9',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  if (SMOKE) smokeTest(win);
  win.loadURL('app://game/index.html');
  // La ventana nunca sale del juego; los enlaces externos se abren en el navegador del sistema.
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://game/')) {
      event.preventDefault();
      if (/^https?:/.test(url)) shell.openExternal(url);
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  // F11: pantalla completa.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  protocol.handle('app', serve);
  Menu.setApplicationMenu(null);
  createWindow();
});

app.on('window-all-closed', () => app.quit());
