# Fase 95 — Robustez temporal y validación fuera de muestra

## Ejecución

La entrada es el informe JSON de Fase94, que contiene resultados emparejados por concurso:

```bash
npm run research:structural-temporal-robustness -- [reports/structural-motif-random-control/latest.json] [bloques>=3] [minimo-por-bloque>=3] [fraccion-holdout]
```

Valores predeterminados: cuatro bloques de entrenamiento, mínimo cinco concursos por bloque y 25% final como holdout cronológico. La salida se escribe en `reports/structural-motif-temporal-robustness/latest.json` y `latest.md`.

## Diseño

- Agrupa por familia y posición, ordena por identificador de concurso y elimina duplicados del mismo concurso.
- Reserva el tramo final de cada serie como holdout; no lo mezcla con los bloques de entrenamiento.
- Divide el tramo inicial en bloques cronológicos y compara la tasa estructural con la media de controles aleatorios emparejados de Fase94.
- Resume la diferencia en puntos porcentuales, cantidad de bloques positivos/negativos y resultado del holdout.
- Solo clasifica como robusto, de forma descriptiva y predefinida, un grupo con holdout positivo y mayoría de bloques de entrenamiento positivos.

## Interpretación

No se realiza ajuste de parámetros en el holdout. Sin embargo, si las familias o hipótesis se seleccionaron tras inspeccionar el historial completo, el holdout deja de ser una validación independiente. Los bloques pueden depender temporalmente entre sí; no se calculan p-valores ni se afirma significación causal. El análisis requiere soporte suficiente y no imputa datos.
