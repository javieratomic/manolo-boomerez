// Ayuda en cinco páginas (HTML de confianza: no lleva nada que venga de la partida).
export const HELP_PAGES = [
  {
    title: 'Tu primer mes en 4 pasos',
    html: `<p>Cada turno es <b>un mes</b>. Tienes <b>8 años</b> para convertir el obrador de tu padre en un imperio... o en un caso de estudio.</p>
      <ol>
        <li>📍 <b>Pincha en una ciudad grande</b> del mapa y abre tu primera tienda de sobaos. La estimación te dice cuánto ganarías al mes.</li>
        <li>👷 Mira la pestaña <b>Plantilla</b>: debajo de cada política verás qué cambiaría el mes que viene y a 6 meses.</li>
        <li>😎 Elige la <b>acción del mes</b> de Manolo (pestaña Manolo).</li>
        <li>▶ <b>Cierra el mes</b> (botón de abajo o Espacio). El informe te explica qué ha movido el beneficio y qué viene.</li>
      </ol>
      <p>El recuadro del mapa lleva tres carriles de objetivos (🏪 negocio, 👥 equipo y 💶 dinero) y la cláusula del testamento.</p>`,
  },
  {
    title: 'Dinero y obrador',
    html: `<ul>
        <li>🏭 Los sobaos salen del <b>obrador de Selaya</b>. Si no da abasto, mejóralo o abre un obrador regional.</li>
        <li>🤝 Las <b>franquicias</b> dan dinero rápido; si el franquiciado se arruina, viene a pedirte cuentas.</li>
        <li>🔨 <b>Reformas</b>, <b>campañas</b> e <b>I+D</b>: en Mercado y en cada ciudad. Cuantos más negocios, más estructura central.</li>
        <li>🏦 La <b>póliza</b> de la Caja Cantábrica cubre los descubiertos; tres meses sin margen es concurso de acreedores.</li>
        <li>🔔 Con 3 años de cuentas y 4 M€ puedes <b>salir a Bolsa</b>: luego cada trimestre prometes una cifra a los analistas.</li>
      </ul>`,
  },
  {
    title: 'Plantilla, radares y «¿Por qué?»',
    html: `<ul>
        <li>💸 Pagar por debajo del convenio, las horas «voluntarias» y los becarios abaratan costes, pero bajan la moral y encienden el <b>radar de la Inspección</b>.</li>
        <li>🧮 Lo que te ahorras frente al convenio se apunta como <b>deuda latente</b>: si viene Marisa, te liquida los últimos 24 meses (×1,2).</li>
        <li>⚖️ El <b>agravio</b> sube con el beneficio por cabeza. Con 50 personas nace el <b>comité</b>: convenio cada marzo y, si se le toma el pelo, huelga general. Repartir beneficios lo alivia.</li>
        <li>❓ Toca cualquier indicador de arriba (o la variación en el informe) para ver <b>por qué</b> se mueve y el riesgo real del mes.</li>
      </ul>`,
  },
  {
    title: 'La memoria de la casa',
    html: `<ul>
        <li>🔎 <b>Marisa</b> (Trabajo) y 🏛️ <b>Don Fermín</b> (Hacienda) se acuerdan de tus trucos: cada uno funciona peor la segunda vez, y las sanciones recientes agravan la multa.</li>
        <li>🎄 <b>Navidad y agosto</b> recuerdan lo que elegiste otros años. Romper una tradición duele.</li>
        <li>👵 <b>Doña Remedios</b> te presta de su cartilla sin intereses si de verdad lo necesitas, pero siempre con una condición.</li>
        <li>🗂️ En el <b>Archivo</b> están todas las carpetas: lo que saben de ti, tus costumbres, el comité, la cartilla y los analistas.</li>
      </ul>`,
  },
  {
    title: 'Cláusula, semilla y finales',
    html: `<ul>
        <li>📜 Cada partida trae una <b>cláusula del testamento</b>: un reto opcional que multiplica la puntuación si lo cumples al terminar.</li>
        <li>🎲 La <b>semilla</b> reproduce la partida: escribe el código de un amigo en el título o juega el <b>reto de la semana</b>.</li>
        <li>🎂 A los sesenta, Manolo elegirá <b>heredero</b> ante el notario.</li>
        <li>🏁 <b>Finales:</b> concurso de acreedores, Soto del Real, la cooperativa, Pyme con ínfulas, Tiburón Pasiego (5 M€ al acabar) o la revista de millonarios (15 M€). Al final verás qué fue de cada uno.</li>
      </ul>
      <p>⌨️ Atajos: <b>Espacio</b> cierra el mes, <b>1-7</b> cambia de pestaña y <b>1-4</b> elige opción en las cartas.</p>`,
  },
];

// Botones de navegación de una página (para la ventana de ayuda).
export function helpChoices(i) {
  const out = [];
  if (i < HELP_PAGES.length - 1) out.push({ label: 'Siguiente', primary: true, go: i + 1 });
  if (i > 0) out.push({ label: 'Anterior', go: i - 1 });
  out.push({ label: 'Cerrar', go: -1, primary: i === HELP_PAGES.length - 1 });
  return out;
}
