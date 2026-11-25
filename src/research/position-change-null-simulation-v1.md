# TRIS — calibración nula y sensibilidad del detector v1.2

## Objetivo
Separar dos preguntas: ¿cuántas falsas alertas aparecen cuando no hay ventaja? y ¿con qué frecuencia se detectan cambios verdaderos definidos de antemano?

## A. Escenarios nulos
- Tasas marginales p: 0.1, 0.2 y 0.5.
- Autocorrelación estacionaria Markov: 0, 0.3 y 0.6.
- Dependencia emparejada candidato-baseline configurable (por defecto 0.5 de resultados idénticos).
- Por defecto: 300 réplicas × 10 series × 9 escenarios = 27,000 series.
- Reporta falsas alertas por serie, persistentes, probabilidad familiar de alerta e intervalo Wilson Monte Carlo.

## B. Alternativas con cambio verdadero
- Cuatro formas: mejora abrupta, deterioro abrupto, mejora gradual y recuperación.
- Por defecto: 300 réplicas por escenario, ocho bloques de 25 concursos, baseline marginal 0.20 y efecto máximo 0.15.
- La probabilidad de acierto del candidato cambia según el escenario; la baseline permanece constante.
- Se reporta detección final, dirección correcta, distribución de estados e intervalo Wilson.
- Latencia: número de bloques desde el primer bloque afectado hasta la primera alerta en la dirección correcta. La recuperación solo cuenta si el estado es `recovery`.
- Los escenarios alternativos se generan con flujos Bernoulli independientes y sin autocorrelación; son un primer banco de sensibilidad, no un modelo real del sorteo.

## Ejecución offline
`npm run research:position-null --`

Variables nulas: `TRIS_NULL_REPS`, `TRIS_NULL_SERIES`, `TRIS_NULL_BLOCKS`, `TRIS_NULL_HIT_RATES`, `TRIS_NULL_SERIAL_CORRELATIONS`, `TRIS_NULL_PAIRED_DEPENDENCE`, `TRIS_NULL_SEED`.

Variables alternativas: `TRIS_ALT_REPS`, `TRIS_ALT_BASELINE_RATE`, `TRIS_ALT_EFFECT_SIZE`, `TRIS_ALT_BLOCKS`.

## Interpretación y límites
Los nulos prueban algunos niveles de dependencia y autocorrelación; las alternativas prueban sensibilidad bajo cuatro formas de cambio, pero no incluyen autocorrelación ni dependencia en la alternativa. No se ajustan umbrales automáticamente. No se utiliza CSV real ni se actualizan los ledgers de evidencia.
