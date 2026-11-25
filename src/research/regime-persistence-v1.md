# TRIS persistence and reversion screening v1

## Method
The first 50 contests form a fixed reference distribution. The remaining contests are split into non-overlapping blocks of 10. Each block is compared with the same reference for five positional distributions, pool-size distribution, duplicate-position-pair rate, and ten positional-pair joint distributions.

## Labels
- `persistent`: at least two consecutive blocks cross the watch threshold (TV >= 0.20 or JS >= 0.08).
- `transient`: an isolated watch block is followed by a block that no longer crosses the watch threshold.
- `reverted`: after a watch, a later block returns to TV <= 0.10 from the original reference.
- `no-sustained-shift`: no watch sequence was found.
- `insufficient-history`: fewer than 50 reference contests, or no post-reference block.

When persistence and a later return both occur, the pattern label remains persistent, and the return block index is reported separately. The index is zero-based.

## Safeguards
These are retrospective descriptions of observed blocks, not statistical tests or predictions. Thresholds are screening effect sizes, not calibrated false-alarm rates. Multiple correlated features are inspected. A label must not change pool choices or candidate weights without separate chronological and prospective evaluation.

## Offline use
`npm run research:persistence -- ./data/Tris.csv`

Reads only the local CSV supplied by the operator and writes Markdown/JSON reports. No APIs or automatic downloads.
