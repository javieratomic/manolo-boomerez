# Offline fiable desde la primera visita — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. El usuario autorizó revisión y mejoras autónomas por entregas hasta15:45UTC.

**Goal:** Poder reabrir y continuar el juego sin red después de su primera preparación offline, sin una segunda visita online oculta.

**Architecture:** Catálogo generado y verificado de código/HTML/CSS/SVG pequeños. Instalación atómica del service worker con hashes por archivo y caché propia por ruta/revisión; código cache-first coherente y arte network-first independiente. Estado de preparación visible, sin bloquear el juego online. No tocar guardados ni simulación.

**Tech Stack:** JS/Node22 sin dependencias; node:test y VM para ciclo de worker; Edge real en contexto aislado para offline/update/fallo.

**Spec:** Diseño y decisiones incluidos aquí.

## Evidencia y ambición

Reproducción con contexto nuevo, registro después de boot (mismo orden que producción): worker activado, caché0 archivos; cortar red y recargar falla ERR_FAILED. Segunda visita online deja290 entradas y entonces sí arranca offline. README promete PWA sin conexión. No es un fallo de partida ni del portable.

Objetivo más alto: conservar la posibilidad de jugar sin depender de recordar una recarga. Altitude: reproducir → preparar todos los recursos de ejecución → comprobar actualización incompleta y recuperación sin perder versión anterior. Depth: partir de solicitudes/caché/lifecycle reales; comparar hashes y forzar desconexión/corrupción/cachés ajenas. Meta: primera preparación verificable, cero mezclas de versiones de código y cero borrados de otras aplicaciones. Range omitido.

Prompt elevado: «Haz fiable el juego offline desde la primera visita preparada, con estado visible. Verifica recursos de código completos antes de activar una versión, conserva la anterior si falla la descarga y mantén las entregas de arte independientes. Pasa si un perfil nuevo puede cortar red, reabrir, cargar y cerrar un mes; una actualización corrupta no sustituye la copia anterior; nada cambia en estado/RNG.»

Referencias primarias consultadas: [ciclo del worker](https://developer.chrome.com/docs/workbox/service-worker-lifecycle), [actualización de importScripts/updateViaCache](https://developer.chrome.com/blog/fresher-sw/), [aislamiento de cachés](https://web.dev/articles/service-worker-lifecycle). No se instala librería.

## Diseño y alternativas

Elegido: catálogo generado con sha256 para index.html,styles.css,manifest.webmanifest,icon.svg, todos los src/**/*.js y assets/ui/rd_*.svg. Un script offline-files.js importado por sw.js incluye revisión del conjunto. Generador tools/offline_catalog.mjs, `--check`, se ejecuta también antes de empaquetar. El runner Node verifica que no esté obsoleto. La web sigue siendo archivos estáticos, sin dependencias ni compilación de JS.

Descartado: precargar todo el arte (36,65MB), registrar antes de boot y retrasar el arranque, o confiar en las entradas de performance (buffer parcial). El catálogo de arte NO forma parte de los hashes: los agentes pueden entregar imágenes/manifest sin regenerar código offline. Las imágenes descargadas con un worker activo se guardan como respaldo; las que falten usan los marcadores existentes.

Worker: cache name con prefijo propio y directorio de instalación, código de una revisión en caché primero. Install espera descargas verificadas; ante cualquier fallo borra solo la revisión incompleta y no activa. Activate borra solo revisiones previas del mismo directorio. Conserva cachés ajenas y de otras instalaciones. Arte/manifest usan red primero con escritura ligada a waitUntil; fallo de caché opcional no rompe una respuesta online. Caché de arte separada y persistente entre revisiones. Las navegaciones a raíz/index con query usan index de la revisión si no hay red; no se inventa respuesta para otras rutas. Solo GET same-origin del juego.

Mensaje OFFLINE_STATUS con MessageChannel verifica que los archivos del catálogo estén presentes antes de anunciar listo. UI no bloqueante en título: Preparando / Disponible / No disponible, con role=status; oculta en localhost y Electron como hasta ahora. Actualización se registra con updateViaCache:none; espera worker activo antes de consultar y reevalúa al cambiar controlador. Error no toca la partida ni impide jugar online.

## Global Constraints

- Sin dependencias nuevas ni cambio de SAVE_VERSION ni economía.
- No borrar datos de usuario ni perfiles reales; QA con contextos nuevos.
- Código de una revisión completo o no activado. Arte incremental independiente.
- Preservar cachés ajenas y de otra ruta del mismo origen.
- Servidor de desarrollo sigue sin registro automático. Prueba de producción con dominio.test resuelto localmente en navegador aislado.

## Review Focus

- Fallo parcial y hash incorrecto deben conservar versión anterior, incluso durante escrituras pendientes.
- Actualizar solo archivos importados debe instalar nueva revisión; no sobreescribir código antiguo con red futura.
- Instalación en subdirectorio y navegación con query deben resolver módulos correctamente offline.
- Cuota/caché de arte fallida no debe convertir respuesta online correcta en fallo.
- Readiness no debe dar falso positivo si el catálogo está incompleto o el worker anterior aún no responde.

## Task 1: Catálogo e instalación fiable

**Files:** tools/offline_catalog.mjs, offline-files.js generado, sw.js, tests/offline-worker.test.mjs; tests/run-node.mjs y desktop/prepare.mjs.
**Interfaces:** offlineCatalog(root) devuelve {revision,files:[{file,sha256}]}; writeOfflineCatalog(root), checkOfflineCatalog(root). Worker escucha install/activate/fetch/message.

- [x] Escribir pruebas Node de catálogo completo/actual, install completo, corrupto/parcial, limpieza solo propia, shell coherente, arte fresco y persistente, offline navegación y estado listo.
- [x] Observar rojo por generador ausente; implementar catálogo, observar rojo del worker antiguo; implementar lifecycle verificado.
- [x] Integrar comprobación/generación en pruebas y empaquetado; ejecutar focalizado verde.

## Task 2: Preparación visible y QA

**Files:** src/ui/offline.js, ui/app.js, index.html; DOM; documentación/versión/handoff.
**Interfaces:** prepareOffline() inicia registro solo en contexto de producción elegible; elemento #offline-status.

- [x] DOM rojo/verde de indicador y exclusión de desarrollo; implementar helper sin bloquear boot.
- [x] Perfil nuevo de navegador: primera preparación, desconexión, recarga raíz/index/query, continuar guardado y cerrar mes a1365/375/320.
- [x] Actualización buena y fallida, código coherente, subdirectorio, arte posterior independiente y caché ajena intacta.
- [x] Revisión independiente, suite completa, capturas, versión0.21.1, build y smoke, HANDOFF y commit.

## Registro

- Base7ae47cd, árbol limpio; fecha04-11-2026; autorización termina15:45UTC.
- Reproducción guardada en %TEMP%/boomerez-offline-probe.cjs. Browser plugin not available; Edge/Playwright del runtime.
- RED: generador ausente; después1/8worker y54/55DOM. Fallos posteriores de recuperación de archivo y worker/catálogo desincronizados fijados con rojo/verde. Resultado final:341simulación+14worker+56DOM=411 únicas.
- Hashes de texto normalizan CRLF/BOM, porque Git convierte líneas al publicar. Catálogo145archivos~1.012MiB, excluye PNG/manifest de arte. Código cache-first, arte network-first con waitUntil síncrono y respaldo legacy boomerez-v1 por URL exacto.
- QA real de producción local boomerez.test:8080 con origen seguro solo en navegador de prueba. Primera preparación457–626ms en esta máquina; cortar red en primera visita, navegar index/query, cargar, abrir Finanzas e I+D, cerrar mes con caja exacta y recargar mes1, a1365/375/320. Capturas inspeccionadas; arte ausente usa marcadores declarados, sin excepciones JS.
- Servidor de prueba en memoria8081: revisiónB con styles500 conservaA offline, Bbuena actualiza solo importScripts/catálogo, conserva guardado, arte posterior y cachés de otra ruta/app. Migración del worker original conserva arte legacy offline. No se modificaron archivos para simular las revisiones.
- Ajuste de ciclo detectado en QA: instalado/en espera es una preparación válida; UI distingue actualización preparada/aplicación al reabrir y observa updatefound. Solicitar skipWaiting después de descargar todo, sin await de la transición dentro de install, evitó bloqueo al migrar el worker antiguo. Regresión con activación diferida roja/verde, sin temporizadores de rendimiento. Versión anterior no se borra por instalación fallida.
- Instrumentación temporal retirada. El runtime Playwright disponible trata una Promise como truthy en waitForFunction: se reprodujo con predicado async false. QA final usa eventos de controllerchange/estado síncrono y espera asíncrona desde Node, sin sondear continuamente al worker (lo mantenía ocupado). Los recorridos finales completos pasan.
- Revisión independiente review_offline0211 sin P1/P2. **Minor diferido P3:** si falla una actualización, el indicador puede avisar de preparación no disponible aunque siga intacta una copia anterior; aviso conservador, no pérdida de funcionalidad/guardado. No se altera por esta entrega.
- Build definitivo, fuentes108archivos coincidentes, dependencias sin cambios, ambos smoke ocultos salida0. Migración0.21→0.21.1 conserva caja/mes/patrimonio/neto/RNG. Solo perfiles temporales; sin push.
