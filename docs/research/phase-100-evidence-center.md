# Fase 100 — Centro de Evidencia TRIS

## Objetivo
Consolidar en una vista del dashboard los informes de Fases 94–99, manteniendo las métricas de cada procedimiento separadas y haciendo visibles los datos ausentes.

## Uso
1. Ejecutar localmente los comandos de generación de informes de Fases 94–99.
2. Importar sus archivos JSON en el Centro de investigación.
3. Abrir **Centro de Evidencia TRIS** para revisar la cobertura, la auditoría, las métricas por familia/posición y la trazabilidad.

La vista no descarga datos, no vuelve a ejecutar los análisis y no modifica informes. Los archivos se cargan manualmente en el navegador.

## Reglas de presentación
- Fase 95: diferencia del holdout y bloques positivos de entrenamiento.
- Fase 96: intervalo bootstrap de la diferencia observada.
- Fase 97: clasificación de sensibilidad por tamaños de bloque.
- Fase 98: clasificación conjunta predefinida.
- Fase 99: estado de controles, advertencias y hash local de Fase 94.
- Fase 94: informe de control aleatorio emparejado y origen declarado en auditoría.

Los grupos se cruzan mediante `family|position`. Si una fase no contiene el grupo, la celda aparece como ausente. No se imputan valores, no se promedian métricas heterogéneas y no se crea un score agregado.

## Límites
La auditoría de cadena verifica estructura y trazabilidad declarada, no autentica el CSV upstream ni demuestra validez científica. Las fases 95–98 reutilizan datos históricos relacionados y no son evidencia independiente. «Consistencia retrospectiva» no equivale a capacidad predictiva, probabilidad de acierto o rentabilidad.

## Archivos
- `src/StructuralEvidenceCenter.tsx`
- `src/ResearchDashboard.tsx`
- `docs/research/phase-100-evidence-center.md`
