# TRIS adaptive signal memory v1

## Purpose
Track the time evolution of interaction rules selected by the existing discovery-only interaction screen. The memory describes whether a rule is emerging, strengthening, persistent, weakening, dormant or unstable.

## Frozen evaluation sequence
1. Run the interaction engine on the supplied contiguous local CSV.
2. Retain only the rules selected from the first 60% discovery slice.
3. Rebuild their feature streams using information available strictly before each target contest.
4. Monitor the following 20% validation and final 20% holdout separately.
5. Divide each phase into non-overlapping chronological blocks of 25 target contests. A final partial block is included only when it has at least 10 rows.

## Block score
For each block and selected rule, record active support, hits, conditional hit rate, empirical position-digit baseline rate, and the best individual component rate.

A block is favorable only when:
- at least 5 target rows activate the full rule;
- its hit rate exceeds the block baseline by at least 2 percentage points;
- its hit rate is not below the best individual component.

A negative block is at least 2 percentage points below baseline. Other supported blocks are neutral. Insufficient active support is not interpreted as a negative result.

## State machine
- emerging: one favorable block.
- strengthening: at least two consecutive favorable blocks and the latest baseline advantage increased.
- persistent: at least two consecutive favorable blocks without that increase.
- weakening: a negative block follows earlier favorable evidence.
- dormant: the latest block lacks enough activations after earlier favorable evidence.
- unstable: favorable evidence occurred but was not maintained.
- unobserved: no repeated favorable evidence.

These labels are descriptive monitoring states, not statistical significance or calibrated probabilities. They do not promote the hypothesis ledger or alter forecast weights.

## Limits
- Candidate rules are selected from discovery; validation and holdout are later chronological checks.
- The same target contest contributes to multiple correlated position-digit streams.
- Small block support makes rates volatile; active counts must always accompany rates.
- Repeatedly inspecting many rules still creates selection bias. Future prospective monitoring is required before predictive interpretation.
- No APIs, network access, polling, or automatic result downloads are used.
