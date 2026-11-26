# Signal evidence gate v1

The signal evidence evaluator is a transparent readiness checklist, not a predictive model or betting recommender.

## Evidence states
- **exploratory**: historical or synthetic evidence. Never eligible for prospective validation-ready state.
- **pending**: prospective data are incomplete or minimum coverage/sample requirements are not met.
- **validating**: prospective evidence exists, but one or more gates remain.
- **validation-ready**: all configured gates pass; this is not proof of an edge and does not auto-promote the hypothesis.
- **rejected**: data integrity is invalid.

## Default gates
- Coverage >= 80%
- Resolved sample >= 100
- Positive paired improvement against a frozen baseline
- Multiple-testing adjustment documented
- >= 5 temporal blocks with >= 60% direction consistency
- >= 80% parameter-sensitivity consistency
- >= 2 independent method families

All thresholds are configurable and must be frozen before evaluation. This v1 does not provide confidence intervals or significance tests; adjusted-testing status is supplied externally and must not be inferred. Missing inputs remain blockers, never imputed.

## Interpretation
The report exposes raw coverage, resolved sample, baseline difference, temporal consistency, sensitivity consistency, independent-family count, and blockers. Historical backtests, synthetic simulation and prospectively resolved outcomes remain separate evidence origins. A validation-ready report means review gates are met, not a proven prediction advantage.
