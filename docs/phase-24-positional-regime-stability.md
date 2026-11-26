# Fase 24 — estabilidad temporal de perfiles posicionales

## Objetivo
Comprobar si las concentraciones posicionales observadas dentro de cada régimen se mantienen a través del tiempo o si dependen de unos pocos bloques.

## Método
- Particiona los concursos etiquetados en bloques fijos, consecutivos y no solapados, anclados al primer concurso etiquetado. El último bloque puede ser parcial.
- Para cada régimen y posición R1–R5 calcula, en cada bloque, tamaño de muestra, dígito dominante, frecuencia dominante, entropía de Shannon y dígitos efectivos.
- Resume bloques con soporte suficiente, consistencia del dígito dominante frente al perfil agregado del régimen, rango y desviación estándar de la frecuencia dominante, y rango de entropía.
- Requiere al menos tres bloques con soporte para clasificar una posición como `stable-dominant` o `variable-dominance`; de lo contrario devuelve `insufficient`.
- Los bloques con soporte inferior al mínimo se conservan como `underpowered`, pero no participan en los resúmenes.

## Parámetros
- `TRIS_REGIME_POSITION_BLOCK_SIZE`: 25 concursos por defecto.
- `TRIS_REGIME_POSITION_BLOCK_MIN_SUPPORT`: 10 sorteos por régimen y bloque por defecto.

## Ejecución
`npm run research:regime-analysis -- ./data/Tris.csv [directorio-ledger]`

El reporte `regime-analysis/latest.json` incluye `positionalStability`; `latest.md` presenta la tabla por régimen y posición.

## Interpretación y límites
- La consistencia dominante se calcula contra el dígito dominante del conjunto completo del régimen; por tanto, es una descripción interna y no una validación fuera de muestra.
- Los bloques son no solapados, pero los resultados de sorteos pueden conservar dependencia temporal.
- No se calculan p-valores ni intervalos que presupongan independencia.
- Una concentración estable no demuestra sesgo físico ni capacidad predictiva.
- No se modifican pronósticos congelados, candidatos, pesos, portafolios ni estados del ledger.
- No usa APIs, polling, descargas ni servicios externos; requiere el CSV local suministrado manualmente.
