# Resistencia de nuevas aperturas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Comparar una apertura concreta con mantener la empresa bajo los cuatro supuestos de Resistencia, antes de abrir.
**Architecture:** Extender stressReport con operation opening y elección type/city/mode, aplicar executeOpening en copia. UI comparte presentación del estudio con oportunidades y devuelve el contexto; revisión y ejecución reales siguen en Aperturas.
**Tech Stack:** JavaScript puro, Node/DOM, Edge/Playwright y Electron existentes.
**Spec:** Diseño incluido, usuario delegó próxima mejora y detalles. No requiere otra aprobación.

## Diseño

Botón Probar escenarios en alternativa y revisión de apertura. Transfiere elección y cotización vigente a Finanzas → Resistencia sin ejecutar. Comparación Mantener/Abrir aplica primero apertura en copia con todas sus consecuencias (canon, inversión, premios, fama/cláusula/objetivos) y luego supuesto comercial/salarial del único cierre. Canon y premios afectan caja una vez; no se suman al neto mensual. Cuatro supuestos sin probabilidades, misma reserva de nóminas/renovaciones existente. No simular obras con plazo.

Nueva franquicia muestra resultado del dueño en cada caso además del resultado central. Mostrar cuántos supuestos dan pérdidas al dueño, sin confundirlo con probabilidades ni con solvencia central. No bloquear operaciones que hoy permiten las reglas individuales, mantener advertencias.

Intención de apertura = elección canónica+businessId previsto+coste+canon+premios; si cambió, muestra baseline y aviso para revisar, sin transformar estudio antiguo en nueva tienda adicional. Cambios de mes/condiciones pueden recalcularse si intención sigue vigente. La revisión de ejecución siempre recalcula cotización completa y mantiene clauseOk actual.

Volver a Aperturas restaura tipo/ciudad/modalidad (y bloqueadas para explicar un nuevo bloqueo), no ejecuta. Quitar comparación limpia elección/cotización. UI temporal y caché existente no pasan a guardado. Cartera/reestructuración y firmas posicionales existentes de stressReport compatibles. Foco y navegación móvil preservados.

## Global Constraints

- Español, no dependencias nuevas/arte/push, preservar guardados y perfil real.
- 0.18.0 con portable, handoff y commit local.
- Browser plugin not available; Edge/Playwright con perfiles temporales.

## Review Focus

- Descuento/primer primo/objetivos/cláusula solo cambian en copia; efecto de premios en caja una vez y fama en neto real.
- Franquiciado puede perder con caja central cubierta, debe verse por escenario.
- Estudio obsoleto tras abrir una tienda o cambiar cupón/premios, sin proponer silenciosamente segunda.
- Volver conserva apertura, no selecciona reformas ni cambia modalidad; cancelar no ejecuta y cláusula mantiene confirmación.
- Nuevo tipo de operación no rompe ventas/reformas, actualización/carga, tablas estrechas y foco.

## Tareas

- [x] Tests rojos núcleo: equivalencia con apertura+shocks, premio/canon, propietario, pureza/cotización obsoleta y compatibilidad.
- [x] Implementar apertura hipotética con acciones existentes y pruebas verdes.
- [x] Tests DOM, controles/transferencia/retorno/revisión y foco.
- [x] Batería/simulación/navegador/revisión independiente.
- [x] Versión/build/smokes, documentación/handoff y commit.

## Registro

Inicio main limpio a788cc7,0.17.0. Decisión elegida para unir herramientas existentes sin añadir otra pantalla principal ni nueva economía.

- Núcleo5tests nuevos rojos/verdes: efectos reales, premios/canon/cupón/cláusula, propietario separado, intención caducada y mes actualizado. Firmas upgrade/sale previas intactas.
- P2 revisor reproducido rojo en DOM: volver después de rebranding cambiaba Express por Maison. preserveType en retorno explícito conserva tipo bloqueado; selección manual lo limpia. DOM previo de normalización ordinaria también pasa. Revisor cerró delta.
- DOM46/46 y321/321Node. QA Edge1365/375/320: modalidades, transferencia desde tarjeta/revisión, cuatro supuestos, dueño4de4pérdidas y compañía0de4bajo colchón, origen de retorno, limpiar, precio/intención viejos, revisión/cancelar/compra real, guardado. Capturas inspeccionadas. Recorrido0.17 anterior repetido pasa, incluidas ramas de cláusula.
- Simulación24meses: estado/RNG completos iguales con consultas solo en una rama. Benchmark200negocios informe36ms en esta máquina.
- Sin nuevas constantes de economía, SAVE_VERSION ni arte. Empaquetado0.18 iniciado después de estabilizar código y QA.

- Cierre: build y smoke desempaquetado/portable salida0, fuentes definitivas verificadas y dependencias intactas. Migración0.17→0.18 conserva caja/neto/RNG. Handoff/commit propios; sin push ni perfil real modificado.
