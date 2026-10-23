# Manolo Boomerez S.L. — Documento de Diseño (GDD)

> *"Yo a vuestra edad ya tenía un Audi."* — Manolo Boomerez, joven emprendedor (55 años)

## 1. Concepto

Juego de gestión satírico por turnos (1 turno = 1 mes). Eres **Manolo Boomerez**, un "joven emprendedor"
de 55 años que acaba de heredar de su padre, Don Anselmo (q.e.p.d.), el **Obrador Boomerez** de sobaos
pasiegos en **Selaya (Cantabria)**. Un negocio familiar, tradicional y honrado... que da justo para vivir.

Manolo quiere más. Quiere franquicias por toda España, un imperio inmobiliario, smash burgers, empanadas
argentinas y una academia de "mentalidad de tiburón". Y quiere hacerlo **rápido y barato**: falsos
autónomos, becarios, horas extra "voluntarias", contabilidad creativa, pisos para la plantilla
(descontando el alquiler de la nómina, que así no se quejan)...

Por el camino se cruzarán la **Inspección de Trabajo**, **Hacienda**, la plantilla, los vecinos, los
franquiciados arruinados, el cuñado con sus criptomonedas y la propia hija de Manolo.

**Tono:** sátira del empresario español "hecho a sí mismo" (que heredó). Humor costumbrista, nunca cruel con
los trabajadores: el blanco de la burla es siempre Manolo.

## 2. Plataformas y tecnología

- **Web (HTML5 + Canvas 2D + JS puro, módulos ES)**. Sin dependencias, sin motor de pago, sin build.
- **PC** como objetivo principal (ratón y teclado). **Móvil** con diseño adaptable, gestos táctiles y PWA
  instalable que funciona sin conexión.
- Empaquetado de escritorio opcional: Tauri o Electron (ambos con licencia MIT), o publicarlo en itch.io / GitHub Pages.

## 3. Bucle principal

1. **Planificar el mes**: abrir o vender negocios, ajustar las políticas (plantilla, fiscalidad e
   ingredientes), pedir préstamos, contratar asesores y elegir **una acción de Manolo**.
2. **Cerrar el mes**: la simulación calcula demanda, producción, ingresos, costes e impuestos, y actualiza
   reputación, moral, fama y los dos radares (Inspección de Trabajo y Hacienda).
3. **Resolver sucesos**: inspecciones, auditorías, eventos aleatorios y eventos de calendario (Navidad,
   agosto...). Cada uno es una carta con opciones y consecuencias.
4. Repetir durante **8 años (96 meses)** o hasta llegar a un final anticipado.

## 4. Decisión inicial: la marca

| Enfoque | Negocio | Precio | Volumen | Le va bien en |
|---|---|---|---|---|
| **Sobaos Manolo Express** (low-cost) | Tienda barata con mucho volumen | 3,20 €/ud | Alto | Ciudades grandes y populares |
| **Maison Boomerez** (boutique delicatessen) | Pâtisserie pasiega "de autor" | 10 €/ud | Bajo | Ciudades ricas y turísticas; castiga mucho la mala calidad |

Cada tienda de sobaos puede ser **propia** (pagas tú el local y la plantilla) o una **franquicia**, que un
incauto compra por un canon de entrada. Tú le vendes el producto a precio mayorista y te quedas un 5 % de
royalties. Si el franquiciado pierde dinero 4 meses seguidos, quiebra y viene a pedirte cuentas.

## 5. Recursos y estadísticas

- **Caja**, **Deuda** (póliza de crédito: 0,55 % mensual en dificultad normal) y **Patrimonio** (caja − deuda + activos).
- **Reputación** (0-100): multiplica la demanda.
- **Moral de la plantilla** (0-100): afecta a la productividad y al servicio; por debajo de 25 hay riesgo de huelga.
- **Fama** (0-100): Manolo en LinkedIn y en las tertulias. Alimenta la Maison y la Academy.
- **Control** (%): parte de la plantilla que vive en pisos de Manolo. Reduce las denuncias y las huelgas.
- **Radar de Inspección de Trabajo** y **Radar de Hacienda** (0-100): suben con las malas prácticas y bajan
  despacio con el tiempo. Cuanto más alto el radar, más probable es la visita.
- **Expedientes penales**: con 3, Manolo acaba en prisión.

## 6. Políticas

| Política | Opciones (de legal a "emprendedor") |
|---|---|
| Salario | Convenio · Salario mínimo · Falsos autónomos y sobres |
| Horas extra | Pagadas · "Voluntarias" · Modo tiburón 24/7 |
| Becarios | Ninguno · Algunos (30 %) · Legión (60 %) |
| Alquiler de los pisos de la plantilla | Social · Mercado · Abusivo |
| Contabilidad | Limpia · Creativa · Artística |
| Ingredientes | Mantequilla pasiega · Margarina · Grasa industrial misteriosa |

Cada opción mueve el coste, la productividad, la moral, la reputación y los radares. Ninguna opción es
"gratis": la sátira está en la tentación.

## 7. Negocios

| Negocio | Se desbloquea | Notas |
|---|---|---|
| Obrador (sede, Selaya) | Inicio | Capacidad de producción; mejoras: 2.ª línea, robot alemán, nave en Torrelavega |
| Tienda de sobaos (según marca) | Inicio | Propia o franquicia |
| Residencial Boomerez | 3 tiendas | Pisos para tu plantilla. Alquiler descontado de la nómina. +Control |
| Apartamentos turísticos "Casa Manolo" | Mes 12 o 250.000 € en caja | Riesgo de prohibición municipal y de quejas vecinales |
| Manolo Smash Club | 4 tiendas o mes 18 | Burbuja: la moda del smash se desinfla con el tiempo |
| Empanadas El Gaucho Pasiego | 4 tiendas o mes 18 | Negocio estable que va creciendo |
| Boomerez Business Academy | Fama ≥ 25 | Cursos de "mentalidad de tiburón". Ingresos según la fama. Hacienda vigila |

La saturación reduce la demanda cuando hay varios negocios del mismo tipo en una ciudad.

## 8. Inspecciones

- **Inspección de Trabajo**: gravedad = suma de las infracciones activas × tamaño de la plantilla. Opciones:
  colaborar y regularizar, esconder a los becarios en la cámara frigorífica, invitar al inspector a
  sobaos y orujo (soborno), llamar a Don Cosme (requiere el abogado).
- **Auditoría de Hacienda**: se basa en la cuota defraudada acumulada. Opciones: pagar la paralela,
  culpar al gestor, colar tickets de cenas como gastos de representación, hacerse el anciano confuso.
  Si la cuota supera los 120.000 € y no regularizas, abren expediente por delito fiscal.

## 9. Finales

| Final | Condición |
|---|---|
| **Concurso de acreedores** | 3 meses seguidos en descubierto por encima del límite de crédito |
| **Soto del Real** | 3 expedientes penales |
| **La Cooperativa** | Moral a 0 durante 2 meses: la plantilla se queda la empresa |
| **Forbes (sección curiosidades)** | Patrimonio ≥ 15 M€ |
| **Tiburón Pasiego** | Al acabar los 8 años con ≥ 5 M€ |
| **Pyme con ínfulas** | Al acabar con ≥ 800.000 € |
| **Ruina lenta** | Al acabar por debajo de eso |

## 10. Progresión y rejugabilidad

- **Objetivos encadenados** (primera tienda → 3 tiendas → mejorar el obrador → diversificar → 1 M€ → 50
  empleados → 3 M€ → 5 M€ → 15 M€), con recompensas pequeñas y un aviso fijo en el mapa.
- **Dificultad:** *Modo cuñado* (150.000 € de herencia, radares ×0,7, multas ×0,7, menos interés),
  *Emprendedor* (normal) y *Modo Hacienda* (50.000 €, radares ×1,3, multas ×1,3, interés del 0,75 %).
- **Rebranding:** se puede cambiar de Express a Maison (150.000 €) o al revés (60.000 €, reputación −6) una vez
  cada 24 meses. Todas las tiendas de sobaos se reconvierten.
- **Logros** persistentes entre partidas (21), entre ellos uno por cada final.
- **Prensa:** titulares satíricos de *El Sobao Digital* en la hemeroteca.

## 11. Arte (2.5D)

Lo produce un agente aparte (Codex) a partir de `art/requests/`. El juego carga los recursos que aparecen
en `assets/manifest.json` con `"status": "done"`; los demás se sustituyen por marcadores generados por
código, así que el juego siempre se puede jugar. Consulta `AGENTS.md` y `art/STYLE_GUIDE.md`.

## 12. Pendiente / ideas futuras

- Música (pasodoble lo-fi). Los efectos de sonido ya están sintetizados.
- Modo infinito y estadísticas históricas entre partidas.
- Exportar e importar la partida para pasarla del PC al móvil.
- Localización (gl, eu, ca, en).
