# Equilibrado de la 0.4

Medido con `node tests/balance.mjs --seeds 32` (semillas `(i+1)·7919+13`, modo infinito, patrimonio en el
mes 96; «revista» es el primer mes con 15 M€ o más). Explotar = políticas aplicadas desde el mes 24.
Patrimonio en millones de euros: mediana (media).

| Variante | 0.3 | 0.4 | Revista 0.3 → 0.4 |
|---|---|---|---|
| Básico (solo sobaos) | 0,5 (0,4) | 0,5 (0,4) | 0/32 → 0/32 |
| Diversifica, legal | 10,0 (10,8) | 10,5 (10,6) | 9/32 → 6/32 |
| Al azar | 1,5 (1,8) | 1,8 (1,6) | 0/32 → 0/32 |
| Modo Hacienda | 11,5 (12,9) | 9,0 (11,2) | 13/32 → 11/32 |
| Express listo, legal | 19,4 (18,2) | 16,2 (15,9) | 20/32, mes 77 → 20/32, mes 86 |
| Express, mínimo + voluntarias | 33,2 (30,9) | 13,7 (13,0) | 29/32 → 13/32 |
| Express, explotar vigilando el radar | 28,3 (26,1) | 14,7 (15,3) | 27/32 → 16/32 |
| Express, falsos autónomos | 38,1 (35,8) | 5,8 (6,0) | 31/32 → 3/32 |
| Express, congela siempre el convenio | 19,4 (18,2) | 14,9 (14,0) | 20/32 → 16/32 |
| Maison lista, legal | 46,3 (44,8) | 35,2 (35,7) | 32/32, mes 64 → 32/32, mes 66 |
| Maison, mínimo + voluntarias | 59,8 (59,1) | 31,6 (32,8) | 32/32, mes 56 → 31/32, mes 66 |
| Maison, explotar vigilando el radar | 60,5 (58,6) | 32,7 (35,0) | 32/32 → 32/32 |
| Maison, congela siempre el convenio | 46,3 (44,8) | 32,0 (30,5) | 32/32 → 31/32 |

## Lectura

- **Explotar ya no compensa.** En la 0.3, mínimo + voluntarias daba un 71 % más que jugar legal en Express y un
  29 % más en Maison; en la 0.4 da un 15 % y un 10 % menos. La diferencia es la liquidación de lo ahorrado
  frente al convenio (8 M€ de media por partida) y el agravio, que baja la moral.
  (Con 96 semillas, explotar *vigilando el radar* queda a la par o algo por encima: ver la última sección.)
- **La moral ya no está siempre a tope.** Meses con moral de 95 o más tras el mes 24 (Maison legal): del 90 %
  al 74 %; explotando, del 24 % al 21 %, y congelando el convenio, al 19 %, con 3,3 huelgas generales por partida.
- **El final de partida es más exigente para el jugador fuerte.** Salir a Bolsa ya no es un atajo (la valoración
  mezcla libros y beneficio y hay 6 meses de bloqueo) y, cotizando, el sentimiento del mercado depende de cumplir
  las promesas del trimestre. La revista llega más o menos cuando antes para la Maison (mes 66) y 9 meses más
  tarde para la Express.
- **La cartilla de Doña Remedios** no cambia el resultado del bot listo (15,0 frente a 14,8 de mediana) y, con
  el año de respiro tras devolver, tampoco el del que diversifica.

## Tras la revisión de las piezas 3 a 6 (96 semillas)

Con 32 semillas la mediana se mueve hasta un 10 % con solo cambiar cuándo sale una carta forzada (el orden de
los sucesos cambia en todas las partidas), así que esta comparación usa 96 semillas (`--seeds 96`) y la
**media**. Antes: el commit `66b2ef7`; después: con los 30 arreglos de la revisión.

| Variante | Antes | Después | Revista antes → después |
|---|---|---|---|
| Express listo, legal | 16,6 | 16,9 | 64/96 → 69/96 |
| Express, explotar vigilando el radar | 16,9 | 18,3 | 64/96 → 79/96 |
| Express, mínimo + voluntarias | 12,4 | 14,6 | 45/96 → 66/96 |
| Maison lista, legal | 36,0 | 38,8 | 96/96 → 95/96 |
| Maison, explotar vigilando el radar | 34,9 | 39,3 | 96/96 → 96/96 |
| Maison, mínimo + voluntarias | 32,2 | 34,5 | 95/96 → 95/96 |

- **Cotizar sale algo mejor para todos** (del 2 % al 8 %): la guía prudente ya no hunde el sentimiento a la
  larga y el cierre del trimestre estima con el mes que falta.
- **Explotar a lo bruto sigue perdiendo** frente a jugar legal: un 14 % menos en Express y un 11 % menos en Maison.
- **Explotar vigilando el radar ya estaba a la par** con 96 semillas (la tabla de 32 exageraba la diferencia) y
  ahora queda un 8 % por encima en Express y un 1 % en Maison. Repartido entre la Bolsa, los objetivos que ya no
  se atascan y el nuevo orden de los sucesos, sin un culpable único. No viene de la liquidación: subirla a ×1,5,
  o cobrar la mitad al momento con un 15 % de recargo, apenas lo mueve (de 18,3 a 17,8-17,9 en Express).
  **Pendiente para la 0.5:** decidir si leer bien el radar debe compensar y, si no, qué palanca usar (ventana de
  la liquidación, denuncias del comité, probabilidad de visita con agravio alto).
- «Da trabajo a 50 personas» ya no queda bloqueado detrás de una inspección limpia, y ahora solo da reputación
  con el empleo en regla (si no, fama +2).
