# Fase 111 — Monitor de degradación y recuperación TRIS

## Objetivo
Comparar capturas acumulativas del informe prospectivo Fase110, conservando el mismo lock y corte histórico. Detecta cambios de estado por familia/posición sin recalibrar ni alterar la cohorte congelada.

## Entrada
Archivo JSONL, una línea por captura:
`{"capturedAt":"2026-11-27T00:00:00Z","report":{...informe completo Fase110...}}`
Las capturas deben tener timestamps estrictamente crecientes y compartir `lock.rankingFingerprint` y `lock.cutoffDrawId`. Deben ser acumulativas; no se debe cargar una ventana móvil como si fuera el total histórico.

## Reglas
- Mínimo predeterminado: 30 concursos por familia/posición.
- Umbral de cambio predeterminado: 5 puntos porcentuales, configurable.
- `degraded`: diferencia candidato-base no positiva o caída al menos igual al umbral respecto de la captura anterior.
- `recovering`: mejora, pero aún no supera cero o no alcanza la recuperación del peor delta por el umbral.
- `recovered`: diferencia positiva y mejora al menos igual al umbral respecto del peor delta elegible observado.
- `stable`: sin caída de umbral; `insufficient`: soporte inferior al mínimo.
- Cada transición queda registrada como evento. La recuperación no borra el evento de degradación previo.

## Uso
`npm run research:structural-degradation-monitor -- snapshots.jsonl`
`npm run research:structural-degradation-monitor -- snapshots.jsonl 40 0.08`

Salidas: `reports/structural-prospective-degradation/latest.json` y `latest.md`.

## Límites
El monitor no recibe ni inventa resultados; solo compara reportes Fase110 previamente generados. La comparación requiere mismo lock/corte, capturas acumulativas y fechas verificables. El umbral es una regla descriptiva, no una prueba estadística. No implica causalidad, predicción ni rentabilidad.
