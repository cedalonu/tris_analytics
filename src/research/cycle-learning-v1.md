# TRIS prospective learning cycles v1

## Purpose
Create an auditable cycle for each upcoming contest. The cycle freezes the selected candidate signals, their priority metadata, exact candidate configuration, predictions, paired baselines, source-history fingerprint and target contest ID before the result exists.

## Source CSV and draw schedule
The CSV schema is `CONCURSO,ID,R1,R2,R3,R4,R5,FECHA,PRIMOS,REPETIDOS`. **CONCURSO is the contest number and the only draw identifier used by the analysis. The ID column is ignored completely**; it may change or be nonnumeric without changing draw identity. R1–R5 are the five winning digits. PRIMOS and REPETIDOS are supplementary source metadata.

The CSV is refreshed approximately one hour after each individual draw, not once after the five daily draws. Schedule reference in Mexico City time: Tris Medio Día 13:00, Tris de las Tres 15:00, Tris Extra 17:00, Tris de las Siete 19:00, and Tris Clásico 21:00. Run the local runner after each corresponding CSV refresh. Contest number ordering remains authoritative.

## Workflow
1. Supply the manually updated local CSV.
2. Validate all rows and contiguous contest IDs.
3. Resolve only previously frozen forecasts whose exact target contest is now present. Resolution uses the precise pre-result history snapshot stored by that forecast.
4. Append immutable resolution rows to the JSONL journal.
5. Freeze the next contest only, from the latest available history. Never backfill missed contests.
6. Recompute descriptive lifecycle summaries from the append-only outcomes.

## Signal outcomes
A transition candidate is scored against its configured TRIS outcome mode. Position, mutation, absence and pool candidates are scored as a hit when the target-position digit belongs to the frozen prediction set. Every outcome is paired with the baseline frozen at the same time. These are binary coverage events, not calibrated probabilities; no Brier score or log loss is reported.

## Lifecycle
Resolved outcomes are grouped in chronological, non-overlapping blocks of 25 (a final block is usable only at 10 or more observations). A block is positive at +2 percentage points or more against its paired baseline, negative at -2 points or less, otherwise neutral.
- emerging: one positive block;
- persistent: at least two consecutive positive blocks;
- strengthening: two consecutive positive blocks and the latest advantage grows by more than 0.5 percentage points;
- weakening: a negative latest block after earlier positive evidence;
- unstable: earlier positive evidence is not maintained;
- dormant: fewer than 10 outcomes are available for a block;
- retired: three consecutive negative blocks. Retired means remove from active monitoring, not erase history or prove permanent failure.

Lifecycle labels are descriptive monitoring states, not hypothesis confirmations or betting advice. They do not modify the separate evidence ledger or candidate weights.

## Integrity and operation
- JSONL cycle and outcome journals are append-only; frozen records are never rewritten.
- State stores the processed-through contest and SHA-256 of the complete processed prefix. A changed or truncated prefix stops the runner.
- A target must be exactly the next contest after its frozen history.
- Gaps, duplicate IDs, invalid digits, changed historical rows and mismatched target IDs stop processing.
- Contest IDs determine ordering; no assumption about time-of-day spacing is made.
- Run after each CSV update. If several contests arrive between runs, only already-frozen targets are resolved; no forecasts are invented for missed contests.
- No APIs, polling, network calls or automatic downloads. The user supplies the CSV locally.

## Command
`npm run research:cycles -- ./data/Tris.csv`

Default local directory: `data/cycles/` (ignored/local data). Outputs include `cycles.jsonl`, `outcomes.jsonl`, `state.json`, `lifecycle.json` and `latest-report.md`.
