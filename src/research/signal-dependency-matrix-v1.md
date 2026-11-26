# Signal dependency matrix v1

This utility builds a pairwise matrix for signal alert streams.

- **Structural overlap:** shared component/configuration labels and shared declared inputs, with Jaccard overlap.
- **Empirical dependence:** alerts joined by identical target IDs, phi correlation, and a seeded permutation test.
- **Conservative labels:** insufficient, structural-only, empirical-dependence, or no-dependence-detected.
- **No automatic action:** the matrix does not change signal weights, eliminate signals, predict digits, or establish edge.

Defaults: 40 matched targets, 500 permutations, |phi| >= 0.30, permutation p <= 0.05. These are exploratory screening thresholds, not calibrated guarantees. Pairs tested simultaneously are not adjusted for multiplicity in v1; interpret classifications as provisional and use a family-level correction before confirmatory conclusions. "No dependence detected" is not evidence of independence.

Inputs are caller-supplied, frozen alert records, structural components, and shared data-input labels. This module is generic and not yet wired to a live prospective ledger.
