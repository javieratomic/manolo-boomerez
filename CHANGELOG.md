# Cambios

## 0.21.6 — Jugar con un clic

- README breve con enlace directo al juego, descarga Windows y galería de doce ilustraciones; los detalles de sistemas y desarrollo pasan a `docs/REFERENCIA.md`.
- Abrir `index.html` como archivo o hacer doble clic en `jugar.bat` lleva a la web pública sin instalar herramientas. `jugar.bat --local` conserva la ejecución del código local con Python.

## 0.21.5 — Avisos fiables y publicación pública

- Una actualización offline fallida verifica la copia activa guardada antes de anunciar indisponibilidad; las respuestas tardías no pisan un controlador nuevo.
- Las alertas económicas del mapa y el consejo de cobertura de Paco identifican el cierre y hablan en pasado; la conservación, huelga y rachas de franquicia siguen siendo actuales.
- README con capturas reales, web estática preparada para GitHub Pages y distribución pública de fuente y portable.

Las entregas 0.20–0.21.4 y sus comprobaciones están registradas en `HANDOFF.md`.

## 0.19.0 — La campaña europea, medida

Las versiones 0.13 a 0.18 están documentadas en `HANDOFF.md`.

- **La campaña europea se puede ganar, y ahora está medido.** Un bot que juega la campaña por defecto entera
  gana 24 de 24 partidas. Persiguiendo los tres requisitos tarda una mediana de 286 meses; si además
  prioriza el mayor beneficio, 257 meses (unos 21 años, IC95 244–264), antes de que Manolo cumpla 80.
  Los ocho países llegan hacia el mes 72–79 y los tres sectores hacia el 102–105; lo que marca el ritmo son los
  1.000 M€. Un jugador corriente (sin crédito y una apertura al mes) también gana siempre, pero en unos 42
  años y con un relevo por el camino.
- **La campaña clásica vuelve a la dificultad de la 0.4:** la revista de millonarios pide ahora 20 M€ (antes
  15 M€). Con la economía de la 0.5 en adelante, el bot Express jugando legal llegaba en 32 de 32 partidas
  hacia el mes 79; con 20 M€ llega en el 72 %, hacia el mes 89, como en la 0.4. Maison llega siempre, hacia el
  mes 66 (antes, el 60). Tiburón Pasiego (5 M€) y Pyme (0,8 M€) no cambian.
- **Maison ya no gana el doble que Express.** Lo barato sale antes: el obrador heredado rinde igual con
  cualquier marca, pero cada ampliación y cada obrador regional sacan la mitad de sobaos de autor (`yield` de
  la marca). Con 32 semillas en la campaña clásica, Maison legal pasa de 47 a 35 M€ a los 8 años (Express,
  22,6) y llega a la revista hacia el mes 75 (antes, el 66; Express, el 89). Se probó además bajar el precio
  de la tienda Maison a 8,50-9 €: igualaba más las marcas, pero hacía quebrar a Maison al empezar en 2 de 24
  partidas europeas, así que el precio sigue en 10 €. Los textos del obrador, del robot, de las reformas del obrador regional, de la elección de
  marca y del rebranding dan la cifra que corresponde a la marca.
- **Franquicias:** como mucho tres firmadas al mes. Antes se podían colocar cientos de franquicias ruinosas
  en el mismo mes y quedarse con los cánones cuando quebraban: una partida clásica que empezaba con 80.000 €
  llegaba a la revista de millonarios en el mes 5. El botón explica el tope cuando se alcanza.
- **La estimación de una apertura incluye el mantenimiento** del local. Antes prometía, por ejemplo,
  492.577 €/mes por un banco en Madrid que luego daba 468.952 €.
- **Plantilla y obras:** un local en obras (telecomunicaciones, obrador regional...) ya cuenta para la
  vivienda que hará falta al entregarlo, así que no se puede abrir otro negocio a su lado y quedarse sin
  plantilla. Si la falta llega con una entrega futura, el mensaje lo dice y recuerda que una vivienda tarda 12
  meses.
- **Venta online:** cualquier centro propio de Boomerez Logística en marcha abarata un 15 % la paquetería.
  Antes el descuento exigía un centro en Selaya, donde no se puede abrir, y nunca se aplicaba.
- **Oferta de un rival:** en la campaña europea, «Vender» avisa si el local es el único en un país o en un
  sector estratégico, y cuánto bajaría la meta.
- **ERTE:** la opción honrada va primero, como en el resto de cartas.
- Las partidas guardadas antes de la 0.6, que no indican campaña, se cargan como campaña clásica y no como
  europea.
- En la campaña europea, el aviso del bloqueo bursátil ya no habla de la revista de millonarios.

### Herramientas
- `tests/fuzz.mjs`: partidas caóticas con comprobaciones cada mes y una prueba de que guardar y cargar no
  cambia lo que pasa después. Ha jugado unos 58.000 meses sin un solo fallo de invariantes.
- `tests/europe.mjs` y la estrategia `europe` del bot: miden la campaña europea en paralelo, con intervalos
  de confianza.
- 7 regresiones nuevas (`tests/europe-review.test.js`); todas fallan con la 0.18.

## 0.12.0 — Menús por áreas

- Cuatro grupos de navegación con submenús cortos: Empresa, Expansión, Equipo y Manolo. Sin una fila interminable de pestañas ni scroll horizontal del menú en móvil.
- I+D, Marketing, Exterior, Online, Viviendas, Beneficios y Dirección tienen pantallas propias. Mercado queda para ciclo económico, Gobierno y competencia; Plantilla para condiciones y comité.
- I+D filtra pendientes, investigados y áreas; los 35 proyectos tienen categoría y la investigación en marcha permanece visible con cualquier filtro.
- Scroll independiente por pantalla y ciudad; cada grupo vuelve a su último menú visitado. Los filtros conservan el foco de teclado y los atajos 1–7 mantienen sus destinos anteriores.
- Enlaces, consejos, objetivos y ayuda apuntan a las nuevas ubicaciones. Guardados compatibles y reglas económicas sin cambios.

## 0.11.0 — Sobaos a domicilio

- Canal de venta online en Mercado: tres tamaños, previsión económica de apertura, ampliación, pausa y reactivación.
- Pedidos peninsulares en cajas de seis, servidos solo con excedente real después de tiendas y contratos. La producción incluye el online una sola vez; los regalos de cortesía usan el excedente restante.
- Precio, paquetería, embalaje, comisiones, incidencias, personal y plataforma desglosados. El coste de envío por unidad es mayor que abastecer tiendas y el margen variable menor.
- Portes incluidos o aportación del cliente de 3 € por pedido a cambio de una demanda un 18 % menor. Logística y rutas reducen la paquetería; campañas nacionales, I+D, fama y reputación atraen tráfico.
- Plantilla de preparación real en Selaya y validación de vivienda al abrir, ampliar o reactivar. Pausado no vende ni paga cuota o nóminas de preparación.
- Canal reconocido en informes y consejos del gestor; guardados anteriores empiezan con el online cerrado.

## 0.10.0 — Central de marketing

- 22 campañas: ocho locales, ocho nacionales y seis internacionales; buscadores, redes, degustaciones, acuerdos comerciales, podcasts, prensa, patrocinios, Navidad y acciones adaptadas a otros países.
- Central de marketing al principio de Mercado: seleccionar ciudades/países, todos/ninguno, presupuesto actualizado y revisión antes de contratar en lote.
- Lotes completos o nada; destinos únicos, campañas ya activas y negocios no afines omitidos. No se vuelve a cobrar una campaña activa ni se contrata parcialmente por falta de dinero.
- Las campañas locales admiten franquicias operativas; las obras no habilitan campañas. Los destinos vendidos o acuerdos vencidos desaparecen de la selección sin bloquear las restantes ciudades o países.
- Nacional significa España. Internacional actúa por país sobre locales, pedidos de marca blanca o regalías de licencia; cada país se cobra una vez aunque tenga varios locales y un socio. Las licencias siguen sin consumir producción del obrador.
- Campaña navideña con ventana de contratación y meses de efecto explícitos; las degustaciones solo actúan sobre alimentación y hostelería. Modificadores guardados mantienen su duración y alcance al cargar.

## 0.9.0 — Las ciudades tienen memoria

- Invitaciones y conflictos locales dependen de reputación y confianza acumulada. Las cartas recuerdan la elección anterior; cuidar acuerdos mejora próximas campañas y repetir abusos cuesta más reputación.
- El ninot de Fallas y la historia del concurso de patios son oportunidades puntuales. San Fermín, Feria, Ofrenda, Carnaval, Bando de la Huerta y Nochevieja pueden volver cada año sin perder turnos por el desfase entre sorteo y resolución.
- Las celebraciones coincidentes se encolan todas; no se borra una fiesta porque otra ciudad tenga fiesta el mismo mes. Las obras todavía no reciben invitaciones.
- Nochevieja Universitaria progresa mediante cuatro patrocinios exitosos en años distintos: Salamanca, otras universidades de Castilla y León, campaña nacional y tradición consolidada. Exige presupuesto, reputación creciente, moral y suministro suficiente para la demanda adicional.
- La tradición de los minisobaos da +15 % de demanda española de sobaos cada diciembre; se reduce a la mitad si la reputación cae de30. Sin efecto fuera de España, en otros meses ni en negocios ajenos a sobaos.
- Progreso en Mercado e historial local en Ciudad; guardado compatible y sin éxitos retroactivos inventados.

## 0.8.0 — Promociones y obras

- Edificios de 25 apartamentos y urbanizaciones de 10 chalets: costes base de 2 y 3 M€, ajustados por ciudad; los chalets tienen mejor efecto sobre la moral y alquiler ×1,5.
- Viviendas nuevas con 12 meses de construcción, sin rentas ni oferta laboral antes de entrega. Nuevos pisos turísticos: 1,2 M€ de coste base y también 12 meses de obra.
- Obradores regionales y centros de telecomunicaciones tardan seis meses; capacidad, transporte y bonus solo desde su apertura.
- Mantenimiento residencial mucho menor (100 €/mes apartamentos, 200 € chalets y turísticos), sin cuota porcentual genérica añadida.
- Renovación inmobiliaria cada 15 años por el 20 % del coste de reposición local, con gasto en informe, previsión y aviso anticipado. La primera renovación de inmuebles antiguos llega 15 años después de migrar.
- Promociones nuevas de tamaño fijo: reformarlas mejora las rentas sin inventar más viviendas. Los inmuebles previos conservan su capacidad.
- Sprite transparente de urbanización con diez chalets y avisos de obra, entrega y renovación en Ciudad y Plantilla. Guardado compatible durante la construcción.

## 0.7.0 — Sobaos, sinergias y caseros

- Bolsa bloqueada hasta una valoración de empresa de 1.000 M€; se conservan antigüedad, reputación y bloqueo posterior. Las sociedades ya cotizadas siguen cotizando.
- Academy y coworking en la misma ciudad aumentan mutuamente su demanda un 15 %. Los sobaos vendidos localmente el mes anterior elevan la demanda de gimnasios hasta un 35 %.
- Empanadas solo tras elegir la sociedad con Rodrigo: 10 % de ventas para él y primera apertura un 30 % más barata, sin repetir el descuento al vender o cargar.
- Viviendas con prioridad para empleados y alquiler al público de las plazas libres. Tarifas independientes por ciudad y tipo de inquilino, precios locales y demanda pública limitada entre todos los edificios.
- Descuento asistencial del 20 % para familiares de empleados en residencias propias; plazas reales, ingresos menores y mejora de moral proporcional al uso.
- Inspecciones y sucesos consideran las tarifas locales efectivas, sin atribuir al público control laboral ni abusos a empleados inexistentes.
- Conservada la corrección de retratos y migración automática de candidatos y directivos.

## 0.6.0 — Un imperio heredable

- Retratos de candidatos y directivos coherentes con los personajes; familiares con retrato propio y corrección automática al cargar partidas anteriores.
- Viviendas para empleados visibles al principio de Plantilla, compra por ciudad y desbloqueo inmediato al cargar partidas antiguas.
- Diez niveles por negocio, obradores regionales ampliables y más locales rentables en ciudades grandes.
- Mercado laboral local: grandes plantillas requieren viviendas; venderlas puede reducir empleo, actividad y capacidad fabril.
- 35 proyectos I+D con iconos propios: producción, automatización, materias primas, energía, rutas, estructura, expansión y sectores estratégicos.
- Banca, telecomunicaciones y logística, con ingresos y costes específicos; tres sprites nuevos generados e inspeccionados.
- Diez mercados extranjeros y 16 ciudades europeas para abrir empresas propias después de seis meses de marca blanca cumplida y el I+D correspondiente.
- La Academy gana atractivo con la fama y con la red empresarial.
- Campaña europea continua: 1.000 M€ de patrimonio, ocho países europeos y presencia en los tres sectores estratégicos. El reto semanal conserva la campaña clásica.
- Dinastía: estrés crítico prolongado puede causar fallecimiento; a los 80 años hay sucesión. Se conserva el imperio y el calendario, cambia el dirigente y se registra cada generación. También hay relevo voluntario desde los 60.


## 0.5.0 — De Selaya al mundo

- Obrador ampliable tras las tres mejoras iniciales: módulos de +25.000 uds/mes, desde 650.000 €, cada vez un 32 % más caros, con mantenimiento y valor patrimonial.
- Abrir cuesta según la ciudad, con más diferencia en inmuebles. Los índices son parámetros de juego.
- Franquicias: previsión y cierre distinguen resultado de la central y del franquiciado. Una central rentable puede convivir con un dueño insolvente; cuatro meses de pérdidas suyas disparan la reclamación.
- Otros negocios funcionan sin suministro de sobaos. Un excedente real permite cortesías de hasta 250 unidades por negocio y hasta +5 % de ingresos, pagando fabricación y transporte. Sin falsos avisos de falta de producción en restaurantes.
- Vivienda de plantilla accesible desde la herencia; se ocupa con empleados de esa ciudad. Las políticas de alquiler y sus consecuencias laborales siguen disponibles en Plantilla.
- I+D pasa de 12 a 24 innovaciones especializadas, todas con icono SVG propio. Incluye recetas vegetales, cacao, helados, biomecánica, domótica, rehabilitación y desayunos corporativos.
- Acuerdos en seis países: marca blanca que consume capacidad o licencia de la marca elegida con fabricación externa y royalties. Exclusividad territorial, 24 meses, auditorías opcionales, impagos, calidad, copias, suspensión, renegociación y rescisión.
- Mapa con las 50 capitales provinciales, Ceuta y Melilla (55 destinos contando Selaya, Marbella e Ibiza). Tenerife y las ciudades autónomas pagan transporte marítimo; Canarias conserva coordenadas reales para calcular distancias.
- Las partidas anteriores se cargan con las reglas nuevas; se conserva su versión de origen y se identifica la continuación como 0.5.0 para comparar semillas correctamente.


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
  Desde los 61, un final voluntario: **«Vuelta a Selaya»** (pestaña Manolo), con la puntuación de ese momento
  y sin cobrar la cláusula.

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
- **Menos ventanas**: el resultado de una carta sale en el mismo diálogo, y los resultados menores (texto
  corto, poco efecto y sin carta nueva) van a un aviso y al registro; inspecciones, auditorías, huelgas, la
  cartilla y lo que mueva la caja siempre se enseñan. La acción de Manolo va a su bocadillo hasta el cierre.
- Teclas `,` y `.` para recorrer las ciudades con alerta; en el móvil, tocar dos ciudades juntas acerca el
  mapa; la pulsación que cierra un diálogo ya no cierra también el mes.
- Mantener pulsado un número o Intro no descarta el resultado de una carta ni elige en la siguiente:
  hace falta una pulsación nueva.
- Los diálogos mantienen el foco al recorrerlos con Tab y Mayús-Tab y lo devuelven al control de origen
  al cerrarse.

### Técnica y calidad
- La estimación de aperturas ya no clona la partida: el bot va 3,8 veces más rápido, con las mismas partidas.
- `tests/balance.mjs`: barrida de equilibrado con 30 variantes en 32 semillas (datos en
  `docs/balance_0.4.md`).
- Revisiones con agentes de cada tanda (detección y verificación adversaria) y sus correcciones: 14 fallos
  en las piezas 1, 2 y 4a, 30 en las piezas 3, 4b, 5 y 6 y 15 en la revisión final de la 0.4. Entre ellos: el sueldo de Kevin se quedaba para
  siempre tras un rescate, un rescate durante el embargo perdonaba la deuda, la guía prudente hundía el
  sentimiento a la larga, «Sesenta velas» salía antes de cumplir los sesenta y los 50 empleados esperaban a
  una inspección limpia.
- Revisión final: elecciones protegidas frente a dobles clics y teclas arrastradas; el modo infinito
  procesa sus promesas; la retirada respeta el bloqueo bursátil; las velas tienen prioridad; la cartilla,
  las causas de juntas y los herederos conservan un estado coherente. Edad actual y bocadillo corregidos.
- Las semillas de la 0.3 no reproducen las mismas partidas en la 0.4 (`GAME_VERSION`).
- Las importaciones comprueban catálogos, estructuras y cuentas antes de aceptar el archivo: un guardado
  dañado no sustituye la partida abierta. Las partidas antiguas sin estadísticas se rellenan al migrar.

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
