# Estado para el siguiente agente (04-11-2026)

- Versión actual: **0.21.1**, Offline fiable desde primera preparación (Codex). Anterior: 0.21.0 `7ae47cd` (Codex).
- Última validación: **341/341 simulación +14/14 worker Node +56/56 DOM =411 pruebas**. Nueva pasada de 19.507 meses
  de `tests/fuzz.mjs` sin fallos de invariantes, además de las pasadas históricas.
- Portable actual: `desktop/dist/ManoloBoomerez-0.21.1-portable.exe`. Los ejecutables de `desktop/dist/` son
  artefactos ignorados por Git y se conservan.

# Continuación autónoma de cuatro horas (04-11-2026)

Usuario autorizó revisar y mejorar por entregas con be-ambitious durante cuatro horas. Inicio comprobado: 11:45 UTC; **límite 04-11-2026 15:45 UTC /16:45 Europe/Madrid**. Automatización de continuación creada: `revisi-n-de-manolo-boomerez-cuatro-horas`, cada diez minutos. Al vencer, no iniciar trabajo y desactivarla; informar entregas/pendientes. No reactivar la antigua vigilancia de arte. Código autorizado por la conversación; decisiones delegadas. Sin push, perfiles reales ni mensajes a otros chats.

## Entrega 0.21.1 — Offline fiable

- Reproducción confirmada: primera visita/registro del worker antiguo no almacenaba código (caché0); offline recarga fallaba. Una segunda visita online sí dejaba290entradas y permitía jugar. Corregido con copia completa verificada antes de activar, sin retrasar boot online.
- **Portada HTTPS:** Preparando / Juego disponible sin conexión / Actualización preparada para reabrir / No se pudo preparar. Servicio desactivado en localhost y app:// como antes. No cambia guardados ni economía.
- `tools/offline_catalog.mjs` genera `offline-files.js`:145archivos de código/HTML/CSS/iconosSVG,~1MiB. Hashes SHA256 canónicos CRLF/BOM. **Tras editar código web ejecutar `node tools/offline_catalog.mjs` antes de validar/publicar**. El runner Node comprueba vigencia y ejecuta pruebas del worker; desktop/prepare.mjs lo regenera. Web sigue sin dependencias ni compilación.
- Worker importa catálogo; código de revisión cache-first, install atómico con hashes, fallos conservan copia anterior; limpieza solo de su prefijo/directorio. Arte/manifest PNG independientes, red primero y respaldo con waitUntil; lee arte legacy boomerez-v1 por URL exacto sin borrar esa caché compartida. Imágenes no descargadas usan marcadores; no se precargan36,65MB por instalar offline.
- `src/ui/offline.js` verifica preparación por MessageChannel, observa controllerchange y updatefound, distingue instalada/en espera de activada. No await de skipWaiting dentro de install tras cache completa, para no acoplar fin de instalación a transición anterior. Regresiones de recuperación, corrupción y migración de worker/arte legacy verificadas.

Validación:341/341simulación+14/14workerNode+56/56DOM. Edge nuevo1365/375/320: primera preparación457–626ms local, desconectar, index con query, continuar, Finanzas, I+D, cerrar mes con caja exacta y recargar mes1. Sin excepciones JS/desbordamiento; capturas inspeccionadas. Arte no disponible produce fallos de recurso esperados y marcadores (no errores de lógica). Servidor local en memoria: publicaciónB fallida mantieneA offline, Bbuena actualiza solo catálogo importado, cash1234567 conservada, subdirectorio, cachés de otra ruta/app intactas y arte nuevo independiente. Migración desde worker original preserva arte legacy al reabrir. Fuentes108archivos idénticas en build, dependencias intactas; build y ambos smoke ocultos salida0. Migración de partida0.21→0.21.1 conserva caja/mes/patrimonio/neto/RNG.

Revisión independiente sin bloqueantes; **pendiente menor P3:** tras una actualización fallida, aviso conservador puede mostrar no disponible aunque quede la copia anterior; no afecta a integridad ni capacidad de volver a ella. No es motivo para repetir este lote. Plan/registro `docs/superpowers/plans/2026-11-04-offline-fiable.md`; scripts `%TEMP%/boomerez0211-*`, pruebasunitarias enrepo. No quedan otros arreglos abiertos.

Nota de QA: este Playwright no espera predicados async en waitForFunction (async false se tomó truthy). Usar predicado síncrono/eventos o esperar page.evaluate desde Node; no sondear continuamente OFFLINE_STATUS durante actualización porque mantiene ocupado el worker anterior. Instrumentación de diagnóstico retirada y recorridos finales completos verdes.

**Siguiente ejecución:** continuar revisión basada en evidencia dentro del plazo, priorizando integridad/flujos reales de gestión; no añadir funciones por llenar tiempo ni repetir campañas/worker ya verificados. Si falta poco tiempo, reservarlo para cierre y desactivación. Entregas de esta autorización hasta ahora:0.20.0,0.21.0,0.21.1, commits locales propios, sin push.

## Entrega 0.21.0 — Evaluar investigación

- **Expansión → I+D → Evaluar** abre un estudio de solo lectura para proyectos pendientes, bloqueados y en curso. Compara resultado neto, capacidad efectiva, cobertura y plantilla del imperio actual con la innovación terminada hoy. No pronostica el mes de entrega ni completa obras/otras I+D. Usa tickRD/computeEconomy/workforcePlan reales sobre copia.
- Muestra cambios de plantilla necesaria/oferta/viviendas faltantes por ciudad. Cuantifica cuándo una ampliación tecnológica deja capacidad sin aprovechar por falta de vivienda. Desbloquear banca/telecom/logística se explica sin inventar locales ni ingresos. Coste único separado de mensualidad; proyecto activo ya pagado tiene coste pendiente0 y conserva monthsLeft.
- `core/research.js` researchPlan puro; `ui/research.js` renderer; app guardia anti modales duplicados, cierre restaura filtro/foco y nunca ejecuta investigación. Desarrollar conserva la API anterior. Evaluar tiene etiqueta accesible con nombre del proyecto; acciones de tarjeta se adaptan a móvil.
- **Corrección encontrada durante el lote:** tarjetas mostraban duración de catálogo sin descontar Dirección de Operaciones. Nuevo researchDuration compartido con startRD; fórmula de juego intacta. Proyecto activo muestra Ya pagado y meses restantes contratados, aunque luego cambie la dirección; no recalcula retrospectivamente su plazo.

Validación: 341/341 Node +54/54 DOM; sintaxis/diff correctos. Edge1365×900,375×900,320×900: filtros/evaluar/cerrar puros, foco, advertencia de vivienda, investigación iniciada realmente una vez, contratar Operaciones después sin alterar plazo activo, coste pendiente0, alternativa bloqueada evaluable, dobleclic1modal, Escape y recarga. Sin errores/desbordamientos y capturas inspeccionadas tras animación. Simulación576meses con/sin consultar conserva estado/RNG; estudio200negocios~3,2ms. Migración0.20→0.21 conserva caja/neto/patrimonio/RNG. Revisión independiente sin hallazgos; adicionalmente contrastó420combinaciones de proyectos/estados con tickRD. Fuentes de107archivos coinciden con build; dependencias intactas; smoke desempaquetado correcto. Portable final reconstruido tras última corrección de etiqueta de activo (primer artefacto0.21 no entregado).

Portable y desempaquetado definitivos pasan ambos smoke ocultos, salida0, sin perfiles reales. Plan y registro: `docs/superpowers/plans/2026-11-04-evaluar-investigacion.md`. Scripts/evidencias `%TEMP%/boomerez021-*`, focalizado `boomerez-research-test.mjs`; DOM común `boomerez-dom-tests.cjs`. No quedan arreglos abiertos de esta entrega. Continuar revisión dentro del plazo, sin encadenar funciones nuevas por inercia. Posible siguiente comprobación acotada: promesa de jugar offline en web (sw.js usa red primero, no precarga y se registra después de boot); **aún no se ha reproducido un fallo**, verificar en un perfil de navegador aislado antes de decidir cambios. No afecta al portable.

## Entrega 0.20.0 — Patrimonio y riesgos

- **Finanzas → Patrimonio y riesgos**, tercera subvista separada: activos (incluidas obras y caprichos), deudas confirmadas del banco/familia/SS, patrimonio antes de accionistas y del jugador. Si cotiza explica participación y sentimiento. Reutiliza exactamente las valoraciones actuales: no cambia el equilibrio ni el esquema de guardado.
- Hacienda no inspeccionada y liquidación laboral potencial figuran como contingencias fuera del balance. Escenario ilustrativo de pago íntegro conjunto, antes de crédito y sin multas adicionales, con caja/patrimonio resultantes. Las cuotas SS ya aplazadas no se vuelven a sumar a exposición. No paga ni usa RNG.
- `src/core/finance.js`: `financeSnapshot(s)` puro; `src/ui/finance.js`: renderer. Cambiar subvista conserva estudios de Resistencia y foco. Corregidos ceros negativos con regresión DOM roja/verde.
- **Omisión corregida:** cuenta del último cierre no desglosaba ingresos de banca/telecom/logística aunque sí entraban en el total. Ahora incluye todas las categorías actuales. KPI Deuda pasa a Deuda bancaria; resto de obligaciones en la nueva vista. El gráfico de sectores ya incluía esos tres sectores, no necesitó cambio.

Verificación: 335/335 Node +49/49 DOM. Edge 1365×900,375×900,320×900: vista, advertencia de insuficiencia de caja, navegación Balance/Patrimonio/Resistencia, estudio conservado, estado/RNG intactos y recarga; sin errores ni desbordamientos, capturas inspeccionadas. Simulación emparejada: 12 semillas×48 meses=576 meses, consultar/no consultar deja estado completo y RNG idénticos; snapshot de500 negocios~0,008ms en esta máquina. Migración0.19→0.20 conserva caja/neto/patrimonio/RNG. Revisión independiente sin hallazgos. Fuentes empaquetadas coinciden (105 ficheros) y dependencias de lockfile intactas. Build y smoke ocultos desempaquetado/portable correctos, salida0; no perfiles reales.

Auditoría ampliada: `node tests/fuzz.mjs --seeds 40 --from 81 --months 900 --rich --tame`: 40 partidas,19.507 meses,29.145 acciones,17.280 cartas; sin fallos de invariantes ni divergencias de guardado. Todas acabaron en bancarrota con acciones aleatorias: esta prueba mide integridad, no capacidad de victoria ni equilibrio. La medida de victoria europea de0.19 sigue siendo la referencia.

Plan/registro: `docs/superpowers/plans/2026-11-04-patrimonio-riesgos.md`. Evidencias y scripts temporales en `%TEMP%/boomerez020-*`; focalizado `%TEMP%/boomerez-finance-test.mjs`, DOM `%TEMP%/boomerez-dom-tests.cjs`. Servidor propio `python tools/serve.py 8080` (sesión36886). No hay arreglos abiertos de esta entrega. **Siguiente lote:** continuar revisión por evidencia dentro del plazo; no repetir las simulaciones de campaña europea ya medidas ni ampliar el balance por inercia. Priorizar problemas reproducibles en gestión avanzada; pendientes de diseño de0.19 siguen descritos abajo y no se han alterado.

# Continuación 0.19.0 — La campaña europea, medida (30-10-2026)

El usuario pidió seguir 4 horas con be-ambitious. Objetivo: que un juez externo diga si la campaña por defecto
se puede ganar, a qué ritmo y sin trucos ni atascos, y corregir lo que encuentre.

- **Medida:** `node tests/europe.mjs --seeds 24 --months 360 --only EU_goal,EU_goal_delta` (en paralelo; cada
  partida tarda 10-17 min porque el bot evalúa muchas aperturas). Estrategia `europe` en `tests/bot.js`: marca
  blanca con auditoría en los mercados baratos si el obrador llega al 90 %, despliegue exterior, una tienda
  propia por país y fin del acuerdo, I+D de logística → telecomunicaciones → banca, un local de cada sector
  (con crédito si hace falta) y viviendas donde falte plantilla. Las opciones por defecto del bot no cambian
  (12 partidas idénticas a la versión anterior).
- **Resultado:** 24/24 victorias en las dos variantes; mediana 286 meses (EU_goal) y 250 (EU_goal_delta,
  IC95 245-257). Repetido tras las correcciones: EU_goal_delta 24/24, mediana 257 (IC95 244-264). Un jugador corriente
  (`EU_casual`: sin crédito, una apertura al mes, pocas opciones) también gana 24/24, pero en 502 meses (IC95
  473-513, unos 42 años) y con un relevo de media; de 100 M€ a 1.000 M€ tarda 27 años. La inflación salarial no
  lo atrapa antes de ganar. 8 países hacia el mes 75-79, 3 sectores hacia el 105; manda el patrimonio. Sin banca, el
  patrimonio crece de forma lineal (unos 7 M€/año). No se ha cambiado el ritmo.
- **Fuzzer:** `node tests/fuzz.mjs --seeds 40 --months 900 --rich --tame` (y sin `--rich --tame` para partidas
  que acaban pronto). Invariantes: números finitos, rangos, ids únicos, cartas con opciones y sin bucles,
  excepciones en acciones y cierres, y que una copia cargada viva igual que la original durante 3 meses.
- **Caza de trucos** (cazador + verificador adversario por hipótesis, scripts en el scratchpad de la sesión):
  corregidos el bucle de franquicias ruinosas (tope `FRANCHISES_PER_MONTH = 3`), la estimación sin
  mantenimiento, el salto de la comprobación de plantilla con locales en obras (`missingBedsAhead` en
  `workforce.js`; mira las entregas pendientes sin cambiar la temporada), el descuento de paquetería
  inalcanzable, el aviso de la oferta del rival y el orden del ERTE. Migración: guardado sin `campaign` →
  `classic`.
- **Probado y descartado:** la vivienda como pozo de revalorización (deriva neta ~2 %/año), endeudarse para
  inflar el patrimonio (neutro), la OPA en crisis (no da dinero), la salida a Bolsa como atajo a 1.000 M€
  (como mucho +0,8 %), lotes frente a operaciones sueltas (idénticos), el acceso permanente a un país tras
  seis meses de marca blanca (coherente con los textos).
- **Campaña clásica (decidido con el usuario):** la revista pide 20 M€ (`CLASSIC_GOALS` en
  `src/data/endings.js`, que usan `sim.js`, `goals.js` y los textos). Con 32 semillas devuelve la dificultad de
  la 0.4: Express legal 72 % hacia el mes 89, Maison legal 100 % hacia el mes 66.
- **Equilibrio de marcas (decidido con el usuario: «lo barato sale antes»):** `BUSINESS_TYPES.maison.yield = 0.5`
  y `brandCapacity` en `economy.js`: el obrador heredado (12.000 uds, con sus mejoras de I+D y directivo) rinde
  igual con cualquier marca; lo ampliado y los obradores regionales dan `yield` sobaos por unidad. Los sueldos
  del obrador se pagan por capacidad usada. Clásica, 32 semillas: Maison legal 35 M€ (antes 47; Express 22,6),
  revista 32/32 hacia el mes 75. Probado y descartado: sin exención del obrador heredado, o bajando el precio de
  la tienda Maison a 8,5-9 €, Maison quiebra al empezar (2/24 partidas europeas con 8,5 €, semillas 110879 y
  142555; ninguna con 10 €). Para igualar más las marcas haría falta otra palanca (p. ej. la demanda por tienda),
  medida también en el arranque.
- **Pendiente, decisiones de diseño (no tocadas):**
  1. Antes del cambio a 20 M€, la campaña clásica era mucho más fácil que en la 0.4: con 32 semillas el bot llega a la revista
     en 30/32 partidas Express (mes ~79) y 32/32 Maison (mes ~59). Explotar con cuidado apenas rinde más
     que jugar legal (23,7 frente a 22,8 M€ y 48,8 frente a 46,8 M€); la explotación bruta pierde (15,3 M€).
  2. Partidas muy largas: los salarios suben (SMI, elecciones) sin índice de precios; hacia el mes 700-840 el
     índice salarial llega a ×2-3 y el beneficio se vuelve negativo. No afecta a una victoria a los ~21-24
     años, sí al modo infinito tras ganar.
  3. Los expedientes se heredan en el relevo; Doña Remedios presta también a los sucesores; el relevo da
     una acción extra y quita el estrés. El patrimonio no descuenta la deuda con Hacienda ni la liquidación
     latente (un jugador ilegal gana ~2 meses antes). Las OPA no exigen plazas ni plazo de obra. El obrador
     no se deprecia.
- Plan: `docs/superpowers/plans/2026-10-30-campana-europea-medida.md`.
- Arte: **198 done, 62 requested y 1 blocked** en el manifiesto. Es la cola de recursos existente, no un bloqueo de la entrega de código.
- Trabajo realizado en `main`, mediante commits locales. **No se ha hecho push**. Código, pruebas y documentación de cada entrega se guardan conjuntamente.
- El usuario autorizó continuar código y decidir el equilibrio por entregas. La antigua vigilancia autónoma de arte de ocho horas ya terminó; no reiniciarla.

---

# Continuación 0.18.0 — Resistencia de nuevas aperturas (26-10-2026)

Usuario delegó siguiente mejora con be-ambitious: unir el comparador de nuevas aperturas y el análisis de Resistencia.

- En **Imperio → Aperturas**, Probar escenarios en tarjeta o como tercera opción de la revisión lleva elección/cotización a **Finanzas → Resistencia**, sin abrir. Compara Mantener/Abrir bajo los cuatro supuestos ya existentes. Volver a Aperturas conserva tipo, ciudad y modalidad, mostrando bloqueadas si corresponde; desde Resistencia sin estudio también se puede ir al comparador.
- `stressReport(s,selection,expectedItems,operation)` conserva firmas anteriores. Con operation opening, selection es elección type/city/mode y expectedItems es cotización. Aplica executeOpening en copia, con canon/desembolso/premios y efectos de objetivos/cláusula antes del supuesto. Caja se modifica una vez; canon/premios no se suman al neto mensual. openingIntent ancla elección/businessId previsto/coste/canon/premios, permitiendo recalcular mes/condiciones si la intención no cambió. Si ya abriste otro negocio o cambió cotización, baseline+aviso, sin proponer silenciosamente segunda tienda.
- Nueva franquicia expone `rows[i].investment.franchiseeProfit` por escenario; null en mantener y operaciones que no estudian nueva franquicia. Tabla y aviso de pérdidas del dueño separados del colchón de la central. Conteo de supuestos no son probabilidades ni meses simulados. No se ejecuta desde Resistencia; revisión/confirmación normal de Aperturas mantiene guardia completa y clauseOk.
- UI temporal en game.finance.choice/quote, reseteada al cargar/quitar comparación; sin nuevo esquema. Foco al ir/volver, modalidad y datos restaurados. Footer ahora aclara que cada alternativa incluye efectos inmediatos de su operación, como objetivos, antes de congelar condiciones del cierre.
- P2 de revisión: tras cambiar de Express a Maison, retorno descartaba Express y enseñaba Maison. Corregido con preserveType solo en retorno explícito: selector conserva marca anterior bloqueada con motivo, y elegir tipo manualmente limpia esa intención. Normalización ordinaria de rebranding0.17 intacta. Regresión DOM roja/verde y prueba real3tamaños, P2 cerrado.

Verificación: **321/321 Node +46/46 DOM**, sintaxis/diff correctos. Edge1365×900,375×812,320×812: ambas vías de estudio, pureza de partida/cupón/cláusula, cuatro comparaciones y dueño en pérdidas4de4 con colchón central cubierto, retornar/limpiar, cambio de marca conservado bloqueado y selección explícita nueva, cancelar, firmar una sola franquicia+25.000€, estudio anterior invalidado y recarga. Sin errores/desbordamiento, capturas inspeccionadas. Recorrido anterior0.17 con aperturas propias/franquicias, cotizaciones caducadas y ambas decisiones de cláusula vuelve a pasar en3tamaños.

Simulación24meses con/sin consultar conserva estado/RNG exactos. Informe de apertura con200negocios~36ms en esta máquina. Revisión independiente P2 cerrado y sin hallazgos adicionales; cubre compatibilidad, premios y canon una vez y propietario. Ayuda/README actualizados. Build definitivo y smoke desempaquetado/portable correctos (salida0), fuentes coincidentes y dependencias intactas. Migración0.17→0.18 conserva caja/neto/RNG. Portable `desktop/dist/ManoloBoomerez-0.18.0-portable.exe`. Sin push ni alteración de perfil real. Plan/registro `docs/superpowers/plans/2026-10-26-resistencia-aperturas.md`.

# Continuación 0.17.0 — Comparador de aperturas (26-10-2026)

Usuario delegó siguiente mejora con be-ambitious, centrada en elegir dónde crecer.

- **Empresa → Imperio → Aperturas**, tercera subvista con **Resumen** y **Cartera** (etiquetas cortas para móvil). Sin cambio de14pestañas/4áreas/atajos. Tipos con buildMonths0 y marca vigente, propia/franquicia/ambas, país, búsqueda de ciudad sin tildes, orden por delta neto/coste/ciudad y mostrar bloqueadas con motivo. Diez alternativas por página. Obras con plazo conservan gestión en Ciudad/Viviendas.
- `core/opportunities.js`: `openingPlan`, `openingOpportunities`, `executeOpening`, `immediateOpeningTypes`. Simula canOpen y openBusiness en copia, incluyendo coste localizado, mantenimiento del valor real, descuento/primo, saturación, personal, suministro, objetivos y cláusula. Comparación de neto aftertax global; canon y premios de objetivos separados de ingreso mensual, resultado del dueño de franquicia explícito y advertencia de pérdidas. Alternativas independientes: no se consumen descuentos, primeros negocios, RNG ni objetivos al consultar.
- Revisar alternativa muestra ciudad/tipo/modalidad, desembolso/canon, objetivos/caja/patrimonio, neto, cobertura y empleo. Abre una sola tras confirmar; cotización recalculada incorpora mes/id/elección/importes/métricas/cláusula. Si cambió no abre nada; doble clic no duplica. Mantiene clauseOk original antes de romper testamento y notificaciones de openBusiness real. No modifica precios/reglas/save.
- UI temporal en game.empire.openings, reiniciada al cargar. Foco de subvista/filtros/búsqueda y dirección de página preservados; normaliza tipo si cambia marca. Enlace a ciudad en cada alternativa.
- Revisión identificó coste de repetir todo (~300ms con200negocios). Caché privada acotada a estado serializado actual y opciones tipo/ciudad/modo; resultados públicos clonados. Filtrar/ordenar/paginar reutiliza mientras el estado sea igual. openingPlan y executeOpening no usan caché, siempre recalculan. Benchmark de datos200negocios/142alternativas: frío343ms, repetición1ms, búsqueda0ms, ordenar1ms en esta máquina. No es medición de render completo.

Validación: **316/316 Node y42/42 DOM**, sintaxis/diff correctos. Edge1365×900,375×812,320×812: consulta pura/cupón intacto, búsqueda/foco, bloqueos extranjeros, cancelación de revisión y de cláusula, cotización caducada, propia con descuento24.600€ y doble clic una sola apertura, franquicia+25.000€, aceptar cláusula posterior, cuatro negocios tras recarga; sin errores/desbordamiento, capturas inspeccionadas. El script inicial asumió orden de botones de confirmModal y luego nombre accesible sin prefijo numérico: corregido para seleccionar texto visible, recorridos completos finales pasan.

Simulación24meses/5aperturas válidas frente a acción individual conserva estado/RNG completos. Migración0.16→0.17 conserva caja/neto/RNG. Revisión independiente de núcleo/flujo y caché cerrada sin hallazgos. Ayuda/README actualizados. Build definitivo y smoke desempaquetado/portable correctos (salida0), fuentes copiadas coincidentes y dependencias intactas. Portable `desktop/dist/ManoloBoomerez-0.17.0-portable.exe`. Sin push ni alteración del perfil real. Plan/registro `docs/superpowers/plans/2026-10-26-comparador-aperturas.md`.

# Continuación 0.16.0 — Reestructuración de cartera (26-10-2026)

Usuario delegó la siguiente mejora con be-ambitious. Implementada evaluación y ejecución de ventas/rescisiones en lote:

- **Empresa → Imperio → Cartera y reformas → Vender y rescindir**. Cambiar modo limpia selección; mantiene filtros, páginas y normaliza por operación. Venta admite activos físicos actuales, incluidos máximos, obras y franquicias según reglas existentes; reformas conservan su elegibilidad anterior. Precio firmado por activo, selección entre páginas y todos los activos del filtro.
- `core/divestment.js`: `saleBatchPlan`/`saleBatch`, simulan `sellBusiness` en copia, deduplican y validan ids. Primero ingresos por ventas y luego indemnizaciones, permitiendo financiación dentro del lote. Si una rescisión no tiene fondos se rechaza todo sin cambios. Vender propios en descubierto sigue permitido. Se usa `saleValue` con canon histórico; no se alteran precios ni reglas.
- Revisión muestra nombres/ciudades/ids, cobros/pagos, movimiento neto de caja, patrimonio, resultado del mes, capacidad/cobertura/empleo/vivienda y retroceso de países/sectores europeos cuando procede. Beneficio operativo y cobros de venta separados. Alerta pérdida de producción y déficit laboral nuevo/empeorado de cada mes hasta actual+12. La venta exige confirmación definitiva; cancelar no toca la partida, doble clic no duplica, cotización vieja se recalcula/rechaza. Ejecución solo cambia cash, array de negocios y log, equivalente a individuales en orden planificado; preserva identidades retenidas/flags/historia.
- `portfolioSelection` acepta operación opcional, default upgrade. `game.empire.operation` temporal. `stressReport`/renderStress aceptan cuarto argumento operation default upgrade; sale compara Mantener/Reestructurar y suma ventas/resta indemnizaciones una vez. Se conserva quote.items y el contexto al volver; activos vendidos dejan comparación obsoleta sin inventar otros. Nada se vende en Resistencia. Modo y selección se reinician al cargar, sin esquema nuevo.
- Revisión independiente encontró P2: comparar solo pico/primer déficit/actual ocultaba prolongar carencia al vender vivienda en obras (dos bloques entregas2/4). Corregido comparando ciudad/mes de ambos timelines; `workforceRisks.worseMonths` detalla mes/déficit/exceso, se muestra recuento/primera fecha y participa en cotización. Regresión roja/verde detecta meses2y3 aunque capacidad/pico/inicio actuales no cambien. P2 cerrado por revisor.

Verificación: **308/308 Node y38/38 DOM**. Edge1365×900,375×812,320×812: modo/foco y limpieza de selección, máximos/franquicias/obras, rescisión sin fondos bloqueada, venta60.000€ financia indemnización42.000€ partiendo de1.000€ y deja19.000€, Stress y retorno conservan modo/selección, consultas/cancelar sin cambios, cotización obsoleta no vende, doble clic aplica una vez, alerta por retirada vivienda, recarga. Sin errores/desbordamiento; capturas inspeccionadas. Recorrido anterior0.15 de reformas/Resistencia también pasa en tres tamaños. Dos arranques paralelos agotaron espera de depuración; sonda de portada0.16 sin errores y repetición secuencial completa pasa.

Simulación24meses/6lotes conserva estado y RNG idénticos a individuales. Benchmark200negocios/lote100activos: plan~12ms, Resistencia~36ms en esta máquina. Revisor verificó40lotes adicionales equivalentes, identidad retenida y cierre del P2; sin hallazgos pendientes. README/ayuda actualizados. Build definitivo y smoke desempaquetado/portable correctos (salida0). Fuentes empaquetadas coincidentes y dependencias intactas; portable `desktop/dist/ManoloBoomerez-0.16.0-portable.exe`. Sin push ni alteración del perfil real. Plan/registro `docs/superpowers/plans/2026-10-26-reestructuracion-cartera.md`.

# Continuación 0.15.0 — Pruebas de resistencia (26-10-2026)

Usuario delegó la mejora siguiente con be-ambitious: profundizar decisiones sin aumentar trabajo manual.

- **Empresa → Finanzas → Resistencia**, subvista junto a Balance y financiación. Desde **Imperio → Cartera y reformas**, seleccionar negocios y **Probar escenarios** lleva el lote a comparación sin comprarlo. Puede volver al lote, quitar comparación o consultar financiación. UI temporal en game.finance, reiniciada al cargar; ninguna propiedad nueva en guardado.
- `core/stress.js`: cuatro supuestos del mismo cierre: actual, demanda comercial×0,85 (modificador revenue existente), salario base ordinario×1,10 (wageIndex), combinación. ComputeEconomy recalcula relaciones compartidas; no multiplicar ingresos finales ni sumar mejoras aisladas. Pedidos contratados y regalías conservan condiciones; becas y sueldos fijos de directivos no se indexan. No se asignan probabilidades ni avanza tiempo, I+D, mercado, moral, fama ni sucesos.
- Cada caso muestra neto, caja tras cierre antes de financiación/ventas/sucesos, plantilla y cobertura. Colchón orientativo =3×(costs.salarios+directivos)+renovaciones de meses+1..+12. Las vencidas/actuales ya incluidas en neto no se vuelven a sumar. Distingue caja negativa de caja positiva por debajo del colchón. No bloquea dinero, no modifica reglas ni proyecta supervivencia repitiendo gastos extraordinarios.
- `renovationSchedule` extraído a construction.js y compartido con operations.js, mismos datos/orden/horizonte inclusivo actual+12. Actual reserva futura excluye actual. Reformar turísticos puede aumentar coste de renovación futura, y se refleja.
- Alternativa aplica lote en copia con upgradeBatch y descuenta inversión una vez. IDs inválidos/fondos insuficientes dejan baseline visible sin compras parciales. UI guarda quote.items para conservar intención de niveles: si un local ya cambió, no simula silenciosamente siguiente nivel; pide reelección. Cambios de condiciones del mes se recalculan en base actual. Ninguna compra se hace en Resistencia, solo en revisión habitual de la cartera.
- `ui/stress.js` presenta casos desplegables, tabla mantener/reformar y supuestos; primer caso abierto. Foco se conserva en cambios de vista, transferencia, quitar comparación y retorno. Ayuda/README documentados.

Validación: **298/298 Node y34/34 DOM**, sintaxis/diff correctos. Edge1365×900,375×812,320×812: cuatro casos, transferencia2reformas36.000€, renovaciones actuales266.667€ y futuras380.000€ separadas, navegar/consultar sin mutaciones, financiación accesible, retorno de selección, compra posterior, lote obsoleto bloqueado, quitar comparación y recarga; sin errores/desbordamiento. Capturas inspeccionadas. Simulación24meses consultando solo una de dos copias idénticas: estado/RNG exactos mes a mes. Informe con lote200negocios ~44ms en esta máquina.

Revisión independiente sin hallazgos; checks adicionales con online limitado por stock, becas/directivos fijos, reformas residenciales y estado profundamente congelado. Incluye revisión de intención de niveles. Build definitivo, fuentes empaquetadas coincidentes y dependencias intactas; smoke desempaquetado y portable correctos (salida0). Portable `desktop/dist/ManoloBoomerez-0.15.0-portable.exe`. Sin push ni alteración del perfil real. Plan y registro `docs/superpowers/plans/2026-10-26-resistencia-inversion.md`.

# Continuación 0.14.0 — Cartera del imperio y reformas conjuntas (26-10-2026)

El usuario pidió avanzar con be-ambitious y delegó elegir una mejora de comodidad/profundidad para imperios grandes.

- **Empresa → Imperio → Cartera y reformas**, subvista junto a **Resumen y operaciones**. Cartera independiente de `lastReport`: previsión de negocios físicos actuales con `computeEconomy`, excluye líneas virtuales y locales vendidos. Diez negocios por página; búsqueda sin tildes por nombre/ciudad/id, país, sector, estado y orden por resultado/ciudad/nivel. Franquicias muestran cuentas central/dueño separadas; pérdidas/orden usan las cuentas del dueño. Obras y máximos no reformables.
- Selección entre páginas o todos los reformables del filtro; filtros explícitos limpian selección y cada render excluye entradas invisibles/no elegibles. País/sector cuyo último local se vendió conserva opción «sin negocios», sin aparentar Todos. UI temporal en game.empire, reiniciada al cargar; nada nuevo en guardado.
- `core/portfolio.js`: `portfolio`, `portfolioSelection`, `upgradeBatchPlan`, `upgradeBatch`. Plan en copia ejecuta reglas existentes de `upgradeBusiness`, viviendas primero y luego id, deduplica, valida coste total y empleo conjunto. Si un negocio falla no se modifica caja/local/log. Commit de éxito solo cash/log y level/cond/value seleccionados, equivalente a individuales.
- Previsión conjunta antes/después de toda la empresa: neto mensual incluyendo generales/impuestos, cobertura y empleo. Se declara horizonte mes actual, no garantía ni gasto de inversión mensual; advierte delta no positivo. La falta de suministro puede hacer mala una reforma aparentemente buena.
- Modal lista todos los nombres, ciudades, ids, niveles y costes; cancelar no gasta y doble clic no duplica. La confirmación recalcula y compara con cotización revisada (mes/items/coste/antes/después); si cambió pide revisar otra vez sin cobrar. Guardado y recarga reales conservan reformas.
- Tabla histórica del último cierre queda disponible plegada en Resumen para acortar la pantalla. Foco de búsqueda/filtros/selección/subvista/paginación restaurado tras render; dirección de siguiente/anterior estable y alternativa habilitada si se alcanza extremo. README y ayuda actualizados.

Verificación: **288/288 Node y30/30 DOM**. Edge1365×900,375×812,320×812: selección entre páginas, búsqueda/foco, filtros, cuentas franquiciados, obras, revisión concreta, cancelar, confirmar doble clic, coste36.000€ y neto coincidente con previsión, limpiar filtros, recarga, sin errores/desbordamiento. Repetido recorrido anterior14pantallas y acciones reales de I+D/viviendas/beneficios/dirección/online/marketing/exterior, también pasa.

Simulación24meses con6lotes: estado y RNG idénticos a reformas individuales mes a mes. Benchmark200negocios: cartera~3ms y plan completo~8ms en esta máquina. Revisión independiente sin hallazgos; comparación adicional de los15tipos de negocio y rechazo de cotizaciones tras cambios de mes/estado/capacidad/otros negocios. Regresiones rojas/verdes de cotización vieja, filtros huérfanos, informe plegado y foco de subvista en navegador.

Build definitivo y smoke desempaquetado/portable correctos (salida0), fuentes copiadas verificadas, dependencias intactas. Portable `desktop/dist/ManoloBoomerez-0.14.0-portable.exe`. Sin push ni alteración del perfil real. Plan y registro: `docs/superpowers/plans/2026-10-26-cartera-imperio.md`.

# Continuación 0.13.0 — Plan de operaciones (26-10-2026)

El usuario invocó be-ambitious y pidió continuar desarrollo, con detalles delegados. Entrega centrada en anticipar inversiones del imperio:

- **Empresa → Imperio → Plan de operaciones**, disponible sin informe previo. Reúne obras por entregar, viviendas pendientes y reserva estimada de renovaciones desde hoy hasta el mes actual+12 inclusive.
- `core/operations.js`: consulta pura de edificios, fechas, costes de reposición y `workforcePlan` por mes y ciudad. Las viviendas solo entran a partir de entrega; obras del mismo mes se evalúan juntas. Franquicias sin puestos centrales. Detecta riesgos de empleo también sin obras por estacionalidad (p. ej. gimnasio enero), con primera falta y pico por ciudad. No completa I+D ni cambia mercado/políticas/condiciones; mantiene condiciones actuales y cambia calendario, expresamente explicado en UI.
- Renovación en máximo de hoy/entrega/fecha debida: incluye vencidas y excluye posteriores al horizonte, una vez por inmueble. Reserva estimada, no proyección de caja ni cobro. Descubierto sin renovaciones no inventa aviso de reserva; regresión roja/verde.
- `ui/operations.js` presenta bloque compacto con detalles: riesgos abiertos si existen, agenda plegada, enlaces a ciudad y Viviendas. No añade menús ni estado de guardado. Ayuda/README documentados. La economía y el contenido anterior siguen intactos.

Validación: **279/279 Node +25/25 DOM**. Edge 1365×900,375×812,320×812: agenda, cambio de año, enlaces a ciudades/Viviendas, nueva promoción, recarga y conteos; sin errores/desbordamiento, capturas inspeccionadas. Simulación comparativa de24meses consultando solo una de dos copias idénticas: estado/RNG exactos mes a mes y una renovación real. Consulta200negocios ~6ms; revisión independiente sin hallazgos y pruebas adicionales hasta2.000negocios (~134ms) en esta máquina. Sintaxis/diff correctos.

Build definitivo y smoke desempaquetado/portable correctos (salida 0). Fuentes copiadas coinciden con las revisadas y dependencias intactas. Portable `desktop/dist/ManoloBoomerez-0.13.0-portable.exe`. Sin push ni modificación del perfil real. Plan y registro: `docs/superpowers/plans/2026-10-26-plan-operaciones.md`.

# Continuación 0.12.1 — Revisión de navegación y skill (26-10-2026)

- Instalada la skill solicitada `robonuggets/be-ambitious` en `C:/Users/MSI/.codex/skills/be-ambitious`, fuera del repositorio. No se cambia la autorización de trabajo ni se reactiva la vigilancia de arte.
- Revisión de los 14 menús y operaciones de I+D, viviendas, beneficios, dirección, online, marketing y acuerdos exteriores en Edge a 1365×900, 375×812 y 320×740; scroll recordado, foco, atajos y guardado. Sin errores de consola ni desbordamiento. El primer intento de navegador tuvo un timeout transitorio de arranque; la repetición completa pasó.
- Hallazgo concreto: portada fijada en «v0.4». Ahora `setupTitle` usa `GAME_VERSION`, sin duplicar el número en HTML. Versión del juego y metadatos Electron 0.12.1. No cambian las reglas económicas ni el formato de guardado.
- Batería antes del cambio visual: 272/272 Node y 21/21 DOM. Sintaxis y diff sin errores; nueva comprobación real exige «v0.12.1» en portada y repite los recorridos: todos pasan. Build, smoke desempaquetado y portable correctos (salida 0).

# Continuación 0.12.0 — Menús por áreas (25-10-2026)

Petición completa de reorganización del menú:
- Cuatro grupos con máximo cuatro submenús: Empresa (Ciudad, Imperio, Mercado, Finanzas), Expansión (Marketing, I+D, Exterior, Online), Equipo (Plantilla, Beneficios, Viviendas, Dirección), Manolo (Manolo, Archivo). `ui/navigation.js` contiene catálogo y render; `panels.js` reexporta TABS por compatibilidad.
- Extracción de renderizadores existentes, sin duplicación: Mercado solo ciclo/Gobierno/competencia; Marketing campañas y tradición; I+D con filtros; Exterior acuerdos/filiales; Online venta; Viviendas promociones/alquiler; Beneficios reparto/asistencia; Dirección fichajes. Plantilla conserva condiciones/comité. Economía y guardado sin cambios de reglas.
- I+D filtra pendientes/investigados/todos y cinco áreas; proyecto activo siempre visible. Todas las 35 innovaciones pertenecen al menos a un área. Se incluyen app/fidelización en negocios y congelados en sobaos.
- Navegación de dos filas sin scroll horizontal en móvil. Cada pantalla conserva scroll, Ciudad por destino; filtros I+D vuelven arriba y conservan foco. Cada grupo recuerda último menú visitado. Atajos 1–7 históricos intactos. Selección de marketing se conserva entre pantallas.
- Enlaces, bloqueos, consejos, objetivos y ayuda actualizados: investigación en I+D, acuerdos en Exterior, online en Online, vivienda en Equipo → Viviendas, directivos en Dirección, reparto en Beneficios.

Verificación: **272/272 Node y 21/21 DOM**, sintaxis correcta. Edge 1365×900, 375×812 y 320×740: las 14 pantallas accesibles sin desbordamiento ni errores; navegar sin alterar partida, restauración de 500 px, filtros/foco/proyecto activo y acciones reales de I+D, vivienda, beneficios, fichajes, online, marketing y acuerdo exterior. Atajos 3/7 y recarga comprobados; capturas inspeccionadas. Revisión independiente detectó dos proyectos sin área y pérdida de foco de filtros; regresiones rojas/verdes, cierre sin nuevos hallazgos importantes.

Build y smoke de desempaquetado y portable correctos (salida 0). Ejecutable `desktop/dist/ManoloBoomerez-0.12.0-portable.exe`. Plan/registro: `docs/superpowers/plans/2026-10-25-navegacion-por-areas.md`. El resto del documento conserva el historial de entregas; para ubicaciones actuales usar este mapa de menús.

---

# Continuación 0.11.0 — Venta online (25-10-2026)

Petición completa implementada:
- Canal virtual `online` en Mercado, sin crear locales. Tres niveles: apertura 15 k€, ampliaciones 45 k€ y 140 k€; cuotas 600/1.800/4.500 €/mes, preparación 1/3/8 empleados y hasta 1.000/3.500/10.000 pedidos mensuales. El tráfico de Maison es menor por su carácter premium.
- Venta peninsular en cajas de seis: primero tiendas/contratos, luego online con excedente y personal real, finalmente cortesías. Solo pedidos aceptados entran en `totalDemand`; tráfico potencial no servido se informa por separado. `fill` conserva la cobertura de tiendas y contratos. Producción, materias, nóminas y transportes contabilizados una vez.
- Express 3,80 €/ud, Maison 10,50 €/ud. Paquetería por caja 6,90/12,90 €, embalaje 0,90/2,40 €, cobro 3 %, reserva de incidencias 2 %. Portes incluidos o aportación cliente de 3 €/pedido con demanda ×0,82. Precios por unidad/pedido se muestran con céntimos. Logística operativa de Selaya y rutas reducen portes, aún superiores al suministro peninsular a tiendas.
- Personal de preparación en Selaya entra en oferta laboral, vivienda, nómina y alojados. Abrir/ampliar/reactivar valida oferta laboral; pausa sin ventas, cuota ni nóminas de preparación. Marketing nacional, I+D, reputación, fama, temporada y tradición impulsan tráfico; campañas locales/extranjeras no lo multiplican directamente.
- Previsión de apertura y cambio en resultado total de empresa (incluida fabricación común), pedidos/stock, margen variable, desglose y controles en Mercado. Informes reconocen línea online; consejo de pérdidas dirige a Mercado para ajustar portes/stock o pausar, no a vender un local virtual. Estado anterior sin online se migra cerrado y se validan niveles/portes.

Verificación: **271/271 Node y 18/18 DOM**, sintaxis correcta. Edge 1365×900 y 375×812: apertura, política compartida, pausa a cero, reactivación, dos ampliaciones (200 k€ acumulados), cierre idéntico a previsión y recarga; sin errores/desbordamiento. Revisión independiente sin fallos importantes y matriz de 96 combinaciones de marcas/niveles/capacidad/contratos coherente. Consejo menor corregido con regresión roja/verde, y formato de céntimos también verificado con regresión DOM.

Dos simulaciones de 120 meses con caja/capacidad elevadas, Express y Maison: 240 cargas mantienen neto/RNG, 9.494.688 uds online, dos meses de falta de stock, producción siempre dentro de capacidad; incluye ampliaciones, portes, pico mayorista, pausa y reactivación. No es medida de dificultad de una partida inicial normal.

Build, smoke de desempaquetado y smoke portable correctos (salida 0). Ejecutable: `desktop/dist/ManoloBoomerez-0.11.0-portable.exe`. Sin push ni cierre del juego del usuario. Plan: `docs/superpowers/plans/2026-10-25-venta-online.md`.

---

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
