# Expansión y economía — plan de implementación

> Ejecución: superpowers:executing-plans. El usuario elige entregas comprobadas y delega los detalles de equilibrio (24-10-2026).

**Objetivo:** que crecer dependa de cuentas comprensibles, capacidad industrial y mercados diferentes, con más decisiones de inversión.
**Arquitectura:** JavaScript puro, funciones económicas deterministas, estado serializable y módulos de datos separados. Mantener partidas antiguas.
**Tecnologías:** JS, SVG propios para iconos, pruebas Node y navegador; Electron portable.

## Decisiones de diseño
- Franquicias: separar siempre resultado de la central y del franquiciado; el segundo determina cuatro meses consecutivos de pérdidas. No convertir una tienda insolvente en rentable por ocultar su coste.
- Obrador: conservar las tres mejoras existentes; después módulos de +25.000 unidades, desde 650.000 €, cada uno un 32 % más caro, con mantenimiento y valor patrimonial.
- Apertura: índice local basado en el alquiler ya definido para cada ciudad. Referencia Zaragoza = 1; mayor sensibilidad para inmuebles. Los índices son parámetros de juego, no tasaciones reales.
- Diversificación: ningún negocio ajeno a sobaos pierde ventas por falta de estos. Excedentes reales pueden abastecer hasta 250 unidades por negocio y dar hasta +5 % de ingresos; contabilizar producción, personal, materias y transporte. Excluir viviendas y plantas de producción.
- Viviendas: comprables desde el principio; empleados y plazas por ciudad, alquiler social/de mercado/abusivo existente, efectos laborales existentes. No inventar una segunda vivienda vacacional.
- I+D: añadir al menos doce proyectos especializados y un icono SVG distinto por innovación, incluidos los doce existentes. No introducir dependencias para dibujarlos.
- Exterior: seis mercados ficticios con acuerdos de marca blanca (consume capacidad) o licencia de marca (fabricación ajena, royalties). Un acuerdo por país, 24 meses, inversión inicial, auditoría opcional, riesgo mensual y sucesos con decisiones. Cancelar o resolver disputas cambia dinero, reputación y continuidad del contrato.
- Mapa: 50 capitales provinciales más destinos ya presentes, Ceuta y Melilla. Mantener ids antiguos y coordenadas de inserto de Canarias; transporte con coordenadas reales.

## Restricciones y revisión
Conservar arte terminado y campos ajenos del manifiesto. No hacer push. Textos en español. Importar guardados previos sin expansiones ni acuerdos. Revisar demanda, costes sin doble cómputo, contratos que vencen con disputas, ciudades cercanas y navegación móvil.

## Entregas
- [x] 1. Pruebas que reproduzcan confusión de franquicias y advertencias falsas; módulos crecientes, precios locales, excedentes y vivienda local. Ejecutar Node y navegador. Commit local.
- [x] 2. Catálogo I+D de 24+ productos e iconos propios: efectos especializados, límites y guardado. Verificar catálogo y UI móvil. Commit local.
- [x] 3. Acuerdos exteriores: firma, cuentas, capacidad, incidentes, resolución, vencimiento y carga antigua. Probar semillas y botones reales. Commit local.
- [x] 4. Capitales completas, logística insular, mapa y etiquetas. Probar todas las ciudades y partidas completas. Commit local.
- [ ] 5. Revisión independiente, regresiones, balance con bots sin fijar objetivos monetarios antiguos, documentación y portable actualizado con smoke.


## Registro de ejecución
- Primer lote `d576e92`: 190/190 Node y 8/8 DOM; fallaron antes cinco pruebas de economía y dos de presentación. Los snapshots de importes 0.4 se sustituyeron por comprobaciones de contabilidad y precios locales porque el cambio económico es intencionado.
- Exterior y mapa: pruebas iniciales fallaban por módulo ausente y capitales faltantes; después 200/200 Node y 209/209 navegador (incluye DOM).
- Revisión independiente: sin hallazgos importantes. Pulidos los dos detalles menores: nombre de marca licenciado visible y sin atribuir estacionalidad de sobaos a ingresos exteriores contractuales.
- Navegador: Browser plugin not available; Playwright existente con Edge, sin instalar dependencias.
- Decisión: iconos de interfaz SVG propios, 24 ilustraciones distintas. No son imágenes PNG generadas ni cambian el catálogo de arte pendiente.
- Decisión: la vivienda usa plantilla local, evitando que un piso en Madrid cobre alquiler a trabajadores del obrador de Selaya.
- Decisión: actualizar gameVersion de las continuaciones a 0.5.0, conservando originalGameVersion. Así las tablas no mezclan simulaciones con reglas diferentes.

- QA final: 202/202 Node y 10/10 DOM. Antes de añadir las tres últimas regresiones, suite completa 209/209; después 211/211 antes del caso de céntimos, cubierto en el DOM final.
- Clics reales a 1365×900 y 375×812: marca blanca sin auditoría, licencia con auditoría, rescisión, incidente provocado con RNG reproducible, resolución y viaje a Tenerife tras recargar. 24 SVG cargados, cero errores o desbordamiento.
- Doce partidas hasta su final, 1.111 comprobaciones de serialización. Finales: seis Tiburón, tres Pyme, dos Forbes y una bancarrota; no son objetivos de equilibrado, sino evidencia de recorridos completos y guardados válidos.
- Inspección visual: detectado precio unitario redondeado sin céntimos en acuerdos; prueba DOM roja y corrección para mostrar 2,40 €/ud y transporte 0,12 €/ud. Portable regenerado tras corregirlo.
