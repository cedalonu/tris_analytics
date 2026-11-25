/**
 * Adaptive memory for interaction candidates.
 * Candidate rules are selected only in discovery; later chronological blocks
 * monitor whether their conditional hit-rate advantage persists, grows or fades.
 */
import type {Draw} from "../research-core";
import {analyzeSignalInteractions,buildInteractionObservations,type InteractionFeatureId,type InteractionObservation} from "./interaction-engine";

export type AdaptiveBlockSignal="insufficient"|"positive"|"negative"|"neutral";
export type AdaptiveMemoryStatus="unobserved"|"emerging"|"strengthening"|"persistent"|"weakening"|"dormant"|"unstable";
export interface AdaptiveBlock {
 phase:"validation"|"holdout";
 startDrawId:number;
 endDrawId:number;
 observations:number;
 active:number;
 hits:number;
 rate:number;
 baselineRate:number;
 bestComponentRate:number;
 deltaVsBaseline:number;
 deltaVsBestComponent:number;
 signal:AdaptiveBlockSignal;
}
export interface AdaptiveSignalMemory {
 position:number;
 digit:number;
 features:InteractionFeatureId[];
 blocks:AdaptiveBlock[];
 status:AdaptiveMemoryStatus;
 positiveBlocks:number;
 negativeBlocks:number;
 longestPositiveRun:number;
 latestDelta:number|null;
 interpretation:string;
}
export interface AdaptiveMemoryReport {
 drawCount:number;
 firstDrawId:number;
 lastDrawId:number;
 discoveryDraws:number;
 validationDraws:number;
 holdoutDraws:number;
 blockSize:number;
 monitoredCandidates:number;
 signals:AdaptiveSignalMemory[];
 warnings:string[];
}
const WARMUP=5, BLOCK_SIZE=25, MIN_BLOCK_ROWS=10, MIN_ACTIVE=5, EFFECT_FLOOR=.02;
function blockScore(rows:InteractionObservation[],features:InteractionFeatureId[],phase:"validation"|"holdout"):AdaptiveBlock|null {
 if(rows.length<MIN_BLOCK_ROWS)return null;
 const activeRows=rows.filter(r=>features.every(f=>r.features[f]));
 const hits=activeRows.filter(r=>r.hit).length;
 const totalHits=rows.filter(r=>r.hit).length;
 const baselineRate=totalHits/rows.length,rate=activeRows.length?hits/activeRows.length:0;
 let bestComponentRate=0;
 for(const feature of features){
  const component=rows.filter(r=>r.features[feature]);
  const floor=Math.max(3,Math.ceil(rows.length*.05));
  if(component.length>=floor)bestComponentRate=Math.max(bestComponentRate,component.filter(r=>r.hit).length/component.length);
 }
 const deltaVsBaseline=rate-baselineRate,deltaVsBestComponent=rate-bestComponentRate;
 const signal:AdaptiveBlockSignal=activeRows.length<MIN_ACTIVE?"insufficient":
  deltaVsBaseline>=EFFECT_FLOOR&&deltaVsBestComponent>=0?"positive":
  deltaVsBaseline<=-EFFECT_FLOOR?"negative":"neutral";
 return {phase,startDrawId:rows[0].drawId,endDrawId:rows[rows.length-1].drawId,
  observations:rows.length,active:activeRows.length,hits,rate,baselineRate,bestComponentRate,
  deltaVsBaseline,deltaVsBestComponent,signal};
}
function makeBlocks(rows:InteractionObservation[],phase:"validation"|"holdout"):AdaptiveBlock[] {
 const out:AdaptiveBlock[]=[];
 for(let i=0;i<rows.length;i+=BLOCK_SIZE){
  const block=blockScore(rows.slice(i,i+BLOCK_SIZE),[],phase);
  // The candidate's component list is applied by the caller; this branch is intentionally unused.
  if(block)out.push(block);
 }
 return out;
}
function evaluateBlocks(rows:InteractionObservation[],features:InteractionFeatureId[],phase:"validation"|"holdout"):AdaptiveBlock[] {
 const out:AdaptiveBlock[]=[];
 for(let i=0;i<rows.length;i+=BLOCK_SIZE){
  const block=blockScore(rows.slice(i,i+BLOCK_SIZE),features,phase);
  if(block)out.push(block);
 }
 return out;
}
function deriveStatus(blocks:AdaptiveBlock[]):{status:AdaptiveMemoryStatus;positive:number;negative:number;longest:number;interpretation:string}{
 let positive=0,negative=0,run=0,longest=0,everPositive=false,latestPositiveRun=0;
 for(const b of blocks){
  if(b.signal==="positive"){positive++;run++;everPositive=true;}
  else {run=0;if(b.signal==="negative")negative++;}
  longest=Math.max(longest,run);latestPositiveRun=run;
 }
 const last=blocks[blocks.length-1];
 if(!last)return {status:"unobserved",positive,negative,longest,interpretation:"No monitoring block reached the minimum size."};
 if(last.signal==="insufficient"&&everPositive)return {status:"dormant",positive,negative,longest,interpretation:"The rule no longer activates often enough to assess reliably."};
 if(last.signal==="negative"&&everPositive)return {status:"weakening",positive,negative,longest,interpretation:"A previously favorable rule now shows a negative block difference."};
 if(latestPositiveRun>=2){
  const prior=blocks[blocks.length-2];
  if(prior&&last.deltaVsBaseline>prior.deltaVsBaseline+0.005)
   return {status:"strengthening",positive,negative,longest,interpretation:"Two consecutive favorable blocks; the latest advantage increased."};
  return {status:"persistent",positive,negative,longest,interpretation:"At least two consecutive favorable blocks; continued monitoring is required."};
 }
 if(last.signal==="positive")return {status:"emerging",positive,negative,longest,interpretation:"One favorable block observed; not enough to call it persistent."};
 if(everPositive)return {status:"unstable",positive,negative,longest,interpretation:"Earlier favorable evidence was not maintained in the latest block."};
 return {status:"unobserved",positive,negative,longest,interpretation:"No repeated favorable block has appeared."};
}
export function analyzeAdaptiveSignalMemory(draws:Draw[]):AdaptiveMemoryReport {
 const interactions=analyzeSignalInteractions(draws);
 const n=draws.length-WARMUP,discoveryEnd=Math.floor(n*.6),validationEnd=Math.floor(n*.8);
 const streams=new Map<string,InteractionObservation[]>();
 for(let p=0;p<5;p++)for(let d=0;d<10;d++)streams.set(p+":"+d,buildInteractionObservations(draws,p as 0|1|2|3|4,d as 0|1|2|3|4|5|6|7|8|9));
 const signals:AdaptiveSignalMemory[]=interactions.selected.map(candidate=>{
  const rows=streams.get(candidate.position+":"+candidate.digit)||[];
  const validation=evaluateBlocks(rows.slice(discoveryEnd,validationEnd),candidate.features,"validation");
  const holdout=evaluateBlocks(rows.slice(validationEnd),candidate.features,"holdout");
  const blocks=[...validation,...holdout],state=deriveStatus(blocks),last=blocks[blocks.length-1];
  return {position:candidate.position,digit:candidate.digit,features:candidate.features,blocks,
   status:state.status,positiveBlocks:state.positive,negativeBlocks:state.negative,longestPositiveRun:state.longest,
   latestDelta:last?last.deltaVsBaseline:null,interpretation:state.interpretation};
 });
 signals.sort((a,b)=>({strengthening:0,persistent:1,emerging:2,weakening:3,unstable:4,dormant:5,unobserved:6,unobserved2:7} as Record<string,number>)[a.status]-
  ({strengthening:0,persistent:1,emerging:2,weakening:3,unstable:4,dormant:5,unobserved:6} as Record<string,number>)[b.status]||
  (b.latestDelta??-1)-(a.latestDelta??-1));
 return {drawCount:draws.length,firstDrawId:draws[0].drawId,lastDrawId:draws[draws.length-1].drawId,
  discoveryDraws:discoveryEnd,validationDraws:validationEnd-discoveryEnd,holdoutDraws:n-validationEnd,
  blockSize:BLOCK_SIZE,monitoredCandidates:signals.length,signals,
  warnings:[
   "Rules are selected only from the discovery segment; monitoring uses later validation and holdout contests.",
   "Each feature is computed from contests before its target; no target-result leakage is used.",
   "Blocks are chronological, non-overlapping, and split at the validation/holdout boundary.",
   "A favorable block requires at least 5 active observations, a +2 percentage-point advantage over the block baseline, and no worse rate than the best individual component.",
   "Strengthening or persistence requires at least two consecutive favorable blocks; this is a descriptive state machine, not a significance test.",
   "A dormant label means insufficient activation in the latest block, not proof that a signal has vanished permanently.",
   "The selected rules were mined from discovery data, so later holdout blocks are the only untouched historical check. Future prospective replication is still required.",
   "No candidate weights, evidence-ledger status, or forecasts are changed by this report."
 ]};
}
