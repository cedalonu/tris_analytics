# TRIS research roadmap — phases 13–15

## Phase 13 — observed prospective family-concordance audit
Compare observed prospective family concordance from frozen local forecasts and resolved outcomes with synthetic null envelopes. This is a descriptive stress comparison, not a p-value or confirmatory test. It uses only the local prospective ledger and never reconstructs missed contests.

## Phase 14 — temporal stability of family concordance
Split the observed prospective horizon into fixed consecutive contest blocks (default 25). For every family pair, report common support, within-block correlation, direction agreement, positive/negative/mixed/underpowered blocks, dispersion, and longest directional runs. Partial final blocks are flagged; missing observations are not imputed. No p-values, automatic promotion, or changes to candidates, weights, forecasts, or ledger. Uses only the local prospective ledger; no APIs.

## Phase 15 — rolling-window prospective concordance
Add overlapping, full-length chronological windows to expose short-term changes that can be hidden by fixed non-overlapping blocks. Window size, step, and minimum common support are configurable. Incomplete trailing windows are omitted; missing family observations are not imputed. Overlapping windows are explicitly treated as dependent descriptive summaries, not independent trials or inferential evidence. No p-values, promotion, or portfolio/forecast changes. Local prospective ledger only; no APIs.

 
## Phase 16 — persistence of individual prospective signals
Evaluate each frozen candidate against its own paired baseline across consecutive, non-overlapping prospective blocks. Report resolved coverage, hit and baseline counts, block differences, positive/negative/neutral/underpowered blocks, directional runs, and a descriptive consistency label. Missed forecasts are not reconstructed; pending and unforecasted opportunities remain separate. Minimum block support is configurable. No p-values, automatic selection, promotion, or weight/portfolio changes. Local prospective ledger only; no APIs.
