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
| **Adaptador, importación e integridad** | `load-canonical-tris.ts`, `canonical-prefix-guard.ts`, `data-adapter.ts`, `source-manifest.json` | SHA-256, tamaño, filas, rango de concursos, fechas de borde, continuidad y rechazo de mutaciones retroactivas | `App.tsx` indicador de histórico canónico; acceso a `TrisOpsDashboard.tsx` desde el Centro de investigación | **Parcialmente verificada** | Runner de fase 0 confirmó loader real, manifiesto, prefijo idempotente y mapeo 25,976/25,976; motor/output/paridad verificados y montaje/binding source-confirmed. Falta inspección manual de carga, fallback y estado visible en navegador. |
| **Frecuencia posicional** | `ina-core.ts`, `ina-dashboard-overview.ts` → `research.position-overview`, perfiles R1–R5 | Distribución de dígitos 0–9 por R1–R5; tasas/denominadores; comparación por ventanas y evolución temporal | `ResearchSignalOverview.tsx`; vista `positions` de `TrisOpsDashboard.tsx`; paneles de perfil posicional | **Representada, pendiente de validación** | La frecuencia histórica del dashboard principal consume `research.position-overview` con corte/hash/muestra visibles; run `46185535779` confirmó el binding; queda pendiente inspección de navegador y paridad visual de la ventana reciente. |
| **Presencia y ausencia** | `absence-analysis.ts`, `ina-absence.ts` (`buildInaAbsence`) → `research.positional-absence` | Apariciones por dígito/posición; ausencia actual; intervalos completos; timeline de últimos 100 sorteos; distribución y retornos condicionados | Panel V1 dentro de `positions` en `TrisOpsDashboard.tsx`; selector de posición/dígito, timeline, intervalos y tabla de oportunidades | **Representada, pendiente de validación** | TypeScript/build/pruebas e integración real-histórica aprobados (runs `46182720872`, `46182720859`); runner ampliado verifica las 50 combinaciones R1–R5 × dígito 0–9 y los cinco campos visuales sobre snapshot canónico; falta ejecutar esta nueva auditoría con corte 37008 e inspección real en navegador. |
| **Recurrencia** | `ina-recurrence.ts` → `research.combination-recurrence`; `ina-aging-comparison.ts` → `research.aging-comparison` | Repeticiones; frecuencia de combinaciones; primer/último registro; aging; distribución de intervalos; separación por ventana | Sección `recurrence` de `TrisOpsDashboard.tsx`; panel comparativo de aging | **Representada, pendiente de validación** | Verificar que la vista usa `research.combination-recurrence` y `research.aging-comparison` sin cálculos locales duplicados; aclarar universos y denominadores. |
| **Pools posicionales** | `ina-pool-selection.ts` → `research.pool-selection`; `ina-pool-evaluation.ts` → `research.pool-evaluation`; familia `pool-analysis.ts` y runners de portafolios | Composición de cada pool por posición; cambios de miembros; cobertura/aciertos por tamaño; ranking; comparación con baseline y método | Secciones de predicción/investigación de `TrisOpsDashboard.tsx` y `ResearchDashboard.tsx` | **Representada, pendiente de validación** | Mapear cada tamaño/método al output INA exacto; mostrar cobertura con denominador, ventana walk-forward, baseline pareado y estado de evidencia. |
| **Transiciones** | `ina-positional-transitions.ts` → `research.positional-transitions`; `ina-transition-stability.ts` → `research.transition-stability`; `ina-transition-window-comparison.ts` → `research.transition-window-comparison` | Relaciones R1→R2→…→R5; matriz/conteos; intensidad normalizada; persistencia por segmentos; cambios de tasa entre ventanas | Red interactiva y timeline en `InaCommandCenter.tsx`; panel de estabilidad/entropía | **Representada, pendiente de validación** | La red y el panel están conectados a salidas INA. Falta validar equivalencia con comparadores históricos previos y ampliar la vista para cambios/persistencia calibrados; no interpretar conteos como probabilidad. |
| **Motivos estructurales** | `structural-motifs.ts` y familia `structural-motif-*.ts`; runners estructurales | Patrones/motivos; frecuencia y soporte; aparición/desaparición; transformación; persistencia/linaje; controles nulos y validación temporal | Familia `StructuralMotif*`, `StructuralEvidenceCenter.tsx`, `StructuralEvidenceEvolution.tsx`, `ResearchDashboard.tsx` | **Experimental** | Inventariar qué componentes están montados y qué artefacto consumen; enlazar motor→reporte→vista; mostrar controles nulos, holdout y tamaño de muestra antes de elevar el estado. |
| **Regímenes** | `regime-change.ts`, `regime-persistence.ts`, `regime-transition-dynamics.ts`, familia `positional-regime-*` | Cambios de comportamiento por periodo; duración/persistencia; transiciones entre regímenes; estabilidad y falsas alarmas | `HistoricalRegimeComparison.tsx`, `PositionalChangePointDetection.tsx`, `ResearchDashboard.tsx` | **Representada, pendiente de validación** | Confirmar montaje y fuente de datos de cada vista; distinguir análisis histórico, detección en tiempo pasado y calibración sintética; presentar tasa de falsas alarmas. |
| **Hipótesis** | `hypothesis-catalog.ts`, `hypothesis-registry.ts`, `hypothesis-relations.ts`, `hypothesis-network.ts`, `hypothesis-communities.ts`, `hypothesis-tracker.ts` | Preguntas falsables, H0, diseño, evidencia requerida, relación entre hipótesis, estado del ciclo y evolución de resultados | `HypothesisWorkspace.tsx` integrado en `HypothesisMonitor.tsx`; monitor histórico separado para expedientes importados | **Catálogo implementado; evidencia pendiente** | Se registran 7 hipótesis exploratorias con trazabilidad a artefactos y criterios de promoción. Falta adjuntar resultados versionados, reconciliar outputs con snapshot canónico y conectar el historial persistente sin importación manual. No se presenta ninguna como validada. |\n| **Memoria temporal y contextual** | `temporal-memory.ts`, `contextual-memory.ts`, wrapper `buildInaMemoryState` → `research.memory-state` | Dependencias por rezago exacto, información mutua, entropía condicional, transiciones con soporte, tamaño de pool/duplicados por contexto y distribución objetivo | `InaMemoryPanel.tsx`, montado en el Centro INA operativo; selectores de alcance, rezago, posiciones y contexto | **Representada, pendiente de validación visual** | Output reconstruido sobre el snapshot canónico y binding de ambas ramas verificado en live run `46184641716`; falta inspección visual en navegador y validación temporal separada antes de cualquier interpretación predictiva. |\n| **INA** | `ina-contracts.ts`, `ina-core.ts`, `ina-registry.ts`, motores INA registrados | Red de relaciones; catálogo de módulos/salidas; conexiones emergentes y pérdida de intensidad; fuente, versión, hash, corte y estado de evidencia | `InaCommandCenter.tsx`: red de transiciones y panel de estabilidad/procedencia | **Representada, pendiente de validación** | La pantalla actual representa principalmente relaciones posicionales, no todo el conocimiento INA. Falta vista navegable del catálogo, dependencias, hipótesis, resultados, alertas y estados de evidencia. |
| **Evaluación retrospectiva** | `ina-pool-evaluation.ts`; `candidate-portfolio-walk-forward.ts`, validadores cronológicos, controles y runners | Resultados walk-forward por método/posición/tamaño; cobertura/aciertos; comparación contra referencias; sensibilidad, estabilidad y controles nulos | `ResearchDashboard.tsx`, comparadores especializados e informes de workflows | **Representada, pendiente de validación** | Unificar el acceso a reportes; mostrar ejecución, snapshot/hash, periodos train/test, baseline y denominadores; demostrar que cada panel corresponde al artefacto que titula. |
| **Evaluación prospectiva** | `cycle-learning.ts`, `ina-prospective-evaluation.ts` → `research.prospective-evaluation`; `prospective-ledger-audit.ts`, `prospective-performance.ts` | Ciclos congelados; prefijo histórico exacto; resultados reconciliados contra el CSV canónico; tasas por configuración exacta, pendientes y baseline pareado | `InaProspectivePanel.tsx`, montado en el Centro INA; consume `public/research-data/prospective-evaluation.json`, publicado por el workflow live | **Representada, integración automatizada aprobada; revisión visual pendiente** | Live run `46185535779`: 7 ciclos, 689 pronósticos, 589 resueltos, 100 pendientes, 191 configuraciones; integridad clean. El payload solo se publica cuando cambia el ledger y dispara despliegue. No equivale a probabilidad calibrada ni a rentabilidad. |

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
| MV-08 | P2.8 cerrado por CI y validación real-histórica con snapshot congelado 2026-11-25. | Media | Reconciliar la salida de la UI con el snapshot canónico vigente 37008; conservar la distinción entre estabilidad 50/50 y comparador móvil 50/150/500. |

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

### Regla no negociable: una salida, una representación trazable

Cada salida analítica producida por una investigación debe contar con su representación visual correspondiente dentro de una vista activa del dashboard. Si una investigación genera varias salidas, cada una debe quedar representada; si una visualización combina varias salidas, debe identificar todas sus fuentes. La relación obligatoria es **investigación → motor → salida versionada → visualización → prueba de paridad**. No se cierra una fila con una salida huérfana, una gráfica sin salida fuente o una representación que recalcule métricas por separado.

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


## 8. Checkpoint V1 — presencia y ausencia (2026-11-28)

- Motor INA: `src/research/ina-absence.ts`, función `buildInaAbsence`, output `research.positional-absence`, módulo `positional-absence`, motor `positional-absence-analysis@1.0.0`.
- Fuente: `analyzePositionAbsences` en `src/research/absence-analysis.ts`, sobre el contexto cronológico compartido de INA.
- Pruebas: `src/research/ina-absence.test.ts`; intervalos conocidos, ausencia actual, timeline, histórico vacío/corto, parámetros y snapshot inválido.
- Vista: sección Posiciones de `src/TrisOpsDashboard.tsx`, con selector R1–R5/dígito, métricas, timeline, distribución de intervalos y tasas condicionadas con oportunidades/retornos.
- Estado: representada, pendiente de validación CI y reconciliación numérica con snapshot canónico.
- Salvaguarda: intervalos completos excluyen censura izquierda/derecha; ausencia no significa “debido”; tasas condicionadas no son probabilidades independientes ni pronósticos.


## 9. Checkpoint de outputs INA — corte 37008

El live run `46183853597` reconstruyó nueve outputs con un mismo `InaContext`, hash y corte: `position-overview`, `combination-recurrence`, `pool-evaluation`, `pool-selection`, `aging-comparison`, `positional-transitions`, `transition-stability`, `transition-window-comparison` y `positional-absence`. La auditoría de propagación marcó ocho módulos `current`, cero `stale`, cero `blocked` y tres `missing` (memoria, evaluador prospectivo y dashboard operativo).

El componente de frecuencia posicional ahora consume `research.position-overview`; el runner compara sus conteos históricos con los perfiles de INA. La auditoría V1 de presencia/ausencia pasó 50/50 combinaciones y verificó 12 bindings de la vista. Corte: 37008; muestra: 25,976; SHA-256: `3a7c40e21738f8d181c7bab725c0c8de023496a4c7dc65d97a246565068907b2`.

Estos resultados verifican procedencia y correspondencia de salidas, no rendimiento predictivo ni inspección visual de navegador. La matriz conserva por ello los estados de madurez conservadores hasta completar la revisión visual.


## 10. Checkpoint de memoria INA y montaje operativo

- Output: `research.memory-state`, construido desde el contexto INA compartido; integra memoria temporal y contextual.
- Vista: `InaMemoryPanel.tsx`, con alcance, rezago, posiciones y contexto seleccionables; muestra soporte, información mutua, entropía y distribución.
- Montaje: `ResearchDashboard.tsx` incorpora el acceso `Centro INA operativo` a `TrisOpsDashboard.tsx`, con retorno al Centro de investigación. El dashboard carga el histórico canónico.
- Auditoría live `46184641716`: módulo `memory-research` y `operational-dashboard` current; total de módulos INA current 10, stale 0, blocked 0, missing 1 (`prospective-evaluator`).
- La vista de memoria sigue siendo descriptiva; la inspección de navegador y la validación holdout/prospectiva son pendientes independientes.


## 11. Checkpoint de evaluación prospectiva automatizada — corte 37008

La evaluación ya no depende de importar manualmente el ledger en el navegador. El live workflow adapta `data/cycles/cycles.jsonl` y `outcomes.jsonl` a `research.prospective-evaluation`, verifica huellas del prefijo previo y resultados contra el histórico canónico, y publica `public/research-data/prospective-evaluation.json` cuando el contenido cambia. `InaProspectivePanel.tsx` consume ese payload estático desde el Centro INA operativo.

Evidencia: run `46185535779` success; 7 ciclos, 689 congelados, 589 resueltos, 100 pendientes, 191 configuraciones y ledger `clean`. El panel muestra resultados descriptivos por configuración exacta, no una tasa combinada que mezcle modalidades.

La auditoría INA marca 11 módulos `current`, 0 `stale`, 0 `missing`, 0 `blocked`. Esto no eleva automáticamente los 82 expedientes: el audit individual reportó 82 `unverified` en el mismo corte. Falta inspección visual manual del navegador y pruebas por expediente para cerrar la matriz integral.


## 12. Mapeo inicial del catálogo de expedientes

La auditoría live `46185821125` confirma 82 documentos localizados, 24 rutas de visualización localizadas, 58 expedientes sin ruta visual catalogada, 0 referencias visuales rotas, 0 verificados y 82 `unverified`. Se mapearon cuatro vistas reales:
- Fase 0 — adaptador e integridad: `src/App.tsx`.
- Fase 1 — investigación descriptiva y pools: `src/TrisOpsDashboard.tsx`.
- Fase 3 — memoria de señales y ciclos prospectivos: `src/InaProspectivePanel.tsx`.
- Fase 4 — memoria posicional/contextual: `src/InaMemoryPanel.tsx`.

Localizar una vista no certifica su paridad por expediente. El siguiente trabajo debe añadir evidencia específica de motor, output, corte/hash, montaje, binding y prueba numérica; no elevar los 82 estados en bloque.


La evidencia específica de fase 0 está publicada en `public/research-data/research-phase-audit.json`. El Centro de investigación carga ese índice para mostrar el estado parcial por expediente; la inspección real del navegador sigue siendo una puerta pendiente, no una inferencia de CI.
