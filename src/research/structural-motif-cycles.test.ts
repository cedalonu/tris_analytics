import test from "node:test";
import assert from "node:assert/strict";
import { detectMotifCycles } from "./structural-motif-cycles";
import type { MotifWindow, TriadType } from "./structural-motifs";

const makeWindows = (sequence: Array<TriadType | null>): MotifWindow[] => sequence.map((type, index) => ({
  index, startDate: "", endDate: "", packageCount: 9, nodes: 3, edges: 0,
  motifs: type ? [{ key: "A::B::C", members: ["A", "B", "C"] as [string, string, string], type }] : [],
  counts: { empty: 0, "single-edge": 0, wedge: 0, triangle: 0 },
  rates: { empty: 0, "single-edge": 0, wedge: 0, triangle: 0 }
}));

test("detects a repeated period-two configuration", () => {
  const result = detectMotifCycles(makeWindows(["wedge", "triangle", "wedge", "triangle", "wedge", "triangle"]));
  assert.deepEqual(result.cycles[0].sequence, ["wedge", "triangle"]);
  assert.equal(result.cycles[0].period, 2);
  assert.equal(result.cycles[0].repetitions, 3);
});
test("detects a repeated period-three configuration", () => {
  const result = detectMotifCycles(makeWindows(["triangle", "wedge", "single-edge", "triangle", "wedge", "single-edge"]));
  assert.equal(result.cycles[0].period, 3);
  assert.equal(result.cycles[0].repetitions, 2);
});
test("does not classify a single change as a cycle", () => {
  assert.equal(detectMotifCycles(makeWindows(["wedge", "triangle", "wedge"])).cycles.length, 0);
});
test("breaks the sequence when a triad is absent", () => {
  assert.equal(detectMotifCycles(makeWindows(["wedge", "triangle", null, "wedge", "triangle"])).cycles.length, 0);
});
test("marks a cycle ending at the last window as right-censored", () => {
  const result = detectMotifCycles(makeWindows(["wedge", "triangle", "wedge", "triangle"]));
  assert.equal(result.cycles[0].rightCensored, true);
});
test("returns an empty summary for no windows", () => {
  assert.equal(detectMotifCycles([]).summary.cycleCount, 0);
});
