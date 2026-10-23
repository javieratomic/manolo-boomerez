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
pellizco para el zoom · `Espacio` cierra el mes · `1`-`6` cambia de pestaña · `1`-`4` elige opción en las cartas.

## Cómo funciona

| Sistema | Resumen |
|---|---|
| Turnos | 1 mes por turno, 96 meses (2026-2033) |
| Marca | Al empezar eliges **Express** (low-cost, volumen) o **Maison** (boutique delicatessen) |
| Producción | Todo sale del obrador de Selaya; si no da abasto, las tiendas venden menos. Tiene 3 mejoras |
| Negocios | Tiendas de sobaos (propias o franquicias), Residencial para la plantilla, pisos turísticos, smash burgers, empanadas y la Academy |
| Políticas | Salarios, horas extra, becarios, alquiler de los pisos de la plantilla, contabilidad e ingredientes |
| Riesgo | Radares de Inspección de Trabajo y de Hacienda → inspecciones, auditorías, multas y expedientes penales |
| Sucesos | 39 cartas satíricas con decisiones (el cuñado y su SobaoCoin, la rata viral, la huelga, el jefe infiltrado...) |
| Objetivos | 9 objetivos encadenados que guían la partida y dan pequeñas recompensas |
| Dificultad | Modo cuñado (fácil), Emprendedor (normal) y Modo Hacienda (difícil) |
| Logros | 21 logros que se guardan entre partidas, uno por cada final |
| Finales | Concurso de acreedores, Soto del Real, la Cooperativa, Forbes, Tiburón Pasiego, Pyme con ínfulas, Ruina lenta |
| Sonido | Efectos sintetizados con WebAudio (sin ficheros de audio); se puede silenciar en el menú |

El diseño completo está en [`docs/GDD.md`](docs/GDD.md).

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
- **Escritorio (.exe):** se puede empaquetar con [Tauri](https://tauri.app) (MIT/Apache-2.0) o Electron (MIT)
  apuntando a `index.html`. No hace falta tocar el código del juego.

## Aviso

Es una sátira. Manolo es un personaje de ficción y cualquier parecido con un empresario real es pura
coincidencia (o no). Las marcas, los personajes y las instituciones que aparecen son inventados o genéricos.
