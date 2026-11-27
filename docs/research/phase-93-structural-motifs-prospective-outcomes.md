# Fase 93 — Motivos estructurales y resultados oficiales prospectivos

## Propósito
Conectar tres fuentes distintas: paquetes históricos de hipótesis, pronósticos congelados y resultados oficiales importados desde el CSV TRIS autorizado.

## Procedimiento
1. Para cada lote de pronósticos se toma generatedAt.
2. Cada paquete se filtra registro por registro: solo se conservan observaciones recordedAt estrictamente anteriores a generatedAt.
3. Se construye una red con aristas supported y se enumeran motivos de tres nodos. Solo candidatos que participan en una cuña o triángulo forman el subconjunto estructural.
4. Se unen pronósticos y resoluciones por forecastId y concurso objetivo.
5. Se exige que actual coincida exactamente con los cinco dígitos del CSV oficial. Se recalculan candidateHit y baselineHit antes de puntuar.
6. Se compara el pool estructural con todos los candidatos del mismo lote, familia, posición y concurso, además de la baseline del subconjunto estructural.

## Controles
- El concurso objetivo debe ser el siguiente al historial declarado.
- La resolución debe ser posterior a generatedAt.
- Los paquetes con observaciones posteriores se excluyen y contabilizan.
- Se exigen al menos nueve paquetes previos y se limita la red a 80 nodos por defecto.
- Se excluyen duplicados, resoluciones ausentes, resultados oficiales discrepantes y flags de acierto inconsistentes.
- Las métricas se separan por familia y posición.

## Métricas
Tasas de cobertura estructural, de todos los candidatos y baseline; tamaño medio de cada pool; diferencias pareadas por mismo concurso; intervalo Wilson del 95% para la tasa estructural.

## Límites
Una unión más amplia puede cubrir más dígitos simplemente por tener más elementos; por eso se muestran los tamaños de pool. La red se basa en co-movimiento de cambios en puntuaciones importadas, no en causalidad. La validez prospectiva depende de que las fechas de captura de paquetes sean fiables. El CSV conserva fecha, no necesariamente hora oficial del sorteo, así que no se afirma orden intradía.

No se inventan pronósticos faltantes ni resultados. Ningún resultado constituye garantía de acierto o ventaja económica.

## Ejecución local
Comando: npm run research:structural-outcome -- <ruta-local-Tris.csv> <directorio-paquetes-JSON> [directorio-ledger]

Lee forecasts.jsonl y results.jsonl desde data/prospective por defecto. Genera reports/structural-motif-prospective-outcome/latest.json y latest.md.
