# Portfolio selector audit — 2026-11-25

## Changes made
- Audited existing experimental `portfolio-selector.ts` on `research-core-v1`.
- Hardened selection: invalid/non-finite score/support are filtered; quota counts normalize finite values; overlap ceiling clamps to [0,1] with a warning note; duplicate proposals are tracked across repeated quotas for the same mode.
- The selector remains mode-specific and greedy: score descending, support descending, proposal string ascending; no auto-relaxation of diversity constraints.

## Manual code-level checks (not runtime tests)
- Leading-zero proposal strings remain strings; validation delegates to `ticketValid` and does not parse numbers.
- Mode quotas are processed independently; duplicate suppression is scoped to the same mode.
- Overlap uses positional equality fraction and rejects only when overlap is strictly greater than the ceiling.
- Non-finite count values normalize to 0 requested; finite negative counts also normalize to 0.
- Empty/undersized candidate sets return fewer tickets and are not silently filled.
- Invalid proposals with malformed string/length or non-finite score/support are not selected.

## Remaining risks / next tests
- No TypeScript build, lint, or automated tests have been run; the module is not yet integrated into the app UI.
- Runtime test suite should cover 7 modes, zeros at the start, threshold edge cases (0, 0.5, 1), score/support ties, repeated quotas, duplicate mode proposals, non-finite inputs, and quota normalization.
- Candidate score calibration and historical advantage remain unproven; compare equal-cost portfolios with random/simple baselines in strict chronological and prospective evaluation.
- Selector has no global portfolio cost budget or cross-mode allocation optimization yet; quotas are explicit input, not auto-optimized.

## Status
Experimental utility hardened and committed to branch only. No claim of predictive improvement or production readiness.