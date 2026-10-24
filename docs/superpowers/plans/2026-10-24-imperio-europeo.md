# Imperio europeo 0.6 — plan de ejecución

Usuario delega equilibrio y ejecución por entregas. Mantener JS puro, guardados anteriores, textos españoles y commits locales sin push.

## Diseño y decisiones
- Vivienda: nombre visible «Viviendas para empleados», tarjeta al principio de Plantilla con plazas, trabajadores locales y botón de compra por ciudad. Migrar desbloqueo incluso sin cerrar un mes.
- Crecimiento: 10 niveles por negocio, costes de reforma progresivos desde los actuales; niveles superiores amplían capacidad y plantilla. La saturación por local pesa menos según población. Límite total de locales por ciudad = 6 + ceil(6 × pop).
- Trabajo: oferta laboral local = round(24 + 16 × sqrt(pop)) + cuatro trabajadores por plaza de vivienda. Las ampliaciones industriales requieren plazas para la plantilla de su capacidad proyectada; la capacidad efectiva respeta trabajadores disponibles. Mostrar cifras y déficit, sin cobrar una ampliación bloqueada.
- I+D: añadir producción (+20 %, +15 %), ahorro de materias, automatización, energía, rutas, estructura, expansión propia y licencias para banca, telecomunicaciones y logística. Efectos separados de los multiplicadores de ventas; iconos SVG distintos.
- Exterior: seis meses de marca blanca servidos al 90 % en un país y proyecto de expansión propia terminado permiten abrir tiendas allí. Progreso persistente tras vencer contratos; licencias no cuentan. Mercados europeos adicionales y ciudades extranjeras en Mercado/selector, conservando el mapa español.
- Sectores: banca (5 M€), telecomunicaciones (3 M€), logística (1,8 M€), con personal/costes/ingresos específicos y proyectos previos. Logística abarata rutas; telecomunicaciones abarata estructura. Sin productos bancarios reales ni dependencias externas.
- Academy: más fama y más negocios operativos aumentan sus ingresos con rendimientos decrecientes.
- Campaña europea predeterminada, sin cierre automático en mes 96 ni al alcanzar 15 M€. Meta: 1.000 M€ de patrimonio, presencia propia en ocho países europeos y los tres sectores estratégicos. Conservar campaña clásica de ocho años para retos y benchmarks.
- Dinastía: edad real del dirigente, relevo a los 80 años; estrés ≥90 durante tres meses abre riesgo creciente de fallecimiento, reposo reduce riesgo. Sucesión mediante carta con heredero nombrado o alternativas; conservar empresa, deuda, contratos, productos, mapa y reloj. Retirada voluntaria en campaña europea también hace relevo, sin final. Registro de generaciones y nueva edad. Sucesores también envejecen.
- Riesgos: eventos de inspección, conflicto exterior y averías agregan estrés; mostrar advertencias claras antes de mortalidad. Eventos personales del fundador no se repiten tras fallecer.

## Tareas
- [x] Acceso a viviendas y migración; regresiones UI y carga antigua.
- [x] Niveles, múltiples locales, trabajadores, Academy; pruebas económicas y de compras bloqueadas.
- [x] I+D industrial y sectores, sprites registrados, iconos; comprobar costes y producción sin duplicar efectos.
- [x] Progreso de marca blanca, mercados/ciudades extranjeras y apertura propia bloqueada/desbloqueada; prueba de persistencia.
- [x] Campaña europea, estrés, edad, muerte, sucesión y retiro; pruebas de dos generaciones y conservación de patrimonio.
- [x] Revisión independiente, Node, navegador móvil/escritorio, partidas largas, portable 0.6 con smoke, documentación.


## Registro
- Regresiones históricas conservan campaña clásica explícita; la campaña nueva predeterminada es europea. No se han borrado pruebas antiguas.
- Revisiones reprodujeron cuatro fallos: I+D industrial filtrado a Airbnb, servicios con plantilla subestimada, susto personal tras sucesión y ventas de vivienda que dejaban empleos ficticios en residencias. Añadidas regresiones rojas y corregidos.
- Demanda y plantilla de servicios se calculan en serviceModel, compartido por validación y nóminas. La oferta local limita actividad de todos los modelos; la fábrica utiliza la capacidad efectiva.
- Nuevos edificios con image_gen: banco, telecom y logística; 256×256, alfa real, ancla (128,240), inspeccionados, todos por debajo de 80 KB. Catálogo actualizado conservando status y notas anteriores: 197 terminados, 62 pendientes y 1 bloqueado.
- Las viviendas no consumen el cupo de locales comerciales: el obrador puede seguir ampliándose construyendo vivienda. Los distritos residenciales se representan agregados en el mapa.
- Factores de I+D en caché por estado y firma de productos, sin cambiar el RNG ni mutar los guardados.

- QA real Edge 1365×900 y 375×812: 35 iconos cargados; compra directa de viviendas, cuatro ampliaciones, nivel diez, tres Express en Madrid, tres sectores, filial en Lisboa y relevo a Vanessa al mes 300. Conserva empresas y caja (con redondeo habitual de cartas); recarga conserva la generación. Sin errores ni desbordamiento.
- La previsión guarda los planes de plantilla por ciudad dentro de cada cálculo económico, para evitar repetir el mismo análisis por cada local. La caché termina con el cálculo y no altera el estado.

- Continuidad larga: semilla 42, presupuesto inicial alto para aislar calendario y relevo, 1.000 meses con decisiones reales de sucesos y acción de reposo. Manolo fallece con 80 al mes 300, Vanessa con 80 al mes 732. Dos generaciones de relevo, sin final y con guardado recuperable. No es una medición del equilibrio inicial.

- Coherencia de personajes: Vanessa parte de los 19 años de la ficha original, Kevin de 24 y Merche de 53. También envejecen mientras esperan el relevo; Vanessa tiene 44 cuando fallece Manolo con 80.

- Cierre: 221/221 pruebas Node del runner original, 12/12 DOM, QA real desktop/móvil, sintaxis y catálogo correctos. Portable 0.6 reconstruido con las edades familiares finales; ambos smoke correctos. Revisión final sin hallazgos importantes.
