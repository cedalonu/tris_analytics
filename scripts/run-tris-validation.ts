#!/usr/bin/env tsx
/**
 * One frozen chronological validation experiment on a manually supplied CSV.
 * No APIs or network access. Manifest locks the sample, candidates and splits.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { createHash } from "node:crypto";
import { importTrisCsv } from "../src/research/data-adapter";
import { createResearchPlan, type ResearchPlan } from "../src/research/intuition-orchestrator";
import { runIntuitionWalkForward, type PhaseBoundary } from "../src/research/intuition-walk-forward-engine";
import { evaluateHypothesis, type Observation } from "../src/research/intuition-evaluator";
import { appendEvidence, assessSignal, type SignalRecord } from "../src/research/intuition-ledger";
import type { Draw } from "../src/research-core";

interface Manifest {
 schemaVersion:1; createdAt:string; sourceSha256:string; historySha256:string;
 drawCount:number; firstDrawId:number; lastDrawId:number;
 warmupDraws:number; boundaries:PhaseBoundary[]; plan:ResearchPlan;
}
const input=process.argv[2];
if(!input){console.error("Usage: npm run research:validate -- <local-path-to-Tris.csv> [ledger-directory]");process.exit(2);}
const csvPath=resolve(input),ledgerDir=resolve(process.argv[3]??"data/prospective");
const csv=await readFile(csvPath,"utf8"),imported=importTrisCsv(csv);
if(imported.validation.errors.length){console.error(imported.validation.errors.slice(0,30).join("\n"));process.exit(1);}
if(imported.validation.warnings.some(w=>w.startsWith("draw gap "))){console.error("Validation blocked: missing contest IDs.");process.exit(1);}
const draws=imported.validation.valid as Draw[];
const warmup=200,scored=draws.length-warmup;
if(scored<400){console.error("At least 600 contiguous draws are required to reserve 200 warmup + 100 validation + 100 holdout.");process.exit(1);}
await mkdir(ledgerDir,{recursive:true});
const manifestPath=resolve(ledgerDir,"experiment-manifest.json");
const signalsPath=resolve(ledgerDir,"signals.json");
const reportPath=resolve(ledgerDir,"validation-report.md");
const sha=(value:string)=>createHash("sha256").update(value,"utf8").digest("hex");
const fingerprint=(rows:Draw[])=>sha(rows.map(d=>d.drawId+"|"+d.digits.join("")+"|"+(d.date??"")).join("\n")+"\n");
const stamp=new Date().toISOString();
let manifest:Manifest;
try {
 manifest=JSON.parse(await readFile(manifestPath,"utf8")) as Manifest;
 if(draws.length<manifest.drawCount)throw new Error("CSV is shorter than the frozen experiment history");
 const prefix=draws.slice(0,manifest.drawCount);
 if(prefix.at(-1)!.drawId!==manifest.lastDrawId||fingerprint(prefix)!==manifest.historySha256)
  throw new Error("CSV historical prefix changed; refusing to rewrite frozen experiment");
} catch(error) {
 if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;
 const first=draws[warmup].drawId,discoveryN=Math.floor(scored*.5),validationN=Math.floor(scored*.25);
 const discoveryLast=first+discoveryN-1,validationLast=discoveryLast+validationN,holdoutLast=draws.at(-1)!.drawId;
 const plan=createResearchPlan({createdAt:stamp,prioritizerOptions:{maxCandidates:100}});
 manifest={
  schemaVersion:1,createdAt:stamp,sourceSha256:sha(csv),historySha256:fingerprint(draws),
  drawCount:draws.length,firstDrawId:draws[0].drawId,lastDrawId:draws.at(-1)!.drawId,
  warmupDraws:warmup,
  boundaries:[
   {phase:"discovery",firstDrawId:first,lastDrawId:discoveryLast},
   {phase:"validation",firstDrawId:discoveryLast+1,lastDrawId:validationLast},
   {phase:"holdout",firstDrawId:validationLast+1,lastDrawId:holdoutLast}
  ],
  plan
 };
 await writeFile(manifestPath,JSON.stringify(manifest,null,2)+"\n","utf8");
}
const experimentDraws=draws.slice(0,manifest.drawCount);
let signals:SignalRecord[]=[];
try{signals=JSON.parse(await readFile(signalsPath,"utf8")) as SignalRecord[];}
catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
const signalMap=new Map(signals.map(s=>[s.id,s]));
const reportRows:any[]=[];
for(const hypothesis of manifest.plan.hypotheses){
 const walk=runIntuitionWalkForward(experimentDraws,hypothesis.candidate,manifest.boundaries);
 const validationRows=walk.observations.filter(o=>o.phase==="validation");
 const holdoutRows=walk.observations.filter(o=>o.phase==="holdout");
 const validation=evaluateHypothesis(validationRows,"validation",{minimumN:100,testCount:manifest.plan.selectedCount});
 const holdout=evaluateHypothesis(holdoutRows,"holdout",{minimumN:100,testCount:manifest.plan.selectedCount});
 const existing=signalMap.get(hypothesis.candidate.id)??hypothesis.ledgerRecord;
 const evidenceId=sha("validation|"+manifest.historySha256+"|"+hypothesis.candidate.id);
 let updated=existing;
 if(!existing.evidence.some(e=>e.id===evidenceId)){
  const rows=validationRows;
  updated=appendEvidence(existing,{
   id:evidenceId,phase:"validation",evaluatedAt:stamp,n:rows.length,
   hits:rows.filter(r=>r.hit).length,baselineN:rows.length,
   baselineHits:rows.filter(r=>r.baselineHit).length,
   discordantCandidateWins:rows.filter(r=>r.hit&&!r.baselineHit).length,
   discordantBaselineWins:rows.filter(r=>!r.hit&&r.baselineHit).length,
   testCount:manifest.plan.selectedCount,
   notes:"Frozen chronological validation partition; candidate catalog and multiplicity budget stored in experiment manifest."
  });
 }
 const assessment=assessSignal(updated);
 signalMap.set(hypothesis.candidate.id,{...updated,status:assessment.status});
 reportRows.push({
  candidateId:hypothesis.candidate.id,family:hypothesis.candidate.family,
  config:hypothesis.candidate.frozenConfig,coverage:walk.coverage,
  validation,holdout,ledgerStatus:assessment.status
 });
}
const records=[...signalMap.values()].sort((a,b)=>a.id.localeCompare(b.id));
await writeFile(signalsPath,JSON.stringify(records,null,2)+"\n","utf8");
const summary=[
 "# TRIS frozen chronological validation",
 "",
 "- CSV: "+basename(csvPath),
 "- Original source SHA-256: "+manifest.sourceSha256,
 "- Frozen history SHA-256: "+manifest.historySha256,
 "- Frozen contests: "+manifest.drawCount+" ("+manifest.firstDrawId+"–"+manifest.lastDrawId+")",
 "- Warmup draws: "+manifest.warmupDraws,
 "- Candidate catalog: "+manifest.plan.catalogSize,
 "- Frozen candidate budget: "+manifest.plan.selectedCount,
 "- Created: "+manifest.createdAt,
 "- Re-run: "+stamp,
 "",
 "## Frozen partitions",
 ...manifest.boundaries.map(b=>"- "+b.phase+": "+b.firstDrawId+"–"+b.lastDrawId),
 "",
 "## Results",
 "- Candidates evaluated: "+reportRows.length,
 "- Validation candidates passing adjusted paired gate: "+reportRows.filter(r=>r.validation.decision==="continue-research").length,
 "- Holdout candidates passing adjusted paired gate: "+reportRows.filter(r=>r.holdout.decision==="holdout-confirmed").length,
 "- Candidates provisionally supported by validation: "+records.filter(r=>r.status==="provisional"||r.status==="active").length,
 "",
 "## Interpretation safeguards",
 "- Discovery is descriptive; validation determines provisional eligibility.",
 "- Holdout is reported separately and is not appended as validation evidence.",
 "- Bonferroni correction uses the frozen candidate count in the manifest.",
 "- A repeated run reuses identical historical rows, candidate catalog, and partition boundaries.",
 "- New CSV rows beyond the frozen manifest are excluded; use prospective runner for new contests.",
 "- No candidate becomes active without separate frozen prospective evidence.",
 "- This report is a test of hypotheses, not proof of future lottery predictability.",
 "",
 "## Output files",
 "- Manifest: "+manifestPath,
 "- Persistent evidence ledger: "+signalsPath,
 "- Detailed machine-readable results: "+resolve(ledgerDir,"validation-results.json")
].join("\n")+"\n";
await writeFile(reportPath,summary,"utf8");
await writeFile(resolve(ledgerDir,"validation-results.json"),JSON.stringify(reportRows,null,2)+"\n","utf8");
console.log("Frozen TRIS validation complete.");
console.log("Candidates: "+reportRows.length);
console.log("Validation passing: "+reportRows.filter(r=>r.validation.decision==="continue-research").length);
console.log("Holdout passing: "+reportRows.filter(r=>r.holdout.decision==="holdout-confirmed").length);
console.log("Report: "+reportPath);
