/**
 * Prospective learning cycles for TRIS.
 * Each cycle freezes the selected signals before one target contest, then
 * resolves only those frozen signals after the exact result is supplied.
 */
import {createHash} from "node:crypto";
import type {Draw} from "../research-core";
import type {IntuitionCandidate} from "./intuition-candidate-generator";
import {freezeProspectiveForecast,resolveProspectiveForecast,type FrozenForecast,type ResolvedForecast} from "./intuition-prospective";

export interface PreDrawContext {
 previousPoolSize:number;
 previousDuplicatePairs:number;
 previousRepeatedPositions:number;
 poolRegime:"compact"|"mixed"|"broad";
 duplicateRegime:"few-duplicates"|"many-duplicates";
}
export interface FrozenCycleSignal {
 candidateId:string;
 priorityScore:number;
 priorityReasons:string[];
 position:number|null;
 context:PreDrawContext;
 forecast:FrozenForecast;
}
export interface FrozenLearningCycle {
 schemaVersion:1;
 cycleId:string;
 modelVersion:"tris-cycle-learning-v1";
 targetDrawId:number;
 generatedAt:string;
 historyThroughDrawId:number;
 historySha256:string;
 selectedCount:number;
 frozenCount:number;
 signals:FrozenCycleSignal[];
}
export interface ResolvedCycleSignal extends ResolvedForecast {
 cycleId:string;
 modelVersion:"tris-cycle-learning-v1";
 position:number|null;
 context:PreDrawContext;
}
export interface CycleBlock {
 startDrawId:number;
 endDrawId:number;
 observations:number;
 hits:number;
 baselineHits:number;
 hitRate:number;
 baselineRate:number;
 difference:number;
 state:"positive"|"negative"|"neutral";
}
export type CycleSignalStatus="unobserved"|"emerging"|"strengthening"|"persistent"|"weakening"|"unstable"|"dormant"|"retired";
export interface CycleSignalLifecycle {
 candidateId:string;
 status:CycleSignalStatus;
 resolvedCycles:number;
 totalHits:number;
 baselineHits:number;
 hitRate:number;
 baselineRate:number;
 difference:number;
 positiveBlocks:number;
 negativeBlocks:number;
 latestBlock:CycleBlock|null;
 blocks:CycleBlock[];
 interpretation:string;
}
const sha=(value:string)=>createHash("sha256").update(value,"utf8").digest("hex");
export function fingerprintCycleHistory(draws:Draw[]):string {
 return sha(draws.map(d=>[d.drawId,d.digits.join(""),d.date??""].join("|")).join("\n")+"\n");
}
function validateContiguous(draws:Draw[]):void {
 if(!draws.length)throw new Error("cycle history cannot be empty");
 for(let i=0;i<draws.length;i++){
  const d=draws[i];
  if(!Number.isInteger(d.drawId)||d.drawId<=0||!Array.isArray(d.digits)||d.digits.length!==5||d.digits.some(x=>!Number.isInteger(x)||x<0||x>9))throw new Error("invalid draw at index "+i);
  if(i&&d.drawId!==draws[i-1].drawId+1)throw new Error("cycle history must be contiguous by contest ID");
 }
}
/** Freeze all selected candidates from one and the same pre-result history snapshot. */
export function freezeLearningCycle(
 history:Draw[],selected:Array<{candidate:IntuitionCandidate;priorityScore:number;priorityReasons:string[]}>,
 targetDrawId:number,generatedAt:string,selectedCount=selected.length
):FrozenLearningCycle {
 validateContiguous(history);
 if(targetDrawId!==history.at(-1)!.drawId+1)throw new Error("cycle target must be the next consecutive contest");
 if(!Number.isFinite(Date.parse(generatedAt)))throw new Error("valid cycle timestamp required");
 const historySha256=fingerprintCycleHistory(history);
 const signals:FrozenCycleSignal[]=[];
 const previous=history.at(-1)!;
 const previousPoolSize=new Set(previous.digits).size;
 let previousDuplicatePairs=0;
 for(let p=0;p<5;p++)for(let q=p+1;q<5;q++)if(previous.digits[p]===previous.digits[q])previousDuplicatePairs++;
 const previousRepeatedPositions=5-previousPoolSize;
 const context:PreDrawContext={
  previousPoolSize,previousDuplicatePairs,previousRepeatedPositions,
  poolRegime:previousPoolSize<=3?"compact":previousPoolSize>=4?"broad":"mixed",
  duplicateRegime:previousDuplicatePairs/10>=.20?"many-duplicates":"few-duplicates"
 };
 for(const item of selected){
  const forecast=freezeProspectiveForecast(history,item.candidate,targetDrawId,generatedAt);
  if(forecast)signals.push({candidateId:item.candidate.id,priorityScore:item.priorityScore,priorityReasons:[...item.priorityReasons],
   position:item.candidate.config.position??null,context:{...context},forecast});
 }
 const cycleId=sha([targetDrawId,historySha256,...signals.map(s=>s.candidateId).sort()].join("|"));
 return {schemaVersion:1,cycleId,modelVersion:"tris-cycle-learning-v1",targetDrawId,generatedAt,
  historyThroughDrawId:history.at(-1)!.drawId,historySha256,selectedCount,frozenCount:signals.length,signals};
}
/** Resolve one signal without changing any frozen prediction or configuration. */
export function resolveLearningCycleSignal(
 cycle:FrozenLearningCycle,signal:FrozenCycleSignal,actualDraw:Draw,priorHistory:Draw[],resolvedAt:string
):ResolvedCycleSignal {
 if(signal.forecast.targetDrawId!==cycle.targetDrawId||signal.forecast.historySha256!==cycle.historySha256)throw new Error("signal does not belong to the frozen cycle");
 const resolved=resolveProspectiveForecast(signal.forecast,actualDraw,priorHistory,resolvedAt);
 return {...resolved,cycleId:cycle.cycleId,modelVersion:cycle.modelVersion,position:signal.position,context:{...signal.context}} as ResolvedCycleSignal;
}
/** Build non-overlapping chronological blocks. Partial final blocks need >=10 observations. */
export function assessCycleSignalLifecycle(rows:ResolvedCycleSignal[],blockSize=25):CycleSignalLifecycle[] {
 if(!Number.isInteger(blockSize)||blockSize<10)throw new Error("blockSize must be an integer >= 10");
 const grouped=new Map<string,ResolvedCycleSignal[]>();
 for(const row of rows){const group=grouped.get(row.candidateId)??[];group.push(row);grouped.set(row.candidateId,group);}
 const out:CycleSignalLifecycle[]=[];
 for(const [candidateId,items] of grouped){
  items.sort((a,b)=>a.targetDrawId-b.targetDrawId);
  for(let i=1;i<items.length;i++)if(items[i].targetDrawId===items[i-1].targetDrawId)throw new Error("duplicate resolved cycle for "+candidateId+" at "+items[i].targetDrawId);
  const blocks:CycleBlock[]=[];
  for(let i=0;i<items.length;i+=blockSize){
   const chunk=items.slice(i,i+blockSize);if(chunk.length<10)continue;
   const hits=chunk.filter(x=>x.candidateHit).length,baselineHits=chunk.filter(x=>x.baselineHit).length;
   const hitRate=hits/chunk.length,baselineRate=baselineHits/chunk.length,difference=hitRate-baselineRate;
   blocks.push({startDrawId:chunk[0].targetDrawId,endDrawId:chunk.at(-1)!.targetDrawId,observations:chunk.length,hits,baselineHits,hitRate,baselineRate,difference,
    state:difference>=.02?"positive":difference<=-.02?"negative":"neutral"});
  }
  const totalHits=items.filter(x=>x.candidateHit).length,baselineHits=items.filter(x=>x.baselineHit).length;
  const hitRate=totalHits/items.length,baselineRate=baselineHits/items.length,difference=hitRate-baselineRate;
  const positiveBlocks=blocks.filter(b=>b.state==="positive").length,negativeBlocks=blocks.filter(b=>b.state==="negative").length;
  const latest=blocks.at(-1)??null,prior=blocks.at(-2)??null;
  let status:CycleSignalStatus="unobserved",interpretation="No complete monitoring block yet.";
  if(latest){
   const trailingNegative=blocks.slice(-3).length===3&&blocks.slice(-3).every(b=>b.state==="negative");
   const hadPositive=positiveBlocks>0;
   if(trailingNegative){status="retired";interpretation="Tres bloques consecutivos quedaron al menos 2 puntos porcentuales por debajo de la referencia; señal retirada de la vigilancia activa, conservando su historial.";}
   else if(latest.state==="negative"&&hadPositive){status="weakening";interpretation="El bloque más reciente perdió al menos 2 puntos porcentuales frente a la referencia después de evidencia favorable.";}
   else if(latest.state==="positive"&&prior?.state==="positive"){
    status=latest.difference>prior.difference+.005?"strengthening":"persistent";
    interpretation=status==="strengthening"?"Dos bloques favorables consecutivos y ventaja creciente.":"Dos o más bloques favorables consecutivos; persistencia descriptiva, no garantía.";
   } else if(latest.state==="positive"){status="emerging";interpretation="Un bloque favorable; todavía no hay persistencia demostrada.";}
   else if(hadPositive){status="unstable";interpretation="La ventaja histórica no se mantiene en el último bloque.";}
   else {status="unobserved";interpretation="No hay bloques favorables repetidos.";}
  } else if(items.length>0){status="dormant";interpretation="Hay resultados, pero no se alcanza el mínimo de 10 observaciones para evaluar un bloque.";}
  out.push({candidateId,status,resolvedCycles:items.length,totalHits,baselineHits,hitRate,baselineRate,difference,positiveBlocks,negativeBlocks,latestBlock:latest,blocks,interpretation});
 }
 return out.sort((a,b)=>a.candidateId.localeCompare(b.candidateId));
}
