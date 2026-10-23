# Seis retratos reutilizables de directivos

Generación con `image_gen` integrada; Manolo neutral se utilizó exclusivamente como referencia del estilo 2.5D. Conversión mecánica con System.Drawing a PNG RGB opaco de 8 bits, 512×512, menos de 0,6 MB por archivo.

## Prompts de producción

Base común: retrato reutilizable de busto, identidad diferente de Manolo, caricatura editorial con volúmenes 2.5D pintados, cabeza ligeramente grande, luz cálida superior izquierda y sombras suaves. Tres cuartos hacia la izquierda de la imagen, rostro central para recorte circular, fondo pintado opaco con degradado del color indicado. Sin texto, logos, escenario, marcas de agua ni otros personajes.

- `assets/portraits/portrait_exec_1.png`: mujer de 40 años, traje gris marengo, melena corta, gafas finas, mirada analítica. Fondo azul petróleo #1f5f7a.
- `assets/portraits/portrait_exec_2.png`: hombre de 35 años, rostro afeitado, pelo castaño peinado, chaleco acolchado sin mangas sobre camisa azul, sonrisa profesional de escuela de negocios. Fondo gris #7f8c8d.
- `assets/portraits/portrait_exec_3.png`: hombre de 50 años, americana de pana marrón, barba canosa, pelo gris revuelto y bolígrafo detrás de la oreja; mirada paciente de veterano. Fondo verde oliva #6b7a3a.
- `assets/portraits/portrait_exec_4.png`: mujer de 30 años, coleta alta, sudadera de startup sin texto y auriculares inalámbricos; energía y confianza de growth hacker. Fondo morado #6c3483.
- `assets/portraits/portrait_exec_5.png`: mujer de 55 años, pelo corto canoso, pañuelo al cuello, gafas colgadas de cadenita y carpeta de recursos humanos sin texto; firme y amable. Fondo terracota #b9663f.
- `assets/portraits/portrait_exec_6.png`: hombre de 45 años, traje azul brillante, pelo oscuro engominado, gemelos dorados visibles en muñecas cruzadas y expresión ambiciosa de tiburón empresarial. Fondo negro azulado #1c2833.

Inspección visual de los seis archivos finales, verificación de dimensiones, opacidad, atributos de ficha y peso. Ejecutado `python tools/check_assets.py` antes del commit.
