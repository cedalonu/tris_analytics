import test from "node:test";
import assert from "node:assert/strict";
import { buildInaDashboardOverview } from "./ina-dashboard-overview";
import { createInaContext, type DatasetSnapshot } from "./ina-contracts";
import type { Draw, Validation } from "../research-core";

const draws: Draw[] = Array.from({ length: 20 }, (_, index) => ({
  drawId: 100 + index,
  digits: [index < 10 ? 0 : 1, 2, 3, 4, 5],
}));
const snapshot: DatasetSnapshot = {
  snapshotId: "overview-119",
  sourceType: "remote",
  sourceUrl: "https://example.test/Tris.csv",
  fetchedAt: "2026-11-27T10:00:00.000Z",
  sha256: "e".repeat(64),
  rowCount: 20,
  earliestDrawId: 100,
  latestDrawId: 119,
};
const validation: Validation = { valid: draws, errors: [], warnings: [] };

test("dashboard overview output inherits the INA dataset version and registry key", () => {
  const context = createInaContext({ snapshot, validation, builtAt: "2026-11-27T10:01:00.000Z" });
  const output = buildInaDashboardOverview(context, 10);
  assert.equal(output.moduleId, "position-overview");
  assert.equal(output.outputKey, "research.position-overview");
  assert.equal(output.datasetVersionId, context.version.versionId);
  assert.equal(output.snapshotSha256, snapshot.sha256);
  assert.equal(output.drawCutoff, 119);
  assert.equal(output.sampleSize, 20);
  assert.equal(output.result.windowSize, 10);
  assert.equal(output.result.positions[0].digits[1].recentCount, 10);
  assert.equal(output.evidence.status, "descriptive");
});

test("dashboard overview refuses a quarantined INA context", () => {
  const context = createInaContext({
    snapshot: { ...snapshot, rowCount: 21 },
    validation,
    builtAt: "2026-11-27T10:01:00.000Z",
  });
  assert.throws(() => buildInaDashboardOverview(context), /invalid INA context/);
});
