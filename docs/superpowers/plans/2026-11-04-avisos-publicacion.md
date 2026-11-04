# Avisos fiables y publicación pública — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. El usuario delegó diseño/ejecución y ahora autoriza expresamente push, repositorio público y juego público. No reactivar la automatización terminada.

**Goal:** Cerrar los dos avisos pendientes y publicar una entrega jugable y revisable con fuente, README y capturas reales.

**Architecture:** Recuperar indicador offline solo tras verificar una copia activa superviviente, con guardia contra respuestas obsoletas. Alertas financieras fechadas según último cierre; avisos de estado siguen siendo actuales. Preparación estática separada de herramientas/documentos y despliegue GitHub Pages con pruebas antes de publicar.

**Tech Stack:** JS sin dependencias, Node22, Edge/Playwright, GitHub CLI y Actions/Pages oficiales.

## Ambición y decisiones

Altitude: corregir avisos → preparar entrega documentada → publicar y comprobar el juego público. Depth: reproducir actualización fallida/copia incompleta/carrera de respuestas y ampliar obrador conservando informe histórico. Jueces: regresiones, navegador local y URL pública, metadatos de visibilidad GitHub y árbol limpio. Range omitido: no se rediseña el juego.

Prompt elevado: «Corrige disponibilidad offline y fechas del mapa sin cambiar economía ni guardados. Publica el proyecto completo como repositorio público, con README y capturas de una partida de demostración, y una URL jugable. Pasa cuando pruebas y navegador confirmen los avisos, GitHub muestre fuente público y la web funcione desde su subdirectorio.»

Disponibilidad: al fallar candidato/registro se consulta active/controller activado, distinto del candidato roto. Solo respuesta OFFLINE_STATUS ready permite avisar de copia guardada disponible; si falta también se conserva no disponible. Respuestas antiguas no pisan un controlador nuevo.

Mapa: pérdidas, competencia y cobertura provienen de lastReport, se expresan en pasado con mes/año. Sin mes, Último cierre genérico. Franquicias, conservación, ilegalidad y huelga se leen del estado actual y no reciben fecha falsa. No añadir simulación al dibujo.

Publicación: cuenta autenticada javieratomic (conector y CLI coinciden), sin remoto; nombre disponible manolo-boomerez. README existente MIT se conserva como base documental, nueva portada pública y galería. Capturas reales, perfiles de demostración aislados. Site solo index/styles/manifest/icon, src, assets y worker/catálogo; sin herramientas/configuración local/documentos. Flujo oficial Pages. Revisión de1112blobs de texto históricos sin patrones de credenciales antes de publicar; no publicar ejecutable en Git, usar Release.

## Restricciones y revisión

- No economía/SAVE_VERSION nuevos, datos de usuario ni perfiles reales.
- Indicador no anuncia listo basándose solo en existencia del worker.
- Guardias de versión evitan sobrescribir estado del aviso con respuestas tardías.
- Avisos históricos preservan umbrales, ids y severidad; avisos actuales preservan semántica.
- No force push, no alterar repositorio ajeno; crear uno nuevo en cuenta autenticada.
- Permisos mínimos de Actions; código del juego no necesita claves ni backend.

## Task 1: Avisos y regresiones

- [x] Escribir/observar rojo de copia superviviente, copia incompleta, registro fallido y respuesta tardía.
- [x] Extraer observador comprobable manteniendo prepareOffline sin argumentos para producción; implementar recuperación verificada.
- [x] Escribir/observar rojo de fecha/pasado tras mejora real, pérdidas/competencia y fallback sin fecha; preservar avisos actuales y pureza.
- [x] Implementar textos; pruebas focalizadas y QA real de actualización fallida y mapa a1365/375/320.

## Task 2: Entrega pública

- [x] Preparador de sitio y workflow; README público y capturas inspeccionadas.
- [x] Revisión independiente, Node/worker/DOM completos, catálogo, staging y portable/smoke.
- [x] Commit local, crear repo público, push, habilitar Pages, Release y comprobar despliegue/visibilidad/URL jugable.
- [x] Handoff final y árbol limpio/sin commits pendientes de push.

## Registro

- Base416c337, árbol inicialmente limpio. GitHub CLI autenticado, sin origin; repositorio propuesto devuelve404.
- Browser plugin not available; Edge/Playwright incluido. Capturas sin tocar perfiles reales.
- Docs primarias de Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- RED2/3alertas y4DOM por función ausente; GREEN358simulación+14worker+60DOM=432únicas. Consejo histórico de Paco también se corrigió con rojo/verde, sin recalcular economía.
- QA real de copia disponible/incompleta y actualizaciónB fallida/buena, estados/cachés conservados;3anchos mapa muestran Enero2026 pasado mientras cobertura actual100%. Sin excepciones ni cambios de estado. Staging offline/subdirectorio/nueva partida correcto.
- Revisión independiente sin hallazgos,3focalizadas pasadas y capturas desktop/móvil inspeccionadas. Scripts de captura esperan boot antes de Nueva partida: la primera ejecución intentó pulsar antes de handler y se corrigió la espera, no el producto.
- Publicación autorizada ejecutada: repo nuevo público javieratomic/manolo-boomerez, historial completo sin forcepush, Pagesworkflow activado y HTTPS. CI372pruebasNode+worker ydeploy verdes, run41875071687/código8932b29.60DOM locales adicionales=432 únicas. Releasev0.21.5 conportable148.414.333bytes ysourcearchives GitHub.
- Comprobación anónima HTTP200 README/captura/Release y juego real1365/390: versión0.21.5, nueva partida y mes1, recargaoffline del guardado, sin errores ni overflow. Capturas públicas inspeccionadas. Actualización final de documentación no altera código ni requiere otro deploy.
