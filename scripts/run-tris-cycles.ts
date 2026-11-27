#!/usr/bin/env tsx
/** Append-only prospective learning cycles. Reads only a manually supplied local CSV. */
import {readFile,appendFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import {createResearchPlan} from "../src/research/intuition-orchestrator";
import {freezeLearningCycle,resolveLearningCycleSignal,assessCycleSignalLifecycle,fingerprintCycleHistory,type FrozenLearningCycle,type ResolvedCycleSignal} from "../src/research/cycle-learning";
import {analyzePositionContextMemory} from "../src/research/position-context-memory";
import {appendEvidence,assessSignal,type SignalRecord} from "../src/research/intuition-ledger";

const sha=(value:string)=>createHash("sha256").update(value,"utf8").digest("hex");
const input=process.argv[2];
if(!input){console.error("Usage: npm run research:cycles -- <local-path-to-Tris.csv> [ledger-directory]");process.exit(2);}
const csvPath=resolve(input),ledgerDir=resolve(process.argv[3]??"data/cycles");
const csv=await readFile(csvPath,"utf8"),imported=importTrisCsv(csv);
if(imported.validation.errors.length){console.error(imported.validation.errors.slice(0,30).join("\n"));process.exit(1);}
const gaps=imported.validation.warnings.filter(w=>w.startsWith("draw gap "));
if(gaps.length){console.error("Cycle processing stopped: missing contest IDs.\n"+gaps.slice(0,20).join("\n"));process.exit(1);}
const draws=imported.validation.valid;
if(draws.length<200){console.error("At least 200 validated historical draws are required.");process.exit(1);}
await mkdir(ledgerDir,{recursive:true});
const cyclesPath=resolve(ledgerDir,"cycles.jsonl"),outcomesPath=resolve(ledgerDir,"outcomes.jsonl"),statePath=resolve(ledgerDir,"state.json");
async function readJsonl<T>(path:string):Promise<T[]>{try{return (await readFile(path,"utf8")).split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line) as T);}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return [];throw e;}}
interface State{schemaVersion:1;processedThroughDrawId:number;processedDrawCount:number;processedPrefixSha256:string;updatedAt:string;}
async function readState():Promise<State|null>{try{return JSON.parse(await readFile(statePath,"utf8")) as State;}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return null;throw e;}}
const cycles=await readJsonl<FrozenLearningCycle>(cyclesPath),outcomes=await readJsonl<ResolvedCycleSignal>(outcomesPath);
const stamp=new Date().toISOString(),latest=draws.at(-1)!;
let state=await readState(),initialized=false;
if(!state&&(cycles.length||outcomes.length))throw new Error("Cycle ledger has frozen records but its checkpoint is missing; refusing unsafe reinitialization.");
const cycleTargets=new Set<number>(),cycleIds=new Set<string>(),frozenIds=new Set<string>();
for(const cycle of cycles){
 if(cycleTargets.has(cycle.targetDrawId)||cycleIds.has(cycle.cycleId))throw new Error("Duplicate frozen cycle target or cycle ID.");
 cycleTargets.add(cycle.targetDrawId);cycleIds.add(cycle.cycleId);
 for(const signal of cycle.signals){
  if(frozenIds.has(signal.forecast.forecastId))throw new Error("Duplicate frozen forecast ID in cycle ledger.");
  frozenIds.add(signal.forecast.forecastId);
 }
}
const outcomeIds=new Set<string>();
for(const outcome of outcomes){
 if(outcomeIds.has(outcome.forecastId))throw new Error("Duplicate resolved forecast ID in outcome ledger.");
 outcomeIds.add(outcome.forecastId);
 if(!frozenIds.has(outcome.forecastId))throw new Error("Outcome has no matching frozen forecast; refusing to continue.");
}
if(state){
 const prefix=draws.filter(d=>d.drawId<=state!.processedThroughDrawId);
 if(prefix.length!==state.processedDrawCount||prefix.at(-1)?.drawId!==state.processedThroughDrawId||fingerprintCycleHistory(prefix)!==state.processedPrefixSha256)
  throw new Error("CSV processed prefix changed or was truncated; restore the original historical rows before continuing.");
 if(latest.drawId<state.processedThroughDrawId)throw new Error("CSV is older than the cycle checkpoint.");
}else initialized=true;
const resolvedIds=new Set(outcomes.map(o=>o.forecastId)),drawById=new Map(draws.map(d=>[d.drawId,d]));
const newOutcomes:ResolvedCycleSignal[]=[];
for(const cycle of cycles){
 const actual=drawById.get(cycle.targetDrawId);if(!actual)continue;
 const prior=draws.filter(d=>d.drawId<=cycle.historyThroughDrawId);
 if(prior.length!==cycle.historyThroughDrawId-draws[0].drawId+1)throw new Error("frozen pre-result history is incomplete for cycle "+cycle.cycleId);
 for(const signal of cycle.signals){
  if(resolvedIds.has(signal.forecast.forecastId))continue;
  newOutcomes.push(resolveLearningCycleSignal(cycle,signal,actual,prior,stamp));
 }
}
if(newOutcomes.length)await appendFile(outcomesPath,newOutcomes.map(x=>JSON.stringify(x)).join("\n")+"\n","utf8");
const allOutcomes=[...outcomes,...newOutcomes],lifecycle=assessCycleSignalLifecycle(allOutcomes);
// Canonical signal ledger: append each newly resolved cycle batch exactly once.
// Cycle outcomes remain the source of truth; this ledger is the evaluator projection.
const signalsPath=resolve(ledgerDir,"signals.json");
let signalRecords:SignalRecord[]=[];
try{signalRecords=JSON.parse(await readFile(signalsPath,"utf8")) as SignalRecord[];}
catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
const signalMap=new Map(signalRecords.map(record=>[record.id,record]));
if(signalMap.size!==signalRecords.length)throw new Error("Duplicate candidate IDs in consolidated signal ledger.");
const newByCandidate=new Map<string,ResolvedCycleSignal[]>();
for(const row of newOutcomes){const batch=newByCandidate.get(row.candidateId)??[];batch.push(row);newByCandidate.set(row.candidateId,batch);}
for(const [candidateId,rows] of newByCandidate){
 const first=rows[0],existing=signalMap.get(candidateId);
 const record:SignalRecord=existing??{
  id:candidateId,description:"TRIS prospective cycle candidate: "+first.family,
  status:"hypothesis",evidence:[],createdAt:first.generatedAt,updatedAt:first.generatedAt,
  frozenConfig:first.frozenConfig
 };
 if(record.frozenConfig&&record.frozenConfig!==first.frozenConfig)throw new Error("Candidate frozen configuration changed in consolidated signal ledger: "+candidateId);
 const evidenceId=sha(rows.map(row=>row.forecastId).sort().join("\n"));
 if(!record.evidence.some(e=>e.id===evidenceId)){
  const evidence={
   id:evidenceId,phase:"prospective" as const,evaluatedAt:stamp,
   n:rows.length,hits:rows.filter(row=>row.candidateHit).length,
   baselineN:rows.length,baselineHits:rows.filter(row=>row.baselineHit).length,
   discordantCandidateWins:rows.filter(row=>row.candidateHit&&!row.baselineHit).length,
   discordantBaselineWins:rows.filter(row=>!row.candidateHit&&row.baselineHit).length,
   testCount:100,
   notes:"Append-only prospective evidence from frozen learning-cycle outcomes; multiplicity budget fixed at 100 candidates."
  };
  signalMap.set(candidateId,appendEvidence(record,evidence));
 }
 const updated=signalMap.get(candidateId)!;
 const assessment=assessSignal(updated);
 signalMap.set(candidateId,{...updated,status:assessment.status});
}
signalRecords=[...signalMap.values()].sort((a,b)=>a.id.localeCompare(b.id));
await writeFile(signalsPath,JSON.stringify(signalRecords,null,2)+"\n","utf8");
const nextTarget=latest.drawId+1,alreadyFrozen=cycles.some(c=>c.targetDrawId===nextTarget);
let newCycle:FrozenLearningCycle|null=null;
if(!alreadyFrozen){
 const plan=createResearchPlan({createdAt:stamp,prioritizerOptions:{maxCandidates:100}});
 const retiredIds=new Set(lifecycle.filter(x=>x.status==="retired").map(x=>x.candidateId));
 const selected=plan.hypotheses.filter(h=>!retiredIds.has(h.candidate.id)).map(h=>({candidate:h.candidate,priorityScore:h.priorityScore,priorityReasons:h.priorityReasons}));
 newCycle=freezeLearningCycle(draws,selected,nextTarget,stamp,selected.length);
 if(newCycle.frozenCount)await appendFile(cyclesPath,JSON.stringify(newCycle)+"\n","utf8");
}
await writeFile(resolve(ledgerDir,"lifecycle.json"),JSON.stringify({generatedAt:stamp,source:basename(csvPath),signals:lifecycle},null,2)+"\n","utf8");
const positionMemory=analyzePositionContextMemory(allOutcomes);
await writeFile(resolve(ledgerDir,"position-context-memory.json"),JSON.stringify({generatedAt:stamp,source:basename(csvPath),...positionMemory},null,2)+"\n","utf8");
const csvSha=createHash("sha256").update(csv,"utf8").digest("hex");
const previousId=state?.processedThroughDrawId??null;
const missed=previousId===null?0:Math.max(0,latest.drawId-previousId-new Set(cycles.filter(c=>c.targetDrawId>previousId&&c.targetDrawId<=latest.drawId).map(c=>c.targetDrawId)).size);
const report=[
 "# TRIS learning cycles — latest run","",
 "## Snapshot",
 "- CSV: "+basename(csvPath),"- CSV SHA-256: "+csvSha,
 "- Valid contests: "+draws.length,"- Latest contest: "+latest.drawId,
 "- Previous checkpoint: "+(previousId??"initialized on this run"),"- Updated: "+stamp,"",
 "## This run",
 "- Initial bootstrap: "+(initialized?"yes":"no"),
 "- Previously frozen signal outcomes resolved: "+newOutcomes.length,
 "- New cycle target: "+(newCycle?String(newCycle.targetDrawId):"already frozen / no new cycle"),
 "- Signals selected after retired-signal filter: "+(newCycle?.selectedCount??0),
 "- Previously retired signals excluded from new cycles: "+lifecycle.filter(x=>x.status==="retired").length,
 "- Signals successfully frozen: "+(newCycle?.frozenCount??0),
 "- Contest IDs passed without a frozen cycle (not backfilled): "+missed,"",
 "## Position and pre-draw context memory",
 "- Position-specific resolved trials: "+positionMemory.positionSpecificTrials,
 "- Full-result transition trials kept separate: "+positionMemory.modeLevelTrials,
 "- Position/context strata: "+positionMemory.positions.length,
 "- Mode-level scopes: "+positionMemory.modeScopes.length,"",
 "| Position | Family | Configuration | Previous pool | Previous duplicates | Draws | Candidate coverage | Baseline | Difference |",
 "|---:|---|---|---|---|---:|---:|---:|---:|",
 ...positionMemory.positions.map(x=>"| R"+(x.position+1)+" | "+x.family+" | `"+x.configuration+"` | "+x.poolRegime+" | "+x.duplicateRegime+" | "+x.draws+" | "+(100*x.meanCandidateHitRate).toFixed(1)+"% | "+(100*x.meanBaselineHitRate).toFixed(1)+"% | "+(100*x.difference).toFixed(1)+" pp |"),
 "",
 "## Accumulated evidence",
 "- Frozen cycles: "+(cycles.length+(newCycle?1:0)),
 "- Resolved signal outcomes: "+allOutcomes.length,
 "- Signals with lifecycle records: "+lifecycle.length,
 "- Consolidated evaluator records: "+signalRecords.length,
 "- Consolidated prospective evidence rows: "+signalRecords.reduce((n,r)=>n+r.evidence.filter(e=>e.phase==="prospective").reduce((m,e)=>m+e.n,0),0),
 "- Persistent: "+lifecycle.filter(x=>x.status==="persistent").length,
 "- Strengthening: "+lifecycle.filter(x=>x.status==="strengthening").length,
 "- Weakening: "+lifecycle.filter(x=>x.status==="weakening").length,
 "- Retired: "+lifecycle.filter(x=>x.status==="retired").length,"",
 "## Lifecycle detail",
 "| Candidate | State | Cycles | Hit rate | Baseline | Difference |",
 "|---|---|---:|---:|---:|---:|",
 ...lifecycle.map(x=>"| "+x.candidateId+" | "+x.status+" | "+x.resolvedCycles+" | "+(100*x.hitRate).toFixed(1)+"% | "+(100*x.baselineRate).toFixed(1)+"% | "+(100*x.difference).toFixed(1)+" pp |"),
 "","## Integrity",
 "- Frozen predictions and configurations are append-only and never recalculated after a result.",
 "- Outcomes resolve only against the exact contest ID and the original pre-result history fingerprint.",
 "- First run does not create retrospective forecasts; it freezes only the next contest.",
 "- Missed contests are never backfilled. Run after each CSV update to preserve prospective coverage.",
 "- Hit rates are binary pool/outcome coverage, not calibrated probabilities.",
 "- Lifecycle labels are descriptive; they do not promote hypotheses or change candidate weights.",
 "- No APIs, network calls, polling or automatic downloads are used.","",
 "## Local files","- "+cyclesPath,"- "+outcomesPath,"- "+statePath,"- "+resolve(ledgerDir,"lifecycle.json"),"- "+resolve(ledgerDir,"position-context-memory.json"),"- "+signalsPath
].join("\n")+"\n";
await writeFile(resolve(ledgerDir,"latest-report.md"),report,"utf8");
const nextState:State={schemaVersion:1,processedThroughDrawId:latest.drawId,processedDrawCount:draws.length,processedPrefixSha256:fingerprintCycleHistory(draws),updatedAt:stamp};
await writeFile(statePath,JSON.stringify(nextState,null,2)+"\n","utf8");
console.log("TRIS learning cycle ledger updated.");
console.log("Resolved signal outcomes: "+newOutcomes.length);
console.log("New frozen cycle: "+(newCycle?.targetDrawId??"none"));
console.log("Ledger directory: "+ledgerDir);
