# Intuition research orchestrator v1

The orchestrator creates a reproducible research plan from the candidate catalog and outcome-blind prioritizer. It does not load TRIS history, call an API, calculate predictions, or claim discoveries.

## Default plan
- Catalog: 1,073 templates (transition, position mutation, absence-return, pool ranking).
- Budget: 100 candidates.
- Allocation: round-robin, 25 per family by default.
- Each selected item includes a frozen configuration, priority score/reasons, and an evidence-empty ledger record.
- Stable JSON serialization supports committing the plan as an audit artifact.

## Evaluation interface
evaluatePlannedHypothesis accepts one planned ID, paired observations, and one explicit phase. It rejects observations from other phases. By default the family-wide planned test count (selectedCount) is passed to Bonferroni adjustment unless caller supplies a predeclared testCount.

## Runner contract (next integration)
1. Read a manually supplied local CSV and validate it with the existing adapter.
2. Split chronologically before feature engineering or candidate selection; never shuffle.
3. For each draw, compute candidate and baseline using only earlier draws.
4. Emit one paired observation per eligible draw with immutable draw ID and period.
5. Evaluate discovery/validation/holdout/prospective separately.
6. Attach dataset fingerprint, split boundaries, baseline definition, code version, and frozen plan to the report.
7. Append evidence only after audit; do not auto-promote ledger status from this orchestrator.

## Safety / validity
No remote data access is performed. Synthetic tests validate orchestration mechanics only, not TRIS performance. The default budget and family allocation are research design choices, not optimized settings. Bonferroni testCount must represent the actual predeclared family of tests, including any additional exploratory choices; never shrink it after seeing results.
