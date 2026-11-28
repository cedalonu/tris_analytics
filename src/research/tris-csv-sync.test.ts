import test from "node:test";
import assert from "node:assert/strict";
import type { Draw } from "../research-core";
import { fingerprintDraws, syncTrisCsvSnapshot, type TrisSyncCheckpoint } from "./tris-csv-sync";

const draws: Draw[] = Array.from({ length: 12 }, (_, index) => ({
  drawId: 500 + index,
  digits: [index % 10, (index + 1) % 10, (index + 2) % 10, (index + 3) % 10, (index + 4) % 10] as Draw["digits"],
  date: "2026-11-" + String(index < 5 ? 24 : 25).padStart(2, "0"),
}));
const checkpoint = (rows: Draw[]): TrisSyncCheckpoint => ({
  schemaVersion: 1, processedThroughDrawId: rows.at(-1)!.drawId, processedDrawCount: rows.length,
  processedPrefixSha256: fingerprintDraws(rows), updatedAt: "2026-11-25T00:00:00.000Z",
});

test("first sync initializes checkpoint with full local history", () => {
  const result = syncTrisCsvSnapshot(draws, null, "2026-11-25T01:00:00.000Z");
  assert.equal(result.status, "initialized");
  assert.equal(result.newDraws.length, 12);
  assert.equal(result.checkpoint.processedThroughDrawId, 511);
});
test("subsequent sync returns only newly appended contests", () => {
  const result = syncTrisCsvSnapshot(draws, checkpoint(draws.slice(0, 10)));
  assert.equal(result.status, "updated");
  assert.equal(result.previousDrawId, 509);
  assert.deepEqual(result.newDraws.map(draw => draw.drawId), [510, 511]);
});
test("unchanged CSV does not reprocess contests", () => {
  const result = syncTrisCsvSnapshot(draws, checkpoint(draws));
  assert.equal(result.status, "unchanged");
  assert.equal(result.newDraws.length, 0);
});
test("refuses changed historical rows", () => {
  const prior = draws.slice(0, 10);
  const changed = draws.map(draw => ({ ...draw, digits: [...draw.digits] as Draw["digits"] }));
  changed[3].digits = [9, 9, 9, 9, 9];
  assert.throws(() => syncTrisCsvSnapshot(changed, checkpoint(prior)), /previously processed CSV rows changed/);
});
test("refuses missing contest IDs and incomplete history", () => {
  const gap = draws.filter(draw => draw.drawId !== 505);
  assert.throws(() => syncTrisCsvSnapshot(gap, null), /missing contest ID/);
  assert.throws(() => syncTrisCsvSnapshot(draws.slice(5), checkpoint(draws.slice(0, 10))), /complete processed prefix/);
});
test("keeps all new draws and reports batches larger than five", () => {
  const result = syncTrisCsvSnapshot(draws, checkpoint(draws.slice(0, 6)));
  assert.equal(result.newDraws.length, 6);
  assert.ok(result.warnings.some(warning => warning.includes("More than five new contests")));
});
test("rejects malformed checkpoint hashes and invalid draw values", () => {
  const bad = { ...checkpoint(draws), processedPrefixSha256: "bad" };
  assert.throws(() => syncTrisCsvSnapshot(draws, bad), /malformed TRIS sync checkpoint/);
  const invalid = [...draws];
  invalid[2] = { ...invalid[2], digits: [1, 2, 3] as unknown as Draw["digits"] };
  assert.throws(() => syncTrisCsvSnapshot(invalid, null), /invalid validated draw/);
});
