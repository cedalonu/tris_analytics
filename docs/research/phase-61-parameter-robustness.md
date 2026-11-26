# Phase 61 — Parameter-grid robustness
- Applies the eligibility and priority rules across a Cartesian grid of quality thresholds and minimum-history depths.
- Robust eligible: passes every grid cell; fragile: passes some but not all; never eligible: passes none.
- Reports counts and rates for eligible/review/blocked, high-priority frequency, and score range.
- Default grid: quality [60,70,75,85,90], revisions [2,3,4,5,8]. These are sensitivity settings, not tuned parameters.
- This is triage robustness only, not predictive evidence or lottery advantage.
