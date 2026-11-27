# Fase 114 — Analizador de coordinación entre posiciones TRIS

Para cada posición se marca cambio cuando su dígito difiere del concurso anterior. En los diez pares se calcula correlación phi a retardos -maxLag..+maxLag. Lag positivo significa que la primera posición antecede a la segunda; lag cero indica coincidencia.

La significancia empírica usa desplazamientos circulares de la segunda serie, preservando su tasa marginal y autocorrelación circular aproximada, pero rompiendo alineación temporal. Los p-valores se ajustan conjuntamente con Benjamini-Hochberg (FDR).

## Uso
`npm run research:positional-coordination -- <local-Tris.csv> <firstTargetDrawId> <lastTargetDrawId> [maxLag=3] [permutations=999] [seed=1142026]`

Ejemplo: `npm run research:positional-coordination -- Tris.csv 5000 6000 3 1999 1142026`

Salidas: `reports/positional-coordination/latest.json` y `latest.md`.

## Límites
La variable es cambio/no cambio, no dirección ni magnitud. El control circular tiene efecto de borde y supone que el desplazamiento es un control razonable. Las asociaciones no demuestran causalidad, no predicen dígitos futuros ni prueban sesgo físico.