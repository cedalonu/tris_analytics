import test from "node:test";
import assert from "node:assert/strict";
import { detectHistoricalCycles } from "./cycle-detector";
import type { HistoricalPackage } from "./historical-comparison";

const pack = (id: string, date: string, rows: Array<[string, number, string?]>): HistoricalPackage => ({
  id, name: id, date,
  package: {
    manifest: { schema: "tris-reproducibility-manifest-v1", snapshotFingerprint: id },
    snapshots: rows.map(([candidateKey, resolved, classification = "neutral"]) => ({
      candidateKey,
      history: [{ recordedAt: date, classification, resolved }],
    })),
  },
});

test("detects a repeated classification sequence with period two", () => {
  const result = detectHistoricalCycles([
    pack("1", "2026-01-01", [["A", 1, "neutral"]]),
    pack("2", "2026-01-02", [["A", 2, "favorable"]]),
    pack("3", "2026-01-03", [["A", 3, "neutral"]]),
    pack("4", "2026-01-04", [["A", 4, "favorable"]]),
  ]);
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.patterns[0].basis, "classification");
    assert.equal(result.patterns[0].period, 2);
    assert.equal(result.patterns[0].repetitions, 2);
  }
});

test("detects recurring direction changes separately from classifications", () => {
  const result = detectHistoricalCycles([
    pack("1", "2026-01-01", [["A", 1]]),
    pack("2", "2026-01-02", [["A", 3]]),
    pack("3", "2026-01-03", [["A", 2]]),
    pack("4", "2026-01-04", [["A", 5]]),
    pack("5", "2026-01-05", [["A", 4]]),
  ]);
  assert.equal(result.valid, true);
  if (result.valid) assert.equal(result.patterns.some(pattern => pattern.basis === "direction" && pattern.period === 2), true);
});

test("does not label a constant state as a cycle", () => {
  const result = detectHistoricalCycles([
    pack("1", "2026-01-01", [["A", 1, "neutral"]]),
    pack("2", "2026-01-02", [["A", 1, "neutral"]]),
    pack("3", "2026-01-03", [["A", 1, "neutral"]]),
    pack("4", "2026-01-04", [["A", 1, "neutral"]]),
  ]);
  assert.equal(result.valid, true);
  if (result.valid) assert.equal(result.patterns.length, 0);
});

test("reports insufficient history and validates packages", () => {
  const result = detectHistoricalCycles([pack("1", "2026-01-01", [["A", 1]]), pack("2", "2026-01-02", [["A", 2]])]);
  assert.equal(result.valid, true);
  if (result.valid) assert.equal(result.summary.insufficient, 1);
  assert.equal(detectHistoricalCycles([pack("1", "bad", [["A", 1]]), pack("2", "2026-01-02", [["A", 2]])]).valid, false);
});
