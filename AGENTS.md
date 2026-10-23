# AGENTS.md — Instrucciones para agentes

Este repositorio es **Manolo Boomerez S.L.**, un juego de gestión satírico hecho en JavaScript puro (sin
dependencias ni compilación). El código lo mantiene un agente (Claude) y **el arte lo produce otro agente
(Codex)**. Este documento es el contrato entre los dos.

## Si eres el agente de ARTE (Codex)

Tu trabajo es convertir las peticiones de `art/requests/` en imágenes dentro de `assets/`.

### Flujo

1. Lee `art/STYLE_GUIDE.md` (paleta, proyección, reglas técnicas).
2. Abre `assets/manifest.json` y elige recursos con `"status": "requested"`, empezando por la prioridad 1.
3. Lee la ficha del recurso: el campo `request` apunta al fichero y a la sección (`art/requests/03_edificios.md#bld_smash`).
4. Genera la imagen y guárdala **exactamente** en la ruta del campo `file`, con el tamaño `w`×`h`.
5. Cambia el `status` de ese recurso a `"done"` en `assets/manifest.json`. Opcionalmente, añade
   `"notes"` (texto breve) y `"version"` (número que incrementas al rehacer un recurso).
6. Ejecuta `python tools/check_assets.py` y corrige lo que señale (tamaños, ficheros que faltan).
7. Haz commit con un mensaje del tipo `art: bld_smash, bld_empanadas`.

### Reglas

- **Toca solo** `assets/**` (imágenes y `manifest.json`) y, si hace falta, notas en `art/`. **No modifiques**
  `src/`, `tests/`, `index.html` ni `styles.css`.
- **No borres ni renombres** entradas del manifiesto, y no cambies `id`, `file`, `w`, `h` ni `anchor`. Si una
  petición es imposible o ambigua, deja `"status": "blocked"` y explica el motivo en `"notes"`.
- El juego **solo carga** los recursos con `"status": "done"`. Lo que no esté terminado se sustituye por un
  marcador procedural, así que puedes entregar poco a poco.
- Para ver el resultado: `python tools/serve.py 8080 --open` (o `jugar.bat` en Windows). Los marcadores
  que veas en el juego indican la posición y el tamaño que debe ocupar cada imagen.
- Valores posibles de `status`: `requested` → `done` (o `blocked`). Si el agente de código vuelve a pedir
  un recurso ya hecho, lo pondrá en `revise` con una nota: rehazlo y vuelve a marcarlo como `done`.

## Si eres el agente de CÓDIGO

- La fuente de las peticiones de arte es `tools/art_catalog.py`. Para pedir arte nuevo, añade la entrada
  allí y ejecuta `python tools/art_catalog.py`: regenera `art/requests/*.md` y `assets/manifest.json`
  **conservando** el `status`, `notes` y `version` que ya haya puesto el agente de arte.
- Todo id de arte que use el código (`portrait_*`, `bld_*`, `ev_*`, `end_*`, `icon_*`) debe existir en el
  catálogo. `assets.js` genera marcadores para los que falten.
- Además de `tools/art_catalog.py`, el catálogo incorpora las peticiones de `tools/art_events_extra.py` y
  `tools/art_content_extra2.py` (listas `ART`). Las claves extra que añada el agente de arte (`notes`,
  `version`...) se conservan tal cual al regenerar.
- Lógica de juego en `src/core` (sin DOM, testeable) y contenido en `src/data`. Tests:
  `tests/index.html` en el navegador o `node tests/run-node.mjs` (en esta máquina hay un Node portable en
  `C:/Users/MSI/tools/node-v22.23.4-win-x64`).
- Equilibrado: `tests/bot.js` (`playGame(seed, estrategia)`) juega partidas completas; úsalo para medir
  cualquier cambio de economía.
- Escritorio: `desktop/` empaqueta el juego con Electron (`npm run dist` → `.exe` portable).
  `SMOKE=1 npx electron .` lo arranca oculto, juega un mes y sale con código 0 si todo va bien.
- Textos de cara al jugador en **español**.
