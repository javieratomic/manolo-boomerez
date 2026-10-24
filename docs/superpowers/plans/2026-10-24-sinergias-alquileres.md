# Sinergias, alquileres y acceso a Bolsa

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Conectar los negocios y ampliar la gestión inmobiliaria sin perder partidas.
**Architecture:** Funciones puras para sinergias y tarifas; cálculo mensual único compartido por previsión y simulación. Nuevos campos migrados con valores compatibles.
**Tech Stack:** JavaScript puro, Node y Edge/Playwright existentes.
**Spec:** Petición del usuario de 24-10-2026 y reglas concretas de este documento; detalles delegados por el usuario.

## Restricciones y diseño
- Retratos ya corregidos: conservar las regresiones, sin repetir generación de arte.
- Bolsa: valoración de empresa mínima 1.000 M€, además de antigüedad/reputación/bloqueo existentes; no deslistar partidas antiguas.
- Academy/coworking: +15 % mutuo solo en la misma ciudad, sin acumular por número de socios.
- Gimnasios: hasta +35 % por volumen real local de sobaos del mes anterior; conservar ventas por ciudad en estado, excluir mayoristas/exportaciones. Sin recursión economía/plantilla.
- Empanadas: solo pacto con Rodrigo, 10 % de ventas existente. Descuento de primera apertura propia del 30 %, consumible una sola vez incluso al vender/cargar. Negocios existentes se conservan.
- Viviendas: prioridad para empleados locales, público en vacantes; tarifas independientes por ciudad, factor local de alquiler. Tarifa pública baja/mercado/premium altera ocupación; límite de demanda local compartido entre edificios. Solo empleados alojados dan control laboral. Mantener políticas anteriores como valor por defecto.
- Residencia: beneficio opcional, 20 % de descuento en plazas ocupadas por familiares de empleados locales, hasta un familiar por diez empleados; no crea plazas y reduce ingresos. Moral proporcional a beneficiarios reales. Sin residencia no se activa.
- Interfaz en español, guardar y recargar controles; números explicados junto a negocio y vivienda. Compilar portable con nombre nuevo si el anterior está abierto, sin cerrar juego del usuario.

## Revisión enfocada
Migración no concede sociedad retroactiva; descuento no se repite al vender; vivienda pública no causa control; descuentos no duplican ocupación; sinergias no se transmiten a otras ciudades.

## Tareas
- [x] 1. Tests de umbral IPO exacto y empanadas (opciones del evento, apertura, venta, carga). Implementar en life/actions/events/state y ajustar pruebas históricas a nuevo umbral.
- [x] 2. Tests de sinergias locales y ventas reales de mes previo. Crear core/synergies.js y aplicar en bizMult; guardar citySobaoSales desde informe mensual.
- [x] 3. Tests de tarifas locales, reparto empleados/público, ocupación limitada y beneficio asistencial. Crear core/housing.js; integrar economía, políticas, deriva moral y migración.
- [x] 4. Controles por ciudad y beneficio en Plantilla, información de sinergias y requisitos en Ciudad/Finanzas/Ayuda. Pruebas DOM/flujo real escritorio y móvil.
- [x] 5. Suite completa, simulaciones y carga, revisión independiente, correcciones; docs, commits propios, portable y smoke.

En cada tarea: test que falle por ausencia de comportamiento, implementación mínima, regresiones y verificación. Ejecución directa: el usuario ya delegó detalles y autorizó avanzar por entregas.

## Registro de ejecución

- Los cuatro primeros tests fallaron antes de implementar; los de alquiler y residencia también. Regresión de tarifas locales en inspecciones y vivienda solo pública: rojo antes de cada corrección, verde después.
- Bolsa se mide con `companyValuation`, conservando los restantes requisitos. La OPA de La Porteña tampoco elude el pacto de Rodrigo; adquirir consume el descuento inicial.
- Beneficio asistencial limitado a plazas enteras y un familiar por diez empleados locales; no reduce el coste de atención por descontar el precio.
- Revisión independiente detectó inspecciones y sucesos que aún consultaban la tarifa global; corregidos y revisados sin nuevos hallazgos importantes.
- Ruling: la prueba histórica del bot dependía de que una inspección aleatoria coincidiese con cuotas pendientes. La nueva economía movió ese calendario (visitas 24 y 83, sin deuda en la visita). Se programa una única visita al mes 36 con `laborVisitParams` real, manteniendo la exigencia de liquidación positiva y resolución normal.
- 235/235 Node, 13/13 DOM. Flujos Edge a 1365×900 y 375×812: dos tarifas por ciudad, descuento de residencia, recarga, sinergias e IPO bloqueada, sin errores/desbordamiento. Tres simulaciones de 120 meses, 360 guardados/cargas conservando neto y RNG. Sintaxis correcta y smoke desempaquetado correcto.
- Portable 0.7.0 compilado y smoke con salida 0. Sin push ni cierre de la partida abierta del usuario.
