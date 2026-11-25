# TRIS — calibración nula y sensibilidad del detector v1.6

## Objetivo
Separar dos preguntas: ¿cuántas falsas alertas aparecen cuando no hay ventaja? y ¿con qué frecuencia se detectan cambios verdaderos definidos de antemano?

## A. Escenarios nulos
- Tasas marginales p: 0.1, 0.2 y 0.5.
- Autocorrelación estacionaria Markov: 0, 0.3 y 0.6.
- Dependencia emparejada candidato-baseline configurable (por defecto 0.5 de resultados idénticos). El acoplamiento puede alterar la autocorrelación observada de la baseline; los parámetros describen escenarios de estrés, no una calibración exacta del proceso conjunto.
- Por defecto: 300 réplicas × 10 series × 9 escenarios = 27,000 series. La tasa familiar se calcula sobre 10 series por réplica, no sobre el catálogo completo de 1,095 candidatos.
- Reporta falsas alertas por serie, persistentes, probabilidad familiar de alerta e intervalo Wilson Monte Carlo.

## B. Alternativas con cambio verdadero
- Cuatro formas: mejora abrupta, deterioro abrupto, mejora gradual y recuperación.
- El runner evalúa por defecto tamaños de efecto de 0.10, 0.15, 0.25 y 0.35; cada tamaño se cruza con las cuatro formas.
- Por defecto: 300 réplicas por escenario, ocho bloques de 25 concursos y baseline marginal 0.20. La cuadrícula completa produce 4 tamaños × 4 formas × 300 réplicas = 4,800 series alternativas.
- La probabilidad de acierto del candidato cambia según el escenario; la baseline permanece constante.
- Se reporta detección final, dirección correcta, distribución de estados e intervalo Wilson.
- Latencia: número de bloques desde el inicio de cada forma de cambio hasta la primera alerta en la dirección correcta. Para mejora gradual, el inicio es el cuarto bloque final; para recuperación, el inicio es el penúltimo tramo favorable.
- Se informa `latencyObservations`: número de réplicas que sí generaron una alerta direccional correcta y entraron al cálculo de la mediana. La mediana no incluye réplicas sin detección correcta.
- `detectionRate` cuenta cualquier alerta final (incluida una dirección equivocada); `correctDirectionRate` cuenta únicamente el estado/dirección final esperado. No deben confundirse.
- Los escenarios alternativos se generan con flujos Bernoulli independientes y sin autocorrelación; son un primer banco de sensibilidad, no un modelo real del sorteo.
- `drawsPerBlock` y `blockSize` deben coincidir; el simulador rechaza configuraciones inconsistentes para que el número de bloques simulado sea el que evalúa el detector.

## Ejecución offline
`npm run research:position-null --`

Variables nulas: `TRIS_NULL_REPS`, `TRIS_NULL_SERIES`, `TRIS_NULL_BLOCKS`, `TRIS_NULL_HIT_RATES`, `TRIS_NULL_SERIAL_CORRELATIONS`, `TRIS_NULL_PAIRED_DEPENDENCE`, `TRIS_NULL_SEED`.

Variables alternativas: `TRIS_ALT_REPS`, `TRIS_ALT_BASELINE_RATE`, `TRIS_ALT_EFFECT_SIZES` (lista separada por comas), `TRIS_ALT_BLOCKS`.

## Interpretación y límites
Los nulos prueban algunos niveles de dependencia y autocorrelación; las alternativas prueban sensibilidad bajo cuatro formas de cambio, pero no incluyen autocorrelación ni dependencia en la alternativa. No se ajustan umbrales automáticamente. No se utiliza CSV real ni se actualizan los ledgers de evidencia.

## Lectura de sensibilidad observada en CI
La primera ejecución con efecto 0.15 mostró detección final baja y, en particular, una tasa de clasificación correcta de recuperación muy baja. Por eso el runner amplía el análisis a una cuadrícula de tamaños de efecto. Estos valores siguen siendo sintéticos; no se usan para reajustar automáticamente los umbrales ni para afirmar que el TRIS tenga memoria.


## Resultado tras separar valle y rebote (CI 2026-11-25)
Con la nueva regla de recuperación, la clasificación explícita `recovery` fue 1.67%, 5.67%, 20.00% y 24.67% para tamaños de efecto 0.10, 0.15, 0.25 y 0.35, respectivamente (300 réplicas por escenario). La regla detecta más recuperaciones que la versión anterior, pero sigue clasificando erróneamente muchas como mejora o cambio persistente; no se considera resuelto el problema.

En los escenarios nulos con p=0.20, la tasa de falsas alertas por serie fue 5.63%, 9.50% y 14.80% con autocorrelación 0, 0.3 y 0.6. La probabilidad de al menos una alerta entre 10 series fue 42.00%, 64.00% y 80.67%. Esto confirma que el detector no debe usarse para seleccionar automáticamente señales sin una calibración de multiplicidad y dependencia más completa.


## Proyección de multiplicidad bajo independencia
El runner proyecta la probabilidad de al menos una falsa alerta para familias de 10, 50, 250 y 1,095 señales mediante la fórmula 1-(1-p)^m, donde p es la tasa de falsa alerta por serie observada y m el tamaño de la familia. Los intervalos Wilson por serie se transforman con la misma función monótona.

Esta proyección es una referencia matemática bajo independencia, no una estimación del sistema real: las señales pueden compartir sorteos, dígitos, ventanas, configuraciones y datos, por lo que no son independientes. La siguiente calibración debe simular dependencia entre señales y comparar los resultados con esta referencia. No se aplican correcciones automáticas ni se cambia el umbral del detector.
