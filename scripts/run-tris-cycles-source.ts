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
import { fingerprintDraws, syncTrisCsvSnapshot } from "../src/research/tris-csv-sync";

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

// Protect the complete previously published canonical prefix before accepting
// any new source snapshot. A changed historical draw is quarantined, not
// silently rewritten as the latest official history.
const canonicalCsvPath = resolve("data/canonical/Tris.csv");
const canonicalManifestPath = resolve("data/canonical/source-manifest.json");
let previousCheckpoint = null as {
  schemaVersion: 1;
  processedThroughDrawId: number;
  processedDrawCount: number;
  processedPrefixSha256: string;
  updatedAt: string;
} | null;
try {
  const previousBytes = await readFile(canonicalCsvPath);
  const previousManifest = JSON.parse(await readFile(canonicalManifestPath, "utf8")) as {
    schemaVersion?: number; sha256?: string; byteLength?: number; rowCount?: number;
    earliestDrawId?: number; latestDrawId?: number;
  };
  const previousSha256 = createHash("sha256").update(previousBytes).digest("hex");
  if (previousManifest.schemaVersion !== 1 ||
      previousManifest.sha256?.toLowerCase() !== previousSha256 ||
      previousManifest.byteLength !== previousBytes.byteLength) {
    throw new Error("Previously published canonical snapshot does not match its manifest; refusing source update.");
  }
  const previousImported = importTrisCsv(previousBytes.toString("utf8"));
  const previousGaps = previousImported.validation.warnings.filter(warning => warning.startsWith("draw gap "));
  const previousDraws = previousImported.validation.valid;
  if (previousImported.validation.errors.length || previousGaps.length ||
      previousDraws.length !== previousManifest.rowCount ||
      previousDraws[0]?.drawId !== previousManifest.earliestDrawId ||
      previousDraws.at(-1)?.drawId !== previousManifest.latestDrawId) {
    throw new Error("Previously published canonical history fails validation; refusing source update.");
  }
  previousCheckpoint = {
    schemaVersion: 1,
    processedThroughDrawId: previousDraws.at(-1)!.drawId,
    processedDrawCount: previousDraws.length,
    processedPrefixSha256: fingerprintDraws(previousDraws),
    updatedAt: fetchedAt,
  };
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  // A first-time bootstrap is allowed only when neither canonical file exists.
  try {
    await readFile(canonicalManifestPath);
    throw new Error("Canonical manifest exists without its CSV; refusing bootstrap.");
  } catch (manifestError) {
    if ((manifestError as NodeJS.ErrnoException).code !== "ENOENT") throw manifestError;
  }
}
const sync = syncTrisCsvSnapshot(draws, previousCheckpoint, fetchedAt);
console.log("Canonical prefix guard:", JSON.stringify({
  status: sync.status,
  previousDrawId: sync.previousDrawId,
  latestDrawId: sync.latestDrawId,
  newDrawCount: sync.newDraws.length,
  warnings: sync.warnings,
}, null, 2));

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
// Keep the content-addressed snapshot manifest immutable too. Repeated hourly
// checks of unchanged CSV must not create a new canonical-data commit each hour.
try {
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  const existingManifest = JSON.parse(await readFile(manifestPath, "utf8")) as { sha256?: string; snapshot?: string };
  if (existingManifest.sha256 !== sha256 || existingManifest.snapshot !== snapshotName) {
    throw new Error("Existing snapshot manifest does not match the fetched content.");
  }
}

console.log("Validated source snapshot:", JSON.stringify(manifest, null, 2));
const tsxCli = resolve("node_modules/tsx/dist/cli.mjs");
for (const script of ["scripts/run-tris-cycles.ts", "scripts/run-tris-cycles-audit.ts"]) {
  const result = spawnSync(process.execPath, [tsxCli, resolve(script), snapshotPath, ledgerDir], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log("TRIS source cycle and audit completed against the same immutable snapshot.");
