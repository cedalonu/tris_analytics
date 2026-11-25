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


## First historical pool-matrix execution (2026-11-25)
- Retrieved and audited the current upstream TRIS CSV: 25,960 rows; CONCURSO 11033–36992; dates 2007-09-03–2026-11-24; zero duplicate CONCURSO IDs, gaps, or invalid digits.
- Snapshot FNV-1a fingerprint (non-cryptographic): cb409306.
- Ran focused 800-combination walk-forward matrix: five positions × five methods × pool sizes 1–8 × four windows (20/50/100/200), first 100 draws training and 25,860 later draws evaluated.
- Report and full CSV are saved in branch: `pool-method-matrix-results-2026-11-25.md` and `pool-method-matrix-results-2026-11-25.csv`; fetched again to verify saved content.
- Discovery suggests long-absence pools are the strongest recurring candidate relative to rolling frequency in some positions, especially position 5, but the differences are small and selection-biased. No candidate is confirmed or suitable for betting based on this.
- Important duplication found: `frequency` and `recent-frequency` use the same trailing-window digit counts in the current core, so they produce identical pools; keep both names for compatibility but investigate consolidation.
- Local execution of TS tests remains unverified; this statistical matrix was run directly in the analysis environment using a separate optimized calculation and independently reimplemented method definitions. Results should be reconciled with the TypeScript implementation before treating them as canonical.


## Follow-up code review correction (2026-11-25)
- Found a conceptual duplicate: `frequency` and `recent-frequency` previously both ranked counts from the trailing window.
- Corrected `src/research-core.ts`: `frequency` now uses all prior history; `recent-frequency` uses the configured trailing window. Absence/balanced methods continue to use their existing windowed statistics.
- Added a unit test asserting distinct pools on a constructed history.
- Prior pool matrix/report is explicitly marked pre-correction and requires a fresh rerun to reconcile. The prior shortlist is provisional and should not be used as validated evidence.
- Test execution is still unverified; GitHub Actions and local TS runtime were not confirmed.


## CI dependency issue and fix (2026-11-25)
- GitHub Actions failed before TypeScript/tests: npm ERESOLVE, because Vite 8.3.8 requires optional peer esbuild `^0.27 || ^0.28`, while project declared `^0.25.0`.
- Updated `package.json` devDependency esbuild to `^0.28.2` to align peer requirement. Awaiting the new workflow run to confirm installation, typecheck, and tests.
