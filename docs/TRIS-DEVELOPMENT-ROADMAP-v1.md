# TRIS — plan de desarrollo de la Intuición Artificial

Versión 1 · 2026-11-25

## Objetivo
Construir un laboratorio de investigación prospectiva para estudiar regularidades reproducibles en TRIS, sin asumir que un sorteo aleatorio puede predecirse con certeza. Toda afirmación de ventaja debe superar referencias simples y validación cronológica fuera de muestra.

## Restricciones operativas y de datos
- Fuente: CSV suministrado/descargado manualmente por el usuario. No usar APIs, polling, scraping ni descargas automáticas.
- El CSV se actualiza aproximadamente una hora después de cada sorteo individual.
- Horarios CDMX: Medio Día 13:00, De las Tres 15:00, Extra 17:00, De las Siete 19:00 y Clásico 21:00. Actualizaciones aproximadas: 14:00, 16:00, 18:00, 20:00 y 22:00.
- CONCURSO es la única clave de orden y continuidad. ID se ignora completamente.
- R1–R5 conservan siempre su orden. FECHA, PRIMOS y REPETIDOS son auxiliares.
- Procesar cada actualización como oportunidad independiente. No fabricar pronósticos retrospectivos.
- Detenerse ante duplicados, dígitos inválidos, huecos o alteraciones del prefijo histórico.

## Plan por fases

### Fase 0 — Integridad y adaptador de datos
Estado: implementado en la rama de investigación; verificación de ejecución pendiente.
- Importar y validar CONCURSO, R1–R5, fecha, dígitos y continuidad.
- Ignorar ID incluso vacío o no numérico.
- Mantener huella SHA-256 y procedencia.
Criterio de salida: pruebas de importación, casos límite y continuidad ejecutadas correctamente.

### Fase 1 — Investigación descriptiva y pools
Estado: módulos incorporados; pruebas/ejecución pendientes.
- Comportamiento colectivo, diversidad, duplicados, pools y tamaños.
- Evolución y transiciones posicionales para rezagos -1 a -5.
- Memoria temporal/contextual; cambios de régimen y persistencia/reversión.
- Ausencia/retorno tratados como hipótesis, no como números debidos.
Criterio de salida: informes reproducibles con hash y límites estadísticos explícitos.

### Fase 2 — Generación y selección de hipótesis
Estado: módulos incorporados; pruebas/ejecución pendientes.
- Generar candidatos por familias y configuraciones explícitas.
- Separar descubrimiento, validación y holdout cronológicamente.
- Seleccionar solo con datos de descubrimiento.
- Controlar multiplicidad, soporte, dependencia y baselines.
Criterio de salida: protocolo congelado y resultados fuera de muestra reproducibles.

### Fase 3 — Memoria de señales y aprendizaje por ciclos
Estado: motor incorporado; validación técnica pendiente.
- Antes de cada concurso, congelar señales, configuración, posición, predicción, baseline, versión, hora, objetivo y hash del historial previo.
- Resolver solo al aparecer el CONCURSO exacto en el CSV.
- Registrar aciertos/fallos en journals append-only.
- Medir cobertura frente al baseline; no declarar probabilidades calibradas sin probabilidades reales.
- Clasificar evolución en bloques cronológicos; conservar señales debilitadas/retiradas.
- Ejecutar después de cada actualización individual.
Criterio de salida: pruebas de congelación, resolución exacta, integridad, append-only y no-backfill aprobadas; ciclos prospectivos registrados.

### Fase 4 — Memoria posicional y contextual
Estado: análisis incorporado; separación por configuración incorporada; verificación pendiente.
- Separar R1, R2, R3, R4 y R5.
- Mantener señales de resultado completo separadas de señales posicionales.
- Agrupar por familia, configuración exacta y contexto previo congelado (pool y duplicados).
- Promediar primero dentro de cada concurso.
- No mezclar configuraciones ni contar señales correlacionadas como confirmaciones independientes.
Criterio de salida: evidencia prospectiva suficiente por estrato; soporte bajo se etiqueta insuficiente.

### Fase 5 — Detector de cambios de comportamiento por posición (NUEVA ETAPA)
Estado: primera implementación observacional incorporada; ejecución y pruebas automatizadas pendientes.
Propósito: detectar cambios persistentes de una señal en una posición concreta, sin confundir rachas cortas con cambios reales ni transferir evidencia entre R1–R5.

Trabajo previsto e implementado parcialmente:
1. Mantener series separadas por posición × familia × configuración exacta × contexto previo, usando solo outcomes prospectivos resueltos.
2. Comparar bloques recientes con una referencia anterior no solapada; medir diferencia de cobertura frente al baseline, variabilidad entre concursos y error estándar descriptivo.
3. Identificar estados tentativos: estable, mejora, deterioro, cambio persistente, recuperación y evidencia insuficiente.
4. Exigir soporte mínimo, varios bloques consecutivos y zona neutral ajustada por variabilidad (mínimo 2 puntos porcentuales más un umbral de error estándar) para reducir falsas alarmas.
5. Señalar si el cambio afecta una posición o varias; nunca trasladar evidencia de R1 a R2–R5.
6. Probar escenarios sintéticos estables, ruidosos, abruptos, graduales y de recuperación; evaluar después en walk-forward.
7. Inicialmente será observacional: no cambiará predicciones congeladas, pesos, selección ni estado de hipótesis. Cualquier acción adaptativa exigirá validación prospectiva independiente.

Criterio de salida: pruebas sintéticas, pruebas contra leakage y evaluación prospectiva por posición con tasa de falsas alarmas documentada.

### Fase 6 — Concordancia y evaluación integral
Estado: concordancia descriptiva incorporada; evaluación final pendiente.
- Contrastar familias sin promediar señales dependientes.
- Mostrar contradicciones y dependencia de fuentes.
- Comparar con baselines y reportar intervalos/limitaciones.
Criterio de salida: mejora repetida fuera de muestra, con soporte suficiente y sin selección retrospectiva.

## Rutina operativa tras cada actualización
1. El usuario coloca la nueva versión del CSV en la ruta local.
2. Ejecuta validación/sincronización y después el runner de ciclos.
3. El sistema resuelve el pronóstico congelado del concurso recién publicado, si existe.
4. Registra el resultado y prepara el siguiente concurso consecutivo.
5. Si se omitió un concurso, lo marca no evaluado y no lo reconstruye.

Comando principal actual:
npm run research:cycles -- ./data/Tris.csv

## Gobernanza y calidad
- No fusionar ni declarar CI verde mientras TypeScript y todas las pruebas no corran correctamente.
- Cobertura de pool no equivale a probabilidad calibrada ni rentabilidad.
- No afirmar patrones predictivos desde exploración histórica.
- Conservar hipótesis fallidas y resultados negativos.
- El detector por posición es una etapa futura; no se presenta como funcional hasta tener código, tests y validación.

## Estado general
La rama research-core-v1 contiene módulos de análisis, memoria y ciclos. Las pruebas automatizadas y la ejecución integral siguen pendientes de verificación. Esta actualización no analiza resultados reales nuevos ni afirma ventaja predictiva.


### Implementación inicial de Fase 5
- Módulo: `src/research/position-change-detector.ts`.
- Runner offline: `npm run research:position-change -- data/cycles`.
- Fuente exclusiva: `outcomes.jsonl` con resultados prospectivos resueltos.
- Series aisladas por posición, familia, configuración exacta y contexto previo.
- Bloques de 25 concursos únicos, parcial mínimo 10; referencia anterior no solapada y dos bloques recientes.
- Zona neutral ±2 puntos porcentuales; estados descriptivos sin efecto sobre el motor.
- Pruebas sintéticas añadidas; no se consideran aprobadas hasta ejecutarse en CI.


### Refuerzo de validación — Fase 5
- El detector valida JSON de configuración, coincidencia de familia/posición, identidad estable de candidato y unicidad de forecastId y resultado por candidato/concurso.
- Añade desviación estándar entre concursos, error estándar por bloque e intervalo aproximado del 95% para el último bloque.
- El umbral direccional es el máximo entre 2 pp y 1.96 errores estándar combinados; los intervalos son descriptivos y no corrigen autocorrelación ni multiplicidad.
- Pruebas sintéticas ampliadas: estable, abrupto, gradual, pico aislado, recuperación, insuficiencia, separación posicional/configuración y rechazo de duplicados/inconsistencias.
- Estado: implementación ampliada; falta ejecutar pruebas/TypeScript en CI y medir falsas alarmas con simulaciones nulas y datos prospectivos.


### Calibración nula de Fase 5 — primera herramienta incorporada
- Módulo reproducible: `src/research/position-change-null-simulation.ts`.
- Runner offline: `npm run research:position-null --`.
- Ejecuta por defecto 500 réplicas × 25 series × tres tasas marginales idénticas candidato/baseline (0.1, 0.2 y 0.5): 37,500 series sintéticas.
- Reporta falsas alertas por serie, alertas persistentes, probabilidad familiar de al menos una alerta por réplica e intervalo Wilson Monte Carlo.
- Semilla determinista y pruebas de reproducibilidad/validación añadidas.
- Límite: supuesto nulo independiente entre acierto candidato y baseline; no simula autocorrelación ni la dependencia real. Los resultados no se interpretan como tasa real del TRIS y no ajustan automáticamente umbrales.


### Extensión de la simulación nula — dependencia y autocorrelación
- El generador nulo ahora permite persistencia temporal Markov estacionaria (rho 0, 0.3, 0.6) y dependencia emparejada candidato-baseline configurable (mezcla de resultados idénticos).
- El runner evalúa 3 tasas marginales × 3 niveles de autocorrelación; por defecto 300 réplicas × 10 series × 9 escenarios = 27,000 series.
- La tasa marginal de candidato y baseline permanece igual en cada escenario. Se reporta tasa por serie y probabilidad familiar de al menos una alerta por réplica.
- Los escenarios son pruebas de estrés sintéticas, no una simulación calibrada al TRIS real. No ajustan umbrales automáticamente.


### Fase 5 — sensibilidad ante cambios verdaderos
- Se amplió el banco offline con cuatro alternativas: mejora abrupta, deterioro abrupto, mejora gradual y recuperación.
- Se miden detección final, dirección correcta, estados y latencia en bloques desde el inicio del cambio hasta la primera alerta direccional correcta.
- Por defecto: 300 réplicas por escenario, ocho bloques de 25 concursos, baseline 20% y efecto máximo 15 puntos porcentuales.
- La alternativa usa flujos Bernoulli independientes y sin autocorrelación; por tanto, esta etapa mide sensibilidad en escenarios controlados, no generalización al TRIS.
- La calibración nula y la sensibilidad se reportan juntas, pero no se usan para ajustar automáticamente umbrales.


### Fase 5 — estrés de dependencia entre señales (nueva calibración)
- La simulación nula incorpora clústeres de señales con dependencia perfecta intraclúster: todas las series del mismo clúster comparten la misma secuencia candidata; los clústeres distintos tienen secuencias independientes.
- Se combinan tamaños de clúster 1, 5 y 10 con tasas marginales, autocorrelación Markov y dependencia emparejada candidato-baseline.
- El tamaño 1 sirve como referencia independiente entre candidatas; los tamaños mayores son escenarios deliberadamente extremos para observar cómo cambia la probabilidad familiar cuando muchas señales repiten la misma trayectoria.
- El informe distingue la tasa familiar observada en las réplicas de la proyección matemática bajo independencia. No extrapola el escenario de clúster a las 1,095 hipótesis ni afirma que la estructura real del TRIS sea de dependencia perfecta.
- Limitación: esta primera aproximación cubre dependencia por clúster completo, no correlaciones parciales ni redes de solapamiento entre familias, posiciones, ventanas y concursos. La siguiente calibración deberá explorar dependencias parciales/solapadas y contrastarlas con datos prospectivos reales.
- Variables: `TRIS_NULL_CLUSTER_SIZES` controla los tamaños; cada tamaño debe ser menor o igual a `TRIS_NULL_SERIES`.
- No se ajustan automáticamente umbrales ni se consulta ningún API o CSV real.


### Fase 5 — dependencia parcial y solapamiento de señales
- Se amplía la simulación nula: dentro de cada clúster, cada serie toma en cada concurso la secuencia candidata compartida con una fracción configurable y su propia secuencia Markov en el resto.
- Parámetro `sharedSignalOverlap` ∈ [0,1]: 0 usa trayectorias idiosincráticas; 0.5 mezcla mitad decisiones compartidas/mitad propias; 1 reproduce la secuencia común completa. No es un coeficiente de correlación empírica.
- Runner compara por defecto solapamientos 0, 0.5 y 1, junto con clústeres 1, 5 y 10, tasas marginales y autocorrelación. Reporta falsas alertas por serie, probabilidad familiar observada y correlación de Pearson empírica media entre secuencias candidatas del mismo clúster.
- Se añadieron pruebas de determinismo y validación de límites del parámetro; el caso de solapamiento 1 debe medir correlación empírica 1 y el caso parcial debe medir correlación positiva no perfecta.
- Límite: la mezcla puede alterar la autocorrelación temporal efectiva de cada serie; los resultados son escenarios de estrés sintéticos y no estiman dependencias reales entre señales TRIS. No ajusta umbrales automáticamente, no usa CSV real y no llama APIs.
- Siguiente validación: comprobar CI y revisar que la escala de escenarios sea computacionalmente viable; después estudiar solapamiento parcial por subconjuntos de posiciones/ventanas y contrastar con series prospectivas.


### Fase 5 — solapamiento estructurado por componentes
- Nuevo módulo offline: `src/research/structured-signal-overlap.ts`; runner de calibración: `npm run research:position-null --`.
- Cada señal se define mediante un conjunto explícito de componentes (por ejemplo posición, rezago, ventana y contexto). Los componentes compartidos reutilizan trayectorias latentes; los componentes disjuntos no comparten esas trayectorias.
- Para cada par se reportan componentes compartidos, Jaccard, coseno de solapamiento y correlación de Pearson empírica. También se mide la tasa de falsas alertas por señal y la probabilidad familiar observada.
- El runner incluye una pequeña familia de señales sintéticas de ejemplo y contrasta tres tasas marginales y tres niveles de autocorrelación.
- Pruebas cubren componentes disjuntos, componente singleton idéntico (dependencia perfecta), solapamiento parcial, reproducibilidad y entradas inválidas.
- Límite importante: cada señal selecciona un componente latente por sorteo; por ello la estructura de componentes controla dependencia transversal, pero puede modificar la autocorrelación temporal efectiva. Jaccard/coseno son descriptores de diseño, no correlaciones; Pearson es la dependencia medida en la simulación.
- Esta matriz no afirma que las hipótesis TRIS reales compartan componentes ni estima su dependencia real. Para ello se necesitarán series prospectivas congeladas y resultados resueltos. No usa CSV real, APIs, descargas ni ajuste automático de umbrales.


### Fase 5 — grafo de solapamiento del catálogo (2026-11-25)
- Added `src/research/candidate-overlap-graph.ts`, which maps the actual deterministic 1,095-candidate catalog into explicit shared dimensions: positions, lags, transition modes, pool methods, pool sizes, windows and absence thresholds.
- Default family counts are asserted as 30 transition, 25 position-mutation, 40 absence-return and 1,000 pool-ranking candidates.
- The graph reports nominal Jaccard/cosine overlap and shared-component edges. These are structural relationships inferred from frozen candidate configurations, not empirical correlations or evidence that one signal predicts another.
- The offline null report now includes graph size, component frequencies and a small set of strongest nominal edges, while keeping the full graph out of the report artifact to avoid unnecessary size.
- Unit tests cover full-catalog coverage, family counts, shared-position/lag edges and duplicate-ID rejection.
- Next validation must compare graph structure against prospective resolved signal series. No synthetic overlap parameter will be interpreted as a measured TRIS correlation; no thresholds are automatically tuned.


### Fase 5 — matriz de redundancia y diversidad (2026-11-25)
- Added `src/research/candidate-redundancy-matrix.ts` to compare every unordered pair in the deterministic 1,095-candidate catalog (599,265 pairs).
- Structural Jaccard classes are descriptive: highly related >=0.60; partial >=0.25 and <0.60; low overlap >0 and <0.25; disjoint = 0. The report includes family-by-family pair counts, component frequencies, per-candidate nearest neighbors and representative redundant/disjoint pairs.
- Offline command: `npm run research:overlap`; outputs `reports/candidate-overlap/latest.md` and `latest.json`. No CSV input is required because this report describes candidate configurations only.
- Tests verify every unordered pair is accounted for, family matrix totals, threshold metadata and candidate neighbor profiles.
- Critical interpretation: nominally disjoint configurations are not statistically independent; signals can still share draw history, targets and outcome noise. This matrix is not a correlation matrix, does not evaluate hit rates, and must not change candidate weights or betting choices. Empirical dependence requires frozen prospective outcomes.


### Fase 6 — carteras estructurales de hipótesis (2026-11-25)
- Added `src/research/candidate-portfolio-selector.ts` with four reproducible methods: family-balanced round-robin, greedy max-diversity, deliberately redundant control, and seeded random baseline.
- Portfolio sizes default to 10/20/50. The offline runner compares mean pairwise Jaccard/cosine, maximum pairwise Jaccard and unique component coverage; random portfolios use 100 fixed seeds by default.
- Command: `npm run research:candidate-portfolios`; outputs local Markdown/JSON under `reports/candidate-portfolios/`.
- This is strictly a configuration-diversity experiment. It does not evaluate historical TRIS hits, digit coverage, prize return or predictive skill; it does not assign evidence, update weights, or alter forecasts.
- Tests cover determinism, exact portfolio size, family balance, diversity-vs-redundancy behavior, random repeatability and duplicate-ID rejection.
- Next gate: validate candidate signals with a genuinely past-only chronological evaluator and compare against random/simple-frequency baselines with equal ticket budget; freeze all settings before validation and use untouched future outcomes prospectively. No APIs or external result retrieval.
