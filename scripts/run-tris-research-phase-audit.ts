#!/usr/bin/env tsx
/**
 * Phase-level inventory audit. File existence is evidence of location only;
 * engine execution, output freshness, dashboard mount and numerical parity
 * remain unverified until explicit evidence is registered.
 */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PHASES } from "../src/ResearchPhaseCatalog";

const manifestPath = resolve(process.argv[2] ?? "data/canonical/source-manifest.json");
const reportDir = resolve(process.argv[3] ?? "reports/research-phase-audit");
const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
  snapshot: string; fetchedAt: string; sha256: string; rowCount: number;
  earliestDrawId: number; latestDrawId: number;
};
async function exists(path?: string): Promise<boolean> {
  if (!path) return false;
  try { return (await stat(resolve(path))).isFile(); } catch { return false; }
}
const rows = await Promise.all(PHASES.map(async phase => {
  const documentExists = await exists(phase.artifact);
  const visualExists = await exists(phase.visual);
  return {
    id: phase.id, title: phase.title, area: phase.area,
    documentation: { path: phase.artifact, state: documentExists ? "located" : "missing" },
    engine: { state: "unverified", evidence: null },
    canonicalInput: {
      datasetVersionId: null, snapshotSha256: manifest.sha256,
      drawCutoff: manifest.latestDrawId, sampleSize: manifest.rowCount,
      state: "unverified",
    },
    output: { keys: [], state: "unverified", evidence: null },
    visualization: { path: phase.visual ?? null, state: phase.visual ? (visualExists ? "located" : "missing") : "not_catalogued" },
    dashboardMount: { state: "unverified", evidence: null },
    dataBinding: { state: "unverified", evidence: null },
    numericalParity: { state: "unverified", evidence: null },
    overall: !documentExists || (phase.visual && !visualExists) ? "blocked" : "unverified",
  };
}));
const counts = {
  total: rows.length,
  documentationLocated: rows.filter(row => row.documentation.state === "located").length,
  documentationMissing: rows.filter(row => row.documentation.state === "missing").length,
  visualizationLocated: rows.filter(row => row.visualization.state === "located").length,
  visualizationMissing: rows.filter(row => row.visualization.state === "missing").length,
  visualizationNotCatalogued: rows.filter(row => row.visualization.state === "not_catalogued").length,
  blocked: rows.filter(row => row.overall === "blocked").length,
  verified: rows.filter(row => row.overall === "verified").length,
  unverified: rows.filter(row => row.overall === "unverified").length,
};
const report = {
  schemaVersion: 1, auditType: "research-phase-propagation-inventory",
  generatedAt: new Date().toISOString(),
  canonical: {
    snapshot: manifest.snapshot, fetchedAt: manifest.fetchedAt,
    sha256: manifest.sha256, sampleSize: manifest.rowCount,
    drawStart: manifest.earliestDrawId, drawCutoff: manifest.latestDrawId,
  },
  counts, phases: rows,
  limitations: [
    "This inventory covers the 82 phase records currently listed in ResearchPhaseCatalog.",
    "Located files do not prove that an engine ran, an output was generated, or a component is mounted.",
    "Engine, output, dashboard mount, data binding and numerical parity remain unverified until explicit evidence is attached.",
    "This is not proof that all 82 dossiers have been refreshed by the latest draw.",
  ],
};
await mkdir(reportDir, { recursive: true });
await writeFile(resolve(reportDir, "latest.json"), JSON.stringify(report, null, 2) + "\n");
const md = [
  "# Research phase propagation inventory", "",
  "- Snapshot: " + manifest.snapshot,
  "- Cutoff: " + manifest.latestDrawId,
  "- Rows: " + manifest.rowCount,
  "- SHA-256: " + manifest.sha256, "",
  "## Inventory totals",
  ...Object.entries(counts).map(([key, value]) => "- " + key + ": " + value),
  "", "## Phase-level state",
  ...rows.map(row => "- " + row.id + " — " + row.title + ": " + row.overall +
    " (doc: " + row.documentation.state + "; visual: " + row.visualization.state +
    "; engine/output/mount/binding/parity: unverified)"),
  "", "## Limitations", ...report.limitations.map(item => "- " + item), "",
].join("\n");
await writeFile(resolve(reportDir, "latest.md"), md);
console.log(md);
