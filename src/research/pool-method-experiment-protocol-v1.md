# Pool-method experiment protocol v1

## Purpose
Compare position-specific candidate pool strategies using chronological walk-forward evaluation. The module is a discovery instrument, not a forecasting claim.

## Candidate methods
- frequency
- long-absence
- short-absence
- balanced
- recent-frequency

## Baselines
1. Uniform inclusion reference: pool size k has theoretical reference k/10.
2. Fixed frequency pool: top-k digits by frequency in the initial training segment, ties ascending digit.
3. Rolling frequency pool: top-k digits by frequency in the immediately preceding window, ties ascending digit.

## Evaluation
- Default minimum training history is 100 draws; callers may specify it.
- Pool candidates are built from prior observations only; no target draw is included.
- Window defaults to 50 draws.
- Report hits, hit rate, size-specific uniform reference, lift, fixed-frequency hit rate, rolling-frequency hit rate, and paired per-draw candidate-minus-rolling hit difference.
- Approximate 95% interval uses normal approximation on paired differences; it does not adjust serial dependence or multiple testing.
- Test several positions, methods, and pool sizes in discovery, then freeze a small set and evaluate on new chronological validation data. Never promote based on the largest selected exploratory result alone.

## Limitations
- This first version does not yet compute block-bootstrap intervals, formal multiplicity correction, or a nested validation schedule.
- Dataset must be validated and chronological by caller. Input integrity/source provenance is a separate gate.
- No evidence of advantage is assumed. Negative and neutral results are reportable outcomes.
