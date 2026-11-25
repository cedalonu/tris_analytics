# Intuition Candidate Generator v1

This module creates a deterministic catalog of candidate hypotheses from TRIS analysis families. It does **not** analyze draw results or declare patterns predictive.

Families:
- **Transition**: mode outcome conditioned on lag -1/-2/-3.
- **Position mutation**: digit mutation descriptors by position and lag.
- **Absence/return**: conditional return at prior miss lengths (default 0, 1, 2, 3, 5, 8, 13, 20), compared with the uniform reference. This does not mean a digit is due.
- **Pool ranking**: position, ranking method, pool size, and window configuration.

Each candidate has a deterministic ID and canonical configuration string. Convert to a ledger record with status `hypothesis`; no evidence is attached or promoted. Freeze settings before validation, use chronological splits, compare to baselines, account for multiple testing, and keep prospective evidence separate.

Default pool candidate space can be large (5 positions × 5 methods × 10 pool sizes × 4 windows = 1,000 configurations). Configure subsets to prioritize experiments. The matrix runner is a separate optimized offline evaluation step and requires a user-provided local CSV.
