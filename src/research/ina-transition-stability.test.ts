import test from "node:test";
import assert from "node:assert/strict";
import type { Draw, Validation } from "../research-core";
import { createInaContext, type DatasetSnapshot } from "./ina-contracts";
import { buildInaTransitionStability } from "./ina-transition-stability";

const draws: Draw[] = [
  { drawId: 100, digits: [1, 1, 1, 1, 1] },
  { drawId: 101, digits: [1, 1, 1, 1, 1] },
  { drawId: 102, digits: [2, 2, 2, 2, 2] },
  { drawId: 103, digits: [2, 2, 2, 2, 2] },
];
const snapshot: DatasetSnapshot = {
  snapshotId: "stability-103", sourceType: "remote", sourceUrl: "https://example.test/Tris.csv",
  fetchedAt: "2026-01-01T00:00:00.000Z", sha256: "5".repeat(64), rowCount: draws.length,
  earliestDrawId: 100, latestDrawId: 103,
};
const validation: Validation = { valid: draws, errors: [], warnings: [] };

test("INA stability compares adjacent non-overlapping windows and reports positional entropy", () => {
  const context = createInaContext({ snapshot, validation, builtAt: "2026-01-01T00:01:00.000Z" });
  const output = buildInaTransitionStability(context, 2, 2);
  assert.equal(output.outputKey, "research.transition-stability");
  assert.equal(output.drawCutoff, 103);
  assert.equal(output.result.previousDrawCount, 2);
  assert.equal(output.result.recentDrawCount, 2);
  assert.equal(output.result.previousStart, 100);
  assert.equal(output.result.previousCutoff, 101);
  assert.equal(output.result.recentStart, 102);
  assert.equal(output.result.recentCutoff, 103);
  assert.equal(output.result.digitEntropy.length, 5);
  assert.equal(output.result.digitEntropy[0].previous, 0);
  assert.equal(output.result.digitEntropy[0].recent, 0);
  const changed = output.result.stability.find(row => row.p === 0 && row.a === 1 && row.b === 1);
  assert.equal(changed?.full, 2);
  assert.equal(changed?.recent, 0);
  assert.equal(changed?.delta, -1);
});

test("INA stability handles short and empty histories without fabricating counts", () => {
  const shortContext = createInaContext({
    snapshot: { ...snapshot, rowCount: 1, earliestDrawId: 100, latestDrawId: 100 },
    validation: { valid: [draws[0]], errors: [], warnings: [] }, builtAt: "2026-01-01T00:01:00.000Z",
  });
  const short = buildInaTransitionStability(shortContext, 50, 50);
  assert.equal(short.result.recentDrawCount, 1);
  assert.equal(short.result.previousDrawCount, 0);
  assert.equal(short.result.previousStart, null);
  assert.equal(short.result.previousCutoff, null);
  assert.equal(short.result.stability.every(row => row.full === 0 && row.recent >= 0), true);

  const emptyContext = createInaContext({
    snapshot: { ...snapshot, rowCount: 0, earliestDrawId: null, latestDrawId: null },
    validation: { valid: [], errors: [], warnings: [] }, builtAt: "2026-01-01T00:01:00.000Z",
  });
  const empty = buildInaTransitionStability(emptyContext, 50, 50);
  assert.equal(empty.result.recentDrawCount, 0);
  assert.equal(empty.result.previousDrawCount, 0);
  assert.equal(empty.result.stability.every(row => row.delta === 0), true);
  assert.equal(empty.result.digitEntropy.every(row => row.recent === 0 && row.previous === 0), true);
});

test("INA stability rejects invalid context", () => {
  const invalidContext = createInaContext({
    snapshot: { ...snapshot, rowCount: 9 }, validation, builtAt: "2026-01-01T00:01:00.000Z",
  });
  assert.throws(() => buildInaTransitionStability(invalidContext), /invalid INA context/);
});
