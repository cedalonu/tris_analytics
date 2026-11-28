# TRIS Analytics — Matriz de trazabilidad investigación ↔ implementación ↔ visualización

**Versión:** 2.0  
**Fecha de revisión:** 2026-11-28  
**Rama:** `research-core-v1`  
**Propósito:** identificar, para cada investigación, qué motor existe, qué salida produce, dónde se representa y qué evidencia falta para cerrar la correspondencia.  
**Regla:** la existencia de un archivo o componente no prueba que esté montado, conectado al snapshot INA vigente ni validado numéricamente. Los estados se asignan con criterio conservador.

## 1. Estados normalizados

| Estado | Criterio de asignación |
|---|---|
| **Implementada y representada** | Motor identificable y salida real consumida por una vista activa; la correspondencia básica está demostrada. No implica que la investigación sea predictiva. |
| **Implementada, pendiente de representación** | Hay motor/salida identificable, pero no una vista específica completa conectada a esa salida. |
| **Representada, pendiente de validación** | Hay componente o vista, pero falta demostrar su correspondencia exacta con el motor, su corte/hash, denominadores, filtros o montaje operativo. |
| **Experimental** | Existe una línea de investigación o visualización exploratoria; no debe tratarse como evidencia confirmada ni como predictor principal. |
| **Pendiente de desarrollo** | No se identificó implementación suficiente para la pregunta visual solicitada. |

Los estados describen la madurez de la relación investigación-visual, no el éxito estadístico de una hipótesis.

## 2. Matriz principal

| Investigación | Implementación / motor identificado | Qué debe visualizarse | Representación identificada | Estado | Brecha concreta para cerrar |
|---|---|---|---|---|---|
| **Frecuencia posicional** | `ina-core.ts`, `ina-dashboard-overview.ts`, perfiles R1–R5 | Distribución de dígitos 0–9 por R1–R5; tasas/denominadores; comparación por ventanas y evolución temporal | `ResearchSignalOverview.tsx`; vista `positions` de `TrisOpsDashboard.tsx`; paneles de perfil posicional | **Representada, pendiente de validación** | Confirmar que todos los gráficos consumen la misma salida INA y mostrar corte, hash, tamaño de muestra y definición de ventana en cada vista. |
| **Presencia y ausencia** | `absence-analysis.ts`; datos de historial y métricas de aging | Apariciones por dígito/posición; ausencia actual; distribución de intervalos; evolución del tiempo desde última aparición | Métricas parciales en vistas de posiciones/recurrencia; no se identificó una vista completa y dedicada para toda la salida de ausencia | **Implementada, pendiente de representación** | Exponer una salida INA específica que separe conteo de apariciones, intervalo entre apariciones y ausencia actual; construir timeline y distribución de intervalos. |
| **Recurrencia** | `ina-recurrence.ts`, `ina-aging-comparison.ts` | Repeticiones; frecuencia de combinaciones; primer/último registro; aging; distribución de intervalos; separación por ventana | Sección `recurrence` de `TrisOpsDashboard.tsx`; panel comparativo de aging | **Representada, pendiente de validación** | Verificar que la vista usa `research.combination-recurrence` y `research.aging-comparison` sin cálculos locales duplicados; aclarar universos y denominadores. |
| **Pools posicionales** | `ina-pool-selection.ts`, `ina-pool-evaluation.ts`; familia `pool-analysis.ts` y runners de portafolios | Composición de cada pool por posición; cambios de miembros; cobertura/aciertos por tamaño; ranking; comparación con baseline y método | Secciones de predicción/investigación de `TrisOpsDashboard.tsx` y `ResearchDashboard.tsx` | **Representada, pendiente de validación** | Mapear cada tamaño/método al output INA exacto; mostrar cobertura con denominador, ventana walk-forward, baseline pareado y estado de evidencia. |
| **Transiciones** | `ina-positional-transitions.ts`, `ina-transition-stability.ts`, persistencia posicional | Relaciones R1→R2→…→R5; matriz/conteos; intensidad normalizada; persistencia por segmentos; cambios de tasa entre ventanas | Red interactiva y timeline en `InaCommandCenter.tsx`; panel de estabilidad/entropía | **Representada, pendiente de validación** | La red y el panel están conectados a salidas INA. Falta validar equivalencia con comparadores históricos previos y ampliar la vista para cambios/persistencia calibrados; no interpretar conteos como probabilidad. |
| **Motivos estructurales** | `structural-motifs.ts` y familia `structural-motif-*.ts`; runners estructurales | Patrones/motivos; frecuencia y soporte; aparición/desaparición; transformación; persistencia/linaje; controles nulos y validación temporal | Familia `StructuralMotif*`, `StructuralEvidenceCenter.tsx`, `StructuralEvidenceEvolution.tsx`, `ResearchDashboard.tsx` | **Experimental** | Inventariar qué componentes están montados y qué artefacto consumen; enlazar motor→reporte→vista; mostrar controles nulos, holdout y tamaño de muestra antes de elevar el estado. |
| **Regímenes** | `regime-change.ts`, `regime-persistence.ts`, `regime-transition-dynamics.ts`, familia `positional-regime-*` | Cambios de comportamiento por periodo; duración/persistencia; transiciones entre regímenes; estabilidad y falsas alarmas | `HistoricalRegimeComparison.tsx`, `PositionalChangePointDetection.tsx`, `ResearchDashboard.tsx` | **Representada, pendiente de validación** | Confirmar montaje y fuente de datos de cada vista; distinguir análisis histórico, detección en tiempo pasado y calibración sintética; presentar tasa de falsas alarmas. |
| **INA** | `ina-contracts.ts`, `ina-core.ts`, `ina-registry.ts`, motores INA registrados | Red de relaciones; catálogo de módulos/salidas; conexiones emergentes y pérdida de intensidad; fuente, versión, hash, corte y estado de evidencia | `InaCommandCenter.tsx`: red de transiciones y panel de estabilidad/procedencia | **Representada, pendiente de validación** | La pantalla actual representa principalmente relaciones posicionales, no todo el conocimiento INA. Falta vista navegable del catálogo, dependencias, hipótesis, resultados, alertas y estados de evidencia. |
| **Evaluación retrospectiva** | `ina-pool-evaluation.ts`; `candidate-portfolio-walk-forward.ts`, validadores cronológicos, controles y runners | Resultados walk-forward por método/posición/tamaño; cobertura/aciertos; comparación contra referencias; sensibilidad, estabilidad y controles nulos | `ResearchDashboard.tsx`, comparadores especializados e informes de workflows | **Representada, pendiente de validación** | Unificar el acceso a reportes; mostrar ejecución, snapshot/hash, periodos train/test, baseline y denominadores; demostrar que cada panel corresponde al artefacto que titula. |
| **Evaluación prospectiva** | `intuition-prospective.ts`, `frozen-forecast-union-evaluator.ts`, `prospective-*.ts`; workflow live | Pronósticos congelados antes del sorteo; resultado real; estado pendiente/resuelto; aciertos y rendimiento acumulado; cobertura y baseline pareado | Sección `prospective` de `TrisOpsDashboard.tsx`; ledger/artefactos de GitHub Actions | **Representada, pendiente de validación** | La generación y auditoría del ledger corren en Actions, pero la UI aún admite importación manual/local. Falta consumo persistente automático y prueba de extremo a extremo sin duplicados ni reescritura de pronósticos. |

## 3. Mapa técnico de la cadena de evidencia

| Capa | Fuente de verdad / artefacto | Condición para considerar conectada |
|---|---|---|
| Fuente | Pakin `Tris.csv`, snapshot inmutable, manifiesto y SHA-256 | CSV validado, continuidad comprobada y manifiesto publicado |
| Base canónica | `data/canonical/Tris.csv` + `source-manifest.json` | El snapshot y el manifiesto corresponden al mismo corte y hash |
| Contexto INA | `InaContext`, `DatasetVersion`, `ResearchOutput` | Corte y versión comunes, sin reconstrucciones divergentes en la UI |
| Motor | Función de investigación registrada | Parámetros, versión, muestra, corte y evidencia documentados |
| Evaluación | Walk-forward, holdout o ledger prospectivo | Cronología sin fuga; baseline y denominadores explícitos |
| Visual | Componente React que consume el output | Sin recálculo local duplicado; filtros alteran datos reales; procedencia visible |

## 4. Hallazgos transversales y prioridades

| ID | Hallazgo | Prioridad | Acción |
|---|---|---|---|
| MV-01 | Hay vistas históricas y componentes especializados, pero no todos tienen vínculo verificable con un output INA versionado. | Alta | Añadir a cada vista el ID de output, motor, corte, versión y hash; retirar cálculos duplicados cuando exista motor INA. |
| MV-02 | Presencia/ausencia no tiene todavía una vista completa y diferenciada de recurrencia. | Alta | Crear contrato y panel específico de ausencia/intervalos, evitando mezclar aging con “número debido”. |
| MV-03 | Motivos estructurales tienen amplia familia de motores y componentes, pero su correspondencia reporte→vista y evidencia debe inventariarse. | Alta | Registrar por subfamilia motor, runner, artefacto, componente, controles y estado de evidencia. |
| MV-04 | Regímenes tienen motores y componentes, pero falta demostrar montaje y coherencia de cortes. | Alta | Auditar rutas activas, fuente de datos, filtros y calibración de falsas alarmas. |
| MV-05 | Evaluación retrospectiva se distribuye entre salidas de motores, scripts y reportes de CI. | Alta | Crear índice de reportes con ejecución, hash/corte, train/test y baseline. |
| MV-06 | El ledger prospectivo se genera y audita en Actions, pero el dashboard no demuestra todavía lectura automática de ese ledger publicado. | Crítica | Completar publicación/consumo persistente y prueba idempotente de UI + ledger. |
| MV-07 | El Centro INA actual es una primera vista de relaciones posicionales, no un mapa integral del conocimiento. | Alta | Extenderlo al catálogo de módulos, hechos, hipótesis, dependencias y evidencias. |
| MV-08 | P2.8 está implementado parcialmente: motor de estabilidad y panel inicial ya existen, pero falta equivalencia y auditoría completa. | Alta | Cerrar equivalencia con lógica anterior, calibración y límites de ventanas. |

## 5. Orden de ejecución visual recomendado

1. **Presencia y ausencia:** completar el contrato INA y su vista temporal; es una brecha descriptiva importante y antecede a interpretaciones de recurrencia.
2. **Frecuencia posicional:** validar denominadores, evolución temporal y consistencia entre las vistas actuales.
3. **Recurrencia:** verificar salida INA y separar claramente frecuencia, intervalo y aging.
4. **Pools posicionales:** conectar composición y resultados walk-forward por tamaño con sus baselines.
5. **Transiciones:** completar persistencia/estabilidad y su calibración sin duplicar cálculos.
6. **Regímenes:** enlazar componentes a motores y documentar falsas alarmas.
7. **Motivos estructurales:** construir índice motor→reporte→vista y controles.
8. **Evaluación retrospectiva:** consolidar reportes y comparadores.
9. **Evaluación prospectiva:** conectar ledger publicado y vista sin importación manual.
10. **INA:** evolucionar de red de transiciones a catálogo navegable del conocimiento.

## 6. Criterios de cierre por fila

Una fila solo podrá pasar a **Implementada y representada** cuando cumpla todos estos puntos:

- Motor y función exacta identificados.
- Salida estructurada/versionada con parámetros y denominadores.
- Componente visual activo identificado y consume esa salida (no una fórmula paralela).
- Corte, hash, muestra y estado de evidencia visibles o accesibles.
- Filtros e interacciones modifican la consulta real y conservan el contexto.
- Pruebas de motor y, cuando aplique, integración visual aprobadas.
- Comparación numérica motor↔vista sin diferencias no explicadas.
- Limitaciones y advertencias visibles.

La fila puede seguir siendo experimental aunque esté visualizada; la madurez visual no eleva por sí sola el nivel de evidencia estadística.

## 7. Límites de esta revisión

- Esta matriz es una auditoría documental/estática del código y de los artefactos identificados en `research-core-v1`; no afirma haber inspeccionado manualmente cada una de las 150 investigaciones ni cada ejecución histórica.
- La aprobación de TypeScript, tests y workflows reportada en CI acredita los pasos ejecutados en esos runs, no la validez predictiva de cada método.
- La presencia de componentes TSX no prueba que estén montados en una ruta activa ni que sus datos provengan del último snapshot canónico.
- El siguiente checkpoint debe convertir cada brecha MV-01…MV-08 en pruebas de integración observables y actualizar este documento con commits y resultados.
