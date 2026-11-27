#!/usr/bin/env tsx
/** Verify append-only cycle ledger against the exact manually supplied TRIS CSV. */
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {importTrisCsv} from "../src/research/data-adapter";
import {fingerprintCycleHistory,resolveLearningCycleSignal,type FrozenLearningCycle,type ResolvedCycleSignal} from "../src/research/cycle-learning";

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
// Cross-check the consolidated evaluator projection against append-only outcomes.
let signalRecords:any[]=[];
try{signalRecords=JSON.parse(await readFile(resolve(dir,"signals.json"),"utf8")) as any[];}
catch(error){throw new Error("Consolidated signal ledger is required: "+String(error));}
const signalMap=new Map<string,any>();
for(const record of signalRecords){
 if(typeof record.id!=="string"||signalMap.has(record.id)||!Array.isArray(record.evidence))throw new Error("Invalid or duplicate consolidated signal record.");
 signalMap.set(record.id,record);
 const expectedStatus=(await import("../src/research/intuition-ledger")).assessSignal(record as import("../src/research/intuition-ledger").SignalRecord).status;
 if(record.status!==expectedStatus)throw new Error("Consolidated signal status differs from evaluator for "+record.id);
}
const outcomeGroups=new Map<string,ResolvedCycleSignal[]>();
for(const row of outcomes){const group=outcomeGroups.get(row.candidateId)??[];group.push(row);outcomeGroups.set(row.candidateId,group);}
for(const [candidateId,rows] of outcomeGroups){
 const record=signalMap.get(candidateId);
 if(!record)throw new Error("Resolved outcomes missing from consolidated signal ledger: "+candidateId);
 const prospective=record.evidence.filter((e:any)=>e.phase==="prospective");
 const n=prospective.reduce((s:number,e:any)=>s+e.n,0),hits=prospective.reduce((s:number,e:any)=>s+e.hits,0),baselineN=prospective.reduce((s:number,e:any)=>s+e.baselineN,0),baselineHits=prospective.reduce((s:number,e:any)=>s+e.baselineHits,0);
 if(n!==rows.length||hits!==rows.filter(x=>x.candidateHit).length||baselineN!==rows.length||baselineHits!==rows.filter(x=>x.baselineHit).length)
  throw new Error("Consolidated evaluator evidence does not reconcile with cycle outcomes for "+candidateId);
}
if(cycles.length!==1)throw new Error("Smoke test expected exactly one bootstrap cycle; found "+cycles.length+".");
const latest=draws.at(-1)!;
if(cycles[0].targetDrawId!==latest.drawId+1)throw new Error("Bootstrap cycle does not target the next contest.");
if(outcomes.length!==0)throw new Error("Historical bootstrap must not manufacture resolved prospective outcomes.");
console.log(JSON.stringify({status:"success",validatedDraws:draws.length,latestDrawId:latest.drawId,frozenCycles:cycles.length,frozenSignals:cycles.reduce((n,c)=>n+c.frozenCount,0),resolvedOutcomes:outcomes.length,checkpoint:"matched",prospectiveTarget:cycles[0].targetDrawId},null,2));
