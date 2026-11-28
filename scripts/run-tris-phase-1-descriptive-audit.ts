#!/usr/bin/env tsx
/** Phase 1 evidence runner: validates INA descriptive outputs and dashboard bindings against one canonical snapshot. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const reportPath=resolve(process.argv[2]??"reports/ina-canonical-audit/latest.json");
const outputPath=resolve(process.argv[3]??"reports/research-phase-audit/phase-1-descriptive-integrity.json");
const audit=JSON.parse(await readFile(reportPath,"utf8"));
const requiredKeys=[
  "research.memory-state",
  "research.position-overview",
  "research.combination-recurrence",
  "research.pool-evaluation",
  "research.pool-selection",
  "research.aging-comparison",
  "research.positional-transitions",
  "research.transition-stability",
  "research.transition-window-comparison",
  "research.positional-absence",
];
const outputs=new Map<string,any>((audit.outputs??[]).map((row:any)=>[row.outputKey,row] as [string,any]));
const missing=requiredKeys.filter(key=>!outputs.has(key));
const metadataMismatches=requiredKeys.filter(key=>{
  const row=outputs.get(key);
  return !row||row.datasetVersionId!==audit.sharedDatasetVersionId||
    row.snapshotSha256!==audit.snapshot.sha256||
    row.drawCutoff!==audit.snapshot.drawCutoff||
    row.sampleSize!==audit.snapshot.rowCount;
});
const currentModules=["position-overview","combination-recurrence","pool-research","aging-experiment","positional-transitions","positional-absence","memory-research","transition-stability","transition-window-comparison"];
const moduleStates=new Map<string,any>((audit.propagation?.targets??[]).map((row:any)=>[row.moduleId,row] as [string,any]));
const nonCurrentModules=currentModules.filter(id=>moduleStates.get(id)?.state!=="current");
const requiredUiChecks=[
  "overviewOutputComputedFromSharedInaContext","overviewOutputUsedByFrequencyCharts","overviewProvenanceRendered",
  "recurrenceOutputComputedFromSharedInaContext","recurrenceOutputUsedByDashboard",
  "poolEvaluationComputedFromSharedInaContext","poolEvaluationUsedByDashboard",
  "poolSelectionComputedFromSharedInaContext","poolSelectionUsedByDashboard",
  "agingComputedFromSharedInaContext","agingUsedByDashboard",
  "transitionOutputComputedFromSharedInaContext","transitionOutputRendered",
  "stabilityComputedFromSharedInaContext","stabilityOutputRendered",
  "windowComparisonComputedFromSharedInaContext","windowComparisonRendered",
  "absenceOutputComputedFromSharedInaContext","absenceOutputUsedByDashboardView",
  "absenceOccurrencesRendered","absenceCurrentRunRendered","absenceIntervalDistributionRendered",
  "absenceConditionalReturnsRendered","absenceTimelineRendered",
  "memoryOutputComputedFromSharedInaContext","memoryPanelImported","memoryPanelMountedInInaCenter",
  "memoryPanelConsumesTemporalOutput","memoryPanelConsumesContextualOutput","memoryPanelShowsSnapshotProvenance",
];
const failedUiChecks=requiredUiChecks.filter(key=>audit.uiWiring?.[key]!==true);
assert.deepEqual(missing,[],"phase 1 outputs missing: "+missing.join(", "));
assert.deepEqual(metadataMismatches,[],"phase 1 output provenance mismatch: "+metadataMismatches.join(", "));
assert.deepEqual(nonCurrentModules,[],"phase 1 INA modules not current: "+nonCurrentModules.join(", "));
assert.deepEqual(failedUiChecks,[],"phase 1 UI bindings not confirmed: "+failedUiChecks.join(", "));
assert.equal(audit.absence?.engineParityStatus,"passed");
assert.equal(audit.absence?.engineParityRows,50);

const evidence={
  engine:{state:"verified",outputs:requiredKeys.length,modules:currentModules},
  canonicalInput:{state:"verified",datasetVersionId:audit.sharedDatasetVersionId,snapshotSha256:audit.snapshot.sha256,drawCutoff:audit.snapshot.drawCutoff,sampleSize:audit.snapshot.rowCount},
  output:{state:"verified",keys:requiredKeys},
  visualization:{state:"located",path:"src/TrisOpsDashboard.tsx"},
  dashboardMount:{state:"source_confirmed",entry:"ResearchDashboard → TrisOpsDashboard"},
  dataBinding:{state:"source_confirmed",uiChecks:requiredUiChecks},
  numericalParity:{state:"partial",verified:"position-overview count parity and 50/50 positional absence cells",remaining:"independent numerical parity for recurrence, pools, aging and transition charts"},
};
const report={
  schemaVersion:1,phaseId:1,phaseTitle:"Investigación descriptiva, pools y memoria",
  status:"partially_verified",generatedAt:audit.snapshot.fetchedAt??audit.snapshot.generatedAt,
  canonical:audit.snapshot,sharedDatasetVersionId:audit.sharedDatasetVersionId,
  evidence,
  checks:{requiredOutputCount:requiredKeys.length,metadataMismatches,nonCurrentModules,failedUiChecks,absenceParityRows:audit.absence.engineParityRows},
  remaining:[
    "Add independent numerical parity fixtures for recurrence, pool evaluation/selection, aging and transition visual summaries.",
    "Inspect rendered charts and controls in a browser at the same canonical cutoff.",
  ],
  limitations:[
    "The live INA audit proves common provenance and source-level bindings, not predictive advantage.",
    "Numerical parity is partial; do not mark the whole phase fully verified.",
  ],
};
await mkdir(resolve(outputPath,".."),{recursive:true});
await writeFile(outputPath,JSON.stringify(report,null,2)+"\n","utf8");
console.log(JSON.stringify({status:report.status,canonical:report.canonical,evidence,checks:report.checks,remaining:report.remaining},null,2));
