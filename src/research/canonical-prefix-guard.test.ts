import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { Draw } from "../research-core";
import { validateCanonicalPrefix } from "./canonical-prefix-guard";

const base: Draw[] = [
  { drawId: 100, digits: [1,2,3,4,5], date: "2026-01-01" },
  { drawId: 101, digits: [2,3,4,5,6], date: "2026-01-02" },
  { drawId: 102, digits: [3,4,5,6,7], date: "2026-01-03" },
];
const csvFor = (draws: Draw[]) => [
  "CONCURSO,ID,R1,R2,R3,R4,R5,FECHA",
  ...draws.map(d => [d.drawId, "", ...d.digits, d.date].join(",")),
].join("\n") + "\n";
const manifestFor = (csv: string, draws: Draw[]) => JSON.stringify({
  schemaVersion: 1,
  sha256: createHash("sha256").update(Buffer.from(csv, "utf8")).digest("hex"),
  byteLength: Buffer.byteLength(csv, "utf8"),
  rowCount: draws.length,
  earliestDrawId: draws[0].drawId,
  latestDrawId: draws.at(-1)!.drawId,
});
const fetchedAt = "2026-01-04T00:00:00.000Z";

test("accepts an unchanged canonical prefix followed by a new contest", () => {
  const oldCsv = csvFor(base);
  const incoming = [...base, { drawId: 103, digits: [4,5,6,7,8] as Draw["digits"], date: "2026-01-04" }];
  const checkpoint = validateCanonicalPrefix(oldCsv, manifestFor(oldCsv, base), incoming, fetchedAt);
  assert.equal(checkpoint?.processedThroughDrawId, 102);
  assert.equal(checkpoint?.processedDrawCount, 3);
});

test("quarantines a retroactive digit mutation before the live runner writes snapshots", () => {
  const oldCsv = csvFor(base);
  const incoming = base.map(d => ({ ...d, digits: [...d.digits] as Draw["digits"] }));
  incoming[1].digits = [9,9,9,9,9];
  assert.throws(
    () => validateCanonicalPrefix(oldCsv, manifestFor(oldCsv, base), incoming, fetchedAt),
    /previously processed CSV rows changed; refusing incremental sync/,
  );
});

test("rejects a canonical CSV without its paired manifest", () => {
  assert.throws(() => validateCanonicalPrefix(csvFor(base), null, base, fetchedAt), /must either both exist or both be absent/);
});

test("rejects a corrupted previously published canonical snapshot", () => {
  const oldCsv = csvFor(base);
  const alteredCsv = oldCsv.replace("1,2,3,4,5", "9,2,3,4,5");
  assert.throws(
    () => validateCanonicalPrefix(alteredCsv, manifestFor(oldCsv, base), base, fetchedAt),
    /does not match its manifest/,
  );
});

test("rejects a truncated incoming history even when old rows themselves match", () => {
  const oldCsv = csvFor(base);
  assert.throws(
    () => validateCanonicalPrefix(oldCsv, manifestFor(oldCsv, base), base.slice(1), fetchedAt),
    /complete processed prefix/,
  );
});
