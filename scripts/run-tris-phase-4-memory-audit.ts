#!/usr/bin/env tsx
/** Phase 4 evidence: temporal/contextual memory output and interactive INA panel. */
import assert from "node:assert/strict";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const audit=JSON.parse(await readFile(resolve(process.argv[2]??"reports/ina-canonical-audit/latest.json"),"utf8"));
const outputPath=resolve(process.argv[3]??"reports/research-phase-audit/phase-4-memory-integrity.json");
const output=audit.outputs.find((row:any)=>row.outputKey==="research.memory-state");
const targets=new Map<string,any>((audit.propagation?.targets??[]).map((row:any)=>[row.moduleId,row] as [string,any]));
const panel=await readFile(resolve("src/InaMemoryPanel.tsx"),"utf8");
const dashboard=await readFile(resolve("src/TrisOpsDashboard.tsx"),"utf8");
const researchCenter=await readFile(resolve("src/ResearchDashboard.tsx"),"utf8");
const testFile=await stat(resolve("src/research/ina-memory-state.test.ts"));
const memory=audit.memory;
const temporal=memory?.temporalScopes??[];
const contextual=memory?.contextualScopes??[];
const checks={
  outputPresent:Boolean(output),
  outputVersionMatches:output?.datasetVersionId===audit.sharedDatasetVersionId,
  outputHashMatches:output?.snapshotSha256===audit.snapshot.sha256,
  outputCutoffMatches:output?.drawCutoff===audit.snapshot.drawCutoff,
  outputSampleMatches:output?.sampleSize===audit.snapshot.rowCount,
  memoryModuleCurrent:targets.get("memory-research")?.state==="current",
  temporalAllHistory:temporal.some((row:any)=>row.scope==="all-history"&&row.comparisons===125),
  temporalRecent200:temporal.some((row:any)=>row.scope==="last-200"&&row.comparisons===125),
  contextualAllHistory:contextual.some((row:any)=>row.scope==="all-history"&&row.comparisons===250),
  contextualRecent200:contextual.some((row:any)=>row.scope==="last-200"&&row.comparisons===250),
  panelImported:dashboard.includes('import InaMemoryPanel from "./InaMemoryPanel"'),
  panelMounted:dashboard.includes("<InaMemoryPanel output={memoryOutput}/>"),
  panelConsumesTemporal:panel.includes("result.temporal.scopes"),
  panelConsumesContextual:panel.includes("result.contextual.scopes"),
  panelHasScopeLagPositionContextSelectors:["setScope","setLag","setSourcePosition","setTargetPosition","setContextKind"].every(key=>panel.includes(key)),
  panelShowsProvenance:panel.includes("output.snapshotSha256")&&panel.includes("output.drawCutoff"),
  panelMountedThroughResearchCenter:researchCenter.includes("<TrisOpsDashboard/>"),
  unitTestsLocated:testFile.isFile(),
};
const failed=Object.entries(checks).filter(([,value])=>!value).map(([key])=>key);
assert.deepEqual(failed,[],"phase 4 memory evidence failed: "+failed.join(", "));
const evidence={
  engine:{state:"verified",engineId:"research-memory-family",temporalScopes:temporal.length,contextualScopes:contextual.length},
  canonicalInput:{state:"verified",datasetVersionId:audit.sharedDatasetVersionId,snapshotSha256:audit.snapshot.sha256,drawCutoff:audit.snapshot.drawCutoff,sampleSize:audit.snapshot.rowCount},
  output:{state:"verified",key:"research.memory-state",temporalComparisons:temporal.reduce((sum:number,row:any)=>sum+row.comparisons,0),contextualComparisons:contextual.reduce((sum:number,row:any)=>sum+row.comparisons,0)},
  visualization:{state:"located",path:"src/InaMemoryPanel.tsx"},
  dashboardMount:{state:"source_confirmed",entry:"ResearchDashboard → TrisOpsDashboard → InaMemoryPanel"},
  dataBinding:{state:"source_confirmed",selectors:["scope","lag","sourcePosition","targetPosition","contextKind"]},
  numericalParity:{state:"partial",syntheticUnitTests:true,fullCanonicalIndependentRecomputation:false},
};
const report={
  schemaVersion:1,phaseId:4,phaseTitle:"Memoria posicional y contextual",status:"partially_verified",
  generatedAt:audit.snapshot.fetchedAt,canonical:audit.snapshot,sharedDatasetVersionId:audit.sharedDatasetVersionId,
  evidence,checks,
  summary:{temporalScopes:temporal,contextualScopes:contextual},
  remaining:["Inspect interactive selectors, transition bars and context distributions in a browser.","Add independent full-canonical numeric parity checks for the temporal/contextual distributions."],
  limitations:["Memory metrics are descriptive dependencies; they do not imply causality or predictive advantage.","All-history and trailing scopes overlap and are not independent replications."],
};
await mkdir(resolve(outputPath,".."),{recursive:true});
await writeFile(outputPath,JSON.stringify(report,null,2)+"\n","utf8");
console.log(JSON.stringify({status:report.status,canonical:report.canonical,evidence,failed},null,2));
