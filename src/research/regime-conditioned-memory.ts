/**
 * Long-term regime-conditioned memory for TRIS interaction rules.
 * Regimes are classified from the 20 contests strictly before each target.
 * Candidate rules are frozen by the discovery-only interaction screen.
 */
import type {Draw} from "../research-core";
import {analyzeSignalInteractions,buildInteractionObservations,type InteractionFeatureId,type InteractionObservation} from "./interaction-engine";

export type PoolRegime="compact"|"mixed"|"broad";
export type DuplicateRegime="few-duplicates"|"many-duplicates";
export type RegimeKey=`${PoolRegime}|${DuplicateRegime}`;
export interface RegimeBlock {
 phase:"validation"|"holdout";
 regime:RegimeKey;
 startDrawId:number;
 endDrawId:number;
 observations:number;
 active:number;
 hits:number;
 rate:number;
 baselineRate:number;
 delta:number;
 state:"favorable"|"unfavorable"|"neutral"|"insufficient";
}
export interface RegimeSignalMemory {
 position:number;
 digit:number;
 features:InteractionFeatureId[];
 regime:RegimeKey;
 blocks:RegimeBlock[];
 favorableEpisodes:number;
 reappearances:number;
 longestFavorableRun:number;
 activeTotal:number;
 hitTotal:number;
 rate:number|null;
 baselineRate:number|null;
 interpretation:string;
}
export interface RegimeMemoryReport {
 drawCount:number;
 firstDrawId:number;
 lastDrawId:number;
 discoveryDraws:number;
 validationDraws:number;
 holdoutDraws:number;
 regimeLookback:number;
 blockSize:number;
 monitoredCandidates:number;
 memories:RegimeSignalMemory[];
 warnings:string[];
}
const WARMUP=5,LOOKBACK=20,BLOCK=25,MIN_ROWS=10,MIN_ACTIVE=5;
function classifyRegime(draws:Draw[],targetIndex:number):RegimeKey|null {
 if(targetIndex<LOOKBACK)return null;
 const prior=draws.slice(targetIndex-LOOKBACK,targetIndex);
 const meanDistinct=prior.reduce((s,d)=>s+new Set(d.digits).size,0)/prior.length;
 let duplicatePairs=0,totalPairs=0;
 for(const d of prior)for(let p=0;p<5;p++)for(let q=p+1;q<5;q++){totalPairs++;if(d.digits[p]===d.digits[q])duplicatePairs++;}
 const pool:PoolRegime=meanDistinct<=3?"compact":meanDistinct>=4?"broad":"mixed";
 const duplicates:DuplicateRegime=duplicatePairs/totalPairs>=.20?"many-duplicates":"few-duplicates";
 return (pool+"|"+duplicates) as RegimeKey;
}
function scoreBlock(rows:InteractionObservation[],features:InteractionFeatureId[],phase:"validation"|"holdout",regime:RegimeKey):RegimeBlock|null {
 if(rows.length<MIN_ROWS)return null;
 const active=rows.filter(r=>features.every(f=>r.features[f]));
 const hits=active.filter(r=>r.hit).length,totalHits=rows.filter(r=>r.hit).length;
 const baselineRate=totalHits/rows.length,rate=active.length?hits/active.length:0,delta=rate-baselineRate;
 const state=active.length<MIN_ACTIVE?"insufficient":delta>=.02?"favorable":delta<=-.02?"unfavorable":"neutral";
 return {phase,regime,startDrawId:rows[0].drawId,endDrawId:rows[rows.length-1].drawId,observations:rows.length,active:active.length,hits,rate,baselineRate,delta,state};
}
function makeBlocks(rows:InteractionObservation[],features:InteractionFeatureId[],phase:"validation"|"holdout",regimes:Map<number,RegimeKey>):RegimeBlock[] {
 const out:RegimeBlock[]=[];
 let current:RegimeKey|null=null,segment:InteractionObservation[]=[];
 const flush=()=>{if(current&&segment.length){for(let i=0;i<segment.length;i+=BLOCK){const b=scoreBlock(segment.slice(i,i+BLOCK),features,phase,current);if(b)out.push(b);}}};
 for(const row of rows){
  const regime=regimes.get(row.drawId)??null;
  if(regime!==current){flush();segment=[];current=regime;}
  if(regime)segment.push(row);
 }
 flush();
 return out;
}
function summarize(position:number,digit:number,features:InteractionFeatureId[],blocks:RegimeBlock[],regime:RegimeKey):RegimeSignalMemory {
 const relevant=blocks.filter(b=>b.regime===regime);
 let favorableEpisodes=0,reappearances=0,run=0,longest=0,wasFavorable=false,hadGap=false;
 for(const b of relevant){
  if(b.state==="favorable"){
   if(!wasFavorable){favorableEpisodes++;if(hadGap)reappearances++;}run++;wasFavorable=true;hadGap=false;
  } else {if(wasFavorable)hadGap=true;run=0;wasFavorable=false;}
  longest=Math.max(longest,run);
 }
 const activeTotal=relevant.reduce((s,b)=>s+b.active,0),hitTotal=relevant.reduce((s,b)=>s+b.hits,0);
 const rate=activeTotal?hitTotal/activeTotal:null;
 const baselineN=relevant.reduce((s,b)=>s+b.observations,0);
 const baselineHits=relevant.reduce((s,b)=>s+b.baselineRate*b.observations,0);
 const baselineRate=baselineN?baselineHits/baselineN:null;
 const interpretation=favorableEpisodes===0?"No favorable block was observed in this regime.":
  reappearances>0?"Favorable blocks reappeared after an interruption; historical recurrence is descriptive, not predictive.":
  favorableEpisodes===1?"One favorable episode was observed; persistence is not established.":"Multiple favorable blocks occurred in one continuous episode; independent recurrence is not established.";
 return {position,digit,features,regime,blocks:relevant,favorableEpisodes,reappearances,longestFavorableRun:longest,activeTotal,hitTotal,rate,baselineRate,interpretation};
}
export function analyzeRegimeConditionedMemory(draws:Draw[]):RegimeMemoryReport {
 const interactions=analyzeSignalInteractions(draws),n=draws.length-WARMUP;
 const discoveryEnd=Math.floor(n*.6),validationEnd=Math.floor(n*.8);
 const regimes=new Map<number,RegimeKey>();
 for(let i=LOOKBACK;i<draws.length;i++){const r=classifyRegime(draws,i);if(r)regimes.set(draws[i].drawId,r);}
 const memories:RegimeSignalMemory[]=[];
 const streams=new Map<string,InteractionObservation[]>();
 for(let p=0;p<5;p++)for(let d=0;d<10;d++)streams.set(p+":"+d,buildInteractionObservations(draws,p as 0|1|2|3|4,d as 0|1|2|3|4|5|6|7|8|9));
 for(const candidate of interactions.selected){
  const rows=streams.get(candidate.position+":"+candidate.digit)??[];
  const validation=rows.slice(discoveryEnd,validationEnd),holdout=rows.slice(validationEnd);
  const blocks=[...makeBlocks(validation,candidate.features,"validation",regimes),...makeBlocks(holdout,candidate.features,"holdout",regimes)];
  const keys=[...new Set(blocks.map(b=>b.regime))];
  for(const key of keys)memories.push(summarize(candidate.position,candidate.digit,candidate.features,blocks,key));
 }
 memories.sort((a,b)=>b.reappearances-a.reappearances||b.favorableEpisodes-a.favorableEpisodes||b.activeTotal-a.activeTotal);
 return {drawCount:draws.length,firstDrawId:draws[0].drawId,lastDrawId:draws[draws.length-1].drawId,
  discoveryDraws:discoveryEnd,validationDraws:validationEnd-discoveryEnd,holdoutDraws:n-validationEnd,
  regimeLookback:LOOKBACK,blockSize:BLOCK,monitoredCandidates:interactions.selected.length,memories,
  warnings:[
   "Regime labels use only the 20 contests strictly before each target: mean distinct digits (compact <=3, mixed between 3 and 4, broad >=4) and duplicate-pair rate (many >=20%).",
   "Interaction rules are selected only in the discovery slice; regime-conditioned monitoring uses validation and holdout only.",
   "Blocks are consecutive runs within one regime, split into non-overlapping groups of 25; final groups shorter than 10 are omitted.",
   "A favorable block requires at least 5 active observations and a conditional hit rate at least 2 percentage points above the position-digit baseline.",
   "Reappearance means a favorable block after an interruption within the same regime; it is descriptive recurrence, not independent statistical replication.",
   "Regimes and signals are correlated, support may be sparse, and repeated screening creates selection bias. No significance or predictive claim is made.",
   "No API, network access, polling, downloads, candidate-weight changes, or forecast changes are performed."
 ]};
}
