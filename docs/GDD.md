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
| **Maison Boomerez** (boutique delicatessen) | Pâtisserie pasiega "de autor" | 10 €/ud | Bajo | Ciudades ricas y turísticas; castiga mucho la mala calidad. Lo de autor lleva más tiempo: las ampliaciones del obrador y los obradores regionales sacan la mitad de sobaos (el obrador heredado rinde igual) |

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
- **El expediente** (`src/core/inspections.js`): los inspectores tienen memoria.
  - Cada truco se apunta antes de tirar el dado y su probabilidad baja al repetirlo: frigorífico 55 % → 27,5 %
    → 14 %; orujo 30 % → 10 % → 3 %; culpar al gestor −20 puntos por vez (mínimo 10 %); tickets a la mitad;
    el anciano confuso solo cuela una vez. Las pistas de la carta enseñan la probabilidad real.
  - Cada multa laboral pagada es una sanción; las de los últimos 24 meses agravan la siguiente (+25 % cada una,
    hasta ×1,75).
  - La multa usa la mayor entre la gravedad del mes y la media de los últimos 6 meses, así que pasarse a
    legal justo antes de la visita no sirve. El historial se vacía al resolver la inspección.
  - Una visita sin infracciones tacha la sanción más antigua y resta un uso a cada truco de ese inspector.
  - Paco, el gestor, se va la tercera vez que le echas la culpa.

### La cuenta de la plantilla (0.4)
- **Liquidación** (`src/core/plantilla.js`): cada cierre se apunta lo que se ahorra frente al convenio
  (`legalWage − policyWage`, sin los pactos legales de los sucesos) por persona. Marisa liquida los últimos 24
  meses ×1,2 (por la dificultad): un 25 % al momento sin dejar la caja en negativo y el resto, con un 5 % de
  recargo, en 18-48 cuotas que no se pueden quitar y que cuentan como deuda en el patrimonio. El frigorífico
  esconde la multa, no las nóminas; el orujo rebaja la liquidación a la mitad si cuela; Don Cosme, al 85 %.
- **Agravio** (0-100): va hacia `55·max(0, beneficio por cabeza en sueldos − 0,3) + 3·caprichos + 8 si cotizas
  − 300·plus del convenio`, por `(1 − alivio del reparto)`, un 15 % cada mes. Resta 0,04 de moral por punto.
- **Comité** con 50 personas (o al cerrar el arco del convenio). Cada marzo pide `(agravio − 10)/15` puntos
  (de medio en medio, más lo que debas de pagas únicas): firmar (plus, paz de 12 meses y legalidad), paga única
  de 400 €, prometer para el año siguiente o congelar (con riesgo de huelga). Romper una promesa trae huelga de
  dos meses y baja la credibilidad de Maripili.
- **Huelga general**: con comité y sin paz, `(agravio − 40)/200` desde 45 (sustituye a la de moral). Se acaba
  firmando el reparto, subiendo al convenio con 300 €/cabeza, aguantando (producción al 70 %) o con
  esquiroles. Lo firmado obliga mientras dura la paz.


| Final | Condición |
|---|---|
| **Concurso de acreedores** | 3 meses seguidos en descubierto por encima del límite de crédito |
| **Soto del Real** | 3 expedientes penales |
| **La Cooperativa** | Moral a 0 durante 2 meses: la plantilla se queda la empresa |
| **Revista de millonarios (sección curiosidades)** | Patrimonio ≥ 20 M€ (15 M€ hasta la 0.18) |
| **Tiburón Pasiego** | Al acabar los 8 años con ≥ 5 M€ |
| **Pyme con ínfulas** | Al acabar con ≥ 800.000 € |
| **Ruina lenta** | Al acabar por debajo de eso |
| **Vuelta a Selaya** | Voluntario, desde el mes 72 y tras «Sesenta velas». Misma puntuación, sin cláusula ni modo infinito; tono bueno con 12 meses en regla o la receta de la abuela |

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
×2,2 a Canarias). Los **obradores regionales** (380.000 €, uno por ciudad) añaden 15.000 sobaos/mes (7.500 con Maison) de
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
  empleados → 3 M€ → 5 M€ → 20 M€), con recompensas pequeñas y un aviso fijo en el mapa.
- **Dificultad:** *Modo cuñado* (150.000 € de herencia, radares ×0,7, multas ×0,7, menos interés),
  *Emprendedor* (normal) y *Modo Hacienda* (50.000 €, radares ×1,3, multas ×1,3, interés del 0,75 %).
- **Rebranding:** se puede cambiar de Express a Maison (150.000 €) o al revés (60.000 €, reputación −6) una vez
  cada 24 meses. Todas las tiendas de sobaos se reconvierten.
- **Objetivos en tres carriles** (negocio, equipo y dinero; 18 en total) que avanzan por separado.
- **Logros** persistentes entre partidas (45), entre ellos uno por cada final y uno por cada cláusula.
- **Prensa:** titulares satíricos de *El Sobao Digital* en la hemeroteca.
- **Exportar/importar partida** desde el menú (archivo JSON) para pasarla del PC al móvil.
- **Balance de fin de año** cada diciembre, con el post de LinkedIn de Manolo.
- **Salón de la fama** local con las 10 mejores partidas.
- **Modo infinito** al terminar los 8 años (o al salir en la revista de millonarios).
- **Fundación Boomerez**: asesor que da reputación y fama y desgrava un 10 % del impuesto.
- **La cláusula del testamento** (`src/data/clauses.js`): un reto por partida, elegido por la semilla sin tocar
  el generador. Se rompe para siempre al incumplirse y se comprueba al terminar con pyme, tiburón o revista;
  si se cumple, multiplica la puntuación y da 300.000 € (una sola vez, también en modo infinito). Antes de
  abrir, pedir un préstamo o lanzar una OPA que la rompería, el juego avisa.

  | Cláusula | Regla | Multiplicador |
  |---|---|---|
  | Pocos y bien hechos | nunca más de 12 negocios | ×1,75 |
  | De aquí no se sale | todo en Galicia, Asturias, Cantabria, País Vasco, Navarra y Castilla y León | ×2,5 |
  | El sobao, lo primero | el sobao es el sector que más ingresa en el último año | ×1,5 |
  | Antes de los sesenta | 5 M€ de patrimonio antes del mes 60 | ×1,25 |
  | Nada de vender humo | ni franquicias, ni Academy, ni coworking | ×1,2 |
  | Cuida de Merche | la relación nunca baja de 50 y no hay divorcio | ×1,1 |
  | Ni un duro de los bancos | no pedir préstamos (la póliza automática no cuenta) y acabar sin deuda | ×1,15 |

  Los multiplicadores están calibrados con el bot para que cumplir una cláusula difícil compense jugar más
  pequeño, sin que las fáciles disparen la puntuación.
- **Costumbres de la casa**: los sucesos con `memory: true` recuerdan qué opción se eligió (por su `key`).
  Navidad cambia de texto según la tradición y castiga romperla; agosto escala (el tercer año seguido sin
  vacaciones llega una inspección) y, tras dos veranos de descanso, se puede cerrar el mes entero. A partir de
  la tercera vez seguida con la misma opción, el resultado sale como aviso en vez de otra ventana.
- **Semilla compartible**: código en base 36 (hasta 7 caracteres) en el título; el **reto de la semana** usa
  la semana ISO como semilla (FNV-1a) y dificultad normal. Los récords guardan semilla, reto, versión y
  cláusula. La semilla solo reproduce la partida con la misma versión del juego (`GAME_VERSION`).

### La cartilla de Doña Remedios (0.4)
- Saldo de 90-160 k€ según la dificultad, más 400 €/mes de pensión. Presta desde el mes 3 si la caja está por
  debajo de 25.000 € o el banco te ha dicho que no, con confianza 30 o más: 20 k€, 50 k€ o lo que pueda
  (saldo × confianza). Sin intereses, a 12 meses, y un año de respiro tras devolver.
- La condición se elige al pedir: «lo que manda la ley» (si alguna política laboral es ilegal), mantequilla,
  cocido los domingos (cada 3 meses se come la acción del mes) o colocar a Kevin (1.800 €/mes y mantenimiento
  «con cinta americana»). Romperla trae «Me ha dicho la Puri que...».
- Al vencer: devolver (confianza +10), prórroga de 6 meses (una vez) o embargo materno (el capricho más caro o
  el mostrador de Selaya hasta 12 meses). Con dos meses de descubierto, rescate una vez por partida.
- Lo que debes resta del patrimonio; la cláusula «Ni un duro de los bancos» exige acabar sin deberle nada.

### La promesa del trimestre (0.4)
- Valoración bursátil: `max(libros, ½·libros + ½·6·beneficio anual) × prima`; 6 meses de bloqueo antes de la
  revista y no se puede salir a Bolsa sin tiempo para él.
- Cotizando, al cerrar cada trimestre se promete el siguiente sobre el mismo trimestre del año anterior y el
  consenso (crecimiento de los últimos 4 trimestres publicados, de 0 a +50 %). Guías: prudente (−10 %), en
  línea, optimista (+10 %) y modo tiburón (+25 %), con más premio y más castigo cuanto más arriesgas.
- Credibilidad (0-100) y sentimiento del mercado (0,85-1,05, ±0,05 por trimestre): tu parte vale el
  patrimonio × (1 − capital flotante) × sentimiento; con 0,90 o menos, junta de accionistas.
- Si el trimestre no llega, se puede adelantar la facturación a los franquiciados o activar gastos: cambia lo
  publicado, no la caja, se revierte al siguiente y se descubre con un 8 % por cierre (25 % en una auditoría).

### ¿Qué fue de...? y «Sesenta velas» (0.4)
- Hitos de la partida (`hito(s, id)`) y finales de los arcos alimentan la crónica (5 de más peso) y la carta
  de Manolo. El epílogo (`src/data/epilogues.js`) da una línea por personaje: la primera cuya condición se
  cumple. Un test comprueba que cada bandera que lee la escribe algún suceso.
- «Sesenta velas» (mes 48, o 36 con 8 M€): cumpleaños, heredero (la plantilla si te lo has ganado, Vanessa,
  el mejor directivo, Merche, Kevin o nadie) y la cláusula de Manolo. La revista espera como mucho 2 cierres.

### Información al jugador
- **Previsiones** (`src/core/preview.js`): se simula sobre copias del estado con las mismas funciones del
  cierre (`computeEconomy`, `driftStats`), así que la previsión coincide con lo que pasa si no hay sucesos.
  Bajo cada política: cambio de neto, moral, reputación y radares por mes, multa si viniera Marisa y neto a
  6 meses con la moral y las multas esperadas ya descontadas.
- **¿Por qué?**: los indicadores del HUD (y las variaciones del informe) explican qué política empuja cada uno
  frente a su opción honrada, más un resto con la tendencia natural, y el riesgo concreto del mes.
- **Archivo** (`src/core/codex.js`): carpetas con lo que la partida recuerda (trucos, sanciones, deuda latente,
  costumbres, comité, cartilla, analistas), sin decir nunca cuándo viene una inspección.
- **Mapa**: rótulos en pantalla sin solaparse (`src/render/labels.js`) e insignias de alertas por ciudad
  (`src/core/mapInfo.js`).
- **Parte del mes** (`src/core/digest.js`): las tres partidas que más mueven el neto con su motivo si se
  detecta, lo que ha dejado el cierre en el registro y lo que viene en los dos próximos cierres (nunca las
  inspecciones).

## 12. Arte (2.5D)

Lo produce un agente aparte (Codex) a partir de `art/requests/`. El juego carga los recursos que aparecen
en `assets/manifest.json` con `"status": "done"`; los demás se sustituyen por marcadores generados por
código, así que el juego siempre se puede jugar. Consulta `AGENTS.md` y `art/STYLE_GUIDE.md`.
Al arrancar solo se espera lo imprescindible (mapa, edificios, iconos, título y retratos de Manolo); el resto
se precarga en segundo plano.

## 13. Pendiente / ideas futuras

- Más variaciones musicales (la música de fondo es un pasodoble lo-fi generativo).
- Modo infinito y estadísticas históricas entre partidas.
- Localización (gl, eu, ca, en).
