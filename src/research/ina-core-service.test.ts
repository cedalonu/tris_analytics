import test from "node:test";
import assert from "node:assert/strict";
import type { Draw, Validation } from "../research-core";
import { buildInaCore } from "./ina-core";
import type { DatasetSnapshot } from "./ina-contracts";

const draws: Draw[] = [
  { drawId: 10, date: "2026-01-01", digits: [1, 2, 3, 4, 5] },
  { drawId: 11, date: "2026-01-02", digits: [1, 2, 3, 4, 5] },
  { drawId: 12, date: "2026-01-03", digits: [2, 2, 3, 4, 5] },
  { drawId: 13, date: "2026-01-04", digits: [1, 2, 3, 4, 5] },
];
const snapshot: DatasetSnapshot = {
  snapshotId: "snapshot-13",
  sourceType: "remote",
  sourceUrl: "https://example.test/Tris.csv",
  fetchedAt: "2026-01-04T12:00:00.000Z",
  sha256: "b".repeat(64),
  rowCount: 4,
  earliestDrawId: 10,
  latestDrawId: 13,
};
const validation: Validation = { valid: draws, errors: [], warnings: [] };

test("INA builds five positional profiles from one versioned snapshot", () => {
  const result = buildInaCore({ snapshot, validation, builtAt: "2026-01-04T12:01:00.000Z" });
  assert.equal(result.status, "ready");
  assert.ok(result.knowledge);
  assert.equal(result.knowledge.drawCount, 4);
  assert.equal(result.knowledge.drawCutoff, 13);
  assert.equal(result.knowledge.positions.length, 5);
  assert.equal(result.knowledge.positions[0].digits[1].occurrences, 3);
  assert.equal(result.knowledge.positions[0].digits[1].empiricalRate, 0.75);
  assert.equal(result.knowledge.positions[0].digits[1].lastSeenDrawId, 13);
  assert.equal(result.knowledge.positions[0].digits[1].currentAbsence, 0);
  assert.equal(result.knowledge.positions[0].digits[1].meanInterarrivalDraws, 0.5);
  assert.equal(result.outputs.length, 1);
  assert.equal(result.outputs[0].drawCutoff, 13);
  assert.equal(result.outputs[0].evidence.status, "descriptive");
});

test("INA records contest gaps without silently filling missing contests", () => {
  const result = buildInaCore({
    snapshot: { ...snapshot, rowCount: 3, earliestDrawId: 10, latestDrawId: 13 },
    validation: { valid: [draws[0], draws[2], draws[3]], errors: [], warnings: ["draw gap 10 → 12"] },
    builtAt: "2026-01-04T12:01:00.000Z",
  });
  assert.equal(result.status, "ready");
  assert.deepEqual(result.knowledge?.contestGaps, [2, 1]);
  assert.ok(result.context.quality.warnings.includes("draw gap 10 → 12"));
});

test("INA quarantines invalid source metadata and publishes no analytical outputs", () => {
  const result = buildInaCore({
    snapshot: { ...snapshot, rowCount: 5 },
    validation,
    builtAt: "2026-01-04T12:01:00.000Z",
  });
  assert.equal(result.status, "quarantined");
  assert.equal(result.knowledge, null);
  assert.equal(result.outputs.length, 0);
  assert.ok(result.blockers.some(item => item.includes("rowCount mismatch")));
});

test("empty validated snapshot yields explicit empty knowledge without invented rates", () => {
  const result = buildInaCore({
    snapshot: { ...snapshot, rowCount: 0, earliestDrawId: null, latestDrawId: null },
    validation: { valid: [], errors: [], warnings: [] },
    builtAt: "2026-01-04T12:01:00.000Z",
  });
  assert.equal(result.status, "ready");
  assert.equal(result.knowledge?.drawCount, 0);
  assert.equal(result.knowledge?.positions[0].digits[0].empiricalRate, 0);
  assert.equal(result.knowledge?.positions[0].digits[0].lastSeenDrawId, null);
  assert.equal(result.outputs[0].sampleSize, 0);
});

test("default build timestamp comes from the immutable snapshot and remains reproducible", () => {
  const result = buildInaCore({ snapshot, validation });
  assert.equal(result.context.builtAt, snapshot.fetchedAt);
  assert.equal(result.outputs[0].generatedAt, snapshot.fetchedAt);
  const repeated = buildInaCore({ snapshot, validation });
  assert.equal(repeated.context.version.versionId, result.context.version.versionId);
  assert.equal(repeated.outputs[0].generatedAt, result.outputs[0].generatedAt);
});
