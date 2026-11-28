#!/usr/bin/env tsx
/**
 * Fetch the authorized public TRIS CSV once, validate it, preserve a content-
 * addressed snapshot, then run and audit the append-only cycle ledger.
 * GitHub Actions owns the hourly schedule; this process does not poll internally.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { importTrisCsv } from "../src/research/data-adapter";

const SOURCE_URL = "https://raw.githubusercontent.com/pakinja/pakin/master/Tris.csv";
const snapshotDir = resolve("data/source-snapshots");
const ledgerDir = resolve("data/cycles");

const response = await fetch(SOURCE_URL, { headers: { Accept: "text/csv" }, redirect: "error" });
if (!response.ok) throw new Error("Authorized TRIS source returned HTTP " + response.status + ".");
const contentType = response.headers.get("content-type") ?? "";
if (!/text\/(csv|plain)|application\/octet-stream/i.test(contentType)) {
  throw new Error("Unexpected content type from authorized TRIS source: " + contentType);
}
const csv = await response.text();
const fetchedAt = new Date().toISOString();
const imported = importTrisCsv(csv, fetchedAt);
if (imported.validation.errors.length) {
  throw new Error("TRIS CSV validation failed: " + imported.validation.errors.slice(0, 20).join("; "));
}
const gaps = imported.validation.warnings.filter(warning => warning.startsWith("draw gap "));
if (gaps.length) throw new Error("TRIS CSV contains missing contest IDs: " + gaps.slice(0, 20).join("; "));
const draws = imported.validation.valid;
if (draws.length < 200) throw new Error("At least 200 validated draws are required.");

const latest = draws.at(-1)!;
const earliest = draws[0]!;
const sha256 = createHash("sha256").update(csv, "utf8").digest("hex");
const snapshotName = "Tris-" + latest.drawId + "-" + sha256.slice(0, 12) + ".csv";
const snapshotPath = resolve(snapshotDir, snapshotName);
await mkdir(snapshotDir, { recursive: true });
await mkdir(ledgerDir, { recursive: true });

// Snapshot bytes are immutable. If a content-addressed path already exists,
// verify it instead of silently trusting an existing file with the same name.
try {
  await writeFile(snapshotPath, csv, { encoding: "utf8", flag: "wx" });
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  const existing = await readFile(snapshotPath);
  const existingHash = createHash("sha256").update(existing).digest("hex");
  if (existingHash !== sha256) {
    throw new Error("Existing content-addressed snapshot does not match its SHA-256 filename.");
  }
}

const manifest = {
  schemaVersion: 1,
  sourceUrl: SOURCE_URL,
  fetchedAt,
  sha256,
  byteLength: Buffer.byteLength(csv, "utf8"),
  rowCount: draws.length,
  earliestDrawId: earliest.drawId,
  latestDrawId: latest.drawId,
  earliestDate: earliest.date,
  latestDate: latest.date,
  snapshot: snapshotName,
  etag: response.headers.get("etag"),
  lastModified: response.headers.get("last-modified"),
};
const manifestPath = resolve(snapshotDir, "Tris-" + latest.drawId + "-" + sha256.slice(0, 12) + ".json");
// Refresh observation metadata even when the CSV content is unchanged. The
// CSV snapshot remains immutable; fetchedAt records the latest successful fetch.
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log("Validated source snapshot:", JSON.stringify(manifest, null, 2));
const tsxCli = resolve("node_modules/tsx/dist/cli.mjs");
for (const script of ["scripts/run-tris-cycles.ts", "scripts/run-tris-cycles-audit.ts"]) {
  const result = spawnSync(process.execPath, [tsxCli, resolve(script), snapshotPath, ledgerDir], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log("TRIS source cycle and audit completed against the same immutable snapshot.");
