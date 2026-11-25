# Territorio STEPS

Prototipo del Datatón INE 2026 para personal de planificación y supervisión del INE y del MSPAS. Simula una encuesta probabilística de hogares en que el INE ejecuta el paso 1 y cita a los seleccionados. El MSPAS realiza el paso 2 en sus establecimientos y organiza el paso 3 según capacidad.

## Ejecutar

Abre `index.html` en un navegador moderno. También se puede servir este directorio con `python3 -m http.server 8765` y visitar `http://localhost:8765/`. Ambas páginas y la exportación funcionan sin instalación ni red. Para GitHub Pages se puede servir la raíz de la rama que contenga estos archivos.

## Arquitectura y datos

- `index.html` explica la propuesta, el flujo y la adaptación del paso 2. Los dos fondos de la portada son imágenes ilustrativas generadas con IA. Las animaciones se pueden pausar y respetan la preferencia de movimiento reducido.
- `demo.html` contiene el simulador. `assets/planner.js` calcula la muestra, el embudo y la asignación con redondeo por restos mayores. `assets/demo.js` conecta controles, resultados y exportación.
- `assets/territory.js` contiene los 22 totales departamentales del [Censo 2018 del INE, cuadro A4.1](https://www.ine.gob.gt/sistema/uploads/2021/11/19/202111192139096rGNQ5SfAlepmPGfYTovW9MF6X2turyT.pdf), consultado y transcrito el 25 de noviembre de 2026. Las ocho regiones se agrupan según el artículo 3 del Decreto 70-86. El mapa seleccionable en `assets/regional-map.js` usa contornos trazados para la demo, siguiendo la disposición regional de referencia de la [CNEE](https://www.cnee.gob.gt/xhtml/prensa/Presentaciones/Plan_Actualizacion_Normativa_CNEE2.pdf). El volumen es sombreado ilustrativo. Para cartografía de producción se requiere una capa georreferenciada con límites validados.
- HTML, CSS y JavaScript estándar. Sin dependencias de terceros. ChatGPT se usó para asistir en la redacción, implementación y verificación.
- [Marco STEPS de la OPS](https://www.paho.org/es/documentos/metodo-opsoms-para-vigilancia-factores-riesgo-enfermedades-no-transmisibles-steps) y [manual de la OMS](https://www.who.int/teams/noncommunicable-diseases/surveillance/systems-tools/steps/manuals).

## Metodología del simulador

El cálculo para el paso 2 aplica z² × p × (1−p) × DEFF / d², con z=1.96, dividido por la completitud acumulada esperada de los pasos 1 y 2. Cada entrevista completa genera una cita en el modelo. Los valores iniciales son ilustrativos. En dominio nacional, la muestra se reparte proporcionalmente a la población total del Censo 2018. En dominios regionales se exige la misma meta de precisión y completitud por región. Los conteos de cada etapa se redondean y se distribuyen por restos mayores para conservar los totales.

El paso 3 simula invitaciones entre quienes completan el paso 2, cupos proporcionales a la demanda regional y mediciones válidas entre quienes tienen cupo. Se puede deshabilitar. La brecha cuantifica invitaciones proyectadas sin capacidad. Los escenarios son de planificación del paso 2, sin inferencia bioquímica ni diseños de submuestra ejecutados por el software.

## Alcance y mantenimiento

El siguiente corte de datos requiere validar en el INE la población proyectada de 18–69 años y el marco muestral actualizado. Estadísticas Hospitalarias queda como fuente contextual pendiente, con sus propios metadatos. El seguimiento real requiere protocolo conjunto, registro de no respuesta, ponderadores por paso y manejo institucional de datos. El sitio trabaja únicamente con datos territoriales agregados y parámetros de simulación.

La ficha comunitaria para prioridades asistenciales se pactaría por separado con MSPAS. La cooperación propuesta está sujeta a aprobación institucional. Los términos aplicables al código propio se documentarán cuando el INE confirme el alcance de la licencia de uso.
