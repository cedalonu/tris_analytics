# TRIS Analytics — empirical baseline comparison (exploratory)

Analysis date: 2026-11-25. Dataset retrieved from the public CSV during this session.

## Protocol
- 25,960 valid-looking rows; sorted by contest number ascending.
- Discovery/training segment: first 80% (20,768 draws). Test segment: final 20% (5,192 draws), beginning at contest 31,801.
- For each position, pool methods were evaluated walk-forward using only the preceding 50 observed digits: frequency, long absence, short absence, and a simple balanced score.
- Pool sizes 2–9. Ties resolved by digit ascending.
- Compared against a fixed pool of top-k digit frequencies computed only from the first 80% (empirical baseline).
- Exploratory calculation was executed separately from the committed TypeScript code. No statistical significance or predictive validity claimed.

## Best observed method-size per position (ranked by difference versus fixed empirical baseline)
| Pos. | Method | Pool size | Walk-forward hit | Fixed empirical baseline | Difference |
|---|---|---:|---:|---:|---:|
| 1 | Balanced | 5 | 50.79% | 49.77% | +1.02 pp |
| 2 | Short absence | 2 | 21.17% | 20.26% | +0.91 pp |
| 3 | Balanced | 7 | 71.26% | 69.61% | +1.66 pp |
| 4 | Frequency | 7 | 70.63% | 68.70% | +1.93 pp |
| 5 | Frequency | 6 | 61.25% | 60.05% | +1.19 pp |

## Preliminary observation
- Some dynamic methods and sizes showed positive differences versus the fixed training-frequency pool in this holdout.
- The results are not yet evidence of a real edge: selection among many methods and pool sizes creates multiple-testing/selection bias; serial dependence may affect uncertainty; the balanced formula is a simple exploratory score.
- The test segment has now been used for exploration. Treat it as no longer untouched. Subsequent optimization must use a new prospective period or a stricter nested chronological scheme.

## Research follow-up
- Define method formulas precisely and freeze versions before testing.
- Add rolling empirical baselines and random-pool baselines to account for position-specific marginal digit rates.
- Use nested chronological discovery/validation/test windows and correct multiple comparisons across the full family of hypotheses.
- Record each test in the hypothesis registry, including negative findings.
- Prospective monitoring should be the deciding evidence before any method is promoted.