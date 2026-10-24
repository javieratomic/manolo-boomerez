# Venta online de excedentes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Vender más producción mediante comercio electrónico, con margen menor por paquetería.
**Architecture:** Canal virtual independiente de los locales, datos y cálculo puro en core/online.js y data/online.js. Se sirve tras tiendas/contratos y antes de sobaos de cortesía. Plantilla reservada en Selaya y producción total única; previsiones e informes usan el mismo cálculo.
**Tech Stack:** JavaScript puro, Node y Edge existentes.
**Spec:** Petición del usuario; detalles de equilibrio delegados.

## Decisiones
- Tienda online nacional peninsular, pedidos en cajas de seis. Tres niveles: apertura15k€/cuota600€/1empleado/demanda6kuds; ampliación45k€/1.800€/3empleados/18k; plataforma140k€/4.500€/8empleados/60k. Maison recibe un30% del tráfico por ser producto premium.
- Precio online Express3,80€/ud, Maison10,50€/ud. Paquetería6,90€/pedido o12,90€ premium; embalaje0,90€/2,40€; cobro3%, reserva de devoluciones2%. Parámetros de juego. Portes incluidos o aportación cliente3€/pedido (demanda×0,82). Envío claramente superior al suministro a tiendas peninsulares.
- Solo se aceptan pedidos con excedente real y personal disponible; cajas completas. Tiendas, franquicias y contratos conservan prioridad y su indicador de suministro. La demanda online potencial no servida se informa aparte, sin comprometer ventas que no se han aceptado.
- Producción incluye online una sola vez. Costes separados: materias, transporte y otros (embalaje/cobro/devoluciones/cuota), nóminas de preparación aparte de fabricación. Los regalos usan el excedente restante.
- Personal online cuenta para vivienda, inspecciones y nómina; abrir/ampliar valida oferta laboral antes de pagar. Pausar elimina ventas, cuota y plantilla del canal, reanudar sin volver a pagar la apertura.
- Marketing nacional, I+D aplicable, reputación, fama, temporada y tradición de diciembre impulsan tráfico; publicidad local o extranjera no se convierte en tráfico nacional online. Logística operativa y rutas reducen portes sin volverlos transporte a granel.
- UI Mercado: previsión de apertura, abrir/ampliar/pausar/reactivar, política de portes, pedidos potenciales/aceptados, unidades, costes desglosados, margen y resultado antes de impuestos. Partidas antiguas empiezan sin canal, estado validado; informe y parte mensual reconocen online.
- Sin nuevas imágenes ni dependencias; no push ni cierre del juego del usuario.

## Revisión enfocada
Escasez sin quitar producto a tiendas; unidades enteras/cajas y producción≤capacidad; ausencia de doble coste; stockcero con costes fijos visibles; margen unitario inferior al retail; personal/viviendas; pausar/cargar; anuncios nacionales sin fugas de ámbito.

## Tareas
- [x] Tests rojos de apertura, excedente, costes/margen, prioridad, plantilla y estado.
- [x] Datos, núcleo y economía; acciones y migración/validación.
- [x] Panel y controles Mercado, informes y marketing; pruebas UI escritorio/móvil.
- [x] Suite, simulación con cargas, revisión independiente y reparaciones.
- [x] Docs, commit, portable0.11.0 y smoke.

## Registro
- Diez regresiones online: apertura única, cajas/stock/producción, costes y personal únicos, prioridad de suministro, portes, pausa, marketing, validación de niveles/vivienda, margen Maison y consejos. Tests iniciales rojos antes de implementar; el consejo de pérdidas falló antes de corregirse y pasa después.
- Demanda potencial es tráfico; solo pedidos aceptados por stock y personal entran en totalDemand. Esto mantiene la semántica de fill para tiendas/contratos y no contabiliza ventas inexistentes. Previsión de apertura muestra también cambio en resultado total, incluyendo fabricación común.
- Revisión independiente sin fallos importantes; matriz de96combinaciones de marcas/niveles/capacidad/contratos con producción≤capacidad, cajas completas, ingresos y personal coherentes. Consejo menor de reformar/vender un canal virtual se sustituyó por consejo de excedente/portes/pausa con destino Mercado.
- Edge1365×900 y375×812: abre15k, portes compartidos, pausa a cero ventas/cuota/sueldos, reactiva, amplía45k+140k a nivel3, cierre coincide con previsión y recarga mantiene nivel/actividad/portes. Sin errores/desbordamiento; captura móvil inspeccionada.
- Dos simulaciones de120meses (Express/Maison) con caja/capacidad altas para aislar canal, ampliaciones, portes, pico mayorista, pausa y reactivación:240cargas conservan neto/RNG,9.494.688uds online,2meses sin stock, producción siempre dentro de capacidad, sin final inesperado. No se presenta como medida de dificultad de una partida inicial.
- Verificación final: 271/271 Node y 18/18 DOM. Precios unitarios/paquetería con dos decimales verificados en regresión DOM roja/verde; formato corregido y flujo UI repetido. Build y smoke desempaquetado correctos, sin errores JavaScript.
- Smoke del portable 0.11.0 con salida 0. Sin push.
