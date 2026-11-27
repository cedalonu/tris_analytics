import test from "node:test";
import assert from "node:assert/strict";
import { analyzeHypothesisRelations } from "./hypothesis-relations";
import type { HistoricalPackage } from "./historical-comparison";
const pack = (id: string, date: string, values: Array<[string, number]>): HistoricalPackage => ({
  id, name: id, date,
  package: { manifest: { schema: "tris-reproducibility-manifest-v1", snapshotFingerprint: id }, snapshots: values.map(([candidateKey, resolved]) => ({ candidateKey, history: [{ recordedAt: date, classification: "neutral", resolved }] })) },
});
test("detects aligned co-movement and forms a group when supported by permutations", () => {
  const items: HistoricalPackage[] = [];
  for (let i = 0; i < 22; i++) { const value = Math.sin(i * 1.7) * 10 + i; items.push(pack(String(i), "2026-01-" + String(i + 1).padStart(2, "0"), [["A", value], ["B", value * 2 + 3], ["C", 100 - value * 3]])); }
  const result = analyzeHypothesisRelations(items, { permutations: 199, seed: 44 });
  assert.equal(result.valid, true);
  if (result.valid) { assert.equal(result.rows.length, 3); assert.equal(result.rows.every(row => row.observations === 21), true); assert.equal(result.groups.length > 0, true); }
});
test("does not fill missing candidate observations and flags insufficient pairs", () => {
  const items = Array.from({ length: 6 }, (_, i) => pack(String(i), "2026-02-" + String(i + 1).padStart(2, "0"), i === 2 ? [["A", i], ["B", i]] : [["A", i], ["B", i + 1]]));
  const result = analyzeHypothesisRelations(items);
  assert.equal(result.valid, true);
  if (result.valid) { assert.equal(result.rows[0].observations, 3); assert.equal(result.rows[0].status, "insufficient"); }
});
test("rejects invalid package history", () => {
  const result = analyzeHypothesisRelations([pack("1", "bad", [["A", 1]]), pack("2", "2026-03-02", [["A", 2]])]);
  assert.equal(result.valid, false);
});
