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
let phase1Evidence: any = null;
let phase3Evidence: any = null;
let phase4Evidence: any = null;
try { phase0Evidence = JSON.parse(await readFile(resolve(reportDir, "phase-0-adapter-integrity.json"), "utf8")); }
catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
try { phase1Evidence = JSON.parse(await readFile(resolve(reportDir, "phase-1-descriptive-integrity.json"), "utf8")); }
catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
try { phase3Evidence = JSON.parse(await readFile(resolve(reportDir, "phase-3-prospective-integrity.json"), "utf8")); }
catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
try { phase4Evidence = JSON.parse(await readFile(resolve(reportDir, "phase-4-memory-integrity.json"), "utf8")); }
catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
const phase0Checks = phase0Evidence?.evidence;
const phase1Checks = phase1Evidence?.evidence;
const phase3Checks = phase3Evidence?.evidence;
const phase4Checks = phase4Evidence?.evidence;
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
const phase1Current = Boolean(
  phase1Evidence?.status === "partially_verified" &&
  phase1Evidence?.canonical?.sha256 === manifest.sha256 &&
  phase1Evidence?.canonical?.drawCutoff === manifest.latestDrawId &&
  phase1Evidence?.canonical?.rowCount === manifest.rowCount &&
  phase1Checks?.engine?.state === "verified" &&
  phase1Checks?.canonicalInput?.state === "verified" &&
  phase1Checks?.output?.state === "verified" &&
  phase1Checks?.visualization?.state === "located" &&
  phase1Checks?.dashboardMount?.state === "source_confirmed" &&
  phase1Checks?.dataBinding?.state === "source_confirmed" &&
  phase1Checks?.numericalParity?.state === "partial" &&
  (phase1Evidence?.checks?.metadataMismatches?.length ?? 1) === 0 &&
  (phase1Evidence?.checks?.nonCurrentModules?.length ?? 1) === 0 &&
  (phase1Evidence?.checks?.failedUiChecks?.length ?? 1) === 0
);
const phase3Current = Boolean(
  phase3Evidence?.status === "partially_verified" &&
  phase3Evidence?.canonical?.sha256 === manifest.sha256 &&
  phase3Evidence?.canonical?.drawCutoff === manifest.latestDrawId &&
  phase3Evidence?.canonical?.rowCount === manifest.rowCount &&
  phase3Checks?.engine?.state === "verified" &&
  phase3Checks?.canonicalInput?.state === "verified" &&
  phase3Checks?.output?.state === "verified" &&
  phase3Checks?.visualization?.state === "located" &&
  phase3Checks?.dashboardMount?.state === "source_confirmed" &&
  phase3Checks?.dataBinding?.state === "source_confirmed" &&
  phase3Checks?.numericalParity?.state === "passed" &&
  Object.values(phase3Evidence?.checks ?? {}).every(Boolean)
);
const phase4Current = Boolean(
  phase4Evidence?.status === "partially_verified" &&
  phase4Evidence?.canonical?.sha256 === manifest.sha256 &&
  phase4Evidence?.canonical?.drawCutoff === manifest.latestDrawId &&
  phase4Evidence?.canonical?.rowCount === manifest.rowCount &&
  phase4Checks?.engine?.state === "verified" &&
  phase4Checks?.canonicalInput?.state === "verified" &&
  phase4Checks?.output?.state === "verified" &&
  phase4Checks?.visualization?.state === "located" &&
  phase4Checks?.dashboardMount?.state === "source_confirmed" &&
  phase4Checks?.dataBinding?.state === "source_confirmed" &&
  phase4Checks?.numericalParity?.state === "partial" &&
  Object.values(phase4Evidence?.checks ?? {}).every(Boolean)
);
const rows = await Promise.all(PHASES.map(async phase => {
  const documentExists = await exists(phase.artifact);
  const visualExists = await exists(phase.visual);
  const verifiedPhase0 = phase.id === 0 && phase0Current;
  const verifiedPhase1 = phase.id === 1 && phase1Current;
  const verifiedPhase3 = phase.id === 3 && phase3Current;
  const verifiedPhase4 = phase.id === 4 && phase4Current;
  const verifiedEvidence = verifiedPhase0 ? phase0Checks : verifiedPhase1 ? phase1Checks : verifiedPhase3 ? phase3Checks : verifiedPhase4 ? phase4Checks : null;
  return {
    id: phase.id, title: phase.title, area: phase.area,
    documentation: { path: phase.artifact, state: documentExists ? "located" : "missing" },
    engine: { state: verifiedEvidence ? "verified" : "unverified", evidence: verifiedEvidence?.engine ?? null },
    canonicalInput: {
      datasetVersionId: verifiedPhase0 ? phase0Evidence.canonical.datasetVersionId : verifiedPhase1 ? phase1Evidence.sharedDatasetVersionId : verifiedPhase3 ? phase3Evidence.sharedDatasetVersionId : verifiedPhase4 ? phase4Evidence.sharedDatasetVersionId : null,
      snapshotSha256: manifest.sha256,
      drawCutoff: manifest.latestDrawId, sampleSize: manifest.rowCount,
      state: verifiedEvidence ? "verified" : "unverified",
    },
    output: { keys: verifiedEvidence?.output?.keys ?? (verifiedPhase0 ? [phase0Checks.output.key] : []), state: verifiedEvidence ? "verified" : "unverified", evidence: verifiedEvidence?.output ?? null },
    visualization: { path: phase.visual ?? null, state: phase.visual ? (visualExists ? "located" : "missing") : "not_catalogued" },
    dashboardMount: { state: verifiedEvidence ? "source_confirmed" : "unverified", evidence: verifiedEvidence?.dashboardMount ?? null },
    dataBinding: { state: verifiedEvidence ? "source_confirmed" : "unverified", evidence: verifiedEvidence?.dataBinding ?? null },
    numericalParity: { state: verifiedPhase0 || verifiedPhase3 ? "passed" : verifiedPhase1 || verifiedPhase4 ? "partial" : "unverified", evidence: verifiedEvidence?.numericalParity ?? null },
    overall: !documentExists || (phase.visual && !visualExists) ? "blocked" : (verifiedPhase0 || verifiedPhase1 || verifiedPhase3 || verifiedPhase4) ? "partially_verified" : "unverified",
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
  counts, phase0Evidence: phase0Current ? phase0Evidence : null, phase1Evidence: phase1Current ? phase1Evidence : null, phase3Evidence: phase3Current ? phase3Evidence : null, phase4Evidence: phase4Current ? phase4Evidence : null, phases: rows,
  limitations: [
    "This inventory covers the 82 phase records currently listed in ResearchPhaseCatalog.",
    "Located files do not prove that an engine ran, an output was generated, or a component is mounted.",
    "Engine, output, dashboard mount, data binding and numerical parity remain unverified until explicit evidence is attached; phases 0, 1, 3 and 4 may be partially verified by their dedicated audits.",
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
  ...rows.map(row => `- ${row.id} — ${row.title}: ${row.overall} (doc: ${row.documentation.state}; visual: ${row.visualization.state}; engine: ${row.engine.state}; output: ${row.output.state}; mount: ${row.dashboardMount.state}; binding: ${row.dataBinding.state}; parity: ${row.numericalParity.state})`),
  "", "## Limitations", ...report.limitations.map(item => "- " + item), "",
].join("\n");
await writeFile(resolve(reportDir, "latest.md"), md);
console.log(md);
