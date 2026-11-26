# STEPS for Guatemala

Prototipo de **Zircon Data** para la categoría **Tecnológica y ciencias de datos** del Datatón INE 2026. Usa datos públicos del INE para planificar un escenario de la encuesta STEPS sobre factores de riesgo de enfermedades no transmisibles en Guatemala.

## Demo y entregables

- [Prototipo funcional en Vercel](https://steps-guatemala.vercel.app/).
- [Carpeta de entrega en Google Drive para la presentación en PDF y el video demostrativo de 2 a 3 minutos](https://drive.google.com/drive/folders/112g7BPCIlDegsdUwdvPL9RGJEf_vBqNh?usp=sharing).
- [Repositorio GitHub con código fuente, historial y documentación](https://github.com/neworbitx-art/STEPS).

**Equipo Zircon Data** · Gustavo Ramírez, Ana Ramírez, Ana Lemus y Cristian Ramírez.

## Objetivos

El Datatón promueve el uso, análisis y comunicación de las estadísticas oficiales para generar soluciones útiles al INE, facilitar la comprensión de sus datos y fortalecer la colaboración multidisciplinaria. La categoría tecnológica pide un prototipo funcional basado en datos públicos del INE. STEPS for Guatemala aplica ese objetivo a tres decisiones:

1. Estimar y distribuir por territorio las metas de selección, entrevistas, tamizajes y bioquímica a partir de los datos del INE y de supuestos explícitos.
2. Comparar capacidad y demanda por fase para orientar un posible piloto coordinado entre el INE y el MSPAS.
3. Explicar a los hogares cómo podría realizarse la encuesta y permitir al equipo técnico reproducir y compartir escenarios mediante el CSV.

## Problema y usuarios

Planificar STEPS exige traducir una meta estadística en entrevistas, citas, mediciones y cupos por territorio. El simulador permite a los equipos técnicos del INE y del MSPAS comparar esos escenarios con supuestos visibles. El recorrido «Proceso STEPS» explica a los hogares cómo podría desarrollarse la encuesta y qué esperar en cada paso.

## Instalación, ejecución y uso

La demo en línea funciona en un navegador moderno. Para reproducirla localmente, descarga el repositorio o clónalo con Git:

```sh
git clone https://github.com/neworbitx-art/STEPS.git
cd STEPS
```

Abre `index.html` en el navegador. También puedes usar Python 3 para servirlo por HTTP:

```sh
python3 -m http.server 8765
```

Visita `http://localhost:8765/`. En «Vista técnica», selecciona el año y dominio, ajusta los supuestos de cada paso, compara las metas, explora una región y descarga el CSV. En «Proceso STEPS» puedes revisar el recorrido propuesto para los hogares. El [manual del simulador](https://steps-guatemala.vercel.app/manual.html) explica los controles y resultados.

**Dependencias.** El flujo principal usa HTML, CSS y JavaScript nativos y funciona con las cifras incorporadas, sin instalar paquetes ni configurar credenciales. La actualización del cuadro 9 requiere PDF.js desde CDN y el detalle municipal depende de fuentes externas. La demo pública se aloja en **Vercel**. El comando `sh scripts/build-site.sh` reúne el sitio estático en `dist/` para el despliegue.

## Arquitectura y datos

El navegador lee las cifras incorporadas y los supuestos del usuario. El simulador calcula las metas por fase, las distribuye según el dominio elegido y las presenta en el tablero y el CSV. El mapa añade una capa de referencia territorial. El prototipo funciona como sitio estático, sin servidor de aplicación ni base de datos propia.

- `index.html` explica la propuesta, el flujo y la adaptación del paso 2. La portada presenta cuatro escenas: el cañaveral, la explicación de STEPS, la colaboración propuesta entre INE y MSPAS y la metodología interactiva. Los fondos son ilustrativos y se prepararon con asistencia de IA generativa a partir de referencias del proyecto. Las transiciones respetan la preferencia de movimiento reducido.
- `poblacion.html` explica para la población cómo sería la encuesta, qué esperar en cada paso y cómo verificar una visita. `demo.html` contiene el simulador técnico. `assets/planner.js` calcula la muestra, el embudo y la asignación con redondeo por restos mayores. `assets/demo.js` conecta controles, resultados y exportación. El simulador ordena los supuestos y resultados en los tres pasos. El manual de usuario está en `manual.html`.
- `assets/territory.js` contiene los 22 totales departamentales del [Censo 2018 del INE, cuadro A4.1](https://www.ine.gob.gt/sistema/uploads/2021/11/19/202111192139096rGNQ5SfAlepmPGfYTovW9MF6X2turyT.pdf), consultado y transcrito el 25 de noviembre de 2026. Las ocho regiones se agrupan según el artículo 3 del Decreto 70-86.
- `assets/population-projections.js` incorpora los totales nacionales de 2026–2035 y la suma de las edades simples de 18 a 69 años inclusive, según el [cuadro 9 de proyecciones nacionales del INE](https://www.ine.gob.gt/ine/wp-content/uploads/2020/08/01-Metodologia-Nacional.pdf). La copia incorporada se preparó el 25 de noviembre de 2026. El año actualiza la población de referencia y, cuando se especifica una tasa de cobertura, la meta de tamizajes. Se aplica la mayor meta entre cobertura y precisión por dominio. En dominios regionales, la población adulta proyectada se aproxima mediante las proporciones del Censo 2018. El CSV incluye la proyección en la fila nacional y documenta el año en las nueve filas.
- `assets/regional-map.js` contiene los límites de los 22 departamentos de [geoBoundaries GTM ADM1](https://www.geoboundaries.org/api/current/gbOpen/GTM/ADM1/), basados en [OpenStreetMap y Wambacher](https://www.openstreetmap.org/copyright). La geometría proyectada y agrupada se distribuye bajo [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Se usa una proyección equirectangular con paralelo estándar de 15.78° N y se conservan los límites departamentales dentro de cada región.
- `assets/regional-detail.js` encuadra la región y consulta límites de [geoBoundaries GTM ADM2](https://www.geoboundaries.org/api/current/gbOpen/GTM/ADM2/) (CONRED/OCHA, CC BY 3.0 IGO; con un servicio público de respaldo). Asigna los polígonos a las regiones por intersección espacial aproximada con la cartografía del prototipo.
- `assets/health-sites.js` incluye 19 ubicaciones con enlaces a las fuentes que documentan sus coordenadas, con al menos un puesto en cada región. Las vistas regional y departamental muestran conteos y marcadores agrupados de la capa disponible. La vista municipal dibuja marcadores numerados, agrupa los cercanos y amplía la selección con [OpenStreetMap](https://www.openstreetmap.org/copyright) vía Overpass o [Healthsites en HDX](https://data.humdata.org/dataset/guatemala-healthsites). Es una capa de referencia parcial para explorar posibles sedes. El [directorio del MSPAS](https://establecimientosdesalud.mspas.gob.gt/) permite contrastar establecimientos antes de confirmar nivel y capacidad.
- HTML, CSS y JavaScript estándar, sin instalación de dependencias para el flujo principal. La actualización opcional del cuadro 9 carga [PDF.js 4.10.38 (Apache 2.0)](https://github.com/mozilla/pdf.js/blob/v4.10.38/LICENSE) desde CDN. El detalle territorial consulta los servicios públicos indicados, sujetos a su disponibilidad. El prototipo no requiere servicios de pago ni credenciales. La demo, el cálculo y la exportación funcionan con las cifras incorporadas cuando falla la consulta. El panel de fuentes permite cargar el PDF oficial descargado y la actualización se aplica a la sesión. La tipografía Ubuntu Sans se distribuye bajo la [SIL Open Font License](assets/ubuntu-sans-license.txt).
- [Marco STEPS de la OPS](https://www.paho.org/es/documentos/metodo-opsoms-para-vigilancia-factores-riesgo-enfermedades-no-transmisibles-steps) y [manual de la OMS](https://www.who.int/teams/noncommunicable-diseases/surveillance/systems-tools/steps/manuals).

## Metodología del simulador

El cálculo para el paso 2 aplica z² × p × (1−p) × DEFF / d², con z=1.96, dividido por la completitud acumulada esperada de los pasos 1 y 2. Cada entrevista completa genera una cita en el modelo. Los valores iniciales son ilustrativos. Puedes elegir un indicador de diseño de los pasos 1 o 2 y registrar su prevalencia de referencia. La opción conservadora usa p = 0.50, que maximiza p × (1−p) con error y DEFF fijos. El CSV identifica el indicador elegido y el tipo de supuesto de prevalencia. El cotejo de la demo revisa definiciones OPS/OMS, informes y documentación de ENSMI y ENCOVI. Los porcentajes históricos provienen de STEPS 2015 del área metropolitana y se muestran como referencia sin asignarlos al escenario. En dominio nacional, la muestra se reparte proporcionalmente a la población total del Censo 2018. En dominios regionales se exige la misma meta de precisión y completitud por región. Los conteos de cada etapa se redondean y se distribuyen por restos mayores para conservar los totales.

El paso 3 simula invitaciones entre quienes completan el paso 2, cupos proporcionales a la demanda regional y mediciones válidas entre quienes tienen cupo. Se puede deshabilitar. La brecha cuantifica invitaciones proyectadas sin capacidad. Los escenarios son de planificación del paso 2, sin inferencia bioquímica ni diseños de submuestra ejecutados por el software.

## Confidencialidad y uso de IA

El simulador usa datos agregados del territorio y parámetros de planificación. El CSV exporta metas y supuestos del escenario. El prototipo prescinde de registros individuales, cuentas de usuario y credenciales. Las metas son resultados del modelo y las ubicaciones son referencias para planificación.

Se usó ChatGPT como apoyo en redacción, implementación y verificación, y se usó IA generativa para preparar imágenes ilustrativas. El código, los supuestos y las fuentes se pueden revisar en el repositorio.

## Alcance, limitaciones y mejoras

Para un operativo real corresponde validar con el INE la vigencia de la serie de proyecciones, la población objetivo por región y el marco muestral actualizado. Estadísticas Hospitalarias queda como fuente contextual pendiente, con sus propios metadatos. El seguimiento real requiere protocolo conjunto, registro de no respuesta, ponderadores por paso y manejo institucional de datos. El sitio trabaja únicamente con datos territoriales agregados y parámetros de simulación.

La ficha comunitaria para prioridades asistenciales se pactaría por separado con MSPAS. La cooperación propuesta está sujeta a aprobación institucional. La nota conceptual del Datatón define los términos de uso institucional del código y la documentación. Los componentes y datos de terceros conservan sus licencias y atribuciones.

La ficha municipal de Cajolá transcribe los 11 sitios del esquema compartido. El CAP se documenta por separado con el PDM-OT de SEGEPLAN. Los sitios de la ficha sin coordenadas trazables quedan en texto. Los conteos de los niveles superiores corresponden a registros georreferenciados disponibles.

El mapa nacional y los filtros territoriales muestran la selección local desde el inicio. La ampliación usa la capa pública de establecimientos del RMGIR (categorías puesto y centro, consulta paginada), con OpenStreetMap/Healthsites como respaldo regional. Las coordenadas de referencia de Olintepeque quedan en la lista local.

