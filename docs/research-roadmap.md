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


## Phase 31 — sensibilidad de parámetros de estabilidad temporal posicional-pool
- Añade una cuadrícula predefinida para comparar ventanas de 5, 8 y 10 bloques, pasos de 1, media ventana y ventana completa, y consistencia de signo de 70% y 80%.
- Reporta falsas alertas en escenarios nulo y alternante, detección de asociaciones positivas/negativas persistentes y estabilidad aparente en una asociación débil.
- Comando offline: `npm run research:positional-pool-sensitivity`; reporte en `reports/positional-pool-temporal-sensitivity/latest.md` y `.json`.
- Réplicas, tamaños de ventana, pasos, umbrales y semilla son configurables por variables `TRIS_POSITIONAL_POOL_SENSITIVITY_*`. No selecciona automáticamente una configuración ni modifica umbrales de producción.
- Las tasas son específicas de escenarios sintéticos; la cuadrícula no es una prueba inferencial ni estima falsas alertas reales. No utiliza CSV real, APIs, polling ni descargas; no altera pronósticos, candidatos, pesos, portafolios o ledger.


## Phase 32 — controles nulos de igual soporte para concordancia posicional-pool
- Para cada régimen, posición, método y tamaño de pool, calcula las tres correlaciones observadas y las compara con controles por permutación de la segunda variable dentro del mismo grupo y métrica.
- Cada permutación conserva exactamente el soporte y la distribución marginal de ambas variables; destruye su emparejamiento temporal. Informa media, desviación, percentiles 2.5/50/97.5, excedencias y tasa de cola empírica con corrección +1.
- Comando offline: `npm run research:positional-pool-null-controls -- ./data/prospective-portfolio/regime-analysis/latest.json`; requiere ejecutar antes `research:regime-analysis` con el CSV local.
- Configuración: `TRIS_POSITIONAL_POOL_NULL_REPS` (999), `TRIS_POSITIONAL_POOL_NULL_MIN_PAIRS` (3), `TRIS_POSITIONAL_POOL_NULL_SEED` (20261202).
- La permutación no conserva autocorrelación; es un control de asociación sin emparejar, no un nulo temporal completo ni una prueba confirmatoria. La multiplicidad no se corrige y no hay selección automática.
- No usa APIs, polling ni descargas; no modifica pronósticos, candidatos, pesos, portafolios ni ledger.


## Phase 33 — controles nulos con desplazamiento circular temporal
- Complementa fase 32 con desplazamientos circulares no nulos del segundo vector dentro de cada serie régimen/posición/método/tamaño; conserva exactamente sus valores y orden cíclico, rompiendo la alineación con el primer vector.
- Solo evalúa pares completos en bloques consecutivos; los grupos con huecos se marcan `non-contiguous-blocks`, sin interpolar ni puentear.
- Reporta correlación observada, media/desviación/percentiles de la distribución desplazada, excedencias y tasa empírica de cola (+1).
- Comando: `npm run research:positional-pool-circular-shift -- ./data/prospective-portfolio/regime-analysis/latest.json`. Requiere antes `research:regime-analysis` con CSV local.
- Configuración: `TRIS_POSITIONAL_POOL_SHIFT_REPS` (999), `TRIS_POSITIONAL_POOL_SHIFT_MIN_PAIRS` (5), `TRIS_POSITIONAL_POOL_SHIFT_SEED` (20261203).
- Conserva secuencia cíclica pero crea una unión artificial entre extremos; presupone comparabilidad aproximada de desplazamientos y puede ser inadecuado ante tendencias/cambios de régimen. Diagnóstico exploratorio, no p-valor confirmatorio ni corrección de multiplicidad.
- Debe interpretarse junto con la permutación de fase 32. No cambia pronósticos, candidatos, pesos, portafolios o ledger; sin APIs, polling ni descargas.


## Phase 34 — comparación conjunta de controles nulos
- Cruza los resultados de fases 32 y 33 por régimen, posición, método, tamaño de pool y métrica.
- Solo compara cuando ambos informes tienen grupo y métrica, soporte idéntico, correlación observada coincidente y el desplazamiento circular está evaluado. No empareja ni interpola grupos ausentes.
- Clasifica descriptivamente si la correlación observada queda fuera de las envolventes percentiles 2.5–97.5 de ambos controles, solo uno, de ninguno o si no es comparable.
- Muestra las tasas de cola Monte Carlo de cada control por separado; no las combina ni las denomina p-valores.
- Comando offline: `npm run research:positional-pool-null-comparison -- [reporte-fase32.json] [reporte-fase33.json]`; predeterminados: `reports/positional-pool-null-controls/latest.json` y `reports/positional-pool-circular-shift/latest.json`.
- Reportes en `reports/positional-pool-null-comparison/latest.json` y `.md`.
- Las envolventes son referencias exploratorias, no intervalos de confianza ni pruebas de significancia. No corrige multiplicidad ni selecciona señales; no modifica pronósticos, candidatos, pesos, portafolios o ledger.
- Usa exclusivamente los reportes locales derivados del CSV manual; sin APIs, polling ni descargas.


## Phase 35 — robustez de concordancias mediante división cronológica
- Divide las observaciones completas de cada grupo régimen/posición/método/tamaño en orden temporal: primera mitad para descubrimiento descriptivo y segunda mitad para validación descriptiva.
- Calcula por separado las tres correlaciones de fase 29: dominancia/inclusión, cambio dominante/rotación e inclusión/acierto.
- Clasifica si la asociación supera el umbral absoluto fijo en ambas mitades y conserva signo, aparece solo en descubrimiento, solo en validación, cambia de dirección, queda debajo del umbral en ambas o carece de soporte.
- No baraja bloques, no imputa observaciones y conserva los índices de inicio/fin de cada mitad. Mínimo predeterminado: 3 pares completos por mitad; umbral descriptivo: |r| ≥ 0.30.
- Comando offline: `npm run research:positional-pool-temporal-split -- [reporte-regime-analysis.json]`; predeterminado: `data/prospective-portfolio/regime-analysis/latest.json`.
- Variables: `TRIS_POSITIONAL_POOL_SPLIT_MIN_PAIRS` y `TRIS_POSITIONAL_POOL_SPLIT_MIN_CORRELATION`. Reportes en `reports/positional-pool-temporal-split/latest.json` y `.md`.
- La segunda mitad es temporalmente posterior, pero no es un conjunto externo independiente ni validación prospectiva de pronósticos. Las variables de dominancia del bloque son retrospectivas y no están disponibles al inicio de cada bloque.
- No calcula p-valores, no corrige multiplicidad, no elige métodos y no modifica pronósticos, candidatos, pesos, portafolios o ledger. Solo usa reportes locales derivados del CSV manual; sin APIs, polling ni descargas.


## Phase 36 — sensibilidad de concordancia al tamaño del bloque
- Reconstruye desde los sorteos y etiquetas originales los bloques no solapados a escalas predefinidas de 10, 15, 25 y 40 concursos; todos quedan anclados al primer concurso etiquetado.
- Para cada escala vuelve a calcular la dominancia posicional y la concordancia con pools estrictamente past-only; no compara bloques agregados incompatibles ni reutiliza límites de otra escala.
- Compara las tres correlaciones descriptivas de fases 29–35 por régimen, posición, método y tamaño de pool. Clasifica dirección positiva/negativa común a todas las escalas, dirección mixta, soporte solo parcial o insuficiente.
- Integrado en `npm run research:regime-analysis -- <local-Tris.csv> [ledger-directory]`; añade `positionalPoolScaleSensitivity` al JSON y una tabla al Markdown.
- Escalas configurables mediante `TRIS_POSITIONAL_POOL_BLOCK_SIZES` (10,15,25,40); soporte mínimo mediante `TRIS_POSITIONAL_POOL_BLOCK_MIN_SUPPORT` (10). Historia mínima de pool reutiliza `TRIS_POSITIONAL_POOL_MIN_HISTORY`.
- Las escalas comparten los mismos sorteos y no son réplicas independientes. La concordancia de signo no es inferencia; no hay p-valores ni corrección de multiplicidad y no se selecciona una escala ganadora.
- No modifica pronósticos, candidatos, pesos, portafolios o ledger. Usa CSV local manual; sin APIs, polling ni descargas.


## Phase 37 — sensibilidad al origen de los bloques
- Extiende el resumen de estabilidad posicional con `blockOffset`, que desplaza límites de bloques sin alterar su tamaño; los extremos parciales se conservan y el soporte insuficiente se marca.
- Con tamaño fijo predeterminado de 25 concursos, reconstruye la estabilidad y la concordancia posicional-pool para offsets 0, 6, 12 y 18. Cada offset se aplica desde el primer concurso etiquetado; no se optimiza según los resultados.
- Compara las tres correlaciones por régimen, posición, método y tamaño de pool; clasifica dirección común, mixta, soporte parcial o insuficiente.
- Integrado en `npm run research:regime-analysis -- <local-Tris.csv> [ledger-directory]`; añade `positionalPoolOriginSensitivity` al JSON y tabla al Markdown.
- Configuración: `TRIS_POSITIONAL_POOL_ORIGIN_BLOCK_SIZE` (25) y `TRIS_POSITIONAL_POOL_BLOCK_OFFSETS` (0,6,12,18). Reutiliza historia mínima y soporte mínimo de las fases anteriores.
- Los offsets se solapan sustancialmente y no son réplicas independientes. No hay p-valores ni corrección por comparaciones múltiples. La estabilidad no implica predictibilidad.
- No modifica forecasts, candidatos, pesos, portafolios ni ledger. CSV local manual; sin APIs, polling ni descargas.


## Fase 38 — robustez conjunta de tamaño y origen
- Cruza los grupos comparables de las fases 36 y 37 por régimen, posición, método, tamaño de pool y métrica.
- Solo clasifica robustez positiva/negativa cuando la dirección se conserva en todas las escalas y todos los offsets predeclarados.
- Distingue conflicto de dirección entre dimensiones, sensibilidad a escala/origen y soporte insuficiente; no imputa claves ausentes.
- Se integra en `research:regime-analysis`, con resumen y detalle en JSON/Markdown.
- Las configuraciones reutilizan los mismos sorteos y bloques solapados; no son réplicas independientes ni evidencia inferencial. No combina p-valores ni corrige multiplicidad.
- No cambia pronósticos, candidatos, pesos, portafolios o ledger; CSV local manual, sin APIs, polling ni descargas.

## Fase 39 — sensibilidad a ventanas temporales
- Recalcula la estabilidad temporal de fase 30 para ventanas predeclaradas de 5, 8 y 10 bloques; el paso es la mitad de cada ventana (mínimo 1).
- Reporta conteos de grupos positivos, negativos, inestables e insuficientes por configuración; no selecciona la ventana con más resultados positivos.
- Configuración: `TRIS_POSITIONAL_POOL_WINDOW_SIZES` (5,8,10) y `TRIS_POSITIONAL_POOL_WINDOW_MIN_PAIRS` (3).
- Las ventanas se solapan y comparten observaciones; los conteos son descriptivos, no tasas de error reales ni validación prospectiva.
- No modifica pronósticos, candidatos, pesos, portafolios o ledger; sin APIs, polling ni descargas.

## Fase 40 — sensibilidad a historia y soporte mínimo
- Recalcula la concordancia de fase 29 en una cuadrícula de historia previa mínima (20, 30, 50 sorteos) y soporte mínimo de bloque (5, 10, 15).
- Informa por combinación cuántas correlaciones se calculan, sus signos y cuántas quedan no calculables; no rellena ni interpola.
- Configuración: `TRIS_POSITIONAL_POOL_MIN_HISTORIES` (20,30,50), `TRIS_POSITIONAL_POOL_MIN_SUPPORT_GRID` (5,10,15), tamaño fijo `TRIS_POSITIONAL_POOL_ORIGIN_BLOCK_SIZE` (25).
- Los cambios de umbral alteran la cobertura y no crean muestras independientes. La estabilidad de signo no implica inferencia ni capacidad predictiva.
- No modifica pronósticos, candidatos, pesos, portafolios o ledger; CSV local manual, sin APIs, polling ni descargas.


## Fase 41 — auditoría estructural del ledger prospectivo
- Añade una auditoría de solo lectura para los archivos locales `forecasts.jsonl` y `results.jsonl`; nunca reescribe ni repara registros.
- Comprueba identidades duplicadas, más de un pronóstico por candidato/concurso, secuencia objetivo = historial + 1, huellas SHA-256, pools de dígitos, resoluciones huérfanas o duplicadas y conservación exacta de todos los campos congelados al resolver.
- Comprueba formato de resultado real y cronología de timestamps generación/resolución. Resume cobertura, concursos pendientes y resolución por concurso; separa advertencias de errores estructurales.
- Comando offline: `npm run research:prospective-audit -- [directorio-ledger]`; predeterminado `data/prospective`. Reportes de solo lectura en `reports/prospective-ledger-audit/latest.json` y `latest.md`.
- No reconstruye pronósticos omitidos, no recalcula aciertos desde configuraciones históricas, no altera el ledger, no selecciona señales ni modifica pesos/portafolios. Si el CSV solo contiene fecha sin hora oficial, no puede certificar que el pronóstico se generó antes del sorteo.
- No usa APIs, polling, descargas ni fuentes externas.


## Phase 42 — auditoría de cobertura prospectiva por concurso

- Nuevo módulo `src/research/prospective-coverage-audit.ts`, pruebas y runner `scripts/run-tris-prospective-coverage.ts`.
- Comando: `npm run research:prospective-coverage -- ./data/Tris.csv [directorio-ledger]`.
- Usa únicamente el CSV local que el usuario suministra manualmente y los ledgers locales `forecasts.jsonl` / `results.jsonl`; no consulta APIs, no descarga datos y no realiza polling.
- Audita todos los concursos desde el primer objetivo congelado hasta el último concurso observado (incluye objetivos futuros que ya tengan pronóstico).
- Distingue: concurso sin registro de pronóstico, pronóstico pendiente, resultado presente sin resolución, concurso resuelto y objetivo todavía no observado.
- Calcula cobertura por concursos observados, cantidad de huecos, pendientes y resolución incompleta. Los huecos no se rellenan ni se les atribuye una causa.
- Es una auditoría de presencia/cobertura, no una métrica de precisión ni evidencia de predictibilidad. Es de solo lectura y no modifica el ledger ni crea pronósticos retrospectivos.
- Reportes: `reports/prospective-coverage/latest.json` y `latest.md` (locales, ignorados por Git).


## Fase 43 — desempeño prospectivo por modalidad y configuración
- Se agrega `src/research/prospective-performance.ts`, pruebas y `scripts/run-tris-prospective-performance.ts`.
- Resume únicamente pronósticos congelados y sus resoluciones locales; no recalcula ni modifica el ledger.
- Agrupa por familia y configuración congelada exacta, evitando mezclar posiciones, modalidades, métodos, tamaños de pool o ventanas distintas.
- Por grupo informa N resuelto/pendiente, aciertos del candidato y de la línea base, intervalos Wilson del 95%, victorias exclusivas del candidato, victorias exclusivas de la base, empates y diferencia pareada.
- Los IDs duplicados y las resoluciones duplicadas/no coincidentes se reportan; se evita contar dos veces el mismo ID de pronóstico.
- Los intervalos y diferencias son descriptivos: no corrigen dependencia temporal ni multiplicidad, no prueban predictibilidad y no promueven candidatos.
- Comando local: `npm run research:prospective-performance -- [directorio-ledger]`; lee `forecasts.jsonl` y `results.jsonl` (por defecto `data/prospective`) y escribe `reports/prospective-performance/latest.json` y `.md`.
- Sin APIs, consultas externas, descargas, polling, reconstrucción retroactiva ni cambios al ledger.


## Fase 44 — estabilidad temporal del desempeño prospectivo
- Se agrega `src/research/prospective-performance-stability.ts`, pruebas y `scripts/run-tris-prospective-performance-stability.ts`.
- Evalúa ventanas cronológicas fijas de 20 concursos, ancladas al primer concurso objetivo presente en el ledger; conserva también ventanas sin resoluciones.
- Mantiene grupos separados por familia y configuración congelada exactas.
- Por ventana calcula soporte, tasas de acierto, victorias pareadas exclusivas, empates y diferencia pareada candidato menos línea base.
- Clasifica cada configuración como desempeño consistentemente positivo/negativo, dirección mixta, sin ventaja direccional o evidencia insuficiente; requiere al menos 5 resoluciones por ventana y 3 ventanas evaluables por defecto.
- No interpola sorteos, no rellena ventanas, no selecciona periodos por resultados y no altera pronósticos ni resoluciones.
- Comando local: `npm run research:prospective-performance-stability -- [directorio-ledger]`; escribe `reports/prospective-performance-stability/latest.json` y `.md`.
- La estabilidad es descriptiva, no prueba predictibilidad; no corrige multiplicidad ni dependencia temporal.
- Sin APIs, descargas, polling ni acceso a fuentes externas.


## Fase 45 — sensibilidad temporal del desempeño prospectivo
- Añade `src/research/prospective-performance-sensitivity.ts`, pruebas y runner local `scripts/run-tris-prospective-performance-sensitivity.ts`.
- Evalúa una cuadrícula predefinida de ventanas de 10, 20, 30 y 40 concursos; soportes mínimos de 3, 5 y 10 resoluciones por ventana; y desplazamientos del origen de 0%, 25% y 50% de cada ventana.
- Cada combinación vuelve a evaluar las mismas previsiones congeladas y sus resoluciones válidas; conserva ventanas vacías y soportes insuficientes. No imputa, no reconstruye ni altera el ledger.
- Extiende la fase 44 para desplazar el origen sin descartar concursos iniciales; los intervalos previos al nuevo origen se conservan como ventanas parciales de la misma longitud.
- Una conclusión robusta positiva/negativa/sin ventaja exige acuerdo en todas las combinaciones con soporte suficiente; cualquier desacuerdo o soporte parcial se marca sensible a parámetros. Sin soporte se marca evidencia insuficiente.
- Comando offline: `npm run research:prospective-performance-sensitivity -- [directorio-ledger]`; lee `forecasts.jsonl` y `results.jsonl`, por defecto `data/prospective`.
- Reportes locales: `reports/prospective-performance-sensitivity/latest.json` y `latest.md`.
- Las configuraciones resegmentan los mismos sorteos y no son muestras independientes. Es un análisis descriptivo, no prueba predictibilidad ni corrige multiplicidad/dependencia temporal. Sin APIs, polling, descargas o fuentes externas.
