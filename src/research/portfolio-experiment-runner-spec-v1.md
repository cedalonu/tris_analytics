# Random baseline runner specification v1

Status: implementation added; runtime/build tests not yet executed.

## Module
`portfolio-experiment-runner.ts`

## Behavior
- Generates independent uniform random ticket strings for each historical draw, modality, ticket budget, and seed.
- Reproducibility: draw-specific seed is derived from the requested seed XOR draw ID; same inputs reproduce the same portfolio.
- Repeated random tickets are allowed and charged separately, matching the declared baseline accounting policy.
- Uses the existing `evaluatePortfolio` prize/cost accounting module rather than reimplementing match logic.
- Summaries report ticket count, cost, gross prizes, net, hit count, draws with any winning ticket, average net per draw, ROI, and seed-run range of net.
- Aggregate output groups only by modality and ticket count; seed runs are retained for uncertainty/range inspection.

## Limits / safeguards
- This is a random benchmark, not a predictive method.
- It does not generate strategy candidates or evaluate them.
- Supplied draws must already be validated and chronological; this helper does not validate source data.
- A seed-run range is not a confidence interval. Use draw-level resampling or a predeclared statistical method for inferential comparisons.
- Payout rules are user-supplied references in the evaluator; verify official terms before financial decisions.
- Random tickets generated separately for each draw are retrospective benchmark tickets, not a prospectively submitted ticket history.

## Suggested first run
- One mode at a time to inspect output.
- Budget grid: 5, 10, 20 tickets per draw first, then 50 and 100 if computationally reasonable.
- Predeclare multiple seeds (e.g. 100, 200, 300, 400, 500) and preserve all outcomes.
- Compare any proposed strategy at equal ticket count and same draw sample.

## Verification status
- Source file was saved to the experimental branch and fetched back to verify contents.
- No compiler, unit test, or runtime execution has been performed yet.