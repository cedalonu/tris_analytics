import test from "node:test";
import assert from "node:assert/strict";
import type { Draw, Validation } from "../research-core";
import { createInaContext, createResearchOutput, type DatasetSnapshot } from "./ina-contracts";

const draws: Draw[] = [
  { drawId: 101, digits: [0, 1, 2, 3, 4] },
  { drawId: 102, digits: [5, 6, 7, 8, 9] },
];
const validation: Validation = { valid: draws, errors: [], warnings: ["draw gap 101 → 102 is absent only if nonconsecutive"] };
const snapshot: DatasetSnapshot = {
  snapshotId: "Tris-102-test",
  sourceType: "remote",
  sourceUrl: "https://example.test/Tris.csv",
  fetchedAt: "2026-11-27T10:00:00.000Z",
  sha256: "a".repeat(64),
  rowCount: 2,
  earliestDrawId: 101,
  latestDrawId: 102,
};

test("INA context sorts rows and exposes one stable dataset version and cutoff", () => {
  const context = createInaContext({
    snapshot,
    validation: { ...validation, valid: [...draws].reverse() },
    builtAt: "2026-11-27T10:01:00.000Z",
  });
  assert.equal(context.quality.valid, true);
  assert.deepEqual(context.draws.map(d => d.drawId), [101, 102]);
  assert.equal(context.version.drawCutoff, 102);
  assert.equal(context.version.drawCount, 2);
  assert.equal(context.version.sha256, "a".repeat(64));
  assert.equal(context.version.versionId, `tris:${"a".repeat(64)}:102`);
});

test("INA quarantines a snapshot whose declared row count or range disagrees", () => {
  const context = createInaContext({
    snapshot: { ...snapshot, rowCount: 3, latestDrawId: 103 },
    validation,
    builtAt: "2026-11-27T10:01:00.000Z",
  });
  assert.equal(context.quality.valid, false);
  assert.equal(context.quality.rowCountMatches, false);
  assert.equal(context.quality.rangeMatches, false);
  assert.ok(context.quality.errors.some(e => e.includes("rowCount mismatch")));
});

test("invalid validation errors prevent publishing a research output", () => {
  const context = createInaContext({
    snapshot,
    validation: { ...validation, errors: ["duplicate contest"] },
    builtAt: "2026-11-27T10:01:00.000Z",
  });
  assert.equal(context.quality.valid, false);
  assert.throws(() => createResearchOutput(context, {
    outputId: "positions-v1",
    outputKey: "ina.position-profile",
    moduleId: "positions",
    engineId: "dashboard-overview",
    engineVersion: "1.0.0",
    parameters: { window: 50 },
    generatedAt: "2026-11-27T10:02:00.000Z",
    evidence: { status: "descriptive", phase: "exploration", notes: [] },
    result: { ok: true },
    warnings: [],
  }), /invalid INA context/);
});

test("research output inherits exact dataset identity and does not invent its own cutoff", () => {
  const context = createInaContext({ snapshot, validation, builtAt: "2026-11-27T10:01:00.000Z" });
  const output = createResearchOutput(context, {
    outputId: "positions-v1",
    outputKey: "ina.position-profile",
    moduleId: "positions",
    engineId: "dashboard-overview",
    engineVersion: "1.0.0",
    parameters: { window: 50 },
    generatedAt: "2026-11-27T10:02:00.000Z",
    evidence: { status: "descriptive", phase: "exploration", notes: ["Descriptive only"] },
    result: { ok: true },
    warnings: [],
  });
  assert.equal(output.datasetVersionId, context.version.versionId);
  assert.equal(output.snapshotSha256, context.snapshot.sha256);
  assert.equal(output.drawCutoff, 102);
  assert.equal(output.sampleSize, 2);
});

test("INA rejects malformed source metadata and digest", () => {
  assert.throws(() => createInaContext({
    snapshot: { ...snapshot, sourceUrl: "file:///tmp/Tris.csv" },
    validation,
  }), (error) => String(error).includes("HTTP(S)"));
  assert.throws(() => createInaContext({
    snapshot: { ...snapshot, sha256: "not-a-digest" },
    validation,
  }), /64-character/);
});

test("empty dataset has explicit null cutoff and is internally consistent", () => {
  const empty = createInaContext({
    snapshot: { ...snapshot, rowCount: 0, earliestDrawId: null, latestDrawId: null },
    validation: { valid: [], errors: [], warnings: [] },
    builtAt: "2026-11-27T10:01:00.000Z",
  });
  assert.equal(empty.quality.valid, true);
  assert.equal(empty.version.drawCutoff, null);
  assert.equal(empty.version.drawStart, null);
});
