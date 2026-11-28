# P2.4 — Migración de evaluación walk-forward de pools a INA

**Estado:** motor envolvente implementado y validado; el módulo de pools permanece parcial porque la selección final de dígitos y el comparador experimental aún no se han migrado.  
**Rama:** `research-core-v1`

## Objetivo

Conectar la evaluación retrospectiva de pools al mismo contexto INA sin modificar el motor estadístico ni alterar sus resultados.

## Implementación

- Nuevo motor `src/research/ina-pool-evaluation.ts`.
- Consume `InaContext` y hereda versión, SHA-256, corte y tamaño de muestra.
- Ejecuta el evaluador existente `evaluatePool` para las cinco posiciones y los métodos: frequency, recent-frequency, long-absence, short-absence y balanced.
- Conserva el límite de 500 sorteos, mínimo de entrenamiento 30, tamaño del pool y ventana configurables.
- Publica `ResearchOutput` con clave `research.pool-evaluation`, etiqueta `backtested` y advertencias sobre sesgo de selección.
- El panel «Próximo sorteo» consume las evaluaciones versionadas de INA; la selección de pool y el complemento aging siguen separados y no se modificaron.

## Pruebas

`src/research/ina-pool-evaluation.test.ts` compara la salida INA con llamadas directas al evaluador existente, verifica parámetros, número de tests y rechazo de contexto inválido.

CI:
- [Research validation 46122236697](https://github.com/cedalonu/tris_analytics/actions/runs/46122236697): TypeScript, build visual y suite de investigación aprobados.
- [Research core checks 46122195877](https://github.com/cedalonu/tris_analytics/actions/runs/46122195877): type check y suite de pruebas aprobados.
- [Real-history validation 46122236665](https://github.com/cedalonu/tris_analytics/actions/runs/46122236665): TypeScript, suite de pruebas y build de integración histórica completados correctamente.

## Límites

La selección de los dígitos para el próximo sorteo todavía llama `buildPool` en el dashboard. El método adaptativo y la comparación aging vs. base siguen siendo cálculos experimentales dentro de la interfaz. No se cambia ni se promueve el pronóstico principal.

## Cierre

- [x] Walk-forward existente envuelto sin modificar su algoritmo.
- [x] Salida de evaluación con metadatos INA.
- [x] Panel consume la evaluación INA.
- [x] Pruebas de equivalencia con el motor original.
- [x] TypeScript, build visual y suite de investigación aprobados.
- [ ] Migrar construcción/selección de pools y combinaciones a una salida INA separada.
