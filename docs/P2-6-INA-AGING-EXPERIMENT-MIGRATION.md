# P2.6 — Migración del comparador experimental de aging a INA

**Estado:** implementado y validado por TypeScript, build y suite de pruebas.  
**Rama:** `research-core-v1`

## Problema resuelto

El dashboard calculaba directamente:
- ranking por frecuencia reciente/base y ajuste por aging;
- pools experimentales por posición;
- hits walk-forward de la variante base y de la variante aging.

Esto duplicaba el algoritmo en React y mezclaba la comparación con la representación visual.

## Motor INA añadido

`src/research/ina-aging-comparison.ts`:
- Preserva la fórmula original de frecuencia 65% reciente / 35% amplia.
- Preserva el ajuste experimental 80% frecuencia / 20% aging normalizado.
- Mantiene la media de gaps y el aging en IDs de concurso.
- Construye pools experimentales de cinco posiciones.
- Ejecuta la comparación walk-forward reconstruyendo rankings sólo con el historial anterior a cada sorteo objetivo.
- Publica salida separada `research.aging-comparison`, estado `exploratory`, con versión/hash/corte/muestra INA.

El módulo se registra como `aging-experiment`. Su salida no se combina con el pool base ni modifica el predictor principal.

## Cambios en la interfaz

- Se eliminó `rankDigitsByPosition` de `TrisOpsDashboard.tsx`.
- La opción «Complemento · aging» consume los pools experimentales de INA.
- La tabla comparativa base vs. aging consume los conteos walk-forward generados por INA.
- La interfaz muestra la versión y huella de los datos utilizados.
- La explicación conserva el estado experimental y la advertencia de que el aging no implica que un dígito esté debido.

## Pruebas y CI

`src/research/ina-aging-comparison.test.ts` compara el ranking con la fórmula anterior para las cinco posiciones y reproduce los hits walk-forward de forma exacta.

- [TRIS research validation 46122794798](https://github.com/cedalonu/tris_analytics/actions/runs/46122794798): TypeScript, build visual y suite de pruebas aprobados.
- [Real-history validation 46122794748](https://github.com/cedalonu/tris_analytics/actions/runs/46122794748): TypeScript, suite de pruebas y build de integración histórica aprobados.

## Cierre

- [x] Fórmula base/aging extraída sin alterar sus pesos.
- [x] Walk-forward experimental con historial previo por objetivo.
- [x] Pools experimentales y comparación generados por INA.
- [x] Salida registrada y separada del predictor base.
- [x] Dashboard sin cálculo local de ranking aging.
- [x] TypeScript, build y suite de pruebas aprobados.
