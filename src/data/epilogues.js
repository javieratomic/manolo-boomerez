// ¿Qué fue de...? Epílogo de cada personaje según lo que pasó en la partida (la primera línea que se
// cumple, de arriba abajo; la última no tiene condición). Lee banderas que escriben los sucesos.
const f = (s) => s.flags || {};
const heir = (s) => s.sucesion?.heir;

export const HITOS = {
  primera_tienda: { label: 'Abre su primera tienda', peso: 2 },
  primera_franquicia: { label: 'Vende su primera franquicia', peso: 2 },
  millon: { label: 'Primer millón de patrimonio', peso: 3 },
  cinco_millones: { label: 'Cinco millones', peso: 4 },
  comite: { label: 'Nace el comité de empresa', peso: 2 },
  convenio: { label: 'Firma un convenio', peso: 3 },
  huelga_general: { label: 'Huelga general en Boomerez', peso: 4 },
  liquidacion: { label: 'Marisa le liquida lo ahorrado en nóminas', peso: 4 },
  expediente: { label: 'Primer expediente penal', peso: 5 },
  divorcio: { label: 'Merche pide el divorcio', peso: 5 },
  bolsa: { label: 'Toca la campana: Boomerez S.A. sale a Bolsa', peso: 4 },
  maquillaje: { label: '«El sobao está hueco»: le pillan maquillando las cuentas', peso: 4 },
  opa: { label: 'Se come a una cadena rival con una OPA', peso: 3 },
  mama_presta: { label: 'Le pide dinero a su madre', peso: 2 },
  embargo: { label: 'Su madre le embarga', peso: 4 },
  rescate: { label: 'Su madre le rescata del concurso', peso: 5 },
  susto: { label: 'Un susto en la pista de pádel', peso: 3 },
  clausula_rota: { label: 'Rompe la cláusula del testamento', peso: 3 },
  sesenta: { label: 'Cumple sesenta años', peso: 3 },
  heredero: { label: 'Elige heredero ante el notario', peso: 3 },
  navidad5: { label: 'Cinco Navidades seguidas con cesta', peso: 2 },
  francia: { label: 'Cierra agosto «como en Francia»', peso: 2 },
};

// Finales de los arcos (se derivan de la bandera del final y de <arco>Month, sin enganche).
export const ARC_HITOS = {
  merche: { peso: 4, flag: 'mercheFin', label: { votos: 'Renueva los votos con Merche en la ermita', cena: 'Una cena sin móvil con Merche', perdon: 'Le pide perdón a Merche de verdad', despacho: 'Se muda al despacho del obrador', abogados: 'Abogados de por medio con Merche' } },
  jonathan: { peso: 3, flag: 'jonFinal', label: { fianza: 'Paga la fianza de Jonathan', colabora: 'Colabora con la policía en lo de Jonathan', cosme: 'Don Cosme saca a Jonathan del lío', borra: 'Borra los mensajes de «Cuñaos al Millón»' } },
  hojaldre: { peso: 5, flag: 'hojaldreFin', label: { conformidad: 'Acuerdo con la fiscalía en la Operación Hojaldre', juicio: 'Juicio de la Operación Hojaldre', manta: 'Tira de la manta en la Operación Hojaldre' } },
  prensa: { peso: 3, flag: 'prensaFinal', label: { cara: 'Da la cara ante Lucía Ferrer', comprado: 'Compra el periódico', linkedin: 'Comparte en LinkedIn un reportaje contra él', querella: 'Se querella contra el periódico' } },
  comite: { peso: 3, flag: 'comiteFin', label: { firmado: 'Firma el I Convenio de Obradores Boomerez', light: 'Firma un convenio «light»', roto: 'Se levanta de la mesa del convenio', cedido: 'Cede y firma el convenio', huelga: 'Aguanta una huelga', esquiroles: 'Trae esquiroles en una huelga', mediado: 'Don Cosme media con el comité' } },
  anselmo: { peso: 3, flag: 'anselmoFin', label: { receta: 'Vuelve a la receta de su padre', edicion: 'Edición limitada «Receta Anselmo»', publicada: 'Regala la receta a todos los obradores del valle', vendida: 'Vende la receta de su padre a una multinacional' } },
};

export const EPILOGUE = [
  {
    who: 'merche', name: 'Merche', portrait: 'portrait_esposa_merche', always: true,
    lines: [
      { when: (s) => f(s).divorciado, text: 'Se quedó el chalet en gananciales y abrió una tienda de decoración en Santander que factura más que tú. Te felicita la Navidad «de parte de Merche y de su abogada».' },
      { when: (s) => f(s).mercheFin === 'votos', text: 'Renovasteis los votos en la ermita delante de todo el pueblo. Lo llama «la boda que no tuvimos», y es verdad.' },
      { when: (s) => f(s).mercheFin === 'cena', text: 'La cena sin móvil de una vez al mes acabó siendo semanal. En su agenda pone «reunión con el accionista principal».' },
      { when: (s) => f(s).mercheFin === 'perdon', text: 'Te perdonó. Lo recuerda cada vez que alguien dice «Marbella» en la mesa.' },
      { when: (s) => f(s).mercheFin === 'despacho', text: 'Volviste del despacho del obrador al cabo de un año. No había cambiado la cerradura, pero lo pensó.' },
      { when: (s) => f(s).mercheFin === 'abogados', text: 'Los abogados se hicieron amigos entre ellos. Vosotros seguís casados, por pereza mutua.' },
      { when: (s) => heir(s) === 'merche', text: 'Heredó la empresa y la vendió en un mes. Ahora da la vuelta al mundo en un crucero y te manda fotos de cada puerto.' },
      { when: (s) => (s.familia ?? 60) >= 70, text: 'Sigue a tu lado y te llama «mi tiburón» con una ironía que nunca pillas.' },
      { text: 'Sigue a tu lado. No sabes muy bien por qué, y ella tampoco.' },
    ],
  },
  {
    who: 'maripili', name: 'Maripili', portrait: 'portrait_empleada_maripili', always: true,
    lines: [
      { when: (s) => s.ending === 'cooperativa', text: 'Preside Sobaos Pasiegos S. Coop.: pagan bien, venden más y en la puerta hay un cartel: «Prohibida la entrada a Manolo».' },
      { when: (s) => heir(s) === 'plantilla', text: 'La plantilla, ya dueña, la eligió presidenta. En la primera junta tachó tu cláusula del testamento con rotulador rojo.' },
      { when: (s) => (f(s).participacionMeses ?? 0) >= 24, text: 'Con la participación de los beneficios se compró un piso en Santander. Te invitó a la inauguración. No fuiste.' },
      { when: (s) => (s.comite?.rotas || []).length > 0, text: 'Todavía tiene tu promesa del convenio fotocopiada en el tablón. Amarillea, pero se lee.' },
      { when: (s) => (s.stats?.huelgas ?? 0) >= 2, text: 'Tiene enmarcadas las fotos de cada huelga en el cuarto de la mantequilla, con la fecha y lo que se consiguió.' },
      { when: (s) => (s.comite?.firmas ?? 0) >= 2 || ['firmado', 'cedido'].includes(f(s).comiteFin), text: 'Firmó contigo varios convenios. Dice que eres el peor jefe que ha tenido y el único que acabó firmando.' },
      { when: (s) => !!s.comite, text: 'Sigue de presidenta del comité. Cada marzo te trae las cuentas del Registro Mercantil subrayadas en fosforito.' },
      { text: 'Se jubiló el mismo día que Conchi, por solidaridad. Sigue pasando por el obrador «a ver qué tal».' },
    ],
  },
  {
    who: 'remedios', name: 'Doña Remedios', portrait: 'portrait_madre', always: true,
    lines: [
      { when: (s) => s.cartilla?.rescatado, text: 'Te salvó del concurso con su cartilla. No lo ha vuelto a mencionar nunca, salvo en todas las comidas familiares.' },
      { when: (s) => f(s).embargado, text: 'Después de embargarte el mostrador le cogió el gusto: ahora vende sobaos los domingos en el mercado de Selaya, y le salen mejor.' },
      { when: (s) => (s.cartilla?.devueltos ?? 0) >= 2, text: 'Presume de hijo en la peluquería: «Me lo devuelve todo, y a tiempo». Sus amigas no se lo creen.' },
      { when: (s) => (s.cartilla?.prestamos ?? 0) >= 1, text: 'Guarda la cartilla en el cajón de la cocina, con tus apuntes subrayados en rojo «por si acaso».' },
      { text: 'Cumplió 89 años y sigue preguntando si a las chicas les pagas bien.' },
    ],
  },
  {
    who: 'vanessa', name: 'Vanessa', portrait: 'portrait_hija_vanessa',
    lines: [
      { when: (s) => heir(s) === 'vanessa', text: 'Heredó la empresa. Lo primero que hizo fue leer las cuentas; lo segundo, llamar a la Inspección para regularizarlo todo.' },
      { when: (s) => f(s).vanessaRival, text: 'Su cooperativa de repostería, montada con tres de tus mejores pasteleras, ya vende más que tu Maison en Santander.' },
      { when: (s) => f(s).vanessaADE, text: 'Terminó ADE y un máster en Derecho Laboral. Trabaja en un fondo que el año pasado intentó comprarte a la baja.' },
      { when: (s) => f(s).vanessaArtista, text: 'Expone en Madrid una serie de cuadros titulada «Sobaos y plusvalía». Uno se llama como tú.' },
      { text: 'Sigue sin saber a qué dedicarse. A su edad tú tampoco lo sabías, pero ya tenías un Audi.' },
    ],
  },
  {
    who: 'jonathan', name: 'Jonathan, tu cuñado', portrait: 'portrait_cunado_jonathan',
    lines: [
      { when: (s) => f(s).jonFinal === 'fianza', text: 'Sigue en libertad gracias a la fianza que pagaste. Dice que te la devolverá «en tokens».' },
      { when: (s) => f(s).jonFinal === 'colabora', text: 'Colaboró con la policía y ahora da charlas en institutos: «Las criptos y yo, una historia de amor tóxica».' },
      { when: (s) => f(s).jonFinal === 'cosme', text: 'Don Cosme le sacó del lío con un recurso de 1987. Desde entonces le lleva el coche a pasar la ITV.' },
      { when: (s) => f(s).jonFinal === 'borra', text: 'Tú borraste los mensajes; él, no. Su móvil sigue en un juzgado de Torrelavega.' },
      { text: 'Sigue vendiendo cosas por internet. Ahora son relojes. «Originales», dice.' },
    ],
  },
  {
    who: 'kevin', name: 'Kevin, tu sobrino', portrait: 'portrait_sobrino_kevin',
    lines: [
      { when: (s) => heir(s) === 'kevin', text: 'Heredó la empresa. La cinta americana sigue siendo su principal herramienta de gestión.' },
      { when: (s) => f(s).kevinJefe, text: 'Fue jefe de mantenimiento «por tu madre». Ahora tiene un canal de bricolaje con 200 suscriptores, todos de la familia.' },
      { when: (s) => f(s).comiteActitud === 'amarillo', text: 'Presidió el comité «de consenso» durante tres semanas. Lo pone en su perfil profesional como «experiencia sindical».' },
      { text: 'Sigue sin oficio fijo. Está «emprendiendo», dice. Te suena de algo.' },
    ],
  },
  {
    who: 'paco', name: 'Paco, tu gestor', portrait: 'portrait_gestor_paco',
    lines: [
      { when: (s) => f(s).pacoSeFue != null, text: 'Se fue a la tercera vez que le culpaste y ahora lleva las cuentas de la cooperativa de Maripili. Te saluda con la cabeza.' },
      { when: (s) => (s.ipo?.descubiertos ?? 0) > 0, text: 'Después de lo del fondo bajista se retiró a escribir sus memorias. Su abogado no le deja publicarlas.' },
      { when: (s) => (s.stats?.auditorias ?? 0) >= 3, text: 'Se jubiló con una úlcera y un archivador por cada auditoría. Los guarda en el trastero, con candado.' },
      { text: 'Sigue llevándote las cuentas. Cada año te cobra un poco más «por el riesgo».' },
    ],
  },
  {
    who: 'marisa', name: 'Marisa, la inspectora', portrait: 'portrait_inspectora_trabajo',
    lines: [
      { when: (s) => (s.stats?.liquidado ?? 0) > 1e6, text: 'La liquidación de Boomerez se estudia en la escuela de inspectores. Lleva tu nombre, mal escrito.' },
      { when: (s) => (s.dossier?.sanciones || []).length >= 2 || (s.stats?.liquidado ?? 0) > 0, text: 'Te visitó tantas veces que la plantilla le guardaba una silla. Se jubiló; tu carpeta, no.' },
      { when: (s) => (s.stats?.inspecciones ?? 0) >= 1, text: 'Nunca te pilló del todo. Te manda una postal cada Navidad: «Sigo vigilando».' },
      { text: 'No llegó a visitarte. Tu expediente está en una pila, debajo de otros ochocientos.' },
    ],
  },
  {
    who: 'fermin', name: 'Don Fermín, de Hacienda', portrait: 'portrait_inspector_hacienda',
    lines: [
      { when: (s) => (s.dossier?.trucos?.anciano ?? 0) > 0, text: 'Todavía cuenta en las cenas lo del «anciano confuso». Tú no te ríes.' },
      { when: (s) => (s.stats?.auditorias ?? 0) >= 2, text: 'Te recuerda con cariño profesional: «Un contribuyente muy creativo, de los que ya no quedan».' },
      { when: (s) => (s.stats?.auditorias ?? 0) >= 1, text: 'Archivó tu caso con una nota a lápiz: «Volver en tres años».' },
      { text: 'No llegó a conocerte. Te tiene apuntado para el año que viene.' },
    ],
  },
  {
    who: 'lucia', name: 'Lucía Ferrer, periodista', portrait: 'portrait_periodista',
    lines: [
      { when: (s) => f(s).prensaFinal === 'comprado', text: 'Dejó el periódico que compraste y fundó La Pasiega Libre, que cada semana publica algo tuyo.' },
      { when: (s) => f(s).prensaFinal === 'querella', text: 'Ganó la querella y el premio de periodismo del año. Te lo dedicó en el discurso.' },
      { when: (s) => f(s).prensaFinal === 'linkedin', text: 'Su reportaje sobre ti es el más leído de su carrera, gracias a que lo compartiste tú en LinkedIn.' },
      { when: (s) => f(s).prensaFinal === 'cara', text: 'Escribió un segundo reportaje: «Boomerez cumple (más o menos)». Es lo más amable que ha escrito de nadie.' },
      { text: 'Sigue detrás de una historia. No sabes si es la tuya.' },
    ],
  },
  {
    who: 'alcalde', name: 'El alcalde', portrait: 'portrait_alcalde',
    lines: [
      { when: (s) => f(s).alcaldeEnemigo, text: 'Dimitió tras tu declaración en la Operación Hojaldre. Ahora es tertuliano en Radio Pas.' },
      { when: (s) => f(s).alcaldeGrabacion, text: 'Sabe que tienes una grabación. Te invita a todas las fiestas, por si acaso.' },
      { when: (s) => f(s).selayaEscuela === 'familias', text: 'Inauguró la escuela de Selaya con doce niños nuevos y una foto contigo que no quería hacerse.' },
      { when: (s) => f(s).alcaldeAmigo, text: 'Sigue siendo tu amigo, que en su caso quiere decir que te sigue cobrando.' },
      { text: 'Sigue en el cargo. Lleva veinte años diciendo que este es su último mandato.' },
    ],
  },
  {
    who: 'cosme', name: 'Don Cosme, el abogado', portrait: 'portrait_abogado_cosme',
    lines: [
      { when: (s) => f(s).hojaldreFin === 'juicio', text: 'Te defendió en el juicio de la Operación Hojaldre con jurisprudencia de 1987. Ganó, y se jubiló invicto.' },
      { when: (s) => f(s).jonFinal === 'cosme', text: 'Sacó a Jonathan del lío y te pasó una factura que tu cuñado aún no sabe que pagaste tú.' },
      { when: (s) => s.perks?.abogado, text: 'Sigue con su berlina de 1994. Cuando le preguntan por ti, se acoge a su derecho a no declarar.' },
      { text: 'Se jubiló sin volver a coger el teléfono. Tu padre era su último cliente.' },
    ],
  },
  {
    who: 'rodrigo', name: 'Rodrigo, el primo argentino', portrait: 'portrait_primo_argentino',
    lines: [
      { when: (s) => f(s).primoSocio, text: 'Se quedó con el 10 % de las empanadas y abrió tres más en Buenos Aires. Te llama «socio» en un tono que no te gusta.' },
      { text: 'Volvió a Argentina. Dice que allí las empanadas «tienen alma».' },
    ],
  },
];

// La carta que Manolo deja a quien venga detrás, como la de Don Anselmo (fragmentos por hito).
export const CARTA = {
  intro: 'Si estás leyendo esto, ya te has metido en algún lío. No pasa nada: yo también me metí en unos cuantos.',
  outro: 'Un sobao al día, y que no se te suba a la cabeza. Bueno, a mí se me subió. Firmado: Manolo.',
  frag: {
    expediente: 'Aprendí que los papeles del juzgado pesan más que los de Hacienda.',
    divorcio: 'Perdí a Merche por estar siempre en el obrador. No hagas lo mismo con quien te aguante.',
    rescate: 'Cuando todo se hundía, me salvó mi madre. Llámala, que no te cuesta nada.',
    embargo: 'Le dije «no tengo, mamá». No se lo digas nunca a la tuya.',
    huelga_general: 'Un día la plantilla paró todo. Tenía razón ella, pero eso no se lo digas a nadie.',
    liquidacion: 'Lo que ahorras en nóminas lo acabas pagando, y con recargo.',
    bolsa: 'Toqué la campana de la Bolsa. Desde entonces, cada trimestre es un examen.',
    maquillaje: 'Maquillé las cuentas una vez. El sobao estaba hueco, y se notó.',
    opa: 'Me comí a la competencia. Luego descubrí que la competencia era lo que me hacía levantarme pronto.',
    convenio: 'Firmé un convenio. No se hundió nada; al contrario.',
    cinco_millones: 'Llegué a los cinco millones y no me sentí distinto. Bueno, un poco sí.',
    susto: 'Un día se me durmió el brazo en la pista de pádel. Hazle caso a la cardióloga.',
    clausula_rota: 'Rompí la cláusula de tu abuelo. Las vacas, para la Cofradía.',
    millon: 'El primer millón es el más difícil. Los demás, también.',
    mama_presta: 'Le pedí dinero a mi madre a los cincuenta y tantos. Me lo apuntó todo en la cartilla.',
    comite: 'Cuando nació el comité pensé que era el fin. Era solo marzo.',
    francia: 'Un verano cerré agosto entero. El mundo siguió girando.',
    navidad5: 'Nunca dejes a la plantilla sin cesta de Navidad. Es más barato que cualquier abogado.',
  },
};
