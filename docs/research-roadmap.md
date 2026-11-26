# TRIS research roadmap — phases 13–15

## Phase 13 — observed prospective family-concordance audit
Compare observed prospective family concordance from frozen local forecasts and resolved outcomes with synthetic null envelopes. This is a descriptive stress comparison, not a p-value or confirmatory test. It uses only the local prospective ledger and never reconstructs missed contests.

## Phase 14 — temporal stability of family concordance
Split the observed prospective horizon into fixed consecutive contest blocks (default 25). For every family pair, report common support, within-block correlation, direction agreement, positive/negative/mixed/underpowered blocks, dispersion, and longest directional runs. Partial final blocks are flagged; missing observations are not imputed. No p-values, automatic promotion, or changes to candidates, weights, forecasts, or ledger. Uses only the local prospective ledger; no APIs.

## Phase 15 — rolling-window prospective concordance
Add overlapping, full-length chronological windows to expose short-term changes that can be hidden by fixed non-overlapping blocks. Window size, step, and minimum common support are configurable. Incomplete trailing windows are omitted; missing family observations are not imputed. Overlapping windows are explicitly treated as dependent descriptive summaries, not independent trials or inferential evidence. No p-values, promotion, or portfolio/forecast changes. Local prospective ledger only; no APIs.

 
## Phase 16 — persistence of individual prospective signals
Evaluate each frozen candidate against its own paired baseline across consecutive, non-overlapping prospective blocks. Report resolved coverage, hit and baseline counts, block differences, positive/negative/neutral/underpowered blocks, directional runs, and a descriptive consistency label. Missed forecasts are not reconstructed; pending and unforecasted opportunities remain separate. Minimum block support is configurable. No p-values, automatic selection, promotion, or weight/portfolio changes. Local prospective ledger only; no APIs.

## Phase 17 — persistencia prospectiva condicionada por régimen
- Desglosa por régimen la persistencia de cada candidato, comparando únicamente sus resultados con su baseline congelado.
- Consume etiquetas de régimen externas en `regime-labels.jsonl`; cada etiqueta incluye método, intervalo histórico y concurso objetivo.
- Impone que `sourceEndDrawId < drawId` para impedir que el régimen use el resultado del propio concurso o información futura.
- Reporta soporte, aciertos, baseline, diferencia, cobertura, pendientes, oportunidades sin pronóstico y estado positivo/negativo/neutro/insuficiente por candidato y régimen.
- No descubre ni optimiza regímenes automáticamente: la calidad del análisis depende de la metodología de etiquetado, que debe quedar documentada y congelada.
- Comando offline: `npm run research:regime-persistence -- [directorio-ledger]`; umbral mediante `TRIS_REGIME_PERSISTENCE_MIN_DRAWS`.
- Formato por línea de `regime-labels.jsonl`: `{"drawId":123,"regimeId":"A","method":"rolling-pool-state-v1","sourceStartDrawId":100,"sourceEndDrawId":122}`. Debe existir exactamente una etiqueta por concurso prospectivo observado.
- No calcula p-valores, no cambia pronósticos, pesos, candidatos, portafolio ni ledger. Sin APIs, polling ni descargas.

## Phase 18 — clasificador determinista de regímenes past-only
- Añade un clasificador que asigna el régimen del concurso objetivo usando exclusivamente los 50 concursos anteriores: 25 de referencia y 25 recientes por defecto.
- Resume distribución de tamaños de pool, tasa de pares duplicados, media de dígitos distintos y entropía posicional media.
- Construye una etiqueta reproducible con umbrales fijos y explícitos: TV de pools 0.20, cambio de duplicados 0.08, cambio de diversidad 0.5 y cambio de entropía 0.35.
- Cada etiqueta conserva método, intervalo de referencia y último concurso usado; el final del historial debe ser estrictamente menor al concurso objetivo.
- Runner offline: `npm run research:regime-labels -- <local-Tris.csv> [directorio-ledger]`. Lee el manifiesto y el último resumen del ledger; genera `regime-labels.jsonl` y `regime-labels-diagnostics.json`.
- Rechaza huecos de concursos, rangos ausentes y warm-up insuficiente; no inventa etiquetas para los primeros concursos sin historia.
- Las etiquetas son descriptivas, no estados verdaderos, no predicciones ni prueba de estructura no aleatoria. No optimiza umbrales retrospectivamente y no altera pronósticos o portafolio.
- Sin APIs, polling ni descargas: el CSV se proporciona manualmente.

## Phase 19 — calibración sintética del clasificador past-only
- Añade escenarios estacionarios con dígitos independientes uniformes y con sesgo fijo, para medir la tasa de etiquetas no estables sin cambio generador.
- Añade un escenario de cambio abrupto de concentración del pool para medir detección con ventanas pasadas de 25 + 25 concursos.
- Reporta tasas, conteos e intervalos Wilson descriptivos; las ventanas consecutivas se solapan, por lo que las observaciones no son independientes.
- Semilla, réplicas y número de objetivos configurables; umbrales del clasificador permanecen congelados.
- Comando offline: `npm run research:regime-calibration`; reporte en `reports/regime-calibration/latest.md` y `.json`.
- No usa CSV real, APIs, polling ni descargas; no estima capacidad predictiva ni ajusta parámetros automáticamente.

## Phase 20 — flujo integrado de análisis prospectivo por régimen
- Añade `npm run research:regime-analysis -- <local-Tris.csv> [ledger-directory]` para validar CSV local, generar etiquetas past-only y ejecutar el auditor de persistencia condicionado por régimen en un solo paso.
- El flujo verifica errores, huecos, identidad del manifiesto y resumen del portafolio; bloquea si no hay suficiente historia o resultados prospectivos resueltos.
- Regenera `regime-labels.jsonl` y diagnósticos desde el mismo CSV cuyo SHA-256 queda registrado en el reporte integral `regime-analysis/latest.md` y `.json`.
- Mantiene pronósticos y resultados congelados; pendientes y oportunidades sin pronóstico siguen separados. No reconstruye concursos omitidos.
- Umbral de soporte mediante `TRIS_REGIME_PERSISTENCE_MIN_DRAWS`; los umbrales del clasificador permanecen congelados.
- No hace llamadas de red, APIs, polling ni descargas. Requiere CSV proporcionado manualmente y ledger prospectivo local.

## Phase 21 — estabilidad temporal y confirmación past-only de regímenes
- Añade una capa de estabilización online sobre las etiquetas past-only. Un régimen nuevo requiere por defecto tres etiquetas consecutivas idénticas para confirmarse.
- Durante una transición, las observaciones se asignan a `transition-watch`; el nuevo régimen solo se aplica desde el concurso de confirmación. No se reasignan retrospectivamente los dos primeros concursos.
- Si la etiqueta vuelve al último régimen confirmado antes de completar la racha, se marca `return-to-confirmed`; los episodios cortos cerrados se clasifican retrospectivamente como `transient` y los episodios finales incompletos como `unconfirmed-at-end`.
- El reporte separa la asignación online (past-only) de la segmentación retrospectiva de episodios. La segunda es descriptiva y nunca debe simular conocimiento disponible en tiempo real.
- El flujo integrado `research:regime-analysis` ahora usa etiquetas estabilizadas para la auditoría prospectiva y agrega tabla de episodios, transiciones confirmadas y fluctuaciones transitorias.
- Comando independiente: `npm run research:regime-stability -- [directorio-ledger]`; parámetro `TRIS_REGIME_MIN_CONSECUTIVE` (por defecto 3, mínimo 2).
- No modifica pronósticos congelados, portafolio, pesos ni ledger; no utiliza APIs, polling ni descargas.
