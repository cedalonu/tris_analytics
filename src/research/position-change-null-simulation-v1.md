# TRIS — simulación nula de falsas alertas v1.1

## Objetivo
Medir la frecuencia de alertas del detector cuando candidato y baseline tienen la misma probabilidad marginal de acierto. No usa CSV real.

## Modelo sintético
- Tasas marginales p por defecto: 0.1, 0.2 y 0.5.
- Autocorrelación estacionaria Markov por defecto: 0, 0.3 y 0.6.
- Dependencia emparejada candidato-baseline: mezcla configurable; por defecto 0.5 de resultados idénticos.
- Los procesos candidato y baseline mantienen la misma tasa marginal p.
- Semilla determinista, 300 réplicas × 10 series × 9 escenarios = 27,000 series por defecto.
- Reporta alertas por serie, alertas persistentes, proporción de réplicas con al menos una alerta e intervalo Wilson Monte Carlo.

## Ejecución offline
`npm run research:position-null --`

Variables opcionales: `TRIS_NULL_REPS`, `TRIS_NULL_SERIES`, `TRIS_NULL_BLOCKS`, `TRIS_NULL_HIT_RATES`, `TRIS_NULL_SERIAL_CORRELATIONS`, `TRIS_NULL_PAIRED_DEPENDENCE`, `TRIS_NULL_SEED`.

## Interpretación y límites
Es una prueba de estrés sintética con dependencia y autocorrelación controladas, no una reproducción del mecanismo real de TRIS. El parámetro Markov es persistencia de cada flujo; la mezcla emparejada genera correlación parcial entre candidato y baseline. No modela todas las formas posibles de dependencia, cambios de régimen ni selección múltiple. No ajustar umbrales automáticamente a partir de este reporte.
