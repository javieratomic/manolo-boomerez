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
| La Taberna del Emprendedor | 2 tiendas o mes 6 | Tapas; mejor con turismo y en verano |
| Boomer Fit 24h | Mes 12 o 5 tiendas | Gimnasio low-cost: lleno en enero, vacío en agosto |
| Hustle Hub Coworking | Fama ≥ 35 o Academy | Vive de la fama de Manolo y de la renta de la ciudad |
| Residencia Golden Age | Mes 24 o 2 M€ | 60 plazas; muy rentable en ciudades ricas, ruinosa en las pobres; plantilla grande |

Cada negocio propio se puede **reformar** dos veces (+15 % de clientela por nivel; más plazas en
residencias y viviendas, más pisos en los turísticos). Los costes de **estructura central** crecen como
n^1,4 con el número de negocios: crecer tiene rendimientos decrecientes.

**Mapa:** 30 ciudades (las 19 originales más Marbella, Ibiza, Pamplona, Vitoria, Burgos, León, Córdoba,
Toledo, Cáceres, Tarragona y Almería).

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

## 10. Sistemas de gestión

### Ciclo económico
Recuperación (10-18 meses) → Expansión (14-24) → Burbuja (8-14) → Crisis (8-16). Cada fase cambia la
demanda (−18 % a +12 %), el turismo, el límite de crédito (×0,65 a ×1,25), los intereses y la variación
mensual del valor de los inmuebles (−1,2 % a +1,2 %). Cada cambio de fase trae una carta con decisiones
(ERE, préstamo ICO, ampliar la póliza...).

### Competencia
Nueve cadenas rivales (Doña Rosa, MASA, Burger Bros, La Porteña, Vulture Capital, IronBros, Cañas & Tapas,
Silver Care, WeHustle) aparecen cuando entras en su sector y se expanden con preferencia hacia las ciudades
donde ganas dinero. Cada nivel de presencia (máx. 3) quita un 15 % de clientela a tus negocios del ramo.
Acciones: guerra de precios (−15 % tres meses; 75 % de que retrocedan), reseñas falsas, fichar a su
encargado y OPA (120.000 € por nivel; más barata en crisis; te quedas con hasta 4 locales).

### Logística y licencias
Cada sobao viaja desde el obrador más cercano: 0,025 € por cada 100 km por carretera (×1,5 a Baleares y
×2,2 a Canarias). Los **obradores regionales** (380.000 €, uno por ciudad) añaden 15.000 sobaos/mes de
capacidad y abaratan el transporte de su zona. En Barcelona, Madrid, Palma, Ibiza, Donostia y Málaga los
pisos turísticos necesitan una licencia de 120.000 €; sin ella son más baratos, pero suben el radar de
Hacienda y cada mes hay un 4 % de probabilidades de inspección municipal.

### Marketing e I+D
Campañas locales (buzoneo, vallas, fútbol) y nacionales (radio, influencers, tele autonómica). Doce
productos de I+D con efectos por sector, tipo de negocio, renta, tamaño de ciudad o temporada; la línea
de congelados añade un contrato fijo que consume capacidad del obrador.

### Equipo directivo
Cinco puestos (Operaciones, RR. HH., Finanzas, Marketing, Expansión), candidatos que se renuevan cada seis
meses con nivel 1-3 y un rasgo: leal, trepa (la competencia intenta ficharle), íntegro (te denuncia si
explotas), al borde del burnout, tiburón (rinde más, cobra más, sube los radares), MBA o enchufado (familia).

### Vida de Manolo y Bolsa
Siete caprichos (reloj, todoterreno, palco, cuadro, caballo, yate, chalet en Marbella) con fama,
mantenimiento y radar de Hacienda. La relación con Merche baja con el tamaño del imperio; por debajo de 30
avisa y por debajo de 15 pide el divorcio (gananciales). Salida a Bolsa a partir del mes 36 con 4 M€:
se vende el 25 % a 6 veces el beneficio con una prima (máximo ×1,4) según fama, reputación y ciclo; después la cotización
fluctúa y las caídas del 30 % provocan juntas de accionistas furiosas.

### Mantenimiento
Cada local propio tiene un estado de conservación (0-100) que cambia cada mes según la política:
empresa de mantenimiento (0,8 % del valor al mes, +0,4/mes), manitas del barrio (0,35 %, −0,4/mes) o
Kevin con cinta americana (0,05 %, −1,5/mes y algo de radar de Trabajo). Un local a cero vende un 25 %
menos y por debajo de 30 puede averiarse. Las reformas lo dejan como nuevo.

### Política
Elecciones en mayo de 2027 y mayo de 2031 entre dos partidos ficticios satirizados por igual: el PPS
(salario mínimo +4 %, Inspección +20 %, pisos turísticos más vigilados, consumo +3 %) y la ALE (impuesto de
sociedades −8 %, Inspección −15 %, consumo −2 %). Manolo puede "donar" a uno, al otro o a los dos.

### Estrés
Sube con el tamaño del imperio y con LinkedIn o el bar; baja con Marbella, la familia, el pádel y un equipo
directivo completo. Por encima de 80 llega un susto en la pista de pádel: reposo (tres meses sin acciones),
coach de mindfulness o arriesgarse a uno peor.

## 11. Progresión y rejugabilidad

- **Objetivos encadenados** (primera tienda → 3 tiendas → mejorar el obrador → diversificar → 1 M€ → 50
  empleados → 3 M€ → 5 M€ → 15 M€), con recompensas pequeñas y un aviso fijo en el mapa.
- **Dificultad:** *Modo cuñado* (150.000 € de herencia, radares ×0,7, multas ×0,7, menos interés),
  *Emprendedor* (normal) y *Modo Hacienda* (50.000 €, radares ×1,3, multas ×1,3, interés del 0,75 %).
- **Rebranding:** se puede cambiar de Express a Maison (150.000 €) o al revés (60.000 €, reputación −6) una vez
  cada 24 meses. Todas las tiendas de sobaos se reconvierten.
- **Logros** persistentes entre partidas (21), entre ellos uno por cada final.
- **Prensa:** titulares satíricos de *El Sobao Digital* en la hemeroteca.
- **Exportar/importar partida** desde el menú (archivo JSON) para pasarla del PC al móvil.
- **Balance de fin de año** cada diciembre, con el post de LinkedIn de Manolo.
- **Salón de la fama** local con las 10 mejores partidas.
- **Modo infinito** al terminar los 8 años (o al llegar a Forbes).
- **Fundación Boomerez**: asesor que da reputación y fama y desgrava un 10 % del impuesto.

## 12. Arte (2.5D)

Lo produce un agente aparte (Codex) a partir de `art/requests/`. El juego carga los recursos que aparecen
en `assets/manifest.json` con `"status": "done"`; los demás se sustituyen por marcadores generados por
código, así que el juego siempre se puede jugar. Consulta `AGENTS.md` y `art/STYLE_GUIDE.md`.

## 13. Pendiente / ideas futuras

- Más variaciones musicales (la música de fondo es un pasodoble lo-fi generativo).
- Modo infinito y estadísticas históricas entre partidas.
- Localización (gl, eu, ca, en).
