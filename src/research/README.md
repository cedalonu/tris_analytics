# Tris Analytics research core v1

Additive, isolated statistical research module. It does not alter the current prediction engine or UI.

Capabilities:
- Validate five digits per draw, duplicate IDs, date warnings, and gaps in draw IDs.
- Positional presence frequencies and absence/gap statistics.
- Historical-only pool construction with frequency, long absence, short absence, balanced and recent-frequency methods.
- Walk-forward evaluation: each test draw's pool is built from earlier draws only.
- Pool-size comparisons (default sizes 2 through 9).
- Hit-rate comparison to the simple uniform reference k/10.

Cautions: the uniform reference is a simple baseline, not a full significance test. Retrospective method selection, overlapping windows, and multiple comparisons can inflate apparent results. Reserve a chronological holdout and prospective testing. Preserve the leading zero of five-digit results during CSV ingestion; this module accepts digits as a fixed five-element array.
