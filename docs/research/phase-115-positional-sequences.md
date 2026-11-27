# Fase 115 — Patrones secuenciales entre posiciones

## Objetivo
Identificar secuencias históricas ordenadas de cambios entre posiciones del TRIS, sus retrasos y su distribución entre bloques temporales.

## Definición
Un evento ocurre cuando el dígito de una posición cambia respecto al concurso inmediatamente anterior. Una secuencia es una lista ordenada de posiciones distintas (longitud 2 a 5). Después de cada evento se busca la primera ocurrencia de la siguiente posición dentro de hasta `maxDelay` concursos. El recuento se ancla en cada evento inicial y puede solaparse.

## Control
Se desplaza circularmente cada serie binaria de posición de forma independiente. Para cada patrón se estima una cola empírica unilateral y se ajusta el conjunto de patrones con Benjamini-Hochberg. Solo los patrones con soporte mínimo entran al ajuste. La división en bloques es descriptiva.

## Ejecución
```bash
npm run research:positional-sequences -- Tris.csv 5000 6000 3 999 1152026 10
```
Genera `reports/positional-sequences/latest.json` y `latest.md`.

## Interpretación y límites
La secuencia detectada describe co-ocurrencia temporal histórica, no causalidad ni anticipación de resultados. Los controles circulares tienen efectos de borde; las ocurrencias pueden solaparse; la selección exploratoria y la multiplicidad no desaparecen por completo con FDR. La persistencia por bloques no es validación prospectiva. El análisis se bloquea ante huecos en el CSV.
