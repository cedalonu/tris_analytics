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
- Durante una transición, las observaciones se asignan a `transition-watch`; el nuevo régimen solo se aplica desde el concurso de confirmación. No se reasignan retroactivamente los concursos anteriores.
- Si la etiqueta vuelve al último régimen confirmado antes de completar la racha, se marca `return-to-confirmed`; los episodios cortos cerrados se clasifican retrospectivamente como `transient` y los episodios finales incompletos como `unconfirmed-at-end`.
- El reporte separa asignación online de segmentación retrospectiva de episodios; esta última es descriptiva y no simula conocimiento disponible en tiempo real.
- No modifica pronósticos congelados, portafolio, pesos ni ledger; no utiliza APIs, polling ni descargas.

## Phase 22 — duración de episodios, transiciones y sensibilidad
- Calcula duración media, mediana y máxima de episodios observados, cantidad y matriz de transiciones entre etiquetas exactas.
- Compara reglas fijas de confirmación de 2, 3, 4 y 5 etiquetas consecutivas: episodios persistentes/transitorios, transiciones confirmadas, proporción de concursos en observación y retraso mecánico de confirmación.
- La comparación es de sensibilidad, no una búsqueda de parámetro óptimo; no elige un umbral en función de aciertos o resultados.
- Los reportes independiente e integrado incluyen estas métricas; se conservan las limitaciones por ventanas rolling solapadas y dependencia entre etiquetas consecutivas.
- Comando: `npm run research:regime-stability -- [directorio-ledger]`; el flujo integrado también presenta la sensibilidad.
- No calcula p-valores, no modifica pronósticos ni portafolios y no usa APIs, polling ni descargas.

## Phase 24 — estabilidad temporal de perfiles posicionales
- Añade un auditor por bloques fijos, consecutivos y no solapados, anclados al primer concurso etiquetado; el último bloque puede ser parcial.
- Para cada régimen y posición R1–R5 mide por bloque el dígito dominante, su frecuencia, entropía y número efectivo de dígitos.
- Resume cuántos bloques tienen soporte suficiente, la consistencia del dígito dominante frente al perfil agregado del régimen, la variación de la frecuencia dominante y el rango de entropía.
- Clasifica el resultado como estable-dominante, variable-dominance o insuficiente con reglas descriptivas; exige al menos tres bloques con soporte para emitir una clasificación.
- Parámetros configurables: `TRIS_REGIME_POSITION_BLOCK_SIZE` (25 por defecto) y `TRIS_REGIME_POSITION_BLOCK_MIN_SUPPORT` (10 por defecto).
- El análisis se integra en `npm run research:regime-analysis -- <local-Tris.csv> [ledger-directory]`; agrega `positionalStability` al JSON y una tabla al Markdown.
- La consistencia contra el perfil agregado no es validación fuera de muestra; no se calculan p-valores ni se asume independencia entre sorteos.
- No cambia pronósticos congelados, candidatos, pesos, portafolios ni estados del ledger. Sin APIs, polling ni descargas.

## Phase 25 — calibración sintética de estabilidad posicional
- Cinco escenarios: uniforme estacionario, concentración estacionaria, cambio abrupto, cambio gradual y pulso transitorio con retorno.
- Las etiquetas de régimen son exógenas; no se confunden con salidas del clasificador past-only.
- Reporta conteos por posición, tasas por réplica e intervalos Wilson descriptivos para criterios agregados de al menos 4 de 5 posiciones estables o variables.
- Réplicas, longitud, semilla, tamaño de bloque y soporte mínimo configurables; umbrales congelados.
- Comando offline: npm run research:positional-stability-calibration; reportes en reports/positional-stability-calibration/latest.md y .json.
- La consistencia compara con el perfil agregado y no es validación fuera de muestra; posiciones y bloques pueden depender. Pulsos breves pueden pasar inadvertidos.
- No usa CSV real, APIs, polling ni descargas; no modifica candidatos, pronósticos, pesos, portafolios o ledger.

## Phase 26 — contraste de perfiles posicionales entre regímenes
- Compara cada par de regímenes por posición R1–R5: dígito dominante, frecuencia dominante, entropía y distancia Jensen–Shannon.
- Cruza la diferencia entre regímenes con la estabilidad interna por bloques de la fase 24.
- Clasifica descriptivamente como persistent-same-dominant, regime-specific-dominant, distribution-shift, not-established o insufficient, con umbrales fijos y explícitos.
- Integra el resultado en el análisis offline por CSV local; parámetros de soporte, distancia JS y entropía configurables.
- No usa p-valores ni independencia; no demuestra causalidad, sesgo físico o predictibilidad; no modifica pronósticos, candidatos, pesos, portafolios o ledger.
- Sin APIs, polling ni descargas.

## Phase 27 — persistencia y recurrencia de transiciones posicionales
- Reutiliza bloques fijos, consecutivos y no solapados de la fase 24 para seguir el dígito dominante por régimen y posición R1–R5.
- Construye episodios de dominancia; registra duración en bloques y concursos con soporte, cambios de dominante y retornos a dígitos dominantes anteriores.
- Los bloques con soporte insuficiente rompen la secuencia y no se puentean.
- Distingue episodios transitorios/sostenidos y calcula sensibilidad a 1, 2 y 3 bloques consecutivos; no selecciona umbral óptimo.
- Reporta resumen por régimen/posición y agregado por posición; el comando integrado es `npm run research:regime-analysis -- <local-Tris.csv> [ledger-directory]` (alias: `npm run research:positional-transitions -- <local-Tris.csv> [ledger-directory]`).
- Umbral principal configurable mediante `TRIS_POSITIONAL_TRANSITION_MIN_BLOCKS` (2).
- Un retorno es recurrencia descriptiva, no periodicidad. El análisis opera a escala de bloques y puede ocultar cambios intrabloque.
- No modifica pronósticos, candidatos, pesos, portafolios ni ledger. Sin APIs, polling ni descargas.

## Phase 28 — calibración sintética de persistencia de transiciones posicionales
- Evalúa la fase 27 en cinco escenarios diseñados: dominante fijo, pulso de un bloque, cambio sostenido, cambio sostenido con retorno y fluctuación aleatoria.
- Mide alertas sostenidas en escenarios sin cambio/aleatorios, detección y omisión de cambios sostenidos, transiciones medias e intervalos Wilson descriptivos.
- Comando: `npm run research:positional-transition-calibration`.
- Variables: `TRIS_POSITIONAL_TRANSITION_REPS` (500), `TRIS_POSITIONAL_TRANSITION_BLOCKS` (12), `TRIS_POSITIONAL_TRANSITION_SEED` (20261129), `TRIS_POSITIONAL_TRANSITION_MIN_BLOCKS` (2).
- La calibración construye secuencias sintéticas de dominantes por bloque; no simula todos los dígitos dentro de cada sorteo. Cinco posiciones de una réplica pueden depender.
- No optimiza umbrales, no usa CSV real y no demuestra predictibilidad o sesgo físico. CI guarda informes como artefactos.

## Phase 29 — concordancia entre dominancia posicional y dinámica de pools
- Contrasta, por régimen, posición y bloque no solapado, la dominancia posicional observada con pools construidos de forma estrictamente walk-forward.
- Por método y tamaño de pool mide aciertos, referencia k/10, inclusión del dígito dominante observado, Jaccard entre pools consecutivos y rotación de composición.
- Entre bloques calcula correlaciones descriptivas: frecuencia dominante/inclusión del dominante, cambio de dominante/rotación del pool e inclusión/acierto.
- Reporta concordancia positiva, discordancia negativa, resultado mixto o soporte insuficiente; umbrales de correlación ±0.30 son etiquetas descriptivas, no inferencia ni optimización.
- El dominante del bloque es retrospectivo y solo se usa para contraste; cada pool de cada objetivo usa estrictamente concursos anteriores. Los bloques sin soporte no se puentean.
- Integrado en `npm run research:regime-analysis -- <local-Tris.csv> [ledger-directory]`; historia mínima por defecto 30, configurable con `TRIS_POSITIONAL_POOL_MIN_HISTORY`.
- No modifica pronósticos, candidatos, pesos, portafolios ni ledger. Sin APIs, polling ni descargas.

## Phase 30 — estabilidad temporal de la concordancia posicional-pool
- Calcula correlaciones móviles de las tres relaciones descriptivas de fase 29, con ventanas consecutivas y mínimo de pares configurables.
- Omite ventanas que contienen huecos de bloque y resume la persistencia del signo positivo/negativo, correlación absoluta media y clasificación descriptiva.
- Predeterminados: ventana 5 bloques, paso 1, mínimo 3 pares; clasificación consistente exige 70% del signo dominante y al menos 3 correlaciones válidas.
- Integrado en `research:regime-analysis`; añade `positionalPoolTemporalStability` al JSON y Markdown. Variables `TRIS_POSITIONAL_POOL_STABILITY_WINDOW`, `TRIS_POSITIONAL_POOL_STABILITY_STEP`, `TRIS_POSITIONAL_POOL_STABILITY_MIN_PAIRS`.
- Ventanas solapadas no independientes; consistencia de signo no es inferencia ni pronóstico. No modifica ledger, pesos, candidatos ni portafolios. Offline, sin APIs.
- Calibración sintética añadida: escenarios nulo, positivo/negativo persistente, alternante y débil; 500 réplicas predeterminadas. Se integra en CI y publica artefactos JSON/Markdown. Las cifras miden el comportamiento del detector bajo escenarios artificiales, no el azar real de TRIS.
