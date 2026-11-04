# Rechazar informes incompatibles antes de importar

> **For agentic workers:** Use superpowers:executing-plans. Autorización termina15:45UTC; lote acotado de integridad.

**Goal:** Un archivo con informe roto no debe sustituir la partida activa antes de fallar en la interfaz.

**Architecture:** Validar la estructura mínima del informe histórico dentro de deserialize, antes de startGame. No reconstruir un cierre pasado con números actuales ni borrar datos existentes.

**Tech Stack:** JS puro, pruebas Node y menú real en Edge aislado.

## Evidencia y diseño

0.21.3 acepta lastReport={}. En menú real con400negocios, importar esa copia con cash111 muestra error, pero game.s.cash queda111, el autosave conserva1.100M€ y el mapa lanza r.lines is not iterable. La interfaz y el guardado quedan apuntando a compañías distintas.

Ambición Depth: partir del archivo y del flujo de importación real; juez = rechazo antes de confirmar/cambiar modelo y comparación exacta de estado/autosave. Altitude: reproducir → validar datos del informe usados por UI → demostrar compatibilidad con informes válidos y columnas opcionales antiguas. No ampliar funcionalidad.

Prompt elevado: «Rechaza informes de cierre malformados antes de sustituir la partida activa. Conserva empresas, autosave y RNG si se rechazan; acepta informes correctos, virtuales y antiguos sin columnas añadidas. Pasa si el archivo antes causante de error deja intacto el juego desde el menú real.»

Validación mínima: informe null permitido; objeto con líneas array, costes y categorías objetos, métricas básicas numéricas finitas y mes entero válido. Líneas con id número/string, ciudad conocida, etiqueta y cantidades finitas; no se exige que su negocio siga existiendo (puede haberse vendido), ni tipo virtual en catálogo de negocios. Columnas nuevas de costes/sectores opcionales. No comprobar igualdad contable por redondeos o reglas antiguas. Archivo incompatible se rechaza con el mecanismo actual; no se toca SAVE_VERSION ni economía.

## Pasos

- [x] Pruebas rojas de estructuras rotas, líneas inválidas, métricas no numéricas; casos positivos actual/antiguo/sin cierre.
- [x] Validar en deserialize antes de UI; focalizadas verdes, catálogo regenerado.
- [x] Menú real: archivo anteriormente corruptor se rechaza antes de confirmar y conserva estado/autosave; importación buena sigue funcionando.
- [x] Revisión independiente, suite completa, DOM, build y smoke; versión0.21.4, handoff y commit.

## Restricciones/revisión

- No perfiles reales, dependencias, arte nuevo, push o fusión de registros.
- Permitir ids virtuales y negocios ya vendidos en un informe histórico.
- No exigir columnas incorporadas en versiones nuevas.
- No generar un informe pasado falso para salvar una caché rota.
- Si falta tiempo, cerrar este lote sin iniciar otro; no trabajar después de15:45UTC.

## Registro

- Base6d72340. Pruebas de reproducción %TEMP%/boomerez-report-probe.mjs y boomerez-report-ui-probe.cjs.
- RED: aceptación de informe vacío y sustitución activa111 con guardado1.100M€; error r.lines is not iterable. GREEN:3casos Node con11variantes inválidas y positivos legado/virtual/vendido/sin cierre. Revisión independiente cotejó campos obligatorios con el primer cálculo de informes del repo (4f00f31); sin hallazgos.
- Primer pase completo354/355: un test de Nochevieja serializaba un stub {fill:1}, que nunca genera el motor. Fixture sustituido por informe real con fill1; mismas expectativas. Focalizado fiestas+informe12/12 y suite final355/355simulación+14/14worker+56/56DOM=425únicas.
- Edge1365/375 con400negocios/130.024bytes: exportar exacto, cancelar, pedir crédito e importar restaura original,5archivos inválidos (incluidos informe vacío y líneas null) se rechazan sin confirmar/reemplazar estado/autosave; recarga idéntica y sin excepciones. Captura de aviso y compañía intacta inspeccionada.
- Build y ambos smoke ocultos salida0,108fuentes idénticas, dependencias intactas, catálogo vigente. No se tocaron perfiles reales ni se hizo push. No hay hallazgos abiertos de este lote.
