/**
 * Conservative two/three-signal interaction screen for TRIS.
 * Every feature is computed from contests strictly before its target contest.
 * Discovery ranks combinations; later chronological slices validate them.
 */
import type {Draw,Digit,Pos} from "../research-core";

export type InteractionFeatureId =
  | "digit-absent-3" | "digit-absent-5" | "digit-present-3"
  | "previous-same-position" | "previous-neighbor-position"
  | "previous-pool-small" | "previous-pool-large" | "previous-has-duplicates";
export interface InteractionObservation {
  drawId:number;
  position:Pos;
  digit:Digit;
  hit:boolean;
  features:Record<InteractionFeatureId,boolean>;
}
export interface PhaseScore {
  observations:number;
  active:number;
  hits:number;
  rate:number;
  baselineRate:number;
  liftVsBaseline:number;
  bestSingleRate:number;
  incrementalVsBestSingle:number;
}
export interface InteractionCandidate {
  position:Pos;
  digit:Digit;
  features:InteractionFeatureId[];
  discovery:PhaseScore;
  validation:PhaseScore;
  holdout:PhaseScore;
}
export interface InteractionReport {
  drawCount:number;
  firstDrawId:number;
  lastDrawId:number;
  warmupDraws:number;
  split:{discovery:number;validation:number;holdout:number};
  featureCount:number;
  combinationsTested:number;
  selected:InteractionCandidate[];
  warnings:string[];
}
const FEATURE_IDS:InteractionFeatureId[]=[
 "digit-absent-3","digit-absent-5","digit-present-3","previous-same-position",
 "previous-neighbor-position","previous-pool-small","previous-pool-large","previous-has-duplicates"
];
const POSITIONS:Pos[]=[0,1,2,3,4],DIGITS:Digit[]=[0,1,2,3,4,5,6,7,8,9];
const WARMUP=5,MIN_ACTIVE=25,TOP_PER_STREAM=3;
function validate(draws:Draw[]):void {
 if(draws.length<WARMUP+30)throw new Error("interaction analysis requires at least 35 contiguous draws");
 for(let i=0;i<draws.length;i++){
  const d=draws[i];
  if(!Number.isInteger(d.drawId)||d.drawId<=0||!Array.isArray(d.digits)||d.digits.length!==5||
   d.digits.some(x=>!Number.isInteger(x)||x<0||x>9))throw new Error("invalid draw at index "+i);
  if(i&&d.drawId!==draws[i-1].drawId+1)throw new Error("non-contiguous draw IDs");
 }
}
function makeObservation(draws:Draw[],i:number,position:Pos,digit:Digit):InteractionObservation {
 const last=draws[i-1],recent3=draws.slice(Math.max(0,i-3),i),recent5=draws.slice(Math.max(0,i-5),i);
 const previousPoolSize=new Set(last.digits).size;
 const neighborPositions=[position>0?position-1:-1,position<4?position+1:-1].filter(p=>p>=0);
 const features:Record<InteractionFeatureId,boolean>={
  "digit-absent-3":recent3.every(d=>d.digits[position]!==digit),
  "digit-absent-5":recent5.every(d=>d.digits[position]!==digit),
  "digit-present-3":recent3.some(d=>d.digits[position]===digit),
  "previous-same-position":last.digits[position]===digit,
  "previous-neighbor-position":neighborPositions.some(p=>last.digits[p]===digit),
  "previous-pool-small":previousPoolSize<=2,
  "previous-pool-large":previousPoolSize>=4,
  "previous-has-duplicates":new Set(last.digits).size<5
 };
 return {drawId:draws[i].drawId,position,digit,hit:draws[i].digits[position]===digit,features};
}
function score(rows:InteractionObservation[],start:number,end:number,features:InteractionFeatureId[]):PhaseScore {
 let active=0,hits=0,totalHits=0;
 for(let i=start;i<end;i++){
  const row=rows[i];if(row.hit)totalHits++;
  if(features.every(f=>row.features[f])){active++;if(row.hit)hits++;}
 }
 const observations=end-start,baselineRate=observations?totalHits/observations:0,rate=active?hits/active:0;
 let bestSingleRate=0;
 const singleSupportFloor=Math.max(5,Math.ceil(observations*.05));
 for(const f of features){
  let n=0,h=0;for(let i=start;i<end;i++)if(rows[i].features[f]){n++;if(rows[i].hit)h++;}
  if(n>=singleSupportFloor)bestSingleRate=Math.max(bestSingleRate,h/n);
 }
 return {observations,active,hits,rate,baselineRate,liftVsBaseline:baselineRate?rate/baselineRate:0,
  bestSingleRate,incrementalVsBestSingle:rate-bestSingleRate};
}
function combinations():InteractionFeatureId[][] {
 const out:InteractionFeatureId[][]=[];
 for(let a=0;a<FEATURE_IDS.length;a++)for(let b=a+1;b<FEATURE_IDS.length;b++)out.push([FEATURE_IDS[a],FEATURE_IDS[b]]);
 for(let a=0;a<FEATURE_IDS.length;a++)for(let b=a+1;b<FEATURE_IDS.length;b++)for(let c=b+1;c<FEATURE_IDS.length;c++)out.push([FEATURE_IDS[a],FEATURE_IDS[b],FEATURE_IDS[c]]);
 return out;
}
function scanStream(rows:InteractionObservation[],position:Pos,digit:Digit):InteractionCandidate[] {
 const n=rows.length,d1=Math.floor(n*.6),d2=Math.floor(n*.8),found:InteractionCandidate[]=[];
 for(const features of combinations()){
  const discovery=score(rows,0,d1,features);
  if(discovery.active<MIN_ACTIVE)continue;
  const validation=score(rows,d1,d2,features),holdout=score(rows,d2,n,features);
  found.push({position,digit,features,discovery,validation,holdout});
 }
 found.sort((a,b)=>b.discovery.incrementalVsBestSingle-a.discovery.incrementalVsBestSingle||
  b.discovery.liftVsBaseline-a.discovery.liftVsBaseline||b.discovery.active-a.discovery.active);
 return found.slice(0,TOP_PER_STREAM);
}
/** Rebuild one position/digit stream with past-only feature values. */
export function buildInteractionObservations(draws:Draw[],position:Pos,digit:Digit):InteractionObservation[] {
 validate(draws);
 const rows:InteractionObservation[]=[];
 for(let i=WARMUP;i<draws.length;i++)rows.push(makeObservation(draws,i,position,digit));
 return rows;
}
export function analyzeSignalInteractions(draws:Draw[]):InteractionReport {
 validate(draws);
 const selected:InteractionCandidate[]=[];let combinationsTested=0;
 for(const position of POSITIONS)for(const digit of DIGITS){
  const rows:InteractionObservation[]=[];
  for(let i=WARMUP;i<draws.length;i++)rows.push(makeObservation(draws,i,position,digit));
  combinationsTested+=combinations().length;
  selected.push(...scanStream(rows,position,digit));
 }
 selected.sort((a,b)=>b.discovery.incrementalVsBestSingle-a.discovery.incrementalVsBestSingle||
  b.validation.incrementalVsBestSingle-a.validation.incrementalVsBestSingle||
  b.holdout.incrementalVsBestSingle-a.holdout.incrementalVsBestSingle);
 return {
  drawCount:draws.length,firstDrawId:draws[0].drawId,lastDrawId:draws[draws.length-1].drawId,
  warmupDraws:WARMUP,split:{discovery:60,validation:20,holdout:20},featureCount:FEATURE_IDS.length,
  combinationsTested,selected:selected.slice(0,60),
  warnings:[
   "Each feature for target contest t uses only contests before t; target digit is used only as the outcome.",
   "Candidate combinations are ranked on the first 60% only; validation and holdout are later chronological slices.",
   "The 60/20/20 split is repeated per position-digit stream; no random shuffling is used.",
   "Only pairs and triples from a fixed eight-feature library are screened; this limits but does not eliminate multiple-testing risk.",
   "Minimum active support is 25 in discovery. Sparse validation/holdout rates are unstable and must be read with their active counts.",
   "The best-single comparison is descriptive; a positive incremental rate is not statistical proof or evidence of causal interaction.",
   "Do not promote weights or call a signal active from this report. Freeze promising rules and test them prospectively on later CSV updates."
 ]
 };
}
