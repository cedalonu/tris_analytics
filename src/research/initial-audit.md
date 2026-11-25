# TRIS Analytics — initial data audit and exploratory pool check

Date of analysis: 2026-11-25

## Source and integrity
- Source: `https://raw.githubusercontent.com/pakinja/pakin/master/Tris.csv` (the CSV used by the current app).
- CSV header: `CONCURSO,ID,R1,R2,R3,R4,R5,FECHA,PRIMOS,REPETIDOS`.
- Rows parsed: 25,960; draw IDs 11,033–36,992; dates 2007-09-03 to 2026-11-24.
- Missing draw-ID gaps within the supplied range: 0. Duplicate/invalid digit rows: 0 in this quick audit.
- The file was retrieved and inspected during this analysis; this is not a scheduled feed or automated refresh.

## Exploratory holdout setup
- Chronological order ascending by draw ID; first 80% used as prior history, last 20% evaluated (5,192 draws).
- Pool method: trailing-window frequency ranking over 50 preceding observations for each digit position; tie-break ascending digit.
- Sizes: 2–9, each of five digit positions; simple benchmark k/10.
- This was a quick independent calculation, not an execution of the committed TypeScript modules or a CI test. No claim of significance; 40 pool-size/method tests per position and multiple comparisons make the largest apparent edge vulnerable to chance.

## Top preliminary deviation from k/10 by position
| Position | Pool size | Hit rate | k/10 reference | Difference |
|---|---:|---:|---:|---:|
| 1 | 8 | 80.51% | 80.00% | +0.51 pp |
| 2 | 5 | 50.33% | 50.00% | +0.33 pp |
| 3 | 2 | 20.11% | 20.00% | +0.11 pp |
| 4 | 6 | 61.09% | 60.00% | +1.09 pp |
| 5 | 6 | 61.25% | 60.00% | +1.25 pp |

## Interpretation / next steps
- These are tiny exploratory deviations, not validated predictive improvements.
- Benchmark against the empirical digit distribution by position and simple fixed-frequency baselines; use confidence intervals and family-wise/multiple-testing correction.
- Keep a discovery period, a validation period and an untouched holdout; after that begin prospective tracking.
- Check the adapter against the source CSV format with automated tests, and integrate it only behind a research UI without altering the stable app.
- Never interpret a digit being absent as making it due or more likely in the next draw.