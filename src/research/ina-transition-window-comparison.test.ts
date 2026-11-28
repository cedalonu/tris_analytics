import test from "node:test";
import assert from "node:assert/strict";
import type { Draw, Validation } from "../research-core";
import { createInaContext, type DatasetSnapshot } from "./ina-contracts";
import { buildInaTransitionWindowComparison } from "./ina-transition-window-comparison";

const snapshotFor = (draws: Draw[]): DatasetSnapshot => ({
  snapshotId: "window-comparison-" + (draws.at(-1)?.drawId ?? "empty"),
  sourceType: "remote",
  sourceUrl: "https://example.test/Tris.csv",
  fetchedAt: "2026-11-28T00:00:00.000Z",
  sha256: "a".repeat(64),
  rowCount: draws.length,
  earliestDrawId: draws[0]?.drawId ?? null,
  latestDrawId: draws.at(-1)?.drawId ?? null,
});

function legacyInlineComparison(draws: Draw[]) {
  const windows = [50, 150, 500] as const;
  const perWindow = windows.map(w => {
    const ds = draws.slice(-w);
    const counts = new Map<string, number>();
    ds.forEach(draw => {
      for (let p = 0; p < 4; p++) {
        const key = p + "-" + draw.digits[p] + "-" + draw.digits[p + 1];
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10);
    return { w, n: ds.length, counts, top: new Set(top.map(([key]) => key)) };
  });
  const all = new Map<string, { key: string; seen: number; counts: number[] }>();
  perWindow.forEach((win, i) => win.counts.forEach((n, key) => {
    const row = all.get(key) || { key, seen: 0, counts: [0, 0, 0] };
    row.counts[i] = n;
    if (win.top.has(key)) row.seen++;
    all.set(key, row);
  }));
  const ranked = [...all.values()]
    .filter(row => row.seen >= 2)
    .sort((a, b) =>
      b.seen - a.seen ||
      b.counts[0] - a.counts[0] ||
      b.counts[1] - a.counts[1] ||
      b.counts[2] - a.counts[2],
    )
    .slice(0, 12);
  return {
    windows: perWindow.map(({ w, n, top }) => ({ windowSize: w, sampleSize: n, topKeys: [...top].map(([key]) => key) })),
    ranked: ranked.map(row => ({
      key: row.key,
      topTenAppearances: row.seen,
      counts: row.counts,
    })),
  };
}

function makeDraws(count: number): Draw[] {
  return Array.from({ length: count }, (_, index) => ({
    drawId: 1000 + index,
    digits: [
      (index * 7 + Math.floor(index / 11)) % 10,
      (index * 3 + Math.floor(index / 7)) % 10,
      (index * 7 + Math.floor(index / 11)) % 10,
      (index * 3 + Math.floor(index / 7)) % 10,
      (index * 9 + Math.floor(index / 13)) % 10,
    ],
  }));
}

for (const count of [0, 1, 49, 50, 149, 150, 499, 500, 620]) {
  test("INA transition-window comparison preserves legacy output for " + count + " draws", () => {
    const draws = makeDraws(count);
    const context = createInaContext({
      snapshot: snapshotFor(draws),
      validation: { valid: draws, errors: [], warnings: [] } satisfies Validation,
      builtAt: "2026-11-28T00:01:00.000Z",
    });
    const output = buildInaTransitionWindowComparison(context);
    const legacy = legacyInlineComparison(draws);
    assert.deepEqual(
      output.result.windows.map(({ windowSize, sampleSize, topKeys }) => ({ windowSize, sampleSize, topKeys })),
      legacy.windows,
    );
    assert.deepEqual(
      output.result.ranked.map(({ key, topTenAppearances, counts }) => ({ key, topTenAppearances, counts })),
      legacy.ranked,
    );
    assert.equal(output.datasetVersionId, context.version.versionId);
    assert.equal(output.snapshotSha256, context.snapshot.sha256);
    assert.equal(output.drawCutoff, draws.at(-1)?.drawId ?? null);
    assert.equal(output.sampleSize, count);
  });
}

test("INA transition-window comparison rejects invalid snapshots", () => {
  const draws = makeDraws(10);
  const context = createInaContext({
    snapshot: { ...snapshotFor(draws), rowCount: 11 },
    validation: { valid: draws, errors: [], warnings: [] },
    builtAt: "2026-11-28T00:01:00.000Z",
  });
  assert.throws(() => buildInaTransitionWindowComparison(context), /invalid INA context/);
});
