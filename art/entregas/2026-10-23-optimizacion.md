# Optimización de entregas para web y móvil

Atendida la nueva indicación de peso de `AGENTS.md`: se recomprimieron los 81 retratos y sucesos ya entregados, sin cambiar dimensiones, rutas, anclas, identidad ni estados del manifiesto.

Se utilizó libimagequant mediante el paquete `imagequant`, instalado fuera del repositorio como herramienta de compresión. Paleta perceptual de hasta 256 colores, calidad objetivo 95 y tramado moderado de 0,25. Cada PNG conserva fondo opaco; se comprobaron dimensiones antes de escribir y se detectan cambios concurrentes. Los originales se leyeron del commit de Git para evitar acumular pérdidas de recomprensión.

Los 81 archivos pasan de 59.846.240 a 13.364.218 bytes (reducción del 77,7 %); todos quedan por debajo de 300 KB, el mayor con 241.155 bytes. El conjunto de los 110 recursos entregados pasa de 69,34 a 22,86 MB.

Inspección visual de una muestra representativa: Manolo neutral, Vanessa, inversor misterioso, Hacienda, riders y burbuja; revisados rostros, degradados, sombras oscuras, neón y detalles pequeños. La compresión de paleta es perceptual y no es matemáticamente sin pérdida. No se regeneró arte ni se modificó código del juego. Detalle por archivo en `2026-10-23-optimizacion.json`.

Ejecutado `python tools/check_assets.py` sin errores antes del commit.
