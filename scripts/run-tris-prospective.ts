#!/usr/bin/env tsx
/**
 * Freeze upcoming TRIS forecasts and resolve older ones from a local CSV.
 * Run after manually obtaining each updated CSV. No APIs or network access.
 */
import { readFile, appendFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname, basename } from "node:path";
import { createHash } from "node:crypto";
import { importTrisCsv } from "../src/research/data-adapter";
import { createResearchPlan } from "../src/research/intuition-orchestrator";
import { appendEvidence, assessSignal, type SignalRecord } from "../src/research/intuition-ledger";
import { evaluateHypothesis, type Observation } from "../src/research/intuition-evaluator";
import { freezeProspectiveForecast, resolveProspectiveForecast, type FrozenForecast, type ResolvedForecast } from "../src/research/intuition-prospective";

const input=process.argv[2];
if(!input) {
 console.error("Usage: npm run research:prospective -- <local-path-to-Tris.csv> [ledger-directory]");
 process.exit(2);
}
const csvPath=resolve(input),ledgerDir=resolve(process.argv[3]??"data/prospective");
const csv=await readFile(csvPath,"utf8");
const imported=importTrisCsv(csv);
if(imported.validation.errors.length) {
 console.error("CSV validation errors:");
 imported.validation.errors.slice(0,30).forEach(e=>console.error("- "+e));
 process.exit(1);
}
const gaps=imported.validation.warnings.filter(w=>w.startsWith("draw gap "));
if(gaps.length) {
 console.error("Prospective processing stopped: missing contest IDs.");
 gaps.slice(0,30).forEach(w=>console.error("- "+w));
 process.exit(1);
}
const draws=imported.validation.valid;
if(draws.length<200) {
 console.error("At least 200 validated historical draws are required.");
 process.exit(1);
}
await mkdir(ledgerDir,{recursive:true});
const forecastsPath=resolve(ledgerDir,"forecasts.jsonl");
const resultsPath=resolve(ledgerDir,"results.jsonl");
const signalsPath=resolve(ledgerDir,"signals.json");
const evaluationsPath=resolve(ledgerDir,"evaluations.json");
async function readJsonl<T>(path:string):Promise<T[]> {
 try {
  const raw=await readFile(path,"utf8");
  return raw.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line) as T);
 } catch(error) {
  if((error as NodeJS.ErrnoException).code==="ENOENT")return [];
  throw error;
 }
}
const forecasts=await readJsonl<FrozenForecast>(forecastsPath);
const results=await readJsonl<ResolvedForecast>(resultsPath);
const resolvedIds=new Set(results.map(r=>r.forecastId));
const drawById=new Map(draws.map(d=>[d.drawId,d]));
const stamp=new Date().toISOString();
const newResults:ResolvedForecast[]=[];
for(const forecast of forecasts) {
 if(resolvedIds.has(forecast.forecastId))continue;
 const actual=drawById.get(forecast.targetDrawId);
 if(!actual)continue;
 newResults.push(resolveProspectiveForecast(forecast,actual,draws.filter(d=>d.drawId<forecast.targetDrawId),stamp));
}
if(newResults.length)await appendFile(resultsPath,newResults.map(r=>JSON.stringify(r)).join("\n")+"\n","utf8");

const plan=createResearchPlan({createdAt:stamp,prioritizerOptions:{maxCandidates:100}});
const nextTarget=draws.at(-1)!.drawId+1;
const existingForNext=new Set(forecasts.filter(f=>f.targetDrawId===nextTarget).map(f=>f.candidateId));
const newForecasts:FrozenForecast[]=[];
for(const hypothesis of plan.hypotheses) {
 if(existingForNext.has(hypothesis.candidate.id))continue;
 const forecast=freezeProspectiveForecast(draws,hypothesis.candidate,nextTarget,stamp);
 if(forecast)newForecasts.push(forecast);
}
if(newForecasts.length)await appendFile(forecastsPath,newForecasts.map(f=>JSON.stringify(f)).join("\n")+"\n","utf8");

const allResults=[...results,...newResults];
const signalsRaw=await (async()=>{try{return JSON.parse(await readFile(signalsPath,"utf8")) as SignalRecord[];}catch(error){if((error as NodeJS.ErrnoException).code==="ENOENT")return [];throw error;}})();
const signalMap=new Map(signalsRaw.map(record=>[record.id,record]));
const newByCandidate=new Map<string,ResolvedForecast[]>();
for(const row of newResults){const group=newByCandidate.get(row.candidateId)??[];group.push(row);newByCandidate.set(row.candidateId,group);}
for(const [candidateId,rows] of newByCandidate){
 const first=rows[0];
 const existing=signalMap.get(candidateId)??{
  id:candidateId,description:"Prospective TRIS candidate: "+first.family,
  status:"hypothesis" as const,evidence:[],createdAt:first.generatedAt,updatedAt:first.generatedAt,
  frozenConfig:first.frozenConfig
 };
 const evidenceId=createHash("sha256").update(rows.map(r=>r.forecastId).sort().join("\\n")).digest("hex");
 const evidence={
  id:evidenceId,phase:"prospective" as const,evaluatedAt:stamp,
  n:rows.length,hits:rows.filter(r=>r.candidateHit).length,
  baselineN:rows.length,baselineHits:rows.filter(r=>r.baselineHit).length,
  discordantCandidateWins:rows.filter(r=>r.candidateHit&&!r.baselineHit).length,
  discordantBaselineWins:rows.filter(r=>!r.candidateHit&&r.baselineHit).length,
  testCount:100,
  notes:"Frozen prospective batch; multiplicity budget fixed at 100 candidates."
 };
 let updated=existing;
 if(!existing.evidence.some(e=>e.id===evidenceId))updated=appendEvidence(existing,evidence);
 const assessment=assessSignal(updated);
 signalMap.set(candidateId,{...updated,status:assessment.status});
}
const signalRecords=[...signalMap.values()].sort((a,b)=>a.id.localeCompare(b.id));
await writeFile(signalsPath,JSON.stringify(signalRecords,null,2)+"\\n","utf8");
const evaluations=[...new Map(allResults.map(r=>[r.candidateId,r])).entries()].map(([candidateId])=>{
 const rows=allResults.filter(r=>r.candidateId===candidateId);
 const observations:Observation[]=rows.map(r=>({drawId:r.targetDrawId,phase:"prospective",hit:r.candidateHit,baselineHit:r.baselineHit,period:String(r.targetDrawId)}));
 const evaluation=evaluateHypothesis(observations,"prospective",{minimumN:100,testCount:100});
 const signal=signalMap.get(candidateId)!;
 return {candidateId,status:signal.status,evaluation};
});
await writeFile(evaluationsPath,JSON.stringify(evaluations,null,2)+"\\n","utf8");
const candidateWins=allResults.filter(r=>r.candidateHit&&!r.baselineHit).length;
const baselineWins=allResults.filter(r=>!r.candidateHit&&r.baselineHit).length;
const ties=allResults.length-candidateWins-baselineWins;
const pending=forecasts.length+newForecasts.length-allResults.length;
const sha256=createHash("sha256").update(csv,"utf8").digest("hex");
const report=[
 "# TRIS prospective forecast ledger",
 "",
 "## Snapshot",
 "- CSV: "+basename(csvPath),
 "- CSV SHA-256: "+sha256,
 "- Valid historical draws: "+draws.length,
 "- Latest contest: "+draws.at(-1)!.drawId,
 "- Forecast target: "+nextTarget,
 "- Updated: "+stamp,
 "",
 "## This run",
 "- Forecasts frozen for next contest: "+newForecasts.length,
 "- Previously frozen forecasts resolved: "+newResults.length,
 "- Hypotheses selected by outcome-blind priority: "+plan.selectedCount,
 "- Conditional hypotheses skipped for insufficient context: "+(plan.selectedCount-newForecasts.length),
 "",
 "## Prospective results accumulated",
 "- Resolved forecasts: "+allResults.length,
 "- Candidate-only wins vs paired baseline: "+candidateWins,
 "- Baseline-only wins: "+baselineWins,
 "- Ties (both hit or both miss): "+ties,
 "- Pending forecasts: "+pending,
 "- Persistent signal records: "+signalRecords.length,
 "- Candidates with prospective evaluation: "+evaluations.length,
 "- Candidates passing the prospective significance gate: "+evaluations.filter(e=>e.evaluation.decision==="prospective-replicated").length,
 "",
 "## Integrity rules",
 "- Forecasts are appended before the target result is observed and are never overwritten.",
 "- Resolution requires an exact matching contest ID from the local CSV.",
 "- Each forecast stores the frozen config, history fingerprint, and last historical contest ID.",
 "- The first run creates forecasts for the next contest only; it does not backfill predictions for past draws.",
 "- Run after each draw update to avoid missing prospective forecast opportunities.",
 "- These counts are descriptive only; no signal is active without the separate statistical evaluation protocol.",
 "",
 "## Files",
 "- Forecast ledger: "+forecastsPath,
 "- Resolution ledger: "+resultsPath,
 "- Evidence ledger: "+signalsPath,
 "- Paired evaluation summaries: "+evaluationsPath,
 "- CSV source SHA-256: "+sha256
].join("\n")+"\n";
await writeFile(resolve(ledgerDir,"latest-report.md"),report,"utf8");
console.log("TRIS prospective ledger updated.");
console.log("New frozen forecasts: "+newForecasts.length+" for contest "+nextTarget);
console.log("New resolved forecasts: "+newResults.length);
console.log("Total resolved: "+allResults.length);
console.log("Ledger directory: "+ledgerDir);
