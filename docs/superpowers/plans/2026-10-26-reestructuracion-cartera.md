# Reestructuración de cartera Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Vender o rescindir varios negocios con revisión del efecto conjunto y pruebas de resistencia.
**Architecture:** core/divestment.js simula sellBusiness en copia, ventas positivas antes que indemnizaciones, plan/ejecución atómicos. Cartera reutiliza filtros/páginas/selección con modo upgrade/sale. Stress admite operación opcional sin alterar compatibilidad del modo reformas.
**Tech Stack:** JavaScript puro y herramientas existentes Node/DOM/Edge/Electron.
**Spec:** Diseño incluido; usuario delegó mejora y detalles. No requiere otra aprobación.

## Diseño

Modo explícito Reformar/Vender y rescindir en cartera; cambiar modo limpia selección. Venta admite negocios físicos existentes incluso máximos, franquicias y obras según regla individual. Mantener selección entre páginas y normalizar según filtro vigente/modo. Ninguna venta automática. Lote revisa nombres/ciudades/ids/importe por activo, ingresos de ventas, indemnizaciones, movimiento neto de caja. Casas, obradores y sinergias se valoran conjuntamente con computeEconomy; alertar caída de capacidad/cobertura y nuevas necesidades de vivienda a doce meses. No usar beneficio aislado para sugerir una venta.

Núcleo valida ids/deduplica y comprueba ejecución íntegra en copia: ventas primero, rescisión después, de modo que ingresos del lote pueden cubrir cánones. Una rescisión sin fondos bloquea todo. Vender activos propios sigue permitido en descubierto, igual que regla actual. No cambia valor de reventa ni penalización de franquicia. Ejecutar exige comparación de cotización si la UI la proporciona (mes/items/caja/métricas/riesgos), recalculada antes de aplicar; si cambia no se vende nada. Solo cash/businesses/log cambian, equivalentes a acciones individuales en orden planificado. Sin borrar estadísticas/flags, contratos o historia.

Stress recibe operation opcional ('sale', default'upgrade'); usa saleBatchPlan/saleBatch en copia y conserva items revisados para no reemplazar activos silenciosamente. En comparación de venta: Mantener/Reestructurar, movimiento firmado de caja en vez de inversión, retiros de viviendas afectan nóminas/capacidad/renovaciones. Sin compra/venta en Stress. Retorno a cartera restaura modo e ids, comparar se reinicia al cargar.

## Global Constraints

- Español, sin nuevas dependencias/arte ni push, preservar perfil real y guardados.
- 0.16.0 con portable, handoff y commit local.
- Browser plugin not available; Edge/Playwright en perfiles temporales.

## Review Focus

- Devolución de canon histórico, obra, nivel máximo y descubierto; no tratar indemnización como ingreso.
- Fondos insuficientes e ids inválidos o cotización obsoleta, ninguna mutación parcial.
- Venta de vivienda o producción afecta negocios que permanecen y empleo ahora/futuro.
- Modo venta no hereda selección de reformas ni invierte al volver de Stress; cancelar/doble clic/recarga.
- Caja de stress descuenta/suma operación una vez; contratos/SAVE_VERSION/flags quedan intactos.

## Tareas

- [x] Tests rojos de núcleo: precios, financiación cruzada, atomicidad, vivienda/producción, stale quote y pureza.
- [x] Implementar núcleo reutilizando sellBusiness, stress y selección compatibles.
- [x] Tests DOM y controladores, revisión explícita, alertas y modo/contexto.
- [x] Simulación, batería, navegador y revisión independiente.
- [x] Versionar/empaquetar/smokes, documentación/handoff y commit propio.

## Registro

Inicio main limpio c0b1dd9,0.15.0. Usuario delegó decisión de próxima mejora. No cambiar economía; facilitar evaluación y ejecución de reglas actuales.

- Núcleo10/10tests específicos, DOM38/38 y batería308/308Node. Preservar defaults upgrade en selección y Stress.
- Ruling: mostrar patrimonio y pérdida de países/sectores además de liquidez — convertir patrimonio en caja no equivale a crear riqueza y puede alejar meta europea — solo métricas con funciones existentes, no cambios económicos.
- P2 revisor reproducido rojo: dos bloques Selaya ready2/4, vender primero prolongaba carencia sin cambiar pico/inicio/actual. Verde tras comparar timeline completo por ciudad/mes; worseMonths forma parte de revisión y guardia de cotización. Revisor cerró P2; prueba DOM exige Marzo2026/2cierres.
- QA tres tamaños1365/375/320: venta+rescisión y volver deStress con modo correcto, cancelación, presupuesto actualizado, doble clic, ahorro de canon histórico, vivienda/obra/máximo, guardado. Repetición secuencial pasa; arranques paralelos anteriores dieron timeout sin error de aplicación reproducido. Portada y fuente0.16 comprobadas.
- Simulación24meses/6lotes frente a individuales conserva estado/RNG. 200negocios, lote100: plan12ms, stress36ms. Revisión independiente40lotes equivalentes, identidades de retenidos preservadas.
- Fuentes funcionales estabilizadas y QA completado antes de iniciar build0.16.0.

- Cierre:308/308Node y38/38DOM; build/smokes desempaquetado y portable salida0. Fuentes copiadas verificadas, dependencias intactas. Handoff y commit propios, sin push ni modificación del perfil real.
