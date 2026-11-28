# INA — Registro central de propagación (checkpoint 01)

**Fecha:** 2026-11-28  
**Rama:** `research-core-v1`  
**Implementación:** `src/research/ina-propagation-audit.ts`  
**Pruebas:** `src/research/ina-propagation-audit.test.ts`  
**Integración:** `scripts/run-tris-ina-canonical-audit.ts`

## Objetivo

Comparar los outputs que efectivamente se generaron con la versión canónica del dataset del ciclo. El registro no infiere actualización a partir de la existencia de archivos, componentes o de la etiqueta `implemented` del catálogo.

## Regla de frescura

Un output solo coincide con el corte canónico si coinciden simultáneamente:

- `datasetVersionId`
- SHA-256 del snapshot
- `drawCutoff`
- `sampleSize`

Un output con discrepancia queda `blocked`. Un módulo sin outputs queda `missing`. Un módulo con solo parte de sus outputs queda `stale`. Solo un módulo con todos sus outputs esperados y todos los metadatos coincidentes queda `current`.

## Estados

| Estado | Significado |
|---|---|
| `current` | Todos los outputs declarados presentes y alineados con el snapshot. |
| `stale` | Hay outputs, pero falta uno o más outputs declarados. |
| `missing` | No hay outputs disponibles para el módulo. |
| `blocked` | Existe discrepancia de versión, hash, corte, tamaño de muestra o error del registro. |

## Alcance inicial

El registro usa `INA_MODULE_DEFINITIONS` como catálogo de consumidores INA. En esta primera integración, el runner aporta evidencia real para:

- `ina.position-profile` y `ina.history` desde el contexto/core INA.
- `research.positional-absence`.
- `research.transition-stability`.
- `research.transition-window-comparison`.

Los demás outputs declarados por el registro se mostrarán como `missing` o `stale`, nunca como actualizados por inferencia.

## Límites explícitos

- El registro inicial cubre los módulos del registro INA, no equivale a un inventario funcional de los 82 expedientes de investigación.
- Los componentes visuales y las rutas del dashboard todavía requieren su propia prueba de montaje y paridad; un output fresco no demuestra que la UI lo represente correctamente.
- La auditoría del workflow verifica código fuente de wiring para las vistas comprobadas; no sustituye inspección de navegador.
- La generación de un reporte de auditoría no actualiza automáticamente cada motor no incluido en el runner. Esos módulos quedan pendientes.
- La propagación de un concurso nuevo solo se prueba cuando la fuente publica uno nuevo y el ciclo produce outputs con el nuevo corte. La ejecución sin cambios comprueba idempotencia, no actualización incremental.

## Pruebas

La suite `ina-propagation-audit.test.ts` cubre:
1. Módulos completos con metadatos coincidentes.
2. Outputs con corte/hash desalineados.
3. Ausencia de outputs pese a que existan definiciones y rutas de código.
4. Módulos con varios outputs cuando solo se aporta una parte.

El reporte generado se publica en `reports/ina-canonical-audit/latest.json` y `latest.md` dentro del artefacto del ciclo live. La ejecución de CI de este checkpoint debe cerrar antes de marcar las pruebas como aprobadas.

## Incremento 02 — Inventario de los 82 expedientes

Se exportó el catálogo de fases para reutilizarlo como fuente única y se añadió
`scripts/run-tris-research-phase-audit.ts`. El runner se ejecuta en cada ciclo
canónico, junto a la auditoría INA, y produce:

- `reports/research-phase-audit/latest.json`
- `reports/research-phase-audit/latest.md`

Por cada expediente registra localización documental y visual, además de campos
explícitos para motor, input canónico, output, montaje, binding y paridad. Los
campos sin evidencia se mantienen `unverified`; la presencia de un archivo no
los eleva a verificados. El reporte incluye snapshot, hash, corte y muestra del
ciclo que lo generó.

**Límite:** este incremento crea trazabilidad y un inventario repetible de los
82 expedientes; no ejecuta todavía los 82 motores ni demuestra que sus datos o
gráficas se hayan actualizado. La publicación actual queda en el artefacto del
workflow y en su resumen, no en un endpoint público consumido por el dashboard.

## Siguiente incremento

1. Añadir adaptadores de evidencia para cada output INA y para cada expediente.
2. Mapear motor y output esperado fase por fase, sin deducirlos del nombre del archivo.
3. Probar montaje, binding y paridad para cada visualización.
4. Publicar el índice de estado de forma consumible por el dashboard, sin importación manual.
5. Probar con un nuevo concurso real, conservando snapshots y predicciones anteriores.
