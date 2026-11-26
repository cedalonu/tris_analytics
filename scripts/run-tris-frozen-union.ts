#!/usr/bin/env tsx
/** Evaluate selected candidate unions using only the frozen prospective JSONL ledger. */
import {readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {generateIntuitionCandidates} from "../src/research/intuition-candidate-generator";
import {evaluateFrozenForecastUnion,type Target} from "../src/research/frozen-forecast-union-evaluator";
import type {FrozenForecast,ResolvedForecast} from "../src/research/intuition-prospective";
import type {Draw} from "../src/research-core";
const dir=resolve(process.argv[2]??"data/prospective");
const ids=(process.argv[3]??"").split(",").map(x=>x.trim()).filter(Boolean);
const out=resolve(process.argv[4]??"reports/frozen-union-prospective.json");
if(!ids.length){console.error("Usage: npm run research:frozen-union -- <ledger-dir> <candidate-id,candidate-id,...> [output-json]");process.exit(2);}
if(new Set(ids).size!==ids.length)throw new Error("candidate IDs must be unique");
async function jsonl<T>(path:string):Promise<T[]>{try{return(await readFile(path,"utf8")).split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line) as T);}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return [];throw e;}}
const forecasts=await jsonl<FrozenForecast>(resolve(dir,"forecasts.jsonl"));
const results=await jsonl<ResolvedForecast>(resolve(dir,"results.jsonl"));
const selectedForecasts=forecasts.filter(f=>ids.includes(f.candidateId));
const selectedResults=results.filter(r=>ids.includes(r.candidateId));
for(const id of ids){
 if(!selectedForecasts.some(f=>f.candidateId===id))throw new Error("no frozen forecasts found for selected candidate: "+id);
 if(!selectedResults.some(r=>r.candidateId===id))throw new Error("no resolved results found for selected candidate: "+id);
}
const resultKeys=new Set<string>();
for(const r of selectedResults){const key=r.targetDrawId+"|"+r.candidateId;if(resultKeys.has(key))throw new Error("duplicate resolved ledger row: "+key);resultKeys.add(key);}
const targetsById=new Map<number,Target>();
for(const r of selectedResults){
 if(!/^\d{5}$/.test(r.actual))throw new Error("malformed actual draw in resolved ledger: "+r.targetDrawId);
 const draw:Draw={drawId:r.targetDrawId,digits:r.actual.split("").map(Number) as Draw["digits"],date:r.actualDate};
 const existing=targetsById.get(r.targetDrawId);
 if(existing&&existing.draw.digits.join("")!==r.actual)throw new Error("conflicting actual outcomes for draw "+r.targetDrawId);
 targetsById.set(r.targetDrawId,{draw,phase:"prospective"});
}
const targetIds=new Set(targetsById.keys());
const forecastTargetsByCandidate=new Map(ids.map(id=>[id,new Set(selectedForecasts.filter(f=>f.candidateId===id&&targetIds.has(f.targetDrawId)).map(f=>f.targetDrawId))]));
const candidateLedgerCounts=ids.map(candidateId=>({
 candidateId,
 frozenForecastRows:selectedForecasts.filter(f=>f.candidateId===candidateId).length,
 resolvedRows:selectedResults.filter(r=>r.candidateId===candidateId).length,
 overlappingTargets:forecastTargetsByCandidate.get(candidateId)!.size
}));
const catalog=generateIntuitionCandidates();
const report=evaluateFrozenForecastUnion(ids,catalog,forecasts,Array.from(targetsById.values()));
await writeFile(out,JSON.stringify({createdAt:new Date().toISOString(),ledgerDirectory:dir,selectedCandidates:ids,resolvedTargetDraws:targetsById.size,candidateLedgerCounts,report},null,2)+"\n","utf8");
console.log("Frozen forecast union evaluation complete.");
console.log("Selected candidates: "+ids.length);
console.log("Prospective target draws: "+targetsById.size);
console.log("Candidate ledger coverage: "+candidateLedgerCounts.map(x=>x.candidateId+":"+x.overlappingTargets+"/"+targetsById.size).join(", "));
console.log("Output: "+out);
console.log("No historical forecasts were backfilled; phases remain prospective only.");
