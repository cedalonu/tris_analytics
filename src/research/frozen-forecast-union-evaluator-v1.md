# Frozen forecast union evaluator v1

Evaluates selected frozen candidate forecasts by unioning predicted digits only within each digit position. Transition modes map to their defined positions; other candidate families contribute at their configured position. Candidate and baseline unions are scored on the same targets, by validation, holdout and prospective phase.

Reports hit coverage, hit counts, opportunities and mean pool sizes, plus paired per-position hit differences. Pool size is always shown: a larger union can improve coverage without predictive advantage.

Guardrails: no forecasts are regenerated; draw-ID causality and frozen-config equality are checked. This does not verify timestamp/hash authenticity (ledger audit responsibility). No holdout tuning. Coverage is digit-level, not exact five-digit prediction or betting return.

## Prospective ledger adapter

The `scripts/run-tris-frozen-union.ts` runner reads the existing `forecasts.jsonl` and `results.jsonl` files, evaluates the explicitly selected candidate IDs, and writes a JSON report. It derives targets only from resolved ledger rows and labels all observations `prospective`; it does not backfill past forecasts or fabricate validation/holdout records. Usage: `npm run research:frozen-union -- data/prospective candidate-id-1,candidate-id-2 reports/frozen-union-prospective.json`. Candidate IDs must be supplied explicitly; the output reports the selected union and target count.
