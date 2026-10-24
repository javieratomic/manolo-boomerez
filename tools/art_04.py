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
]
