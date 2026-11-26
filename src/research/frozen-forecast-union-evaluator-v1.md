# Frozen forecast union evaluator v1

Evaluates selected frozen candidate forecasts by unioning predicted digits only within each digit position. Transition modes map to their defined positions; other candidate families contribute at their configured position. Candidate and baseline unions are scored on the same targets, by validation, holdout and prospective phase.

Reports hit coverage, hit counts, opportunities and mean pool sizes, plus paired per-position hit differences. Pool size is always shown: a larger union can improve coverage without predictive advantage.

Guardrails: no forecasts are regenerated; draw-ID causality and frozen-config equality are checked. This does not verify timestamp/hash authenticity (ledger audit responsibility). No holdout tuning. Coverage is digit-level, not exact five-digit prediction or betting return.