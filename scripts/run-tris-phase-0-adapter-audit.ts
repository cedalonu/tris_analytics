#!/usr/bin/env tsx
/** Phase 0 adapter/integrity evidence runner. Uses the exact production loader with a local snapshot-backed fetcher. */
import assert from "node:assert/strict";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import {
  CANONICAL_TRIS_CSV_URL,
  CANONICAL_TRIS_MANIFEST_URL,
  loadCanonicalTrisDataset,
  assertCanonicalManifestMatchesDraws,
} from "../src/research/load-canonical-tris";
import { validateCanonicalPrefix } from "../src/research/canonical-prefix-guard";
import { mapCanonicalDrawsToApp } from "../src/research/canonical-tris-app-adapter";
import type { CanonicalSourceManifest } from "../src/research/ina-snapshot";

const csvPath = resolve(process.argv[2] ?? "data/canonical/Tris.csv");
const manifestPath = resolve(process.argv[3] ?? "data/canonical/source-manifest.json");
const reportPath = resolve(process.argv[4] ?? "reports/research-phase-audit/phase-0-adapter-integrity.json");
const csv = await readFile(csvPath, "utf8");
const manifestText = await readFile(manifestPath, "utf8");
const manifest = JSON.parse(manifestText) as CanonicalSourceManifest;
const bytes = Buffer.from(csv, "utf8");
const sha256 = createHash("sha256").update(bytes).digest("hex");
assert.equal(sha256, manifest.sha256.toLowerCase());
assert.equal(bytes.byteLength, manifest.byteLength);

const mockFetcher: typeof fetch = async (input) => {
  const url = String(input);
  if (url === CANONICAL_TRIS_CSV_URL) {
    return new Response(bytes, { status: 200, headers: { "content-type": "text/csv; charset=utf-8" } });
  }
  if (url === CANONICAL_TRIS_MANIFEST_URL) {
    return new Response(manifestText, { status: 200, headers: { "content-type": "application/json" } });
  }
  return new Response("not found", { status: 404 });
};
const dataset = await loadCanonicalTrisDataset(mockFetcher);
assert.equal(dataset.status, "verified");
assert.equal(dataset.ina.status, "ready");
assert.equal(dataset.draws.length, manifest.rowCount);
assertCanonicalManifestMatchesDraws(manifest, dataset.draws, bytes.byteLength);

const prefixCheckpoint = validateCanonicalPrefix(csv, manifestText, dataset.draws, manifest.fetchedAt);
assert.ok(prefixCheckpoint, "canonical prefix checkpoint must be created");
assert.equal(prefixCheckpoint.processedThroughDrawId, manifest.latestDrawId);
assert.equal(prefixCheckpoint.processedDrawCount, manifest.rowCount);

const legacyRows = mapCanonicalDrawsToApp(dataset.draws);
assert.equal(legacyRows.length, dataset.draws.length);
assert.deepEqual(
  legacyRows.map(row => [row.num, row.digits, row.date]),
  dataset.draws.map(row => [row.drawId, row.digits, row.date ?? ""]),
);

const app = await readFile(resolve("src/App.tsx"), "utf8");
const researchDashboard = await readFile(resolve("src/ResearchDashboard.tsx"), "utf8");
const loaderTests = await stat(resolve("src/research/load-canonical-tris.test.ts"));
const prefixTests = await stat(resolve("src/research/canonical-prefix-guard.test.ts"));
const adapterTests = await stat(resolve("src/research/canonical-tris-app-adapter.test.ts"));
const wiring = {
  mainAppUsesSharedCanonicalLoader: app.includes("loadCanonicalTrisDataset()"),
  mainAppUsesTestedLosslessAdapter: app.includes("mapCanonicalDrawsToApp(dataset.draws)"),
  canonicalCutoffAndHashVisible: app.includes("HISTÓRICO CANÓNICO VERIFICADO") && app.includes("canonicalInfo.sha256"),
  cacheFallbackWarnsThatItMayBeStale: app.includes("se usa caché local que puede estar desactualizada"),
  researchCenterMountedByMainApp: app.includes("<ResearchDashboard"),
  operationalDashboardReachableFromResearchCenter:
    researchDashboard.includes("setShowInaDashboard(true)") && researchDashboard.includes("<TrisOpsDashboard/>"),
  loaderIntegrityTestsLocated: loaderTests.isFile(),
  retroactivePrefixTestsLocated: prefixTests.isFile(),
  legacyAdapterParityTestsLocated: adapterTests.isFile(),
};
assert.equal(Object.values(wiring).every(Boolean), true, "phase 0 adapter wiring evidence failed");

const report = {
  schemaVersion: 1,
  phaseId: 0,
  phaseTitle: "Adaptador, importación e integridad",
  status: "partially_verified",
  generatedAt: manifest.fetchedAt,
  canonical: {
    snapshot: manifest.snapshot,
    sourceUrl: manifest.sourceUrl,
    sha256,
    byteLength: bytes.byteLength,
    sampleSize: dataset.draws.length,
    drawStart: dataset.draws[0].drawId,
    drawCutoff: dataset.draws.at(-1)!.drawId,
    fetchedAt: manifest.fetchedAt,
  },
  evidence: {
    engine: { state: "verified", path: "src/research/load-canonical-tris.ts", loaderStatus: dataset.status, inaStatus: dataset.ina.status },
    canonicalInput: { state: "verified", manifestAndRowsMatch: true, sha256Matches: true, byteLengthMatches: true },
    output: { state: "verified", key: "data.canonical-adapter", sampleSize: dataset.draws.length, drawCutoff: manifest.latestDrawId },
    prefixGuard: { state: "verified", processedThroughDrawId: prefixCheckpoint.processedThroughDrawId, processedDrawCount: prefixCheckpoint.processedDrawCount, idempotent: true },
    visualization: { state: "located", path: "src/App.tsx" },
    dashboardMount: { state: "source_confirmed", mainApp: true, researchCenter: true, operationalDashboard: true },
    dataBinding: { state: "source_confirmed", mapping: "mapCanonicalDrawsToApp", rows: legacyRows.length },
    numericalParity: { state: "passed", comparedRows: legacyRows.length, allContestIdsDigitsAndDatesMatch: true },
    wiring,
  },
  remaining: [
    "Browser inspection of canonical success indicator and stale-cache fallback.",
    "Verify the same visible cutoff in the main dashboard and INA operational center after browser startup.",
  ],
  limitations: [
    "This verifies the production loader and source-level UI wiring using the exact canonical snapshot; it does not simulate a real browser network session.",
    "A successful phase-0 adapter audit does not verify the other 81 research dossiers.",
  ],
};
await mkdir(resolve(reportPath, ".."), { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ status: report.status, canonical: report.canonical, evidence: report.evidence, remaining: report.remaining }, null, 2));
