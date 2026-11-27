import test from "node:test";
import assert from "node:assert/strict";
import type { MotifWindow, StructuralMotif, TriadType } from "./structural-motifs";
import { analyzeMotifPersistence } from "./structural-motif-persistence";
function motif(type: TriadType): StructuralMotif {
  return { key: "A::B::C", members: ["A", "B", "C"], type };
}
function window(index: number, type: TriadType | null): MotifWindow {
  return { index, startDate: "2026-01-01", endDate: "2026-01-09", packageCount: 9, nodes: type ? 3 : 0, edges: 0, motifs: type ? [motif(type)] : [], counts: { empty: 0, "single-edge": 0, wedge: 0, triangle: 0 }, rates: { empty: 0, "single-edge": 0, wedge: 0, triangle: 0 } };
}

test("formation persistence counts consecutive windows with the new type", () => {
  const result = analyzeMotifPersistence([window(0, null), window(1, "wedge"), window(2, "wedge"), window(3, "wedge")]);
  assert.equal(result.episodes[0].category, "formation");
  assert.equal(result.episodes[0].persistenceWindows, 3);
  assert.equal(result.episodes[0].rightCensored, true);
  assert.equal(result.persistentEpisodes.length, 1);
});

test("reconfiguration persistence ends when the type changes again", () => {
  const result = analyzeMotifPersistence([window(0, "wedge"), window(1, "triangle"), window(2, "triangle"), window(3, "single-edge")]);
  const episode = result.episodes.find(item => item.category === "reconfiguration")!;
  assert.equal(episode.persistenceWindows, 2);
  assert.equal(episode.rightCensored, false);
});

test("dissolution duration counts consecutive absent windows", () => {
  const result = analyzeMotifPersistence([window(0, "triangle"), window(1, null), window(2, null), window(3, null)]);
  const episode = result.episodes[0];
  assert.equal(episode.category, "dissolution");
  assert.equal(episode.persistenceWindows, 3);
  assert.equal(episode.rightCensored, true);
});

test("stable runs are recorded and left-censored start is not mistaken for a change", () => {
  const result = analyzeMotifPersistence([window(0, "wedge"), window(1, "wedge"), window(2, "wedge")]);
  assert.equal(result.episodes.length, 0);
  assert.equal(result.stableRuns.length, 1);
  assert.equal(result.stableRuns[0].length, 3);
});

test("isolated one-window state is not persistent at threshold two", () => {
  const result = analyzeMotifPersistence([window(0, null), window(1, "triangle"), window(2, null)]);
  assert.equal(result.episodes[0].persistenceWindows, 1);
  assert.equal(result.persistentEpisodes.length, 0);
});
