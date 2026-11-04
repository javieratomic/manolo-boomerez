# Manolo Boomerez S.L.

> *Sobaos, ladrillo y mentalidad de tiburón.*

Juego de gestión satírico por turnos. Eres **Manolo Boomerez**, un "joven emprendedor" de 55 años que
acaba de heredar de su padre el obrador de sobaos pasiegos de Selaya (Cantabria). Tu sueño: franquicias
por toda España, pisos para tu plantilla (así no se te va nadie), apartamentos turísticos, smash burgers,
empanadas argentinas y una academia de "mentalidad de tiburón". Tus obstáculos: la Inspección de Trabajo,
Hacienda, tu plantilla, tu cuñado y tu propia arrogancia.

- **Plataformas:** navegador de PC (objetivo principal) y móvil (diseño adaptable, gestos táctiles,
  instalable como PWA).
- **Tecnología:** HTML5 + Canvas 2D + JavaScript (módulos ES). **Sin dependencias, sin motor y sin paso de
  compilación**, así que no hay licencias de terceros. El código es MIT.
- **Arte:** 2.5D, lo produce un agente aparte a partir de [`art/requests/`](art/requests). Mientras tanto, el
  juego genera marcadores por código y se puede jugar entero.

## Jugar

Necesitas Python 3 (solo como servidor local; los módulos ES no funcionan abriendo el HTML con `file://`).

```bash
python tools/serve.py 8080 --open
```

En Windows también puedes hacer doble clic en `jugar.bat`. La partida se guarda sola en el navegador, y desde el
menú (☰) se puede exportar a un archivo e importar en otro dispositivo.

En una web HTTPS, espera a **Juego disponible sin conexión** en la portada antes de desconectarte por primera vez. Se prepara el código completo, también los menús que todavía no hayas abierto. Una actualización preparada puede pedir reabrir el juego para aplicarse. El arte descargado con el servicio activo queda como respaldo; si alguna imagen no está disponible, se usan los marcadores habituales. El guardado sigue siendo local. El servidor de desarrollo y el portable no necesitan registrar este servicio.

**Controles:** clic o toque en una ciudad para abrir negocios · arrastrar para mover el mapa · rueda o
pellizco para el zoom (en el móvil, tocar dos ciudades juntas acerca el mapa) · `Espacio` cierra el mes ·
`1`-`7` cambia de pestaña · `1`-`4` elige opción en las cartas · `,` y `.` recorren las ciudades con alerta.

## Cómo funciona

La navegación se organiza en cuatro áreas. Cada pantalla recuerda su posición de scroll; I+D permite filtrar por estado y tema.

En **Empresa → Imperio → Plan de operaciones** puedes anticipar las entregas y renovaciones de hoy y los próximos doce meses. El plan avisa de las ciudades que necesitarán viviendas para su plantilla, incluidas las variaciones estacionales. La agenda usa inversiones ya contratadas y condiciones actuales: no predice sucesos ni ingresos futuros, y consultar no modifica la partida.

En **Imperio → Cartera** puedes buscar y filtrar los negocios actuales por país, sector o estado, con diez por página y cuentas separadas de los franquiciados. Selecciona reformas entre páginas o todo un filtro y revisa su coste y efecto conjunto sobre el resultado mensual de la empresa. El lote se aplica completo o no se cobra nada; cambiar filtros limpia la selección. El informe del último cierre sigue disponible, plegado en Resumen.

**Imperio → Aperturas** compara ciudades y modalidades para negocios que entran en servicio al momento. Filtra por tipo, país y ciudad, ordena por mejora neta o desembolso y consulta motivos de bloqueo. Cada alternativa parte de la misma empresa: incluye precio real, mantenimiento, costes compartidos, impuestos y efectos de objetivos. Canon y premios se separan del beneficio mensual y se muestra el resultado del franquiciado. Revisar y confirmar abre una sola alternativa con las reglas habituales, incluido el aviso de cláusula; cotizaciones obsoletas se rechazan. Las obras con plazo siguen en Ciudad y Viviendas. La búsqueda reutiliza cálculos mientras la partida no cambie, con revisión siempre recalculada.

Desde una alternativa o su revisión, **Probar escenarios** lleva esa apertura a **Finanzas → Resistencia**. Compara Mantener/Abrir y muestra el resultado del nuevo franquiciado en cada supuesto, separado de la caja central. Aplica inversión, canon y premios una sola vez en copia, conserva la intención y devuelve tipo/ciudad/modalidad a Aperturas. Si cambió la cotización o ya abriste otra tienda, el estudio pide elegir de nuevo. Una marca anterior se conserva bloqueada al volver hasta que selecciones otra explícitamente. Ninguna operación se ejecuta en Resistencia.

El modo **Vender y rescindir** permite reestructurar varios activos: separa cobros e indemnizaciones, revisa caja y patrimonio, efecto operativo y pérdida de países/sectores estratégicos. Avisa si retirar viviendas u obradores perjudica el suministro o prolonga déficits de empleo futuros. Las ventas del lote pueden financiar la devolución de cánones; una insuficiencia bloquea todo sin cambios parciales. Se pueden comparar Mantener/Reestructurar en Resistencia. Cambiar modo limpia selección y la confirmación definitiva exige la cotización vigente.

**Finanzas → Resistencia** compara condiciones actuales, demanda comercial −15 %, salario base +10 % y ambos cambios. Desde la cartera, **Probar escenarios** añade un lote sin ejecutarlo. Muestra beneficio y caja tras un cierre antes de financiación, más un colchón orientativo de tres nóminas y renovaciones de los doce meses posteriores. Las renovaciones del mes ya están en el resultado y no se suman otra vez al colchón. Los supuestos no tienen probabilidades, no avanzan tiempo ni cambian el mercado; contratos y regalías conservan sus condiciones, becas y sueldos fijos no se indexan. Un lote cuyo nivel ya cambió requiere seleccionarlo de nuevo.

**Finanzas → Patrimonio y riesgos** reconcilia caja, obrador, negocios/viviendas y caprichos con las deudas confirmadas del banco, la familia y Seguridad Social. Explica la participación del jugador y el sentimiento bursátil cuando cotizas. Las estimaciones de Hacienda y Trabajo quedan fuera del balance y tienen un escenario ilustrativo de pago conjunto, antes de crédito y sin multas adicionales. No cambia las reglas de patrimonio ni ejecuta pagos. El balance del último cierre incluye también el desglose de banca, telecomunicaciones y logística.

La comprobación de vivienda al construir incluye la clientela, saturación y plantilla completa de los centros que estarán entregados, manteniendo las condiciones actuales. El personal de una obra se exige en su fecha de entrega: puedes coordinarla con viviendas que lleguen ese mismo mes; las posteriores no cuentan antes de tiempo. El Plan de operaciones conserva además la estacionalidad de su calendario.

En **Expansión → I+D**, **Evaluar** compara el resultado, capacidad efectiva de sobaos, cobertura y empleados actuales con la innovación terminada bajo las condiciones de hoy. Muestra cambios de personal y viviendas necesarias por ciudad, además del coste y plazo reales con Dirección de Operaciones. Se pueden estudiar proyectos bloqueados o en curso; estos últimos ya están pagados. La consulta no inicia ni termina nada, no cambia filtros ni sustituye otra investigación, y no simula el mes de entrega, financiación, obras ni nuevos locales desbloqueados.

| Área | Menús |
|---|---|
| Empresa | Ciudad, Imperio, Mercado, Finanzas |
| Expansión | Marketing, I+D, Exterior, Online |
| Equipo | Plantilla, Beneficios, Viviendas, Dirección |
| Manolo | Manolo, Archivo |

| Sistema | Resumen |
|---|---|
| Turnos | Un mes por turno; campaña europea continua con sucesores. Reto semanal clásico de 96 meses |
| Marca | Al empezar eliges **Express** (low-cost, volumen) o **Maison** (boutique delicatessen) |
| Producción | Selaya y obradores regionales; capacidad y automatización por I+D, ampliaciones industriales sin tope y plantilla que necesita vivienda |
| Venta online | Tienda peninsular en Expansión → Online, tres tamaños y cajas de seis; vende excedentes tras tiendas/contratos, con paquetería cara y costes desglosados, portes incluidos o compartidos |
| Negocios | Sobaos, vivienda, turismo, hostelería, gimnasio, coworking, residencia, Academy, banca, telecom y logística; diez niveles. Empanadas solo al asociarse con Rodrigo |
| Mapa | 55 destinos españoles y 16 ciudades extranjeras tras experiencia de marca blanca e I+D |
| Economía | Ciclo de expansión, burbuja, crisis y recuperación; costes de estructura crecientes |
| Competencia | 9 cadenas rivales con IA que te copian; guerra de precios, reseñas falsas, fichajes y OPA |
| Expansión | Marketing, I+D y Exterior: 22 campañas locales, nacionales e internacionales, selección de ciudades/países y contratación conjunta; 35 proyectos I+D y diez mercados para acuerdos |
| Equipo | 5 puestos directivos con candidatos que tienen nivel y manías |
| Vida | Caprichos, familia, sucesión y salida a Bolsa a partir de una valoración de 1.000 M€ |
| Sinergias | Academy y coworking locales +15 %; vender sobaos aumenta la demanda local de gimnasio el mes siguiente (hasta +35 %) |
| Vivienda y beneficios | Edificios de 25 apartamentos o urbanizaciones de 10 chalets, empleados prioritarios y vacantes para el público, tarifas por ciudad y beneficio asistencial |
| Construcción | Viviendas y turísticos en 12 meses; nuevos obradores y Telecom en seis. Sin actividad mientras están en obras |
| Ciclo inmobiliario | Inversión inicial mayor, mantenimiento mensual reducido y renovación del 20 % del coste de reposición cada 15 años, con aviso anticipado |
| Logística | Transporte por kilómetro desde el obrador más cercano, obradores regionales, licencias de pisos turísticos |
| Rejugabilidad | Cláusula del testamento (reto opcional por partida), semilla compartible y reto de la semana, balance anual, salón de la fama, logros entre partidas y modo infinito |
| Información | Previsión de cada política (mes que viene y 6 meses), «¿Por qué?» en cada indicador y parte del mes |
| Memoria | Los inspectores recuerdan tus trucos y sanciones; Navidad y agosto recuerdan tus costumbres; el Archivo lo enseña todo |
| Fiestas locales | Reputación, acuerdos y conflictos cambian invitaciones y resultados. Fiestas anuales con memoria; cuatro patrocinios de Nochevieja pueden crear una tradición nacional y más demanda de sobaos en diciembre |
| Plantilla (0.4) | Liquidación de lo ahorrado frente al convenio, agravio, comité con revisión anual del convenio, huelga general y reparto de beneficios |
| Familia (0.4) | La cartilla de Doña Remedios: préstamos sin intereses con condiciones, embargo materno y rescate |
| Bolsa (0.4) | Bloqueo de 6 meses y la promesa trimestral a los analistas, con maquillaje y fondos bajistas |
| Final (0.4) | Epílogo de 13 personajes, crónica, carta de Manolo y «Sesenta velas» (heredero y cláusula) |
| Políticas | Salarios, horas extra, becarios, alquiler de los pisos de la plantilla, contabilidad e ingredientes |
| Riesgo | Radares de Inspección de Trabajo y de Hacienda → inspecciones, auditorías, multas y expedientes penales |
| Sucesos | Más de 130 cartas satíricas con decisiones (el cuñado y su SobaoCoin, la rata viral, la huelga, el jefe infiltrado...) |
| Objetivos | 18 objetivos en tres carriles (negocio, equipo y dinero) que dan pequeñas recompensas |
| Dificultad | Modo cuñado (fácil), Emprendedor (normal) y Modo Hacienda (difícil) |
| Logros | 46 logros que se guardan entre partidas: uno por cada final y uno por cada cláusula, entre otros |
| Finales | Concurso de acreedores, Soto del Real, la Cooperativa, la Revista de millonarios, Tiburón Pasiego, Pyme con ínfulas, Ruina lenta y, por voluntad propia, Vuelta a Selaya |
| Sonido | Efectos y música de fondo (pasodoble lo-fi generativo) sintetizados con WebAudio, sin ficheros de audio; se silencian por separado en el menú |

El diseño completo está en [`docs/GDD.md`](docs/GDD.md) y los consejos de estrategia en [`docs/GUIA.md`](docs/GUIA.md).

## Estructura

```
index.html, styles.css      Página y estilos (PC + móvil)
manifest.webmanifest, sw.js PWA (instalable y sin conexión)
offline-files.js           Catálogo generado del código offline (no editar a mano)
src/
  core/      Simulación pura y testeable (sin DOM): estado, economía, sucesos, acciones, inspecciones
  data/      Contenido: ciudades, negocios, políticas, sucesos, finales, frases de Manolo
  render/    Mapa 2.5D en Canvas, proyección y carga de arte con marcadores
  ui/        Interfaz: paneles, modales y controlador
assets/      Arte final + manifest.json (estado de cada recurso)
art/         Guía de estilo y peticiones de arte para el agente de arte
tools/       serve.py (servidor sin caché), art_catalog.py (genera las peticiones), check_assets.py
tests/       Tests de simulación + bot que juega partidas completas
docs/        Documento de diseño
```

Antes de validar o publicar cambios del código web, ejecuta `node tools/offline_catalog.mjs`. El runner Node comprueba que el catálogo esté actualizado y prueba instalación/actualización offline; el empaquetado de escritorio lo regenera automáticamente. Los hashes normalizan finales de línea de Git. El arte PNG y su manifiesto se actualizan independientemente, sin regenerar este catálogo.

## Tests

- **Navegador:** con el servidor arrancado, abre <http://localhost:8080/tests/>.
- **Node 18+** (opcional): `node tests/run-node.mjs`.

Incluyen un bot (`tests/bot.js`) que juega partidas completas con distintas estrategias y que sirve para
equilibrar la economía.

Fuera de la batería, tres herramientas de medida:

- `node tests/fuzz.mjs --seeds 30 --months 600 --rich --tame`: partidas caóticas con acciones válidas al
  azar. Cada mes comprueba que no haya números no finitos, valores fuera de rango, negocios duplicados,
  cartas sin opciones o que se repiten sin fin, y excepciones. Cada 12 meses guarda y carga la partida y
  comprueba que la cargada viva lo mismo que la original. Sale con código 1 si algo falla.
- `node tests/europe.mjs --seeds 32 --months 600 --only EU_goal`: el bot juega la campaña europea en
  paralelo y da el porcentaje de victorias con su intervalo de confianza, los meses hasta ganar y en qué
  se queda quien no gana.
- `node tests/balance.mjs`: barrida de la campaña clásica de ocho años.

## Flujo de arte (agente Codex)

1. `tools/art_catalog.py` define cada recurso: id, ruta, tamaño, ancla, prioridad y descripción.
2. Al ejecutarlo se generan `art/requests/*.md` y `assets/manifest.json` (conservando lo ya entregado).
3. El agente de arte crea las imágenes, marca `"status": "done"` y pasa `python tools/check_assets.py`.
4. El juego carga automáticamente todo lo que esté como `done`.

El contrato detallado está en [`AGENTS.md`](AGENTS.md).

## Distribución

- **Web / itch.io / GitHub Pages:** sube la carpeta tal cual (es estática).
- **Móvil:** desde el navegador, "Añadir a pantalla de inicio" (PWA).
- **Escritorio (Windows .exe portable):** la carpeta `desktop/` empaqueta el juego con Electron (MIT). Con
  Node.js 18+:

  ```bash
  cd desktop && npm install && npm run dist
  ```

  El ejecutable sale en `desktop/dist/`. `npm start` abre el juego en una ventana sin empaquetar. Si el
  agente de arte ha entregado `assets/ui/app_icon_512.png`, se usa como icono del `.exe`.

## Aviso

Es una sátira. Manolo es un personaje de ficción y cualquier parecido con un empresario real es pura
coincidencia (o no). Las marcas, los personajes y las instituciones que aparecen son inventados o genéricos.


### Expansión 0.5

En **Mercado** se investigan 24 innovaciones y se negocian acuerdos extranjeros. Marca blanca exige sobaos del obrador; una licencia deja que el socio fabrique con tu marca y te pague royalties. Las auditorías reducen el riesgo, pero no evitan todos los impagos, defectos o copias de receta. Los contratos duran 24 meses y su rescisión anticipada cuesta 5.000 €.

El obrador de Selaya admite módulos industriales de coste creciente tras sus tres mejoras iniciales. Abrir un local o comprar un inmueble cuesta según la ciudad. Las viviendas de plantilla se compran como **Residencial Boomerez**, no requieren licencia turística y solo alojan a empleados de la localidad. El alquiler se fija en **Equipo → Viviendas**; la presión aumenta el control y tiene consecuencias en moral e inspecciones.

Los negocios ajenos a sobaos no necesitan su producción. Si sobra capacidad, pueden recibir sobaos de cortesía: hasta +5 % de ingresos, con las materias, personal y transporte correspondientes. El mapa incluye 50 capitales provinciales, Ceuta, Melilla y los tres destinos adicionales originales. Los índices de población, renta y coste local son valores de juego. La lista de capitales se contrastó con las [Directrices toponímicas del IGN, apartado 6.2](https://www.ign.es/web/resources/acercaDe/libDigPub/Directrices_toponimicas_2023.pdf).


### Campaña europea 0.6

**Las viviendas se construyen en Equipo → Viviendas**, al principio del panel. Cada ciudad con personal tiene un botón de compra. También están en Ciudad → Abrir. Son residenciales; los apartamentos turísticos son otro negocio. La oferta laboral local se amplía con viviendas: antes de comprar una gran ampliación verás cuántas plazas faltan. Si vendes las viviendas, la actividad puede bajar por falta de empleados.

La campaña normal es continua y persigue 1.000 M€ de patrimonio, presencia propia en ocho países europeos y banca, telecomunicaciones y logística. El reto semanal sigue siendo clásico, de ocho años. Desde **Manolo** puedes nombrar sucesor: con estrés de 90 o más durante tres meses aparece riesgo mortal y el reposo lo evita; a los 80 años se produce el relevo. La empresa conserva activos, deuda, contratos, productos y calendario. Los sucesores también envejecen.

Tras ganar Europa puedes elegir **Seguir jugando (modo infinito)**. Volver al título conserva el desenlace y la empresa: **Ver desenlace** permite reabrirlo y continuar, incluso si cerraste el juego en esa pantalla. El récord se guarda una sola vez. Nueva partida y el reto semanal piden confirmar antes de sustituir un desenlace guardado. Las promesas bursátiles siguen cada trimestre en Europa después del octavo año; la campaña clásica mantiene su límite.

En **Expansión → I+D** hay 35 proyectos de I+D, incluidos producción, automatización y ahorro. Las licencias de banca, telecomunicaciones y logística desbloquean esos negocios. Una Academy crece con tu fama y con el número de negocios de la red. Los locales se reforman hasta nivel diez y las grandes ciudades soportan más establecimientos del mismo tipo.

Para abrir en el extranjero: cumple **seis meses de marca blanca con al menos el 90 % del pedido servido en ese país**, termina **Despliegue comercial internacional** y entra en **Expansión → Exterior → Abrir tus propios negocios en Europa**. El selector de ciudades también muestra esos destinos; el mapa principal conserva España. Una licencia de fabricación ajena no cuenta como experiencia de marca blanca. Rescinde una licencia exclusiva antes de abrir allí con tu marca.
