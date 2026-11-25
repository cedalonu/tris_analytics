# TRIS contextual temporal memory v1

## Purpose
Test whether the distribution of a target digit depends on characteristics of the earlier source contest, at exact contest lags -1 through -5.

## Contexts
- Source pool size: number of distinct digits (1–5) in contest t-lag.
- Source duplicate count: 0, 1, or 2+ repeated positions in contest t-lag.

For each context, lag, source position, and target position, the analyzer reports observations, contextual mutual information, eligible context buckets, target entropy, total variation from the overall target marginal, and supported target-digit rates/lifts.

## Scope
All history is always reported. Last 200 and last 1,000 contest scopes are added when available. The context comes strictly from the source contest; it never uses the target result to define the context.

## Command
`npm run research:context-memory -- ./data/Tris.csv`

Outputs under `reports/context-memory`:
- `context-memory.md`
- `context-memory.json`

## Interpretation safeguards
This is descriptive screening, not a predictor. Mutual information and lift can be inflated by finite samples, sparse buckets, and multiple comparisons. Bucket size 20 and digit support 3 are reporting filters only. No pool or candidate configuration is changed. Any hypothesis must be frozen, tested against a declared baseline in chronological walk-forward evaluation, and replicated prospectively.

## Data constraints
The user supplies the local CSV. No API, network request, polling, or automatic download is used. Exact consecutive contest IDs are required.
