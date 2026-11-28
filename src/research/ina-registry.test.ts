import test from "node:test";
import assert from "node:assert/strict";
import type { InaModuleDefinition } from "./ina-contracts";
import { createInaContext, createResearchOutput } from "./ina-contracts";
import {
  createDefaultInaModuleRegistry,
  createInaModuleRegistry,
  validateResearchOutputRegistration,
} from "./ina-registry";

const moduleDef = (
  moduleId: string,
  consumes: string[],
  produces: string[],
): InaModuleDefinition => ({
  moduleId,
  title: moduleId,
  engineId: moduleId + "-engine",
  engineVersion: "1.0.0",
  consumes,
  produces,
  status: "implemented",
  sourceFiles: [],
});

test("default INA registry resolves declared dependencies in topological order", () => {
  const registry = createDefaultInaModuleRegistry();
  assert.equal(registry.valid, true);
  assert.deepEqual(registry.errors, []);
  assert.equal(registry.topologicalOrder[0], "source-integrity");
  assert.ok(registry.topologicalOrder.indexOf("ina-core") < registry.topologicalOrder.indexOf("position-overview"));
  assert.ok(registry.topologicalOrder.indexOf("ina-core") < registry.topologicalOrder.indexOf("operational-dashboard"));
  assert.ok(registry.edges.length > 0);
  assert.ok(registry.modules.filter(module => module.status === "partial").length >= 6);
});

test("registry rejects unresolved dependencies and duplicate producers", () => {
  const unresolved = createInaModuleRegistry([moduleDef("consumer", ["missing.key"], ["consumer.output"])]);
  assert.equal(unresolved.valid, false);
  assert.ok(unresolved.errors.some(error => error.includes("unresolved dependency")));

  const duplicate = createInaModuleRegistry([
    moduleDef("producer-a", [], ["shared.key"]),
    moduleDef("producer-b", [], ["shared.key"]),
  ]);
  assert.equal(duplicate.valid, false);
  assert.ok(duplicate.errors.some(error => error.includes("multiple producers")));
});

test("registry detects dependency cycles", () => {
  const registry = createInaModuleRegistry([
    moduleDef("module-a", ["module-b.output"], ["module-a.output"]),
    moduleDef("module-b", ["module-a.output"], ["module-b.output"]),
  ]);
  assert.equal(registry.valid, false);
  assert.ok(registry.errors.includes("module dependency cycle detected"));
});

test("research outputs must match the registered engine and output key", () => {
  const registry = createDefaultInaModuleRegistry();
  const context = createInaContext({
    snapshot: {
      snapshotId: "registry-test",
      sourceUrl: "https://example.test/Tris.csv",
      fetchedAt: "2026-01-01T00:00:00.000Z",
      sha256: "c".repeat(64),
      rowCount: 1,
      earliestDrawId: 1,
      latestDrawId: 1,
    },
    validation: { valid: [{ drawId: 1, digits: [1, 2, 3, 4, 5] }], errors: [], warnings: [] },
    builtAt: "2026-01-01T00:01:00.000Z",
  });
  const output = createResearchOutput(context, {
    outputId: "ina-position-knowledge-v1",
    outputKey: "ina.position-profile",
    moduleId: "ina-core",
    engineId: "ina-core-position-profile",
    engineVersion: "1.0.0",
    parameters: {},
    generatedAt: "2026-01-01T00:02:00.000Z",
    evidence: { status: "descriptive", phase: "observation", notes: [] },
    result: { sampleSize: 1 },
    warnings: [],
  });
  assert.deepEqual(validateResearchOutputRegistration(output, registry), { valid: true, errors: [] });
  assert.equal(validateResearchOutputRegistration({ ...output, outputKey: "ina.fake" }, registry).valid, false);
  assert.equal(validateResearchOutputRegistration({ ...output, engineVersion: "9.9.9" }, registry).valid, false);
});
