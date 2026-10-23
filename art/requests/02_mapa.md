# Mapa de España (maqueta 2.5D)

El fondo del mapa principal. Es el recurso más visible del juego.

Lee antes `art/STYLE_GUIDE.md`. Cuando termines un recurso, marca su `status` como `done` en `assets/manifest.json` (ver `AGENTS.md`).

## map_spain

- **Archivo:** `assets/map/map_spain.png`
- **Tamaño:** 2048×1088 px
- **Prioridad:** 1 (1 = imprescindible, 3 = cuando haya tiempo)

Mapa de la península ibérica en forma de **maqueta de mesa / diorama** con vista cenital ligeramente inclinada (NO isométrica rotada: el norte queda arriba y la costa cantábrica es horizontal). La tierra es un bloque con grosor: la cara superior es el terreno y el borde sur de cada costa muestra un canto de tierra de ~14 px (efecto bloque de plastilina o cartón pintado). Incluye el mar alrededor (azul con olas sutiles pintadas). España a todo color: verde húmedo en la cornisa cantábrica y Galicia, ocres y amarillos en la meseta, tonos tostados en Andalucía y Murcia. Relieve suave pintado (Picos de Europa, Pirineos, Sistema Central, Sierra Nevada). Portugal y Francia en gris o beige desaturado ('fuera del mercado'). Baleares a color. **Canarias en un recuadro** abajo a la izquierda (marco discontinuo claro), como en los mapas del tiempo. NO pintes nombres de ciudades, ni plazas, ni carreteras: eso lo dibuja el juego encima. Deja el entorno de cada ciudad despejado (sin montañas en un radio de ~50 px).

**Calibración obligatoria** (para que las ciudades caigan en su sitio):

```
x = (longitud + 9.5) × 145.5 + 6
y = (44.0 − latitud) × 117.8 + 40
```

El recuadro de Canarias va de (13, 938) a (537, 1055) (coordenadas ficticias lon −9.45…−5.85, lat 35.38…36.38 con la misma fórmula). Dentro van las islas, de oeste a este: La Palma, El Hierro (abajo), La Gomera, Tenerife, Gran Canaria (centro en (290, 1020)), Fuerteventura y Lanzarote.

Puntos de control (el centro de la plaza de cada ciudad debe caer en tierra firme y cerca de su posición real):

- Selaya (sede, obrador): (770, 158)
- Santander: (835, 104)
- Bilbao: (962, 127)
- Donostia: (1100, 120)
- Oviedo: (537, 115)
- A Coruña: (165, 115)
- Valladolid: (701, 317)
- Salamanca: (565, 397)
- Zaragoza: (1260, 317)
- Madrid: (850, 462)
- Barcelona: (1704, 347)
- València: (1333, 574)
- Alicante: (1318, 706)
- Murcia: (1224, 748)
- Sevilla: (518, 819)
- Málaga: (745, 898)
- Granada: (864, 843)
- Palma: (1774, 562)
- Las Palmas (recuadro de Canarias): (290, 1015)
