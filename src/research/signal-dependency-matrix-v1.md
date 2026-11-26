# Signal dependency matrix v1

Pairwise signal analysis with explicit distinctions:

- Structural overlap: shared configuration/component and shared-input labels with Jaccard similarity.
- Empirical dependence: alerts joined by identical target IDs, Phi coefficient, and seeded permutation test.
- Temporal stability: matched records ordered by target ID, divided into contiguous blocks; blockwise Phi and fraction of nonzero blocks matching full-sample Phi direction.
- Conservative labels: insufficient, structural-only, empirical-dependence, no-dependence-detected.

Defaults: 40 matched targets, 500 permutations, |phi| >= 0.30, permutation p <= 0.05. Exploratory thresholds only. Pairwise tests are not adjusted for multiple comparisons; classifications are provisional. Blockwise direction consistency is descriptive and does not prove stable dependence. "No dependence detected" does not establish independence.

No auto-weighting, signal removal, predictions, or edge claims. Caller-supplied data must be frozen and aligned before use; this generic v1 is not yet wired to the prospective ledger.
