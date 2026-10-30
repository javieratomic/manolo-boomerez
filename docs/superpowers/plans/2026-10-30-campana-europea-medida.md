# 0.19.0 — La campaña europea, medida (30-10-2026)

Petición: «puedes seguir desarrollando las próximas 4 horas», con be-ambitious.

## Objetivo
Que quien empiece la campaña por defecto pueda terminarla: que se pueda ganar a un ritmo razonable, sin
trucos que rompan la cuenta ni atascos. El juez no es el agente sino herramientas que se pueden repetir.

## Jueces
- `tests/europe.mjs`: el bot (`europe: true` en `tests/bot.js`) juega la campaña entera en paralelo; victorias
  con intervalo de Wilson, mediana de meses con bootstrap, hitos y en qué se queda quien no gana.
- `tests/fuzz.mjs`: partidas caóticas con invariantes cada mes y la comprobación de que una partida cargada
  vive igual que la original.
- Caza de trucos: una hipótesis por grupo (vivienda, franquicias, estimaciones, países, Bolsa/OPA), un
  cazador que la reproduce con un script y un verificador que intenta refutarla.
- Revisión adversaria de los cambios (corrección, verdad de los textos, herramientas).

## Resultados
| Medida | Antes | Después |
|---|---|---|
| Victorias europeas (EU_goal_delta, 24 semillas, 30 años) | 24/24, mediana 250 m | 24/24, mediana 257 m (IC95 244-264) |
| Partida clásica con franquicias ruinosas desde 80.000 € | revista en el mes 5 | 3 franquicias y pérdidas por demandas |
| Estimación del banco de Madrid frente al resultado real | 492.577 / 468.952 € | iguales |
| Victorias de un jugador corriente (EU_casual, 50 años) | — | 24/24, mediana 502 m (IC95 473-513) |
| Meses de fuzzing sin fallos de invariantes | — | unos 58.000 |
| Tests | 321 Node | 328 Node, 374 navegador |

## Decisiones
- No se cambia el ritmo de la campaña europea: el bot gana entre los 21 y los 24 años de partida, antes de
  que Manolo cumpla 80.
- La franquicia ruinosa se sigue pudiendo firmar (la interfaz ya avisa); se limita el volumen a 3 por mes.
- Se deja para el usuario: la campaña clásica es mucho más fácil que en la 0.4, la inflación salarial sin
  precios en partidas muy largas y varias cuestiones del relevo (ver `HANDOFF.md`).
