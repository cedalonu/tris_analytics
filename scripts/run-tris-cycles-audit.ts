#!/usr/bin/env tsx
/** Verify append-only cycle ledger against the exact manually supplied TRIS CSV. */
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {importTrisCsv} from "../src/research/data-adapter";
import {fingerprintCycleHistory,resolveLearningCycleSignal,projectCycleOutcomesToSignalLedger,type FrozenLearningCycle,type ResolvedCycleSignal} from "../src/research/cycle-learning";

const csvPath=resolve(process.argv[2]??"data/source-snapshots/Tris-2026-11-25.csv");
const dir=resolve(process.argv[3]??"data/cycle-smoke");
const csv=await readFile(csvPath,"utf8"),parsed=importTrisCsv(csv);
if(parsed.validation.errors.length)throw new Error("CSV validation failed: "+parsed.validation.errors.slice(0,10).join("; "));
if(parsed.validation.warnings.some(w=>w.startsWith("draw gap ")))throw new Error("CSV contains missing contest IDs.");
const draws=parsed.validation.valid;
if(draws.length<200)throw new Error("At least 200 validated draws are required.");
const readJsonl=async<T>(name:string):Promise<T[]>=>{
 let raw:string;
 try{raw=await readFile(resolve(dir,name),"utf8");}
 catch(error){if((error as NodeJS.ErrnoException).code==="ENOENT"&&name==="outcomes.jsonl")return [];throw error;}
 return raw.split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line) as T);
};
const cycles=await readJsonl<FrozenLearningCycle>("cycles.jsonl");
const outcomes=await readJsonl<ResolvedCycleSignal>("outcomes.jsonl");
const state=JSON.parse(await readFile(resolve(dir,"state.json"),"utf8")) as {schemaVersion:number;processedThroughDrawId:number;processedDrawCount:number;processedPrefixSha256:string};
const byId=new Map(draws.map(d=>[d.drawId,d]));
if(state.schemaVersion!==1||state.processedThroughDrawId!==draws.at(-1)!.drawId||state.processedDrawCount!==draws.length||state.processedPrefixSha256!==fingerprintCycleHistory(draws))
 throw new Error("Checkpoint does not match the supplied CSV snapshot.");
const targetIds=new Set<number>(),cycleIds=new Set<string>(),frozen=new Map<string,{cycle:FrozenLearningCycle;signal:FrozenLearningCycle["signals"][number]}>();
for(const cycle of cycles){
 if(cycle.schemaVersion!==1||cycle.modelVersion!=="tris-cycle-learning-v1"||cycle.targetDrawId!==cycle.historyThroughDrawId+1||targetIds.has(cycle.targetDrawId)||cycleIds.has(cycle.cycleId))
  throw new Error("Invalid or duplicate frozen cycle metadata.");
 targetIds.add(cycle.targetDrawId);cycleIds.add(cycle.cycleId);
 const history=draws.filter(d=>d.drawId<=cycle.historyThroughDrawId);
 if(history.length<200||history.at(-1)?.drawId!==cycle.historyThroughDrawId||fingerprintCycleHistory(history)!==cycle.historySha256)
  throw new Error("Frozen cycle history fingerprint mismatch for "+cycle.cycleId);
 if(cycle.frozenCount!==cycle.signals.length||cycle.selectedCount<cycle.frozenCount)throw new Error("Frozen signal counts are inconsistent.");
 const local=new Set<string>();
 for(const signal of cycle.signals){
  const id=signal.forecast.forecastId;
  if(local.has(id)||frozen.has(id)||signal.candidateId!==signal.forecast.candidateId||signal.forecast.targetDrawId!==cycle.targetDrawId||signal.forecast.historySha256!==cycle.historySha256||signal.forecast.historyThroughDrawId!==cycle.historyThroughDrawId)
   throw new Error("Frozen signal identity or cycle linkage mismatch.");
  local.add(id);frozen.set(id,{cycle,signal});
 }
}
const resolved=new Set<string>();
for(const row of outcomes){
 if(resolved.has(row.forecastId))throw new Error("Duplicate resolved outcome: "+row.forecastId);
 resolved.add(row.forecastId);
 const match=frozen.get(row.forecastId);
 if(!match)throw new Error("Resolved outcome has no frozen forecast: "+row.forecastId);
 const actual=byId.get(row.targetDrawId);
 if(!actual)throw new Error("Resolved outcome target is absent from supplied CSV: "+row.targetDrawId);
 const prior=draws.filter(d=>d.drawId<=match.cycle.historyThroughDrawId);
 const expected=resolveLearningCycleSignal(match.cycle,match.signal,actual,prior,row.resolvedAt);
 for(const key of ["candidateId","targetDrawId","historySha256","frozenConfig","actual","candidateHit","baselineHit","cycleId"] as const)
  if(JSON.stringify(row[key])!==JSON.stringify(expected[key]))throw new Error("Resolved outcome differs from its frozen forecast for "+row.forecastId+" ("+key+").");
}
// Recompute the canonical evaluator projection from outcomes and reconcile exactly.
const expectedSignals=projectCycleOutcomesToSignalLedger(outcomes);
const actualSignals=JSON.parse(await readFile(resolve(dir,"signals.json"),"utf8"));
if(JSON.stringify(actualSignals)!==JSON.stringify(expectedSignals))
 throw new Error("Consolidated signal ledger differs from the canonical projection of cycle outcomes.");
if(cycles.length!==1)throw new Error("Smoke test expected exactly one bootstrap cycle; found "+cycles.length+".");
const latest=draws.at(-1)!;
const investigator=JSON.parse(await readFile(resolve(dir,"investigator-report.json"),"utf8")) as {
 generatedAt:string;targetDrawId:number;historyThroughDrawId:number;catalogSize:number;budget:number;frozenCount:number;
 explorationCount:number;exploitationCount:number;retiredExcluded:number;familyCounts:Record<string,number>;
 selected:Array<{candidateId:string;family:string;config:Record<string,unknown>;priorityScore:number;reasons:string[]}>;
 warnings:string[];
};
if(!Number.isFinite(Date.parse(investigator.generatedAt))||investigator.targetDrawId!==latest.drawId+1||investigator.historyThroughDrawId!==latest.drawId)
 throw new Error("Adaptive investigator report has invalid timestamp or temporal boundary.");
if(investigator.catalogSize<investigator.budget||investigator.budget!==100||investigator.selected.length!==100||investigator.frozenCount!==cycles[0].frozenCount)
 throw new Error("Adaptive investigator report candidate budget does not reconcile.");
if(investigator.explorationCount+investigator.exploitationCount!==investigator.selected.length||investigator.explorationCount!==50||investigator.exploitationCount!==50)
 throw new Error("Bootstrap investigator must allocate 50 exploration and 50 exploitation slots.");
for(const family of ["transition","position-mutation","absence-return","pool-ranking"])
 if(investigator.familyCounts[family]!==25)throw new Error("Adaptive investigator family quota mismatch: "+family);
if(investigator.retiredExcluded!==0)throw new Error("Fresh bootstrap should not exclude any previously retired candidates.");
const selectedById=new Map(investigator.selected.map(x=>[x.candidateId,x]));
if(selectedById.size!==investigator.selected.length)throw new Error("Adaptive investigator selected duplicate candidate IDs.");
for(const signal of cycles[0].signals){
 const selected=selectedById.get(signal.candidateId);
 if(!selected||selected.priorityScore!==signal.priorityScore||JSON.stringify(selected.reasons)!==JSON.stringify(signal.priorityReasons))
  throw new Error("Frozen signal does not match adaptive investigator report: "+signal.candidateId);
}
if(cycles[0].targetDrawId!==latest.drawId+1)throw new Error("Bootstrap cycle does not target the next contest.");
if(outcomes.length!==0)throw new Error("Historical bootstrap must not manufacture resolved prospective outcomes.");
console.log(JSON.stringify({status:"success",validatedDraws:draws.length,latestDrawId:latest.drawId,frozenCycles:cycles.length,frozenSignals:cycles.reduce((n,c)=>n+c.frozenCount,0),resolvedOutcomes:outcomes.length,checkpoint:"matched",prospectiveTarget:cycles[0].targetDrawId},null,2));
