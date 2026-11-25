# Research core test status — 2026-11-25

## Tests authored
`portfolio-experiment.test.ts` includes chronological 60/20/20 splits, validation, reproducible random portfolio generation, all seven ticket-mode match recognition, prize/cost accounting, invalid/missing/duplicate ticket batches, equal-budget random baseline and theoretical direct5 EV.

## Automation
- `npm run test:research`: runs research tests via `tsx --test`.
- GitHub Actions `research-checks.yml`: typecheck and tests for relevant branch pushes/PRs.

## Execution status
- Files were committed and fetched for content verification.
- Local execution unavailable here: GitHub clone failed due network/DNS restriction.
- GitHub Actions run not confirmed in the earlier check. Therefore tests are NOT marked passing.
- No typecheck, tests, or build results are claimed.

## Pool experiment progress
- Walk-forward comparison of pool candidates vs uniform k/10, fixed initial frequency, rolling frequency.
- Input validation added: position, min training, window, method names, pool sizes, draw validity, and strictly increasing IDs.
- Static fixed-frequency baseline hoisted from loop; counting optimized.
- Added `runPoolExperimentMatrix`, default 5 positions × 5 methods × 10 sizes × 4 windows = 1,000 parameter combinations (windows 20, 50, 100, 200).
- Added test coverage for validation and matrix expansion; protocol documents discovery/validation separation.
- Runtime execution remains unverified.
