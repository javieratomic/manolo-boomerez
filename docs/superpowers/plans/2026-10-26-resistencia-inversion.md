# Resistencia de inversiones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Comparar mantener empresa y reformar un lote bajo supuestos explícitos de demanda y salarios, con liquidez después del cierre.
**Architecture:** core/stress.js transforma copias mediante modificadores existentes y wageIndex, calcula computeEconomy y reserva de renovaciones. ui/stress.js muestra escenarios en subvista de Finanzas; botón en cartera transfiere ids sin ejecutar inversión.
**Tech Stack:** JavaScript puro, Node/DOM, Playwright/Edge y Electron existentes.
**Spec:** Diseño incluido; usuario delegó siguiente mejora y detalles. No requiere otra aprobación.

## Diseño

Cuatro escenarios: condiciones actuales; demanda comercial de locales y online ×0,85 (pedidos mayoristas/licencias vigentes se mantienen); base salarial ordinaria ×1,10 (no becas/sueldos fijos de directivos); combinación. Modificadores sobre copias para el mismo mes, sin avanzar tiempo ni asignar probabilidades. Comparar base sin inversión y copia con lote válido aplicado vía upgradeBatch. El coste de inversión se descuenta una vez, como ya hace dicha acción.

Cada caso expone neto, caja después de este cierre antes de nuevo crédito/ventas/sucesos, nóminas plantilla+directivos, empleados/cobertura, renovaciones del mes incluidas en neto y futuras (meses+1..+12) a coste de reposición actual. Colchón orientativo =3nóminas+renovaciones futuras; margen=caja después de cierre-colchón. Excluir renovación actual del colchón evita duplicar el cobro. Mostrar déficit de caja y estar bajo colchón por separado. No es dinero bloqueado ni nueva regla. No extrapolar un mes ni dar plazos de supervivencia repitiendo costes extraordinarios.

Finanzas tiene subvista Balance/Resistencia. Sin lote, muestra estado actual; desde Cartera → Probar escenarios transfiere ids elegibles a comparación. Muestra nombres, niveles y coste del lote; ninguna acción ejecuta reformas. Volver a cartera devuelve selección revisable. Si ya no es válido, avisa sin ocultar baseline ni aplicar parte. Botón quitar comparación mantiene escenarios actuales. UI state temporal se reinicia al cargar. Foco/scroll adecuados sin pestañas nuevas.

## Global Constraints

- Español, no nuevas dependencias, ni push ni perfil real. No cambiar economía, guardados ni arte.
- 0.15.0 con portable, handoff y commit local.
- Browser plugin not available; Edge/Playwright temporal.

## Review Focus

- Contratos/license/online y franquicias con sensibilidad distinta: no reducir directamente ingresos o sumar deltas aislados.
- Becas y directivos no indexados; salario base no se etiqueta como toda nómina +10%.
- Renovaciones vencidas/actuales/futuras y reforma que altera coste de reposición, no contar dos veces.
- Lote obsoleto, fondos insuficientes, navegar sin comprar, ninguna mutación o RNG.
- Cierre de mes sin nuevos sucesos frente a computeEconomy; móvil320px, foco y acceso a financiación.

## Tareas

- [x] Tests rojos núcleo: escenarios, shocks reales, comparación, reserva/renovaciones, pureza y lote inválido.
- [x] Implementar core con funciones existentes, pruebas verdes y métricas.
- [x] Tests DOM rojos, subvista y transferencia de selección, controles/foco.
- [x] Simulación, batería, navegador y revisión independiente.
- [x] Metadatos, build/smokes, documentación, handoff y commit propio.

## Registro

Inicio: main limpioe9a5ab4, 0.14.0. Usar writing-plans y ejecutar inline según autorización persistente de decidir entregas. Economía sin cambios, herramienta de comparación solamente.

- Núcleo10/10tests específicos: cuentas reales, inversión una vez, renovación actual/futura, contratos/regalías, online/becas/directivos y lote obsoleto. Primera prueba de regalías se centró en foreignRevenue, no ingreso total, porque el mostrador del obrador sí responde al supuesto comercial.
- RenovationSchedule extraído de operations sin cambiar forma/orden; sus7tests continúan verdes.
- Ruling: guardar items de cotización en UI y pasarlos opcionalmente a stressReport — una comparación debe conservar los niveles que estudias, incluso después de ejecutar el lote — si cambian, baseline visible y aviso de reelección. Regresión roja/verde.
- DOM34/34; Edge1365×900,375×812,320×812: transferencia/casos/financiación/foco/consulta pura/compra posterior/invalidez/quitar/recarga. Escenario de prueba demuestra margen actualpositivo32k€ y tras lote negativo21k€ bajo ambos cambios; capturas inspeccionadas.
- Simulación24meses, consulta solo en una rama: estado/RNG íntegros. Informe comparativo completo200negocios~44ms. No es benchmark de dificultad de partida normal.
- Revisión independiente y delta final sin hallazgos; estado congelado y supuestos de online/becas/directivos/residencias verificados adicionalmente.
- Batería completa298/298Node y34/34DOM. Metadatos0.15.0; empaquetado iniciado solo tras estabilizar código y QA.

- Entrega: build y smoke desempaquetado/portable salida0. Fuentes definitivas copiadas verificadas, dependencias intactas, handoff y commit propios, sin push ni alteración de perfil real.
