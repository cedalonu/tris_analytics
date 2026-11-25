# Research core test status — 2026-11-25

## Tests authored
`portfolio-experiment.test.ts` now includes test cases for:
- 60/20/20 chronological split and split validation
- strictly ascending unique draw IDs and minimum 100 draws
- reproducible random portfolio generation, ticket digit length, and zero preservation
- target extraction and match recognition for all seven ticket modes
- prize/cost/net/ROI reconciliation for a crafted all-tier example
- invalid tickets and missing result batches
- duplicate portfolio batches
- equal-budget random baseline output and seed aggregation
- deterministic baseline repeats
- theoretical direct5 expected value under the supplied payout table

## Automation added
- `npm run test:research`: run research tests using `tsx --test`.
- GitHub Actions workflow `research-checks.yml`: install dependencies, run TypeScript type check (`npm run lint`) and research tests on pushes/PRs to `research-core-v1` affecting relevant files.

## Execution status
- Files and workflow saved to branch and re-fetched for content verification.
- Local execution unavailable in this environment: attempting to clone the public repository failed because the environment could not resolve `github.com` (DNS/network restriction).
- GitHub Actions run was not visible/confirmed during this check; the API returned zero workflow runs for the branch. Therefore the authored tests are NOT marked passing.
- No `npm run lint`, `npm run test:research`, or build results are claimed.

## Next action
Run the workflow in GitHub or locally in a connected checkout. Resolve any failures, then use test output to proceed to historical data experiment execution.