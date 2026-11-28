#!/usr/bin/env tsx
/**
 * Audits INA outputs and dashboard wiring against the exact canonical TRIS snapshot.
 * Descriptive verification only; this does not validate predictive value.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { importTrisCsv } from "../src/research/data-adapter";
import { buildInaCore } from "../src/research/ina-core";
import { buildInaAbsence } from "../src/research/ina-absence";
import { analyzePositionAbsences } from "../src/research/absence-analysis";
import { buildInaTransitionStability } from "../src/research/ina-transition-stability";
import { buildInaPositionalTransitions } from "../src/research/ina-positional-transitions";
import { buildInaRecurrence } from "../src/research/ina-recurrence";
import { buildInaDashboardOverview } from "../src/research/ina-dashboard-overview";
import { buildInaMemoryState } from "../src/research/ina-memory-state";
import { buildInaPoolEvaluation } from "../src/research/ina-pool-evaluation";
import { buildInaPoolSelection } from "../src/research/ina-pool-selection";
import { buildInaAgingComparison } from "../src/research/ina-aging-comparison";
import { buildInaTransitionWindowComparison } from "../src/research/ina-transition-window-comparison";
import { snapshotFromCanonicalManifest, type CanonicalSourceManifest } from "../src/research/ina-snapshot";
import { auditInaPropagation, propagationEvidenceFromResearchOutputs } from "../src/research/ina-propagation-audit";

const csvPath = resolve(process.argv[2] ?? "data/canonical/Tris.csv");
const manifestPath = resolve(process.argv[3] ?? "data/canonical/source-manifest.json");
const reportDir = resolve(process.argv[4] ?? "reports/ina-canonical-audit");
const csv = await readFile(csvPath, "utf8");
const bytes = Buffer.from(csv, "utf8");
const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as CanonicalSourceManifest;
const actualSha256 = createHash("sha256").update(bytes).digest("hex");
assert.equal(manifest.schemaVersion, 1, "unsupported canonical manifest schema version");

assert.equal(actualSha256, manifest.sha256.toLowerCase(), "canonical CSV SHA-256 does not match its manifest");
assert.equal(bytes.byteLength, manifest.byteLength, "canonical CSV byte length does not match its manifest");

const imported = importTrisCsv(csv);
assert.equal(imported.validation.errors.length, 0, "canonical CSV contains validation errors");
assert.equal(
  imported.validation.warnings.some(warning => warning.startsWith("draw gap ")),
  false,
  "canonical CSV contains contest-number gaps",
);

const snapshot = snapshotFromCanonicalManifest(manifest);
const core = buildInaCore({ snapshot, validation: imported.validation });
assert.equal(core.status, "ready", "INA core quarantined the canonical snapshot");
assert.equal(core.context.quality.valid, true);
assert.equal(core.context.version.drawCount, manifest.rowCount);
assert.equal(core.context.version.drawStart, manifest.earliestDrawId);
assert.equal(core.context.version.drawCutoff, manifest.latestDrawId);

const memory = buildInaMemoryState(core.context);
const overview = buildInaDashboardOverview(core.context, 100);
const recurrence = buildInaRecurrence(core.context);
const poolEvaluation = buildInaPoolEvaluation(core.context, { poolSize: 3, windowSize: 150, minTrain: 30, historyLimit: 500 });
const poolSelection = buildInaPoolSelection(core.context, { poolSize: 3, windowSize: 150, method: "frequency", minTrain: 30, historyLimit: 500 });
const aging = buildInaAgingComparison(core.context, { poolSize: 3, historyLimit: 500, recentWindow: 50, broadWindow: 150, minTrain: 30, testLimit: 100 });
const transitions = buildInaPositionalTransitions(core.context, 150);
const stability = buildInaTransitionStability(core.context, 50, 50);
const windowComparison = buildInaTransitionWindowComparison(core.context);
const absence = buildInaAbsence(core.context, { maxPriorMisses: 20, timelineLimit: 100 });

const outputs = [memory, overview, recurrence, poolEvaluation, poolSelection, aging, transitions, stability, windowComparison, absence];
const appSource = await readFile(resolve("src/App.tsx"), "utf8");
const researchDashboardSource = await readFile(resolve("src/ResearchDashboard.tsx"), "utf8");
const operationalDashboardSourceMounted =
  appSource.includes("<ResearchDashboard") &&
  researchDashboardSource.includes('import TrisOpsDashboard from "./TrisOpsDashboard"') &&
  researchDashboardSource.includes("<TrisOpsDashboard/>") &&
  researchDashboardSource.includes("setShowInaDashboard(true)") &&
  (await readFile(resolve("src/TrisOpsDashboard.tsx"), "utf8")).includes("loadCanonicalTrisDataset()");
assert.equal(operationalDashboardSourceMounted, true, "operational INA dashboard is not mounted through the research center");
const propagation = auditInaPropagation({
  datasetVersionId: core.context.version.versionId,
  snapshotSha256: actualSha256,
  drawCutoff: manifest.latestDrawId,
  sampleSize: manifest.rowCount,
}, [
  ...propagationEvidenceFromResearchOutputs([...core.outputs, ...outputs]),
  ...(["dataset.snapshot", "dataset.validated-draws"] as const).map(outputKey => ({
    outputKey,
    datasetVersionId: core.context.version.versionId,
    snapshotSha256: actualSha256,
    drawCutoff: manifest.latestDrawId,
    sampleSize: manifest.rowCount,
  })),
  {
    outputKey: "ina.history",
    datasetVersionId: core.context.version.versionId,
    snapshotSha256: actualSha256,
    drawCutoff: manifest.latestDrawId,
    sampleSize: manifest.rowCount,
  },
  {
    outputKey: "ui.operational-dashboard",
    datasetVersionId: core.context.version.versionId,
    snapshotSha256: actualSha256,
    drawCutoff: manifest.latestDrawId,
    sampleSize: manifest.rowCount,
  },
], { generatedAt: manifest.fetchedAt });
for (const output of outputs) {
  assert.equal(output.datasetVersionId, core.context.version.versionId, output.outputKey + " dataset version mismatch");
  assert.equal(output.snapshotSha256, actualSha256, output.outputKey + " SHA-256 mismatch");
  assert.equal(output.drawCutoff, manifest.latestDrawId, output.outputKey + " draw cutoff mismatch");
  assert.equal(output.sampleSize, manifest.rowCount, output.outputKey + " sample size mismatch");
}

assert.equal(memory.result.temporal.lastDrawId, manifest.latestDrawId);
assert.equal(memory.result.contextual.lastDrawId, manifest.latestDrawId);
assert.equal(memory.result.temporal.scopes[0].comparisons.length, 125);
assert.equal(memory.result.contextual.scopes[0].comparisons.length, 250);
assert.equal(overview.result.totalDraws, manifest.rowCount);
assert.equal(overview.result.latestDrawId, manifest.latestDrawId);
assert.deepEqual(
  overview.result.positions.map(position => position.digits.map(digit => digit.historicalCount)),
  core.knowledge!.positions.map(position => position.digits.map(digit => digit.occurrences)),
);
assert.equal(recurrence.result.drawCutoff, manifest.latestDrawId);
assert.equal(recurrence.result.uniqueCombinations > 0, true);
assert.equal(poolEvaluation.result.poolSize, 3);
assert.equal(poolSelection.result.poolSize, 3);
assert.equal(aging.result.poolSize, 3);
assert.equal(transitions.result.sampleSize, 150);
assert.equal(transitions.result.edges.length > 0, true);
assert.equal(stability.result.recentDrawCount, 50);
assert.equal(stability.result.previousDrawCount, 50);
assert.equal(stability.result.digitEntropy.length, 5);
assert.equal(stability.result.stability.length, 400);
assert.deepEqual(
  windowComparison.result.windows.map(window => [window.windowSize, window.sampleSize]),
  [[50, 50], [150, 150], [500, 500]],
);
assert.equal(absence.result.positions.length, 5);
assert.equal(absence.result.positions.every(position => position.digitReports.length === 10), true);
const absenceParityRows = absence.result.positions.flatMap(position => {
  const reference = analyzePositionAbsences([...core.context.draws], position.position, 20);
  return position.digitReports.map(report => {
    const expected = reference.digitReports[report.digit];
    assert.equal(report.occurrences, expected.occurrences, `absence occurrences mismatch R${position.position + 1}-${report.digit}`);
    assert.equal(report.rate, expected.rate, `absence rate mismatch R${position.position + 1}-${report.digit}`);
    assert.equal(report.currentAbsence, expected.currentAbsence, `current absence mismatch R${position.position + 1}-${report.digit}`);
    assert.deepEqual(report.completedAbsenceLengths, expected.completedAbsenceLengths, `completed intervals mismatch R${position.position + 1}-${report.digit}`);
    assert.deepEqual(report.returnByPriorAbsence, expected.returnByPriorAbsence, `conditional return rows mismatch R${position.position + 1}-${report.digit}`);
    const timeline = core.context.draws.slice(-100).map(draw => ({ drawId: draw.drawId, present: draw.digits[position.position] === report.digit }));
    assert.deepEqual(report.timeline, timeline, `timeline mismatch R${position.position + 1}-${report.digit}`);
    return { position: position.position, digit: report.digit, occurrences: report.occurrences, currentAbsence: report.currentAbsence, completedIntervals: report.completedAbsenceLengths.length, timelineRows: report.timeline.length, parity: "passed" as const };
  });
});

const dashboard = await readFile(resolve("src/TrisOpsDashboard.tsx"), "utf8");
const inaCenter = await readFile(resolve("src/InaCommandCenter.tsx"), "utf8");
const memoryPanel = await readFile(resolve("src/InaMemoryPanel.tsx"), "utf8");
const uiWiring = {
  operationalDashboardMountedThroughResearchCenter: operationalDashboardSourceMounted,
  memoryOutputComputedFromSharedInaContext: dashboard.includes("buildInaMemoryState(inaResult.context)"),
  memoryPanelImported: dashboard.includes('import InaMemoryPanel from "./InaMemoryPanel"'),
  memoryPanelMountedInInaCenter: dashboard.includes("<InaMemoryPanel output={memoryOutput}/>"),
  memoryPanelConsumesTemporalOutput: memoryPanel.includes("output.result.temporal.scopes"),
  memoryPanelConsumesContextualOutput: memoryPanel.includes("output.result.contextual.scopes"),
  memoryPanelShowsSnapshotProvenance: memoryPanel.includes("output.snapshotSha256") && memoryPanel.includes("output.drawCutoff"),
  overviewOutputComputedFromSharedInaContext: dashboard.includes("buildInaDashboardOverview(inaResult.context,100)"),
  overviewOutputUsedByFrequencyCharts: dashboard.includes("positionCounts=overviewOutput?.result.positions.map"),
  overviewProvenanceRendered: dashboard.includes("research.position-overview"),
  recurrenceOutputComputedFromSharedInaContext: dashboard.includes("buildInaRecurrence(inaResult.context)"),
  recurrenceOutputUsedByDashboard: dashboard.includes("combinationStats=recurrenceOutput?.result.combinations"),
  poolEvaluationComputedFromSharedInaContext: dashboard.includes("buildInaPoolEvaluation(inaResult.context"),
  poolEvaluationUsedByDashboard: dashboard.includes("poolEvaluationOutput.result.evaluations"),
  poolSelectionComputedFromSharedInaContext: dashboard.includes("buildInaPoolSelection(inaResult.context"),
  poolSelectionUsedByDashboard: dashboard.includes("poolSelectionOutput.result"),
  agingComputedFromSharedInaContext: dashboard.includes("buildInaAgingComparison(inaResult.context"),
  agingUsedByDashboard: dashboard.includes("agingOutput.result.agingPools"),
  transitionOutputComputedFromSharedInaContext: dashboard.includes("buildInaPositionalTransitions(inaResult.context,transitionWindow)"),
  transitionOutputRendered: dashboard.includes("transitionOutput?.result"),
  stabilityComputedFromSharedInaContext: dashboard.includes("buildInaTransitionStability(inaResult.context,50,50)"),
  stabilityOutputPassedToInaCenter: dashboard.includes("stabilityOutput={stabilityOutput}"),
  stabilityOutputConsumedByInaCenter: inaCenter.includes("stabilityOutput"),
  transitionWindowOutputComputedFromSharedInaContext: dashboard.includes("buildInaTransitionWindowComparison(inaResult.context)"),
  transitionWindowOutputRendered: dashboard.includes("transitionWindowComparisonOutput.result.ranked"),
  absenceOutputComputedFromSharedInaContext: dashboard.includes("buildInaAbsence(inaResult.context"),
  absenceOutputUsedByDashboardView: dashboard.includes("selectedAbsence"),
  absenceOccurrencesRendered: dashboard.includes("selectedAbsence.occurrences"),
  absenceCurrentRunRendered: dashboard.includes("selectedAbsence.currentAbsence"),
  absenceIntervalDistributionRendered: dashboard.includes("selectedAbsence.intervalDistribution"),
  absenceConditionalReturnsRendered: dashboard.includes("selectedAbsence.returnByPriorAbsence"),
  absenceTimelineRendered: dashboard.includes("selectedAbsence.timeline"),
};
for (const [check, passed] of Object.entries(uiWiring)) {
  assert.equal(passed, true, "dashboard wiring check failed: " + check);
}

const report = {
  status: "passed",
  auditType: "canonical-ina-output-and-dashboard-wiring",
  snapshot: {
    id: manifest.snapshot,
    sourceUrl: manifest.sourceUrl,
    fetchedAt: manifest.fetchedAt,
    sha256: actualSha256,
    byteLength: bytes.byteLength,
    rowCount: core.context.version.drawCount,
    drawStart: core.context.version.drawStart,
    drawCutoff: core.context.version.drawCutoff,
  },
  sharedDatasetVersionId: core.context.version.versionId,
  outputs: outputs.map(output => ({
    outputKey: output.outputKey,
    outputId: output.outputId,
    datasetVersionId: output.datasetVersionId,
    snapshotSha256: output.snapshotSha256,
    drawCutoff: output.drawCutoff,
    sampleSize: output.sampleSize,
    evidenceStatus: output.evidence.status,
  })),
  memory: { temporalScopes: memory.result.temporal.scopes.map(scope => ({ scope: scope.scope, comparisons: scope.comparisons.length })), contextualScopes: memory.result.contextual.scopes.map(scope => ({ scope: scope.scope, comparisons: scope.comparisons.length })) },
  overview: { totalDraws: overview.result.totalDraws, latestDrawId: overview.result.latestDrawId, windowSize: overview.result.windowSize },
  recurrence: { uniqueCombinations: recurrence.result.uniqueCombinations, recurrentCombinations: recurrence.result.recurrentCombinations },
  pools: { poolSize: poolSelection.result.poolSize, methods: poolSelection.result.selectedMethods, evaluationMethods: poolEvaluation.result.methods },
  aging: { tested: aging.result.comparison.tested, poolSize: aging.result.poolSize },
  transitions: { windowSize: transitions.result.windowSize, sampleSize: transitions.result.sampleSize, edges: transitions.result.edges.length },
  stability: {
    recentDrawCount: stability.result.recentDrawCount,
    previousDrawCount: stability.result.previousDrawCount,
    transitionRows: stability.result.stability.length,
    positionalEntropyRows: stability.result.digitEntropy.length,
  },
  transitionWindows: windowComparison.result.windows,
  absence: {
    positions: absence.result.positions.length,
    digitReports: absence.result.positions.reduce((sum, position) => sum + position.digitReports.length, 0),
    engineParityRows: absenceParityRows.length,
    engineParityStatus: absenceParityRows.every(row => row.parity === "passed") ? "passed" : "failed",
    parityByPositionAndDigit: absenceParityRows,
  },
  uiWiring,
  propagation: {
    totals: propagation.totals,
    targets: propagation.targets.map(target => ({
      moduleId: target.moduleId,
      title: target.title,
      state: target.state,
      expectedOutputKeys: target.expectedOutputKeys,
      missingOutputKeys: target.missingOutputKeys,
      reasons: target.reasons,
    })),
    registryErrors: propagation.registryErrors,
  },
  limitations: [
    "This audit verifies canonical bytes, INA output provenance and source-level dashboard wiring.",
    "It does not replace a browser-based visual inspection of rendered charts.",
    "All measured outputs are descriptive; no predictive advantage is implied.",
  ],
};
await mkdir(reportDir, { recursive: true });
await writeFile(resolve(reportDir, "latest.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
const markdown = [
  "# INA canonical snapshot audit",
  "",
  "- Status: **PASSED**",
  "- Snapshot: " + manifest.snapshot,
  "- Draws: " + manifest.rowCount + " (" + manifest.earliestDrawId + "–" + manifest.latestDrawId + ")",
  "- SHA-256: " + actualSha256,
  "- Shared INA version: " + core.context.version.versionId,
  "",
  "## Outputs",
  ...outputs.map(output => "- " + output.outputKey + ": " + output.sampleSize + " draws, cutoff " + output.drawCutoff + ", same snapshot SHA-256"),
  "",
  "## V1 presence/absence numeric parity",
  "- Compared every R1–R5 × digit 0–9 report against the independent position analyzer: " + absenceParityRows.length + " / 50 passed.",
  "- Verified occurrences, observed rate, current absence, complete intervals, conditional return denominators and timeline draw IDs.",
  "",
  "## Dashboard wiring",
  ...Object.entries(uiWiring).map(([name, passed]) => "- " + (passed ? "PASS" : "FAIL") + " — " + name),
  "",
  "## INA propagation audit",
  "- Current: " + propagation.totals.current,
  "- Stale: " + propagation.totals.stale,
  "- Missing: " + propagation.totals.missing,
  "- Blocked: " + propagation.totals.blocked,
  ...propagation.targets.map(target => "- " + target.state.toUpperCase() + " — " + target.moduleId + (target.missingOutputKeys.length ? " (missing: " + target.missingOutputKeys.join(", ") + ")" : "")),
  "",
  "## Scope and limitations",
  ...report.limitations.map(item => "- " + item),
  "",
].join("\n");
await writeFile(resolve(reportDir, "latest.md"), markdown, "utf8");
console.log(markdown);
