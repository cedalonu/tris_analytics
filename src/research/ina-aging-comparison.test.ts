import test from "node:test";
import assert from "node:assert/strict";
import type { Draw, Pos, Validation } from "../research-core";
import { createInaContext, type DatasetSnapshot } from "./ina-contracts";
import { buildInaAgingComparison, rankInaDigitsByFrequencyAndAging } from "./ina-aging-comparison";

const draws: Draw[] = Array.from({ length: 180 }, (_, index) => ({
  drawId: 3000 + index,
  digits: [
    (index % 10) as Draw["digits"][number],
    ((index * 3 + Math.floor(index / 11)) % 10) as Draw["digits"][number],
    ((index * 7 + Math.floor(index / 13)) % 10) as Draw["digits"][number],
    ((index + 4) % 10) as Draw["digits"][number],
    ((index * 9 + Math.floor(index / 7)) % 10) as Draw["digits"][number],
  ],
}));
const snapshot: DatasetSnapshot = {
  snapshotId: "aging-3179",
  sourceType: "remote",
  sourceUrl: "https://example.test/Tris.csv",
  fetchedAt: "2026-01-01T00:00:00.000Z",
  sha256: "3".repeat(64),
  rowCount: draws.length,
  earliestDrawId: 3000,
  latestDrawId: 3179,
};
const validation: Validation = { valid: draws, errors: [], warnings: [] };

function legacyRank(history: Draw[], position: Pos, agingMode: boolean) {
  const recent = history.slice(-50), broad = history.slice(-150), latestId = history.at(-1)?.drawId ?? 0;
  return Array.from({ length: 10 }, (_, digit) => {
    const recentN = recent.filter(draw => draw.digits[position] === digit).length;
    const broadN = broad.filter(draw => draw.digits[position] === digit).length;
    const frequency = recentN / 50 * 0.65 + broadN / 150 * 0.35;
    if (!agingMode) return { digit, score: frequency, frequency, agingScore: 0 };
    const ids = history.filter(draw => draw.digits[position] === digit).map(draw => draw.drawId);
    const gaps = ids.slice(1).map((id, index) => id - ids[index]);
    const meanGap = gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0;
    const aging = ids.length ? latestId - ids[ids.length - 1] : 0;
    const ratio = meanGap > 0 ? Math.min(2, aging / meanGap) : 0;
    const agingScore = ratio / 2;
    return { digit, score: frequency * 0.8 + agingScore * 0.2, frequency, agingScore };
  }).sort((a, b) => b.score - a.score || a.digit - b.digit);
}

test("INA experimental ranking exactly preserves the previous frequency and aging formula", () => {
  const context = createInaContext({ snapshot, validation, builtAt: "2026-01-01T00:01:00.000Z" });
  for (const position of [0, 1, 2, 3, 4] as Pos[]) {
    assert.deepEqual(rankInaDigitsByFrequencyAndAging(draws, position, false), legacyRank(draws, position, false));
    assert.deepEqual(rankInaDigitsByFrequencyAndAging(draws, position, true), legacyRank(draws, position, true));
  }
  const output = buildInaAgingComparison(context, { poolSize: 3 });
  assert.equal(output.outputKey, "research.aging-comparison");
  assert.equal(output.drawCutoff, 3179);
  assert.equal(output.result.agingPools.length, 5);
  assert.equal(output.result.agingPools[0].length, 3);
});

test("aging walk-forward comparison exactly reproduces prior-only hit counts", () => {
  const context = createInaContext({ snapshot, validation, builtAt: "2026-01-01T00:01:00.000Z" });
  const output = buildInaAgingComparison(context, { poolSize: 3, historyLimit: 100, minTrain: 30, testLimit: 50 });
  const train = draws.slice(-100);
  const tested = Math.min(50, train.length - 30), testStart = train.length - tested;
  const baseHits = Array(5).fill(0), experimentalHits = Array(5).fill(0);
  for (let index = testStart; index < train.length; index++) {
    const prior = train.slice(0, index), actual = train[index];
    if (prior.length < 30) continue;
    for (let position = 0; position < 5; position++) {
      if (legacyRank(prior, position as Pos, false).slice(0, 3).some(row => row.digit === actual.digits[position])) baseHits[position]++;
      if (legacyRank(prior, position as Pos, true).slice(0, 3).some(row => row.digit === actual.digits[position])) experimentalHits[position]++;
    }
  }
  assert.equal(output.result.comparison.tested, tested);
  assert.deepEqual(output.result.comparison.baseHits, baseHits);
  assert.deepEqual(output.result.comparison.experimentalHits, experimentalHits);
});

test("aging comparison refuses invalid INA context", () => {
  const context = createInaContext({
    snapshot: { ...snapshot, rowCount: 181 },
    validation,
    builtAt: "2026-01-01T00:01:00.000Z",
  });
  assert.throws(() => buildInaAgingComparison(context, { poolSize: 3 }), /invalid INA context/);
});
