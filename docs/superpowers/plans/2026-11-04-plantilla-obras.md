# Plantilla coherente con las entregas — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Correcciones autónomas autorizadas hasta15:45UTC.

**Goal:** Que los permisos de expansión cuenten la plantilla real al entregar obras y permitan coordinar vivienda y negocio.

**Architecture:** workforcePlan con fecha de preparación evalúa el modelo existente sobre una copia que cambia solo disponibilidad de edificios, conservando calendario/condiciones. canOpen asigna al negocio temporal su fecha real de entrega antes de comprobar los picos de personal. Sin nuevas fórmulas ni cambios a nóminas actuales.

**Tech Stack:** JS puro, Node/DOM, Edge real.

**Spec:** Evidencia y diseño siguientes.

## Evidencia y ambición

0.21.2, API real: dos telecom en Madrid construidas en24 y entregadas30, sin viviendas. El permiso admite ambas. workforcePlan(s,madrid,30) anuncia28 empleados y0viviendas faltantes; al entregar realmente son58empleados, oferta53, faltan2viviendas. La previsión marca ready(b) pero serviceRevenue vuelve a mirar la fecha original y devuelve0: serviceStaff cae al mínimo14por centro, ignorando clientela/saturación. También el temporal de canOpen no tiene readyMonth y exige hoy el personal de una obra que tardará6/12meses, impidiendo coordinar entregas con vivienda.

Altitude: reproducir el desfase → usar exactamente el mismo modelo en la proyección → verificar admisión y rechazo de proyectos según fechas reales. Depth: material bruto = negocios/readyMonth + funciones de demanda/empleo, juez = copia con obras debidas realmente entregadas, sin mover calendario, y acciones de construcción reales. Meta: ninguna diferencia de proyección frente a ese oráculo y ninguna mutación/RNG; economía actual idéntica. Range omitido.

Prompt elevado: «Haz que la comprobación de vivienda al expandir incluya la plantilla de servicios real y la saturación de todos los centros que estarán entregados. Conserva la temporada actual. Un negocio en construcción debe necesitar personal en su entrega, y puede coordinarse con viviendas que lleguen a tiempo. Pasa si coincide con entregar las obras en una copia, bloquea sobrecontratación y no altera la economía actual ni la partida al consultar.»

## Diseño y alternativas

Elegido: si at!=s.month, crear una vista de negocios donde cada edificio está disponible o no según at, usando readyMonth del mes actual o del siguiente. Se conservan calendario, nivel, estado, productos y resto de condiciones; funciones reales de servicio ven la misma disponibilidad que los contadores. No se escribe esa vista al guardado. Default actual no clona ni cambia cálculo.

Descartado: adelantar s.month (cambia temporada/campañas) y recalcular sueldos con una fórmula nueva (duplicación). Conservar el límite base de plantilla tampoco refleja el coste real de la entrega.

El temporal canOpen lleva readyMonth=s.month+buildMonths(type), cuando haya demora, igual que openBusiness. Obras/viviendas simultáneas cuentan juntas; no se anticipan plazas entregadas después. Se mantienen restricciones existentes ante déficits actuales y todos los costes/reglas reales.

## Global Constraints

- Sin dependencias, arte ni esquema de guardado nuevo.
- Calendario/RNG/estado intactos en consultas; sin pagar sueldos antes de entrega.
- Demanda y economía de negocios actuales idénticas; solo permisos/proyección corregidos.
- Casas futuras no resuelven déficits antes de su fecha. Varios negocios debidos cuentan su saturación real.
- Regenerar catálogo offline después de tocar fuentes.

## Review Focus

- Dos centros simultáneos deben incluirse en demanda/saturación, no duplicar demanda de un centro.
- Futuros más tardíos siguen excluidos; casas coetáneas aportan oferta y las posteriores no.
- Otros servicios estacionales conservan mes actual al prever entregas.
- Bloqueo no consume efectivo, cupón, id ni altera la lista de negocios.
- Guardados con obras ya contratadas se mantienen; la economía al llegar sigue el mismo modelo.

## Task 1: Proyección y permiso

**Files:** src/core/workforce.js,actions.js; tests/workforce-timing.test.js y registros.
**Interfaces:** workforcePlan(s,city,at=s.month) y canOpen/openBusiness conservan firmas.
- [x] Pruebas rojas: oráculo de entrega, saturación, pureza, temporada fija, rechazo segunda telecom, casas simultáneas/posteriores, producción regional.
- [x] Normalizar disponibilidad solo en vista futura; temporal con fecha real; focalizadas verdes.
- [x] Contrastar planes actuales con implementación anterior en matriz y medir200negocios; simulación de entregas/guardados.

## Task 2: Integración y entrega

- [x] QA real de Ciudad: primera obra, segunda bloqueada sin vivienda, abrir con casas a tiempo, lectura de error y persistencia en3anchos.
- [x] Revisión independiente, Node/worker/DOM completos; cerrar hallazgos con rojo/verde.
- [x] Documentar0.21.3, catálogo/build/smokes, handoff y commit local.

## Registro

- Basecbbae07; árbol limpio; prueba inicial %TEMP%/boomerez-workforce-probe.mjs. Autorización hasta15:45UTC.
- RED6/6; GREEN6/6. Mensaje futuro actualizado a condicional con condiciones actuales y coordinación de entregas, con regresión roja/verde propia. Suite final352simulación+14worker+56DOM=422 únicas.
- Matriz contra cbbae07:540planes actuales idénticos (incluidas fechas con obras entregadas),720proyecciones iguales al oráculo que entrega obras en copia. Estado congelado profundo y serialización/RNG intactos. Benchmark200negocios~0,63ms para missingBedsAhead en esta máquina; sin cachés nuevas.
- Simulación de6meses con casa ya contratada y telecom nueva: sin ingresos de la nueva antes de entrega, vivienda y servicio entran juntos, déficit0. Migración0.21.2→0.21.3 conserva proyectos ya contratados, efectivo, neto actual, ids y RNG; un déficit preexistente futuro ahora se informa sin cancelar nada.
- Edge1365/375/320,9perfiles: primera telecom construida y segunda bloqueada con2plazas; recarga conserva; casa coetánea permite segunda, sin ingresos prematuros y plan operativo cubierto; casa un mes tarde bloquea. Sin errores/desbordamiento; capturas inspeccionadas.
- Revisión independiente sin hallazgos. Mantener operationsPlan con estacionalidad del calendario es intencional y explícito en su texto; el permiso congela las condiciones actuales como antes. No se rediseña ni promete demanda futura constante.
- Build definitivo y ambos smoke ocultos salida0, fuentes108archivos coinciden, dependencias intactas. Catálogo offline vigente. No quedan arreglos abiertos de este lote.
