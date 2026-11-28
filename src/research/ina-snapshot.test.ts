import test from "node:test";
import assert from "node:assert/strict";
import {
  computeSha256Hex,
  snapshotFromCanonicalManifest,
  snapshotFromLocalCsv,
  verifySnapshotBytes,
} from "./ina-snapshot";

test("SHA-256 helper returns the standard digest for exact bytes", async () => {
  const bytes = new TextEncoder().encode("abc");
  assert.equal(await computeSha256Hex(bytes), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
});

test("canonical manifest maps to a remote immutable snapshot", () => {
  const snapshot = snapshotFromCanonicalManifest({
    schemaVersion: 1,
    sourceUrl: "https://example.test/Tris.csv",
    fetchedAt: "2026-11-27T12:00:00.000Z",
    sha256: "d".repeat(64),
    byteLength: 123,
    rowCount: 2,
    earliestDrawId: 100,
    latestDrawId: 101,
    snapshot: "Tris-101-test.csv",
  });
  assert.equal(snapshot.sourceType, "remote");
  assert.equal(snapshot.snapshotId, "Tris-101-test.csv");
  assert.equal(snapshot.sourceUrl, "https://example.test/Tris.csv");
  assert.equal(snapshot.rowCount, 2);
});

test("local CSV snapshot carries its own digest and no fabricated remote URL", async () => {
  const csv = "CONCURSO,ID,R1,R2,R3,R4,R5,FECHA\n100,1,0,1,2,3,4,2026-01-01";
  const validation = { valid: [{ drawId: 100, digits: [0, 1, 2, 3, 4] as const, date: "2026-01-01" }], errors: [], warnings: [] };
  const snapshot = await snapshotFromLocalCsv(csv, validation, "my-tris.csv", "2026-01-02T00:00:00.000Z");
  assert.equal(snapshot.sourceType, "local");
  assert.equal(snapshot.sourceUrl, null);
  assert.equal(snapshot.rowCount, 1);
  assert.equal(snapshot.earliestDrawId, 100);
  assert.equal(snapshot.latestDrawId, 100);
  assert.equal(await verifySnapshotBytes(new TextEncoder().encode(csv), snapshot), true);
  assert.equal(await verifySnapshotBytes(new TextEncoder().encode(csv + "\n"), snapshot), false);
});
