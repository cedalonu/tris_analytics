import test from "node:test";
import assert from "node:assert/strict";
import type { Draw, Validation } from "../research-core";
import { createInaContext, type DatasetSnapshot } from "./ina-contracts";
import { buildInaMemoryState } from "./ina-memory-state";

function contextFor(draws: Draw[]) {
  const snapshot: DatasetSnapshot = {
    snapshotId: "memory-" + draws.length,
    sourceType: "remote",
    sourceUrl: "https://example.test/Tris.csv",
    fetchedAt: "2026-11-28T00:00:00.000Z",
    sha256: "c".repeat(64),
    rowCount: draws.length,
    earliestDrawId: draws[0]?.drawId ?? null,
    latestDrawId: draws.at(-1)?.drawId ?? null,
  };
  const validation: Validation = { valid: draws, errors: [], warnings: [] };
  return createInaContext({ snapshot, validation, builtAt: "2026-11-28T00:01:00.000Z" });
}

test("INA memory output shares the canonical cutoff and exposes temporal/context scopes", () => {
  const draws: Draw[] = Array.from({ length: 220 }, (_, index) => ({
    drawId: 1000 + index,
    digits: [0,1,2,3,4].map((offset, position) => (index * (position + 1) + offset) % 10) as Draw["digits"],
  }));
  const output = buildInaMemoryState(contextFor(draws));
  assert.equal(output.outputKey, "research.memory-state");
  assert.equal(output.drawCutoff, 1219);
  assert.equal(output.sampleSize, 220);
  assert.equal(output.result.temporal.scopes.some(scope => scope.scope === "last-200"), true);
  assert.equal(output.result.contextual.scopes.some(scope => scope.scope === "last-200"), true);
  assert.equal(output.result.temporal.scopes[0].comparisons.length, 125);
  assert.equal(output.result.contextual.scopes[0].comparisons.length, 250);
  assert.equal(output.evidence.status, "descriptive");
});

test("INA memory output rejects an invalid shared context", () => {
  const draws: Draw[] = [{ drawId: 1, digits: [0,1,2,3,4] }];
  const context = contextFor(draws);
  const invalid = createInaContext({
    snapshot: { ...context.snapshot, rowCount: 2 },
    validation: { valid: draws, errors: [], warnings: [] },
  });
  assert.throws(() => buildInaMemoryState(invalid), /invalid INA context/);
});
