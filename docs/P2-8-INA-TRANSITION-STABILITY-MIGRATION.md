# P2.8 — Integración INA de estabilidad, entropía y ventanas de transición

**Rama:** `research-core-v1`  
**Estado:** implementación y migración visual realizadas; equivalencia automatizada añadida; pendiente de CI completa y auditoría final.

## Alcance de este checkpoint

- El motor `buildInaTransitionStability` produce una salida INA versionada para dos ventanas adyacentes no superpuestas (50 recientes y 50 anteriores), con tasas de transición y entropía posicional.
- El Centro INA consume esa salida para mostrar cortes, tamaños, entropía y mayores cambios.
- Se identificó el comparador heredado exacto de la vista general: top-10 de pares adyacentes en ventanas móviles de 50, 150 y 500 sorteos; unión de claves, conteos por ventana, presencia en top-10 y ranking final.
- Se creó `buildInaTransitionWindowComparison` como salida INA independiente `research.transition-window-comparison`. Conserva ventanas, tamaño de top-10, regla de desempate, mínimo de dos apariciones y límite de 12 filas.
- La vista general dejó de calcular localmente el comparador 50/150/500 y ahora representa la salida versionada de INA.
- El bloque de estabilidad/entropía de la vista `Mapa INA` también dejó de recalcular matrices y entropía localmente; reutiliza `stabilityOutput`.
- El registro INA incluye el nuevo output y sus archivos consumidores.
- Se añadieron pruebas de equivalencia con la implementación heredada para muestras de 0, 1, 49, 50, 149, 150, 499, 500 y 620 sorteos, además de rechazo de snapshot inválido.

## Equivalencia que se está preservando

La comparación 50/150/500 es un cálculo distinto del análisis de dos ventanas 50/50. No se fuerza una equivalencia conceptual entre ambos:
- `buildInaTransitionWindowComparison` conserva la comparación de ranking top-10 entre tres ventanas móviles solapadas.
- `buildInaTransitionStability` conserva el contraste de tasas entre dos ventanas consecutivas no solapadas y la entropía por posición.

La prueba compara cada migración con su cálculo heredado correspondiente, sobre el mismo conjunto ordenado de sorteos. Los conteos son descriptivos y no probabilidades.

## Límites

- Las ventanas 50/150/500 se solapan y tienen tamaños distintos; los conteos brutos no son tasas directamente comparables.
- La pertenencia al top-10 depende de ranking y desempate por clave.
- Con histórico menor que la ventana solicitada, el tamaño real es el disponible; no se completan datos.
- La comparación 50/50 puede tener una ventana anterior parcial o vacía en historiales cortos.
- Los cambios y repeticiones no prueban dependencia, causalidad ni ventaja predictiva.
- Los umbrales y cambios de tasa permanecen exploratorios y no se incorporan al pronóstico.

## Verificación pendiente

- [ ] CI completa de la rama para el HEAD que contiene motores, pruebas y UI.
- [ ] Confirmar que los tres workflows de validación terminan en éxito después de los últimos cambios.
- [ ] Revisar la salida visual con snapshot real y confirmar corte/hash/muestra coincidentes con INA.
- [ ] Registrar evidencia final en checklist, plan y matriz; cerrar P2.8 solo después de los controles anteriores.

## Checkpoint de código

- Motor nuevo: `src/research/ina-transition-window-comparison.ts`.
- Pruebas de equivalencia: `src/research/ina-transition-window-comparison.test.ts`.
- Consumidor: `src/TrisOpsDashboard.tsx`.
- Motor adyacente 50/50 y entropía: `src/research/ina-transition-stability.ts`.
- Consumidor de estabilidad: `src/InaCommandCenter.tsx` y panel Mapa INA.
