# Arte — peticiones para el agente de arte

| Fichero | Contenido | Recursos |
|---|---|---|
| [STYLE_GUIDE.md](STYLE_GUIDE.md) | Paleta, proyección isométrica, reglas técnicas, hoja de personaje de Manolo | — |
| [requests/02_mapa.md](requests/02_mapa.md) | Mapa de España en maqueta 2.5D, con calibración | 1 |
| [requests/03_edificios.md](requests/03_edificios.md) | Sprites isométricos de los negocios | 12 |
| [requests/04_retratos.md](requests/04_retratos.md) | Retratos de Manolo (6 expresiones) y del resto del reparto | 27 |
| [requests/05_sucesos.md](requests/05_sucesos.md) | Ilustraciones de las cartas de suceso | 30 |
| [requests/06_finales.md](requests/06_finales.md) | Ilustraciones de los finales | 7 |
| [requests/07_interfaz.md](requests/07_interfaz.md) | Logotipo, fondo del título, iconos de app y de interfaz | 22 |

El estado de cada recurso está en [`../assets/manifest.json`](../assets/manifest.json). El procedimiento
completo está en [`../AGENTS.md`](../AGENTS.md).

**Orden recomendado:** prioridad 1 (mapa, Manolo, edificios básicos, inspecciones, logotipo) → prioridad 2 → prioridad 3.

> Estas fichas se generan con `python tools/art_catalog.py`. No las edites a mano: los cambios se perderían
> la próxima vez que se regeneren. Las notas de la entrega van en el campo `notes` del manifiesto.
