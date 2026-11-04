# Acceso directo y README visual

**Objetivo:** jugar sin instalar herramientas y presentar el proyecto con pocas instrucciones y más arte.

**Diseño:** enlace web dominante, descarga Windows directa, index.html abierto como archivo redirige al juego público; HTTP/HTTPS y app:// conservan ejecución normal. jugar.bat abre web por defecto, --local mantiene el servidor Python y --help explica ambas rutas. README breve con4escenas,4personajes,4edificios y captura de juego; documentación larga pasa a docs/REFERENCIA.md con enlaces corregidos.

**Evidencia inicial:** README3251palabras/231líneas. Abrir index.html desde file:// no redirige ni puede cargar módulos por CORS. jugar.bat exige Python incluso a quien solo quiere jugar.

**Restricciones:** perfiles reales intactos, sin nuevas dependencias ni imágenes generadas/editadas. Reusar arte existente, mantener guía/técnica accesibles. Publicación y push siguen autorizados por el usuario. No reactivar automatizaciones.

- [x] Preparar README breve/galería y referencia, inspeccionar arte y verificar enlaces.
- [x] Cambiar entradas file:// y bat con ruta local explícita; comprobar ayuda sin abrir navegador del usuario.
- [x] Verificar redirect desde archivo y ejecución HTTP/app, catálogo, pruebas necesarias y portable.
- [ ] Revisión independiente, publicar0.21.6/Pages/Release, comprobar enlaces públicos, actualizar handoff y dejar árbol limpio.

Browser plugin not available; pruebas con Edge/Playwright en perfiles aislados. No pruebas unitarias que reflejen el texto del README o un wrapper de bajo impacto: la comprobación se hace sobre rutas y navegación reales.
