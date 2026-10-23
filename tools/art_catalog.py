"""Catálogo de arte de Manolo Boomerez S.L.

Fuente única de las peticiones de arte. Genera:
  - assets/manifest.json   (lo que carga el juego; conserva el "status" que ya haya)
  - art/requests/*.md      (las fichas que lee el agente de arte)

Uso:  python tools/art_catalog.py
Para pedir arte nuevo: añade entradas a ASSETS y vuelve a ejecutar el script.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "assets", "manifest.json")
REQUESTS = os.path.join(ROOT, "art", "requests")

# Debe coincidir con src/render/projection.js
WORLD = dict(width=2048, height=1088, minLon=-9.5, maxLat=44.0, pxPerLonDeg=145.5, pxPerLatDeg=117.8, offsetX=6, offsetY=40, extrude=14)


def load_cities():
    """Lee las ciudades de src/data/cities.js para no duplicar coordenadas."""
    src = open(os.path.join(ROOT, "src", "data", "cities.js"), encoding="utf-8").read()
    out = []
    for m in re.finditer(r"name: '([^']+)'.*?lon: (-?[\d.]+), lat: (-?[\d.]+)(.*?)\n", src):
        name, lon, lat, rest = m.group(1), float(m.group(2)), float(m.group(3)), m.group(4)
        if "hq: true" in rest:
            name += " (sede, obrador)"
        if "inset: true" in rest:
            name += " (recuadro de Canarias)"
        out.append((name, lon, lat))
    return out


CITIES = load_cities()


def project(lon, lat):
    return (round((lon - WORLD["minLon"]) * WORLD["pxPerLonDeg"] + WORLD["offsetX"]),
            round((WORLD["maxLat"] - lat) * WORLD["pxPerLatDeg"] + WORLD["offsetY"]))


# ---------------------------------------------------------------------------------------------
# Cada grupo: (fichero de petición, título, introducción, [assets])
# Cada asset: id, file, w, h, prompt, + opcionales: anchor, priority (1 = imprescindible)
# ---------------------------------------------------------------------------------------------

BUILDING_SPEC = (
    "Sprite isométrico 2.5D sobre fondo TRANSPARENTE, lienzo de 256×256 px. Proyección isométrica 2:1 "
    "(las aristas de la base forman ~26,6° con la horizontal) y vista desde el sureste: la esquina frontal "
    "de la base apunta hacia abajo. **Ancla:** el centro inferior de la base (la esquina frontal) debe quedar "
    "exactamente en el píxel (128, 240). La huella de la base mide unos 150-200 px de ancho. Incluye una "
    "sombra suave de contacto dentro del lienzo. Nada de texto legible salvo el rótulo indicado. En el mapa "
    "se ve pequeño (≈66 px), así que necesita siluetas claras y colores reconocibles."
)

PORTRAIT_SPEC = (
    "Retrato de busto (cabeza y hombros), 512×512 px, PNG. Caricatura editorial con volumen, en el estilo 2.5D "
    "del juego. Fondo pintado de color plano o con un degradado suave (NO transparente) del color indicado. La "
    "cara debe quedar dentro del círculo central (diámetro ≈ 380 px), porque la interfaz recorta los retratos "
    "en círculo. Mirada a 3/4 hacia la izquierda del espectador. Expresivo y exagerado, pero no grotesco."
)

EVENT_SPEC = (
    "Ilustración de suceso, 768×432 px (16:9), PNG sin transparencia. Escena en diorama isométrico 2.5D (como "
    "una maqueta vista desde arriba en diagonal), con la misma luz cálida que el resto del juego. Se muestra "
    "encima del texto de la carta, así que debe leerse de un vistazo y dejar algo de aire en el tercio "
    "inferior. Sin texto legible (salvo rótulos breves si se indican)."
)

ENDING_SPEC = (
    "Ilustración de final de partida, 1280×720 px (16:9), PNG. Escena 2.5D más elaborada que la de los "
    "sucesos, con composición de cartel de película. Sin texto (el título lo pone el juego)."
)

ICON_SPEC = (
    "Icono de interfaz de 64×64 px, PNG con fondo transparente. Estilo 2.5D simplificado, con volumen ligero "
    "y contorno oscuro de 2-3 px para que se lea a 16-24 px sobre la barra marrón (#3b2a1a). Sin texto."
)

GROUPS = [
    (
        "02_mapa.md", "Mapa de España (maqueta 2.5D)",
        "El fondo del mapa principal. Es el recurso más visible del juego.",
        [
            dict(id="map_spain", file="assets/map/map_spain.png", w=2048, h=1088, priority=1, prompt=(
                "Mapa de la península ibérica en forma de **maqueta de mesa / diorama** con vista cenital ligeramente "
                "inclinada (NO isométrica rotada: el norte queda arriba y la costa cantábrica es horizontal). La tierra "
                "es un bloque con grosor: la cara superior es el terreno y el borde sur de cada costa muestra un canto "
                "de tierra de ~14 px (efecto bloque de plastilina o cartón pintado). Incluye el mar alrededor (azul "
                "con olas sutiles pintadas). España a todo color: verde húmedo en la cornisa cantábrica y Galicia, "
                "ocres y amarillos en la meseta, tonos tostados en Andalucía y Murcia. Relieve suave pintado "
                "(Picos de Europa, Pirineos, Sistema Central, Sierra Nevada). Portugal y Francia en gris o beige "
                "desaturado ('fuera del mercado'). Baleares a color. **Canarias en un recuadro** abajo a la izquierda "
                "(marco discontinuo claro), como en los mapas del tiempo. NO pintes nombres de ciudades, ni plazas, "
                "ni carreteras: eso lo dibuja el juego encima. Deja el entorno de cada ciudad despejado (sin montañas "
                "en un radio de ~50 px).\n\n"
                "**Calibración obligatoria** (para que las ciudades caigan en su sitio):\n\n"
                "```\nx = (longitud + 9.5) × 145.5 + 6\ny = (44.0 − latitud) × 117.8 + 40\n```\n\n"
                f"El recuadro de Canarias va de {project(-9.45, 36.38)} a {project(-5.85, 35.38)} (coordenadas ficticias "
                "lon −9.45…−5.85, lat 35.38…36.38 con la misma fórmula). Dentro van las islas, de oeste a este: "
                f"La Palma, El Hierro (abajo), La Gomera, Tenerife, Gran Canaria (centro en {project(-7.55, 35.68)}), "
                "Fuerteventura y Lanzarote.\n\n"
                "Puntos de control (el centro de la plaza de cada ciudad debe caer en tierra firme y cerca de su "
                "posición real):\n\n" + "\n".join(f"- {n}: ({project(lon, lat)[0]}, {project(lon, lat)[1]})" for n, lon, lat in CITIES)
            )),
        ],
    ),
    (
        "03_edificios.md", "Edificios del imperio (sprites isométricos)",
        BUILDING_SPEC,
        [
            dict(id="bld_obrador_1", file="assets/buildings/bld_obrador_1.png", w=256, h=256, anchor=[128, 240], priority=1, prompt=(
                "El obrador original de Don Anselmo en Selaya: casona pasiega de piedra con balcón de madera, tejado de "
                "teja roja, chimenea humeante, un prado verde con una vaca pasiega al lado y un cartel de madera "
                "pintado a mano: 'SOBAOS BOOMEREZ · desde 1962'. Tradicional, entrañable y algo destartalado.")),
            dict(id="bld_obrador_2", file="assets/buildings/bld_obrador_2.png", w=256, h=256, anchor=[128, 240], priority=2, prompt=(
                "El mismo obrador ampliado: a la casona le han pegado una nave prefabricada blanca con un horno "
                "industrial y un letrero luminoso nuevo 'BOOMEREZ' que no pega nada con la piedra. La vaca mira con "
                "desconfianza.")),
            dict(id="bld_obrador_3", file="assets/buildings/bld_obrador_3.png", w=256, h=256, anchor=[128, 240], priority=2, prompt=(
                "Nave industrial en un polígono de Torrelavega: hormigón gris, muelles de carga, camiones con el logo, "
                "un robot amasador visible tras un ventanal y, en una esquina, un pequeño cartel nostálgico: "
                "'Sobaos artesanos'. Contraste cómico entre lo industrial y la palabra 'artesano'.")),
            dict(id="bld_sobaos_express", file="assets/buildings/bld_sobaos_express.png", w=256, h=256, anchor=[128, 240], priority=1, prompt=(
                "Tienda low-cost 'Sobaos Manolo Express': local a pie de calle con toldo naranja chillón, neón amarillo, "
                "carteles de '¡OFERTA 3×2!' y una mascota de sobao sonriente con gafas de sol en la calva (como Manolo). "
                "Pinta de franquicia barata de centro comercial.")),
            dict(id="bld_sobaos_maison", file="assets/buildings/bld_sobaos_maison.png", w=256, h=256, anchor=[128, 240], priority=1, prompt=(
                "Boutique 'Maison Boomerez — Pâtisserie Pasiega': fachada negra mate con molduras doradas, toldo granate, "
                "escaparate con un único sobao iluminado como una joya en un pedestal de mármol, maceteros con boj. "
                "Pretencioso y elegante.")),
            dict(id="bld_vivienda", file="assets/buildings/bld_vivienda.png", w=256, h=256, anchor=[128, 240], priority=1, prompt=(
                "'Residencial Boomerez': bloque de pisos de 4 alturas, ladrillo visto de los 70, ventanas pequeñas con "
                "ropa tendida, un portero automático enorme y un cartel optimista 'Viviendas para nuestra gran familia'. "
                "Tono gris y algo opresivo, pero con humor.")),
            dict(id="bld_airbnb", file="assets/buildings/bld_airbnb.png", w=256, h=256, anchor=[128, 240], priority=1, prompt=(
                "Edificio de 'Apartamentos Turísticos Casa Manolo': fachada recién pintada en blanco, cajetines de llaves "
                "colgados en una farola, turistas con maletas de ruedas en la acera y, en un balcón, una pancarta vecinal "
                "'TURISTAS FUERA'.")),
            dict(id="bld_smash", file="assets/buildings/bld_smash.png", w=256, h=256, anchor=[128, 240], priority=1, prompt=(
                "Hamburguesería 'Manolo Smash Club': local con neón rosa y azul, rótulo de hamburguesa aplastada, "
                "estética industrial-hipster (ladrillo, tubos a la vista) y una cola de jóvenes con móviles en la "
                "puerta.")),
            dict(id="bld_empanadas", file="assets/buildings/bld_empanadas.png", w=256, h=256, anchor=[128, 240], priority=1, prompt=(
                "'Empanadas El Gaucho Pasiego': local pequeño con fachada azul celeste y blanca, toldo a rayas, "
                "una pizarra con sabores y un gaucho con boina pasiega pintado en el cartel (fusión argentino-cántabra).")),
            dict(id="bld_academy", file="assets/buildings/bld_academy.png", w=256, h=256, anchor=[128, 240], priority=2, prompt=(
                "'Boomerez Business Academy': oficina en un bajo con cristaleras, un enorme vinilo de Manolo con los "
                "brazos cruzados y el lema 'MENTALIDAD DE TIBURÓN', un tiburón hinchable en el escaparate y sillas de "
                "coworking vacías.")),
            dict(id="bld_taberna", file="assets/buildings/bld_taberna.png", w=256, h=256, anchor=[128, 240], priority=2, prompt=(
                "'La Taberna del Emprendedor': bar de tapas castizo con fachada de madera verde, toldo granate, barriles en "
                "la puerta usados como mesas, una pizarra con frases de Manolo y jamones colgados visibles tras la cristalera.")),
            dict(id="bld_gimnasio", file="assets/buildings/bld_gimnasio.png", w=256, h=256, anchor=[128, 240], priority=2, prompt=(
                "'Boomer Fit 24h': nave de gimnasio low-cost con fachada naranja chillón, cristalera con cintas de correr en fila, "
                "un rótulo luminoso '24H' y una mancuerna gigante de fibra de vidrio en la acera.")),
            dict(id="bld_coworking", file="assets/buildings/bld_coworking.png", w=256, h=256, anchor=[128, 240], priority=2, prompt=(
                "'Hustle Hub Coworking': antiguo almacén de ladrillo reconvertido, ventanales industriales, plantas colgantes, "
                "un neón verde con un cohete y jóvenes con portátiles y patinetes eléctricos en la puerta.")),
            dict(id="bld_residencia", file="assets/buildings/bld_residencia.png", w=256, h=256, anchor=[128, 240], priority=2, prompt=(
                "'Residencia Golden Age Boomerez': edificio de tres plantas color crema con barandillas, un jardincito con "
                "bancos, una furgoneta adaptada y un cartel dorado excesivamente lujoso para lo que es. Algo melancólico.")),
            dict(id="bld_obrador_regional", file="assets/buildings/bld_obrador_regional.png", w=256, h=256, anchor=[128, 240], priority=2, prompt=(
                "Obrador regional Boomerez: nave industrial mediana de chapa crema con un tejadillo de teja falsa para "
                "parecer 'tradicional', chimenea con humo, una furgoneta de reparto con el logo y un cartel que dice "
                "'Obrador artesano' sobre una puerta de muelle de carga.")),
            dict(id="bld_city_base", file="assets/buildings/bld_city_base.png", w=256, h=128, priority=3, prompt=(
                "Base genérica de ciudad para el mapa: plaza elíptica isométrica de adoquín con farolas y bancos "
                "diminutos, vista en el mismo ángulo que los edificios, fondo transparente. Se dibuja a 112×56 px "
                "debajo de los edificios: que sea discreta.")),
            dict(id="bld_franchise_flag", file="assets/buildings/bld_franchise_flag.png", w=64, h=64, priority=3, prompt=(
                "Banderín o chapa pequeña que marca 'esto es una franquicia': un apretón de manos dorado sobre un "
                "círculo blanco con borde oscuro. Fondo transparente; se ve a 18 px.")),
        ],
    ),
    (
        "04_retratos.md", "Retratos de personajes",
        PORTRAIT_SPEC,
        [
            dict(id="portrait_manolo_neutral", file="assets/portraits/portrait_manolo_neutral.png", w=512, h=512, priority=1, prompt=(
                "**Manolo Boomerez (hoja de personaje de referencia; mantén la coherencia en todas sus expresiones):** "
                "55 años, se cree joven. Calvo por arriba con pelo canoso a los lados, bigote canoso bien recortado, "
                "moreno de rayos UVA, gafas de sol de marca SUBIDAS sobre la calva (su seña de identidad), polo color "
                "salmón con el cuello levantado, cadena de oro fina y un reloj enorme. Barriga incipiente. Fondo "
                "mostaza (#f2c14e). Expresión neutra de autosuficiencia.")),
            dict(id="portrait_manolo_smug", file="assets/portraits/portrait_manolo_smug.png", w=512, h=512, priority=1, prompt="Manolo (misma hoja de personaje): sonrisa de suficiencia, una ceja levantada, quizá señalando a cámara con el dedo. Fondo mostaza."),
            dict(id="portrait_manolo_happy", file="assets/portraits/portrait_manolo_happy.png", w=512, h=512, priority=1, prompt="Manolo: eufórico, carcajada, pulgares arriba, quizá con un fajo de billetes asomando del bolsillo del polo. Fondo mostaza."),
            dict(id="portrait_manolo_angry", file="assets/portraits/portrait_manolo_angry.png", w=512, h=512, priority=1, prompt="Manolo: indignado, rojo de ira, señalando con el dedo como en una tertulia, con una vena en la calva. Fondo mostaza."),
            dict(id="portrait_manolo_scared", file="assets/portraits/portrait_manolo_scared.png", w=512, h=512, priority=1, prompt="Manolo: aterrado y sudando, las gafas de sol se le resbalan de la calva y se aferra a una carpeta de facturas. Fondo mostaza."),
            dict(id="portrait_manolo_thinking", file="assets/portraits/portrait_manolo_thinking.png", w=512, h=512, priority=2, prompt="Manolo: pensativo y tramando algo, mano en la barbilla, mirada de 'tengo una idea'. Fondo mostaza."),
            dict(id="portrait_padre_anselmo", file="assets/portraits/portrait_padre_anselmo.png", w=512, h=512, priority=1, prompt="Don Anselmo Boomerez (q.e.p.d.), el padre: retrato enmarcado de foto antigua con tono sepia, anciano pasiego serio y bondadoso, boina negra, bigote blanco, chaleco. Que parezca un cuadro colgado en el obrador. Fondo marrón (#8c7b5e)."),
            dict(id="portrait_inspectora_trabajo", file="assets/portraits/portrait_inspectora_trabajo.png", w=512, h=512, priority=1, prompt="Marisa Ortega, inspectora de Trabajo: unos 45 años, gafas de pasta, pelo recogido, blazer azul marino, una carpeta enorme llena de pósits. Mirada implacable pero justa. Fondo azul (#4a6fa5)."),
            dict(id="portrait_inspector_hacienda", file="assets/portraits/portrait_inspector_hacienda.png", w=512, h=512, priority=1, prompt="Don Fermín Rubalcaba, inspector de Hacienda: 60 años, traje gris, MANGUITOS de oficinista, gafas pequeñas, bigote fino y calculadora en la mano. Fondo gris (#5a5a5a)."),
            dict(id="portrait_inspector_sanidad", file="assets/portraits/portrait_inspector_sanidad.png", w=512, h=512, priority=2, prompt="Técnico de Sanidad: bata blanca, gorro desechable, mascarilla bajada y un bote de muestras con algo sospechoso. Fondo verde agua (#5fa89a)."),
            dict(id="portrait_empleada_maripili", file="assets/portraits/portrait_empleada_maripili.png", w=512, h=512, priority=1, prompt="Maripili, portavoz de la plantilla: obrera del obrador, unos 50 años, pelo rojizo recogido bajo un gorro de panadera, delantal enharinado, brazos cruzados y mirada de 'no me la cuelas, Manolo'. Fondo rojo (#d35f5f)."),
            dict(id="portrait_becario", file="assets/portraits/portrait_becario.png", w=512, h=512, priority=1, prompt="El becario: 22 años, ojeroso, camiseta de su universidad, el móvil en la mano grabando y un café enorme. Fondo verde claro (#9cc5a1)."),
            dict(id="portrait_cunado_jonathan", file="assets/portraits/portrait_cunado_jonathan.png", w=512, h=512, priority=1, prompt="Jonathan, el cuñado: 40 años, gorra plana naranja, sudadera negra de 'HODL', barba degradada, dientes muy blancos y sonrisa de vendedor de criptomonedas. Fondo morado oscuro (#3a3a6e)."),
            dict(id="portrait_hija_vanessa", file="assets/portraits/portrait_hija_vanessa.png", w=512, h=512, priority=2, prompt="Vanessa, la hija: 19 años, melena castaña, ropa artística (pañuelo, manchas de pintura), mirada de paciencia infinita con su padre. Fondo lila (#b07cc6)."),
            dict(id="portrait_abogado_cosme", file="assets/portraits/portrait_abogado_cosme.png", w=512, h=512, priority=2, prompt="Don Cosme, abogado de la familia: 75 años, pelo blanco engominado, traje de raya diplomática, corbata granate, gafas de concha y un maletín de cuero gastado. Fondo marrón oscuro (#4b3b2b)."),
            dict(id="portrait_gestor_paco", file="assets/portraits/portrait_gestor_paco.png", w=512, h=512, priority=2, prompt="Paco 'el Exprimidor', gestor: 58 años, calvo, bigote, camisa beige de manga corta con bolígrafos en el bolsillo, corbata verde y un purito apagado. Fondo ocre (#a08b5b)."),
            dict(id="portrait_alcalde", file="assets/portraits/portrait_alcalde.png", w=512, h=512, priority=2, prompt="El alcalde: 60 años, traje oscuro, banda rojigualda en diagonal, mofletes sonrosados de comilona y servilleta todavía al cuello. Fondo verde oscuro (#3c6e47)."),
            dict(id="portrait_influencer", file="assets/portraits/portrait_influencer.png", w=512, h=512, priority=2, prompt="@LaVidaDeIraia, influencer: 25 años, rubia, aro de luz reflejado en los ojos, móvil en alto haciendo un selfie con morritos. Fondo rosa (#ff8fb1)."),
            dict(id="portrait_primo_argentino", file="assets/portraits/portrait_primo_argentino.png", w=512, h=512, priority=2, prompt="Rodrigo Boomerez, primo de Buenos Aires: 45 años, barba, camisa blanca abierta, mate en la mano y sonrisa de 'te voy a vender algo'. Fondo celeste (#74acdf)."),
            dict(id="portrait_inversor_misterioso", file="assets/portraits/portrait_inversor_misterioso.png", w=512, h=512, priority=2, prompt="Inversor misterioso: hombre trajeado de negro con gafas de sol dentro de casa, cara medio en sombra y un maletín metálico. Fondo casi negro (#222222)."),
            dict(id="portrait_franquiciado", file="assets/portraits/portrait_franquiciado.png", w=512, h=512, priority=2, prompt="Franquiciado arruinado: 50 años, polo naranja de Sobaos Manolo Express manchado, ojeras, sosteniendo una factura enorme. Tristeza cómica. Fondo gris (#8a8a8a)."),
            dict(id="portrait_vecina", file="assets/portraits/portrait_vecina.png", w=512, h=512, priority=3, prompt="Vecina indignada: 70 años, bata de casa, rulos y un cartel 'TURISTAS FUERA' en la mano. Fondo lila claro (#c9a0dc)."),
            dict(id="portrait_hipster", file="assets/portraits/portrait_hipster.png", w=512, h=512, priority=3, prompt="Dueño de la competencia 'MASA': barba poblada, gafas redondas, gorro de lana en verano, delantal de cuero y una taza de café de especialidad. Fondo oliva (#6d6d5a)."),
            dict(id="portrait_comercial", file="assets/portraits/portrait_comercial.png", w=512, h=512, priority=3, prompt="Herr Klaus Brötchen, comercial alemán: rubio, traje azul impecable, sonrisa profesional y un catálogo grueso. Sirve también para el comercial de supermercado. Fondo amarillo (#ffcf33)."),
            dict(id="portrait_banquero", file="assets/portraits/portrait_banquero.png", w=512, h=512, priority=3, prompt="Director de la Caja Cantábrica: 55 años, traje azul, corbata azul celeste, sonrisa de dentífrico y un bolígrafo listo para que firmes. Fondo azul oscuro (#2c3e50)."),
            dict(id="portrait_presentadora", file="assets/portraits/portrait_presentadora.png", w=512, h=512, priority=3, prompt="Presentadora de un magacín matinal: melena morena impecable, blazer blanco, micrófono de solapa y sonrisa televisiva. Fondo rojo plató (#e74c3c)."),
            dict(id="portrait_coach", file="assets/portraits/portrait_coach.png", w=512, h=512, priority=3, prompt="Iker 'Mindset' Lasa, coach: 35 años, barba cuidada, camiseta blanca de lino, collar de cuentas, descalzo (se intuye) y mirada intensa. Fondo naranja (#f39c12)."),
            dict(id="portrait_esposa_merche", file="assets/portraits/portrait_esposa_merche.png", w=512, h=512, priority=1, prompt="Merche, la mujer de Manolo: 53 años, melena rubia de peluquería, pendientes de perla, chaqueta de tweed y una mirada que mezcla cariño y hartazgo infinito. Elegante y con mucho carácter. Fondo burdeos (#8e3b46)."),
        ] + [
            dict(id=f"portrait_exec_{i}", file=f"assets/portraits/portrait_exec_{i}.png", w=512, h=512, priority=2, prompt=f"Directivo/a genérico/a para el equipo de Manolo (se reutiliza para distintos nombres): {desc}")
            for i, desc in enumerate([
                "mujer de unos 40 años, traje gris marengo, melena corta, gafas finas, mirada analítica. Fondo azul petróleo (#1f5f7a).",
                "hombre de unos 35 años, chaleco acolchado sin mangas sobre camisa azul (uniforme de escuela de negocios), sonrisa de LinkedIn. Fondo gris (#7f8c8d).",
                "hombre de unos 50 años, americana de pana, barba canosa y bolígrafo detrás de la oreja; aire de veterano que lo ha visto todo. Fondo verde oliva (#6b7a3a).",
                "mujer de unos 30 años, coleta alta, sudadera de startup y auriculares inalámbricos; energía de 'growth hacker'. Fondo morado (#6c3483).",
                "mujer de unos 55 años, pañuelo al cuello, gafas colgadas de una cadenita y una carpeta de recursos humanos; firme y amable. Fondo terracota (#b9663f).",
                "hombre de unos 45 años, traje azul brillante, gemelos dorados, pelo engominado hacia atrás; puro tiburón. Fondo negro azulado (#1c2833).",
            ], start=1)
        ] + [
        ],
    ),
    (
        "05_sucesos.md", "Ilustraciones de sucesos",
        EVENT_SPEC,
        [
            dict(id="ev_intro_herencia", file="assets/events/ev_intro_herencia.png", w=768, h=432, priority=1, prompt="Notaría antigua de pueblo: el notario lee el testamento; Manolo, en primer plano, ya se imagina un imperio (bocadillo de pensamiento con un mapa de España lleno de tiendas). En la pared, el retrato de Don Anselmo."),
            dict(id="ev_inspeccion", file="assets/events/ev_inspeccion.png", w=768, h=432, priority=1, prompt="La inspectora de Trabajo entra en el obrador con su carpeta mientras, al fondo, Manolo empuja a dos becarios hacia la puerta de la cámara frigorífica."),
            dict(id="ev_hacienda", file="assets/events/ev_hacienda.png", w=768, h=432, priority=1, prompt="Despacho gris de la Agencia Tributaria: el inspector con manguitos revisa una montaña de tickets de marisquería; Manolo suda frente a él."),
            dict(id="ev_huelga", file="assets/events/ev_huelga.png", w=768, h=432, priority=1, prompt="Piquete de pasiegas con pancartas ('EL SOBAO ES DE QUIEN LO AMASA') frente al obrador; Manolo asoma por una ventana."),
            dict(id="ev_navidad", file="assets/events/ev_navidad.png", w=768, h=432, priority=2, prompt="Cena de empresa navideña en el obrador decorado con espumillón; una mesa con cestas de Navidad muy desiguales."),
            dict(id="ev_agosto", file="assets/events/ev_agosto.png", w=768, h=432, priority=2, prompt="Calendario de agosto pegado en la pared del obrador, con la plantilla mirando por la ventana una playa imaginaria mientras Manolo tacha días de vacaciones."),
            dict(id="ev_franquiciado", file="assets/events/ev_franquiciado.png", w=768, h=432, priority=2, prompt="Tienda franquiciada vacía con un cartel de 'SE TRASPASA'; el franquiciado sentado en el bordillo con la cabeza entre las manos."),
            dict(id="ev_pisos_turisticos", file="assets/events/ev_pisos_turisticos.png", w=768, h=432, priority=2, prompt="Pleno del ayuntamiento votando; en la calle, una fila de turistas con maletas de ruedas frente a un portal precintado."),
            dict(id="ev_cripto", file="assets/events/ev_cripto.png", w=768, h=432, priority=2, prompt="El cuñado Jonathan enseña en un portátil una gráfica que se desploma con una moneda dorada con forma de sobao ('SobaoCoin')."),
            dict(id="ev_influencer", file="assets/events/ev_influencer.png", w=768, h=432, priority=3, prompt="Influencer con aro de luz grabándose con un sobao en el obrador, rodeada de cajas de regalo."),
            dict(id="ev_rata", file="assets/events/ev_rata.png", w=768, h=432, priority=2, prompt="Encuadre vertical de móvil (como un TikTok) dentro de la ilustración: una rata paseando entre bandejas de sobaos con corazones y comentarios flotando."),
            dict(id="ev_smi", file="assets/events/ev_smi.png", w=768, h=432, priority=3, prompt="Manolo escupe el café delante de la tele, que muestra una gráfica del SMI subiendo."),
            dict(id="ev_hija", file="assets/events/ev_hija.png", w=768, h=432, priority=3, prompt="Cena familiar: Vanessa enseña una carpeta de dibujos; Manolo se atraganta con la merluza."),
            dict(id="ev_supermercado", file="assets/events/ev_supermercado.png", w=768, h=432, priority=3, prompt="Pasillo de supermercado con bolsas amarillas genéricas de 'SOBAO' apiladas junto a un sobao Boomerez triste."),
            dict(id="ev_smash", file="assets/events/ev_smash.png", w=768, h=432, priority=3, prompt="Primer plano de una smash burger servida entre dos sobaos en lugar de pan, con fotos de móviles alrededor."),
            dict(id="ev_vecinos", file="assets/events/ev_vecinos.png", w=768, h=432, priority=3, prompt="Fachada de 'Casa Manolo' con pancartas vecinales en los balcones y una reportera de televisión en la acera."),
            dict(id="ev_hilo", file="assets/events/ev_hilo.png", w=768, h=432, priority=3, prompt="Pantalla de red social con un hilo larguísimo (1/47) y capturas de nóminas difuminadas; el becario sonríe, vengativo."),
            dict(id="ev_primo", file="assets/events/ev_primo.png", w=768, h=432, priority=3, prompt="El primo Rodrigo llega al obrador con una maleta, un mate y un móvil reproduciendo un audio de WhatsApp."),
            dict(id="ev_premio", file="assets/events/ev_premio.png", w=768, h=432, priority=3, prompt="Gala local en un salón de bodas: Manolo recoge una placa de 'Emprendedor del Año' ante cuatro personas que aplauden."),
            dict(id="ev_sanidad", file="assets/events/ev_sanidad.png", w=768, h=432, priority=3, prompt="Almacén del obrador con bidones sin etiqueta; el técnico de Sanidad los olfatea con cara de asco."),
            dict(id="ev_rival", file="assets/events/ev_rival.png", w=768, h=432, priority=3, prompt="Local hipster 'MASA' de cemento y bombillas de filamento, enfrente de una tienda Boomerez; cola en el hipster y ni un alma en la de Manolo."),
            dict(id="ev_banco", file="assets/events/ev_banco.png", w=768, h=432, priority=3, prompt="Comida de negocios en un restaurante: el banquero desliza una pila de contratos junto al chuletón."),
            dict(id="ev_tv", file="assets/events/ev_tv.png", w=768, h=432, priority=3, prompt="Plató de tertulia matinal con Manolo gritando entre una sindicalista y un economista de pelo largo."),
            dict(id="ev_maletin", file="assets/events/ev_maletin.png", w=768, h=432, priority=3, prompt="Mesa de cocina con un maletín abierto lleno de billetes de 500; un hombre de negro en la puerta."),
            dict(id="ev_sindicato", file="assets/events/ev_sindicato.png", w=768, h=432, priority=3, prompt="Urna de cartón improvisada en el vestuario del obrador; Maripili vota mientras el sobrino Kevin reparte caramelos."),
            dict(id="ev_robot", file="assets/events/ev_robot.png", w=768, h=432, priority=3, prompt="Robot amasador industrial gigante bajando de un camión con matrícula alemana; los obreros lo miran con recelo."),
            dict(id="ev_empanadas", file="assets/events/ev_empanadas.png", w=768, h=432, priority=3, prompt="Una empanada partida por la mitad revela un sobao dentro; un influencer argentino se lleva las manos a la cabeza."),
            dict(id="ev_calor", file="assets/events/ev_calor.png", w=768, h=432, priority=3, prompt="Escaparate con sobaos derritiéndose como relojes de Dalí y un termómetro en la calle marcando 46 °C."),
            dict(id="ev_coach", file="assets/events/ev_coach.png", w=768, h=432, priority=3, prompt="Retiro en Ibiza: Manolo descalzo y con collar de flores en círculo con otros empresarios, mientras el coach toca un cuenco tibetano."),
            dict(id="ev_erte", file="assets/events/ev_erte.png", w=768, h=432, priority=3, prompt="El gestor Paco susurra al oído de Manolo con un papel donde pone 'ERTE'; al fondo, la plantilla trabaja como siempre."),
            dict(id="ev_jefe_infiltrado", file="assets/events/ev_jefe_infiltrado.png", w=768, h=432, priority=3, prompt="Manolo disfrazado de dependiente nuevo con un bigote postizo encima del suyo y una gorra de Sobaos Manolo Express; un cámara de televisión escondido detrás de una estantería."),
            dict(id="ev_okupas", file="assets/events/ev_okupas.png", w=768, h=432, priority=3, prompt="Puerta de un piso con la cerradura cambiada y una nota pegada; la vecina en bata señala la puerta mientras habla por teléfono, muy emocionada."),
            dict(id="ev_igp", file="assets/events/ev_igp.png", w=768, h=432, priority=3, prompt="Sala solemne del Consejo Regulador del Sobao Pasiego: señores mayores con boina y bastón alrededor de una mesa, con el retrato de Don Anselmo en la pared y un sello dorado gigante."),
            dict(id="ev_riders", file="assets/events/ev_riders.png", w=768, h=432, priority=3, prompt="Riders en bici con mochilas cúbicas naranjas bajo la lluvia, saliendo de un Manolo Smash Club con neón rosa."),
            dict(id="ev_fondos", file="assets/events/ev_fondos.png", w=768, h=432, priority=3, prompt="El gestor Paco y Manolo enterrados en una montaña de formularios con estrellas amarillas sobre fondo azul (motivo europeo genérico, sin logotipos oficiales)."),
            dict(id="ev_peor_jefe", file="assets/events/ev_peor_jefe.png", w=768, h=432, priority=3, prompt="Trofeo dorado con un pulgar hacia abajo sobre un atril; plantilla aplaudiendo con sorna."),
            dict(id="ev_mantequilla", file="assets/events/ev_mantequilla.png", w=768, h=432, priority=3, prompt="Un bloque de mantequilla en un pedestal con una flecha de precio disparada hacia arriba; Manolo se agarra la cartera."),
            dict(id="ev_vanessa", file="assets/events/ev_vanessa.png", w=768, h=432, priority=3, prompt="Vanessa con birrete de graduación y una carpeta enorme, explicando un gráfico en una pizarra a un Manolo empequeñecido."),
            dict(id="ev_cena", file="assets/events/ev_cena.png", w=768, h=432, priority=3, prompt="Cena familiar en casa de la suegra: el cuñado Jonathan explica algo en el móvil con mucha energía y Manolo pone los ojos en blanco; cocido en la mesa."),
            dict(id="ev_macro_expansion", file="assets/events/ev_macro_expansion.png", w=768, h=432, priority=2, prompt="Calle comercial española llena de gente con bolsas, grúas al fondo levantando edificios y un banquero sonriente repartiendo tarjetas de crédito como si fueran caramelos."),
            dict(id="ev_macro_burbuja", file="assets/events/ev_macro_burbuja.png", w=768, h=432, priority=2, prompt="Una pompa de jabón gigante y brillante que contiene una ciudad entera de pisos; Manolo y el cuñado Jonathan, encima de la pompa, brindan con champán sin mirar abajo."),
            dict(id="ev_macro_crisis", file="assets/events/ev_macro_crisis.png", w=768, h=432, priority=2, prompt="La pompa ha estallado: grúas paradas, carteles de 'SE VENDE' en todos los balcones, persianas bajadas y Manolo mirando un gráfico que cae en picado en la pantalla de un televisor."),
            dict(id="ev_macro_recuperacion", file="assets/events/ev_macro_recuperacion.png", w=768, h=432, priority=2, prompt="Un brote verde diminuto saliendo de una grieta en el asfalto frente al obrador; un ministro genérico lo señala con orgullo en una rueda de prensa."),
            dict(id="ev_rival_copia", file="assets/events/ev_rival_copia.png", w=768, h=432, priority=3, prompt="Dos tiendas casi idénticas una frente a otra: la de Manolo y una copia con el mismo diseño en otro color; Manolo señala la copia indignado desde la acera."),
            dict(id="ev_rival_oferta", file="assets/events/ev_rival_oferta.png", w=768, h=432, priority=3, prompt="Reunión en un rascacielos acristalado: un ejecutivo con traje caro desliza un cheque enorme por una mesa de cristal hacia Manolo, que se ajusta las gafas de sol."),
            dict(id="ev_fichaje", file="assets/events/ev_fichaje.png", w=768, h=432, priority=3, prompt="Un directivo de Manolo sale por la puerta del obrador con una caja de cartón mientras, en la acera de enfrente, un coche negro de la competencia le espera con la puerta abierta."),
            dict(id="ev_chivato", file="assets/events/ev_chivato.png", w=768, h=432, priority=3, prompt="Despacho de Manolo: un directivo de pie, muy serio, deja una memoria USB sobre la mesa; detrás, por la ventana, se ve la cola de becarios trabajando de noche."),
            dict(id="ev_divorcio", file="assets/events/ev_divorcio.png", w=768, h=432, priority=2, prompt="Cocina de casa adosada: Merche, con una carpeta y una abogada a su lado, frente a un Manolo que todavía lleva el móvil en la mano; la nevera llena de imanes de viajes que hizo ella sola."),
            dict(id="ev_piso_ilegal", file="assets/events/ev_piso_ilegal.png", w=768, h=432, priority=3, prompt="Una vecina mayor con prismáticos en su balcón vigila el portal de enfrente, donde entran turistas con maletas; abajo, dos inspectores municipales con carpetas llaman al telefonillo."),
            dict(id="ev_junta", file="assets/events/ev_junta.png", w=768, h=432, priority=2, prompt="Junta de accionistas en un salón de hotel: un gráfico de cotización cayendo en una pantalla enorme, accionistas indignados de pie y un jubilado lanzando un sobao hacia el estrado donde está Manolo."),
        ],
    ),
    (
        "06_finales.md", "Ilustraciones de los finales",
        ENDING_SPEC,
        [
            dict(id="end_bancarrota", file="assets/endings/end_bancarrota.png", w=1280, h=720, priority=2, prompt="Manolo, con su caja de cartón de pertenencias (gafas de sol, foto con un Audi), vuelve a casa de su madre, que le espera en la puerta con un sobao."),
            dict(id="end_carcel", file="assets/endings/end_carcel.png", w=1280, h=720, priority=2, prompt="Celda de Soto del Real: Manolo con mono naranja escribe su libro de autoayuda 'Mentalidad de tiburón (entre rejas)' rodeado de reclusos que compran sobaos de contrabando."),
            dict(id="end_cooperativa", file="assets/endings/end_cooperativa.png", w=1280, h=720, priority=2, prompt="La plantilla, feliz, en la puerta del obrador renombrado 'Sobaos Pasiegos S. Coop.', con Maripili de presidenta; un cartel dice 'Prohibida la entrada a Manolo'."),
            dict(id="end_forbes", file="assets/endings/end_forbes.png", w=1280, h=720, priority=2, prompt="Manolo cuelga, orgulloso, un recorte enmarcado de una revista de millonarios (sección curiosidades) encima del retrato de su padre."),
            dict(id="end_tiburon", file="assets/endings/end_tiburon.png", w=1280, h=720, priority=2, prompt="Manolo al timón de un barco en el puerto de Laredo con un tiburón hinchable, un Audi Q8 en el muelle y el mapa de España lleno de tiendas al fondo."),
            dict(id="end_pyme", file="assets/endings/end_pyme.png", w=1280, h=720, priority=3, prompt="Cena familiar en la que Manolo cuenta que estuvo 'a punto de petarlo'; el cuñado asiente y el resto bosteza."),
            dict(id="end_ruina", file="assets/endings/end_ruina.png", w=1280, h=720, priority=3, prompt="Manolo solo, frente al obrador original bajo la lluvia pasiega, gritando a una nube; las pasiegas siguen trabajando dentro tan tranquilas."),
        ],
    ),
    (
        "07_interfaz.md", "Interfaz: logotipo, fondo de título e iconos",
        "Recursos de interfaz. Los iconos siguen la ficha común (ver STYLE_GUIDE).",
        [
            dict(id="logo_game", file="assets/ui/logo_game.png", w=1024, h=512, priority=1, prompt="Logotipo 'Manolo Boomerez S.L.' con fondo transparente: letras con volumen, tipografía serif gruesa con aire de rótulo de pastelería de los años 80 en crema y dorado, un sobao con gafas de sol subidas haciendo de punto de la i o de mascota, y el subtítulo 'Sobaos, ladrillo y mentalidad de tiburón'. Debe leerse bien sobre un fondo naranja."),
            dict(id="bg_title", file="assets/ui/bg_title.png", w=1920, h=1080, priority=2, prompt="Fondo de la pantalla de título: valle pasiego al atardecer en diorama 2.5D (prados verdes, cabañas pasiegas, vacas) y, en el horizonte, un skyline imposible de rascacielos con forma de sobao. Deja despejada la franja central vertical (≈700 px de ancho), donde va el logotipo, Manolo y los botones; los colores cálidos y desenfocados del centro deben contrastar con texto oscuro."),
            dict(id="app_icon_512", file="assets/ui/app_icon_512.png", w=512, h=512, priority=2, prompt="Icono de app: un sobao con gafas de sol subidas y bigote sobre un fondo cuadrado naranja (#e8a33a) con esquinas suaves. Sin texto. Debe funcionar recortado en círculo (zona segura del 80 %)."),
            dict(id="app_icon_192", file="assets/ui/app_icon_192.png", w=192, h=192, priority=2, prompt="El mismo icono de app, reducido a 192×192."),
        ] + [
            dict(id=f"icon_{k}", file=f"assets/ui/icon_{k}.png", w=64, h=64, priority=3, prompt=f"{ICON_SPEC} Motivo: {v}")
            for k, v in [
                ("cash", "un fajo de billetes de euro con una goma"), ("debt", "un banco clásico con columnas y una cadena"),
                ("patrimonio", "un castillo hecho de sobaos"), ("rep", "una estrella dorada"), ("moral", "la cara de una pasiega sonriente con gorro de panadera"),
                ("fama", "un megáfono"), ("inspeccion", "una lupa sobre una nómina"), ("hacienda", "un edificio oficial con el escudo borroso y una calculadora"),
                ("calendar", "un calendario de taco"), ("staff", "un gorro de panadero"), ("control", "una llave con un llavero en forma de casa"),
                ("action_linkedin", "un maletín con un bocadillo de chat"), ("action_bar", "una caña de cerveza con una tapa"),
                ("action_alcalde", "un chuletón con un puro"), ("action_charla", "un atril con un micrófono"), ("action_cuentas", "una pila de tickets y una grapadora"),
                ("action_padel", "una pala de pádel y una pelota"), ("action_marbella", "una tumbona con sombrilla"),
                ("macro", "un termómetro económico con una flecha que sube y baja"), ("action_cena", "una cazuela de cocido humeante"),
                ("action_escapada", "un ramo de flores con un billete de tren"),
                ("lujo_reloj", "un reloj de pulsera dorado enorme"), ("lujo_coche", "un todoterreno negro de alta gama visto de frente"),
                ("lujo_palco", "un palco de estadio con una bufanda"), ("lujo_cuadro", "un cuadro moderno con una raya roja"),
                ("lujo_caballo", "un caballo de carreras con dorsal"), ("lujo_yate", "un yate blanco"), ("lujo_chalet", "un chalet blanco con piscina"),
            ]
        ] + [
            dict(id=f"logo_rival_{k}", file=f"assets/ui/logo_rival_{k}.png", w=128, h=128, priority=3,
                 prompt=f"Logotipo circular inventado para una cadena rival, fondo transparente, legible a 24 px, sin texto salvo una inicial: {v}")
            for k, v in [
                ("dona_rosa", "'La Tahona de Doña Rosa': una abuela sonriente con moño dentro de un óvalo rojo, estilo bollería industrial."),
                ("masa", "'MASA': una hogaza de masa madre minimalista en línea fina, verde salvia sobre crema, estética hipster."),
                ("burger_bros", "'Burger Bros': dos hamburguesas con gorra plana chocando los puños, azul marino y mostaza."),
                ("la_portena", "'La Porteña': una empanada con sombrero de gaucho, celeste y blanco."),
                ("vulture", "'Vulture Capital': un buitre geométrico sobre un edificio, morado y plata, estilo fondo de inversión."),
                ("gym_bros", "'IronBros 24h': una mancuerna con brazos musculosos, naranja quemado."),
                ("canas", "'Cañas & Tapas': una caña de cerveza con una tapa encima, marrón y dorado."),
                ("silver", "'Silver Care': una hoja plateada con forma de corazón, gris azulado, aséptico."),
                ("hub", "'WeHustle': un cohete saliendo de un portátil, verde esmeralda."),
            ]
        ],
    ),
]


def merge_extra():
    """Añade el arte pedido por otros módulos de contenido (si existe)."""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    try:
        from art_events_extra import ART as extra  # noqa: E402
    except ImportError:
        return
    groups = {g[0]: g[3] for g in GROUPS}
    known = {a["id"] for g in GROUPS for a in g[3]}
    for a in extra:
        if a["id"] in known:
            continue
        target = "04_retratos.md" if a["id"].startswith("portrait_") else "05_sucesos.md"
        groups[target].append(a)
        known.add(a["id"])


def main():
    merge_extra()
    existing = {}
    if os.path.exists(MANIFEST):
        with open(MANIFEST, encoding="utf-8") as f:
            for a in json.load(f).get("assets", []):
                existing[a["id"]] = a
    os.makedirs(REQUESTS, exist_ok=True)
    assets = []
    for fname, title, intro, items in GROUPS:
        lines = [f"# {title}", "", intro, "", "Lee antes `art/STYLE_GUIDE.md`. Cuando termines un recurso, marca su `status` como `done` en "
                 "`assets/manifest.json` (ver `AGENTS.md`).", ""]
        for a in items:
            prev = existing.get(a["id"], {})
            entry = {
                "id": a["id"], "file": a["file"], "w": a["w"], "h": a["h"],
                "status": prev.get("status", "requested"),
                "priority": a.get("priority", 2),
                "request": f"art/requests/{fname}#{a['id']}",
            }
            if "anchor" in a:
                entry["anchor"] = a["anchor"]
            for k in ("version", "notes"):
                if k in prev:
                    entry[k] = prev[k]
            assets.append(entry)
            lines += [f"## {a['id']}", "",
                      f"- **Archivo:** `{a['file']}`",
                      f"- **Tamaño:** {a['w']}×{a['h']} px" + (f" · **ancla:** ({a['anchor'][0]}, {a['anchor'][1]})" if "anchor" in a else ""),
                      f"- **Prioridad:** {a.get('priority', 2)} (1 = imprescindible, 3 = cuando haya tiempo)",
                      "", a["prompt"], ""]
        with open(os.path.join(REQUESTS, fname), "w", encoding="utf-8", newline="\n") as f:
            f.write("\n".join(lines))
    os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)
    with open(MANIFEST, "w", encoding="utf-8", newline="\n") as f:
        json.dump({"version": 1, "assets": assets}, f, ensure_ascii=False, indent=2)
        f.write("\n")
    done = sum(1 for a in assets if a["status"] == "done")
    print(f"{len(assets)} recursos en el catálogo ({done} terminados).")


if __name__ == "__main__":
    main()
