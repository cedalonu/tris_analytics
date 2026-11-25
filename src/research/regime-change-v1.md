# TRIS regime-change screening v1

## Purpose
Compare a recent block of draws with the immediately preceding, non-overlapping reference block. Screen for changes in positional digit distributions, pool-size / distinct-digit distributions, duplicate-position rate, and the ten positional-pair joint distributions.

## Window plans
- 50 reference draws vs 10 recent draws
- 100 reference draws vs 20 recent draws
- 200 reference draws vs 50 recent draws

A plan is omitted until its full history is available. Draw IDs must be contiguous and chronological.

## Metrics and thresholds
For each feature, report total variation distance (TV) and Jensen–Shannon divergence in bits. A feature receives a descriptive `watch` flag when TV >= 0.20 or JS >= 0.08. These are screening thresholds, not p-values, significance levels, or calibrated alarm rates. The output does not label any change as statistically confirmed.

## Interpretation safeguards
- The windows are disjoint, so no draw is counted in both sides of a comparison.
- Multiple features are screened; correlated flags are not independent evidence.
- Random fluctuation, rare cells, and small windows can produce flags.
- A watch flag must not alter pool selection, candidate ranking, or the evidence ledger.
- Any candidate hypothesis must be specified before its evaluation period, assessed chronologically against a baseline, and replicated prospectively.

## Offline use
`npm run research:regime -- ./data/Tris.csv`

The command reads only the local CSV supplied by the operator and writes Markdown and JSON reports locally. It does not call APIs, fetch results, or modify forecasts.
