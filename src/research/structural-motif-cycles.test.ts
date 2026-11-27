import { describe, expect, it } from "vitest";
import { detectMotifCycles } from "./structural-motif-cycles";
import type { MotifWindow, TriadType } from "./structural-motifs";

const makeWindows = (sequence: Array<TriadType | null>): MotifWindow[] => sequence.map((type, index) => ({
  index, startDate: "", endDate: "", packageCount: 9, nodes: 3, edges: 0,
  motifs: type ? [{ key: "A::B::C", members: ["A", "B", "C"], type }] : [],
  counts: { empty: 0, "single-edge": 0, wedge: 0, triangle: 0 },
  rates: { empty: 0, "single-edge": 0, wedge: 0, triangle: 0 }
}));

describe("detectMotifCycles", () => {
  it("detects a repeated period-two configuration", () => {
    const result = detectMotifCycles(makeWindows(["wedge", "triangle", "wedge", "triangle", "wedge", "triangle"]));
    expect(result.cycles[0]).toMatchObject({ period: 2, repetitions: 3, sequence: ["wedge", "triangle"] });
  });
  it("detects a repeated period-three configuration", () => {
    const result = detectMotifCycles(makeWindows(["triangle", "wedge", "single-edge", "triangle", "wedge", "single-edge"]));
    expect(result.cycles[0]).toMatchObject({ period: 3, repetitions: 2 });
  });
  it("does not classify a single change as a cycle", () => {
    expect(detectMotifCycles(makeWindows(["wedge", "triangle", "wedge"])).cycles).toHaveLength(0);
  });
  it("breaks the sequence when a triad is absent", () => {
    expect(detectMotifCycles(makeWindows(["wedge", "triangle", null, "wedge", "triangle"])).cycles).toHaveLength(0);
  });
  it("marks a cycle ending at the last window as right-censored", () => {
    const result = detectMotifCycles(makeWindows(["wedge", "triangle", "wedge", "triangle"]));
    expect(result.cycles[0].rightCensored).toBe(true);
  });
  it("returns an empty summary for no windows", () => {
    expect(detectMotifCycles([]).summary.cycleCount).toBe(0);
  });
});
