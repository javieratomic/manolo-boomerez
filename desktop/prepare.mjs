// Copia el juego (la web estática) dentro de desktop/app para empaquetarlo con Electron.
import { cp, rm, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const game = path.resolve(here, '..');
const out = path.join(here, 'app');

const ENTRIES = ['index.html', 'styles.css', 'manifest.webmanifest', 'icon.svg', 'src', 'assets'];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const entry of ENTRIES) {
  await cp(path.join(game, entry), path.join(out, entry), { recursive: true });
}

// Icono del ejecutable: electron-builder usa build/icon.png si existe (el arte lo entrega el agente de arte).
const icon = path.join(game, 'assets', 'ui', 'app_icon_512.png');
await rm(path.join(here, 'build'), { recursive: true, force: true });
if (existsSync(icon)) {
  await mkdir(path.join(here, 'build'), { recursive: true });
  await cp(icon, path.join(here, 'build', 'icon.png'));
}

// Comprobación del arte: el juego solo carga lo marcado como terminado (el resto, con marcadores).
const manifest = JSON.parse(await readFile(path.join(game, 'assets', 'manifest.json'), 'utf8'));
const done = manifest.assets.filter((a) => a.status === 'done').length;
const missing = manifest.assets.filter((a) => a.status === 'done' && !existsSync(path.join(game, a.file)));
if (missing.length) console.warn(`Aviso: ${missing.length} recursos marcados como terminados no existen.`);
console.log(`Juego copiado en ${out} (${done} recursos de arte terminados).`);
