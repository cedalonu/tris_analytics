# TRIS multi-signal interaction engine v1

## Purpose
Screen whether a fixed pair or triple of past-only conditions has a stronger association with a position-specific candidate digit than its components. This is a research screen, not a predictor.

## Unit of analysis
One row per target contest, position (R1-R5), and candidate digit (0-9). Outcome is whether the target contest has that digit in that position. The ten candidate streams are evaluated separately for each position.

## Eight past-only features
- Candidate digit absent from that position in the previous 3 contests.
- Candidate digit absent from that position in the previous 5 contests.
- Candidate digit present in that position in the previous 3 contests.
- Candidate digit equals the previous contest's digit in the same position.
- Candidate digit appears in an adjacent position in the previous contest.
- Previous contest has at most 2 distinct digits.
- Previous contest has at least 4 distinct digits.
- Previous contest contains duplicate digits.

All features are frozen from history through t-1. The outcome at t is never used in feature construction.

## Search and chronology
- Warmup: first 5 contests.
- Fixed library: 8 features; 28 pairs and 56 triples = 84 rules per position-digit stream.
- Discovery / validation / holdout: chronological 60% / 20% / 20%, independently within each position-digit stream.
- Discovery requires at least 25 active rows for a rule.
- Top 3 combinations per stream are retained, then the global report is capped at 60.
- A rule is ranked on discovery incremental hit rate over the strongest individual feature. Validation and holdout are reported but do not select the rule.

## Interpretation safeguards
- Candidate-digit streams are correlated; the same draw contributes to 50 streams.
- The candidate digit is a hypothesis under test, not a prediction issued to the user.
- Pair/triple screening creates multiplicity and winner's curse. The split reduces but does not eliminate overfitting.
- Baseline is the empirical candidate-digit hit rate in the corresponding chronological phase; uniform 10% is not imposed.
- Minimum support is a reporting threshold, not significance.
- No p-values, confidence claims, candidate-weight changes, or evidence-ledger promotion are produced.
- Promising rules require a frozen prospective evaluation on future CSV updates before any predictive interpretation.

## Offline command
`npm run research:interactions -- ./data/Tris.csv`

No APIs, network access, polling, or automatic result downloads are used.
