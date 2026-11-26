# Redundancy-aware signal portfolios v1

## Goal
Compare portfolio composition under four outcome-blind selectors while holding
portfolio size constant: utility-ranked, empirical-diversity, structural-diversity,
and random controls. Utility values must be frozen from a discovery-only process.

## Selectors
- **Utility-ranked:** highest frozen utility; ignores group membership.
- **Empirical-diversity:** greedy utility minus a configurable penalty for each
  already-selected signal sharing a qualified empirical redundancy group.
- **Structural-diversity:** same greedy mechanism but uses structural groups only.
- **Random:** deterministic seed-based selection control.

Tie-breaking is lexical by signal ID. The penalty is a transparent heuristic,
not a fitted coefficient. All methods use the same candidate catalog and requested
budget. The selector does not access draw outcomes.

## Composition metrics
- Mean utility retained.
- Count and fraction selected that belong to empirical groups.
- Empirical group coverage (unique grouped members represented).
- Count and fraction selected that belong to structural groups.
- Structural group coverage.
- Maximum selected members in any empirical group.

Metrics describe composition only. Group memberships can overlap, and connected
components can be transitive. Structural overlap is not empirical dependence.

## Required evaluation protocol
1. Freeze signal catalog, group matrix, utility scores, penalty and portfolio sizes
   using discovery data only.
2. Generate the portfolios and random controls with recorded seeds.
3. Evaluate each portfolio on chronological validation, holdout and prospective
   data only through the separate evaluation engine.
4. Compare equal-size portfolios and include random controls; report uncertainty
   and block stability. Do not treat individual signals as independent trials.
5. Keep all methods, including low-performing variants, in the audit log.

## Interpretation guardrails
This is a portfolio-composition experiment. It does not guarantee lottery outcomes,
make any number more likely, or provide a predictive edge. It does not prune,
promote, or reweight signals automatically. If validation or holdout is null or
negative, record that without tuning against it.
