# Cartera del imperio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Comparar negocios y reformar lotes sin visitar cada ciudad, con previsión conjunta real.
**Architecture:** core/portfolio.js consulta computeEconomy y proyecta reformas en copia mediante upgradeBusiness. UI independiente ui/portfolio.js, subvista Resumen/Cartera de Imperio; acciones/controladores en app.js.
**Tech Stack:** JavaScript puro, tests Node/DOM, Edge/Playwright y Electron existentes.
**Spec:** Diseño incluido; usuario delegó elección y detalles, no requiere otra aprobación.

## Diseño

Cartera usa previsión del mes actual, excluye líneas virtuales/obrador central y muestra todos los negocios físicos actuales aunque no haya informe o estén en obras. Filtros búsqueda ciudad/negocio, país, sector, estado (pérdidas, obras, reformables, franquicias) y orden (peor/mejor resultado, ciudad, nivel). Diez resultados por página. Resultado central separado de resultado del franquiciado; pérdidas de franquicias se juzgan con sus cuentas. Sin prometer rentabilidad ni confundir previsión con informe histórico.

Selección múltiple de reformables operativos, seleccionar todos los elegibles del filtro, limpiar. Persistencia entre páginas; cambiar filtros limpia selección para evitar inversiones invisibles. Revisar coste total y nombres/ciudades/niveles de toda la selección antes de confirmar. Una reforma por negocio; deduplicar ids, rechazar ids inválidos, obras, franquicias y nivel máximo. Prevalidar coste total y ejecutar en copia, viviendas primero (casas legacy pueden habilitar empleo), luego resto en orden id. Si falla cualquier regla, cero cambios. Recalcular al confirmar con estado actual; commit aplica únicamente cash, level/cond/value de seleccionados y log procedentes del simulacro; no usar un plan viejo como autorización ejecutable.

Previsión de lote: computeEconomy antes/después incluye capacidad, saturación, viviendas, plantilla, estructura/impuestos y reparto: diferencia neta total, cobertura y empleo. Solo condiciones actuales, no proyección acumulada ni garantía. Sin nuevas reglas económicas ni datos de guardado.

## Global Constraints

- Español, no dependencias nuevas, no push, preservar partidas y perfil real.
- Entrega0.14.0 con portable, handoff y commit local.
- Browser plugin not available; Edge/Playwright con perfil temporal.

## Review Focus

- Dos reformas que caben por separado pero agotan presupuesto/plantilla juntas deben rechazarse sin cobros parciales.
- No usar líneas históricas de locales vendidos ni atribuir ganancias centrales a franquiciados.
- Selección de varias páginas/filtros, cambios de condiciones antes de confirmar, cancelar y doble clic.
- Guardados antiguos, viviendas legacy, sedes exteriores, saturación/producción compartida y nivel máximo.
- Listas largas, foco de búsqueda y filtros, teclado, móvil320px; consulta sin mutación ni azar.

## Tareas

- [x] Tests rojos núcleo de cartera y lote: filtros, pérdidas/franquicias/obras, atomicidad fondos/empleo, deduplicación y previsión.
- [x] Implementación núcleo puro y ejecución con reglas existentes; pruebas verdes.
- [x] Tests DOM rojos; subvista, filtros, paginación, selección y revisión de lote en UI/controlador.
- [x] Batería completa, simulación comparativa, navegador y revisión independiente.
- [x] Metadatos0.14, build/smokes, handoff, documentación y commit propio.

## Registro

Inicio: main limpio97364dc, 0.13.0. Detalles de equilibrio delegados, se conserva toda regla vigente. No se reinicia vigilancia de arte.

- Núcleo: nueve casos específicos rojos/verdes. Lote reutiliza upgradeBusiness en copia; costo agregado, empleo compartido y viviendas primero; comprobar igualdad completa con reformas individuales.
- Cotización revisada opcional en upgradeBatch(s,ids,reviewedPlan): recalcula antes de comparar mes/items/coste/antes/después y rechaza cambio sin mutaciones. UI siempre la pasa. Nueva regresión roja/verde: reforma individual intermedia no autoriza otro nivel con presupuesto anterior.
- Selección normalizada contra resultados actuales reformables: entre páginas permanece; filtros explícitos limpian y cambios de estado excluyen invisibles. País/sector sin último negocio permanecen visibles como «sin negocios» para evitar controles que aparentan Todos.
- Ruling: plegar informe histórico en Resumen — preserva el informe anterior y evita otra lista larga junto a la nueva cartera — acceso requiere desplegar.
- DOM30/30: subvista, páginas, selección entre páginas/oculta, franquicias, obras, filtros huérfanos e informe histórico plegado.
- Edge1365×900,375×812,320×812: búsqueda sin tildes/foco, filtros, dos páginas, revisión de nombres, cancelar sin gasto, confirmar doble clic sin duplicados, coste36.000€ y neto coincidente con previsión, filtros limpian selección, guardado/recarga. Sin errores ni desbordamiento, capturas inspeccionadas.
- Repro Playwright de foco perdido al cambiar de subvista, corregido con restauración por vista y dirección estable para paginación; recorrido repetido pasa. También navegación anterior14menús y acciones I+D/viviendas/beneficios/dirección/online/marketing/exterior en tres tamaños pasa.
- Simulación24meses/6lotes frente a individuales: estado y RNG idénticos. La estrategia de prueba escoge negocios actuales: los sucesos normales pueden cerrar/vender otros durante la simulación. Benchmark200negocios: consulta~3ms, lotecompleto~8ms en esta máquina.
- Revisión independiente sin hallazgos: además verificó equivalencia para15tipos y rechazo sin mutación de cotizaciones tras cambiar mes/estado/capacidad/otros negocios. Deltas de foco/filtros/informe también revisados.
- Primer build empezó antes del ajuste de foco; repetir con fuente definitiva antes de entregar.

- Cierre de pruebas: 288/288 Node y30/30 DOM. Revisión independiente de últimos deltas sin hallazgos.

- Entrega: build definitivo y fuentes copiadas coincidentes; smoke desempaquetado y portable salida0. Metadatos0.14.0 y dependencias intactas; handoff actualizado, commit propio, sin push.
