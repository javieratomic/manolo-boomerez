"""Peticiones de arte de la 0.4 («Cuentas claras»).

Mismo formato que tools/art_content_extra2.py; tools/art_catalog.py las añade al ejecutarse (merge_extra).
  - Sucesos: 768×432, diorama isométrico 2.5D con luz cálida, sin texto legible, aire en el tercio inferior.
  - Retratos: 512×512, busto 2.5D con el mismo estilo que el resto de retratos del juego.
  - Iconos: 64×64, PNG transparente, 2.5D simplificado con contorno oscuro.
Nada de marcas, logotipos reales ni personas reales reconocibles.
"""

D = "Diorama isométrico 2.5D con luz cálida, como una maqueta vista en diagonal desde arriba. "
NT = " Sin texto legible."

ICON = (
    "Icono de interfaz de 64×64 px, PNG con fondo transparente. Estilo 2.5D simplificado, con volumen ligero "
    "y contorno oscuro de 2-3 px para que se lea a 16-24 px sobre fondo claro o sobre la barra marrón (#3b2a1a). Sin texto. Motivo: "
)


def ev(id, prompt, priority=3):
    return dict(id=id, file=f"assets/events/{id}.png", w=768, h=432, priority=priority, prompt=D + prompt + NT)


def icon(id, motif, priority=3):
    return dict(id=id, file=f"assets/ui/{id}.png", w=64, h=64, priority=priority, prompt=ICON + motif)


ART = [
    # ------------------------------------------------------------------ La cuenta de la plantilla
    ev("ev_comite_nace", "Sala de descanso del obrador convertida en colegio electoral: urna de cartón, papeletas, gorros de panadera colgados; "
       "Maripili (delantal, moño, gafas en la punta de la nariz) cuenta votos; Kevin, un chaval con gorra hacia atrás, vota solo en un rincón.", 2),
    ev("ev_convenio_anual", "Mesa de la cocina del obrador con una tabla salarial fotocopiada, cafetera italiana, bandeja de sobaos y una calculadora; "
       "Maripili señala una cifra con el bolígrafo; Manolo (55 años, gafas de sol subidas en la calva, camisa salmón) suda con la corbata aflojada.", 2),
    ev("ev_huelga_general", "Calle de una ciudad española con varios negocios del grupo (tienda de sobaos, taberna, gimnasio, residencia de mayores) con "
       "las persianas a medio bajar y piquetes con chalecos y pancartas en blanco; Manolo mira desde la ventanilla de un todoterreno.", 2),
    ev("ev_liquidacion", "Despacho del obrador: la inspectora de Trabajo (traje azul marino, gafas, carpeta gruesa) con una calculadora de rollo cuyo tique "
       "larguísimo cae al suelo y llega hasta los zapatos de Manolo; carpetas llenas de pósits.", 2),
    icon("icon_agravio", "una balanza: en un platillo, una bolsa de dinero grande; en el otro, un gorro de panadera pequeño.", 2),
    icon("icon_reparto", "un sobao cortado en porciones, como un gráfico de tarta.", 3),

    # ------------------------------------------------------------------ La cartilla de Doña Remedios
    dict(id="portrait_sobrino_kevin", file="assets/portraits/portrait_sobrino_kevin.png", w=512, h=512, priority=2, prompt=(
        "Kevin Boomerez, el sobrino de Manolo: 24 años, gorra hacia atrás, sudadera de gimnasio, un rollo de cinta americana "
        "colgado del cinturón como un revólver, sonrisa de 'yo me encargo, tío'. Fondo de color #9ccc65.")),
    ev("ev_cartilla", "Mesa camilla con mantel de hule: una libreta de ahorros antigua forrada de plástico, gafas de leer, un bolígrafo "
       "de propaganda de una caja de ahorros y un plato de croquetas; Doña Remedios (81 años, pelo blanco cardado, rebeca gris) apunta "
       "una cifra y Manolo, de pie, mira al suelo.", 2),
    ev("ev_cartilla_rescate", "Sucursal bancaria de pueblo: Doña Remedios golpea el mostrador con su bastón de aluminio delante del "
       "director, que se encoge en su silla; Manolo se esconde detrás de ella.", 2),
    ev("ev_cartilla_vence", "Cocina de pueblo: Doña Remedios con la libreta de ahorros abierta por la última página y el bastón apoyado en "
       "la mesa, mirando el reloj de pared; Manolo entra por la puerta con un sobre en la mano.", 3),
    ev("ev_cartilla_enfado", "Doña Remedios al teléfono fijo de cable rizado, con la mano en la cadera, en su salón con tapetes de ganchillo; "
       "por la ventana se ve a la vecina cotilla en su balcón, también al teléfono.", 3),
    # ------------------------------------------------------------------ La Bolsa tiene memoria
    ev("ev_promesa_trimestre", "Manolo, con traje y zapatillas deportivas, en videollamada con una cuadrícula de analistas genéricos en "
       "pantallas pequeñas; detrás de él, una pizarra con un gráfico de barras que sube.", 2),
    ev("ev_informe_bajista", "Sala de bolsa con una pantalla gigante y un gráfico que cae en rojo; delante, un sobao partido por la mitad, "
       "hueco por dentro; Manolo con las manos en la cabeza.", 2),
    ev("ev_cierre_trimestre", "Paco el gestor (60 años, bigote, chaleco de punto), de noche, con una hoja de cálculo impresa kilométrica que "
       "cae del escritorio, un flexo encendido y un purito apagado; Manolo le trae un café.", 3),
    ev("ev_remedios_domingo", "Comedor de domingo en una casa de pueblo cántabra: una olla de cocido montañés humeante, nóminas extendidas "
       "junto al pan y la berza; Doña Remedios las lee con las gafas en la punta de la nariz mientras Manolo suda.", 3),
]
