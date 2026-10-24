# Relevo del agente de código

> **Continuación realizada por Codex el 24-10-2026:** A1–A7 corregidos; B1–B8 reproducidos y corregidos.
> La revisión independiente detectó además la variante B5 de Sanidad encolada tras el enfado, cubierta
> por una regresión. El worktree temporal de la sección D ya está retirado. La decisión de equilibrado
> de la sección E sigue pendiente para la 0.5; no se ha cambiado la economía en esta continuación.
> Las secciones siguientes conservan el diagnóstico original como referencia histórica.

## Validación de la continuación

- 184/184 tests de simulación en Node; 190/190 en `tests/index.html`, incluidos los del DOM real.
- Playwright con Edge, a 1365×900 y 375×812: elecciones rápidas, contador de diálogos, bocadillo,
  edad y continuación en modo infinito comprobados. La promesa se muestra y se puede cerrar el mes.
- Sintaxis de los módulos comprobada. Importación de `src/ui/app.js` en Node con `globalThis.window = {}`
  para proporcionar el global del navegador; sin errores por ciclos de importación.
- Smoke de Electron: mes 1, juego visible, sin errores ni pantalla fatal. Espera a que existan las
  opciones y transcurra la guarda de apertura, en lugar de pulsarlas a tiempo fijo.
- Ejecutable 0.4.0 regenerado con `npm run dist` en `desktop/`:
  `desktop/dist/ManoloBoomerez-0.4.0-portable.exe`.
- El arte se mantiene: 194 terminados, 62 pendientes y 1 bloqueado; `check_assets.py` correcto.
- Worktree temporal retirado sin forzar ni hacer stash. Sin cambios de equilibrado ni push.

### Comprobación de una partida completa

- Partida real en navegador, semilla 3, dificultad normal y Express: final pyme en el mes 96,
  220 diálogos y cero errores JavaScript. Recarga en el mes 24: mismo mes, caja y estado del azar.
- Doce partidas simuladas (semillas 1–12, gestión y decisiones variadas): 1.066 comprobaciones de
  serializar/deserializar, conservando mes, caja, RNG y resultado económico.
- Detectada y corregida la repetición automática de teclas: mantener `1` o Intro podía descartar el
  resultado y seguir eligiendo cartas. Regresión DOM para ambas teclas, resultado y carta siguiente;
  falló antes de la corrección. Revisión independiente sin hallazgos importantes.

### Importaciones y navegación por teclado

- Un JSON con negocio desconocido se aceptaba hasta `startGame`: sustituía la partida abierta y luego
  fallaba al renderizar. `deserialize` comprueba ahora catálogos, estructuras, importes finitos y cuentas
  antes de devolver el estado; la migración rellena las estadísticas ausentes antes de utilizarlas.
- Once casos nuevos de importación: referencias desconocidas, importes/mes inválidos, estructuras
  anidadas rotas y recuperación de estadísticas antiguas. Las doce partidas y sus 1.066 comprobaciones
  siguen cargando correctamente.
- Playwright en móvil (375×812): cuatro archivos dañados conservan la misma partida y el mismo guardado;
  el archivo válido se importa (semilla 7, mes 12), sin errores ni desbordamiento horizontal.
- Tab/Mayús-Tab ya no escapan de los diálogos; al cerrar vuelve el foco al control de origen. Dos
  regresiones de DOM reproducían los fallos antes de corregirlos.

> Para el agente de **código** (Claude u otro). El agente de arte (Codex) puede ignorar este fichero.
> Escrito el 24-10-2026 sobre `main` en `6dd4109`, más el commit que lo añade.

## Dónde estamos

- **Versión 0.4.0 «Cuentas claras»**, en `main`. Lo que trae está en `CHANGELOG.md`.
- Los tres últimos commits de código son:
  - `91543a5`: 30 fallos de la revisión de las piezas 3, 4b, 5 y 6, corregidos.
  - `ae9bd8c`: «Menos ventanas». El resultado de una carta sale en el mismo diálogo, los resultados menores
    van a un aviso, hay teclas `,` `.` y en el móvil se acerca el mapa al tocar dos ciudades juntas.
  - `6dd4109`: final voluntario «Vuelta a Selaya» desde los 61 años.
- **Tests:** 164/164 con `node tests/run-node.mjs`.
- **El `.exe`** (`desktop/dist/ManoloBoomerez-0.4.0-portable.exe`) es anterior a `ae9bd8c`. Hay que generarlo
  de nuevo.
- **Revisión de esos tres commits:** se cortó a medias. Hay 7 fallos confirmados y 8 hallazgos sin verificar,
  y todavía no se ha corregido ninguno. Abajo está todo lo necesario para seguir sin volver a lanzarla.

## Qué falta, por orden

1. Corregir los **7 fallos confirmados** (sección A) y añadir un test de regresión para cada uno en
   `tests/sim.test.js`, junto a los demás «regresión 0.4». Los de la interfaz se comprueban en el navegador.
2. **Verificar** los **8 hallazgos pendientes** (sección B), reproduciéndolos antes de tocar nada, y corregir los
   que se confirmen.
3. Actualizar el recuento de revisiones en `CHANGELOG.md` («14 fallos… y 30…», en «Técnica y calidad»).
4. Comprobaciones: tests, `node --check`, importación de módulos y una partida en el navegador. Después,
   `.exe` y prueba de humo (sección D).
5. Limpieza: quitar el worktree temporal de la medición de equilibrado (sección D).
6. Para la 0.5, una decisión de diseño pendiente sobre equilibrado (sección E).

## A. Fallos confirmados, sin corregir

### A1. Alta · Un doble clic tras un resultado menor elige en la carta siguiente
`src/ui/app.js:821` (`runQueue`), `src/ui/dom.js` (`showModal`).

Si el resultado es menor, `followUp` devuelve `null` y el diálogo se cierra. `runQueue` abre la siguiente carta
en el mismo tick, encima del diálogo que se está cerrando, y esa carta acepta la entrada al instante. Lo mismo
pasa con las teclas: «número + Intro», la costumbre de antes, elige ahora la opción 1 de la carta siguiente, y
en el móvil el segundo toque del doble toque cae en sus botones. Reproducido en el navegador con la cola
`[fondos_europeos, cunado_cripto]`.

**Arreglo propuesto:** guardar `openedAt` en `showModal` e ignorar clics y teclas de elección durante unos
350 ms desde la apertura. Ya existen `lastClose` y `msSinceModal()` para la guarda de 400 ms del Espacio, y se
pueden reutilizar.

### A2. Alta · `close()` se ejecuta dos veces sobre el fondo que se está cerrando
`src/ui/dom.js:64-74`, `styles.css` (`.modal-backdrop.closing`).

`finish()` no se protege contra una segunda llamada. Durante los 160 ms del cierre, el fondo `.closing` sigue
con `pointer-events: auto` y con su escucha de clic. Con un resultado menor, `picked` sigue en `null`, así que
un segundo clic vuelve a llamar a `followUp(i)` y a `resolvePending`. Reproducido en el navegador con dos
efectos:

- Con una carta de repetición rápida (Navidad, racha ≥ 3), el registro guarda «↺ La cesta de Navidad: null» y
  después salta `Cannot read properties of null` en `result.length`.
- En el caso normal, `modalOpen` baja a −1. `isModalOpen()` da `false` con un diálogo abierto, y el Espacio
  cerró el mes por debajo de él.

**Arreglo propuesto:** `if (closed) return; closed = true;` al principio de `finish`/`close`, marcar `picked`
antes de llamar a `followUp`, y añadir `.modal-backdrop.closing { pointer-events: none; }`. A1 y A2 están en el
mismo código y conviene corregirlos juntos.

### A3. Media · Retirarse justo después de salir a Bolsa se salta el bloqueo
`src/core/sim.js:331` (`canRetire`).

`checkEnding` no da el final de la revista mientras dura el bloqueo (`inLockup`), y `canIPO` no deja salir a
Bolsa si el bloqueo no acabaría a tiempo. `canRetire` no comprueba ninguna de las dos cosas. Desde el mes 72 se
puede salir a Bolsa y retirarse en el mismo mes, y la puntuación cuenta la prima de la salida sin promesas ni
juntas. Con el bot, 11 de 16 semillas ganan puntos así; la semilla 3, por ejemplo, pasa de 16 561 a 20 868.

**Arreglo propuesto:** en `canRetire`, `if (inLockup(s)) return { ok: false, msg: … }`, con la fecha de
`lockupEnd(s)` en el mensaje. Las dos están en `src/core/life.js`, y `sim.js` ya importa `inLockup`. El test: `doIPO` y
`retire` en el mismo mes deben fallar.

### A4. Media · El bocadillo de la acción sale en el móvil
`styles.css:165` frente a `styles.css:414`.

`#manolo-bubble.action { display: -webkit-box }` tiene más especificidad que la regla
`@media (max-width: 420px) { #manolo-bubble { display: none } }`. A 375 px el bocadillo tapa unos 287×75 px del
mapa hasta el cierre del mes.

**Arreglo propuesto:** dentro de esa media query, `#manolo-bubble, #manolo-bubble.action { display: none; }`.

### A5. Baja · El bocadillo pasa a una partida nueva del mismo mes
`src/ui/app.js:132` (`startGame`).

`game.bubble` solo se borra en `endMonth`. Si haces la acción en el mes 0 y luego «Reiniciar partida», importas
una partida del mismo mes o vuelves al título y empiezas otra, se ve el texto de la partida anterior.

**Arreglo propuesto:** `game.bubble = null` en `startGame`.

### A6. Baja · La pestaña Manolo dice siempre «55 años»
`src/ui/panels.js:848`.

Desde el mes 72 esa misma pestaña ofrece retirarse «desde los 61».

**Arreglo propuesto:** `${55 + Math.floor(s.month / 12)} años`, manteniendo la broma de «Joven emprendedor».

### A7. Baja · El README dice 45 logros
`README.md:60`.

`ACHIEVEMENTS.length` es 46 desde que existe `final_selaya`.

**Arreglo propuesto:** poner 46. Mejor aún, un test que compare el número del README con
`ACHIEVEMENTS.length`.

## B. Hallazgos sin verificar (revisión de `91543a5`)

Los encontró un agente, pero la verificación adversaria no llegó a ejecutarse. **Reprodúcelos antes de
corregir** (con un script en el scratchpad usando `tests/bot.js` o un estado construido a mano), porque
alguno puede ser falso.

| # | Grav. | Dónde | Qué dice el hallazgo | Arreglo propuesto |
|---|---|---|---|---|
| B1 | alta | `src/ui/app.js:886` | La empresa cotiza, la partida acaba en el mes 96 y el jugador elige el modo infinito. `resumePromises` mete `promesa_trimestre` en `s.pending` cuando `runQueue` ya ha terminado. Nadie la enseña, el botón de cerrar mes queda desactivado y la partida se atasca hasta recargar (semillas 1 y 5 del bot, estrategia smart). | Volver a procesar la cola después de `showEnding`, o que `endMonth` llame a `processQueue` si hay cartas pendientes. |
| B2 | media | `src/core/sim.js:305`, `src/data/eventsVelas.js:209` | La revista espera 4 cierres contados desde el mes 60, aunque `velas_1` aún no haya salido. Las cartas `velas_*` van las últimas en el orden de las forzosas, así que la revista acaba la partida a mitad de «Sesenta velas» (26 de 40 partidas con +20 M€ en el mes 59). | Contar desde que empieza la cadena (o desde la última carta `velas_*`) y dar prioridad a `velas_*` entre las cartas forzosas. |
| B3 | media | `src/core/cartilla.js:247-251` | El enfado y el vencimiento se pueden poner en cola en el mismo cierre. Si eliges «Devolvérselo ya», la carta de vencimiento dice «Me debes 0 €» y la prórroga sigue restando confianza −10 y familia −3. | Al devolverlo todo, quitar `cartilla_vence` de `s.pending`, o que la carta se salte si `!owesMama(s)`. |
| B4 | media | `src/data/eventsSystems.js:256` | `tickIPO` (`sim.js:46`) pone la junta en cola antes de que `tickBolsa` (`sim.js:68`) juzgue la promesa, y la causa se calcula al enseñar la carta. Puede salir «Has fallado la promesa en modo tiburón» tras cumplir una promesa prudente. | Guardar la causa en los `params` de la carta al ponerla en cola. |
| B5 | baja | `src/core/actions.js:129` | El cierre de «Tienes razón, mamá» (`c.firme`) solo está en `setPolicy`. Las elecciones de sucesos que tocan las políticas directamente se lo saltan (margarina en `events.js:1493`, falsos autónomos en `events.js:718`). | `available` que mire `breaksPromise` cuando `c.firme` está activo, o un helper común para cambiar políticas. |
| B6 | baja | `src/data/eventsRemedios.js:127` | `rescue()` ahora conserva las condiciones anteriores, pero los textos siguen diciendo «dos condiciones: ley y mantequilla». | Construir la pista y el resultado con las condiciones que de verdad quedan. |
| B7 | baja | `src/core/execs.js:65` | El heredero se revoca con el divorcio y con Vanessa, pero no cuando se va el directivo elegido como heredero. | En `fireExec`, si `sucesion.heir === 'directivo'` y `execName === e.name`, poner `'nadie'` y dejarlo en el registro. |
| B8 | baja | `src/data/eventsBolsa.js:134` | En «Culpar a Paco» sin gestor, la pista dice «nadie se lo cree», pero el resultado cuenta que Paco apunta algo en una libreta. | Que el resultado dependa de `s.perks.gestor`. |

## C. Descartados por la verificación

Para no volver a abrirlos sin motivo. Los tres primeros son decisiones de diseño discutibles, no fallos:

- **`resultSnapshot` no mira el heredero, los directivos, los negocios, los modificadores ni los pasos de los
  arcos** (`src/core/results.js`). Por eso salen como aviso, no como diálogo, cosas como que Vanessa salga del
  testamento o que se vaya un directivo. Se descartó por ser el criterio que se había fijado, pero **merece
  repensarse**: un resultado duradero quizá debería enseñarse siempre.
- **Retirarse a Selaya con un concurso, una cooperativa o la cárcel pendientes del siguiente cierre.** La
  puntuación no gana nada, pero el tono puede salir «bueno».
- **Tras retirarse, una cláusula cumplida sale como «No cumplida».** Es coherente con los demás finales que no
  cobran la cláusula; a lo sumo, se puede mejorar el texto.
- **`end_selaya` pide a Manolo «sin gafas de sol»**, contra la regla 7 de `art/STYLE_GUIDE.md`. Es una decisión
  narrativa deliberada.
- **El GDD dice «receta del abuelo» y el juego, «de la abuela».** Es una errata del documento, que se puede
  corregir de paso en `docs/GDD.md:145` y en el nombre del test.

## D. Cómo trabajar aquí

```bash
export PATH="/c/Users/MSI/tools/node-v22.23.4-win-x64:$PATH"   # Node portable, no está en el PATH
node tests/run-node.mjs                                         # tests
for f in src/*/*.js; do node --check "$f" || echo "FALLO $f"; done
node -e "import('./src/ui/app.js')"                             # detecta ciclos de importación (TDZ)
node tests/balance.mjs --seeds 96 --only E_legal,E_ctl_mix      # equilibrado
python tools/serve.py 8080                                      # el juego en http://localhost:8080
cd desktop && rm -rf dist/win-unpacked && npm run dist && SMOKE=1 npx electron .
```

- **Navegador:** `window.__boomerez` expone `{ s, tab, city, map, busy }`. En las pruebas con eventos sintéticos
  hay que sustituir `setPointerCapture` por una función vacía y lanzar `keydown` sobre `document.body`, no
  sobre `document`.
- **Equilibrado:** las medianas con 32 semillas varían ±10 % solo por cambiar cuándo salen los sucesos. Compara
  medias con 96 semillas y mide la versión anterior en un worktree aparte. **Nunca `git stash` en el checkout
  principal**, porque ahí vive el arte de Codex que aún no está en commit.
- **Worktree temporal:** la medición dejó uno en el scratchpad de la sesión anterior, en `66b2ef7`. Bórralo con
  `git worktree list` y `git worktree remove --force <ruta>`, o con `git worktree prune` si la carpeta ya no
  existe.
- **Commits:** añade las rutas una a una. No hagas commit del arte ni de `assets/manifest.json` de Codex, y
  revisa `git diff assets/manifest.json` por si hay líneas borradas. Las peticiones de arte nuevas se hacen en
  `tools/art_catalog.py` o en `tools/art_04.py` y se regeneran con `python tools/art_catalog.py`.
- **Contenido:**
  - Textos en español.
  - La opción honrada va la primera en cada carta.
  - Lo que dice un texto al jugador tiene que cuadrar con los números que aplica el código.
  - `GAME_VERSION` cambia las partidas de una semilla. `SAVE_VERSION` es 2, y `migrate()` solo rellena claves
    de primer nivel.

## E. Decisión pendiente para la 0.5

Con 96 semillas, explotar con cuidado vigilando el radar (`E_ctl_mix`) rinde algo más que jugar legal: +8 % en
Express y +1 % en Maison. Se probaron estas palancas, con poco efecto:

- el factor de liquidación `LIQ_K` (1,35 y 1,5);
- el pago inmediato `LIQ_UPFRONT` de 0,5 con un recargo de 0,15;
- la recompensa condicionada del objetivo de los 50 empleados.

Los datos están en `docs/balance_0.4.md`, en la sección «Tras la revisión de las piezas 3 a 6». Queda por
decidir si explotar con cuidado debe compensar un poco (es la sátira) o no.
