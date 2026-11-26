# Fase 23 — evolución posicional condicionada por régimen

## Objetivo
Describir cómo se distribuyen los dígitos R1–R5 dentro de cada régimen asignado con información estrictamente anterior al concurso objetivo.

## Método
- Reutiliza las etiquetas past-only ya generadas y estabilizadas por la fase 21.
- Comprueba que cada etiqueta conserva `sourceEndDrawId < drawId`; el resultado del objetivo nunca interviene en la asignación.
- Para cada régimen y posición calcula frecuencias de 0–9, entropía de Shannon, entropía normalizada, número efectivo de dígitos (`2^H`) y dígito dominante.
- Para cada uno de los diez pares de posiciones calcula coincidencia observada, referente marginal `sum(P(Rp=d) × P(Rq=d))` y exceso descriptivo respecto a ese referente.
- Calcula cambios del dígito por posición frente al sorteo inmediatamente anterior: repetición, movimiento +1/-1 módulo 10 y distancia circular media.
- Marca como soporte limitado los regímenes con menos de 30 concursos por defecto. El umbral se cambia con `TRIS_REGIME_POSITION_MIN_SUPPORT`.

## Ejecución
`npm run research:regime-analysis -- ./data/Tris.csv [directorio-ledger]`

El informe integral agrega `positionalProfiles` al JSON y una sección de tablas al Markdown en `regime-analysis/latest.json` y `regime-analysis/latest.md`. También puede invocarse mediante el alias `npm run research:regime-position-profile -- ./data/Tris.csv [directorio-ledger]`.

## Interpretación y límites
- Es un análisis de resultados observados condicionados por etiquetas históricas, no un predictor.
- El referente marginal de coincidencia no es una prueba de independencia ni un contraste estadístico.
- Los sorteos son secuenciales; no se calculan p-valores ni intervalos que presupongan independencia.
- Los grupos pueden tener tamaños muy diferentes; no comparar perfiles con soporte limitado como evidencia firme.
- No se ajustan umbrales, pesos, candidatos, portafolios ni pronósticos.
- No usa APIs, polling, descargas ni servicios externos. Requiere el CSV local suministrado manualmente.
