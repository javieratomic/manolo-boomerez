# Continuidad del imperio y Bolsa — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Usuario delegó revisión/correcciones y decisiones; límite15:45UTC.

**Goal:** No perder acceso al imperio al ganar y mantener obligaciones bursátiles en campañas largas.

**Architecture:** Corregir límites clásicos residuales en Bolsa; centralizar elegibilidad de continuar finales. Portada permite reabrir desenlace guardado y el récord queda persistido antes del diálogo. Sin reinicios, nuevo esquema ni fórmulas de equilibrio.

**Tech Stack:** JS puro; pruebas Node/DOM y Edge real con perfiles aislados.

**Spec:** Diseño y evidencias incluidos aquí.

## Evidencia y ambición

Reproducción0.21.1: IPO real en campaña europea, mes119, valoración1.904M€, historial positivo; tickBolsa no genera ninguna promesa. Su guardia todavía corta en96meses. En navegador, ganar Europa ofrece solo Nueva partida/Volver al título aunque su texto promete seguir; al recargar, el guardado existe con ending=europe, pero Continuar está oculto y recorded no se persistió.

Objetivo final: que el éxito amplíe las decisiones y conserve la empresa. Altitude: corregir omisiones → comprobar ciclo ganar/cerrar/reabrir/continuar → preservar obligaciones y récord único en partidas largas. Depth: partir del guardado y eventos reales, probar antes/después del mes96 y una victoria real en navegador. Meta: ninguna pérdida de acceso o duplicación de récord en el nuevo flujo y ningún trimestre europeo bloqueado por horizonte clásico. Range omitido.

Prompt elevado: «Corrige la continuidad al ganar Europa y el calendario bursátil después de ocho años. Reabre un desenlace guardado sin borrar la empresa, conserva su récord y permite continuar como promete el texto. Pasa si ganar, cerrar/reabrir y seguir conserva caja/negocios/calendario, no duplica récords y un IPO real tardío sigue recibiendo y juzgando promesas; la clásica mantiene su final de96meses.»

## Diseño y alternativas

Elegido: misma mecánica y escena existentes. canContinueEnding(id) en data/endings conserva los finales permitidos y añade europe. No se permite continuar cárcel/bancarrota/cooperativa/retirada. Bolsa trata Europe como horizonte ilimitado, igual que canIPO/checkEnding ya hacen, sin saltarse requisitos ni cambiar multas/sentimiento.

Portada muestra Continuar si hay partida activa y Ver desenlace si hay partida terminada válida. El controlador existente ya muestra ending al cargar; no se resetea s.ending al abrir. Elegir nuevo juego o reto semanal confirma sobrescritura también con desenlace guardado. Volver al título desde el final conserva la empresa; solo Nueva partida borra el guardado. Al mostrar final se guarda recorded=true antes de esperar la elección; reabrir no inserta otro récord. Continuar aplica el modo infinito existente, conserva empresa e historia y guarda.

Descartado: reiniciar automáticamente al ganar o dar otra campaña/bonificación; también descartar el resultado al cargar. Las partidas con ending desconocido se rechazan al importar antes de exponer el nuevo flujo, para no abrir un diálogo inválido. No se borran ni fusionan récords históricos.

## Global Constraints

- Sin dependencias/arte nuevo, SAVE_VERSION2 y reglas de economía intactas.
- Clásica termina96meses, salvo modo infinito explícito; Europa no tiene esa fecha límite.
- Visitar desenlace no ejecuta un cierre, ni repite premio/record.
- Contextos QA aislados; no perfil real, push ni mensajes externos.
- Regenerar catálogo offline después de cambios en código web.

## Review Focus

- IPO tardío real debe generar promesa con base positiva y juzgarla al siguiente trimestre.
- No duplicar carta al recalcular mismo cierre; base negativa sigue sin promesas.
- Guardado en la propia escena debe poder reabrirse sin duplicar récord/premio.
- Finales no continuables siguen mostrando solo sus opciones originales.
- Fin desconocido importado se rechaza sin sustituir guardado válido.

## Task 1: Lógica y guardado de desenlace

**Files:** core/bolsa.js, data/endings.js, core/state.js; tests/continuity.test.js y registros.
**Interfaces:** canContinueEnding(id):boolean; tickBolsa sigue misma firma. deserialize valida ending reconocido o null.

- [x] Pruebas rojas de IPO119, clásica/Europe/infinita95–119, juicio y siguiente promesa, elegibilidad, importación desconocida.
- [x] Corregir condición bursátil y lista continuable, validar ending; focalizado verde.

## Task 2: Flujo real y entrega

**Files:** index.html, ui/app.js, versión/docs/HANDOFF y catálogo generado.
- [x] QA roja ya reproducida:0opciones continuar y desenlace oculto tras recarga.
- [x] Etiqueta Continuar/Ver desenlace, confirmación de sobrescritura y recorded persistido; misma continuación existente.
- [x] QA1365/375/320: ganar, cerrar/reabrir escena, récord único, cancelar nuevo juego, continuar, recargar y cerrar otro mes; final malo no continuable.
- [x] Revisión independiente; suite completa, catálogo/DOM, build/smokes, documentación y commit0.21.2.

## Registro

- Base7b645a4, árbol limpio; reproducción en %TEMP%/boomerez-continuity-probe.{mjs,cjs}. Autoridad hasta15:45UTC.
- Revisión independiente confirmó5tests verdes y detectó además borrado preexistente al pulsar Volver al título. Se incluye en el objetivo de conservar acceso: QA roja guardado=null y verde tras limitar clearStorage a Nueva partida. Ningún borrado/fusión de récords históricos.
- RED5/5núcleo; GREEN5/5,346/346simulación+14/14worker+56/56DOM=416únicas. Clásica preserva corte95→96; Europe/infinito generan promesas después; una promesa tardía se juzga y enlaza la siguiente.
- QA final3anchos: victoria real por checkEnding, premio boutique300.000€ una vez, recorded persistido, cierre/recarga de escena, cancelar sustitución normal/semanal, Volver al título preserva guardado, reabrir y seguir con caja/deuda/mes/RNG/negocios intactos, avanzar a121 y recargar. Final terminal sin infinito, Volver conserva y Nueva partida explícita sí reinicia; récord1. Sin errores/desbordamiento, capturas inspeccionadas. Script inicial comprobaba etiqueta antes de boot: espera corregida a botón visible.
- Simulación mensual real3semillas×24meses con IPO después96 y guías0/1/3:7/7/8promesas y juicios, sin cierre ni bloqueo; no es un ajuste del equilibrio. Migración0.21.1→0.21.2 preserva estado activo/Europe/terminal, caja/neto/patrimonio/mes/RNG.
- Build y ambos smoke ocultos salida0, fuentes108archivos idénticas y dependencias sin cambios. No quedan hallazgos abiertos de este lote. Minor conservador de indicador offline de0.21.1 sigue documentado allí, sin cambios.
