# TRIS position and pre-draw context memory v1

## Purpose
Measure whether prospective signal coverage differs by target position (R1–R5), candidate family and the observable structure of the immediately preceding draw.

## Frozen context
Every cycle signal stores the previous contest's:
- distinct digit count / pool regime: compact (1–3), mixed (4), broad (5);
- equal-position-pair count across the 10 pairs / duplicate regime: many duplicates at 20% or more, otherwise few;
- repeated-position count (5 minus distinct digits).

These values are frozen before the target result. They are not recomputed from the target contest.

## Position attribution
- Position mutation, absence-return and pool-ranking candidates are assigned only to their configured R1–R5 position.
- Full-result transition candidates are reported separately by mode. Their hit is not copied into each of five positions, which would multiply one outcome and misrepresent position-specific performance.

## Aggregation
Each resolved candidate forecast is a trial. Where several candidates are evaluated in one target contest, candidate hit rates and paired-baseline rates are averaged within that unique contest first. This prevents a draw with more candidate trials from receiving greater weight in the summary.
Summaries are grouped by position × family × prior pool regime × prior duplicate regime.

Chronological blocks contain 25 unique contests; a final partial block is displayed only with at least 10 unique contests. Block labels are descriptive: favorable at +2 percentage points or more versus the paired baseline, unfavorable at -2 points or less, neutral otherwise.

## Interpretation limits
- Candidate trials from the same contest and overlapping pools are correlated.
- A high coverage rate is not a calibrated probability, causal effect, or proof of predictive advantage.
- Many position/context strata are screened; apparent differences may arise from multiple comparisons or small samples.
- This report does not change frozen predictions, candidate weights, lifecycle status, or the evidence ledger.
- It is a monitoring layer; any promising stratum needs future prospective replication.

## Operation
The cycle runner writes `data/cycles/position-context-memory.json` and includes a summary in `latest-report.md` after each run:
`npm run research:cycles -- ./data/Tris.csv`

To rebuild the position report from the append-only outcome journal:
`npm run research:position-memory -- data/cycles`
