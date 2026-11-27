# Fase 94 — Control aleatorio emparejado de motivos estructurales

## Propósito

Comprobar si los candidatos vinculados a cuñas o triángulos obtienen una cobertura superior a la de subconjuntos aleatorios de igual tamaño. El control se empareja dentro de cada concurso, familia y posición.

## Entrada y ejecución

Primero se debe regenerar el informe de Fase93 con la versión actualizada del evaluador, que incorpora `candidateEntries` por grupo:

```bash
npm run research:structural-outcome -- <ruta-local-Tris.csv> <directorio-paquetes-JSON> [directorio-ledger]
```

Después:

```bash
npm run research:structural-random-control -- [reports/structural-motif-prospective-outcome/latest.json] [permutaciones>=99] [semilla-entera]
```

Valores predeterminados: 1,999 permutaciones y semilla 940221. La salida se escribe en `reports/structural-motif-random-control/latest.json` y `latest.md`.

## Diseño del control

- Universo: candidatos pronosticados en el mismo targetDrawId, familia y posición.
- Tamaño emparejado: exactamente k, donde k es el número de candidatos estructurales elegibles.
- Muestreo uniforme sin reemplazo mediante Fisher–Yates y PRNG Mulberry32.
- Semilla fija y configurable para reproducibilidad.
- Se excluyen candidatos con forecasts duplicados/ambiguos en el grupo.
- Si k es igual al universo disponible, el grupo no es evaluable porque no hay alternativa aleatoria.
- La variable de resultado es cobertura binaria del token oficial; se conserva también la línea base de los candidatos estructurales.

## Estadística reportada

Por grupo: tasa estructural, media y desviación de cobertura aleatoria, cuantiles 2.5/97.5%, percentil y p-valor empírico unilateral:

`p = (1 + número de controles aleatorios con hits >= hits estructurales) / (B + 1)`.

En el resumen familia/posición se suman los hits de los concursos evaluables y se construye la distribución nula mediante una selección aleatoria emparejada por concurso en cada permutación.

## Límites de interpretación

- Es una prueba exploratoria; no corrige dependencia temporal entre concursos ni selección múltiple entre familias y posiciones.
- Un p-valor pequeño no demuestra causalidad, capacidad predictiva futura ni rentabilidad.
- La cobertura depende del tamaño de los pools y de cómo se definió previamente el universo de candidatos.
- El informe de Fase93 debe contener `candidateEntries`; un reporte antiguo debe regenerarse.
- No se inventan candidatos, predicciones ni resultados oficiales.
