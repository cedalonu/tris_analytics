# Fase 28 — calibración sintética de persistencia posicional

## Objetivo
Medir el comportamiento del detector de episodios y transiciones de la fase 27 ante secuencias controladas de dominantes por bloque.

## Escenarios
1. Dominante estacionario sin cambios.
2. Cambio breve de un bloque y retorno inmediato.
3. Cambio sostenido desde la mitad de la secuencia.
4. Cambio sostenido en el tercio central y retorno al dominante inicial.
5. Fluctuación aleatoria de dominantes entre 0 y 9.

## Métricas
- Conteos de series régimen/posición (de un total de `réplicas × 5 posiciones`) con cualquier transición, sostenida o transitoria.
- Alertas sostenidas a nivel de réplica: cuenta una alerta si cualquiera de sus cinco posiciones presenta una transición sostenida. Su tasa es familiar por réplica, no una tasa individual por posición.
- Detección y omisión de cambios sostenidos a nivel de réplica.
- Transiciones medias por serie e intervalos Wilson descriptivos para las tasas a nivel de réplica.

## Ejecución
`npm run research:positional-transition-calibration`

Variables: `TRIS_POSITIONAL_TRANSITION_REPS` (500), `TRIS_POSITIONAL_TRANSITION_BLOCKS` (12), `TRIS_POSITIONAL_TRANSITION_SEED` (20261129), `TRIS_POSITIONAL_TRANSITION_MIN_BLOCKS` (2).

## Límites
Los escenarios construyen directamente dominantes de bloque, no sorteos individuales. Los conteos de series se agregan por posición; las alertas falsas y la detección se miden por réplica (cualquier posición), por lo que son métricas familiares. Las cinco posiciones de una réplica pueden depender. Tasas e intervalos son diagnósticos descriptivos. No se optimiza el umbral ni se demuestra predictibilidad, causalidad o sesgo físico. Sin CSV real, APIs, polling ni descargas.
