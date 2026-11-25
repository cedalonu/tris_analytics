# TRIS regime-conditioned signal memory v1

## Purpose
Remember whether discovery-selected interaction rules have shown favorable blocks in distinct pool/duplicate regimes, and whether favorable episodes recur after interruptions.

## Past-only regime definition
For target contest t, inspect exactly the preceding 20 contests:
- pool breadth = mean number of distinct digits per contest: compact <=3, mixed >3 and <4, broad >=4;
- duplicate intensity = fraction of the 10 within-contest position pairs with equal digits: many duplicates >=20%, otherwise few duplicates.
The target contest is never used to classify its own regime.

## Evaluation
1. Freeze candidate rules selected by the interaction engine using discovery only.
2. Monitor only validation and holdout target contests.
3. Divide consecutive target rows within each regime into blocks of 25; omit a final fragment shorter than 10.
4. A favorable block requires at least 5 active rows and a rule hit rate >=2 percentage points above the unconditional position-digit baseline.
5. Reappearance means a favorable block after a non-favorable interruption, within the same regime.

## Interpretation limits
- A reappearance is descriptive and is not independent replication.
- Regime definitions are fixed heuristics, not learned or statistically validated clusters.
- Sparse activation, correlated features, overlapping histories, and repeated screening can produce unstable results.
- Validation/holdout remain historical checks; future prospective monitoring is needed.
- The module does not alter forecasts, candidate weights, or evidence-ledger states.

## Offline use
`npm run research:regime-memory -- ./data/Tris.csv`

No APIs, network access, polling, or automatic downloads are used.
