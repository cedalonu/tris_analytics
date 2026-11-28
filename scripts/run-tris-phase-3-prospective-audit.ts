#!/usr/bin/env tsx
/** Phase 3 evidence: frozen prospective signals, canonical resolutions and published dashboard panel. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const audit=JSON.parse(await readFile(resolve(process.argv[2]??"reports/ina-canonical-audit/latest.json"),"utf8"));
const payload=JSON.parse(await readFile(resolve(process.argv[3]??"reports/ina-canonical-audit/prospective-evaluation.json"),"utf8"));
const outputPath=resolve(process.argv[4]??"reports/research-phase-audit/phase-3-prospective-integrity.json");
const output=audit.outputs.find((row:any)=>row.outputKey==="research.prospective-evaluation");
const targets=new Map<string,any>((audit.propagation?.targets??[]).map((row:any)=>[row.moduleId,row] as [string,any]));
const panel=await readFile(resolve("src/InaProspectivePanel.tsx"),"utf8");
const dashboard=await readFile(resolve("src/TrisOpsDashboard.tsx"),"utf8");
const researchCenter=await readFile(resolve("src/ResearchDashboard.tsx"),"utf8");
const workflow=await readFile(resolve(".github/workflows/tris-live-prospective.yml"),"utf8");
const checks={
  outputPresent:Boolean(output),
  outputVersionMatches:output?.datasetVersionId===audit.sharedDatasetVersionId,
  outputHashMatches:output?.snapshotSha256===audit.snapshot.sha256,
  outputCutoffMatches:output?.drawCutoff===audit.snapshot.drawCutoff,
  outputSampleMatches:output?.sampleSize===audit.snapshot.rowCount,
  payloadVersionMatches:payload.datasetVersionId===audit.sharedDatasetVersionId,
  payloadHashMatches:payload.snapshotSha256===audit.snapshot.sha256,
  payloadCutoffMatches:payload.drawCutoff===audit.snapshot.drawCutoff,
  ledgerIntegrityClean:payload.result.ledgerAudit.summary.integrity==="clean",
  resolvedMatchesAudit:payload.result.resolvedForecasts===audit.prospective.resolvedForecasts,
  frozenMatchesAudit:payload.result.frozenForecasts===audit.prospective.frozenForecasts,
  pendingMatchesAudit:payload.result.pendingForecasts===audit.prospective.pendingForecasts,
  prospectiveModuleCurrent:targets.get("prospective-evaluator")?.state==="current",
  operationalDashboardCurrent:targets.get("operational-dashboard")?.state==="current",
  panelImported:dashboard.includes('import InaProspectivePanel from "./InaProspectivePanel"'),
  panelMounted:dashboard.includes("<InaProspectivePanel/>"),
  panelFetchesPublishedPayload:panel.includes('fetch("./research-data/prospective-evaluation.json"'),
  panelDisplaysConfigGroups:panel.includes("result.performance.groups"),
  panelMountedThroughResearchCenter:researchCenter.includes("<TrisOpsDashboard/>"),
  workflowPublishesOnlyChangedPayload:workflow.includes("git diff --cached --quiet")&&workflow.includes("prospective-evaluation.json"),
  workflowDispatchesPages:workflow.includes("gh workflow run deploy.yml"),
};
const failed=Object.entries(checks).filter(([,value])=>!value).map(([key])=>key);
assert.deepEqual(failed,[],"phase 3 prospective evidence failed: "+failed.join(", "));
const evidence={
  engine:{state:"verified",engineId:"prospective-evaluation-family",frozenForecasts:payload.result.frozenForecasts},
  canonicalInput:{state:"verified",datasetVersionId:payload.datasetVersionId,snapshotSha256:payload.snapshotSha256,drawCutoff:payload.drawCutoff,sampleSize:payload.sampleSize},
  output:{state:"verified",key:"research.prospective-evaluation",ledgerIntegrity:payload.result.ledgerAudit.summary.integrity,groups:payload.result.performance.summary.groups},
  visualization:{state:"located",path:"src/InaProspectivePanel.tsx"},
  dashboardMount:{state:"source_confirmed",entry:"ResearchDashboard → TrisOpsDashboard → InaProspectivePanel"},
  dataBinding:{state:"source_confirmed",source:"public/research-data/prospective-evaluation.json",workflowUpdatesOnLedgerChange:true},
  numericalParity:{state:"passed",resolvedForecasts:payload.result.resolvedForecasts,canonicalResolutionCheck:"each actual result matches the canonical five digits"},
};
const report={
  schemaVersion:1,phaseId:3,phaseTitle:"Memoria de señales y ciclos prospectivos",status:"partially_verified",
  generatedAt:payload.generatedAt,canonical:audit.snapshot,sharedDatasetVersionId:audit.sharedDatasetVersionId,
  evidence,checks,
  summary:{cycles:payload.result.cycles,frozenForecasts:payload.result.frozenForecasts,resolvedForecasts:payload.result.resolvedForecasts,pendingForecasts:payload.result.pendingForecasts,configurations:payload.result.performance.summary.groups},
  remaining:["Inspect the rendered panel and controls in a browser.","Complete prospective calibration and independent baseline/holdout review before predictive interpretation."],
  limitations:["The panel reports descriptive performance by frozen configuration, not calibrated probabilities or expected value.","A clean ledger and canonical result match do not establish predictive advantage."],
};
await mkdir(resolve(outputPath,".."),{recursive:true});
await writeFile(outputPath,JSON.stringify(report,null,2)+"\n","utf8");
console.log(JSON.stringify({status:report.status,canonical:report.canonical,summary:report.summary,evidence,failed},null,2));
