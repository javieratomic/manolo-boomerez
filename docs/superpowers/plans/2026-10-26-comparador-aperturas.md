# Comparador de aperturas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Elegir ciudad y modalidad de crecimiento sin recorrerlas todas, con cálculo global y revisión de una apertura real.
**Architecture:** core/opportunities.js simula openBusiness en copias y computeEconomy antes/después. ui/opportunities.js muestra alternativas paginadas. Tercera subvista de Imperio, sin pestaña principal nueva. Ejecutar recalcula cotización y reutiliza openBusiness; mantiene aviso de cláusula y notificaciones.
**Tech Stack:** JavaScript puro, Node/DOM, Edge/Playwright y Electron existentes.
**Spec:** Diseño incluido; usuario delegó elección/detalles y pidió be-ambitious. No requiere otra aprobación.

## Diseño

Comparar un tipo de negocio de apertura inmediata (buildMonths0), en ciudades españolas y extranjeras del catálogo. Tipos con plazo conservan gestión en Ciudad/Viviendas y no se prometen beneficios antes de entrega. Tipos disponibles según marca/desbloqueo, con reglas por ciudad de canOpen. Modalidad propia/franquicia/ambas (solo franquicias de sobaos); país/búsqueda/orden y mostrar bloqueadas. Diez alternativas por página, orden por delta neto actual o menor desembolso; elegibles primero, bloqueo con motivo.

Alternativas independientes desde mismo estado: canOpen sobre copia (evitar push temporal al original), aplicar openBusiness en copia para precio, value/maintenance, cupón/primeras promociones, sinergias, personal, producción, objetivos y cláusula reales. computeEconomy después de acción, con impuestos y costes generales. Mostrar coste/canon, caja inmediata (separar premios de objetivos), neto empresa antes/después, plantilla/cobertura y resultado propio del franquiciado. No anualizar ni prometer amortización. Presupuestos distintos por ciudad, capacidad y canibalización se recalculan con reglas existentes. No simular sucesos futuros ni juntar alternativas como si fueran lote.

Revisar una alternativa lista ciudad, negocio, modalidad, precio/canon, premios si existen y previsión. Ejecutar exige cotización recalculada (mes, id nuevo, elección, importes, métricas, cláusula). Si cambió no abre nada. Doble clic no duplica; clauseOk existente avisa antes de romper testamento. Acción real openBusiness, sin copiar parcialmente estado y omitir efectos. Notificaciones habituales tras abrir. Filtros UI temporales se reinician al cargar; preservar foco/scroll. Si cambia marca, selector vuelve al tipo coherente.

## Global Constraints

- Español, sin dependencias nuevas, arte ni push; preservar perfil real y guardados.
- Entrega0.17.0 con portable, handoff y commit local.
- Browser plugin not available: Edge/Playwright con perfil temporal.

## Review Focus

- Descuento de un uso, primo/brand y objetivos no se consumen al consultar muchas ciudades.
- Casa propia vs franquicia: canon no es beneficio mensual; resultado franquiciado separado y sin garantía por neto positivo de central.
- Bloqueos exteriores/licencia territorial/cupo/housing; delayed types y modalidades inválidas no se ejecutan.
- Cotización vieja, doble clic, cancelar, cláusula y efectos/avisos reales de openBusiness.
- Clasificación y filtros no esconden motivo, marca/country vacíos, móvil320px, rendimiento con200negocios.

## Tareas

- [x] Tests rojos: consulta pura, precios/objetivos, marca/país/bloqueos, cuota/cupón, neto global y ejecución equivalente, guardia cotización.
- [x] Implementación núcleo y pruebas verdes.
- [x] Tests DOM, subvista/filtros/páginas, revisión/controlador/foco, cláusula.
- [x] Simulación, batería, navegador y revisión independiente.
- [x] Versión/build/smokes, documentación/handoff y commit.

## Registro

Inicio main limpio9335ae9,0.16.0. Elegido alcance inmediato para no mezclar predicción de entregas con rentabilidad del mes actual. Se conserva economía individual y objetivos/cláusula.

- Núcleo8tests específicos, batería316/316Node y42/42DOM. Simular acción real preserva efectos de objetivos, flags y cláusula; ejecución equivalente a openBusiness y protección de id/cotización ante doble llamada.
- Revisión sin hallazgos bloqueantes, con observación de rendimiento:200negocios/142alternativas300–350ms. Ruling: memo privada de una sola snapshotJSON, por alternativa, devolviendo copias; filtros no repiten cálculo, review/execute siempre frescos. Prueba mutabilidad/invalidationcupón y negocio existente pasa. Datos benchmark frío343/repetir1/buscar0/ordenar1ms; revisor cerró delta.
- QA1365/375/320: búsqueda, bloqueadas, neto real, propia/franquicia, cupón, no gastar al consultar/cancelar, stale quote, doble clic, ambas ramas de cláusula, recarga. Script de confirmModal corregido por selección textual (sí está primero y accesibilidad incluye número), sin cambiar producto.
- Simulación24meses y5aperturas válidas: estado/RNG idénticos a individuales. Lisboa del último intento quedó bloqueada por requisitos, como corresponde. Migración0.16→0.17 conserva caja/neto/RNG.
- Vistas cortas Resumen/Cartera/Aperturas para móvil, atajos y pestañas históricas intactos. Metadata0.17 y fuentes empaquetadas coinciden; sin dependencias cambiadas.

- Cierre: build y smokes desempaquetado/portable salida0, fuentes definitivas verificadas, dependencias intactas. Handoff actualizado, commit propio, sin push ni perfil real modificado.
