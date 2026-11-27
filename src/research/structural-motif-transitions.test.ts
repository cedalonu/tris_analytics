import test from "node:test";
import assert from "node:assert/strict";
import type { MotifWindow, StructuralMotif, TriadType } from "./structural-motifs";
import { analyzeMotifWindowTransition, classifyMotifTransitions } from "./structural-motif-transitions";

function motif(members: [string, string, string], type: TriadType): StructuralMotif {
  return { key: [...members].sort().join("::"), members: [...members].sort() as [string, string, string], type };
}
function window(index: number, motifs: StructuralMotif[]): MotifWindow {
  return { index, startDate: "2026-01-01", endDate: "2026-01-09", packageCount: 9, nodes: 3, edges: 0, motifs, counts: { empty: 0, "single-edge": 0, wedge: 0, triangle: 0 }, rates: { empty: 0, "single-edge": 0, wedge: 0, triangle: 0 } };
}

test("recognizes a stable triad and a newly formed triad", () => {
  const a = motif(["A", "B", "C"], "wedge");
  const b = motif(["A", "B", "D"], "empty");
  const events = classifyMotifTransitions(window(0, [a]), window(1, [a, b]));
  assert.equal(events.find(event => event.key === a.key)?.category, "stable");
  assert.equal(events.find(event => event.key === b.key)?.category, "formation");
});

test("recognizes dissolution when an exact triad disappears", () => {
  const a = motif(["A", "B", "C"], "triangle");
  const events = classifyMotifTransitions(window(0, [a]), window(1, []));
  assert.equal(events.length, 1);
  assert.equal(events[0].category, "dissolution");
  assert.equal(events[0].fromType, "triangle");
  assert.equal(events[0].toType, null);
});

test("recognizes wedge to triangle reconfiguration", () => {
  const a = motif(["A", "B", "C"], "wedge");
  const b = motif(["A", "B", "C"], "triangle");
  const result = analyzeMotifWindowTransition(window(0, [a]), window(1, [b]));
  assert.equal(result.events[0].category, "reconfiguration");
  assert.deepEqual(result.shapeTransitions, [{ fromType: "wedge", toType: "triangle", count: 1 }]);
  assert.equal(result.reconfigurationRate, 1);
});

test("recognizes triangle to wedge reconfiguration", () => {
  const a = motif(["A", "B", "C"], "triangle");
  const b = motif(["A", "B", "C"], "wedge");
  const events = classifyMotifTransitions(window(0, [a]), window(1, [b]));
  assert.equal(events[0].category, "reconfiguration");
  assert.equal(events[0].fromType, "triangle");
  assert.equal(events[0].toType, "wedge");
});

test("empty windows produce no transition events", () => {
  const result = analyzeMotifWindowTransition(window(0, []), window(1, []));
  assert.deepEqual(result.events, []);
  assert.equal(result.counts.stable, 0);
  assert.equal(result.persistenceRate, 0);
});
