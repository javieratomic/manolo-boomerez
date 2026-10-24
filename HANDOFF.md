# Continuación 0.10.0 — Central de marketing (25-10-2026)

Petición completa implementada:
- Catálogo de 22 campañas: ocho locales, ocho nacionales y seis internacionales. Se conservan los seis ids anteriores. Nuevas opciones de buscadores, redes, degustaciones, hoteles/oficinas, puertas abiertas, podcasts, prensa, liga, regalos de Navidad y promoción exterior.
- Mercado empieza con Central de marketing: ciudades/países, todos/ninguno, selección múltiple, coste total y revisión antes de contratar. Campañas activas y destinos sin negocios afines se omiten; duplicados se deduplican. Fondos insuficientes o destinos inválidos bloquean el lote sin cobros parciales. Contratación local individual desde Ciudad preservada.
- Ámbito correcto: nacional afecta España; local una ciudad; internacional un país con locales/franquicias operativos o acuerdos activos sin conflicto. Obras no habilitan campañas. El país se cuenta una vez aunque tenga varios locales y un socio. Alimentación/hostelería se filtran cuando corresponde.
- Marca blanca: publicidad exterior aumenta pedidos, fabricación, materias y transporte según suministro real. Licencia: aumenta regalías sin consumir producción. Bonificaciones de Marketing aplicadas una sola vez y campañas caducan con los modificadores existentes.
- Núcleo en `core/marketing.js`, reexportado desde `core/market.js`. Planificación pura, mismos efectos individuales y en lote, validación de ámbito al cargar; campañas antiguas sin `scope` se interpretan por catálogo. UI normaliza selección tras vender locales o vencer contratos; núcleo sigue rechazando ids inválidos.

Verificación final: **261/261 Node y 17/17 DOM**, sintaxis correcta. Edge 1365×900 y 375×812: cinco ciudades con una campaña previa (lote cobra 10.000 € por las otras cuatro), tres países (120.000 €, Portugal con dos locales cuenta una vez), todos/ninguno/selección, confirmación y recarga; sin errores/desbordamiento. Simulación de 96 meses con caja/capacidad altas: 48 lotes, 2.272.000 € gastados, 96 cargas mantienen economía y RNG, sin campañas duplicadas ni final inesperado. Revisión independiente detectó selección invisible obsoleta, corregida con regresión DOM roja/verde; cierre sin nuevos hallazgos importantes.

Build y smoke desempaquetado correctos. Portable: `desktop/dist/ManoloBoomerez-0.10.0-portable.exe`. Sin push ni cierre del juego del usuario. Plan: `docs/superpowers/plans/2026-10-25-marketing-territorial.md`.

---

# Continuación 0.9.0 — Fiestas con memoria (25-10-2026)

Petición completa implementada, con equilibrio delegado:
- Las24cartas locales se decoran con memoria de elección/resultado/confianza y peso según reputación. Buenas colaboraciones previas aportan hasta10% local durante un mes; repetir conducta conflictiva resta reputación adicional. Historial visible en Ciudad.
- Ninot de Fallas y concurso de patios: una oportunidad por partida, sin forzar todos los años. Fiestas recurrentes: Pamplona, Sevilla, Zaragoza, Las Palmas, Murcia y Salamanca, con memoria anual. Se corrigió el desfase cola/resolución que bloqueaba el año siguiente; si coinciden dos fiestas, se encolan ambas.
- Nochevieja conserva `ciudad_salamanca` y arte anterior. Cuatro patrocinios exitosos en años distintos: Salamanca→universidades de Castilla y León→campaña nacional→tradición. Costes3k/12k/45k/100k; reputación40/50/60/70, moral35, suministro reciente y previsto≥90% incluyendo bonus de demanda. Fracasar pierde inversión sin ascenso. Duplicar edición no cobra, progresa ni suma memoria.
- Tradición: +15% de demanda de sobaos españoles cada diciembre, permanente incluso sin renovar patrocinio; con reputación<30 se reduce a7,5%. No afecta extranjero, otros meses ni otros negocios. Etapa2 beneficia región y etapa3 campaña nacional solo en el diciembre patrocinado. Progreso visible en Mercado.
- Nuevo `localEvents` validado/migrado; no inventa éxitos de partidas anteriores, y las historias puntuales antiguas ya vistas no vuelven a ofrecerse. La memoria sobrevive en la empresa y usa también el sistema de costumbres existente. Negocios en obras no reciben ofertas locales.

Verificación final: **252/252 Node y15/15 DOM**, sintaxis correcta. Edge1365×900 y375×812: cuatro patrocinios mediante botones reales, tradición4/4, bonus España1,15/extranjero1/otrosmeses1, recarga y progreso conservado; sin errores/desbordamiento. Simulación de72meses con caja/capacidad altas para aislar progresión y rechazo de venta del local de Salamanca: niveles1/2/3/4 en meses11/23/35/47 y mantenimiento después,72cargas conservan neto/RNG. Revisión independiente detectó clasificación incorrecta de opciones positivas (Murcia/Las Palmas), reproducida y corregida; cierre sin nuevos hallazgos importantes.

Build y smoke de desempaquetado correctos. Portable: `desktop/dist/ManoloBoomerez-0.9.0-portable.exe`. Sin push ni cierre del juego del usuario. Plan: `docs/superpowers/plans/2026-10-25-fiestas-con-memoria.md`.

---

# Continuación 0.8.0 — Promociones y obras (25-10-2026)

Petición completa implementada, con equilibrio delegado por el usuario:
- `vivienda` conserva id y añade `housingForm`: apartamentos (25, coste base2M€, mantenimiento100€/mes, moral+1) o chalets (10,3M€,200€/mes,moral+3,rentas×1,5). Nuevas promociones mantienen unidades fijas; reformas mejoran renta. Antiguas: legacy y capacidad histórica por niveles.
- Turismo sube a1,2M€ base y baja mantenimiento a200€/mes. Viviendas/turísticos no pagan además el mantenimiento porcentual genérico.
- `readyMonth`: viviendas y turismo12meses; obradores regionales y Telecom6. Obras sin ingresos, personal, oferta laboral, producción, descuento de transporte ni bonus Telecom hasta entrega; se mantiene su inversión patrimonial. Reformas bloqueadas durante obras. La meta europea solo cuenta sectores/países entregados.
- `renewalMonth`:180meses desde entrega, renovación automática del20% del coste de reposición local. En economía/informe, cobro una sola vez por simulación y previsión; restauración de condición y siguiente plazo. Inmuebles previos conservan actividad/capacidad, con primera renovación180meses desde migración. OPA compra edificios ya terminados, con renovación programada.
- Ciudad/Plantilla: ambos proyectos, precios y mantenimiento, moral, tiempo de entrega y renovación estimada; parte mensual avisa renovación12meses antes y entregas próximas. Tarifas base por vivienda y multiplicador de chalet explicados.
- Nuevo sprite `bld_urbanizacion`, diez chalets,256×256 transparente,79.792bytes. Catálogo198done/62requested/1blocked. Commit arte `18a1950`.

Verificación final: **243/243 Node y14/14 DOM**. Edge1365×900 y375×812: botones de ambas promociones, recarga, mes6 con0viviendas y mes12 con35, tarifas y sprite, sin errores/desbordamiento. Tres simulaciones de240meses con caja alta para aislar ciclo inmobiliario:720guardados/cargas conservan neto y RNG,6renovaciones cobradas, sin final inesperado. Sintaxis y checker de arte correctos. Revisión independiente, dos fallos prematuros de Airbnb detectados y corregidos con regresión; cierre sin hallazgos importantes. Build, smoke desempaquetado y portable0.8.0 correctos.

Ejecutable: `desktop/dist/ManoloBoomerez-0.8.0-portable.exe`. Sin push ni cierre del juego abierto del usuario. Plan/registro: `docs/superpowers/plans/2026-10-24-construccion-inmuebles.md`. Las pruebas históricas ajenas a plazos usan fixtures de edificios ya entregados; las nuevas y la simulación usan construcción real. Dos presupuestos de tests se ajustaron a precios nuevos.

---

# Continuación 0.7.0 — Sinergias y alquileres (24-10-2026)

Implementada la petición completa, con detalles de equilibrio delegados por el usuario:
- IPO: valoración de empresa mínima 1.000 M€, además de antigüedad/reputación/bloqueo; no se deslistan partidas ya cotizadas.
- Academy/coworking: +15 % mutuo en la misma ciudad. Gimnasio: hasta +35 % por volumen real local de sobaos del mes anterior (`citySobaoSales`), excluyendo mayorista/exportación y pedidos no servidos.
- Empanadas solo al asociarse con Rodrigo, que cobra el 10 % existente de ventas; primer local propio −30 % una sola vez (`empanadaFirstUsed`), incluso al vender/cargar. La OPA tampoco elude el pacto; locales antiguos conservados.
- Viviendas: plantilla local prioritaria, público en plazas libres con demanda compartida limitada. `housingPolicies[city]` separa tarifas employee/public; factor local de alquiler. Solo empleados dan control. Se gestiona al principio de Plantilla y se guarda automáticamente.
- Beneficio de residencia: 20 % de descuento a familiares de empleados locales, hasta una plaza entera por diez empleados, limitada a ocupación real. Menor ingreso, mismo coste de atención y moral proporcional. Sin residencia no se puede activar.
- Las tarifas locales afectan inspecciones, prensa y caldera; viviendas solo públicas no imputan alquiler abusivo a empleados inexistentes. Retratos corregidos de 0.6 conservados y migrados.

Verificación: **235/235 Node y 13/13 DOM**, sintaxis correcta, Edge 1365×900 y 375×812 sin errores/desbordamiento, cambio de ambas tarifas, beneficio, recarga, sinergias e IPO bloqueada. Tres partidas de 120 meses y 360 guardados/cargas conservando economía y RNG. Revisión independiente con hallazgos corregidos y cierre sin nuevos importantes. Build y smoke desempaquetado correctos; portable `desktop/dist/ManoloBoomerez-0.7.0-portable.exe` generado. Sin push.

Plan y registro: `docs/superpowers/plans/2026-10-24-sinergias-alquileres.md`. Se hizo determinista la llegada de la inspección en una prueba histórica del bot: el nuevo equilibrio desplazaba su calendario, no fallaba la liquidación. La prueba mantiene deuda real positiva y cobro real.

---

# Corrección de retratos (24-10-2026)

Los candidatos ya no mezclan nombres y retratos: el catálogo distingue los grupos de retratos, y Kevin, Jonathan y Merche usan su recurso propio. La carga repara candidatos y directivos de partidas anteriores de forma estable y sin consumir RNG. Dos regresiones cubren todos los nombres y la migración. Se conserva la versión 0.6.0.

Validación: 223/223 Node, 12/12 DOM, carga real de los cuatro casos indicados sin errores y smoke del desempaquetado correcto. El portable original estaba abierto por el usuario: la entrega corregida se guarda como `desktop/dist/ManoloBoomerez-0.6.0-retratos-portable.exe`.

# Continuación 0.6.0 — Un imperio heredable (24-10-2026)

El usuario delega implementación y equilibrio por entregas. Terminado:
- Viviendas: primer bloque de Plantilla, botón de compra por ciudad, nombre inequívoco y migración de desbloqueo al cargar. Cada plaza aumenta la oferta laboral; las grandes ampliaciones y plantillas requieren vivienda. La actividad baja si se venden plazas necesarias.
- Diez niveles por negocio (también obradores regionales), más locales y menor saturación en grandes ciudades. Academy escala con fama y red empresarial.
- 35 I+D con iconos SVG: capacidad, automatización, energía, compras, rutas, estructura, despliegue exterior y licencias de tres sectores nuevos.
- Banca, telecomunicaciones y logística: datos, costes, ingresos, desbloqueos y sprites PNG generados/inspeccionados; sin repetir costes de materias ni personal.
- Diez mercados de acuerdos y 16 ciudades europeas propias. Seis meses de marca blanca con suministro ≥90 % por país más I+D permiten entrar; licencia no cuenta. Acceso desde Mercado y selector; el mapa conserva España y filtra sus animaciones exteriores.
- Campaña europea predeterminada: sin corte en 96 meses ni 15 M€; meta 1.000 M€, ocho países y tres sectores estratégicos. Reto semanal y tests históricos conservan campaña clásica explícita.
- Dinastía: estrés ≥90 durante tres meses trae riesgo mortal, reposo protege, relevo al cumplir 80 y retirada voluntaria desde 60. Conserva empresa/caja/deuda/contratos/I+D y calendario; cambia dirigente y edad. Los familiares también envejecen antes de heredar.

Validación final: **221/221 Node y 12/12 DOM**. Edge 1365×900 y 375×812: compra vivienda desde Plantilla, ampliaciones, nivel 10, tres Express en Madrid, tres sectores, Lisboa, relevo al mes 300 y recarga; 35 iconos cargados, cero errores o desbordamiento. Prueba de 1.000 meses con presupuesto alto para aislar continuidad: dos relevos, sin final ni pérdida de guardado. Revisión independiente, cuatro errores reproducidos y corregidos; segunda revisión sin hallazgos importantes. Compilación, smoke del desempaquetado y del portable 0.6 correctos.

Arte: 197 done, 62 requested, 1 blocked. Nuevos `bld_banco`, `bld_telecom`, `bld_logistica` en 256×256, transparencia y ancla (128,240), todos <80 KB. `check_assets.py` correcto. Ejecutable: `desktop/dist/ManoloBoomerez-0.6.0-portable.exe`. Sin push.

Plan: `docs/superpowers/plans/2026-10-24-imperio-europeo.md`. Los apartados anteriores de abajo se conservan como historial. No reabrir diagnósticos corregidos de 0.4/0.5.

---

# Continuación 0.5.0 — De Selaya al mundo (24-10-2026)

El usuario ha autorizado código y equilibrio por entregas. Implementado: ampliaciones industriales sin tope de niveles (coste creciente), precios locales de apertura, bonus de cortesía con excedentes reales, vivienda y plantilla local desde el inicio, 24 innovaciones con SVG propios, contratos exteriores en seis países (marca blanca/licencia, auditoría, disputas, rescisión y vencimiento) y 50 capitales provinciales más Ceuta/Melilla. Se mantienen Selaya, Marbella e Ibiza: 55 destinos.

Franquicias: no se confirmó una quiebra con beneficio del franquiciado. El problema era confundir el resultado de la central con el de su dueño; ahora se muestran ambos antes de firmar y en el informe. Regresiones para cuatro meses positivos/negativos.

Validación: 202/202 pruebas Node, 10/10 DOM en navegador; flujo real de firma, rescisión, conflicto, recarga y viaje a Tenerife en Edge 1365×900 y 375×812, sin errores ni desbordamiento. Doce partidas simuladas, 1.111 guardados/cargas conservando cifras y RNG. Revisión independiente sin fallos importantes. Iconos SVG de interfaz (24) decodificados e inspeccionados; el catálogo PNG conserva 194 done, 62 requested, 1 blocked. `check_assets.py` correcto.

Ejecutable: `desktop/dist/ManoloBoomerez-0.5.0-portable.exe`. No hay push. Plan y decisiones: `docs/superpowers/plans/2026-10-24-expansion.md`. Las partidas 0.4 se migran a reglas 0.5 conservando su versión original. Los importes de las ciudades son índices de juego, no precios inmobiliarios reales.

La sección E histórica de abajo describía una decisión de equilibrio de la 0.4; no se ha aplicado su aumento porcentual general de Express/Maison. Los nuevos precios y sistemas sí cambian la economía de la 0.5.

---

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
