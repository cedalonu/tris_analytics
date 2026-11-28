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
let phase0Evidence: any = null;
try { phase0Evidence = JSON.parse(await readFile(resolve(reportDir, "phase-0-adapter-integrity.json"), "utf8")); }
catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
const phase0Checks = phase0Evidence?.evidence;
const phase0Current = Boolean(
  phase0Evidence?.status === "partially_verified" &&
  phase0Evidence?.canonical?.sha256 === manifest.sha256 &&
  phase0Evidence?.canonical?.drawCutoff === manifest.latestDrawId &&
  phase0Evidence?.canonical?.sampleSize === manifest.rowCount &&
  phase0Checks?.engine?.state === "verified" &&
  phase0Checks?.canonicalInput?.state === "verified" &&
  phase0Checks?.output?.state === "verified" &&
  phase0Checks?.prefixGuard?.state === "verified" &&
  phase0Checks?.numericalParity?.state === "passed" &&
  phase0Checks?.dashboardMount?.state === "source_confirmed" &&
  phase0Checks?.dataBinding?.state === "source_confirmed" &&
  Object.values(phase0Checks?.wiring ?? {}).every(Boolean)
);
async function exists(path?: string): Promise<boolean> {
  if (!path) return false;
  try { return (await stat(resolve(path))).isFile(); } catch { return false; }
}
const rows = await Promise.all(PHASES.map(async phase => {
  const documentExists = await exists(phase.artifact);
  const visualExists = await exists(phase.visual);
  const verifiedPhase0 = phase.id === 0 && phase0Current;
  return {
    id: phase.id, title: phase.title, area: phase.area,
    documentation: { path: phase.artifact, state: documentExists ? "located" : "missing" },
    engine: { state: verifiedPhase0 ? "verified" : "unverified", evidence: verifiedPhase0 ? phase0Checks.engine : null },
    canonicalInput: {
      datasetVersionId: verifiedPhase0 ? phase0Evidence.canonical.datasetVersionId : null,
      snapshotSha256: manifest.sha256,
      drawCutoff: manifest.latestDrawId, sampleSize: manifest.rowCount,
      state: verifiedPhase0 ? "verified" : "unverified",
    },
    output: { keys: verifiedPhase0 ? [phase0Checks.output.key] : [], state: verifiedPhase0 ? "verified" : "unverified", evidence: verifiedPhase0 ? phase0Checks.output : null },
    visualization: { path: phase.visual ?? null, state: phase.visual ? (visualExists ? "located" : "missing") : "not_catalogued" },
    dashboardMount: { state: verifiedPhase0 ? "source_confirmed" : "unverified", evidence: verifiedPhase0 ? phase0Checks.dashboardMount : null },
    dataBinding: { state: verifiedPhase0 ? "source_confirmed" : "unverified", evidence: verifiedPhase0 ? phase0Checks.dataBinding : null },
    numericalParity: { state: verifiedPhase0 ? "passed" : "unverified", evidence: verifiedPhase0 ? phase0Checks.numericalParity : null },
    overall: !documentExists || (phase.visual && !visualExists) ? "blocked" : verifiedPhase0 ? "partially_verified" : "unverified",
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
  partiallyVerified: rows.filter(row => row.overall === "partially_verified").length,
  unverified: rows.filter(row => row.overall === "unverified").length,
};
const report = {
  schemaVersion: 1, auditType: "research-phase-propagation-inventory",
  generatedAt: manifest.fetchedAt,
  canonical: {
    snapshot: manifest.snapshot, fetchedAt: manifest.fetchedAt,
    sha256: manifest.sha256, sampleSize: manifest.rowCount,
    drawStart: manifest.earliestDrawId, drawCutoff: manifest.latestDrawId,
  },
  counts, phase0Evidence: phase0Current ? phase0Evidence : null, phases: rows,
  limitations: [
    "This inventory covers the 82 phase records currently listed in ResearchPhaseCatalog.",
    "Located files do not prove that an engine ran, an output was generated, or a component is mounted.",
    "Engine, output, dashboard mount, data binding and numerical parity remain unverified until explicit evidence is attached; phase 0 may be partially verified by its dedicated adapter audit.",
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
    "; engine: " + row.engine.state + "; output: " + row.output.state + "; mount: " + row.dashboardMount.state + "; binding: " + row.dataBinding.state + "; parity: " + row.numericalParity.state + ")"),
  "", "## Limitations", ...report.limitations.map(item => "- " + item), "",
].join("\n");
await writeFile(resolve(reportDir, "latest.md"), md);
console.log(md);
