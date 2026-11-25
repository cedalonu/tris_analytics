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
