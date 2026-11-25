# Portfolio selector v1 — experimental notes

## Scope
`portfolio-selector.ts` selects multiple candidate tickets separately by official user-listed TRIS ticket mode. It is a deterministic ranking-and-diversity utility, not a predictor or optimizer of expected value.

## Inputs
- Candidate ticket with mode, proposal string, score, support, and source.
- Quotas specify how many tickets to select per mode.
- Optional maximum positional overlap (default 0.80) and duplicate suppression.

## Selection
1. Filter candidates for the requested mode.
2. Sort by score descending, support descending, then proposal string ascending.
3. Reject malformed tickets, duplicates (unless duplicate suppression disabled), and candidates whose positional overlap with any already selected candidate is greater than the configured threshold.
4. Return fewer tickets than requested if the candidate list or overlap constraint prevents filling the quota. No automatic constraint relaxation.

## Diagnostics
Per mode, returns requested and selected count, available candidate count, invalid/duplicate/overlap rejection counts, and the selected scored candidates. Returned tickets omit scores and metadata; audit records preserve the selection trace.

## Required validation before use
- Test string validation and leading-zero preservation for all seven ticket modes.
- Test score tie-breaking deterministically.
- Test overlap threshold edge cases and duplicate option.
- Test quota 0, negative, fractional, and larger-than-candidate values.
- Evaluate with chronological generation: each proposal must be produced using only history available before the target draw.
- Compare against random and simple frequency baselines with identical per-mode ticket counts and costs.
- Use separate discovery, validation, holdout and then prospective data; the earlier exploratory test segment is no longer an untouched holdout.
- Report gross payout, cost, net, ROI, and results separately for each mode; do not combine modes in a way that hides losses.

## Interpretation
Scores are ranking signals, not calibrated probabilities. Diversity is a heuristic and must be tested; it does not imply higher hit rate, prize value, or positive expected return. The payout table remains user-provided and should be verified against official game rules before real-money decisions.
