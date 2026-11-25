# Portfolio experiment protocol v1

Status: preregistration template / experimental. No experiment results are claimed.

## 1. Research question
Do ranking-based and diversity-controlled proposal portfolios show any reproducible improvement over simple baselines for the same TRIS modality and ticket budget? Can a smaller portfolio preserve the performance of a larger one without hindsight selection?

## 2. Official ticket modes under this study
- Directa 5 (5 digits in exact order)
- Directa 4 (last four digits)
- Directa 3 (last three digits)
- Par inicial (first two digits)
- Par final (last two digits)
- Inicial (first digit)
- Final (last digit)
Analyze each mode separately first. Cross-mode totals may be reported only as a separate budget allocation experiment and must not conceal a losing mode.

## 3. Chronological data design
- Development/discovery: earliest 60% of valid, unique, chronologically ordered draws.
- Validation: next 20%; use to select a small, predeclared set of strategy settings.
- Historical holdout: final 20%; only one evaluation after the strategy/configuration is frozen. Earlier holdout data used in prior reports are no longer untouched and must be labeled exploratory.
- Prospectively log forecasts before each future draw and append outcomes without rewriting forecasts.
- For each historical target draw, every candidate score and proposal must be computed using draws strictly earlier than the target. No target draw or future data may enter candidate generation.
- If chronological split proportions need changing, version the protocol before looking at evaluation results.

## 4. Baselines
- Uniform random portfolios: independently generated tickets, fixed seed recorded; duplicates permitted as separate paid tickets, unless a distinct no-duplicate baseline is also predeclared.
- Simple empirical-frequency baseline: rank digit strings/position digits using only prior data and clearly define method/window.
- Diversity-only baseline: candidates generated without predictive score, selected under same overlap constraint.
- Compare with equal ticket counts and equal total cost. Random baseline should be repeated across multiple predeclared seeds and summarize distribution, not cherry-pick a seed.

## 5. Portfolio budget grid
- Ticket count per modality: 5, 10, 20, 50, 100 (and larger only in a separate declared experiment).
- Cost: $1 MXN per ticket according to the user-provided reference; update if official rules differ.
- For each draw and modality, keep the count/cost identical across methods.
- Do not automatically optimize or reduce operational count based on retrospective best results; require prospective evidence.

## 6. Candidate/portfolio methods
- Frequency-based ranking (position-specific, window settings frozen before validation).
- Presence/absence-derived rankings, treated as hypotheses not due-number logic.
- Lagged transitions (lags 1, 2, 3) with minimum support; sparse-context smoothing only if separately specified.
- Pool-derived candidate sets and pool-size settings.
- Score-only ranking versus score + diversity constraint; sweep overlap ceilings only during discovery/validation.
- Hybrid portfolio only after component methods are documented and its construction frozen.

## 7. Outcomes to report
Per modality, per strategy, per budget, and per target draw:
- Number of tickets issued and invalid proposals.
- Hits by match tier, with exact mode definitions.
- Gross prizes, ticket cost, net, ROI, gross-return ratio.
- Number of draws with at least one win and distribution of hits per draw.
- Maximum and median overlap, unique-digit coverage per position (where applicable).
- Mean, median, standard deviation, and uncertainty interval across draws; report draw-level outcomes, not ticket rows as independent samples.
- Random-baseline distribution and difference versus baseline.
- Results stratified only by predeclared periods/regimes; avoid post-hoc slicing.

## 8. Selection and statistical guardrails
- Candidate generation is walk-forward and strictly past-only.
- Record all tested settings, including unsuccessful ones, to control researcher degrees of freedom.
- Use a correction or clearly conservative validation policy for multiple comparisons (e.g. Holm correction for predeclared tests); do not report uncorrected best-of-many as discovery.
- Use block/bootstrap or draw-level uncertainty methods where serial dependence may exist; avoid treating tickets from the same draw as independent.
- Report absolute differences and intervals, not only lift/ROI.
- No claim of edge unless performance is replicated in validation and prospective data with uncertainty compatible with a meaningful improvement.
- The lottery outcome may be random; past patterns do not guarantee future outcomes.

## 9. Frozen experiment record (required before run)
Record: protocol version; source URL; fetch timestamp; data fingerprint; row count; contest range; errors/warnings; train/validation/holdout boundaries; strategy version/commit; modes; budget; settings; random seeds; candidate-generation rules; metrics; correction method; start/end dates; and any deviations.

## 10. Portfolio-size reduction decision
Only consider reducing ticket count if all conditions are met:
- Prospective data is available over a predeclared minimum observation window (choose and record before collecting outcomes).
- Smaller portfolio is compared with larger portfolio and equal-cost/equal-budget baselines where relevant.
- Reduction does not rely only on one jackpot-tier outcome; lower tiers are reported separately, without implying they offset losses unless actual payout and cost accounting supports it.
- Evidence and uncertainty are documented; no configuration is selected after observing the evaluation period.
- Reduction is reversible and treated as a monitored experiment.

## 11. Reporting template
Data quality/provenance → split dates and IDs → method/config → budget → sample size → mode-specific outcomes → random/simple baseline → difference/interval → correction → caveats → decision (continue, revise, reject, or prospective monitor).

## 12. Limitations
The prize reference was supplied by the user and requires official verification before real-money decisions. The selector is heuristic; scores are not calibrated probabilities. This protocol does not establish predictive advantage, and no builds or automated tests are implied by documentation.