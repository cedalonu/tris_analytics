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

## Checkpoint 2026-11-28 — primer sorteo nuevo e inventario de fases

El ciclo live `46181725839` terminó en `success` e incorporó el sorteo 37008
al histórico canónico. Snapshot observado por los runners:

- Archivo: `Tris-37008-3a7c40e21738.csv`
- Concursos: 11033–37008
- Registros: 25,976
- SHA-256: `3a7c40e21738f8d181c7bab725c0c8de023496a4c7dc65d97a246565068907b2`

En el mismo ciclo se ejecutó `research:phase-audit`. Resultado observado en
el log de Actions:

| Control | Resultado |
|---|---:|
| Expedientes del catálogo | 82 |
| Documentos localizados | 82 |
| Componentes visuales localizados | 20 |
| Sin visual catalogada | 62 |
| Bloqueados por rutas faltantes | 0 |
| Conexiones funcionales verificadas | 0 |
| Estado integral `unverified` | 82 |

El artefacto de ciclo contiene `reports/research-phase-audit/latest.json` y
`latest.md`. La auditoría se incorpora al resumen del workflow y se repite en
cada ciclo canónico. La suite de núcleo que incluye el registro de propagación
terminó en success en Research core run `46181697012`; la construcción y el
despliegue de la vista previa terminaron en success en run `46181725851`.

**Interpretación:** por primera vez el corte 37008 queda asociado a un inventario
reproducible de los 82 expedientes. Esto no significa que los 82 motores se hayan
ejecutado ni que todos sus outputs y gráficas estén actualizados. El inventario
mantiene expresamente sin verificar motor, output, montaje, binding y paridad.
Las validaciones extensas de investigación real-histórica y TRIS research
asociadas a este grupo de commits seguían ejecutándose al redactar este
checkpoint; no se declaran aprobadas aquí.

## Siguiente incremento prioritario

1. Crear el mapa de motor y output esperado por expediente, con evidencia de runner y de metadatos.
2. Seleccionar la primera cadena completa (fase 0 / integridad de datos) y probarla de extremo a extremo.
3. Incorporar adaptadores de salida y paridad para cada visualización, priorizando INA y presencia/ausencia.
4. Publicar el índice del último audit como dato estático consumible por la vista previa, evitando importación manual.
5. Probar la cuarentena de una mutación retroactiva con un fixture, sin modificar el histórico oficial.


## Checkpoint 2026-11-28 — expansión de salidas INA verificadas

El runner `scripts/run-tris-ina-canonical-audit.ts` ahora reconstruye los outputs descriptivos con el mismo `InaContext` derivado del snapshot canónico y comprueba su procedencia y binding en `TrisOpsDashboard.tsx`.

**Ejecución live:** run `46183853597`, success. Snapshot `Tris-37008-3a7c40e21738.csv`, 25,976 sorteos, corte 37008, SHA-256 `3a7c40e21738f8d181c7bab725c0c8de023496a4c7dc65d97a246565068907b2`.

Outputs reconstruidos y alineados al mismo hash/corte/muestra:

- `research.position-overview`
- `research.combination-recurrence`
- `research.pool-evaluation`
- `research.pool-selection`
- `research.aging-comparison`
- `research.positional-transitions`
- `research.transition-stability`
- `research.transition-window-comparison`
- `research.positional-absence`

La auditoría de propagación reportó **8 módulos current, 0 stale, 0 blocked y 3 missing**. Los módulos current son `source-integrity`, `ina-core`, `positional-absence`, `position-overview`, `combination-recurrence`, `pool-research`, `aging-experiment` y `positional-transitions`. Los tres pendientes son `memory-research` (`research.memory-state`), `prospective-evaluator` (`research.prospective-evaluation`) y `operational-dashboard` (`ui.operational-dashboard`).

La comprobación de presencia/ausencia comparó las 50 combinaciones posición/dígito con el analizador de referencia: 50/50 pasaron. Se comprobaron además los bindings fuente de los paneles. La frecuencia posicional ahora consume `research.position-overview` y presenta versión, SHA, corte y tamaño de muestra.

**Límites:** `current` significa que el output esperado se reconstruyó y sus metadatos coinciden con el snapshot; no certifica ventaja predictiva. La inspección visual real en navegador sigue pendiente. El inventario de 82 expedientes tampoco se eleva automáticamente por estos ocho módulos.


## Checkpoint 2026-11-28 — memoria INA y montaje operativo

Se añadió `buildInaMemoryState` (`research.memory-state`) como output versionado que combina `analyzeTemporalMemory` y `analyzeContextualMemory` sobre el mismo `InaContext`. El componente `InaMemoryPanel.tsx` ofrece selectores de alcance, rezago, posición de origen/objetivo y tipo de contexto; representa transiciones soportadas, información mutua, entropía y distribuciones condicionadas. Sus advertencias mantienen las métricas como descriptivas.

Se detectó además que `TrisOpsDashboard.tsx` existía pero no estaba montado desde el Centro de investigación. Se conectó mediante el botón **Centro INA operativo** en `ResearchDashboard.tsx`, con retorno al centro anterior. El propio dashboard carga `loadCanonicalTrisDataset()`, por lo que el panel operativo parte del histórico canónico validado.

**Ejecución live:** run `46184641716`, success. La auditoría de propagación registró **10 módulos current, 0 stale, 0 blocked y 1 missing**. El único módulo aún sin output es `prospective-evaluator` (`research.prospective-evaluation`). Se verificó por código que el dashboard operativo está montado y que el panel de memoria consume las dos ramas del output. El reporte de los 82 expedientes permanece conservador: 82 `unverified`, porque esa auditoría individual exige evidencia por expediente y no hereda el estado del registro INA.

La suite de investigación, TypeScript, build y auditoría INA pasaron en el workflow `46184641679` hasta el paso de calibración sintética final; el real-history `46184641682` seguía con validación cronológica extendida. La inspección visual manual en navegador sigue pendiente. El módulo prospectivo tampoco se considera current hasta reconstruir su output desde el ledger congelado y verificar su vista.
