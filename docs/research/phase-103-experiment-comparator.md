# Fase 103 — Comparador de experimentos TRIS

## Objetivo
Comparar dos o más capturas del ledger de Fase102, tomando la más antigua como referencia y mostrando para cada captura posterior la igualdad o diferencia byte a byte de cada artefacto registrado.

## Uso
1. Ejecuta `npm run research:structural-experiment-ledger` después de generar los informes de fases 94–99 y 101.
2. Importa `reports/structural-motif-experiment-ledger/latest.json` en el Centro de investigación.
3. Abre «Comparador de experimentos (Fase 103)» y selecciona al menos dos capturas.

## Qué compara
- Huella de contenido global.
- SHA-256 por artefacto (fase, tipo y ruta).
- Artefactos sin cambio, modificados, exclusivos de una captura y ausentes.
- Estado completo/incompleto y commit Git, cuando está disponible.
- Comparación de una referencia con cada captura adicional seleccionada.

## Límite de trazabilidad
El índice `latest.json` de Fase102 contiene metadatos y hashes, pero no incluye los bytes ni el contenido JSON de los snapshots. Por tanto esta fase no puede decidir si un cambio procede de datos de entrada, parámetros, entorno o resultados, ni extraer métricas por familia/posición. No se infiere causalidad ni se declara reproducibilidad científica. Para habilitar esa lectura se requiere una ampliación posterior que cargue los snapshots de cada carpeta `records/<runId>/artifacts/` y compare los esquemas reales.

## Pruebas
Se incluyen pruebas unitarias para capturas idénticas, hashes distintos, artefactos ausentes, selección de varias capturas y cambios de commit. No se afirma que se hayan ejecutado.
