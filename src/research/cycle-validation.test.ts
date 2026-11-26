import test from "node:test";
import assert from "node:assert/strict";
import { validateHistoricalCycles } from "./cycle-validation";
import type { HistoricalPackage } from "./historical-comparison";

const make = (id: string, date: string, rows: Array<[string, number, string?]>): HistoricalPackage => ({
  id, name: id, date,
  package: {
    manifest: { schema: "tris-reproducibility-manifest-v1", snapshotFingerprint: id },
    snapshots: rows.map(([candidateKey, resolved, classification = "neutral"]) => ({
      candidateKey, history: [{ recordedAt: date, classification, resolved }],
    })),
  },
});
const packs = (classes: string[], values = classes.map((_, i) => i + 1)) =>
  classes.map((c, i) => make(String(i), `2026-01-${String(i + 1).padStart(2, "0")}`, [["A", values[i], c]]));

test("uses deterministic max-statistic permutation adjustment", () => {
  const input = packs(["neutral", "favorable", "neutral", "favorable", "neutral", "favorable", "neutral", "favorable", "neutral", "favorable"]);
  const a = validateHistoricalCycles(input, { permutations: 99, seed: 42 });
  const b = validateHistoricalCycles(input, { permutations: 99, seed: 42 });
  assert.equal(a.valid, true);
  if (a.valid && b.valid) assert.deepEqual(a.rows, b.rows);
});

test("constant classifications are not reported as cycles", () => {
  const input = packs(Array(10).fill("neutral"), Array(10).fill(4));
  const result = validateHistoricalCycles(input, { permutations: 99 });
  assert.equal(result.valid, true);
  if (result.valid) assert.equal(result.rows.some(row => row.basis === "classification"), false);
});

test("reports insufficient holdout separately", () => {
  const input = packs(["n", "f", "n", "f"]);
  const result = validateHistoricalCycles(input, { permutations: 99 });
  assert.equal(result.valid, true);
  if (result.valid) assert.equal(result.summary.notEvaluable, result.rows.length);
});

test("rejects invalid package histories", () => {
  const input = [make("1", "bad", [["A", 1]]), make("2", "2026-01-02", [["A", 2]])];
  assert.equal(validateHistoricalCycles(input).valid, false);
});
