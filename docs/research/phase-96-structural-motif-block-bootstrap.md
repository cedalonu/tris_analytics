# Fase 96 — Bootstrap por bloques temporales

## Propósito
Estimar la incertidumbre de la diferencia entre la cobertura del pool estructural y la media esperada del control aleatorio emparejado de Fase94, preservando dependencia temporal local.

## Entrada y estimando
Consume las filas por concurso del informe Fase94: `targetDrawId`, `family`, `position`, `structuralHit` y `randomMean`. Para cada fila se define `d = Number(structuralHit) - randomMean`. Se informa la media observada de d, la tasa estructural y la media aleatoria esperada.

## Remuestreo
- Orden cronológico por `targetDrawId`; una sola fila por concurso dentro de cada familia/posición.
- Se separan tramos cuando los IDs no son consecutivos.
- Moving-block bootstrap sin wrap-around: se muestrean bloques contiguos de tamaño configurable (predeterminado 3), nunca cruzando huecos.
- Réplicas predeterminadas: 2,000; semilla determinista.
- Mínimo: max(10, 3 × tamaño de bloque) observaciones elegibles. Los tramos menores que el bloque se excluyen.
- Intervalos percentiles 2.5–97.5, media, mediana, desviación y proporción de réplicas por encima/debajo de cero.

## Interpretación y límites
El intervalo es una aproximación descriptiva, no un p-valor, prueba causal ni garantía predictiva. La entrada contiene la media del control aleatorio por fila, no las permutaciones completas de Fase94; por tanto, las réplicas no reconstruyen incertidumbre del mecanismo aleatorio original. La longitud de bloque puede cambiar el resultado: comparar 3, 5 y 7. La selección múltiple de familias y dependencia temporal de largo alcance siguen siendo riesgos.

## Ejecución
```bash
npm run research:structural-block-bootstrap
npm run research:structural-block-bootstrap -- reports/structural-motif-random-control/latest.json 5 5000 960221
```

Genera `reports/structural-motif-block-bootstrap/latest.json` y `.md`.
