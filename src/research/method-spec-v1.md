# TRIS Analytics — Method specification v1 (research branch)

## Purpose and scope
This document freezes the definitions used by the initial experimental pool methods. It does not certify predictive value. The stable application is unchanged. Leading zeros are digits and each position is analyzed separately.

## Input and chronology
- Draws are ordered by draw ID ascending. A prediction for draw t may use only draws strictly earlier than t.
- Validate IDs, duplicates, five digits in [0,9], and date parseability. Report gaps; do not silently fill missing draws.
- Source and fetch timestamp must be recorded. Source updates do not overwrite historical experiment snapshots.
- Digit is a 0–9 category. Uniform reference is 10% per digit and k/10 pool coverage for a pool of k distinct digits.

## Pool scoring definitions
Methods rank the ten digits independently at each position. Window defaults to the latest 50 prior observations; shorter histories use all available prior observations. Ties are resolved by ascending digit.

1. frequency: descending occurrence count in the analysis window.
2. long-absence: descending number of consecutive prior draws since the most recent occurrence. A digit never observed in the available history receives the full history length.
3. short-absence: ascending current absence length (most recently observed first).
4. recent-frequency: descending occurrence count in the latest window (same window default 50).
5. balanced (current code): descending score frequencyRate + currentAbsence / max(1, historyLength), where frequencyRate and absence are computed in the trailing window. This is an exploratory composite; the two components have different interpretations and no empirically calibrated weights. It must not be described as an optimal balance.

Pool sizes are integer k=1..10. Results are compared with both uniform coverage k/10 and a fixed empirical-frequency pool chosen from discovery history, when available. Pool-size comparisons must never use raw hit-rate ranking without size-matched references.

## Evaluation
- Walk-forward evaluation is chronological; each evaluated draw's pool uses prior draws only.
- Report sample size, hits, hit rate, uniform reference, lift, hit distribution, and uncertainty intervals where supported.
- Discovery, validation, holdout, and prospective evidence must be recorded separately. The historical test window already used for exploratory comparisons is not an untouched holdout.
- Select method and pool size on discovery/validation only; holdout is used once for a frozen selection. Future prospective data is the strongest available confirmation.
- Control multiple comparisons (Bonferroni or another documented method); report number of hypotheses/tests, adjusted threshold, and all tested variants, including negative results.
- For repeated or overlapping windows, note dependence and avoid interpreting binomial intervals as fully accounting for serial structure.

## Presence and absence analysis
Presence: frequency/rate, recent-window rates, consecutive streaks, inter-occurrence gaps, position-specific patterns.
Absence: current missing streak, completed gap distribution, mean/median/max completed gap, return rates by prior absence length.
An absence is descriptive; it does not make a digit more likely in the next draw. Conditional rates must be compared to reference and evaluated chronologically, with sufficient opportunities per bin and correction for multiple comparisons.

## Pool analysis
Track size-specific hit rates, hit distribution, method overlap (Jaccard), composition stability, and size-normalized references. Pool-size mechanics create increasing coverage as k grows; size 10 trivially covers every digit and is not a predictive result.

## Hypothesis registry
Record versioned hypothesis, formula, dataset snapshot, split, sample size, metric, baseline, result, confidence/uncertainty, corrections, notes and status. Keep failures/discarded hypotheses and reasons. Status changes must follow explicit lifecycle transitions; a result alone cannot automatically validate a hypothesis.

## Integrity and claims
Do not fabricate or infer missing source data. Never leak future draws into feature construction. No claims of predictive advantage without reproducible, adequately powered, chronological validation and prospective replication. Lottery outcomes may be random; statistical patterns can be descriptive without being exploitable.
