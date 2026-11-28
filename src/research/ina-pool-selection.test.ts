import test from "node:test";
import assert from "node:assert/strict";
import type { Draw, PoolMethod, Validation } from "../research-core";
import { buildPool, evaluatePool } from "../research-core";
import { createInaContext, type DatasetSnapshot } from "./ina-contracts";
import { buildInaPoolSelection } from "./ina-pool-selection";

const draws: Draw[] = Array.from({ length: 80 }, (_, index) => ({
  drawId: 2000 + index,
  digits: [
    (index % 10) as Draw["digits"][number],
    ((index * 3) % 10) as Draw["digits"][number],
    ((index * 7) % 10) as Draw["digits"][number],
    ((index + 4) % 10) as Draw["digits"][number],
    ((index * 9) % 10) as Draw["digits"][number],
  ],
}));
const snapshot: DatasetSnapshot = {
  snapshotId: "selection-2079",
  sourceType: "remote",
  sourceUrl: "https://example.test/Tris.csv",
  fetchedAt: "2026-01-01T00:00:00.000Z",
  sha256: "2".repeat(64),
  rowCount: draws.length,
  earliestDrawId: 2000,
  latestDrawId: 2079,
};
const validation: Validation = { valid: draws, errors: [], warnings: [] };

test("fixed-method pool selection matches the original buildPool algorithm", () => {
  const context = createInaContext({ snapshot, validation, builtAt: "2026-01-01T00:01:00.000Z" });
  const output = buildInaPoolSelection(context, { poolSize: 3, windowSize: 50, method: "frequency" });
  const train = draws.slice(-500);
  const expected = Array.from({ length: 5 }, (_, position) =>
    buildPool(train.map(draw => draw.digits[position]), "frequency", 3, 50),
  );
  assert.deepEqual(output.result.pools, expected);
  assert.equal(output.result.primary, expected.map(pool => pool[0]).join(""));
  assert.equal(output.outputKey, "research.pool-selection");
  assert.equal(output.drawCutoff, 2079);
  assert.equal(output.sampleSize, 80);
  assert.equal(output.evidence.status, "exploratory");
});

test("adaptive pool selection preserves the original best-hit-rate-per-position rule", () => {
  const context = createInaContext({ snapshot, validation, builtAt: "2026-01-01T00:01:00.000Z" });
  const output = buildInaPoolSelection(context, { poolSize: 4, windowSize: 40, method: "adaptive", minTrain: 30 });
  const methods: PoolMethod[] = ["frequency", "recent-frequency", "long-absence", "short-absence", "balanced"];
  const expectedMethods = Array.from({ length: 5 }, (_, position) => {
    const rows = methods.map(method => evaluatePool(draws, position as 0|1|2|3|4, method, 4, 30, 40));
    return [...rows].sort((a, b) => b.hitRate - a.hitRate)[0].method;
  });
  assert.deepEqual(output.result.selectedMethods, expectedMethods);
  assert.equal(output.result.method, "adaptive");
});

test("pool selection keeps exactly twelve ranked combinations and preserves leading zeros", () => {
  const context = createInaContext({ snapshot, validation, builtAt: "2026-01-01T00:01:00.000Z" });
  const output = buildInaPoolSelection(context, { poolSize: 2, windowSize: 50, method: "frequency" });
  assert.equal(output.result.combinations.length, 12);
  assert.ok(output.result.combinations.every(row => row.digits.length === 5));
  assert.equal(output.result.combinations[0].score >= output.result.combinations.at(-1)!.score, true);
  assert.equal(output.result.pools.every(pool => pool.length === 2), true);
});

test("pool selection refuses invalid INA context", () => {
  const context = createInaContext({
    snapshot: { ...snapshot, rowCount: 81 },
    validation,
    builtAt: "2026-01-01T00:01:00.000Z",
  });
  assert.throws(() => buildInaPoolSelection(context, { poolSize: 3, windowSize: 50, method: "frequency" }), /invalid INA context/);
});
