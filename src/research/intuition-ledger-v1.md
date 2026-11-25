# TRIS Artificial Intuition — Hypothesis Ledger v1
Created: 2026-11-25
Branch: `research-core-v1`

Purpose: maintain explicit hypotheses and status, rather than treating exploratory results as established predictive knowledge. Lottery outcomes are random; historical associations do not imply future advantage.

## Hypotheses

| ID | Hypothesis | Status | Evidence / next test | Decision rule |
|---|---|---|---|---|
| H-POS-WINDOW-01 | Optimal lookback window may differ by digit position. | Exploratory | Compare positions × windows on discovery data; freeze selections and test chronologically. | Only retain if prospective performance is repeatable vs baseline and uncertainty reported. |
| H-ABSENCE-01 | Long-absence ranking may have small position-specific differences from rolling-frequency pools. | Exploratory | Historical matrix suggested tiny differences; report was computed with pre-correction implementation and must be rerun. | No active status from exploratory matrix. |
| H-FREQ-GLOBAL-RECENT-01 | Global frequency and recent frequency may rank digits differently and show different behavior. | Validating (implementation) | Code correction now separates all-prior-history from trailing-window ranking; verify tests/CI, then compare out-of-sample. | Code correctness is not predictive evidence. |
| H-POOL-SIZE-01 | Pool size changes hit rate primarily through coverage; small pools may offer useful discrimination only if above fair baseline. | Exploratory | Evaluate sizes 1–10; report hit rate, lift, uncertainty, and cost/coverage trade-off. | Avoid interpreting raw hit rate without k/10 baseline. |
| H-METHOD-DUP-01 | Frequency and recent-frequency were duplicate methods in prior implementation. | Corrected / retest required | Identical ranking was found; implementation corrected and test added. | Re-run matrix with corrected source and reconcile results. |

## Data and experiment integrity
- Source snapshot in prior audit: 25,960 draws, IDs 11033–36992, through 2026-11-24; checksum fingerprint documented in matrix report.
- Existing historical segments have already been explored; do not label them pristine holdouts.
- Walk-forward evaluation uses only draws prior to each target draw.
- Candidate selection among many tests incurs selection bias. Future validation must freeze configurations before prospective evaluation.
- Keep negative findings and superseded methods visible.
- No betting recommendations from these exploratory findings.

## Review queue
1. Resolve GitHub Actions dependency installation and confirm type-check + tests.
2. Run/reconcile corrected pool matrix against TypeScript core (not an independently implemented copy).
3. Freeze a small set of candidates, write their predictions before upcoming results, and log prospective outcomes without retuning.
