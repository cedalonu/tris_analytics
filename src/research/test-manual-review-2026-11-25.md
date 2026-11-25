# Manual review of research experiment tests — 2026-11-25

## Scope
Code review of the authored test file, evaluator, experiment helper, runner, package script, and CI workflow. This is source inspection only, not a runtime test.

## Review findings
- Prize-tier matching tests correspond to the evaluator target extraction rules (full five digits, last 4/3, first/last 2, first/last digit).
- Crafted all-tier accounting sample uses result 00421 and matching proposals; expected gross total $55,610 MXN and eight tickets ($8 cost) reconcile to $55,602 net.
- Duplicate portfolio batch assertion matches evaluator behavior: duplicate batches are counted as separately submitted tickets and emit a warning containing 'duplicate portfolio batch'.
- Missing-result batches are skipped and counted, as the test expects.
- Random baseline runner creates equal ticket counts per draw and uses the evaluator for accounting; aggregation groups by mode and ticket count across seed replicates.
- The theoretical direct5 expectation under the supplied payout reference is 1/100,000 probability, $0.50 gross expected value, and -$0.50 net expected value for a $1 ticket.
- Split helper preserves input order and validation helper checks strictly ascending, unique draw IDs plus a 100-draw minimum. Test inputs meet these assumptions.

## Limitations / not verified
- TypeScript compilation and Node test execution remain unverified because the environment cannot clone/fetch the repository through local network access.
- CI workflow execution has not been observed.
- Tests do not yet validate every malformed input, statistical interval, or random generator distribution quality. Seeded random baseline is a reproducibility benchmark, not evidence of predictive advantage.
- splitValidatedDraws validates ID ordering/uniqueness and sample size, but assumes digit/date/source validation has already been performed by the caller.

## Conclusion
No obvious assertion-to-implementation mismatch was found in this manual source review. This should not be interpreted as a passing test suite. Next step remains obtaining an actual CI or local execution result, fixing any errors, and only then running historical experiment evaluation.
