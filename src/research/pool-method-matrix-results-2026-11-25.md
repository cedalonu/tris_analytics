# TRIS — Exploratory pool-method matrix results (2026-11-25)

## Data provenance and audit
- Source CSV: https://raw.githubusercontent.com/pakinja/pakin/master/Tris.csv
- Snapshot fetched: 2026-11-25 (tool session)
- Rows: 25960; CONCURSO range 11033–36992; dates 2007-09-03–2026-11-24.
- Duplicate CONCURSO IDs: 0; gaps in CONCURSO: 0; digit-validation errors: 0.
- Snapshot FNV-1a fingerprint (non-cryptographic): cb409306.
- Input sorted ascending by CONCURSO before walk-forward.
- Training prefix: first 100 draws. Evaluated draws: 25860, from 11133 to 36992.
- Matrix here is 800 combinations: 5 positions × 5 methods × pool sizes 1–8 × 4 windows (20/50/100/200). Pool sizes 9 and 10 excluded from this focused report because 90–100% coverage is less useful for comparing discrimination; the code's full default matrix still includes them.

## Methods and reference
Candidate methods: frequency, long-absence, short-absence, balanced, recent-frequency. Benchmarks: uniform k/10, fixed-frequency pool from the first 100 draws, and rolling-frequency pool on the same trailing window. Only prior draws are used for each target.

## Exploratory shortlist (selection from a large search; NOT confirmatory)
1. **P5-long-absence-k2** — average hit rate across four windows 20.667%; average lift vs k/10 1.0334; mean paired difference vs rolling frequency 0.754 percentage points; positive in 4/4 windows; approximate paired CI lower bound above 0 in 2/4 windows.
2. **P5-long-absence-k5** — average hit rate across four windows 50.603%; average lift vs k/10 1.0121; mean paired difference vs rolling frequency 0.728 percentage points; positive in 4/4 windows; approximate paired CI lower bound above 0 in 0/4 windows.
3. **P5-long-absence-k3** — average hit rate across four windows 30.715%; average lift vs k/10 1.0238; mean paired difference vs rolling frequency 0.669 percentage points; positive in 4/4 windows; approximate paired CI lower bound above 0 in 1/4 windows.
4. **P3-long-absence-k8** — average hit rate across four windows 80.588%; average lift vs k/10 1.0073; mean paired difference vs rolling frequency 0.661 percentage points; positive in 4/4 windows; approximate paired CI lower bound above 0 in 1/4 windows.
5. **P5-long-absence-k4** — average hit rate across four windows 40.692%; average lift vs k/10 1.0173; mean paired difference vs rolling frequency 0.555 percentage points; positive in 4/4 windows; approximate paired CI lower bound above 0 in 0/4 windows.
6. **P5-long-absence-k1** — average hit rate across four windows 10.356%; average lift vs k/10 1.0356; mean paired difference vs rolling frequency 0.511 percentage points; positive in 4/4 windows; approximate paired CI lower bound above 0 in 2/4 windows.
7. **P1-short-absence-k7** — average hit rate across four windows 70.517%; average lift vs k/10 1.0074; mean paired difference vs rolling frequency 0.427 percentage points; positive in 4/4 windows; approximate paired CI lower bound above 0 in 0/4 windows.
8. **P2-long-absence-k2** — average hit rate across four windows 20.098%; average lift vs k/10 1.0049; mean paired difference vs rolling frequency 0.337 percentage points; positive in 4/4 windows; approximate paired CI lower bound above 0 in 0/4 windows.
9. **P2-short-absence-k4** — average hit rate across four windows 40.259%; average lift vs k/10 1.0065; mean paired difference vs rolling frequency 0.305 percentage points; positive in 4/4 windows; approximate paired CI lower bound above 0 in 0/4 windows.
10. **P4-long-absence-k6** — average hit rate across four windows 60.414%; average lift vs k/10 1.0069; mean paired difference vs rolling frequency 0.288 percentage points; positive in 4/4 windows; approximate paired CI lower bound above 0 in 0/4 windows.

## Best individual settings by position (pool size 1–8)
- Position 1: balanced, pool 8, window 50; 80.429% vs uniform 80.0%; paired difference vs rolling 0.027 pp; CI [-0.266, 0.320] pp.
- Position 2: frequency, pool 8, window 100; 80.302% vs uniform 80.0%; paired difference vs rolling 0.000 pp; CI [0.000, 0.000] pp.
- Position 3: long-absence, pool 8, window 20; 80.588% vs uniform 80.0%; paired difference vs rolling 0.994 pp; CI [0.243, 1.745] pp.
- Position 4: balanced, pool 8, window 50; 80.352% vs uniform 80.0%; paired difference vs rolling 0.120 pp; CI [-0.176, 0.415] pp.
- Position 5: balanced, pool 8, window 200; 80.696% vs uniform 80.0%; paired difference vs rolling 0.035 pp; CI [-0.200, 0.269] pp.

## Method-size summary (averaged across positions and windows)
- long-absence k2: mean hit 20.158%; mean lift 1.0079; paired difference vs rolling 0.165 pp; positive comparisons 14/20.
- long-absence k1: mean hit 10.068%; mean lift 1.0068; paired difference vs rolling 0.083 pp; positive comparisons 11/20.
- long-absence k5: mean hit 50.174%; mean lift 1.0035; paired difference vs rolling 0.151 pp; positive comparisons 12/20.
- long-absence k4: mean hit 40.138%; mean lift 1.0035; paired difference vs rolling 0.046 pp; positive comparisons 9/20.
- frequency k4: mean hit 40.092%; mean lift 1.0023; paired difference vs rolling 0.000 pp; positive comparisons 0/20.
- recent-frequency k4: mean hit 40.092%; mean lift 1.0023; paired difference vs rolling 0.000 pp; positive comparisons 0/20.
- long-absence k8: mean hit 80.152%; mean lift 1.0019; paired difference vs rolling 0.158 pp; positive comparisons 14/20.
- balanced k3: mean hit 30.052%; mean lift 1.0017; paired difference vs rolling 0.020 pp; positive comparisons 10/20.
- long-absence k6: mean hit 60.090%; mean lift 1.0015; paired difference vs rolling 0.010 pp; positive comparisons 11/20.
- balanced k4: mean hit 40.058%; mean lift 1.0015; paired difference vs rolling -0.034 pp; positive comparisons 8/20.
- frequency k6: mean hit 60.080%; mean lift 1.0013; paired difference vs rolling 0.000 pp; positive comparisons 0/20.
- recent-frequency k6: mean hit 60.080%; mean lift 1.0013; paired difference vs rolling 0.000 pp; positive comparisons 0/20.

## Important interpretation
- This is a **discovery matrix**, not proof of prediction. Selection among 800 combinations creates substantial multiple-comparison/selection bias.
- Rolling-frequency and frequency/recent-frequency pools use the same frequency ranking for the same window and size; their paired differences are zero by construction. They are duplicates, not independent methods. This should be consolidated in the code/report in a later refactor.
- Approximate paired normal intervals ignore serial dependence and multiplicity. Do not use nominal CI counts as confirmatory significance.
- Top hit rates at large pool sizes mostly reflect coverage (e.g., k=8 expected 80%); small percentage lifts are fragile.
- Historical data has already been explored in prior analyses; do not call any historical segment a pristine holdout.
- Next: shortlist a small number of configurations, freeze them and track prospective draws without retuning; compare with uniform and rolling-frequency baselines. No betting recommendation is made from these results.

## Calculation caveat / reproducibility
The matrix was computed with a separate optimized JavaScript implementation of the documented method definitions, not by executing the TypeScript research module (TypeScript test execution is still unavailable). Reconcile this independent run against the TypeScript module and CI before calling the report canonical. The full per-configuration CSV is included for reproducibility and review.


## Code reconciliation notice (2026-11-25 follow-up)
A code review found that `frequency` and `recent-frequency` were implemented identically in the TypeScript core: both ranked counts from the trailing window. The core has now been corrected so `frequency` ranks counts over all prior history while `recent-frequency` ranks counts over the trailing window. This means the matrix summarized above was calculated using the prior, duplicated definition and is **not reconciled to the corrected implementation**. The shortlist and method summaries must be treated as provisional historical exploratory output; rerun the matrix using the corrected TypeScript implementation (or a verified equivalent) before interpreting or retaining them. Tests for the distinction have been added but are not yet executed.
