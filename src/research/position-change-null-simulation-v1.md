# TRIS — simulación nula de falsas alertas v1

## Objetivo
Cuantificar cuántas alertas genera el detector posicional cuando candidato y baseline tienen exactamente la misma probabilidad marginal de acierto. Es una calibración sintética, no un análisis de resultados reales.

## Modelo nulo
- Cada concurso genera un resultado binario del candidato y otro del baseline.
- Ambos se muestrean independientemente con la misma probabilidad `hitRate`.
- No existe ventaja sistemática de candidato sobre baseline.
- Se repite el experimento con semilla reproducible.
- Se informa tasa de cualquier alerta, tasa de alertas persistentes y tasa familiar: proporción de réplicas con al menos una alerta entre varias series.

La independencia entre candidato y baseline es un supuesto explícito; no reproduce necesariamente su dependencia real. Deben añadirse escenarios con dependencia y autocorrelación antes de interpretar el resultado como robustez general.

## Ejecución offline
`npm run research:position-null --`

Parámetros opcionales por variables de entorno: `TRIS_NULL_REPS`, `TRIS_NULL_SERIES`, `TRIS_NULL_BLOCKS`, `TRIS_NULL_HIT_RATE`, `TRIS_NULL_SEED`.

## Interpretación
El intervalo Wilson del 95% cuantifica incertidumbre Monte Carlo para la tasa por serie. La tasa familiar se reporta aparte porque muchas series elevan la probabilidad de al menos una falsa alerta. No se utiliza para cambiar umbrales automáticamente.

## Límites
Simulación sintética reproducible, no evidencia sobre el proceso real de TRIS. No modela autocorrelación, dependencia entre candidatos, cambios de régimen ni selección retrospectiva. Los umbrales solo podrán modificarse tras comparar varios escenarios nulos y prospectivos, con decisiones pre-registradas.
