# Manual verification checklist — experiment runner v1

Not executed yet. Checklist is a planned test suite; do not read it as passing test evidence.

## Chronological split
- [ ] Default 60/20/20 split boundaries are floor-based and preserve chronological ordering.
- [ ] Custom fractions reject non-finite, zero/negative, or sums >= 1.
- [ ] Draw-specific wrapper rejects duplicate or descending draw IDs.
- [ ] Draw-specific wrapper rejects fewer than 100 draws.
- [ ] Empty or short generic split behavior is documented; caller uses validated input.

## Random generator
- [ ] Same mode, count, seed, and draw ID produce exactly the same strings.
- [ ] Different seeds produce distinct portfolios in representative test cases.
- [ ] Output string length matches mode (5, 4, 3, 2, or 1).
- [ ] Every output preserves zeroes (e.g. `00421` remains five characters).
- [ ] Count 0 and negative/invalid counts safely produce no tickets.

## Accounting integration
- [ ] A crafted matching result is a hit for each ticket mode and prize tier.
- [ ] A nonmatching ticket is charged and receives zero gross prize.
- [ ] Gross prize, cost, net, and ROI reconcile exactly.
- [ ] Invalid tickets are excluded from cost and reported.
- [ ] Duplicate proposals count as separate paid tickets per evaluator policy.

## Baseline output
- [ ] Every draw receives exactly the requested number of tickets for the mode.
- [ ] Aggregate seed summaries match raw replicate rows.
- [ ] Same seed set, draw data, mode and budgets reproduce output.
- [ ] No future draw data are used in a strategy's candidate generation (baseline only evaluates generated random tickets).

## Release gate
- [ ] TypeScript lint (`npm run lint`) succeeds.
- [ ] Automated tests or a verified test harness execute all items above.
- [ ] Data source snapshot/fingerprint and time boundaries recorded.
- [ ] Official prize rules are verified before real-money accounting.