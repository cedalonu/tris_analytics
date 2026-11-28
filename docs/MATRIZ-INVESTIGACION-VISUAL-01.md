# TRIS Analytics — Matriz de auditoría investigación ↔ visualización

**Auditoría P0.1 · 2026-11-27**  
**Rama auditada:** `research-core-v1`  
**HEAD inspeccionado:** `d2735bf617d210297cb1380abaf3ffac99bb5fef`  
**Alcance:** inventario estático del árbol Git, contratos/documentos, componentes, scripts y workflows. Esta matriz no sustituye la ejecución de CI ni una auditoría numérica del CSV.

## 1. Resultado ejecutivo

La rama tiene una base de investigación extensa, pero no una arquitectura visual unificada todavía.

| Inventario | Conteo observado |
|---|---:|
| Motores/archivos analíticos `src/research/*.ts` (sin tests) | 150 |
| Archivos de prueba `src/research/*.test.ts` | 142 |
| Motores sin archivo de prueba homónimo | 8 |
| Componentes React `src/*.tsx` | 57 |
| Scripts ejecutables de investigación/sincronización | 71 |
| Workflows GitHub Actions | 5 |

Los conteos son del árbol inspeccionado; no equivalen a cobertura de pruebas, calidad metodológica ni ejecución exitosa. Ocho motores carecen de un test homónimo visible: `absence-analysis.ts`, `draw-evolution.ts`, `evolution-analysis.ts`, `hypothesis-registry.ts`, `pool-analysis.ts`, `portfolio-evaluator.ts`, `portfolio-experiment-runner.ts` y `portfolio-selector.ts`. Esto no prueba que no estén cubiertos indirectamente, pero sí exige justificar o añadir pruebas específicas.

## 2. Matriz por dominio

| Dominio / pregunta | Motor(es) identificados | Runner / entrada operativa | Representación existente identificada | Estado de conexión |
|---|---|---|---|---|
| Fuente, esquema, continuidad e integridad | `data-adapter.ts`, `history-quality.ts`, `tris-csv-sync.ts`, `tris-csv.ts` | `research:sync`, `research:cycles:source` | Panel de integridad en `TrisOpsDashboard` | **Parcial**: el dashboard consume el CSV canónico, pero no un contexto/versión INA común. |
| Descripción por posición y desplazamiento reciente | `dashboard-overview.ts`, análisis posicional | Sin runner dedicado para el resumen visual | `ResearchSignalOverview.tsx`, sección principal | **Conectado parcialmente**: motor puro y vista usan los mismos sorteos; falta contrato INA, procedencia/hash visible y tests de integración visual. |
| Frecuencias, ausencia, aging y recurrencia | `absence-analysis.ts`, `pool-analysis.ts`, análisis de historial | Parte de scripts de memoria/pools | Vistas positions/recurrence y tablas en dashboard operativo | **Fragmentado**: existen cálculos UI propios; confirmar equivalencia con motores y sus definiciones. |
| Pools, candidatos, ranking y selección | `pool-method-experiment.ts`, `portfolio-selector.ts`, `candidate-portfolio-selector.ts`, `candidate-portfolio-benchmarks.ts`, `candidate-portfolio-walk-forward.ts`, `candidate-overlap-graph.ts`, `candidate-redundancy-matrix.ts` | `research:pools`, `research:candidate-portfolios`, `research:portfolio-walk-forward`, `research:overlap` | Dashboard operativo: pronóstico y comparación de métodos; informes descargables | **Parcial**: motores/ejecuciones y UI no comparten todavía un contrato versionado único. |
| Comportamiento colectivo, diversidad y dependencia | `collective-behavior.ts`, `interaction-engine.ts`, `joint-digit-dependence.ts`, `joint-positional-interactions.ts`, `structured-signal-overlap.ts` y controles asociados | `research:collective`, `research:interactions`, `research:joint-digit-dependence`, `research:joint-positional-interactions` | Algunas vistas de red/entropía y componentes de investigación | **Parcial**: hay componentes dedicados, pero no un índice completo de salidas reales cargadas en la interfaz. |
| Memoria temporal, contextual y adaptativa | `temporal-memory.ts`, `contextual-memory.ts`, `adaptive-signal-memory.ts`, `position-context-memory.ts`, `regime-conditioned-memory.ts`, `intuition-ledger.ts`, `intuition-orchestrator.ts` | `research:memory`, `research:context-memory`, `research:adaptive-memory`, `research:position-memory`, `research:regime-memory` | `IntuitionDashboard.tsx` | **Parcial / desacoplado**: vista recibe sorteos y usa motores/estado local; INA central y persistencia común no están demostradas. |
| Cambios de régimen, secuencias y persistencia | `regime-change.ts`, `regime-persistence.ts`, `regime-transition-dynamics.ts`, `positional-regime-*`, `positional-sequences.ts`, `positional-transition-persistence.ts` | `research:regime*`, `research:positional-*` | Componentes `HistoricalRegimeComparison`, `PositionalChangePointDetection`, `PositionalSequences`, etc. | **Parcial**: existe familia visual, falta matriz exhaustiva motor → artefacto → componente → filtros/corte. |
| Cambios posicionales y controles nulos | `position-change-detector.ts`, `position-change-null-simulation.ts`, calibraciones posicionales y null controls | `research:position-change`, `research:position-null`, `research:positional-stability-calibration`, `research:positional-transition-calibration` | `PositionalChangePointDetection.tsx`, `ConditionalPositionChanges.tsx` y componentes relacionados | **Parcial**: distinguir siempre simulación sintética de evidencia observada; no promover umbrales automáticamente. |
| Hipótesis, relaciones, comunidades y ciclos | `hypothesis-registry.ts`, `hypothesis-tracker.ts`, `hypothesis-relations.ts`, `hypothesis-network.ts`, `hypothesis-communities.ts`, `cycle-detector.ts`, `cycle-validation.ts`, `community-*.ts` | `research:hypothesis-tracker`, `research:hypothesis-alerts`, `research:cycles*` | `HypothesisMonitor`, `HypothesisNetwork`, `HypothesisRelations`, `HypothesisCommunities`, `CycleDetector`, `CycleValidation`, componentes Community | **Parcial**: existe una familia amplia de componentes; el vínculo con INA y sus registros versionados no está unificado. |
| Motivos/estructuras y evolución de evidencia | `structural-motifs.ts` y familia `structural-motif-*` | `research:structural-*`, `research:report-pack`, `research:evidence-dossiers` | Componentes `Structural*` y `ResearchDashboard.tsx` | **Parcial**: centro de informes lee reportes; comprobar frescura, hash, corte y correspondencia de cada artefacto. |
| Validación walk-forward, sensibilidad y robustez | `intuition-walk-forward-engine.ts`, `reproducibility.ts`, `decision-robustness.ts`, `rank-stability.ts`, `positional-pool-*`, `structural-motif-*` | Múltiples runners de calibración/validación | `ResearchDashboard.tsx` y comparadores específicos | **Parcial**: resultados dependen de reportes generados; falta estado visible de última ejecución y origen para cada visual. |
| Prospectiva, congelación y resolución | `intuition-prospective.ts`, `frozen-forecast-union-evaluator.ts`, `prospective-*.ts`, `cycle-learning.ts`, `cycle-validation.ts` | `research:prospective*`, `research:frozen-union`, `research:cycles*` | Sección Prospectiva de `TrisOpsDashboard`; `IntuitionDashboard` | **Débil / parcialmente manual**: el dashboard operativo importa JSONL del artefacto y los guarda en localStorage; no se demuestra lectura automática del ledger publicado por Actions. |
| INA como memoria común | No se identifica aún un servicio INA Core central con contrato ejecutable | No hay runner de reconstrucción INA identificado | Red INA en `TrisOpsDashboard`; paneles Intuition/Research separados | **Pendiente**: existe definición documental y red descriptiva, no autoridad técnica común. |

## 3. Rutas de datos observadas

### 3.1 Fuente histórica canónica
- El workflow `.github/workflows/tris-live-prospective.yml` revisa Pakin por cron horario y por ejecución manual; descarga/valida el CSV mediante `research:cycles:source`, genera snapshots y manifiesto, y publica `data/canonical/Tris.csv` y `data/canonical/source-manifest.json` en la rama.
- `TrisOpsDashboard.tsx` descarga directamente el CSV canónico de la rama y vuelve a validarlo con `importTrisCsv`.
- El mismo dashboard restaura además una copia de sorteos desde `localStorage`. La inicialización asíncrona de fuente remota y la restauración local son dos caminos separados; deben consolidarse bajo una política explícita de precedencia/versión para evitar que una copia local obsoleta reemplace temporalmente o confunda el estado.
- El dashboard principal heredado en `App.tsx` no usa este camino: conserva importación manual y caché `tris_csv_cache`. `IntuitionDashboard` recibe `allDraws` desde esa aplicación. Por tanto, coexisten al menos dos pipelines de histórico en la misma aplicación.
- El manifiesto y la base canónica existen en el árbol, pero esta auditoría estática no valida su contenido fila por fila ni confirma que el último run haya publicado la versión más reciente de Pakin.

### 3.2 Prospectiva
- `tris-live-prospective.yml` restaura el último artefacto exitoso del propio workflow, ejecuta ciclo y auditoría, publica la base canónica y sube `cycles/` y snapshots como artefacto.
- `TrisOpsDashboard` no consume ese artefacto directamente: ofrece importación manual de `cycles.jsonl` y `outcomes.jsonl` y persiste en localStorage.
- La cadena automática fuente → histórico canónico → motores → ledger → dashboard no está cerrada de extremo a extremo.
- `.github/workflows/tris-real-history.yml` contiene un paso con snapshot fijo `data/source-snapshots/Tris-2026-11-25.csv`. Es útil como validación reproducible histórica, pero se volverá obsoleto como integración del último histórico si no se versiona/parametriza explícitamente.

### 3.3 Reportes de investigación
- `ResearchDashboard.tsx` agrupa y presenta reportes por tipo/fase y tiene componentes especializados.
- El árbol Git no contiene directorio `reports/` versionado en el estado inspeccionado; los reportes se producen como artefactos de workflows. La vista debe explicar claramente cuándo no hay reportes, qué ejecución los generó y qué hash/corte representan.
- La existencia de un componente no prueba que reciba el artefacto correcto ni que sus datos correspondan al motor/documento que titula.

## 4. Hallazgos y riesgos concretos

| ID | Hallazgo | Severidad | Consecuencia / acción requerida |
|---|---|---|---|
| A-01 | No hay contrato/servicio INA Core ejecutable compartido identificado. | Bloqueante arquitectónico | P1: definir tipos, contexto versionado, registro de módulos y dependencias antes de migrar más cálculos. |
| A-02 | Dos experiencias/pipelines de datos coexisten: `TrisOpsDashboard` (CSV canónico + localStorage) y `App.tsx` (importación manual + caché local). | Alta | Elegir un adaptador/fuente común y evitar que las vistas analíticas reciban historiales distintos. |
| A-03 | El ledger prospectivo no se carga automáticamente desde el artefacto que genera Actions. | Alta | Integrar publicación/lectura persistente segura y mostrar corte/frescura; conservar congelación append-only. |
| A-04 | La vista INA actual es un grafo de transición posicional, no el registro central de todo el conocimiento de INA. | Alta | Ampliar hacia catálogo de hechos, hipótesis, evidencias, fuentes, dependencias y estado. |
| A-05 | Cálculos descriptivos y de recurrencia viven directamente en el componente React. | Alta | Extraerlos a motores puros versionados y hacer que las vistas solo representen sus salidas. |
| A-06 | 8 motores no tienen test homónimo visible. | Media | Revisar uno por uno: añadir pruebas o documentar cobertura indirecta y razón. |
| A-07 | `tris-real-history.yml` usa snapshot fijo fechado 2026-11-25. | Alta | Mantenerlo como fixture histórico etiquetado o cambiar la validación de integración a snapshot canónico parametrizado y verificado. |
| A-08 | Roadmap v1 aún afirma que la fuente es manual y prohíbe APIs/polling/descargas automáticas, en contradicción con el workflow horario actual. | Media | P0.2: corregir/supeditar formalmente la regla operativa; preservar los controles de integridad. |
| A-09 | Hay 150 motores y 57 componentes; el volumen no está acompañado por una matriz técnica persistida que indique para cada salida su visual, contrato, test y dependencia. | Alta | Esta matriz inicia la trazabilidad; P0.2 debe completar la relación por módulo y reconciliar fases. |
| A-10 | El panel muestra estado de carga, pero no hay una etiqueta universal de versión/hash/corte de INA en cada sección. | Alta | Incluir procedencia común en cada salida/visualización. |
| A-11 | La ejecución de un workflow no demuestra que todos los consumidores hayan adoptado su resultado. | Alta | Exigir prueba de propagación con una versión de dataset rastreable en fuente, INA, motor y UI. |

## 5. Inventario de componentes visuales por familia

La rama contiene 57 componentes TSX de investigación/operación, incluidos:
- Operación: `TrisOpsDashboard`, `ResearchSignalOverview`.
- Memoria e hipótesis: `IntuitionDashboard`, `HypothesisMonitor`, `HypothesisNetwork`, `HypothesisRelations`, `HypothesisCommunities`.
- Ciclos y evolución: `CycleDetector`, `CycleValidation`, `EvolutionObserver`, `HistoricalComparison`, `HistoricalRegimeComparison`.
- Posición e interacciones: `ConditionalPositionChanges`, `JointDigitDependence`, `JointDigitDependenceValidation`, `JointPositionalInteractions`, `PositionalChangePointDetection`, `PositionalCoordination`, `PositionalSequences`.
- Comunidades: `CommunityEvolution`, `CommunityPropagation`, `CommunityPropagationStability`, `CommunityRegimes`, `CommunityResilience`, `CommunityVulnerability`.
- Evidencia/experimentos estructurales: `StructuralEvidenceCenter`, `StructuralEvidenceEvolution`, `StructuralExperimentLedger`, `StructuralExperimentComparator`, `StructuralExperimentSnapshotComparator`, `StructuralExperimentEvolution`, `StructuralFindingConsensus`, `StructuralFindingPersistence`, `StructuralStabilityRanking`, `StructuralReproducibility`, `StructuralResearchChainAudit`, y la familia `StructuralMotif*`.
- Contenedor de informes: `ResearchDashboard`.

Este inventario es de componentes existentes, no una declaración de que cada uno esté conectado a datos vigentes o accesible desde la navegación de producción. El siguiente mapeo debe registrar el punto exacto de montaje/ruta y el artefacto consumido por cada componente.

## 6. Decisiones de auditoría

1. No iniciar una reescritura visual global todavía.
2. No promover el predictor ni combinar salidas por intuición.
3. El siguiente trabajo P0.2 debe reconciliar roadmap v1, fases 0–13, fase 120 y módulos ya presentes; clasificar cada fase como implementada, parcialmente implementada, documental, no ejecutada o validada.
4. P0.3 debe auditar las ejecuciones CI/workflows de la rama y correr pruebas completas antes de afirmar estado verde.
5. P1 debe establecer INA Core y su contrato; después, cada familia visual se conecta a una salida reproducible con versión, hash, corte, estado de evidencia y pruebas.
6. Mantener separados: dato observado, análisis descriptivo, hipótesis exploratoria, validación retrospectiva, evaluación prospectiva y pronóstico.

## 7. Criterio de cierre P0.1

- [x] Árbol de la rama inventariado.
- [x] Motores, tests, componentes, scripts y workflows contados.
- [x] Discrepancias de fuente/ledger y pipelines identificadas.
- [x] Familias de investigación relacionadas con representación actual.
- [x] Bloqueos arquitectónicos documentados.
- [ ] P0.2: reconciliación fase por fase y actualización del plan rector.
- [ ] P0.3: ejecución y auditoría de CI/workflows.
