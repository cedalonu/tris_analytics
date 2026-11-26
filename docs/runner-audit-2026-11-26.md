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
