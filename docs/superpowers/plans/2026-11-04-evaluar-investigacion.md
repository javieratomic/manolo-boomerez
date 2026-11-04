# Evaluar investigación — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Ejecución y diseño delegados por usuario; continuar sin aprobaciones repetidas.

**Goal:** Elegir I+D por su efecto real sobre el imperio actual, incluyendo cuellos de botella de personal.

**Architecture:** Informe puro researchPlan(s,id) sobre copias, aplicando tickRD a la innovación elegida sin avanzar calendario. Modal de lectura desde cada proyecto pendiente, incluso bloqueado o en curso. Sin nuevas reglas ni guardados.

**Tech Stack:** JS sin dependencias; pruebas Node/DOM; navegador Edge aislado.

**Spec:** Diseño incluido debajo.

## Ambición y diseño

Objetivo final: que invertir en tecnología sea una decisión informada. Altitude: describir beneficios → cuantificar efecto en cartera real → avisar de limitaciones antes de invertir. Depth: partir del estado actual y de tickRD/computeEconomy/workforcePlan; juez = finalización real en copia y equivalencia exacta, pureza en partidas emparejadas y QA de interacción. Meta: cero efectos secundarios y cero fórmulas económicas duplicadas. Range se omite por ser un flujo concreto.

Prompt elevado: «Permite evaluar una innovación sobre mi imperio actual sin comprarla. Usa las reglas reales para mostrar beneficio, capacidad y empleo, avisa de falta de vivienda y separa coste/plazo de un supuesto de finalización hoy. Pasa si coincide con completar realmente el proyecto en una copia y no cambia mi partida ni RNG.»

Elegido: botón Evaluar, cálculo bajo demanda. Descartado: calcular todos los proyectos al renderizar (coste innecesario) y prever meses futuros reales (requeriría supuestos de eventos y decisiones). Comparación Actual/Con innovación en el mes de hoy: no finaliza otras I+D ni obras ni simula financiar el coste. Si el proyecto está en curso, coste pendiente0 porque ya se pagó; muestra mesesLeft. En otro caso muestra coste íntegro, duración actual con directivo y motivo de bloqueo si existe. Puede estudiar un proyecto bloqueado; no permite saltarse requisitos. Proyecto investigado/desconocido devuelve okfalse.

Informe devuelve id/name/status/startable/reason/costDue/months, before/after {net,capacity,fill,employees}, workforce [{city,before,after}], unlock nombre o null. before/after de workforce incluyen required/available/missingBeds. Solo ciudades propias y Selaya, sin inventar personal de franquicias.

Modal: coste restante, plazo, bloqueo, tabla comparativa, diferencias de vivienda por ciudad si existen, desbloqueo y limitaciones claras. Solo Cerrar; desarrollo conserva su acción real y validación actual. Mantener filtros/foco después de cerrar.

## Global Constraints

- Sin dependencias, IDs de arte, cambios de equilibrio ni SAVE_VERSION.
- Consulta no gasta, inicia, termina ni reemplaza I+D real; no RNG/calendario/objetivos.
- Investigaciones de desbloqueo no incluyen ficticiamente negocios nuevos en beneficios.
- Coste ya pagado de un proyecto en curso no se cobra otra vez en la presentación.
- UI en español, sin añadir una pantalla ni más scroll a cada tarjeta.

## Review Focus

- Contratos de I+D y fama deben entrar como en tickRD, con suministro real.
- Producción adicional limitada por plantilla debe mostrar capacidad efectiva y plazas necesarias.
- Otro proyecto activo debe conservarse intacto al estudiar alternativas.
- Evaluar nunca se convierte en Desarrollar; doble clic no apila modales.
- Filtros y foco deben sobrevivir al cierre y funcionar a320px.

## Task 1: Informe, modal e integración

**Files:** src/core/research.js y src/ui/research.js nuevos; core/market.js duración compartida; ui/panels.js,ui/app.js; tests/research.test.js,dom.test.js y registros.

**Interfaces:** researchDuration(s,id) comparte plazo con startRD; researchPlan(s,id) devuelve informe antes descrito; renderResearchReview(plan) devuelve HTML sin acciones.

- [x] Pruebas rojas de finalización real, pureza/RNG, contrato/fama, cuello de vivienda, bloqueo y proyecto en curso/alternativo, proyecto ya investigado.
- [x] Implementar cálculo usando tickRD en copia y métricas de economía/personal, duración compartida.
- [x] DOM rojo/verde: Evaluar en pendientes/bloqueados/activo, sin botones ejecutores en modal, cifras y límites correctos.
- [x] Integrar modal de solo lectura con guardia anti duplicados y restauración de foco.
- [x] Suite completa, DOM y QA real a1365/375/320: filtros, evaluar/cerrar puro, proyecto en curso y guardado; capturas inspeccionadas.
- [x] Revisión independiente y regresiones necesarias; versión, ayuda, HANDOFF, build/smokes y commit.

## Registro

- Base bb0df8b, árbol limpio; límite de autorización15:45UTC. Lote0.20 ya terminado; no repetirlo.
- RED inicial5núcleo y3DOM por módulo/controles ausentes. GREEN6núcleo y54DOM,341/341 suite Node completa. Casos posteriores: duración real del directivo y etiqueta accesible, ambas con regresión roja/verde.
- Hallazgo adicional: tarjetas antiguas mostraban plazo de catálogo incluso con Operaciones. Ahora comparten researchDuration con startRD. Proyecto ya activo conserva monthsLeft, aunque cambie el directivo, y muestra Ya pagado. Regresión DOM roja/verde y contratación real en QA.
- QA3anchos: filtros/foco conservados, consulta pura, investigación real iniciada una vez, directivo contratado después sin cambiar plazo activo, coste pendiente0, alternativas bloqueadas estudiables, dobleclic1modal, Escape/cerrar y recarga. Sin errores/desbordamientos; capturas inspeccionadas tras animación. Script inicial intentaba cerrar antes de guardia350ms existente: corregido a esperar400ms, sin cambiar esa protección.
- Revisión independiente review_research021 sin hallazgos; comprobó además420combinaciones producto/estado y6tests focalizados. Simulación emparejada576meses: estado/RNG exactos; informe200negocios~3,2ms. Migración0.20→0.21 conserva caja/neto/patrimonio/RNG.
- Rebuild final necesario por corrección tardía de etiqueta del proyecto activo; primer artefacto0.21 no se entregó. No cambió lógica económica.
- Build definitivo y ambos smoke ocultos correctos, salida0, perfiles temporales;107archivos fuente coinciden y dependencias intactas. Entrega0.21.0 estable, sin hallazgos abiertos ni cambios ajenos.
