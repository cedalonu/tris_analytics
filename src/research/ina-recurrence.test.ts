import test from "node:test";
import assert from "node:assert/strict";
import type { Draw, Validation } from "../research-core";
import { createInaContext, type DatasetSnapshot } from "./ina-contracts";
import { buildInaRecurrence } from "./ina-recurrence";

const draws: Draw[] = [
  { drawId: 100, date: "2026-01-01", digits: [0, 1, 2, 3, 4] },
  { drawId: 101, date: "2026-01-02", digits: [1, 1, 2, 3, 4] },
  { drawId: 103, date: "2026-01-04", digits: [0, 1, 2, 3, 4] },
  { drawId: 105, date: "2026-01-06", digits: [9, 9, 9, 9, 9] },
];
const snapshot: DatasetSnapshot = {
  snapshotId: "recurrence-105",
  sourceType: "remote",
  sourceUrl: "https://example.test/Tris.csv",
  fetchedAt: "2026-01-06T12:00:00.000Z",
  sha256: "f".repeat(64),
  rowCount: 4,
  earliestDrawId: 100,
  latestDrawId: 105,
};
const validation: Validation = { valid: draws, errors: [], warnings: ["draw gap 101 → 103"] };

test("recurrence preserves leading zero, exact order, gaps, and aging", () => {
  const context = createInaContext({ snapshot, validation, builtAt: "2026-01-06T12:01:00.000Z" });
  const output = buildInaRecurrence(context);
  const row = output.result.combinations.find(item => item.combination === "01234");
  assert.ok(row);
  assert.equal(row.count, 2);
  assert.equal(row.firstDraw, 100);
  assert.equal(row.lastDraw, 103);
  assert.equal(row.aging, 2);
  assert.equal(row.dayAging, 2);
  assert.deepEqual(row.gaps, [3]);
  assert.equal(row.meanGap, 3);
  assert.equal(row.medianGap, 3);
  assert.equal(row.maxGap, 3);
  assert.equal(output.outputKey, "research.combination-recurrence");
  assert.equal(output.drawCutoff, 105);
  assert.equal(output.sampleSize, 4);
});

test("recurrence summary totals are based on exact observed combinations", () => {
  const context = createInaContext({ snapshot, validation, builtAt: "2026-01-06T12:01:00.000Z" });
  const output = buildInaRecurrence(context);
  assert.equal(output.result.uniqueCombinations, 3);
  assert.equal(output.result.recurrentCombinations, 1);
  assert.equal(output.result.extraOccurrences, 1);
});

test("missing dates produce null day aging and singleton gaps remain null", () => {
  const oneDraw: Draw[] = [{ drawId: 1, digits: [0, 0, 0, 0, 0] }];
  const context = createInaContext({
    snapshot: { ...snapshot, rowCount: 1, earliestDrawId: 1, latestDrawId: 1 },
    validation: { valid: oneDraw, errors: [], warnings: [] },
    builtAt: "2026-01-06T12:01:00.000Z",
  });
  const output = buildInaRecurrence(context);
  assert.equal(output.result.combinations[0].dayAging, null);
  assert.equal(output.result.combinations[0].meanGap, null);
  assert.equal(output.result.combinations[0].medianGap, null);
  assert.equal(output.result.combinations[0].maxGap, null);
});

test("recurrence refuses invalid INA context", () => {
  const context = createInaContext({
    snapshot: { ...snapshot, rowCount: 5 },
    validation,
    builtAt: "2026-01-06T12:01:00.000Z",
  });
  assert.throws(() => buildInaRecurrence(context), /invalid INA context/);
});
