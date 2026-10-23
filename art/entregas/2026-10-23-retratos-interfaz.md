# Lucía, Remedios y recursos de interfaz

Generación con `image_gen` integrada y ajuste mecánico de tamaños con System.Drawing. Retratos e iconos PNG RGB opacos de 8 bits; fondo de título PNG indexado de 256 colores con tramado Floyd-Steinberg para mantener degradados y peso inferior a 1,5 MB. El icono de 192 px deriva de la misma imagen que el de 512 px.

## Prompts de producción

- `assets/portraits/portrait_periodista.png`, 512×512: Lucía Ferrer, periodista de 35 años, melena corta castaña, gafas redondas finas, gabardina beige sobre jersey de cuello alto, libreta de espiral y bolígrafo mordisqueado. Mirada curiosa, serena y tenaz, media sonrisa conocedora. Fondo #2e8b7a. Manolo neutral como referencia exclusivamente de estilo 2.5D; busto a tres cuartos hacia la izquierda, luz cálida superior izquierda y cara central.
- `assets/portraits/portrait_madre.png`, 512×512: Doña Remedios, madre de Manolo de 81 años, pelo blanco cardado, rebeca gris, collar pequeño de perlas, bastón de aluminio y táper de croquetas; menuda pero temible, mirada severa y cariñosa. Fondo #6b8e9e. Mismo estilo de busto 2.5D, orientación e iluminación.
- `assets/ui/bg_title.png`, 1920×1080: valle pasiego al atardecer como diorama 2.5D, prados verdes, cabañas de piedra con balcones de madera y vacas marrones. Skyline imposible de rascacielos con forma de sobao al fondo. Franja vertical central de unos 700 px clara, cálida y desenfocada, sin objetos protagonistas, para superponer logotipo, Manolo y botones oscuros. Sin texto ni interfaz pintada.
- `assets/ui/app_icon_512.png`, 512×512, y `assets/ui/app_icon_192.png`, 192×192: sobao dorado con bigote gris, sonrisa autosuficiente, gafas subidas sobre la cabeza y ambos ojos visibles; fondo cuadrado naranja #e8a33a con esquinas suaves, sin texto y rostro dentro de zona segura circular. Revisión generativa para limpiar el fondo y mantenerlo opaco, sin huecos ni viñeteado negro.

Inspección visual de todos los archivos finales, legibilidad del icono reducido, zona central del fondo de título, dimensiones, opacidad y peso. Ejecutado `python tools/check_assets.py` antes del commit.
