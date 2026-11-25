# TRIS temporal-memory research v1

## Purpose
Describe dependencies between a prior contest and a later contest at exact lags -1 through -5. The module examines every source-position / target-position pair (25 pairs per lag), including same-position continuity and cross-position associations.

## Measures
- Observation count for each lag and position pair.
- Same-digit rate for same-position comparisons.
- Mutual information and conditional entropy in bits.
- Most frequent source-digit to target-digit transitions, with support, conditional rate, target marginal rate, and lift versus that marginal.

The report provides three views when enough data exists: all history, the last 200 contests, and the last 1,000 contests. The windows are descriptive snapshots, not independent validation sets.

## Command
`npm run research:memory -- ./data/Tris.csv`

Optional second argument selects an output directory. Default: `reports/temporal-memory`.

Outputs:
- `temporal-memory.md`
- `temporal-memory.json`

## Interpretation limits
This is descriptive analysis, not a prediction. Mutual information and transition lifts are vulnerable to finite-sample bias, sparse categories, and multiple comparisons. A support floor of five is only a display filter. No strategy or candidate weights are changed by this module. Any proposed signal must be frozen and tested in chronological walk-forward evaluation, then prospectively against a predeclared baseline.

## Data constraints
The operator supplies the local CSV. The command performs no API calls, network access, polling, or automatic download. Exact consecutive contest IDs are required; missing contests stop the analysis.
