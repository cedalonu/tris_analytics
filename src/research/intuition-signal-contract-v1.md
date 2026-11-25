# TRIS operational signal contract v1

This document freezes what counts as a candidate hit before any historical TRIS outcomes are evaluated. It is a research protocol, not a claim that any family has predictive value.

## Shared rules

- Input is a manually supplied local CSV. No API, HTTP request, scheduled fetch, or external data source is used by the runner.
- Draws must be validated and strictly ordered by increasing contest ID. For the strict v1 runner, any missing contest ID in the analyzed sequence is a blocking data-quality issue. Do not silently treat the next available row as draw -1.
- Lag 1, 2, or 3 means exact contest ID difference of 1, 2, or 3, not merely the previous/second/third row.
- A target draw is scored only from information available before its contest ID. No current or future outcome may enter feature construction, rankings, thresholds, or baseline.
- Candidate and baseline are evaluated on the exact same target draws. A hit is binary: the actual target outcome is in the candidate's frozen prediction set.
- Ties in rankings are resolved deterministically: lexicographically for digit strings, numerically ascending for single digits.
- For conditional transition/mutation candidates, require at least 5 prior matching contexts. If support is below 5, that target is not an eligible trial for that candidate; report eligible N and coverage, never count it as a miss.
- The initial implementation uses top-1 for transition and mutation predictions. This choice is frozen for v1; it is not selected after looking at results.
- Minimum initial history before scoring: 200 validated draws. Validation, holdout, and prospective samples must be kept separate and chronological.

## Family scoring definitions

### 1. Transition

Candidate key: `mode + lag`.

At target contest t, take the mode outcome from exact contest t-lag as the context. From all earlier eligible transitions (source and target contests both before t), count historical target mode outcomes following that same context. If support is at least 5, predict the most frequent following outcome (top-1). Candidate hit = actual mode outcome at t equals that prediction.

Paired baseline: predict the single most frequent mode outcome among all prior target outcomes, regardless of context. Use the same eligible target contests as the candidate.

Mode position mapping is frozen in `draw-evolution.ts`: full5=R1-R5, last4=R2-R5, last3=R3-R5, first2=R1-R2, last2=R4-R5, firstLast=R1+R5. Leading zeroes are preserved.

### 2. Position mutation

Candidate key: `position + lag`.

At target t, let x be the digit in the selected position at exact contest t-lag. From all earlier pairs with the same source digit x and the same exact lag, calculate modular changes `(targetDigit - sourceDigit + 10) % 10`. With at least 5 matching prior pairs, predict the most frequent change and apply it to x modulo 10. Candidate hit = predicted digit equals the actual target digit.

Paired baseline: predict the most frequent historical target digit at that position, using only draws before t. Use the same eligible target contests.

### 3. Absence / return

Candidate key: `position + exact priorMisses`.

Immediately before target t, calculate each digit's current consecutive-miss count at that position. The candidate prediction set is every digit whose miss count equals the configured threshold exactly. If this set is empty, t is not eligible. Candidate hit = actual target digit belongs to that set.

Paired baseline: choose the same number of digits as the candidate set, ranked by frequency in all prior draws at that position (ties: lower digit first). Candidate and baseline are therefore compared at equal pool size on the same target draw. This tests whether the exact absence-conditioned set adds value beyond a frequency pool; it does not mean a digit is "due".

### 4. Pool ranking

Candidate key: `position + method + poolSize + window`.

At target t, build the configured pool from prior draws only, using the existing `buildPool` definition. Candidate hit = actual digit belongs to that pool.

Primary paired baseline: rolling-frequency pool of the same size, built from the same prior history and configured trailing window. Secondary descriptive baseline: fixed-frequency pool built from a frozen initial training prefix. Uniform k/10 is a reference only, not the paired baseline. A `recent-frequency` candidate is expected to tie its primary baseline by construction; it remains useful as a control, not as a discovery claim.

## Split and report contract

- Split by contest ID before any model selection: discovery, validation, and holdout are contiguous chronological blocks. New contests arriving after the frozen dataset boundary form the prospective block.
- The initial runner must write the exact first/last contest ID and row count for every block. No shuffling.
- Discovery is descriptive and may shortlist candidates; it cannot promote a signal.
- Validation uses only the predeclared candidate catalog and baseline definitions. The number of tests is frozen before results are inspected and used in multiplicity correction.
- Holdout is evaluated once after candidate and settings are frozen. Prospective is evaluated only on genuinely new contests.
- Report for every candidate: family/config ID, frozen config, eligible N, skipped targets and reasons, candidate hits/rate, paired baseline hits/rate, absolute difference, paired discordant counts, uncertainty interval, adjusted p-value/threshold, per-period results, coverage, dataset SHA-256, code revision, split boundaries, and warnings.
- Do not call a signal active from a historical validation result alone. Ledger updates remain a separately audited action.

## Known limitations / next implementation

This contract specifies outcomes; the executable walk-forward scorer is the next code step. Until that scorer and its synthetic tests exist, the 100-candidate plan is not ready to be run against the user's historical file. No TRIS data has been analyzed by this protocol.
