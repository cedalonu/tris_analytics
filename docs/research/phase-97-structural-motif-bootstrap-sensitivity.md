# Fase 97 — Sensibilidad del bootstrap por longitud de bloque

## Objetivo
Comprobar si la lectura descriptiva de Fase96 cambia al remuestrear con bloques temporales de 3, 5 y 7 concursos.

## Método
Para cada familia/posición se ejecuta el mismo moving-block bootstrap de Fase96 sobre las filas de Fase94, con tamaños de bloque configurables (por defecto 3, 5 y 7), 2,000 réplicas por tamaño y semilla reproducible. Cada longitud conserva sus reglas de continuidad y su mínimo max(10, 3 × tamaño del bloque). No se extrapolan ni imputan grupos sin soporte.

## Clasificación
- `robust-positive-across-block-sizes`: todos los intervalos percentiles 95% quedan por encima de cero.
- `robust-negative-across-block-sizes`: todos quedan por debajo de cero.
- `no-clear-separation-across-block-sizes`: todos incluyen cero.
- `sensitive-to-block-size`: las lecturas difieren entre tamaños.
- `incomplete-across-block-sizes`: falta estimación para uno o más tamaños.

## Precauciones
La robustez es solo estabilidad frente a los tamaños probados, no validación predictiva ni confirmación estadística. Los intervalos usan structuralHit menos randomMean y no reconstruyen los controles aleatorios originales ni su incertidumbre. La semilla común facilita reproducibilidad, pero no hace idénticas las muestras entre longitudes. Considerar tamaños alternativos y dependencia de largo alcance.

## Ejecución
```bash
npm run research:structural-bootstrap-sensitivity
npm run research:structural-bootstrap-sensitivity -- reports/structural-motif-random-control/latest.json 3,5,7 5000 970221
```
Salida: `reports/structural-motif-bootstrap-sensitivity/latest.json` y `.md`.
