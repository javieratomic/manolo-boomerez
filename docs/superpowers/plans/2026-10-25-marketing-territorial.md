# Marketing territorial y campañas en lote

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ampliar marketing y contratar desde Mercado en todos los territorios elegidos.
**Architecture:** Catálogo ampliado en data/market.js; módulo puro de planificación, elegibilidad y alcance core/marketing.js, reexportado por market.js para compatibilidad. Los modificadores se evalúan por ámbito en economía. Internacional integra pedidos/royalties sin fabricar de más en licencias.
**Tech Stack:** JavaScript puro, Node y Edge existentes; sin dependencias nuevas.
**Spec:** Petición de campañas nacionales/locales adicionales, lanzamiento conjunto desde Mercado e internacionales; equilibrio delegado.

## Reglas
- Mantener los seis ids existentes. Añadir cinco campañas locales, cinco nacionales y seis internacionales, con costes/duración/bonus distintos. Degustaciones y acciones gastronómicas solo para negocios afines. Navideña con ventana y meses de efecto explícitos.
- Campañas nacionales: una tarifa por España; no afectan países extranjeros. Locales: tarifa por ciudad con presencia operativa, incluyendo franquicias y mostrador de Selaya. Obras no habilitan campañas.
- Internacionales: tarifa por país con negocios propios operativos o acuerdos activos sin conflicto; impulsan negocios y pedidos de marca blanca o royalties de licencia. La licencia sigue sin consumir producción. Retirar todos los canales de un país impide nuevas contrataciones.
- Plan puro con territorios elegibles, activos/no afines omitidos, coste total y motivo de bloqueo. Lote completo o nada si falta dinero o hay ids inválidos. Repetir lote no vuelve a cobrar lo activo. Igual efecto que contratos individuales.
- Mercado como central de marketing: controles globales de ciudades/países, seleccionar todos/ninguno, coste actualizado y revisión del lote al pulsar. Contratación individual local conservada desde Ciudad.
- Los modificadores de campañas antiguas conservan duración, aplicando su ámbito correcto; sin duplicar efectos al cargar. Factores nunca crean producción ni saltan límite de suministro.
- Partidas compatibles, no push ni cierre de juegos abiertos.

## Revisión enfocada
Fondos insuficientes sin mutación; territorios duplicados/desconocidos; país con dos ciudades y un contrato no cuenta tres veces; campañas activas omitidas; nacional no filtra a exterior; royalties sin producción; carga/caducidad y selector móvil.

## Tareas
- [x] Pruebas rojas de catálogo, alcance, lote atómico, conflictos y acuerdos exteriores.
- [x] Catálogo y núcleo de marketing, economía/internacional y validación de guardados.
- [x] Central en Mercado con selección/revisión, regresiones y navegador escritorio/móvil.
- [x] Suite, simulación con cargas, revisión independiente y correcciones.
- [x] Docs, commit, portable0.10.0 y smoke.

## Registro
- Los seis tests iniciales fallaron antes de implementar; nueve pruebas de marketing verifican catálogo, alcance, plazos, migración, lote atómico, repetición, equivalencia con acciones individuales, afinidad, conflictos y acuerdos extranjeros.
- Selección UI no persistida en la partida: se conserva al cambiar de pestaña durante la sesión y se normaliza a los territorios actuales. La revisión independiente detectó la selección invisible tras vender un local/vencer un acuerdo; regresión DOM roja/verde, corregido en renderizado, cambio y contratación. El núcleo mantiene rechazo estricto a ids inválidos. Cierre sin otros hallazgos importantes.
- Edge 1365×900 y 375×812: cinco ciudades con Madrid ya activo, lote cobra10.000€ por otras cuatro; tres países (Portugal con dos locales, Francia licencia y Alemania marca blanca), lote cobra120.000€ una vez por país. Todos/ninguno/checkbox, confirmación, duplicados y recarga comprobados; sin errores/desbordamiento. Capturas inspeccionadas.
- Simulación96meses con caja/capacidad elevadas para aislar marketing, campañas cada seis meses y acuerdos renovados:48lotes,2.272.000€ gastados,96cargas conservan cuentas y RNG, sin campañas duplicadas ni final inesperado. No es medición del equilibrio de una partida inicial normal.
- Cierre: 261/261 Node y 17/17 DOM, sintaxis correcta. Build y smoke de desempaquetado y portable 0.10.0 correctos (salida 0). Sin push.
