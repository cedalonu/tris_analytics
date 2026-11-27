# Fase 108 — Detector de contradicciones y cambios de evidencia

## Objetivo
Describir cómo cambian las etiquetas cualitativas de fases 95–98 entre ejecuciones consecutivas y detectar desacuerdos entre fases para la misma familia/posición y captura.

## Reglas
- Solo se considera favorable la etiqueta exacta documentada de cada fase: 95 `holdout-positive-and-most-training-blocks-positive`; 96 `interval-above-zero`; 97 `robust-positive-across-block-sizes`; 98 `consistent-retrospective-support`.
- Una transición favorable→otra etiqueta y otra etiqueta→favorable se informa por separado.
- Otras modificaciones de texto se marcan `label-changed`; no se les asigna una valencia estadística.
- Un desacuerdo entre fases requiere al menos una etiqueta favorable exacta y otra etiqueta distinta de su criterio favorable, en la misma captura/familia/posición.
- Snapshot ausente/ilegible genera `unknown-gap`; fila ausente en JSON legible puede producir `reported-to-absent`.
- Contexto declarado distinto se marca en la transición.

## Uso
1. Generar informes 95–98 y capturar ejecuciones con Fase102.
2. Importar `reports/structural-motif-experiment-ledger/latest.json` en el dashboard.
3. Abrir «Detector de contradicciones (Fase 108)».
4. Cargar `reports/structural-motif-experiment-ledger/records/`.
5. Filtrar familia/estado y expandir filas para ver transiciones y desacuerdos.

## Límites
Los informes reutilizan el mismo historial y pueden no ser evidencia independiente. «Otra etiqueta» no significa necesariamente evidencia negativa. Los cambios no demuestran causalidad, capacidad predictiva ni probabilidades de ganar. El análisis es retrospectivo y descriptivo.

## Pruebas
Seis pruebas unitarias escritas para transiciones en ambos sentidos, desacuerdo entre fases, cambio de contexto, huecos desconocidos y ausencia de datos. No se afirma que se hayan ejecutado.
