# Guía de estilo visual — Manolo Boomerez S.L.

## Concepto

**Diorama 2.5D costumbrista y satírico.** España como una maqueta de mesa: piezas con volumen, luz cálida
de media tarde y sombras suaves. La mezcla de lo rural (Cantabria pasiega) con lo "emprendedor" (neón,
coworking, LinkedIn) es el chiste visual de todo el juego.

- Referencias de **sensación** (no copiar): juegos de gestión con maquetas 2.5D y humor (Two Point
  Hospital, Theme Hospital) y las caricaturas de la prensa satírica española.
- Personajes: caricatura editorial con volumen, cabezas algo grandes y expresiones muy legibles.
- El blanco de la burla es **Manolo** y el mundillo del emprendedor de pacotilla. A los trabajadores,
  vecinos e inspectores se les dibuja con dignidad y simpatía.

## Paleta

| Uso | Color |
|---|---|
| Acento principal (sobao, botones) | `#e8a33a` |
| Acento oscuro | `#b9741a` |
| Marrón de interfaz / barra superior | `#3b2a1a` |
| Papel / fondo de paneles | `#f6ecd9`, `#fffaf0` |
| Verde cantábrico | `#6fa65a` |
| Ocre meseta | `#d1bc7a` |
| Mar | `#5aa9d6` → `#2f6f9f` |
| Peligro / Hacienda | `#c0392b` |
| Marca Express | `#e8a33a` (naranja chillón + neón amarillo) |
| Marca Maison | `#7a4fa0` + negro mate + dorado |

Luz: cálida, desde arriba a la izquierda. Sombras hacia abajo a la derecha, suaves y con un tinte
marrón-violeta (nunca negro puro).

## Reglas técnicas

1. **Formato:** PNG de 8 bits por canal. Transparencia solo donde la ficha lo pide (edificios, iconos, logotipo).
2. **Tamaños exactos:** los que indica cada ficha y `assets/manifest.json`. El juego escala, pero el
   ancla y los recortes dependen del tamaño.
3. **Edificios:** proyección isométrica 2:1 vista desde el sureste, con el **ancla en (128, 240)** (centro
   inferior de la base). Los edificios conviven en grupos de hasta 6 por ciudad, así que deben compartir
   escala: una tienda de calle mide unos 150 px de base y el obrador hasta 200 px.
4. **Retratos:** 512×512 con fondo pintado del color indicado. La cara, dentro del círculo central de
   unos 380 px de diámetro.
5. **Sin texto legible**, salvo los rótulos cortos que pida la ficha (nombres de tiendas). El juego está en
   español: cualquier rótulo, en español.
6. **Peso:** cada PNG debería ocupar menos de 1,5 MB (el mapa, menos de 4 MB). Comprime sin pérdida
   visible (por ejemplo, con `oxipng` o `pngquant --quality 80-95`).
7. **Coherencia de Manolo:** calvo con pelo canoso a los lados, bigote canoso, gafas de sol SUBIDAS en la
   calva, polo salmón con el cuello levantado y cadena de oro. Siempre igual.
8. **Sin marcas reales** (ni logotipos de supermercados, bancos, redes sociales o coches). Todo inventado o genérico.

## Mientras no hay arte

El juego genera marcadores por código (cajas isométricas de colores, caricaturas planas y emojis). Sirven
de referencia de **composición, tamaño y ancla**: el arte final debe ocupar el mismo espacio que el marcador.
