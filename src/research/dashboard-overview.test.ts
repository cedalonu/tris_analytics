import test from "node:test";
import assert from "node:assert/strict";
import { buildDashboardOverview } from "./dashboard-overview";
import type { Draw } from "../research-core";

const draws: Draw[] = Array.from({ length: 20 }, (_, i) => ({
  drawId: 100 + i,
  digits: [i < 10 ? 0 : 1, 2, 3, 4, 5],
}));

test("dashboard overview sorts draws and compares recent against full history", () => {
  const report = buildDashboardOverview([...draws].reverse(), 10);
  assert.equal(report.totalDraws, 20);
  assert.equal(report.latestDrawId, 119);
  assert.equal(report.windowSize, 10);
  assert.equal(report.positions[0].digits[1].recentCount, 10);
  assert.equal(report.positions[0].digits[1].recentRate, 1);
  assert.equal(report.positions[0].digits[0].historicalRate, 0.5);
  assert.equal(report.positions[0].digits[1].deltaPp, 50);
});

test("empty data produces an explicit empty report", () => {
  const report = buildDashboardOverview([], 50);
  assert.equal(report.totalDraws, 0);
  assert.equal(report.latestDrawId, null);
  assert.equal(report.windowSize, 0);
  assert.equal(report.positions.length, 5);
  assert.equal(report.positions[4].digits[9].deltaPp, 0);
});

test("window is bounded to available draws and at least one", () => {
  assert.equal(buildDashboardOverview(draws, 500).windowSize, 20);
  assert.equal(buildDashboardOverview(draws, 0).windowSize, 1);
});
