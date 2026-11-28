import test from "node:test";
import assert from "node:assert/strict";
import type { Draw, PoolMethod, Validation } from "../research-core";
import { evaluatePool } from "../research-core";
import { createInaContext, type DatasetSnapshot } from "./ina-contracts";
import { buildInaPoolEvaluation } from "./ina-pool-evaluation";

const draws: Draw[] = Array.from({ length: 80 }, (_, index) => ({
  drawId: 1000 + index,
  digits: [
    (index % 10) as Draw["digits"][number],
    ((index * 3) % 10) as Draw["digits"][number],
    ((index * 7) % 10) as Draw["digits"][number],
    ((index + 4) % 10) as Draw["digits"][number],
    ((index * 9) % 10) as Draw["digits"][number],
  ],
}));
const snapshot: DatasetSnapshot = {
  snapshotId: "pool-1079",
  sourceType: "remote",
  sourceUrl: "https://example.test/Tris.csv",
  fetchedAt: "2026-01-01T00:00:00.000Z",
  sha256: "1".repeat(64),
  rowCount: draws.length,
  earliestDrawId: 1000,
  latestDrawId: 1079,
};
const validation: Validation = { valid: draws, errors: [], warnings: [] };
const methods: PoolMethod[] = ["frequency", "recent-frequency", "long-absence", "short-absence", "balanced"];

test("INA pool output exactly wraps existing walk-forward evaluations", () => {
  const context = createInaContext({ snapshot, validation, builtAt: "2026-01-01T00:01:00.000Z" });
  const output = buildInaPoolEvaluation(context, { poolSize: 3, windowSize: 50, minTrain: 30, historyLimit: 500, methods });
  const direct = methods.map(method => evaluatePool(draws, 0, method, 3, 30, 50));
  assert.deepEqual(output.result.evaluations[0], direct);
  assert.equal(output.outputKey, "research.pool-evaluation");
  assert.equal(output.moduleId, "pool-research");
  assert.equal(output.drawCutoff, 1079);
  assert.equal(output.sampleSize, 80);
  assert.equal(output.result.poolSize, 3);
  assert.equal(output.evidence.status, "backtested");
});

test("pool wrapper respects history limit and window parameters", () => {
  const context = createInaContext({ snapshot, validation, builtAt: "2026-01-01T00:01:00.000Z" });
  const output = buildInaPoolEvaluation(context, { poolSize: 4, windowSize: 20, minTrain: 15, historyLimit: 40, methods: ["frequency"] });
  assert.equal(output.result.historyLimit, 40);
  assert.equal(output.result.windowSize, 20);
  assert.equal(output.result.evaluations[0][0].tested, 25);
  assert.equal(output.result.evaluations[0][0].method, "frequency");
});

test("pool evaluation refuses an invalid INA context", () => {
  const context = createInaContext({
    snapshot: { ...snapshot, rowCount: 81 },
    validation,
    builtAt: "2026-01-01T00:01:00.000Z",
  });
  assert.throws(() => buildInaPoolEvaluation(context, { poolSize: 3, windowSize: 50 }), /invalid INA context/);
});
