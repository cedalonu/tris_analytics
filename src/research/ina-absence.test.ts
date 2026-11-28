import test from "node:test";
import assert from "node:assert/strict";
import type { Draw, Validation } from "../research-core";
import { createInaContext, type DatasetSnapshot } from "./ina-contracts";
import { buildInaAbsence } from "./ina-absence";

const makeContext = (draws: Draw[]) => {
  const snapshot: DatasetSnapshot = {
    snapshotId: "absence-" + (draws.at(-1)?.drawId ?? "empty"),
    sourceType: "remote",
    sourceUrl: "https://example.test/Tris.csv",
    fetchedAt: "2026-11-28T00:00:00.000Z",
    sha256: "b".repeat(64),
    rowCount: draws.length,
    earliestDrawId: draws[0]?.drawId ?? null,
    latestDrawId: draws.at(-1)?.drawId ?? null,
  };
  const validation: Validation = { valid: draws, errors: [], warnings: [] };
  return createInaContext({ snapshot, validation, builtAt: "2026-11-28T00:01:00.000Z" });
};

test("INA absence output reports current absence, completed gaps and chronological timeline", () => {
  const draws: Draw[] = [
    { drawId: 10, digits: [1, 0, 0, 0, 0] },
    { drawId: 11, digits: [2, 0, 0, 0, 0] },
    { drawId: 12, digits: [1, 0, 0, 0, 0] },
    { drawId: 13, digits: [2, 0, 0, 0, 0] },
    { drawId: 14, digits: [2, 0, 0, 0, 0] },
  ];
  const context = makeContext(draws);
  const output = buildInaAbsence(context, { timelineLimit: 3 });
  const one = output.result.positions[0].digitReports[1];
  assert.equal(output.outputKey, "research.positional-absence");
  assert.equal(output.drawCutoff, 14);
  assert.equal(output.sampleSize, 5);
  assert.equal(one.occurrences, 2);
  assert.equal(one.currentAbsence, 2);
  assert.deepEqual(one.completedAbsenceLengths, [1]);
  assert.deepEqual(one.intervalDistribution, [{ misses: 1, count: 1 }]);
  assert.deepEqual(one.timeline, [
    { drawId: 12, present: true },
    { drawId: 13, present: false },
    { drawId: 14, present: false },
  ]);
  assert.equal(one.meanCompletedAbsence, 1);
});

test("INA absence handles empty and short histories without fabricating intervals", () => {
  const empty = buildInaAbsence(makeContext([]));
  assert.equal(empty.result.positions.length, 5);
  assert.equal(empty.result.positions[0].digitReports.length, 10);
  assert.equal(empty.result.positions[0].digitReports.every(row => row.occurrences === 0 && row.currentAbsence === 0 && row.completedAbsenceLengths.length === 0), true);
  const short = buildInaAbsence(makeContext([{ drawId: 50, digits: [0, 1, 2, 3, 4] }]));
  assert.equal(short.result.positions[0].digitReports[0].occurrences, 1);
  assert.equal(short.result.positions[0].digitReports[0].currentAbsence, 0);
  assert.deepEqual(short.result.positions[0].digitReports[0].completedAbsenceLengths, []);
});

test("INA absence rejects invalid snapshots and clamps display parameters", () => {
  const draws: Draw[] = [{ drawId: 100, digits: [1, 2, 3, 4, 5] }];
  const context = makeContext(draws);
  const output = buildInaAbsence(context, { maxPriorMisses: 999, timelineLimit: 9999 });
  assert.equal(output.parameters.maxPriorMisses, 100);
  assert.equal(output.parameters.timelineLimit, 500);
  const invalid = createInaContext({
    snapshot: { ...context.snapshot, rowCount: 2 },
    validation: { valid: draws, errors: [], warnings: [] },
  });
  assert.throws(() => buildInaAbsence(invalid), /invalid INA context/);
});
