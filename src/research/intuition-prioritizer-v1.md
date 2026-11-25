# Intuition Prioritizer v1

The prioritizer applies a transparent, outcome-blind research scheduling heuristic to candidate hypotheses.

## What the score means
Scores reflect ease of interpretation and initial experiment priority only: lower lags, shorter absence strata, smaller pools, moderate initial windows, and simple frequency methods are preferred as starting points. Scores are **not** probabilities, performance forecasts, or evidence of an edge.

## Allocation
Candidates are scored within family and selected in round-robin order across transition, position-mutation, absence-return, and pool-ranking families. This prevents the pool catalog (1,000 default candidates) from monopolizing a small first research budget. Users can set a total budget, family order, and family caps. Candidates not selected remain in the skipped catalog; they are not discarded.

## Guardrails
- Selection is deterministic and does not use draw outcomes.
- Budget and family caps are set before result evaluation.
- The selector must not be rerun after observing results to retroactively change the selected set.
- A selected candidate is still only a hypothesis. It requires chronological evaluation, baselines, and separately frozen prospective evidence before any promotion.
- All scores and allocation reasons are returned for audit.
