import test from "node:test";
import assert from "node:assert/strict";
import { auditInaPropagation, type PropagationOutputEvidence } from "./ina-propagation-audit";
import { createDefaultInaModuleRegistry } from "./ina-registry";

const canonical = {
  datasetVersionId: "tris:abc:37008",
  snapshotSha256: "a".repeat(64),
  drawCutoff: 37008,
  sampleSize: 25976,
};
const current = (outputKey: string): PropagationOutputEvidence => ({
  outputKey,
  datasetVersionId: canonical.datasetVersionId,
  snapshotSha256: canonical.snapshotSha256,
  drawCutoff: canonical.drawCutoff,
  sampleSize: canonical.sampleSize,
});

test("marks only fully represented module outputs current", () => {
  const audit = auditInaPropagation(canonical, [
    current("ina.position-profile"),
    current("research.positional-absence"),
  ], { generatedAt: "2026-11-28T12:00:00.000Z" });
  const absence = audit.targets.find(target => target.moduleId === "positional-absence");
  const core = audit.targets.find(target => target.moduleId === "ina-core");
  assert.equal(absence?.state, "current");
  assert.equal(core?.state, "current");
  assert.equal(audit.totals.current, 2);
  assert.ok(audit.totals.missing > 0);
});

test("marks output with old cutoff or hash blocked", () => {
  const stale = { ...current("research.positional-absence"), drawCutoff: 37007 };
  const audit = auditInaPropagation(canonical, [stale]);
  const absence = audit.targets.find(target => target.moduleId === "positional-absence");
  assert.equal(absence?.state, "blocked");
  assert.ok(absence?.reasons.some(reason => reason.includes("draw cutoff mismatch")));
});

test("does not treat registered source files or implemented status as current", () => {
  const audit = auditInaPropagation(canonical, [], { registry: createDefaultInaModuleRegistry() });
  assert.ok(audit.targets.every(target => target.state === "missing"));
  assert.ok(audit.targets.every(target => target.outputs.length === 0));
});

test("marks partially supplied multi-output modules stale", () => {
  const audit = auditInaPropagation(canonical, [current("research.transition-stability")]);
  const transitions = audit.targets.find(target => target.moduleId === "positional-transitions");
  assert.equal(transitions?.state, "stale");
  assert.ok((transitions?.missingOutputKeys.length ?? 0) > 0);
});
