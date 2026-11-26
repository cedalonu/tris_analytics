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
