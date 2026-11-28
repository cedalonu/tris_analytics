import test from "node:test";
import assert from "node:assert/strict";
import type { Draw, Validation } from "../research-core";
import { createInaContext, type DatasetSnapshot } from "./ina-contracts";
import { buildInaPositionalTransitions } from "./ina-positional-transitions";

const draws: Draw[] = [
  { drawId: 50, digits: [1, 2, 3, 4, 5] },
  { drawId: 51, digits: [1, 2, 3, 4, 5] },
  { drawId: 52, digits: [1, 3, 3, 4, 5] },
  { drawId: 53, digits: [9, 2, 3, 4, 5] },
];
const snapshot: DatasetSnapshot = {
  snapshotId: "transitions-53",
  sourceType: "remote",
  sourceUrl: "https://example.test/Tris.csv",
  fetchedAt: "2026-01-01T00:00:00.000Z",
  sha256: "4".repeat(64),
  rowCount: 4,
  earliestDrawId: 50,
  latestDrawId: 53,
};
const validation: Validation = { valid: draws, errors: [], warnings: [] };

test("transition matrix counts adjacent position pairs and node totals exactly", () => {
  const context = createInaContext({ snapshot, validation, builtAt: "2026-01-01T00:01:00.000Z" });
  const output = buildInaPositionalTransitions(context, 4);
  const edge = output.result.edges.find(item => item.p === 0 && item.a === 1 && item.b === 2);
  assert.equal(edge?.n, 2);
  assert.equal(edge?.ratio, 50);
  assert.equal(output.result.nodeCounts[0][1], 3);
  assert.equal(output.result.nodeCounts[1][2], 3);
  assert.equal(output.result.sampleSize, 4);
  assert.equal(output.result.expectedPerPair, 0.04);
  assert.equal(output.result.drawStart, 50);
  assert.equal(output.result.drawCutoff, 53);
  assert.equal(output.outputKey, "research.positional-transitions");
});

test("transition engine honors trailing window and returns no fabricated edges for empty history", () => {
  const context = createInaContext({ snapshot, validation, builtAt: "2026-01-01T00:01:00.000Z" });
  const recent = buildInaPositionalTransitions(context, 2);
  assert.equal(recent.result.sampleSize, 2);
  assert.equal(recent.result.drawStart, 52);
  assert.equal(recent.result.drawCutoff, 53);

  const empty = createInaContext({
    snapshot: { ...snapshot, rowCount: 0, earliestDrawId: null, latestDrawId: null },
    validation: { valid: [], errors: [], warnings: [] },
    builtAt: "2026-01-01T00:01:00.000Z",
  });
  const emptyOutput = buildInaPositionalTransitions(empty, 50);
  assert.equal(emptyOutput.result.sampleSize, 0);
  assert.equal(emptyOutput.result.edges.length, 0);
  assert.equal(emptyOutput.result.maxCount, 1);
});

test("transition engine refuses invalid INA context", () => {
  const context = createInaContext({
    snapshot: { ...snapshot, rowCount: 5 },
    validation,
    builtAt: "2026-01-01T00:01:00.000Z",
  });
  assert.throws(() => buildInaPositionalTransitions(context, 50), /invalid INA context/);
});
