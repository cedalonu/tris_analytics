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


## Frozen historical validation and evidence ledger

Before beginning the prospective series, run the one-time chronological experiment:

```bash
npm run research:validate -- ./data/Tris.csv
```

The runner reserves the first 200 draws as warmup, then freezes chronological discovery (50%), validation (25%), and holdout (25%) partitions. At least 100 validation and 100 holdout target contests are required. It selects up to 100 candidates without reading outcomes and writes `experiment-manifest.json`; this manifest locks the exact history prefix, candidate configs, and partition boundaries.

Re-running validation uses the same manifest and same original history prefix. If a previously processed historical row changes or disappears, execution stops. New rows appended later are excluded from this frozen experiment and belong to the prospective stream.

Validation evidence is appended once per candidate and manifest. The evidence ledger now requires:
- minimum 100 eligible observations;
- candidate rate above the paired baseline;
- Wilson lower bound above the baseline rate;
- positive paired-difference lower bound;
- exact McNemar test with Bonferroni correction across the frozen candidate budget.

Holdout results are reported separately and are not used to tune the candidate catalog or appended as validation evidence.

The prospective runner appends resolved batches to the same `signals.json` ledger, stores paired evaluations in `evaluations.json`, and uses the same 100-candidate multiplicity budget. A candidate cannot become active without passing both the frozen validation and the separate prospective gates.

The walk-forward scorer uses incremental counters for transitions, mutations, absences, and rolling pools. This avoids rescanning the entire prior history for every target contest while preserving the same pre-target information boundary. Regression tests compare incremental pool and mutation outputs with direct reference calculations.
