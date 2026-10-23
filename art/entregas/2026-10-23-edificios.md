# Primera entrega de edificios

Generación: herramienta integrada `image_gen`; ajuste mecánico de escala y posición con System.Drawing. PNG RGBA de 8 bits, 256×256, fondo transparente. Ancla frontal alineada con (128, 240). Huella del obrador de unos 200 px y tiendas de unos 150 px.

## Prompts de producción

Base común: sprite individual de juego, diorama de mesa 2.5D con volúmenes de maqueta pintada, proyección isométrica 2:1 desde el sureste, iluminación cálida superior izquierda y sombra suave marrón-violeta. Silueta legible a 66 px. Fondo alfa transparente; sin marcas reales ni elementos fuera de la base.

- `assets/buildings/bld_obrador_1.png`: casona pasiega tradicional ligeramente destartalada en Selaya; piedra, balcón de madera, teja roja, chimenea humeante, prado verde y vaca pasiega marrón. Rótulo «SOBAOS BOOMEREZ», «desde 1962». Paleta ámbar, crema, madera y verde cantábrico.
- `assets/buildings/bld_sobaos_express.png`: franquicia barata de una planta con toldo naranja, neón amarillo, rótulo «Sobaos Manolo Express» y cartel «¡OFERTA 3×2!». Mascota de sobao sonriente. Revisión: subir las gafas a la parte superior de la cabeza y dejar visibles los ojos, preservando el edificio.
- `assets/buildings/bld_sobaos_maison.png`: boutique negra mate con molduras doradas, lateral morado, toldo granate, dos maceteros de boj y un único sobao iluminado sobre pedestal de mármol. Rótulos «Maison Boomerez» y «Pâtisserie Pasiega». Revisión: orientar fachada y lateral igual que Express, conservando textos sin reflejarlos.

Verificación: inspección visual de los sprites finales, tamaño, canal alfa y `python tools/check_assets.py`. Esta entrega completa tres solicitudes; las restantes conservan su estado pendiente.
