# Collective TRIS behavior analyzer v1

The collective analyzer studies the five-digit draw as a joint object rather than five unrelated positions. It is descriptive and offline; it does not make predictions and does not fetch results.

## Run locally

```bash
npm run research:collective -- ./data/Tris.csv
```

Optional output directory:

```bash
npm run research:collective -- ./data/Tris.csv ./reports/my-collective-run
```

The runner requires the local CSV schema already supported by the TRIS adapter, rejects invalid rows and contest-ID gaps, and writes:
- `collective-behavior.md`: readable summary;
- `collective-behavior.json`: full metrics plus SHA-256 of the exact CSV input.

Reports are local artifacts; they are not committed automatically.

## Measurements

For trailing windows of 5, 10, 20 and 50 contests:

1. Ordered outcomes: number of distinct five-digit strings, preserving leading zeroes.
2. Unordered pools: number of distinct digit sets after sorting and deduplication within each draw.
3. Pool-size distribution: frequency of draws containing 1, 2, 3, 4 or 5 distinct digits.
4. Mean distinct digits and duplicate-position-pair rate.
5. Shannon entropy per position, in bits.
6. Strongest cross-position pair associations. Observed joint counts are compared with the independence expectation calculated from the two positions' empirical marginal frequencies. Lift is descriptive, not a significance test.

For lags -1 through -5, the analyzer aggregates all 25 source-position / target-position combinations and reports:
- same-digit rate;
- mean circular digit distance on the 0–9 ring;
- most common source-digit to target-digit moves.

## Interpretation safeguards

- Pair lift can be high by chance, especially with short windows and many tested combinations.
- A high co-occurrence is not automatically a predictive signal or causal relationship.
- Lag migration pools together 25 position pairs and must not be interpreted as a single positional transition.
- The windows 5/10/20/50 overlap and are not independent samples.
- Any candidate derived from these summaries must be specified before testing, evaluated with strict chronological walk-forward splits, corrected for multiple comparisons, and confirmed prospectively.

The analyzer is a measurement layer for the intuition engine, not a strategy selector.
