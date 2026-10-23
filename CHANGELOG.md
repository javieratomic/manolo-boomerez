# Cambios

## 0.2.0 — Profundidad

### Sistemas nuevos
- **Ciclo económico**: expansión, burbuja, crisis y recuperación, con efectos en la demanda, el turismo, el
  crédito, los intereses y el valor del ladrillo. Cada cambio de fase trae una carta con decisiones.
- **Competencia**: 9 cadenas rivales que aparecen cuando entras en su sector y se expanden copiando tus
  éxitos. Guerra de precios, reseñas falsas, fichar a su encargado u OPA.
- **Reformas** de cada negocio (3 niveles) y **mantenimiento** con desgaste de los locales.
- **Marketing**: campañas locales y nacionales.
- **I+D**: 12 productos nuevos (quesada, sobao proteico, congelados, app de fidelización...).
- **Equipo directivo**: 5 puestos y candidatos con nivel y rasgos (leal, trepa, íntegro, tiburón, enchufado...).
- **Logística**: transporte por kilómetro, obradores regionales y licencias de pisos turísticos.
- **Vida de Manolo**: caprichos de nuevo rico, relación con Merche (y divorcio en gananciales), estrés con
  sustos en el pádel y reposo obligatorio.
- **Salida a Bolsa** con cotización mensual y juntas de accionistas.
- **Elecciones** cada cuatro años entre dos partidos ficticios.
- **Costes de estructura** crecientes: crecer tiene rendimientos decrecientes.

### Contenido
- 4 negocios nuevos: taberna, gimnasio low-cost, coworking y residencia de mayores.
- 11 ciudades nuevas (30 en total).
- 6 arcos narrativos de varios pasos y decenas de sucesos nuevos (más de 100 en total).
- Fundación Boomerez, frases de Manolo según la situación y más titulares.

### Interfaz
- Pestaña **Mercado** (economía, gobierno, competencia, campañas, I+D).
- **Informe del gestor** con consejos automáticos, gráfico de ingresos por sector y balance de fin de año.
- Salón de la fama, modo infinito, texto grande, música de fondo generativa y exportar/importar partida.
- Objetivos que enseñan los sistemas nuevos.

### Plataformas
- **Escritorio**: `.exe` portable para Windows con Electron (`desktop/`).

### Contenido (segunda tanda)
- 24 sucesos ligados a ciudades (San Fermín, Fallas, Feria de Abril, el Pilar, carnaval de Las Palmas...),
  5 acciones nuevas de Manolo, 30 titulares y 20 frases.

### Calidad
- Dos revisiones de sistemas con agentes y una auditoría completa del contenido (354 agentes: detección,
  verificación doble y corrección). Los textos ya dicen exactamente lo que hace el código y se han
  sustituido las marcas y personas reales por equivalentes inventados (el final de Forbes pasa a ser la
  revista de millonarios); solo quedan las referencias culturales deliberadas a LinkedIn y al Audi.
- Exploits de dinero infinito con franquicias y de reventa tras una OPA, corregidos.
- Las partidas guardadas de la 0.1 se migran automáticamente (objetivos incluidos).
- Pruebas: 44 tests, partidas automáticas con varias estrategias, fuzzing de 40 partidas caóticas y prueba de
  pulsaciones aleatorias en la interfaz, sin errores.

## 0.1.0 — Primera versión jugable
- Simulación mensual de 8 años, mapa 2.5D de España, 7 tipos de negocio, políticas laborales y fiscales,
  inspecciones, auditorías, ~40 sucesos, 7 finales, objetivos, logros, dificultad, sonido y PWA.
