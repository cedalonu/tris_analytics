#!/usr/bin/env tsx
/** Append-only prospective learning cycles. Reads a validated local CSV snapshot; source acquisition is handled separately. */
import {readFile,appendFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import {generateIntuitionCandidates} from "../src/research/intuition-candidate-generator";
import {selectAdaptiveIntuitionCandidates} from "../src/research/intuition-adaptive-investigator";
import {proposeAdaptiveCandidateVariants} from "../src/research/intuition-adaptive-variants";
import {freezeLearningCycle,resolveLearningCycleSignal,assessCycleSignalLifecycle,fingerprintCycleHistory,projectCycleOutcomesToSignalLedger,type FrozenLearningCycle,type ResolvedCycleSignal} from "../src/research/cycle-learning";
import {analyzePositionContextMemory} from "../src/research/position-context-memory";
import type {SignalRecord} from "../src/research/intuition-ledger";

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
let priorSignalRecords:SignalRecord[]=[];
try{priorSignalRecords=JSON.parse(await readFile(signalsPath,"utf8")) as SignalRecord[];}
catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}
const signalRecords=projectCycleOutcomesToSignalLedger(allOutcomes,priorSignalRecords);
await writeFile(signalsPath,JSON.stringify(signalRecords,null,2)+"\n","utf8");
const nextTarget=latest.drawId+1,alreadyFrozen=cycles.some(c=>c.targetDrawId===nextTarget);
let newCycle:FrozenLearningCycle|null=null;
let investigatorReport:ReturnType<typeof selectAdaptiveIntuitionCandidates>|null=null;
if(!alreadyFrozen){
 const retiredIds=lifecycle.filter(x=>x.status==="retired").map(x=>x.candidateId);
 const catalog=generateIntuitionCandidates();
 const variants=proposeAdaptiveCandidateVariants(catalog,allOutcomes,{
  beforeDrawId:nextTarget,minResolvedDraws:25,priorStrength:20,maxVariants:20,retiredCandidateIds:retiredIds
 });
 const investigatorCatalog=[...catalog,...variants.map(v=>v.candidate)];
 investigatorReport=selectAdaptiveIntuitionCandidates(investigatorCatalog,allOutcomes,{
  beforeDrawId:nextTarget,budget:100,explorationFraction:.5,priorStrength:20,recentWindow:25,
  familyCaps:{transition:25,"position-mutation":25,"absence-return":25,"pool-ranking":25},
  retiredCandidateIds:retiredIds
 });
 const selected=investigatorReport.selected.map(item=>({candidate:item.candidate,priorityScore:item.priorityScore,priorityReasons:item.priorityReasons}));
 newCycle=freezeLearningCycle(draws,selected,nextTarget,stamp,selected.length);
 if(newCycle.frozenCount)await appendFile(cyclesPath,JSON.stringify(newCycle)+"\n","utf8");
 await writeFile(resolve(ledgerDir,"investigator-report.json"),JSON.stringify({
  generatedAt:stamp,targetDrawId:nextTarget,historyThroughDrawId:latest.drawId,
  catalogSize:investigatorReport.catalogSize,baseCatalogSize:catalog.length,variantCount:variants.length,
  variants:variants.map(v=>({candidateId:v.candidate.id,parentCandidateId:v.parentCandidateId,changedParameter:v.changedParameter,fromValue:v.fromValue,toValue:v.toValue,config:v.candidate.config,frozenConfig:v.candidate.frozenConfig,parentResolvedDraws:v.parentResolvedDraws,parentPairedWins:v.parentPairedWins,parentPairedLosses:v.parentPairedLosses,parentShrunkAdvantage:v.parentShrunkAdvantage,proposalReason:v.proposalReason})),
  budget:investigatorReport.budget,
  frozenCount:newCycle.frozenCount,explorationCount:investigatorReport.explorationCount,
  exploitationCount:investigatorReport.exploitationCount,retiredExcluded:investigatorReport.retiredExcluded,
  familyCounts:investigatorReport.familyCounts,
  selected:investigatorReport.selected.map(x=>({candidateId:x.candidate.id,family:x.candidate.family,config:x.candidate.config,priorityScore:x.priorityScore,reasons:x.priorityReasons,parentCandidateId:variants.find(v=>v.candidate.id===x.candidate.id)?.parentCandidateId??null})),
  warnings:investigatorReport.warnings
 },null,2)+"\n","utf8");
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
 "- Investigator mode: "+(investigatorReport?"evidence-guided exploration/exploitation":"no new cycle required"),
 "- Investigator catalog: "+(investigatorReport?.catalogSize??0),
 "- Investigator exploration / exploitation: "+(investigatorReport?investigatorReport.explorationCount+" / "+investigatorReport.exploitationCount:"n/a"),
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
 "- No API calls or polling are used; this run consumes one validated local snapshot (which may have been fetched on demand from the authorized public CSV).","",
 "## Local files","- "+cyclesPath,"- "+outcomesPath,"- "+statePath,"- "+resolve(ledgerDir,"lifecycle.json"),"- "+resolve(ledgerDir,"position-context-memory.json"),"- "+signalsPath,"- "+resolve(ledgerDir,"investigator-report.json")
].join("\n")+"\n";
await writeFile(resolve(ledgerDir,"latest-report.md"),report,"utf8");
const nextState:State={schemaVersion:1,processedThroughDrawId:latest.drawId,processedDrawCount:draws.length,processedPrefixSha256:fingerprintCycleHistory(draws),updatedAt:stamp};
await writeFile(statePath,JSON.stringify(nextState,null,2)+"\n","utf8");
console.log("TRIS learning cycle ledger updated.");
console.log("Resolved signal outcomes: "+newOutcomes.length);
console.log("New frozen cycle: "+(newCycle?.targetDrawId??"none"));
console.log("Ledger directory: "+ledgerDir);
