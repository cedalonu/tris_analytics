# Signal redundancy groups v1

This module consumes the dependency matrix and forms deterministic connected components.

**Empirical groups:** only pairs with non-null Phi and BH-adjusted q-value at or below the configured q threshold, and |Phi| at or above threshold, form edges. Defaults are |Phi| >= 0.30 and q <= 0.05.

**Structural groups:** shared components or shared-input labels form a separate graph. These groups are never labeled empirically dependent.

**Temporal summary:** edge support is the fraction of nonzero block Phi values matching the full-sample Phi direction. Group support is the mean across its qualified edges. Supported (default >= 0.70) and fragile labels are descriptive, not evidence of future predictive value. No automatic signal weighting, pruning, or promotion.

Connected components can group signals transitively; A-B and B-C qualified does not imply A-C dependence. Direct pair evidence remains visible in edge lists. The module does not yet ingest the prospective ledger; callers must provide frozen/aligned matrices.
