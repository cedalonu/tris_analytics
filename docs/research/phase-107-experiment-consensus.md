# Fase 107 — Matriz de consenso entre experimentos TRIS

## Objetivo
Cruzar retrospectivamente las fases 95–98 y la persistencia calculada por Fase106, por familia y posición, conservando cada vocabulario original.

## Criterios explícitos
- Fase95 favorable: `holdout-positive-and-most-training-blocks-positive`.
- Fase96 favorable: `interval-above-zero`.
- Fase97 favorable: `robust-positive-across-block-sizes`.
- Fase98 favorable: `consistent-retrospective-support`.
- Persistencia: las cuatro series de Fase106 (una por cada fase 95–98) deben clasificarse `persistent`.
- `concordant-support` solo se asigna si todos los criterios anteriores se cumplen.
- `mixed` conserva los valores literales cuando hay etiquetas conocidas pero no coincidentes.
- `insufficient` si faltan snapshots, filas o persistencia suficiente.
- `not-interpreted` si una fase presenta etiqueta vacía/no interpretable.
- `context-changed` si los metadatos declarados de método/configuración/entorno difieren entre fases en la captura más reciente.

## Uso
1. Generar los informes de fases 95–98 y capturar ejecuciones con Fase102.
2. Importar `reports/structural-motif-experiment-ledger/latest.json` en el dashboard.
3. Abrir «Matriz de consenso (Fase 107)».
4. Cargar la carpeta local `reports/structural-motif-experiment-ledger/records/`.
5. Filtrar por familia y clasificación; revisar las etiquetas literales y los detalles.

## Límites
- Las fases 95–98 comparten el historial y el control de Fase94; no son evidencia independiente.
- La coincidencia es retrospectiva y no equivale a validación prospectiva.
- Las reglas solo interpretan las etiquetas exactas enumeradas; nuevas etiquetas se conservan sin traducirlas.
- La persistencia es estabilidad de etiquetas entre capturas, no estabilidad concurso a concurso.
- No se calculan probabilidades futuras, números ganadores ni rentabilidad; no recomienda apuestas.

## Pruebas
Seis pruebas unitarias escritas: etiquetas desconocidas, snapshots faltantes, cambio de contexto, ausencia de snapshots, vocabularios separados y evidencia no favorable. No se afirma que se hayan ejecutado.
