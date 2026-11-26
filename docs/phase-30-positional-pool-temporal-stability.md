# Fase 30 — estabilidad temporal de la concordancia posicional-pool

## Objetivo
Comprobar si las relaciones descriptivas encontradas entre dominancia posicional y dinámica de pools se mantienen en el tiempo o dependen de un tramo concreto.

## Procedimiento
- Consume las filas por bloque de la fase 29; no recalcula ni modifica pools ni pronósticos.
- Calcula correlaciones móviles para tres relaciones: frecuencia del dominante/inclusión del dominante en el pool; cambio de dominante/rotación del pool; inclusión del dominante/acierto del pool.
- Ventana predeterminada de cinco bloques, paso de un bloque y mínimo de tres pares válidos por correlación.
- Omite ventanas con huecos en el índice de bloque; no conecta periodos sin soporte.
- Resume ventanas por grupo con número de correlaciones positivas, negativas y cercanas a cero; consistencia de signo y correlación absoluta media.
- Etiquetas descriptivas de estabilidad: positiva o negativa consistente cuando al menos 70% de correlaciones válidas mantienen ese signo; inestable en otro caso; insuficiente con menos de tres correlaciones válidas.

## Integración
Se agrega `positionalPoolTemporalStability` a `regime-labels-diagnostics.json`, `regime-analysis/latest.json` y `regime-analysis/latest.md` dentro del comando local `npm run research:regime-analysis -- <local-Tris.csv> [ledger-directory]`.

Variables de entorno:
- `TRIS_POSITIONAL_POOL_STABILITY_WINDOW` (5)
- `TRIS_POSITIONAL_POOL_STABILITY_STEP` (1)
- `TRIS_POSITIONAL_POOL_STABILITY_MIN_PAIRS` (3)

## Interpretación y límites
Las ventanas móviles se solapan y no son independientes. La consistencia de signo no es prueba estadística ni implica magnitud útil, causalidad o predictibilidad. Correlaciones no calculables se omiten, no se sustituyen por cero. Se heredan los límites de la fase 29: dominante del bloque retrospectivo, referencia k/10 solo orientativa, múltiples comparaciones y dependencia temporal. No hay p-valores ni optimización de umbrales. No cambia el ledger, candidatos, pesos, portafolios ni pronósticos congelados. Todo funciona offline con CSV local; sin APIs, polling ni descargas.

## Calibración sintética
Se añade `calibratePositionalPoolTemporalStability` y el comando `npm run research:positional-pool-stability-calibration`. El CI lo ejecuta y conserva los informes como artefactos.

Escenarios: relaciones nulas independientes, concordancia positiva persistente, concordancia negativa persistente, cambio alternante de signo y asociación positiva débil con ruido. Predeterminados: 500 réplicas, 30 bloques, ventana 5/paso 1, semilla fija 20261130. Reporta alertas de estabilidad en escenarios nulos/alternantes, detección de signo en escenarios persistentes e intervalos Wilson descriptivos.

Variables de entorno: `TRIS_POSITIONAL_POOL_STABILITY_REPS`, `TRIS_POSITIONAL_POOL_STABILITY_BLOCKS`, `TRIS_POSITIONAL_POOL_STABILITY_SEED`, `TRIS_POSITIONAL_POOL_STABILITY_CONSISTENCY`, `TRIS_POSITIONAL_POOL_STABILITY_NEAR_ZERO`, además de ventana/paso/mínimo de pares ya descritos.

La simulación no sustituye validación con resultados reales y no calibra el azar real de TRIS. Las tres relaciones comparten variables y las ventanas se solapan; las tasas son diagnósticos sintéticos, no p-valores ni garantías.
