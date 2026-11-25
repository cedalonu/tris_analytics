# Offline pool matrix protocol v1

## No-API constraint
The matrix runner does not call network services, endpoints, external APIs, or hosted prediction services. It reads a CSV file supplied locally by the operator. Repository maintenance/CI are separate from the TRIS data-analysis pipeline.

## Reproducible run
1. Place the historical CSV in a local path (recommended: `data/Tris.csv`). Obtain the file manually and verify its source before using it.
2. Run: `npm run research:pools -- ./data/Tris.csv`
3. The importer checks the expected schema and rejects malformed/duplicate draws.
4. Reports are written to `reports/pool-matrix/` (ignored by git):
   - CSV: row-level results for all tested settings
   - Markdown: provenance and experiment summary
5. Preserve the CSV input, report, and SHA-256 fingerprint together when archiving an experiment.

## Frozen matrix
- Positions: R1–R5 (0–4)
- Methods: global frequency, long absence, short absence, balanced, recent frequency
- Pool sizes: 1–10
- Recent windows: 20, 50, 100, 200
- Initial training: first 1,000 draws; walk-forward testing begins after training
- Full grid: 1,000 rows; global-frequency rows repeat across windows (window has no effect on global frequency), leaving 850 distinct position/method/size/window combinations after removing those duplicates.

## Baselines and interpretation
- Uniform reference: pool size / 10
- Fixed frequency: ranking based on initial 1,000 training draws
- Rolling frequency: trailing window before each target draw
- Paired hit-rate difference and simple normal CI are reported for method vs rolling-frequency baseline.
- Confidence interval is exploratory; it does not adjust for serial dependence, multiplicity, or candidate-selection bias.
- Do not interpret historical lift as a forecast advantage. Freeze candidate settings and test them prospectively on future draws before making any performance claim.

## Efficiency and correctness
The optimized runner uses incremental global counts, rolling counts, and last-seen indices. Pools of sizes 1–10 are prefixes of a deterministic full ranking. Tests compare the optimized hit totals to the direct `buildPool` implementation on seeded histories. Results must not be accepted if validation or equivalence tests fail.
