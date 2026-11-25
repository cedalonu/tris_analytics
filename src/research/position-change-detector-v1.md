# TRIS — detector de cambios por posición v1.1

## Fuente y controles de integridad
El detector consume exclusivamente `ResolvedCycleSignal` de `outcomes.jsonl`. Valida el JSON de configuración congelada, correspondencia familia/posición, identidad estable de cada candidato, campos booleanos de acierto e identificadores únicos de resultado y pronóstico. Los registros de transición de resultado completo se excluyen del análisis posicional.

## Unidad de análisis
Cada serie se aísla por posición R1–R5, familia, configuración congelada exacta, régimen de pool del sorteo anterior y régimen de duplicados del sorteo anterior. No se comparte evidencia entre estratos.

## Método
1. Ordenar por número de concurso objetivo.
2. Promediar los resultados de los candidatos dentro de cada concurso, para que cada concurso tenga el mismo peso.
3. Formar bloques cronológicos no solapados de 25 concursos observados; aceptar el último bloque solo con al menos 10.
4. Calcular ventaja emparejada = tasa de acierto de candidatos − tasa de acierto de baseline.
5. Calcular desviación estándar entre concursos y error estándar por bloque.
6. Usar los bloques anteriores a los dos más recientes como referencia. Umbral direccional: máximo entre 2 puntos porcentuales y 1.96 errores estándar combinados.
7. Mostrar intervalo aproximado de 95% para el último bloque.

## Detección específica de recuperación v1.2
La recuperación se evalúa con tres fases explícitas cuando hay al menos seis bloques: referencia inicial, valle de dos bloques y rebote de dos bloques. Ambos bloques del valle deben quedar por debajo de la referencia inicial y ambos bloques finales deben rebotar por encima del valle, usando umbrales que combinan el piso de 2 pp y errores estándar descriptivos. Se permite recuperación parcial: no exige haber regresado completamente al nivel inicial. Un pico aislado no basta. Esta regla reduce la dependencia de una referencia contaminada por el propio valle, pero sigue siendo descriptiva y requiere calibración nula específica.

## Estados
- `insufficient-data`: menos de dos bloques de referencia y dos recientes.
- `stable`: ambos bloques recientes dentro de la zona neutral.
- `improvement` / `deterioration`: solo el último bloque rebasa el umbral.
- `persistent-change`: dos bloques recientes rebasan el umbral en la misma dirección.
- `recovery`: dos bloques recientes favorables tras dos bloques de referencia consecutivos deteriorados frente a una referencia previa.

## Pruebas sintéticas añadidas
Estabilidad, cambio abrupto persistente, mejora aislada, evolución gradual, pico ruidoso, recuperación, historia insuficiente, aislamiento de posición/configuración y rechazo de duplicados/inconsistencias.

## Ejecución offline
`npm run research:position-change -- data/cycles`

Lee `outcomes.jsonl` y genera `position-change.json` y `position-change.md`. No usa APIs, red, polling ni muta el journal.

## Límites estadísticos
Los intervalos y errores estándar son descriptivos: no corrigen autocorrelación, dependencia entre candidatos ni multiplicidad de comparaciones. No son pruebas confirmatorias ni evidencia de rentabilidad. La tasa de falsas alarmas debe medirse con simulaciones nulas y seguimiento prospectivo. Ninguna alerta modifica pronósticos, pesos, selección, ciclo de vida o registro de hipótesis.
