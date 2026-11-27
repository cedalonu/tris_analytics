# Fase 110 — Validador prospectivo de estabilidad TRIS

## Objetivo
Congelar una cohorte de familias/posiciones seleccionadas por el ranking retrospectivo Fase109 y evaluar únicamente concursos posteriores con pronósticos congelados antes del resultado.

## Dos pasos obligatorios
1. Crear/exportar un JSON del informe Fase109 con su objeto `ranking`. Ejecutar `npm run research:structural-prospective-stability -- --freeze <phase109-ranking.json> <local-Tris.csv> [lockedAtISO]`. El lock guarda fecha, último concurso oficial, huella SHA-256 del ranking y filas clasificadas `high-documentary-stability` o `repeated-but-not-conclusive`. Si no hay filas elegibles, no crea cohorte.
2. Tras acumular nuevos pronósticos y resoluciones, ejecutar `npm run research:structural-prospective-stability -- --evaluate <lock.json> <forecasts.jsonl> <results.jsonl> <local-Tris.csv>`.

Los pronósticos deben haber sido congelados después de `lockedAt`, tener historial hasta al menos el corte y apuntar a concursos posteriores. Se exige que el resultado guardado coincida con los cinco dígitos del CSV oficial y que la resolución sea posterior al pronóstico. No se recalculan ni modifican pronósticos.

## Métricas
Por familia/posición se unen los dígitos pronosticados por todos los candidatos congelados del mismo concurso y se comparan con el pool baseline. Se informan tasa de cobertura, diferencia pareada, tamaños medios de pool y ventanas cronológicas. `prospective-advantage-repeated` requiere al menos 30 concursos, tres ventanas de al menos 10 y diferencia positiva en dos o más ventanas. No es significancia estadística.

## Integridad y límites
Los datos faltantes no se imputan. Duplicados, concursos anteriores al corte, resoluciones ausentes, discrepancias oficiales y flags inconsistentes se excluyen y contabilizan. El CSV local debe ser el feed autorizado TRIS y pasar validación sin huecos.

La selección inicial procede de evidencia retrospectiva y conserva posible sesgo de selección. Los concursos pueden ser temporalmente dependientes; no se calculan p-valores. La comparación de pools puede favorecer al de mayor tamaño; por ello se muestran tamaños medios. El proceso no demuestra causalidad, rentabilidad ni capacidad de predecir resultados.

## Archivos
- Motor: `src/research/structural-motif-prospective-stability.ts`
- Runner: `scripts/run-tris-structural-prospective-stability.ts`
- Salidas: `reports/structural-prospective-stability/latest.json` y `.md`
- Lock: `data/prospective/structural-stability-lock.json`
