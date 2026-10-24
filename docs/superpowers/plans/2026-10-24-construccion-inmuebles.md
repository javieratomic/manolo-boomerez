# Construcción y ciclo inmobiliario

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Promociones residenciales distintas, construcción diferida y renovación periódica verificables.
**Architecture:** Propiedades puras en core/construction.js y data/housing.js; toda actividad filtra edificios en obras. Economía calcula renovación y simulación/forecast la aplican una sola vez. Metadatos por negocio, migración compatible.
**Tech Stack:** JavaScript puro, Node, Edge/Playwright; sin dependencias nuevas.
**Spec:** Petición del usuario de 24-10-2026, con equilibrio delegado.

## Decisiones
- vivienda conserva id. housingForm=apartamentos (25,2M€,100€/mes,moral+1) o chalets (10,3M€,200€/mes,moral+3,renta×1.5). Precios de construcción ajustados por ciudad y descuentos existentes. Vivienda antigua: legacy, capacidad histórica por niveles.
- Nuevas promociones tienen unidades fijas; reformas mejoran calidad/renta, no añaden viviendas a promociones de tamaño fijo. Capacidad legacy preservada.
- airbnb: base1.2M€,200€/mes; niveles conservan pisos originales. Todas las viviendas dejan el mantenimiento porcentual genérico.
- Alquiler/prioridad/ocupación por ciudad existentes; calidad de vivienda mejora moral solo de empleados alojados.
- Plazo de vivienda/airbnb12 meses, obrador_regional/telecom6. Coste inicial completo; durante obras sin ingresos, personal, vivienda utilizable, producción, transporte reducido ni bonus Telecom. Se sigue contabilizando inversión patrimonial. Edificios anteriores no entran en obras.
- Renovación automática cada180meses desde entrega, 20% coste de reposición local (ajustado a unidades/nivel), gasto visible y sin duplicarse en previsión/cierre. Restablece condición. Viviendas previas: primera renovación en180meses desde migración. La póliza/concurso existentes gestionan falta de caja.
- UI Ciudad y Plantilla: variante, unidades, precio, espera, mensualidad, moral y renovación estimada. Obras visibles y guardables; no reformables antes de entrega.
- Sin push ni cierre de partidas del usuario.

## Revisión enfocada
Guardado a mitad de obra; frontera de meses6/12; vivienda pendiente no permite contratación; Telecom sin bonus prematuro; renovación en previsión no duplicada y públicas sin moral.

## Tareas
- [x] Tests rojos de variantes/precios/moral, plazos completos y capacidades/bonus pendientes.
- [x] Implementar datos y núcleo de obra/renovación; integrar economía, workforce, logística, simulación, forecast y guardados.
- [x] UI y arte de variantes, regresiones y adaptación explícita de fixtures históricas de edificios ya construidos.
- [x] Suite, simulaciones con cargas, navegador escritorio/móvil, revisión independiente y reparaciones.
- [x] Docs, commit local, portable0.8.0 y smoke.

Ejecución directa: el usuario ya ha autorizado avanzar por entregas y decidir el equilibrio.

## Registro
- Ocho tests nuevos, rojos antes de implementar y verdes después: variantes, meses6/12, ingreso/personal/capacidad nulos durante obras, bloqueo de reformas, cargas, renovación180 y objetivo europeo.
- La renovación es gasto deducible en `costs.renovaciones`, se aplica una vez tras el cálculo y se reprograma; `forecast` opera sobre copia y también consume esa fecha en la copia. El horizonte avanza los meses para reflejar entregas y renovaciones.
- Se conservan unidades de promociones antiguas; fixtures históricas marcan edificios entregados, mientras nuevas pruebas y simulaciones usan `openBusiness` real. Dos presupuestos de tests se elevaron para cubrir los nuevos costes; la estimación clonada especifica la promoción de25unidades. El test de alquiler público comprueba moral directa de vivienda: los beneficios aún pueden influir indirectamente mediante agravio.
- Revisión independiente encontró radar de explotación Airbnb y venta con leaseback prematuros. Regresión roja/verde y filtros de entrega corregidos. Cierre de revisión sin nuevos hallazgos importantes.
- Edge1365×900 y375×812: construcción por ambos botones/formas, recarga, mes6 sin viviendas y mes12 con35, tarifas y sprite; sin errores ni desbordamiento. 14tests DOM correctos.
- Tres simulaciones de240meses con presupuesto alto para aislar plazos:720guardados/cargas sin variación de neto/RNG,6renovaciones cobradas, sin final inesperado. No se presentan como medida de equilibrio de una partida inicial normal.
- Arte: image_gen creó urbanización, inspección corrigió recuento inicial8→10chalets, reducido a256×256 y79.792bytes; alfa y base verificados. Catálogo198done/62requested/1blocked, checker correcto. Commit `18a1950`.
- Cierre: 243/243 Node y 14/14 DOM; sintaxis correcta. Build y smoke de desempaquetado y portable 0.8.0 con salida0. Sin push.
