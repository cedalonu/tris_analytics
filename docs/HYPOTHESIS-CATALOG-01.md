# Registro de hipótesis de investigación TRIS

**Versión:** 1.0  
**Fecha:** 2026-11-28  
**Rama:** `research-core-v1`  
**Componente:** `src/HypothesisWorkspace.tsx`  
**Registro:** `src/research/hypothesis-catalog.ts`

## Propósito

El catálogo convierte líneas de análisis existentes en preguntas falsables con hipótesis nula, diseño de prueba, evidencia requerida y referencias de código. No es un listado de hallazgos. Las siete entradas permanecen en estado **Exploratory** hasta que se adjunten resultados reproducibles con cortes, muestras, controles y validación temporal.

## Hipótesis pre-registradas

| ID | Pregunta | Hipótesis nula | Referencias |
|---|---|---|---|
| H-TRIS-001 | ¿Cambia la distribución de frecuencias por posición entre bloques temporales? | Las diferencias son compatibles con fluctuación muestral. | `ina-dashboard-overview.ts`, `ina-positional-transitions.ts` |
| H-TRIS-002 | ¿Los intervalos de ausencia difieren de una referencia sin memoria? | Los intervalos son compatibles con la referencia geométrica marginal. | `ina-absence.ts`, `ina-recurrence.ts` |
| H-TRIS-003 | ¿Hay dependencia reproducible entre posiciones consecutivas? | Las posiciones son independientes al preservar sus marginales. | `hypothesis-relations.ts`, `hypothesis-network.ts`, fases 74–75 |
| H-TRIS-004 | ¿Los cambios de régimen superan la tasa de falsas alarmas? | Los cambios son compatibles con fluctuación y falsas alarmas. | `positional-change-point-detection.ts`, `historical-regime-comparison.ts` |
| H-TRIS-005 | ¿Los motivos estructurales sobreviven a cambios de ventana, bootstrap y holdout? | No son más persistentes que controles aleatorios equivalentes. | `structural-motif-experiment-ledger.ts`, `structural-motif-joint-stability.ts`, fases 83–99 |
| H-TRIS-006 | ¿La combinación de señales mejora pools frente a baseline en prospectiva congelada? | No hay mejora consistente frente al baseline pareado. | `prospective-performance.ts`, `frozen-forecast-union-evaluator.ts` |
| H-TRIS-007 | ¿Existe dependencia conjunta estable entre los cinco dígitos? | La distribución es compatible con independencia bajo las marginales. | `joint-digit-dependence.ts`, `joint-digit-dependence-validation.ts` |

## Estados y reglas de promoción

1. **Exploratory:** pregunta registrada; no hay veredicto.
2. **Validating:** existe resultado de descubrimiento y una prueba cronológica independiente en curso.
3. **Provisionally validated:** efecto replicado en validación/holdout con controles, ajuste por multiplicidad y soporte suficiente.
4. **Active:** evidencia prospectiva congelada y reproducible confirma utilidad bajo criterios definidos previamente.
5. **Degraded / Discarded:** deterioro, contradicción o falta de replicación. Se conserva el historial y no se borra el resultado negativo.

El catálogo actual contiene **7 hipótesis exploratorias y 0 validadas**. No se asigna evidencia numérica por el mero hecho de que exista un motor o un documento relacionado.

## Criterios mínimos para adjuntar evidencia

- Identificador y versión de hipótesis estables.
- Snapshot canónico, hash, corte, tamaño de muestra y fecha.
- Separación cronológica discovery / validation / holdout.
- Hipótesis nula, estadístico, denominador, baseline y corrección por multiplicidad cuando corresponda.
- Controles nulos y análisis de sensibilidad.
- Resultado favorable, neutro, desfavorable o contradictorio; los resultados negativos se conservan.
- Para cualquier afirmación predictiva: pronóstico congelado antes del sorteo, outcome oficial y baseline pareado.

## Implementación visual

La vista permite filtrar por familia y seleccionar una hipótesis para consultar pregunta, H0, diseño, evidencia requerida, fases y archivos fuente. El panel de monitor histórico sigue separado: solo muestra expedientes y snapshots que hayan sido importados; el catálogo no fabrica historiales ni clasificaciones.

## Limitaciones

Las referencias identifican código/documentación relacionados; no afirman que todos esos módulos estén conectados a un output INA versionado ni que sus resultados hayan sido reconciliados con el corte canónico vigente. Esa integración constituye el siguiente checkpoint.


## Checkpoint visual 02 — Generación y selección de hipótesis (2026-11-28)

- Nuevo panel `src/HypothesisPhasePanel.tsx` montado como ruta de la fase 2 del catálogo de investigación.
- Vista de inventario por cinco familias (posicional, temporal, dependencia, estructural y prospectiva), con barras relativas y conteos derivados directamente de `RESEARCH_HYPOTHESES`.
- Integra `HypothesisWorkspace.tsx` para filtrar familias y seleccionar hipótesis; el detalle expone pregunta, H₀, diseño, evidencia mínima, fases, artefactos y salvaguarda.
- Botón abre el monitor de expedientes históricos; se mantiene separado del catálogo preregistrado.
- Datos: 7 hipótesis, 7 exploratorias, 0 validadas. La visualización representa inventario, no resultados ni probabilidad.
- Enrutamiento en `ResearchDashboard.tsx` y entrada visual en `ResearchPhaseCatalog.tsx`.
- Estado de cierre: código conectado; pendiente CI, deploy y prueba real de apertura/navegación. Sin verificación de navegador en este checkpoint.
