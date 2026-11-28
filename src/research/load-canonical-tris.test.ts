import test from "node:test";
import assert from "node:assert/strict";
import type { Draw } from "../research-core";
import type { CanonicalSourceManifest } from "./ina-snapshot";
import { assertCanonicalManifestMatchesDraws } from "./load-canonical-tris";

const draws: Draw[] = [
  { drawId: 100, digits: [0,1,2,3,4], date: "2026-01-01" },
  { drawId: 101, digits: [5,6,7,8,9], date: "2026-01-02" },
];
const manifest: CanonicalSourceManifest = {
  schemaVersion: 1, sourceUrl: "https://example.test/Tris.csv",
  fetchedAt: "2026-01-03T00:00:00.000Z", sha256: "a".repeat(64),
  byteLength: 123, rowCount: 2, earliestDrawId: 100, latestDrawId: 101,
  earliestDate: "2026-01-01", latestDate: "2026-01-02", snapshot: "Tris-101-test.csv",
};

test("canonical manifest agrees with row count, contest range, dates and bytes", () => {
  assert.doesNotThrow(() => assertCanonicalManifestMatchesDraws(manifest, draws, 123));
});
test("rejects a manifest whose row count or contest boundaries are stale", () => {
  assert.throws(() => assertCanonicalManifestMatchesDraws({ ...manifest, rowCount: 3 }, draws, 123), /número de sorteos/);
  assert.throws(() => assertCanonicalManifestMatchesDraws({ ...manifest, earliestDrawId: 99 }, draws, 123), /rango de concursos/);
  assert.throws(() => assertCanonicalManifestMatchesDraws({ ...manifest, latestDrawId: 102 }, draws, 123), /rango de concursos/);
});
test("rejects a manifest whose first or last draw date is stale", () => {
  assert.throws(() => assertCanonicalManifestMatchesDraws({ ...manifest, earliestDate: "2025-12-31" }, draws, 123), /fecha del primer/);
  assert.throws(() => assertCanonicalManifestMatchesDraws({ ...manifest, latestDate: "2026-01-03" }, draws, 123), /fecha del último/);
});
test("rejects malformed manifest metadata and mismatched byte length", () => {
  assert.throws(() => assertCanonicalManifestMatchesDraws({ ...manifest, sha256: "bad" }, draws, 123), /esquema esperado/);
  assert.throws(() => assertCanonicalManifestMatchesDraws({ ...manifest, fetchedAt: "bad" }, draws, 123), /esquema esperado/);
  assert.throws(() => assertCanonicalManifestMatchesDraws(manifest, draws, 124), /tamaño del CSV/);
});
