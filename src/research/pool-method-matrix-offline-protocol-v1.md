# Offline Pool Matrix Protocol v1

This experiment uses **no external lottery-data APIs or data services**. The user supplies a local historical CSV; all processing is deterministic and local.

## Run
```bash
npm run research:pools -- ./data/Tris.csv
```

The runner validates the CSV with the existing adapter and stops on import errors. It requires at least 1,001 draws and uses the first 1,000 valid chronological draws as the initial training prefix. Each later draw is evaluated walk-forward using only prior observations.

## Matrix
- Positions R1–R5
- Methods: all-history frequency, long absence, short absence, balanced, trailing-window frequency
- Pool sizes 1–10
- Windows 20, 50, 100, 200
- 1,000 result rows total; global-frequency rows repeat across windows by design, so 850 unique settings after removing those redundant window labels.

## Output and audit trail
Writes timestamped CSV and Markdown files to `reports/pool-matrix/` (ignored by Git). Report records input filename, SHA-256 fingerprint, draw range, row counts, date range, validation warnings, settings, and limitations.

## Interpretation
This is exploratory. Matrix-wide selection is subject to multiple-comparison optimism. Shortlisted settings must be frozen and tested prospectively on new draws. Pool hit rates are not prize odds or expected value.
