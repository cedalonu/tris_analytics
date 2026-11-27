# Fase 79 — Resiliencia y recuperación de comunidades

## Objetivo
Seguir las comunidades de la primera ventana a través de ventanas cronológicas y medir continuidad, estabilidad estructural y recuperación tras una perturbación observada.

## Índice
Índice de resiliencia = 0.70 × continuidad Jaccard + 0.30 × estabilidad estructural. La estabilidad estructural es 1 menos el promedio de las diferencias absolutas en cohesión y conductancia, acotado a [0,1].

## Estados
- Resiliente: puntuación final >= 0.75.
- Parcial: puntuación final entre 0.50 y 0.75.
- Frágil: puntuación final inferior a 0.50 sin desaparición de linaje.
- Recuperada: después de un mínimo inferior a 0.75, la puntuación vuelve a >= 0.75 y gana al menos 0.20.
- En deterioro: puntuación final casi igual al mínimo y sin recuperación.
- Sin continuidad: no se encuentra descendiente con Jaccard >= 0.25.

## Límites
Se sigue el descendiente con mayor Jaccard; esto simplifica divisiones y fusiones y no es un modelo completo de linajes. El índice es heurístico, depende del tamaño de ventana y los umbrales, y no demuestra resiliencia causal. Resultados descriptivos, no predictivos.
