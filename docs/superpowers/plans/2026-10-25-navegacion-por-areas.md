# Navegación por áreas y pantallas independientes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reducir el scroll separando I+D y el resto de módulos grandes en menús propios.
**Architecture:** Catálogo de navegación y render puro en ui/navigation.js; cuatro grupos con máximo cuatro submenús. Renderizadores existentes reutilizados y exportados por pantalla, sin duplicar economía ni cambiar guardados. Estado de scroll/filtros/selecciones solo en UI.
**Tech Stack:** JavaScript puro, CSS, tests DOM y Edge/Playwright existentes.
**Spec:** Petición de reorganizar menús largos, con I+D propio; usuario delegó detalles.

## Diseño
- Empresa: Ciudad, Imperio, Mercado (ciclo/Gobierno/competencia), Finanzas.
- Expansión: Marketing (incluye tradición), I+D, Exterior, Online.
- Equipo: Plantilla (condiciones/comité), Beneficios, Viviendas, Dirección.
- Manolo: Manolo y Archivo.
- Dos filas de navegación sin scroll horizontal en320/375px; grupo/menú activo identificados y acceso por teclado. Los atajos1–7 originales mantienen destinos.
- I+D con estado pendientes/investigados/todos y filtro por producción/costes/sobaos/negocios/exterior; proyecto en marcha siempre visible.
- Cada pantalla recuerda scroll; Ciudad por destino. Cambiar filtros I+D vuelve arriba. Cambiar un control mantiene el scroll del menú actual. Cambiar grupo vuelve al último menú visitado de ese grupo.
- Actualizar enlaces, mensajes de bloqueo, ayuda y consejos para destinos correctos. Todas las acciones (campañas, online, vivienda, fichajes, políticas, acuerdos) siguen disponibles desde su nueva pantalla.
- Partidas sin cambios de reglas económicas ni formato. No push ni cerrar partidas abiertas.

## Revisión enfocada
Menús inaccesibles en móvil; enlaces a pantallas antiguas; scroll heredado de otra sección; filtros que ocultan proyecto activo; acciones que dejan de funcionar tras extraer contenido; selección de marketing preservada; guardar/cargar sin alterar partida.

## Tareas
- [x] Pruebas rojas de navegación, separación y filtros.
- [x] Catálogo, renderizadores separados, grupos y scroll independiente.
- [x] Enlaces/ayuda/consejos y adaptación de regresiones a nuevos destinos.
- [x] UI real escritorio/móvil, acciones, suite, revisión independiente y correcciones.
- [x] Docs, commit local, portable0.12.0 y smoke.

Browser plugin not available: validación con Playwright/Edge ya disponible, sin instalaciones.

## Registro
- Test de catálogo y dos DOM iniciales fallaron antes de implementar; las regresiones anteriores ahora comprueban su pantalla correspondiente, preservando controles/contabilidad.
- Revisión independiente: app y congelados no pertenecían a ninguna área; se asignaron con test que exige cobertura de 35/35 proyectos. Filtros reemplazados perdían foco; Playwright reprodujo activeElement sin data-act, corregido a research-category y research-status. Cierre sin nuevos hallazgos importantes.
- 272/272 Node y 21/21 DOM, sintaxis correcta. Edge en 1365×900, 375×812 y 320×740: catorce rutas accesibles sin overflow, navegar no cambia estado, vuelve a 500 px de scroll, filtros/proyecto/foco y acciones de cada módulo, atajos 3/7 y recarga. Capturas inspeccionadas.
- La primera pasada de UI intentó pulsar Firmar dentro del desplegable cerrado de Portugal; corregido el guion para abrir la oferta primero. Las tres pasadas completas posteriores verifican la interacción real.
- Build y smoke del desempaquetado y portable 0.12.0 correctos (salida 0). Arte y reglas económicas sin cambios. Sin push ni cierre de partidas abiertas.
