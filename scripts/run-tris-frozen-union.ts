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
async function jsonl<T>(path:string):Promise<T[]>{try{return(await readFile(path,"utf8")).split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line) as T);}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return [];throw e;}}
const forecasts=await jsonl<FrozenForecast>(resolve(dir,"forecasts.jsonl"));
const results=await jsonl<ResolvedForecast>(resolve(dir,"results.jsonl"));
const selectedResults=results.filter(r=>ids.includes(r.candidateId));
const targetsById=new Map<number,Target>();
for(const r of selectedResults){if(!/^\d{5}$/.test(r.actual))throw new Error("malformed actual draw in resolved ledger: "+r.targetDrawId);const draw:Draw={drawId:r.targetDrawId,digits:r.actual.split("").map(Number) as Draw["digits"],date:r.actualDate};targetsById.set(r.targetDrawId,{draw,phase:"prospective"});}
const catalog=generateIntuitionCandidates();
const report=evaluateFrozenForecastUnion(ids,catalog,forecasts,Array.from(targetsById.values()));
await writeFile(out,JSON.stringify({createdAt:new Date().toISOString(),ledgerDirectory:dir,selectedCandidates:ids,resolvedTargetDraws:targetsById.size,report},null,2)+"\n","utf8");
console.log("Frozen forecast union evaluation complete.");
console.log("Selected candidates: "+ids.length);
console.log("Prospective target draws: "+targetsById.size);
console.log("Output: "+out);
console.log("No historical forecasts were backfilled; phases remain prospective only.");
