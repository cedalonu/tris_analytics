# P2.2 — Migración de frecuencias por posición a INA

**Estado:** implementado y validado por TypeScript, build y suite de pruebas.  
**Rama:** `research-core-v1`

## Problema resuelto

El dashboard calculaba la frecuencia de cada dígito/posición con filtros repetidos sobre `sorted` dentro de React. Esa era una segunda fuente de métricas paralela a los perfiles de INA.

## Cambio realizado

- El mapa de calor de R1–R5 y el panel «Distribución por posición» ahora leen los cinco perfiles posicionales de `inaResult.knowledge.positions`.
- Se eliminó el recálculo de frecuencias mediante `sorted.filter` en la interfaz.
- Si no hay un snapshot INA válido, la vista explica que espera un contexto validado; no muestra conteos ficticios.
- Las métricas comparten el corte, snapshot y SHA-256 del contexto INA utilizado por el resumen posicional.

## Validación

- TypeScript y build visual aprobados en [TRIS research validation 46121763713](https://github.com/cedalonu/tris_analytics/actions/runs/46121763713).
- TypeScript, suite de pruebas y build de integración histórica aprobados en [real-history validation 46121763700](https://github.com/cedalonu/tris_analytics/actions/runs/46121763700).

## Cierre

- [x] Conteos por posición consumidos desde INA.
- [x] Sin fórmula duplicada de frecuencia dentro de React.
- [x] Estado vacío explícito si no existe contexto INA.
- [x] CI de TypeScript, pruebas y build aprobado.

**Siguiente subpaso:** P2.3 — migrar aging/recurrencia de combinaciones a un motor descriptivo compartido y representar su salida versionada.
