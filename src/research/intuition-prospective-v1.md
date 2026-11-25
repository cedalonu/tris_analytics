# TRIS prospective forecast protocol v1

## Purpose

This module begins a genuinely prospective test. Each forecast is generated from a local CSV snapshot and frozen before the next contest result is present. When the next updated CSV contains that exact contest ID, the prior forecast is resolved without changing its prediction.

## Five-draw daily operating cadence

The project schedule supplied by the operator is five draws per day. Run the command after each CSV update:

```bash
npm run research:prospective -- ./data/Tris.csv
```

The first execution freezes forecasts for the next contest only. Later executions first resolve all outstanding forecasts whose exact target contest is now present, then freeze a new forecast for the next contest.

No API, HTTP fetch, polling, or scheduled job is used. The operator manually obtains the updated CSV.

## Frozen record

Each JSONL forecast stores:
- candidate ID and family;
- canonical frozen candidate configuration;
- exact target contest ID (must be last historical ID + 1);
- generation timestamp;
- last historical contest ID;
- SHA-256 fingerprint of the complete pre-result history;
- candidate prediction and paired baseline prediction.

Forecasts are append-only. The runner never overwrites a prediction. Resolution is allowed only when the CSV contains the exact target contest ID.

## Four candidate families

- Transition: top-1 mode outcome conditioned on the current lagged context; minimum five historical matching contexts.
- Position mutation: modal modulo-10 change conditioned on the lagged source digit; minimum five matching transitions.
- Absence-return: all digits with exactly the configured consecutive misses; empty pools are skipped. The baseline is the same-size frequency-ranked set.
- Pool ranking: configured pool compared with the rolling-frequency baseline.

All candidate and baseline outcomes are evaluated on the same resolved contest. Pool membership is a digit-level hit, not a five-digit exact-match claim.

## Temporal lags

Transition and position-mutation candidates now cover contest lags -1 through -5. These are contest-ID offsets, not clock-time intervals. The analysis does not assume evenly spaced draw times.

## Local ledgers

By default, the runner writes:
- `data/prospective/forecasts.jsonl`
- `data/prospective/results.jsonl`
- `data/prospective/latest-report.md`

These files are ignored by Git because they are local operational state. Back them up with the research workspace.

## Interpretation

The runner selects up to 100 hypotheses with the outcome-blind prioritizer. This is a research budget, not 100 validated signals. A forecast being recorded is not evidence of predictive advantage. Aggregate wins/losses are descriptive; use the frozen chronological evaluation, minimum sample requirements, paired tests, and multiplicity correction before any status promotion.

Run after every draw update. If several contests arrive between runs, only forecasts previously frozen for those target IDs can be resolved; the runner does not invent retrospective predictions for missed contests.
