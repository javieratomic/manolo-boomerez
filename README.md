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

**Controles:** clic o toque en una ciudad para abrir negocios · arrastrar para mover el mapa · rueda o
pellizco para el zoom (en el móvil, tocar dos ciudades juntas acerca el mapa) · `Espacio` cierra el mes ·
`1`-`7` cambia de pestaña · `1`-`4` elige opción en las cartas · `,` y `.` recorren las ciudades con alerta.

## Cómo funciona

| Sistema | Resumen |
|---|---|
| Turnos | Un mes por turno; campaña europea continua con sucesores. Reto semanal clásico de 96 meses |
| Marca | Al empezar eliges **Express** (low-cost, volumen) o **Maison** (boutique delicatessen) |
| Producción | Selaya y obradores regionales; capacidad y automatización por I+D, ampliaciones industriales sin tope y plantilla que necesita vivienda |
| Negocios | Sobaos, vivienda, turismo, hostelería, gimnasio, coworking, residencia, Academy, banca, telecom y logística; diez niveles. Empanadas solo al asociarse con Rodrigo |
| Mapa | 55 destinos españoles y 16 ciudades extranjeras tras experiencia de marca blanca e I+D |
| Economía | Ciclo de expansión, burbuja, crisis y recuperación; costes de estructura crecientes |
| Competencia | 9 cadenas rivales con IA que te copian; guerra de precios, reseñas falsas, fichajes y OPA |
| Mercado | Campañas, 35 proyectos I+D y diez países para marca blanca o licencias |
| Equipo | 5 puestos directivos con candidatos que tienen nivel y manías |
| Vida | Caprichos, familia, sucesión y salida a Bolsa a partir de una valoración de 1.000 M€ |
| Sinergias | Academy y coworking locales +15 %; vender sobaos aumenta la demanda local de gimnasio el mes siguiente (hasta +35 %) |
| Vivienda y beneficios | Empleados prioritarios y vacantes para el público, tarifas separadas por ciudad en Plantilla; descuento asistencial del 20 % para familiares con plazas reales |
| Logística | Transporte por kilómetro desde el obrador más cercano, obradores regionales, licencias de pisos turísticos |
| Rejugabilidad | Cláusula del testamento (reto opcional por partida), semilla compartible y reto de la semana, balance anual, salón de la fama, logros entre partidas y modo infinito |
| Información | Previsión de cada política (mes que viene y 6 meses), «¿Por qué?» en cada indicador y parte del mes |
| Memoria | Los inspectores recuerdan tus trucos y sanciones; Navidad y agosto recuerdan tus costumbres; el Archivo lo enseña todo |
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

## Tests

- **Navegador:** con el servidor arrancado, abre <http://localhost:8080/tests/>.
- **Node 18+** (opcional): `node tests/run-node.mjs`.

Incluyen un bot (`tests/bot.js`) que juega partidas completas con distintas estrategias y que sirve para
equilibrar la economía.

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

El obrador de Selaya admite módulos industriales de coste creciente tras sus tres mejoras iniciales. Abrir un local o comprar un inmueble cuesta según la ciudad. Las viviendas de plantilla se compran como **Residencial Boomerez**, no requieren licencia turística y solo alojan a empleados de la localidad. El alquiler se fija en **Plantilla**; la presión aumenta el control y tiene consecuencias en moral e inspecciones.

Los negocios ajenos a sobaos no necesitan su producción. Si sobra capacidad, pueden recibir sobaos de cortesía: hasta +5 % de ingresos, con las materias, personal y transporte correspondientes. El mapa incluye 50 capitales provinciales, Ceuta, Melilla y los tres destinos adicionales originales. Los índices de población, renta y coste local son valores de juego. La lista de capitales se contrastó con las [Directrices toponímicas del IGN, apartado 6.2](https://www.ign.es/web/resources/acercaDe/libDigPub/Directrices_toponimicas_2023.pdf).


### Campaña europea 0.6

**Las viviendas se compran en Plantilla → Viviendas para empleados**, al principio del panel. Cada ciudad con personal tiene un botón de compra. También están en Ciudad → Abrir. Son residenciales; los apartamentos turísticos son otro negocio. La oferta laboral local se amplía con viviendas: antes de comprar una gran ampliación verás cuántas plazas faltan. Si vendes las viviendas, la actividad puede bajar por falta de empleados.

La campaña normal es continua y persigue 1.000 M€ de patrimonio, presencia propia en ocho países europeos y banca, telecomunicaciones y logística. El reto semanal sigue siendo clásico, de ocho años. Desde **Manolo** puedes nombrar sucesor: con estrés de 90 o más durante tres meses aparece riesgo mortal y el reposo lo evita; a los 80 años se produce el relevo. La empresa conserva activos, deuda, contratos, productos y calendario. Los sucesores también envejecen.

En **Mercado** hay 35 proyectos de I+D, incluidos producción, automatización y ahorro. Las licencias de banca, telecomunicaciones y logística desbloquean esos negocios. Una Academy crece con tu fama y con el número de negocios de la red. Los locales se reforman hasta nivel diez y las grandes ciudades soportan más establecimientos del mismo tipo.

Para abrir en el extranjero: cumple **seis meses de marca blanca con al menos el 90 % del pedido servido en ese país**, termina **Despliegue comercial internacional** y entra en **Mercado → Acuerdos internacionales → Abrir tus propios negocios en Europa**. El selector de ciudades también muestra esos destinos; el mapa principal conserva España. Una licencia de fabricación ajena no cuenta como experiencia de marca blanca. Rescinde una licencia exclusiva antes de abrir allí con tu marca.
