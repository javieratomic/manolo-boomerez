"""Peticiones de arte del segundo lote de contenido.

Cubre las imágenes nuevas que usan src/data/eventsCities.js (sucesos de ciudad, ev_ciudad_*) y
src/data/manoloActionsExtra.js (iconos de acción, icon_action_*). Los retratos de esos sucesos son todos
retratos que ya existen en el catálogo, así que aquí no se pide ninguno.
Mismo formato que tools/art_catalog.py, que las añade al ejecutarse (merge_extra):
  - Sucesos: 768×432, diorama isométrico 2.5D con luz cálida, sin texto legible, aire en el tercio inferior.
  - Iconos: 64×64, PNG transparente, 2.5D simplificado con contorno oscuro (ICON_SPEC del catálogo).
Nada de marcas, logotipos reales ni personas reales reconocibles.
"""

D = "Diorama isométrico 2.5D con luz cálida, como una maqueta vista en diagonal desde arriba. "
NT = " Sin texto legible."

ICON = (
    "Icono de interfaz de 64×64 px, PNG con fondo transparente. Estilo 2.5D simplificado, con volumen ligero "
    "y contorno oscuro de 2-3 px para que se lea a 16-24 px sobre la barra marrón (#3b2a1a). Sin texto. Motivo: "
)


def ev(id, prompt, priority=3):
    return dict(id=id, file=f"assets/events/{id}.png", w=768, h=432, priority=priority, prompt=D + prompt + NT)


def icon(action, motif, priority=3):
    id = f"icon_action_{action}"
    return dict(id=id, file=f"assets/ui/{id}.png", w=64, h=64, priority=priority, prompt=ICON + motif)


ART = [
    # ------------------------------------------------------------------ Sucesos de ciudad
    ev("ev_ciudad_pamplona", "Calle estrecha del casco antiguo de Pamplona el 6 de julio: una peña vestida de blanco con pañuelo y faja roja, con "
       "charanga y bombo, entra en el local de Manolo cargando mochilas; la encargada, con el pañuelo al cuello, mira a Manolo, que asoma "
       "por la puerta con gafas de sol y cara de calcular precios. Confeti y balcones con banderas rojas."),
    ev("ev_ciudad_valencia", "Cruce de calles de València en Fallas: un monumento fallero de cartón piedra de cuatro metros con un ninot caricaturesco "
       "de Manolo (gafas de sol en la cabeza, un sobao en cada mano) sentado en un trono de becarios de cartón; vecinos con buñuelos y "
       "petardos alrededor y el Manolo de verdad, pequeñito, mirándolo horrorizado."),
    ev("ev_ciudad_sevilla", "Real de la Feria de Abril de noche: calle de casetas a rayas con farolillos de colores, gente con trajes de flamenca y "
       "sombrero cordobés; en primer plano, una caseta improvisada con una foto enorme de Manolo en la entrada y un señor muy serio con "
       "traje que señala a Manolo para que salga."),
    ev("ev_ciudad_marbella", "Puerto deportivo de Marbella al atardecer: un yate blanco gigantesco con luces de fiesta y camareros con bandejas doradas "
       "llenas de sobaos; Manolo, en el muelle con camisa de lino y gafas de sol, intenta subir por la pasarela mientras un hombre misterioso "
       "con traje negro le corta el paso."),
    ev("ev_ciudad_bilbao", "Interior de un txoko vasco: mesa larga de madera, cocina de hierro y ocho señores mayores con jersey de lana y boina, "
       "brazos cruzados, observando muy serios a Manolo, que con delantal y gorro de cocinero presenta una bandeja de sobaos temblorosa. "
       "Cazuelas de barro y sidra en la mesa."),
    ev("ev_ciudad_barcelona", "Calle del centro de Barcelona en verano, con balcones de hierro y toallas tendidas: una marcha vecinal con pancartas "
       "genéricas, silbatos y pistolas de agua se para ante el escaparate de Manolo; una vecina de setenta años en bata le apunta con una "
       "pistola de agua de colores mientras una cola de turistas con gorras y riñoneras espera detrás."),
    ev("ev_ciudad_madrid", "Calle del centro de Madrid con una señal de zona de bajas emisiones (pictograma sin texto) y una cámara de tráfico; una "
       "furgoneta de reparto diésel viejísima y abollada, echando humo negro, con una pegatina verde casera pegada en el parabrisas; Manolo "
       "al volante y el gestor Paco al lado con una pila de multas."),
    ev("ev_ciudad_palma", "Puerto de Palma con siete cruceros gigantes en fila, como edificios flotantes, y la catedral al fondo; una marea de "
       "cruceristas con pulseras y gorras invade una callejuela del casco antiguo hasta el local de Manolo, mientras los vecinos miran "
       "agobiados desde los portales."),
    ev("ev_ciudad_zaragoza", "Ofrenda de Flores en Zaragoza: plaza con un enorme manto de claveles de colores, grupos vestidos de baturros con "
       "cachirulo y faja, y el cierzo levantando pañuelos; en primer plano, la madre de Manolo, de baturra y con un ramo, del brazo de un "
       "Manolo vestido de baturro que persigue su cachirulo, que sale volando."),
    ev("ev_ciudad_santander", "Aula de un palacio junto a la bahía de Santander, con ventanales al mar: un profesor proyecta en la pantalla un "
       "esquema de una empresa con un sobao en el centro (sin texto); en la última fila, Manolo con gafas de sol se hunde en la silla y, "
       "dos filas más adelante, Vanessa se tapa la cara con un folleto."),
    ev("ev_ciudad_coruna", "Paseo marítimo de A Coruña bajo un orballo gris y viento: paraguas dados la vuelta, galerías blancas acristaladas al "
       "fondo y gente encogida; en la puerta del local de Manolo, él agita el puño contra el cielo mientras su encargado, tranquilo, reparte "
       "paraguas con el logo de un sobao."),
    ev("ev_ciudad_valladolid", "Calle de Valladolid envuelta en niebla y escarcha: dentro de una cafetería, la plantilla atiende con abrigo, gorro y "
       "guantes de lana, y una fila de funcionarios trajeados con bufanda desayuna café con leche y sobaos mirando un termómetro de pared "
       "bajo cero; Manolo, abrigado hasta las cejas, finge que no pasa nada."),
    ev("ev_ciudad_cordoba", "Patio cordobés en mayo: paredes encaladas cubiertas de macetas azules con geranios, una fuente y una señora mayor "
       "regándolas con una caña y un cubo; al lado, en el patio trasero del local de Manolo, geranios de plástico demasiado brillantes "
       "entre cajas de cartón y un compresor, y Manolo con una regadera vacía."),
    ev("ev_ciudad_toledo", "Calle empedrada de Toledo con la catedral al fondo: un guía turístico con un paraguas amarillo levantado dirige a un "
       "grupo de turistas hacia el local de Manolo, que espera en la puerta con una bandeja de sobaos y una corona de cartón; escaparates "
       "vecinos con espadas y mazapanes."),
    ev("ev_ciudad_tarragona", "Parque temático de estilo romano bajo un sol abrasador: montaña rusa con columnas, un Coliseo de fibra de vidrio y "
       "colas larguísimas; en un quiosco de sobaos, empleados sudorosos vestidos de legionarios con casco, y Manolo con corona de laurel y "
       "sábana morada, a la sombra, con el pulgar hacia arriba."),
    ev("ev_ciudad_almeria", "Desierto de Tabernas con un poblado del oeste de madera: cámaras de cine, focos y un equipo de rodaje bajo sombrillas; "
       "una mesa de catering con sobaos y botellas de agua, y Manolo vestido de cacique del oeste, con chaleco y sombrero, cayéndose de "
       "un caballo de cartón."),
    ev("ev_ciudad_laspalmas", "Carnaval de Las Palmas de Gran Canaria de noche: plaza llena de gente disfrazada, confeti, palmeras y una murga "
       "con trajes de colores cantando en un escenario; Manolo, disfrazado de sobao gigante, canta con ellos junto a su plantilla, también "
       "disfrazada."),
    ev("ev_ciudad_granada", "Barra de un bar de Granada con la Alhambra iluminada al fondo por la ventana: en la barra vecina, cañas con tapas "
       "generosas; en la de Manolo, un café con un platito de tres cacahuetes, y una señora mayor que lo mira con paciencia infinita "
       "mientras Manolo se rasca la cabeza."),
    ev("ev_ciudad_murcia", "Bando de la Huerta en Murcia: desfile de gente vestida de huertano con zaragüelles, refajos y pañuelos, y barracas con "
       "farolillos; en una barraca, unas vecinas fríen paparajotes (hojas de limonero rebozadas) y Manolo enseña con orgullo un sobao "
       "rebozado con una hoja de limonero pinchada encima."),
    ev("ev_ciudad_alicante", "Terraza soleada frente al mar en Alicante, con palmeras: un grupo de jubilados del norte de Europa con sombreros de "
       "paja y sandalias con calcetines; su presidenta, alta y con gafas, presenta una carpeta con gráficos a Manolo, que sostiene un sobao "
       "normal con cara de no entender nada."),
    ev("ev_ciudad_salamanca", "Plaza Mayor de Salamanca de noche, iluminada en dorado y abarrotada de estudiantes con gorros de Papá Noel y bufandas: "
       "en la torre, un reloj marca las doce y miles de estudiantes se comen minisobaos a la vez; Manolo, en un puesto lleno de bolsitas, "
       "se frota las manos."),
    ev("ev_ciudad_oviedo", "Plató de televisión regional decorado con hórreos y montañas de cartón: a un lado, una confitera mayor muy digna con "
       "una bandeja de carbayones dorados; al otro, Manolo con una bandeja de sobaos; en medio, una presentadora con micrófono y seis "
       "vecinos con paletas de puntuación en blanco."),
    ev("ev_ciudad_vitoria", "Calle verde de Vitoria-Gasteiz con carril bici, árboles y contenedores de reciclaje de colores: un técnico municipal "
       "con chaleco y tableta revisa la fachada del local de Manolo, pintada de verde chillón y con una maceta de plástico en la puerta, "
       "mientras una furgoneta aparcada en doble fila suelta humo."),
    ev("ev_ciudad_selaya", "Plaza de Selaya con la iglesia de piedra, prados verdes y vacas pasiegas al fondo entre la niebla: a la salida de misa, "
       "el alcalde con cara de funeral señala una escuela rural pequeña con un columpio vacío, y Manolo, con gafas de sol, mira el móvil; "
       "unos pocos vecinos mayores observan la escena."),

    # ------------------------------------------------------------------ Iconos de las acciones nuevas
    icon("visita_sorpresa", "unas gafas de sol oscuras sobre una gabardina beige con el cuello subido, estilo espía."),
    icon("congreso", "un micrófono de diadema sobre un pequeño escenario con un foco."),
    icon("golf", "una bandera de hoyo de golf en un green con una pelota blanca al lado."),
    icon("portada", "una revista con una silueta de hombre con los brazos cruzados en la portada y un destello de flash."),
    icon("mentor", "un birrete de graduación sobre una libreta abierta con un bolígrafo."),

    # ------------------------------------------------------------------ Cláusula del testamento (0.3)
    # Se usa en la tarjeta de la cláusula (pestaña Manolo) y en el chip del objetivo; mientras no exista, emoji 📜.
    dict(id="icon_clausula", file="assets/ui/icon_clausula.png", w=64, h=64, priority=3,
         prompt=ICON + "un sobre de papel antiguo cerrado con un sello de lacre rojo con una vaca pasiega grabada."),
]
