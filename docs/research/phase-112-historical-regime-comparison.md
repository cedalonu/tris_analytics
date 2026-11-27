# Fase 112 — Comparación de regímenes históricos TRIS

## Propósito
Construir una comparación cronológica de regímenes descriptivos TRIS. Utiliza el clasificador past-only ya existente (ventanas de referencia y recientes) y añade resumen de episodios, transiciones, perfiles posicionales, estabilidad por bloques y contrastes entre regímenes.

## Uso
`npm run research:historical-regime-comparison -- <local-Tris.csv> <firstTargetDrawId> <lastTargetDrawId> [minimumSupport=30]`

Ejemplo: `npm run research:historical-regime-comparison -- Tris.csv 5000 6000 30`

El CSV debe ser la fuente autorizada local, pasar validación y no contener huecos. Los objetivos deben tener historia suficiente para construir ambas ventanas. La salida queda en `reports/historical-regime-comparison/latest.json` y `latest.md`.

## Qué reporta
- Conteo y proporción de etiquetas de régimen.
- Episodios consecutivos, duración y cambios observados.
- Matriz de transición entre etiquetas.
- Perfiles de dígitos por posición dentro de cada régimen.
- Estabilidad de dominancia por bloques no solapados.
- Contrastes entre regímenes por posición con distancia Jensen-Shannon y entropía.
- Cambios de dígito dominante entre bloques.

## Reglas y límites
El clasificador utiliza exclusivamente concursos anteriores al objetivo: por defecto 25 concursos de referencia y 25 recientes. Sus umbrales son explícitos. Los episodios de tres etiquetas o más se denominan persistentes solo como descripción de duración. Las etiquetas rolling se basan en ventanas solapadas, por lo que no son independientes. Soporte limitado se conserva como limitado; no se rellena ni interpreta como ausencia de cambio. Concentración, dispersión y transiciones no son estados latentes verdaderos, causalidad, sesgo físico ni pronósticos. No se optimizan umbrales sobre resultados.
