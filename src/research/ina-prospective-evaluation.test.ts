import test from "node:test";
import assert from "node:assert/strict";
import type { Draw, Validation } from "../research-core";
import { createInaContext, type DatasetSnapshot } from "./ina-contracts";
import { buildInaProspectiveEvaluation } from "./ina-prospective-evaluation";
import { generateIntuitionCandidates } from "./intuition-candidate-generator";
import { freezeLearningCycle, resolveLearningCycleSignal } from "./cycle-learning";

function contextFor(draws: Draw[]) {
  const snapshot: DatasetSnapshot = {
    snapshotId: "prospective-" + draws.length,
    sourceType: "remote",
    sourceUrl: "https://example.test/Tris.csv",
    fetchedAt: "2026-11-28T00:00:00.000Z",
    sha256: "d".repeat(64),
    rowCount: draws.length,
    earliestDrawId: draws[0].drawId,
    latestDrawId: draws.at(-1)!.drawId,
  };
  const validation: Validation = { valid: draws, errors: [], warnings: [] };
  return createInaContext({ snapshot, validation, builtAt: "2026-11-28T00:01:00.000Z" });
}

test("INA prospective evaluator preserves frozen history and resolves against canonical target", () => {
  const history: Draw[] = Array.from({ length: 220 }, (_, index) => ({
    drawId: 1000 + index,
    digits: [0,1,2,3,4].map((offset, position) => (index * (position + 1) + offset) % 10) as Draw["digits"],
  }));
  const actual: Draw = { drawId: 1220, digits: [9,8,7,6,5] };
  const candidate = generateIntuitionCandidates({
    modes: [], lags: [], positions: [0], absenceThresholds: [],
    poolMethods: ["frequency"], poolSizes: [2], windows: [20], includePools: true,
  })[0];
  const cycle = freezeLearningCycle(history, [{ candidate, priorityScore: 1, priorityReasons: ["fixture"] }], 1220, "2026-11-28T00:02:00.000Z");
  const resolution = resolveLearningCycleSignal(cycle, cycle.signals[0], actual, history, "2026-11-28T00:03:00.000Z");
  const output = buildInaProspectiveEvaluation(contextFor([...history, actual]), [cycle], [resolution]);
  assert.equal(output.outputKey, "research.prospective-evaluation");
  assert.equal(output.result.cycles, 1);
  assert.equal(output.result.frozenForecasts, 1);
  assert.equal(output.result.resolvedForecasts, 1);
  assert.equal(output.result.pendingForecasts, 0);
  assert.equal(output.result.ledgerAudit.summary.integrity, "clean");
  assert.equal(output.result.performance.summary.resolvedRecords, 1);
});

test("INA prospective evaluator rejects changed pre-result history", () => {
  const history: Draw[] = Array.from({ length: 220 }, (_, index) => ({
    drawId: 2000 + index,
    digits: [0,1,2,3,4].map((offset, position) => (index * (position + 1) + offset) % 10) as Draw["digits"],
  }));
  const actual: Draw = { drawId: 2220, digits: [1,2,3,4,5] };
  const candidate = generateIntuitionCandidates({
    modes: [], lags: [], positions: [0], absenceThresholds: [],
    poolMethods: ["frequency"], poolSizes: [2], windows: [20], includePools: true,
  })[0];
  const cycle = freezeLearningCycle(history, [{ candidate, priorityScore: 1, priorityReasons: [] }], 2220, "2026-11-28T00:02:00.000Z");
  const altered = history.map(row => ({ ...row, digits: [...row.digits] as Draw["digits"] }));
  altered[10].digits = [9,9,9,9,9];
  const resolution = resolveLearningCycleSignal(cycle, cycle.signals[0], actual, history, "2026-11-28T00:03:00.000Z");
  assert.throws(() => buildInaProspectiveEvaluation(contextFor([...altered, actual]), [cycle], [resolution]), /history fingerprint/);
});

test("INA prospective evaluator rejects a resolution that disagrees with canonical TRIS", () => {
  const history: Draw[] = Array.from({ length: 220 }, (_, index) => ({
    drawId: 3000 + index,
    digits: [0,1,2,3,4].map((offset, position) => (index * (position + 1) + offset) % 10) as Draw["digits"],
  }));
  const actual: Draw = { drawId: 3220, digits: [2,3,4,5,6] };
  const candidate = generateIntuitionCandidates({
    modes: [], lags: [], positions: [0], absenceThresholds: [],
    poolMethods: ["frequency"], poolSizes: [2], windows: [20], includePools: true,
  })[0];
  const cycle = freezeLearningCycle(history, [{ candidate, priorityScore: 1, priorityReasons: [] }], 3220, "2026-11-28T00:02:00.000Z");
  const resolution = resolveLearningCycleSignal(cycle, cycle.signals[0], actual, history, "2026-11-28T00:03:00.000Z");
  assert.throws(() => buildInaProspectiveEvaluation(contextFor([...history, actual]), [cycle], [{ ...resolution, actual: "99999" }]), /differs from canonical draw/);
});
