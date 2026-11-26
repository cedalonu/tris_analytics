# Signal dependency matrix v1.1

Pairwise signal analysis with explicit distinctions:

- Structural overlap: shared configuration/component and shared-input labels with Jaccard similarity.
- Empirical dependence: alerts joined by identical target IDs, Phi coefficient, and seeded permutation test.
- Multiple comparisons: Benjamini-Hochberg adjusted q-values across eligible pairwise tests (pairs with enough matched targets and a computable permutation p-value). Ineligible pairs are excluded from the adjustment and retain null q-values.
- Temporal stability: matched records ordered by target ID, divided into contiguous blocks; blockwise Phi and fraction of nonzero blocks matching full-sample Phi direction.
- Conservative labels: insufficient, structural-only, empirical-dependence, no-dependence-detected.

Defaults: 40 matched targets, 500 permutations, |phi| >= 0.30, adjusted q <= 0.05. These thresholds are exploratory. BH is a conventional FDR adjustment but may not guarantee control under arbitrary dependence between pairwise tests; consider a dependence-robust or max-statistic procedure if the alert streams themselves are strongly dependent.

Blockwise direction consistency is descriptive and does not prove stable dependence. "No dependence detected" does not establish independence. The permutation null assumes exchangeability for the shuffled alert stream.

No auto-weighting, signal removal, predictions, or edge claims. Caller-supplied data must be frozen and aligned before use; this generic module is not yet wired to the prospective ledger.
