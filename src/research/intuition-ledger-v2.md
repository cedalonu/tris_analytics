# Intuition Ledger v2 — signal lifecycle

Purpose: the system should remember hypotheses, results, failed attempts, and confidence limits. This ledger is an audit mechanism, not a predictor.

## Evidence phases
1. **Exploration**: discover patterns, create hypotheses. Never promotes a signal.
2. **Validation**: frozen configuration evaluated on a separate chronological segment. Positive results may be marked provisional.
3. **Prospective**: after configuration is frozen, evaluate new draws without re-tuning. Only this phase may move status to active.

## Status lifecycle
- hypothesis → idea not yet tested.
- testing → has separate validation evidence.
- provisional → at least 100 validation observations, observed candidate rate above baseline, and candidate Wilson 95% lower bound exceeds baseline.
- active → at least 100 prospective observations, candidate exceeds baseline and Wilson lower bound exceeds baseline.
- weakening → provisional candidate fails the prospective criteria.
- retired → evidence no longer supports continued evaluation or the hypothesis is superseded. Retirement is a human-reviewed decision.

These thresholds are pragmatic screening rules, not proof or a universal statistical guarantee. Wilson bounds are binomial approximations and do not model dependence between draws. Multiple testing and selection bias remain major risks.

## Required record fields
Hypothesis ID, plain-language description, configuration hash/frozen settings, phase, timestamp, sample size, hits, baseline sample size/hits, context, source-data fingerprint, and decision/reason. Store each evidence entry append-only; do not overwrite negative findings.

## Learning discipline
- Keep exploratory, validation, and prospective evidence distinct.
- Do not tune a candidate on the same segment used to validate it.
- Report misses and negative evidence as carefully as successes.
- Baseline must be defined before each evaluation.
- Record whether each position and prize mode is analyzed separately.
- Never use terms like "due" or claim certainty.
- Prospective monitoring can deactivate/weakening a signal; positive streaks alone are not enough.
