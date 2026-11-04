# Patrimonio y riesgos — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Usuario delegó ejecución y decisiones por entregas; continuar en el checkout existente, sin push.

**Goal:** Hacer reconciliables las cifras de patrimonio y deuda y mostrar separadamente la exposición pendiente de inspección.

**Architecture:** Informe puro en core/finance.js, con importes de las funciones económicas existentes. Renderer independiente en ui/finance.js como tercera subvista de Finanzas. Sin cambiar reglas de valoración, balance, guardados ni probabilidades.

**Tech Stack:** JavaScript ES modules sin dependencias; pruebas Node y DOM; Edge/Playwright.

**Spec:** Diseño incluido a continuación por alcance acotado y decisiones delegadas.

## Diseño y alternativas

El balance actual resta banco, cartilla y aplazamientos SS. No resta Hacienda no inspeccionada ni liquidación laboral potencial. Conservarlo: modificar esa regla afectaría equilibrio y objetivos sin resolver antes la opacidad. Alternativas descartadas: deducir todas las contingencias automáticamente o añadirlas a la deuda bancaria. Mostrar activos, pasivos confirmados, patrimonio antes de accionistas y patrimonio del jugador. Si cotiza, explicar porcentaje retenido y factor de sentimiento. Contingencias se muestran fuera del balance, sin multas adicionales y sin prometer importe final. Escenario ilustrativo de pagar ambas íntegramente muestra caja antes de crédito, patrimonio empresarial y del jugador, sin contar SS ya aplazada dos veces.

La cuenta del último cierre debe mostrar todas las categorías presentes, incluidas banca, telecomunicaciones y logística. El KPI Deuda se renombra Deuda bancaria. Nueva subvista evita alargar el balance principal.

## Global Constraints

- Español; sin dependencias, nuevas reglas ni cambio de SAVE_VERSION.
- Informes y renders no modifican estado/RNG ni consumen objetivos.
- Deuda SS confirmada solo desde extraMonthly con ss; contingencia laboral desde liquidacion.
- Conservar Resistencia y estudios seleccionados al cambiar subvista.
- Sin alterar perfiles reales ni cambios ajenos; entrega local.

## Review Focus

- Caja y patrimonio negativos deben conservar signo y no usar factores de IPO por defecto incorrectos.
- Préstamos y amortizaciones cambian caja/deuda pero no patrimonio.
- Una liquidación ya aplazada no debe reaparecer como contingencia si se vació ahorro.
- Finanzas antes del primer cierre y reportes antiguos sin nuevas categorías deben funcionar.
- Cambiar subvista no pierde el estudio existente de Resistencia.

## Task 1: Informe y presentación

**Files:** core/finance.js, ui/finance.js (nuevos en src/); ui/panels.js; tests/finance.test.js; tests/dom.test.js; ambos registros de tests.

**Interfaces:** financeSnapshot(s) devuelve assets {cash,factory,businesses,luxury,total}, liabilities {bank,family,socialSecurity,total}, equity, ownership, sentiment, playerWealth, exposure {tax,labor,total,cashAfter,equityAfter,playerWealthAfter}. renderWealth(s) devuelve HTML sin acciones económicas.

- [x] Escribir pruebas de reconciliación, préstamo/amortización, IPO negativo/sent0, contingencia/SS, carga y pureza; DOM subvista, signos y todas las categorías.
- [x] Ejecutar pruebas focalizadas y observar fallo por función/subvista ausente.
- [x] Implementar informe, renderer, navegación y categorías completas.
- [x] Ejecutar pruebas focalizadas, suite completa y DOM.
- [x] Probar recorrido Finanzas → Patrimonio → Resistencia → Balance a 1365,375,320 px, pureza y recarga; inspeccionar capturas.
- [x] Revisión independiente del diff; resolver hallazgos con regresiones.
- [x] Documentar, actualizar versión y HANDOFF; build+smoke al cerrar lote estable y commit propio.

## Registro

- Inicio 04-11-2026 11:45 UTC; límite de autorización 15:45 UTC. Árbol inicial limpio, base 035ce66, versión 0.19.0.
- Browser plugin not available; QA con Playwright incluido y Edge en contextos aislados.
- Elección: mantener valoración económica y contingencias fuera del balance; no se toca el ritmo de victoria.
- RED:5/5 núcleo fallan por módulo ausente y2 DOM fallan por vista y desglose ausentes. GREEN:335 Node+49 DOM. Cero negativo encontrado en QA, regresión roja/verde añadida.
- Fixture DOM inicial usaba costs vacío y generaba NaN artificial: sustituido por cierre real. Fixture de navegador inicial activaba premios al cargar: GOALS marcados terminados en perfil aislado; recorrido final limpio.
- Revisión independiente review_finance0191 sin hallazgos; prueba de576 meses conserva estado/RNG. Fuzzer adicional40semillas/19.507meses sin fallos; no es medición de victorias.
- Versión0.20.0, fuentes de build idénticas, dependencias sin cambios; ambos smoke ocultos salida0. No quedan findings ni decisiones pendientes de esta entrega.
