"""Peticiones de arte de los arcos narrativos y los sucesos extra.

Cubre las imágenes que usan src/data/eventsArcs.js y src/data/eventsExtra.js. Mismo formato que las
entradas de tools/art_catalog.py (EVENT_SPEC y PORTRAIT_SPEC aplican igual):
  - Sucesos: 768×432, diorama isométrico 2.5D con luz cálida, sin texto legible, aire en el tercio inferior.
  - Retratos: 512×512, busto de caricatura editorial 2.5D, cara dentro del círculo central, fondo de color plano.

Nota: portrait_esposa_merche también lo usa el suceso 'divorcio' de src/data/eventsSystems.js; si ya está
en el catálogo principal, no hace falta duplicarlo.
"""

D = "Diorama isométrico 2.5D con luz cálida, como una maqueta vista en diagonal desde arriba. "
NT = " Sin texto legible."


def ev(id, prompt, priority=3):
    return dict(id=id, file=f"assets/events/{id}.png", w=768, h=432, priority=priority, prompt=D + prompt + NT)


ART = [
    # ------------------------------------------------------------------ Retratos nuevos
    dict(id="portrait_periodista", file="assets/portraits/portrait_periodista.png", w=512, h=512, priority=2, prompt=(
        "Lucía Ferrer, periodista de 'El Confidencial Pasiego': unos 35 años, melena corta castaña, gafas redondas finas, "
        "gabardina beige sobre un jersey de cuello alto, libreta de espiral en una mano y bolígrafo mordisqueado en la otra. "
        "Mirada curiosa, serena y tenaz; media sonrisa de quien ya sabe la respuesta. Fondo de color #2e8b7a.")),
    dict(id="portrait_esposa_merche", file="assets/portraits/portrait_esposa_merche.png", w=512, h=512, priority=2, prompt=(
        "Merche, la mujer de Manolo: unos 54 años, media melena cobriza con mechas, gafas de leer colgadas de una cadenita, "
        "chaqueta de punto y una carpeta de facturas apretada contra el pecho. Elegante, cansada y muy lista; ceja levantada "
        "de 'treinta años aguantándote'. Fondo de color #c0726a.")),
    dict(id="portrait_madre", file="assets/portraits/portrait_madre.png", w=512, h=512, priority=2, prompt=(
        "Doña Remedios, la madre de Manolo: 81 años, pelo blanco cardado, rebeca gris, collar de perlas pequeño, bastón de "
        "aluminio y un táper de croquetas en la mano. Pequeñita pero temible; mirada de 'a mí no me engañas, que te he parido'. "
        "Fondo de color #6b8e9e.")),

    # ------------------------------------------------------------------ Arco: el reportaje
    ev("ev_arc_prensa_llamada", "Despacho del obrador con el retrato de Don Anselmo: Manolo, con el móvil en la oreja, se seca el sudor; en un recuadro "
       "flotante, la periodista Lucía Ferrer toma notas en una libreta de espiral en una redacción pequeña llena de papeles.", 2),
    ev("ev_arc_prensa_plantilla", "Puerta trasera del obrador al amanecer: la periodista con su libreta escucha a Maripili y a varias pasiegas con gorro "
       "de panadera y delantal; Manolo espía detrás de una cortina de la ventana."),
    ev("ev_arc_prensa_portada", "Domingo en un bar de pueblo: todos los parroquianos leen el mismo periódico abierto con una gran foto del obrador en "
       "portada (titulares ilegibles); Manolo, en la barra, se esconde detrás de una taza de café."),
    ev("ev_arc_prensa_juicio", "Pequeña sala de juzgado provincial: la periodista con tres cajas de documentos y una abuela pasiega sentada en primera "
       "fila; Manolo y el anciano abogado Don Cosme cuchichean en la mesa de enfrente."),

    # ------------------------------------------------------------------ Arco: el Sobaoverso
    ev("ev_arc_jonathan_sobaoverso", "El cuñado Jonathan, con gafas de realidad virtual, muestra en un portátil un valle pasiego pixelado con parcelas "
       "de colores y sobaos dorados flotando; Manolo mira la pantalla con una mezcla de codicia y miedo."),
    ev("ev_arc_jonathan_gala", "Salón de bodas recargado con lámparas de araña, bengalas y cañones de humo: Jonathan en el escenario con traje de "
       "lentejuelas señala una pirámide luminosa; el público aplaude con copas de cava; Manolo en primera fila."),
    ev("ev_arc_jonathan_redada", "Amanecer azulado frente a un bloque de pisos: agentes de policía genéricos sacan cajas y un ordenador; Jonathan sale "
       "en pijama de unicornio con la cabeza gacha; vecinos asomados a los balcones."),
    ev("ev_arc_jonathan_obrador", "Interior del obrador de madrugada: Jonathan, con delantal enharinado y gorro de panadero, amasa torpemente junto a "
       "Maripili, que le corrige con paciencia; bandejas de sobaos recién hechos."),

    # ------------------------------------------------------------------ Arco: el convenio
    ev("ev_arc_comite_sobre", "Mesa del despacho de Manolo: un sobre de papel de estraza abierto, un libro grueso de leyes con pósits de tres "
       "colores y un calendario; Maripili, de brazos cruzados, espera la respuesta; Manolo se afloja el cuello del polo."),
    ev("ev_arc_comite_plataforma", "Cocina del obrador convertida en sala de reuniones: cafetera, sobaos, folios con listas y una pizarra con flechas; "
       "la comisión de trabajadoras a un lado de la mesa y Manolo solo al otro, con un futbolín al fondo."),
    ev("ev_arc_comite_firma", "Momento de la firma: Manolo y Maripili se dan la mano sobre un documento grapado, con un bolígrafo antiguo encima; la "
       "plantilla aplaude alrededor y el retrato de Don Anselmo parece sonreír."),
    ev("ev_arc_comite_huelga", "Piquete pacífico frente al obrador con pancartas en blanco, termos de caldo y vecinos solidarios; un robot amasador "
       "industrial asoma por la puerta del almacén; Manolo mira desde el Audi aparcado."),

    # ------------------------------------------------------------------ Arco: Operación Hojaldre
    ev("ev_arc_hojaldre_registro", "Fachada de un ayuntamiento de pueblo cántabro con balcón y banderas genéricas: agentes de la Guardia Civil sacan "
       "cajas de cartón llenas de carpetas; en la esquina, una cabina telefónica con el alcalde dentro hablando a escondidas.", 2),
    ev("ev_arc_hojaldre_juzgado", "Pasillo de un juzgado con bancos de madera: Manolo espera su turno con una caja de sobaos sobre las rodillas; una "
       "funcionaria con carpetas lo mira de reojo; al fondo, el alcalde con gafas de sol."),
    ev("ev_arc_hojaldre_juicio", "Sala de vistas solemne: el alcalde en el banquillo con su traje de fiestas sin la banda, una fiscal de pie con "
       "documentos, Manolo en el estrado de testigos gesticulando con un chuletón de plástico como prueba en una bolsa."),

    # ------------------------------------------------------------------ Arco: Merche
    ev("ev_arc_merche_crisis", "Cocina familiar a las dos de la mañana, iluminada solo por la nevera y el móvil: Manolo con una chupa de cuero con la "
       "etiqueta colgando ve vídeos; Merche en bata, en la puerta, le observa con los brazos cruzados."),
    ev("ev_arc_merche_carpeta", "Mesa de la cocina con una carpeta enorme de facturas antiguas escritas a mano, una calculadora de los ochenta y dos "
       "tazas de café; Merche, muy seria, apoya la mano encima; Manolo, empequeñecido, al otro lado."),
    ev("ev_arc_merche_aniversario", "Restaurante de pueblo con manteles de cuadros rojos y velas: Manolo y Merche brindan en una mesa junto a la "
       "ventana; en la mesa de al lado, un móvil boca abajo y una tarta pequeña con el número 30."),

    # ------------------------------------------------------------------ Arco: la carta de Don Anselmo
    ev("ev_arc_anselmo_lata", "Desván polvoriento del obrador con vigas de madera, sacos de harina y muebles viejos bajo sábanas: Vanessa abre una lata "
       "de galletas oxidada que contiene una libreta de hule y un sobre amarillento, iluminados por un rayo de luz.", 2),
    ev("ev_arc_anselmo_carta", "Obrador de noche, iluminado por la boca del horno de leña: Manolo, sentado en un saco de harina, lee una carta a mano "
       "con los ojos húmedos; en la pared, el retrato de Don Anselmo con su boina.", 2),
    ev("ev_arc_anselmo_receta", "Mesa de mármol enharinada con una libreta antigua abierta (letra ilegible), mantequilla en papel, limones, un "
       "rallador y un frasquito de anís; manos de varias generaciones de pasiegas amasando alrededor."),

    # ------------------------------------------------------------------ Negocios nuevos
    ev("ev_residencia_motin", "Comedor de una residencia de mayores: una anciana menuda con bastón subida a una silla arenga a otros residentes que "
       "levantan los cubiertos; platos de puré gris en las mesas; una gerocultora sola mira la escena."),
    ev("ev_gimnasio_bajas", "Gimnasio low-cost 24 horas casi vacío con máquinas naranjas y luces de neón; una pantalla gigante muestra un formulario "
       "laberíntico; en la puerta, una cola de gente en chándal con carpetas, esperando."),
    ev("ev_coworking_cabina", "Coworking con mesas compartidas, plantas colgantes y barril de kombucha: dentro de una cabina telefónica insonorizada vive "
       "el coach Iker con una esterilla, un hervidor y botes de proteína; los nómadas digitales le miran por el cristal."),
    ev("ev_taberna_pinchos", "Barra de una taberna con azulejos y jamones colgados: varios pinchos en platitos ante un jurado con boina; una cocinera "
       "orgullosa sostiene una tortilla jugosa mientras Manolo presenta un sobao con morcilla y espuma."),

    # ------------------------------------------------------------------ Negocios de siempre
    ev("ev_express_dependiente", "Tienda low-cost de sobaos con neón naranja: un dependiente joven, multiplicado como en una foto de movimiento, cobra, "
       "empaqueta, friega y repone a la vez ante una cola larguísima; un cliente lo graba con el móvil en vertical."),
    ev("ev_maison_critico", "Pâtisserie elegante de mármol y luz cálida: en la mesa del fondo, un crítico con pajarita corta un sobao con cuchillo y "
       "tenedor y toma notas; detrás del mostrador, el personal y Manolo contienen la respiración."),
    ev("ev_vivienda_caldera", "Pasillo de un bloque de viviendas para la plantilla en invierno: escarcha en las ventanas, una caldera rota que echa "
       "humo, trabajadoras con abrigos, gorros y mantas, y niños con bufanda; un termómetro de pared muy bajo."),
    ev("ev_airbnb_despedida", "Fachada de un edificio de apartamentos turísticos de noche: en un balcón iluminado, un grupo disfrazado de vikingos canta "
       "con un altavoz enorme; en el balcón de abajo, una vecina en bata y rulos habla por teléfono, indignada."),
    ev("ev_smash_desinfla", "Hamburguesería de neón rosa con las mesas vacías; un globo con forma de hamburguesa se desinfla en el techo; enfrente, "
       "una cola de jóvenes ante un puesto de croquetas de autor."),
    ev("ev_empanadas_final", "Local de empanadas con banderines celestes y blancos, una pantalla gigante con un partido de fútbol (sin escudos ni marcas) "
       "y clientes saltando de alegría; el primo Rodrigo llora abrazado a una bandeja de empanadas."),
    ev("ev_academy_reembolso", "Aula de la academia de negocios con diapositivas de tiburones y gráficas que suben: un alumno de mediana edad, con una "
       "caja de fundas de móvil sin vender, levanta la mano en primera fila mientras Manolo, en el atril, traga saliva."),

    # ------------------------------------------------------------------ Plantilla y familia
    ev("ev_becario_genio", "Oficina diminuta del obrador: un becario ojeroso enseña en un portátil una aplicación con calendarios y gráficos que "
       "conectan el horno, el almacén y los turnos con líneas luminosas; Manolo y el gestor Paco miran la pantalla boquiabiertos."),
    ev("ev_jubilacion_conchi", "Fiesta de jubilación en el obrador decorado con guirnaldas: una pasiega veterana de pelo blanco sopla una vela sobre un "
       "sobao, rodeada de compañeras emocionadas; sobre la mesa, una placa y una caja de reloj."),
    ev("ev_madre_visita", "Obrador en plena producción: una señora mayor con bastón y táper de croquetas prueba un sobao con cara de juez implacable; "
       "las pasiegas aguantan la risa y Manolo se encoge como un niño."),

    # ------------------------------------------------------------------ Calendario español
    ev("ev_fiestas_patronales", "Plaza de pueblo cántabro en fiestas: escenario con orquesta, guirnaldas de bombillas, puesto de churros y una "
       "caseta de sobaos; el alcalde pasa el brazo por el hombro de Manolo junto al escenario.", 2),
    ev("ev_black_friday", "Escaparate de una tienda de sobaos con enormes carteles negros de descuento (sin texto legible, solo porcentajes "
       "abstractos y flechas) y una multitud agolpada en la puerta; Paco, detrás, cambia etiquetas de precio a escondidas."),
    ev("ev_cuesta_enero", "Calle cuesta arriba nevada en enero: trabajadoras del obrador empujan carritos de la compra casi vacíos por una pendiente "
       "exagerada; en lo alto, Manolo en su Audi con unas gafas de esquí en la cabeza."),
    ev("ev_puente_mayo", "Calendario gigante de mayo convertido en un puente de piedra literal sobre el que cruzan maletas, sombrillas y familias "
       "hacia una playa; debajo, el obrador con Manolo calculando con una servilleta."),
    ev("ev_san_fermin", "Calle estrecha de Pamplona en un encierro genérico: corredores vestidos de blanco con pañuelo rojo, y Manolo con un polo de "
       "empresa pegado a la pared, mientras un toro estilizado pasa sin mirarle; un puesto de sobaos en la esquina."),
    ev("ev_semana_santa", "Procesión de Semana Santa por un pueblo, con un paso cubierto de flores; una camarera de la cofradía mayor mira con orgullo; "
       "en primer plano, una bandeja de torrijas hechas con sobao sobre el mostrador de la tienda."),
    ev("ev_ola_frio", "Valle pasiego cubierto de nieve: el camión de la mantequilla atascado en un puerto de montaña, un tractor de ganadero abriendo "
       "paso y dos pasiegas llegando al obrador con esquís de fondo; humo cálido saliendo de la chimenea."),

    # ------------------------------------------------------------------ Ciclo económico
    ev("ev_fondo_buitre", "Ático con vistas a una ciudad llena de grúas: un señor con chaleco acolchado y gafas de sol desliza un contrato y un "
       "maletín hacia Manolo; sobre la mesa, una maqueta del edificio de apartamentos con un lazo de regalo."),
    ev("ev_crisis_sueldos", "Asamblea en el vestuario del obrador bajo una luz fría de crisis: Maripili de pie con un folio firmado por todas, la "
       "plantilla detrás, unida y seria; Manolo frente a ellas con una gráfica que cae proyectada en la pared."),
    ev("ev_headhunter", "Puerta del obrador: una furgoneta negra elegante de una cadena de pastelerías de ciudad recoge a tres pasteleras con sus "
       "rodillos; un cazatalentos con tableta les abre la puerta; Manolo corre detrás con una oferta en la mano."),
    ev("ev_recalificacion_prado", "Prado verde junto a un río con vacas pasiegas pastando; sobre él flota, como una proyección translúcida, una "
       "urbanización de adosados idénticos; en primer plano, el alcalde y Manolo comen un chuletón en una mesa al aire libre."),
]


if __name__ == "__main__":
    ids = [a["id"] for a in ART]
    assert len(ids) == len(set(ids)), "ids repetidos"
    print(f"{len(ART)} peticiones ({sum(1 for i in ids if i.startswith('ev_'))} sucesos, {sum(1 for i in ids if i.startswith('portrait_'))} retratos)")
