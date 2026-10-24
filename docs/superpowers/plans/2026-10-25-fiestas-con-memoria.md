# Fiestas locales con reputación y memoria

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Oportunidades locales sensibles a reputación y celebraciones anuales que evolucionen.
**Architecture:** Reglas declarativas de localidad y funciones puras de memoria/bonus en core/localEvents.js; decorar cartas existentes preservando ids y arte. Nochevieja conserva ciudad_salamanca y gana progresión propia. Estado validado/migrado, multiplicador de sobaos reutilizado por economía y previsiones.
**Tech Stack:** JavaScript puro, Node y Edge/Playwright; sin dependencias nuevas.
**Spec:** Petición del usuario y equilibrio delegado en la conversación.

## Diseño
- Fallas (historia del ninot) y concurso de patios: una sola oportunidad por partida; no se fuerza su aparición cada año.
- Pamplona, Zaragoza, Salamanca y otras celebraciones de calendario (Sevilla, Carnaval de Las Palmas y Murcia) anuales; calendario de resolución real, sin perder años por cooldown de once meses desde la última decisión.
- Todas las cartas locales con opciones y resultados registrados. Peso de oportunidades sube con reputación, conflictos bajan; textos recuerdan la última elección. Repetir buenos acuerdos aporta hasta10% adicional local durante el mes festivo; repetir abusos añade pérdida de reputación. Sin RNG en lectura/previsión.
- Solo negocios operativos dan acceso; guardar/cargar conserva memoria. Cartas antiguas ya vistas no se vuelven a ofrecer si ahora son puntuales.
- Nochevieja: cuatro patrocinios exitosos en años distintos elevan nivel0→4. Costes3k/12k/45k/100k, reputación mínima40/50/60/70, moral35 y suministro90%. Una misma edición no puede cobrar/progresar dos veces. Saltarse años no fabrica éxitos.
- Nivel1 local, nivel2 ciudades de Castilla y León, nivel3 campaña nacional de ese diciembre, nivel4 tradición permanente: demanda española de sobaos +15% cada diciembre. Reputación<30 reduce el bonus a la mitad. Sin bonus fuera de diciembre, en el extranjero ni en negocios ajenos a sobaos. Suministro insuficiente o mala organización pueden hacer fallar el patrocinio.
- Estado visible en Ciudad; tradición y etapa visibles en Mercado. Opciones alternativas permiten recuperar confianza o asumir riesgos sin comprar un ascenso.
- Ids y arte existentes; no regenerar imágenes. No push ni cerrar juego del usuario.

## Revisión enfocada
Duplicados en mismo año; año siguiente válido por fecha de cola/resolución; migración sin éxitos inventados; estado puro/RNG; bonus nacional limitado por producto/mes/país; fiestas simultáneas sin bloqueo por un único evento forzado.

## Tareas
- [x] Pruebas rojas de repetición, reputación, memoria, calendario y cuatro patrocinios.
- [x] Reglas/estado/validación y decoración de cartas; Nochevieja y economía.
- [x] Interfaz y pruebas reales escritorio/móvil, carga y simulación plurianual.
- [x] Suite completa, revisión independiente y correcciones.
- [x] Docs, commits locales, portable0.9.0 y smoke.

Ejecución directa autorizada; detalles resueltos por el agente según la delegación previa.

## Registro de ejecución
- Nueve regresiones locales: repetición puntual, reputación, repetición anual real, memoria, abuso repetido, progresión/suministro/doble pago, pureza, fiestas coincidentes, migración y clasificación de resultados. Fallaron antes de implementar/corregir y pasan después.
- La capacidad prevista incluye el nuevo bonus local y la extensión de etapa; el último informe también debe haber servido90%. El patrocinio oficial tiene resultado determinado por estos requisitos; el reto viral sigue siendo arriesgado con probabilidad sensible a reputación.
- Revisión independiente: Murcia folletos y patrocinio exitoso de Las Palmas estaban mal clasificados como conflictos. Se corrigieron reglas y reconocimiento de aumentos reales de reputación; regresión de dos años, cierre sin hallazgos importantes.
- 252/252 Node,15/15 DOM. UI real en Edge1365×900 y375×812: cuatro patrocinios, resultado y Mercado con tradición4/4, bonus solo sobaos/ES/diciembre, recarga, sin errores ni desbordamiento. Capturas inspeccionadas.
- Simulación72meses con caja/capacidad elevadas y conservación del local de Salamanca (se rechazan ofertas de venta): etapas1/2/3/4 en meses11/23/35/47, siguientes años nivel4;72guardados/cargas sin alterar cuentas ni RNG. No es una medición de la dificultad de una partida inicial.
- Versión 0.9.0, compilación y smoke de desempaquetado y portable correctos (salida 0). No cambia arte, no hay push.
