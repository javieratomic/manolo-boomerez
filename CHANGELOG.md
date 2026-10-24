# Cambios

## 0.4.0 — Cuentas claras

> «Cuentas claras, amistades largas» (refrán de Doña Remedios). Lo que antes salía gratis ahora pasa
> factura: lo que te ahorras con la plantilla, lo que les prometes a los analistas y lo que le pides a tu
> madre. Al final, el juego te cuenta qué fue de todos.

### Sistemas nuevos
- **La cuenta de la plantilla.** Marisa liquida lo que te has ahorrado frente al convenio en los últimos
  24 meses (×1,2), con un 25 % al momento y el resto aplazado (que cuenta como deuda). El **agravio** sube con
  el beneficio por cabeza y resta moral; con 50 personas nace el **comité**: revisión del convenio cada
  marzo (firmar, paga única, prometer o congelar), promesas que se recuerdan y **huelga general**. Política
  nueva: **reparto con la plantilla** (paga del 3 % o participación del 8 %, deducible).
- **La cartilla de Doña Remedios.** Tu madre te presta sin intereses si de verdad lo necesitas, siempre con
  una condición (lo que manda la ley, mantequilla de verdad, cocido los domingos o colocar a Kevin). Vence en
  un año: devolver, prórroga o embargo materno. Te rescata una vez del concurso. Refranero coleccionable.
- **La Bolsa tiene memoria.** La valoración mezcla libros y beneficio, hay 6 meses de bloqueo antes de la
  revista y, cotizando, cada trimestre prometes una cifra a los analistas (prudente, en línea, optimista o
  modo tiburón). La credibilidad y el sentimiento del mercado mueven lo que vale tu parte. Se puede maquillar
  el trimestre… y te pueden pillar («EL SOBAO ESTÁ HUECO»).
- **¿Qué fue de...?** Epílogo de 13 personajes según lo que pasó, crónica de tus hitos y una carta de
  Manolo. A los sesenta, **«Sesenta velas»**: cumpleaños, heredero ante el notario y la cláusula de Manolo.

### Interfaz
- **Archivo** (antes Noticias): carpetas de Marisa, Don Fermín, las costumbres, el comité, la cartilla y los
  analistas, más la hemeroteca.
- **Objetivos en tres carriles** (negocio, equipo, dinero) con progreso y 6 objetivos nuevos; fichar a un
  directivo ya no bloquea el resto.
- **Mapa**: rótulos legibles en el móvil y sin solaparse, insignias de alertas por ciudad, repintado solo
  cuando cambia algo y cifras de beneficio al cerrar el informe.
- **Móvil**: HUD de cinco casillas con «⋯», botón ⤢, objetivos plegados, botones de 40 px y respeto por
  «reducir movimiento». **Accesibilidad**: «Ir a…», resumen del mes para lectores de pantalla y avisos
  anunciados.
- Ayuda en cinco páginas; el consejo urgente de Paco en la pestaña Ciudad.

### Técnica y calidad
- La estimación de aperturas ya no clona la partida: el bot va 3,8 veces más rápido, con las mismas partidas.
- `tests/balance.mjs`: barrida de equilibrado con 30 variantes en 32 semillas (datos en
  `docs/balance_0.4.md`).
- Revisiones con agentes de cada tanda (detección y verificación adversaria) y sus correcciones: 14 fallos
  en las piezas 1, 2 y 4a y 30 en las piezas 3, 4b, 5 y 6. Entre ellos: el sueldo de Kevin se quedaba para
  siempre tras un rescate, un rescate durante el embargo perdonaba la deuda, la guía prudente hundía el
  sentimiento a la larga, «Sesenta velas» salía antes de cumplir los sesenta y los 50 empleados esperaban a
  una inspección limpia.
- Las semillas de la 0.3 no reproducen las mismas partidas en la 0.4 (`GAME_VERSION`).

## 0.3.0 — Decisiones con memoria

### Sistemas nuevos
- **El expediente Boomerez**: Marisa (Trabajo) y Don Fermín (Hacienda) se acuerdan de todo. Cada truco
  (la cámara frigorífica, el orujo, culpar al gestor, los tickets, el anciano confuso) funciona peor cada vez
  y las pistas enseñan la probabilidad real. Las sanciones de los últimos 24 meses agravan la multa (hasta
  ×1,75) y la multa mira la media de los últimos 6 meses: pasarse a legal el mes de la visita ya no la borra.
  Paco se va a la tercera vez que le culpas.
- **La tentación, con números**: bajo cada opción de política salen lo que cambiaría el mes que viene
  (dinero, moral, radares, multa si viniera Marisa) y el neto a 6 meses ya descontadas la moral y las multas
  esperadas. Los indicadores del HUD se pueden tocar: «¿Por qué?» explica qué política empuja cada uno y el
  riesgo de visita, huelga o auditoría.
- **Costumbres de la casa**: Navidad, agosto y los franquiciados arruinados recuerdan lo que elegiste. Romper
  una tradición de cestas duele; el tercer agosto sin vacaciones trae a la Inspección; tras dos veranos de
  descanso se puede «cerrar agosto como en Francia». Lo de siempre ya no abre otra ventana: sale como aviso.
- **La cláusula del testamento**: cada partida trae un reto opcional (siete posibles, según la semilla). Si
  acabas cumpliéndolo, la puntuación se multiplica y heredas el prado de Vega de Pas con 40 vacas pasiegas.
- **Parte del mes**: el informe explica qué partidas han movido el neto y por qué (una cadena rival en una
  ciudad, la temporada, aperturas, el obrador que no da abasto...), qué ha pasado y qué viene.
- **Semilla compartible y reto de la semana**: un código de hasta 7 caracteres reproduce la partida; el
  botón «Reto de la semana» da la misma partida (y cláusula) a todo el mundo esa semana.

### Interfaz y técnica
- El título ya no espera a todo el arte: se cargan primero el mapa, los edificios, los iconos y Manolo; el
  resto se precarga en segundo plano.
- Espacio o Intro sobre un botón ya no cierran el mes.
- Se quitan las últimas marcas reales de los textos.
- Dos rondas de revisión con agentes (detección y verificación adversaria): 37 fallos confirmados y
  corregidos, entre ellos que recargar una partida cambiaba lo que daba la misma semilla.
- 94 tests (50 nuevos).


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
