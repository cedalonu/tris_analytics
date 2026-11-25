# Prospective pool validation protocol v1 — frozen candidates

## Why prospective
The historical matrix was a discovery search over many configurations. Its best-looking results are selection-biased and must not be presented as confirmation. New draws will be evaluated with settings frozen before each result is observed.

## Primary candidate families (frozen)
All four windows (20, 50, 100, 200) are retained for each family. Primary summary is the average paired hit difference across the four windows, not the best window chosen after seeing results.
1. Position 5 — long-absence — pool size 2.
2. Position 3 — long-absence — pool size 8.
3. Position 1 — short-absence — pool size 7.

## Secondary exploratory families (also frozen, reported separately)
- Position 5 — long-absence — pool sizes 1, 3, 4, 5.
- Position 2 — long-absence — pool size 2.
- Position 2 — short-absence — pool size 4.
- Position 4 — long-absence — pool size 6.
- Position 3 — long-absence — pool size 7.

Do not move secondary candidates to primary based on accumulating prospective outcomes. If changing the candidates or methods, version the protocol and start a new prospective period.

## For each new draw
1. Validate the source result and draw ID.
2. Before revealing/using target digits, generate pool sets using only previous draws.
3. Save the prediction timestamp, source snapshot/version, draw ID, position, method, size, window, pool digits, and rolling-frequency baseline digits.
4. After the result, record target digit and pool hit, baseline hit, paired difference.
5. Do not retroactively alter pool outputs.
6. Report all primary families/windows, cumulative outcomes, and uncertainty; secondary families are clearly labeled exploratory.
7. At intervals, compare against k/10 uniform inclusion and rolling-frequency baseline.

## Stop/interpretation rules
- No claim of predictive advantage until an adequate prospective sample exists; the sample-size plan should be set before analysis and not stopped when results look favorable.
- Results may be consistent with chance. Lottery outcomes remain random; these tests do not guarantee winnings.
- Approximate paired intervals are descriptive; account for serial dependence and multiplicity in any formal inference.

## Data-log template
See `pool-prospective-log-template-2026-11-25.csv`. One row per position/method/size/window/draw. Generate pool sets before the draw; complete target and hit columns only after result verification.
