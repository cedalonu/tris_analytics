# P2.5 — Migración de selección base de pools a INA

**Estado:** motor base implementado y validado por TypeScript, build y suite de pruebas.  
**Rama:** `research-core-v1`

## Objetivo

Eliminar del dashboard la selección base de pools y el ranking de combinaciones, conservando los algoritmos existentes y sin mezclar el complemento aging experimental.

## Implementación

Nuevo motor `src/research/ina-pool-selection.ts`:
- Consume el mismo `InaContext` versionado.
- Reutiliza el walk-forward INA para seleccionar el método adaptativo por posición, con la misma regla de máximo hit rate histórico.
- Reutiliza `buildPool` sin alterar el algoritmo de frecuencia, ausencia larga/corta, reciente o balance.
- Construye los cinco pools por posición, la directa de referencia y el top 12 de combinaciones por suma de rangos.
- Publica `ResearchOutput` con outputKey `research.pool-selection`, SHA, versión, corte y tamaño de muestra.
- Se registró la nueva clave de salida en el módulo `pool-research`.

La utilidad `rankPoolCombinations` también permite que el complemento experimental aging ordene combinaciones sin duplicar esa fórmula dentro de React.

## Integración en el dashboard

El panel «Próximo sorteo» ahora recibe de INA:
- Métodos seleccionados por posición.
- Pools base por posición.
- Directa de referencia.
- Combinaciones de apoyo top 12.

El comparador de aging sigue aislado y etiquetado como experimental. No se incorpora al pool base ni al predictor principal.

## Pruebas

`src/research/ina-pool-selection.test.ts` compara pools con llamadas directas a `buildPool`, valida selección adaptativa contra el walk-forward original, comprueba ranking de combinaciones, preservación del cero inicial y rechazo de contextos inválidos.

CI:
- [Research validation 46122541811](https://github.com/cedalonu/tris_analytics/actions/runs/46122541811): TypeScript, build visual y suite de investigación aprobados.
- [Real-history validation 46122541830](https://github.com/cedalonu/tris_analytics/actions/runs/46122541830): TypeScript, suite de pruebas y build de integración histórica aprobados.

## Límites

La familia de investigación de pools sigue marcada como parcial porque falta migrar la comparación aging vs. base y vincular todos los módulos de cobertura/solapamiento al mismo contexto. No se declara el conjunto de investigación de pools completamente consolidado.

## Cierre

- [x] Selección base consume INA.
- [x] Método adaptativo preserva la regla histórica original.
- [x] Combinaciones top 12 calculadas fuera de React.
- [x] Complemento aging permanece separado.
- [x] TypeScript, build y pruebas aprobados.
