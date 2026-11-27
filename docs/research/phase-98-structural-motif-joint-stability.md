# Fase 98 — Estabilidad estructural conjunta

## Objetivo
Resumir por familia y posición la concordancia retrospectiva entre las fases 95, 96 y 97.

## Entradas
- `reports/structural-motif-temporal-robustness/latest.json`
- `reports/structural-motif-block-bootstrap/latest.json`
- `reports/structural-motif-bootstrap-sensitivity/latest.json`

Los archivos pueden no existir; el runner conserva los grupos de las otras fases y los clasifica como evidencia insuficiente. Las envolturas `{sourceReport, report}` de los runners se interpretan correctamente.

## Regla
La clasificación `consistent-retrospective-support` exige simultáneamente: (1) holdout F95 por encima del control y la interpretación temporal favorable; (2) límite inferior del IC bootstrap F96 por encima de cero; (3) conclusión positiva F97 para todos los tamaños solicitados. Los grupos incompletos se marcan `insufficient-evidence`; los evaluables que no cumplen todo quedan como `mixed-evidence`.

## Ejecución
```bash
npm run research:structural-joint-stability
# Opcional: rutas personalizadas a F95, F96 y F97
npm run research:structural-joint-stability -- path/f95.json path/f96.json path/f97.json
npm run test:research
```

Salida: `reports/structural-motif-joint-stability/latest.json` y `latest.md`.

## Límites
Los informes 95–97 comparten los mismos datos históricos y control aleatorio de Fase94; no son evidencia independiente. La clasificación es retrospectiva y descriptiva, no validación prospectiva, probabilidad futura, causalidad ni recomendación de apuesta. La fase no inventa métricas ni rellena datos ausentes.
