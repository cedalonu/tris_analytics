# Draw evolution and game-mode research — specification v1

## Objective
Study how draw outcomes evolve relative to draw -1, -2 and -3: exact outcome transitions, digit changes by position, repeats, modular ±1 movements, and the distinct requested game modes. The goal is to discover and prospectively test stable tendencies—not to claim certainty or guess a single winning combination.

## Modes supported
- Full 5 digits (preserve leading zeroes).
- Last 4 digits.
- Last 3 digits.
- First 2 digits.
- Last 2 digits.
- First + last digit.

## Lag comparisons
Every mode and position is measured against lag 1, 2 and 3 separately. For each position record: same digit, +1 modulo 10, -1 modulo 10, modulo change histogram, and circular absolute change. For each mode record observed transitions and conditional support/rate.

## Candidate proposals, not single-answer predictions
Where history supports a transition context, rank multiple candidate outcomes. Report sample support, frequency and conditional rate; do not hide low support. Candidate portfolio should be diversified by overlap and should be evaluated at fixed portfolio sizes/costs. Compare against uniform/random and frequency-only baselines. Over time, retain only proposal counts/strategies whose prospective results justify them; never reduce proposals solely because a retrospective pattern looked good.

## Evaluation requirements
1. Strict chronology: forecast at t uses only draws before t.
2. Rolling walk-forward; train/validation/test separation, preferably nested.
3. Evaluate each mode separately because outcome spaces and prize structures differ.
4. Score hit tiers (exact mode match and partial match where the official rules define them), expected return only with verified prize/cost rules.
5. Track hit rate, hit distribution, coverage, candidate count, cost, prize tier, net return, uncertainty intervals, baseline comparison, and prospective results.
6. Control multiple testing; mark exploratory findings as exploratory.
7. Keep a knowledge log including failed ideas and degradation.

## Interpretation cautions
Digit transitions have small conditional contexts and can be sparse, especially for 5-digit exact outcomes. A repeated historical transition is not proof it will recur. Absence is descriptive, not evidence that a digit is due. Candidate sets can improve coverage mechanically by increasing their size; normalize for number of proposals and spend.

## Version
v1 experimental research specification. Not integrated into production UI or prediction engine; requires code/build validation and backtesting.