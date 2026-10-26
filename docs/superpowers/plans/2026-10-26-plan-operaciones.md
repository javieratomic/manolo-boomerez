# Plan de operaciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Anticipar entregas, falta de vivienda laboral y renovaciones sin recorrer cada ciudad.
**Architecture:** `core/operations.js` consulta edificios y workforcePlan en copias superficiales con calendario futuro. `ui/operations.js` presenta un bloque compacto en Imperio incluso antes del primer cierre; detalles desplegables y enlaces existentes.
**Tech Stack:** JavaScript puro, Node, Edge/Playwright, Electron existentes.
**Spec:** Diseño incluido abajo. El usuario delegó las decisiones y pidió continuar con be-ambitious; no requiere otra aprobación de diseño.

## Diseño y límites

Horizonte inclusivo hoy y meses 1–12. Obras por readyMonth futuro; casas solo aportan plazas desde su entrega. Renovaciones por fecha real de cobro (máximo de hoy, renovación y entrega), coste de reposición actual; no se vuelve a cobrar por consultar. Proyección mensual de plantilla con condiciones actuales y estacionalidad del calendario, sin ejecutar sucesos, cambiar mercado, contratar ni completar I+D futura. No es previsión de caja ni ingresos. Franquicias no necesitan personal de central. Plan solo lectura, sin estado guardado nuevo ni números de economía modificados.

Mostrar total obras, viviendas pendientes y reserva estimada de renovación. Riesgos por ciudad con fecha primera falta y pico, déficit actual separado. Agenda desplegable ordenada por fecha, enlaces a ciudad y Viviendas. Sin nueva pestaña ni listas largas abiertas salvo alertas reales. Renderizar también partida sin informe.

## Global Constraints

- Español; no dependencias nuevas, no push, preservar guardados y juego real abierto.
- Versión de entrega 0.13.0; portable, handoff y commit local.
- Browser plugin not available: validar con Playwright/Edge instalado, perfiles temporales.

## Review Focus

- Dos entregas en una ciudad y mes deben evaluarse juntas.
- Renovaciones vencidas y edificios aún en obras, sin incluir cobros fuera del horizonte.
- Personal y vivienda solo en ciudades correspondientes, franquicias fuera del empleo central.
- Consulta repetida sin mutaciones, RNG, ni diferencias en el cierre de mes.
- Agenda en cambio de año, sin informe, móvil 320px y muchas ciudades.

## Tareas

- [x] Tests rojos de operationsPlan: fechas, entregas simultáneas, plazos distintos, renovaciones, pureza y carga.
- [x] Implementar núcleo puro con timeline mensual y comprobar pruebas, incluida equivalencia con reglas existentes.
- [x] Tests DOM rojos; bloque en Imperio, límites y enlaces; implementar UI compacta.
- [x] Simulación de calendario, batería completa, navegador escritorio/móviles y revisión independiente.
- [x] Versionar, construir, smoke desempaquetado/portable, actualizar handoff y commit propio.

## Registro

- Inicio: main limpio; 0.12.1, 272 Node y 21 DOM de entrega anterior.
- Decisión: proyecto estructural de 12 meses, sin forecast económico; las condiciones actuales se mantienen y el texto lo declara.

- Núcleo: siete pruebas específicas, incluidos plazos simultáneos, renovación vencida y pico de gimnasio sin obras. La primera fixture del obrador se ajustó a la oferta real de Santander antes de validar la carencia.
- DOM: nuevas pruebas rojas antes del render; 25/25 finales, incluida regresión adicional de descubierto con reserva cero (rojo/verde).
- Simulación: 24 meses con dos copias idénticas de la misma partida y decisiones, consultando solo una; estado y RNG idénticos mes a mes, una renovación efectiva. Para aislar el efecto de consulta se usa copia exacta, no una migración de guardado.
- Navegador: Edge 1365×900, 375×812, 320×812. Agenda, fechas cambio de año, enlaces, obras nuevas, recarga, sin errores ni desbordamiento; capturas inspeccionadas fuera del repo.
- Rendimiento: consulta con 200 negocios ~6 ms en esta máquina. Revisión independiente 100/500/1.000/2.000 negocios ~6/16/39/134 ms; cierre sin hallazgos concretos, delta de reserva revisado.
- El primer empaquetado precedió al ajuste de reserva cero; se repetirá build desde la fuente definitiva antes de entregar.

- Cierre: 279/279 Node y25/25 DOM; build definitivo, fuentes copiadas verificadas, smoke desempaquetado y portable salida0. Sin dependencias cambiadas, push ni alteración del perfil real.
