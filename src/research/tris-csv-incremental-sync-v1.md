# TRIS incremental CSV sync v1

## Operating assumption

The TRIS history CSV is refreshed after each draw. The operating schedule supplied for this project is five draws per day. The software does not assume fixed draw times: contest IDs define order, and the CSV date is used only for grouping/reporting.

## No-API rule

This workflow never downloads or polls a source. The operator manually obtains the updated CSV and runs the local command:

```bash
npm run research:sync -- ./data/Tris.csv
```

An optional checkpoint path can be supplied:

```bash
npm run research:sync -- ./data/Tris.csv ./data/tris-sync-checkpoint.json
```

## First run

The first run bootstraps a checkpoint from the full CSV. It does not label the historical rows as prospective discoveries and does not create a new-draw delta for prediction. Keep the checkpoint file between runs.

## Later runs

After a new CSV is manually downloaded, run the same command. The sync process:

1. Validates the CSV through the local data adapter.
2. Requires a continuous sequence of contest IDs.
3. Confirms that every previously checkpointed row is unchanged.
4. Returns only contest IDs newer than the previous checkpoint.
5. Retains all new rows in contest-ID order, including batches larger than five.
6. Writes `reports/tris-sync/latest.md` and, when there are new contests, `reports/tris-sync/latest-new-draws.csv`.
7. Advances the checkpoint only after validation and report generation succeed.

The checkpoint is local operational state and should be backed up with the local research workspace. Do not commit private/local data or reports unless deliberately intended.

## Five-draw daily schedule

Five draws per day is a schedule reference, not a reason to fabricate missing rows or reject a legitimate delayed batch. The report groups newly arrived rows by CSV date and warns if a sync batch contains more than five contests. Missing contest IDs stop processing. A date with fewer than five rows is not automatically declared incomplete because the CSV may be downloaded mid-day.

## Scope boundary

This is an incremental data-arrival detector, not an automatic predictor. It does not call APIs, schedule itself, infer draw times, or claim a pattern. A separate prospective scoring stage must freeze candidate configurations before the corresponding draw and persist predictions before results become available.
