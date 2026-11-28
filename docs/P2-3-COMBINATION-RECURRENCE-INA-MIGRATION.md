# P2.3 — Migración de aging y recurrencia a INA

**Estado:** implementado y validado por TypeScript, build y suite de pruebas.  
**Rama:** `research-core-v1`

## Problema resuelto

La sección de recurrencia construía un Map de combinaciones y calculaba frecuencia, primer/último sorteo, aging, gaps, promedio, mediana y máximo directamente dentro de `TrisOpsDashboard.tsx`. Eso duplicaba lógica analítica en la interfaz.

## Motor INA añadido

`src/research/ina-recurrence.ts` calcula, desde un único `InaContext`:
- combinación exacta R1–R5, conservando ceros iniciales y orden;
- cantidad de apariciones;
- primer y último concurso/fecha del snapshot;
- aging como diferencia de IDs de concurso;
- aging en días cuando ambas fechas están disponibles;
- gaps entre IDs, promedio, mediana y máximo;
- totales de combinaciones únicas, recurrentes y apariciones extra.

La salida es `ResearchOutput` con outputKey `research.combination-recurrence`, hash, versión, corte y tamaño de muestra heredados de INA. El módulo se añadió al registro de dependencias y quedó marcado como implementado después de integrar la salida en la interfaz.

## Cambios en el dashboard

- Se eliminó el cálculo del Map de combinaciones en React.
- La sección de aging/recurrencia consume `buildInaRecurrence(inaResult.context)`.
- Se muestra la identidad de dataset y el corte que respaldan las métricas.
- Sin contexto INA, la interfaz muestra que está esperando un snapshot validado y no fabrica conteos.

## Pruebas

`src/research/ina-recurrence.test.ts` cubre:
- Ceros iniciales y orden exacto.
- Frecuencia, primera/última aparición y aging.
- Gaps, promedio, mediana y máximo.
- Aging en días.
- Totales de combinaciones únicas/recurrentes y repeticiones extra.
- Fechas ausentes y combinaciones únicas.
- Rechazo de contextos en cuarentena.

Validación CI:
- [TRIS research validation 46122005341](https://github.com/cedalonu/tris_analytics/actions/runs/46122005341): TypeScript, build visual y suite de pruebas aprobados.
- [Real-history validation 46121991244](https://github.com/cedalonu/tris_analytics/actions/runs/46121991244): TypeScript, suite de pruebas y build de integración histórica aprobados.

## Límites interpretativos

Aging mide distancia entre IDs de concurso; si hay huecos, no equivale al número de filas observadas. La primera aparición es la primera dentro del snapshot, no necesariamente la primera histórica absoluta. Recurrencia y ausencia son descripciones, no evidencia de que una combinación esté «debida» ni de que aumente su probabilidad futura.

## Cierre

- [x] Motor puro INA.
- [x] Salida versionada y registrada.
- [x] UI consume la salida del motor.
- [x] Ceros iniciales preservados.
- [x] Pruebas unitarias, TypeScript y build aprobados.
