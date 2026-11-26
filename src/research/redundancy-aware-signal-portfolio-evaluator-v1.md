# Redundancy-aware signal portfolio evaluation v1
- Selectors are frozen by discovery scores and grouping metadata: utility rank, empirical-diversity, structural-diversity, random controls.
- Evaluation OR-combines alerts from selected signals on a target. Reports alert count, hits, precision, recall, baseline prevalence, lift, false-alert fraction, coverage and precision difference versus base rate.
- Chronological validation, holdout, prospective phases and equal-size blocks are summarized separately.
- No model p-values, confidence intervals, profit estimates or predictive claims are produced. Dependence across targets/signals means blocks are descriptive.
- Caller must provide aligned alerts and target outcomes and certify that every alert was generated before the target outcome; the module cannot independently validate timing.
- Do not tune selection, penalties, utility or groups on holdout. Historical holdout is not a substitute for prospective evidence.
