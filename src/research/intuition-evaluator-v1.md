# Intuition hypothesis evaluator v1
**Status:** evaluator design; synthetic tests only. No TRIS history was loaded or evaluated.

## Inputs
Observations are precomputed paired binary outcomes: each draw has candidate hit and baseline hit, phase (discovery, validation, holdout, prospective), chronological draw ID, and optional period label. The evaluator does not produce predictions or ingest lottery data; an upstream walk-forward process must use frozen configs and prior history only.

## Outputs
- N, hits, rate and Wilson 95% interval for candidate and baseline.
- Difference in hit rates and paired approximate 95% interval.
- Candidate-only wins and baseline-only wins, exact two-sided McNemar p-value.
- Bonferroni-adjusted p and alpha from a predeclared test count.
- Per-period performance and count of periods with positive differences.
- Conservative decision state: insufficient-data, no-evidence, continue-research, holdout-confirmed, prospective-replicated.

## Decision guardrails
- Default minimum sample is 100; configurable but frozen before evaluating.
- Discovery is descriptive and cannot confirm.
- Validation may only return continue-research when rate difference is positive, paired CI lower bound >0, and adjusted p <= adjusted alpha.
- Holdout confirmation and prospective replication use the same criteria but are separate phases.
- A phase cannot be substituted after results are seen; phase labels and test count must be predeclared.
- The evaluator does not automatically transition the intuition ledger to active. Human review and ledger lifecycle rules remain separate.

## Limitations
McNemar exact test assumes paired binary outcomes. The difference interval is a simple paired normal approximation and should be treated as approximate, especially with small/rare discordance. Periods are descriptive stability checks, not extra independent significance tests. Multiple testing correction only covers the declared family and testCount; undisclosed searches remain a risk. No result implies a lottery prediction or expected financial advantage.
