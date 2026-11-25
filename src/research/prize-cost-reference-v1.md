# Ticket cost, prize and portfolio accounting — reference v1

User-provided reference values, to be checked against official TRIS rules before financial conclusions:

| Mode | Exact match | Prize (MXN) | Ticket cost (MXN) |
|---|---|---:|---:|
| Directa 5 | All 5, exact order | 50,000 | 1 |
| Directa 4 | Last 4, exact order | 5,000 | 1 |
| Directa 3 | Last 3, exact order | 500 | 1 |
| Par inicial | First 2, exact order | 50 | 1 |
| Par final | Last 2, exact order | 50 | 1 |
| Inicial | First digit | 5 | 1 |
| Final | Last digit | 5 | 1 |

## Accounting protocol
- One ticket costs MXN $1. A proposal submitted in a mode is one ticket; same proposal repeated is charged again.
- Record valid tickets, winning tickets, gross prizes, ticket costs and net profit/loss separately per draw and per mode.
- ROI on cost = (gross prize - ticket cost) / ticket cost. Report return and net separately to avoid ambiguity.
- If multiple modes are played, count the cost of every ticket separately. A single number proposal across modes is not automatically one ticket.
- Do not count a proposal as a ticket unless it was recorded before the draw.

## Uniform theoretical baseline (assumptions)
Under uniform independent digits and exact-match rules, exact probabilities are 1/10^k for a k-digit match. Using the user-provided prizes, each listed mode yields a theoretical gross expected payout of MXN $0.50 per $1 ticket and net expected value of -$0.50 per ticket before other effects. This is a mathematical reference only, not a forecast of a specific ticket. Confirm official rules and payout treatment.

## Portfolio reporting
Report total tickets, cost, winners, gross prizes, net, ROI, per-mode and per-draw summaries, proposal counts, and hit-tier distribution. Evaluate strategy prospectively and compare with random/frequency baselines with equal ticket counts and cost. Retrospective results alone cannot validate strategy.

## Limitation
This module accounts for tickets supplied to it; it does not generate picks or calculate official prize eligibility beyond the exact matching definitions above. It is experimental and not yet integrated or build-tested.