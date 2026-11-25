# TRIS cross-family concordance v1

## Purpose
Provide one index of descriptive findings from interaction, adaptive memory, regime memory, temporal transitions, and contextual memory for each position/digit pair (50 targets).

## Rules
- A family marker is added only when that module's fixed reporting threshold is crossed.
- A family contributes at most one marker per position/digit; details preserve the individual contexts.
- Adaptive and regime markers retain their historical monitoring status.
- Temporal and contextual screens are exploratory all-history summaries; they are not counted as independent validation.
- Contradictions are shown explicitly. The module does not average, weight, rank, or forecast digits.
- Absence is shown only as context and never interpreted as a digit being due.

## Offline command
`npm run research:concordance -- ./data/Tris.csv`

Outputs Markdown and JSON with the exact input CSV SHA-256. No API, network, polling, or automatic download is used.

## Interpretation
`multi-family` means at least two descriptive families crossed their screens. It does not mean two independent confirmations. `conflicting` means the historical summaries disagree or contain both favorable and unfavorable regime blocks. Prospective frozen tests remain necessary.
