# TRIS research runner audit — 2026-11-26

Branch audited: `research-core-v1`
Audited head: `d99c5a4ee114a135dcd7daca4f045da20e217fa8`
This inventory is a source-level audit of package scripts and runner entry points. It is not a claim that every command was executed during this audit.

## Runner structure

### Standalone runners
Each command has a corresponding entry point in `scripts/`:
- pool matrix
- CSV sync/import validation
- prospective portfolio forecast generation and ledger audit/coverage/performance
- collective, regime, persistence, memory, context-memory, adaptive-memory
- interactions, concordance, cycles, position-memory, position-change, position-null
- overlap, candidate-portfolios, portfolio walk-forward
- family concordance null/audit/stability/rolling
- candidate-persistence and regime-persistence/labels/calibration/stability
- historical-regime-analysis
- positional stability/transition calibration
- positional-pool stability calibration, null-controls, circular-shift, null-comparison, temporal-split, sensitivity

## Integrated sensitivity modules

The following analysis dimensions are implemented in the shared `scripts/run-tris-regime-analysis.ts` entry point rather than separate runner files:
- positional-pool scale sensitivity
- positional-pool origin sensitivity
- joint scale/origin robustness
- temporal-window sensitivity
- history/support sensitivity

Package aliases intentionally dispatch to the prospective-integrated runner:
- `research:regime-position-profile`
- `research:positional-transitions`
- `research:positional-pool-scale-sensitivity`

These commands are aliases, not independent executions or separate source entry points. Both entry points produce consolidated analysis; the historical-only entry point is the appropriate one for full historical reports, while the prospective-integrated entry point additionally requires an actual resolved prospective result before generating its performance persistence report.

## Prospective-data gating

The integrated regime runner checks:
- local CSV parse/validation and rejects draw gaps
- prospective manifest/latest-summary portfolio identity
- observation boundary validity and classifier warmup completeness
- presence of resolved prospective results before producing performance audit

Modules depending on prospective outcomes must remain blocked or report insufficient support until outcomes are actually resolved. Historical CSV must not be used to backfill prospective outcomes.

## Null-control limitation

Circular-shift and dual-null comparisons require complete contiguous block series. Groups with gaps are intentionally marked unavailable; do not bridge gaps, interpolate, or treat unavailable comparisons as negative evidence. A future enhancement may test contiguous-run-specific controls, but only if it preserves the observed temporal structure and predeclares minimum run support.

## Integrity and interpretation

- Manual CSV input remains the only data ingestion route for analysis; no automatic polling or downloading is introduced.
- This inventory does not activate candidates, change forecast pools/weights, modify the prospective ledger, or imply a predictive edge.
- Historical/synthetic diagnostics remain descriptive; prospective evidence requires frozen forecasts and actual resolved outcomes.
- Before claiming full execution coverage, run each standalone command or define an explicit CI matrix and retain its status/artifact evidence.


## Execution coverage and durable prospective ledger

### Coverage classification

- `research:sync`, `research:validate`, `research:regime`, `research:historical-regime-analysis`, `research:memory`, `research:context-memory`, `research:adaptive-memory`, `research:regime-memory`, `research:concordance`, `research:interactions`, `research:collective`, `research:persistence`, `research:pools`, `research:portfolio-walk-forward`, and the positional-pool historical controls are covered by the real-history workflow.
- Synthetic-only CI runs calibration, overlap, candidate-portfolio simulation, and detector-null calibration; these are not empirical TRIS forecast tests.
- Prospective-only runner families (cycles, position-memory/change, candidate persistence, prospective family concordance null/audit/stability/rolling, regime persistence/labels/stability) are not executed by current CI. Many require outcome records and are correctly gated; the synthetic family-null runner can be CI-executed independently.

### Important persistence gap

The real-history workflow starts from a clean checkout and uploads `data/prospective/**` as a workflow artifact with 90-day retention. No prospective/cycle ledger files are tracked in the repository tree. Therefore a forecast ledger created during one CI run is not automatically restored into a later run. This means CI artifacts alone do not provide a durable, automatically accumulating prospective history. Preserve the artifact and restore it explicitly in a subsequent workflow or maintain the ledger in a user-controlled persistent location; do not silently overwrite, backfill, or auto-commit it.

### Next engineering task

Design and implement an explicit ledger restore/continuity workflow with safeguards: import the prior artifact only when portfolio identity and ledger hashes match; validate append-only sequence and contest uniqueness; keep manual CSV as source; archive prior ledger before writes; make CI restore behavior opt-in and auditable. An opt-in manual workflow restore has now been added to `.github/workflows/tris-real-history.yml`: provide a prior successful run ID to download the named artifact and restore only its `data/prospective` folder. Normal push runs do not restore. The restore path is now implemented but still needs CI validation and an end-to-end manual test; do not claim durable prospective accumulation until that test succeeds.


### CI coverage update (2026-11-26)

The synthetic-only `research:family-concordance-null` runner is now included in `.github/workflows/tris-research.yml` with 300 replications per scenario, 100 synthetic draws, and a fixed seed. Its JSON/Markdown output is included in the CI artifact. This is calibration-only; it does not read real TRIS outcomes, alter portfolio settings, or count as prospective predictive evidence. Workflow validation is pending for the new commit.


## Verificación CI de la cobertura sintética — 2026-11-26

- Research workflow en commit `9d21b866fcfab2c3341b9af40944fa4f868c1b1d`: **success**. TypeScript, build, tests y todas las calibraciones sintéticas finalizaron; artifact `tris-position-null-calibration` generado.
- Real-history workflow para el mismo commit: aún en ejecución durante esta revisión; no se marca como validado hasta que termine.
- Family-concordance null: 300 réplicas × 100 sorteos sintéticos, 4 familias × 5 candidatos, semilla base 20261125. Se incluyeron 48 escenarios (probabilidades marginales 0.1/0.2/0.5; dependencia candidato-baseline 0/0.5/1; solapamiento entre familias 0/0.25/0.5/1).
- Bajo el escenario independiente (p=0.1, dependencias=0, overlap=0), correlación media entre familias −0.003, acuerdo direccional 49.58%, todas positivas 6.33%, alguna positiva 92.33%. Con overlap 0.25, todas positivas 11%; con overlap 0.5, 15%; overlap 1, 31.33%. Esto muestra que resultados positivos simultáneos y concordancia pueden surgir bajo un nulo por dependencia/ruido. No es una estimación de TRIS real ni evidencia predictiva.
- Artifact del run 588 descargado e inspeccionado; contiene JSON y Markdown del null, y calibraciones sintéticas. No contiene outcomes prospectivos resueltos.

## Requisitos de datos de los runners prospectivos (inspección de entrypoints)

| Runner | Fuente requerida | Estado sin outcomes reales | Nota de seguridad |
|---|---|---|---|
| `research:cycles` | CSV local validado + ledger de ciclos/outcomes | Puede crear forecasts congelados y resolver ciclos retrospectivos de validación de ciclo; no reemplazar CSV ni reescribir historia | Append-only; exige ≥200 sorteos y sin gaps |
| `research:position-memory` / `research:position-change` | `data/cycles/outcomes.jsonl` | No ejecutable si falta ledger; no simular resultados | Descriptivo sobre outcomes existentes |
| `research:candidate-persistence` | Manifest, forecasts, results, latest-summary del portafolio | Bloqueado si results no tiene registros resueltos | Identidad de portafolio validada |
| `research:family-concordance-audit/stability/rolling` | Mismo ledger prospectivo (forecasts + results) | Bloqueados sin results; null runner es sintético y separado | No usar históricos como backfill de prospectivo |
| `research:regime-labels` | CSV manual, manifest y latest-summary | Requiere CSV sin errores/gaps y warmup suficiente | Etiquetas past-only hasta límite observado |
| `research:regime-persistence` | Forecasts/results + regime-labels ledger | Bloqueado sin resultados resueltos | No promover régimen por historial retrospectivo |
| `research:regime-stability` | Labels JSONL ya calculadas | Puede describir labels existentes; sin labels no ejecutable | Offline; no convierte etiquetas en señal de predicción |

No se ejecutan estos runners contra datos inventados o históricos reutilizados como si fueran prospectivos. La cobertura futura se añadirá a CI sólo mediante tests sintéticos específicos o cuando exista un ledger prospectivo resuelto y auditable.
