/** Evolution and lagged-draw descriptors for TRIS. Descriptive/experimental; not a prediction guarantee. */
import type { Draw, Digit, Pos } from "../research-core";
export interface PositionLagReport { position:Pos; lag:number; previousDigit:Digit; targetDigit:Digit; sameDigit:boolean; }
export interface CrossPositionMovement { lag:number; fromPosition:Pos; toPosition:Pos; previousDigit:Digit; targetDigit:Digit; match:boolean; }
export interface DrawEvolutionReport { targetDrawId:number; availableLags:number[]; positionLags:PositionLagReport[]; crossPositionMovements:CrossPositionMovement[]; wholeDrawOverlap:{lag:number;sharedDigitCount:number;sharedDistinctDigits:number}[]; notes:string[]; }
/** Input must be ordered by draw ID. For target at index i, compare with lagged prior outcomes only. */
export function analyzeDrawEvolution(draws:Draw[],targetIndex:number,lags:number[]=[1,2,3]):DrawEvolutionReport {
 const target=draws[targetIndex]; if(!target)throw new Error("targetIndex out of range");
 const clean=[...new Set(lags.filter(l=>Number.isInteger(l)&&l>0))].sort((a,b)=>a-b);
 const positionLags:PositionLagReport[]=[];const movements:CrossPositionMovement[]=[];const overlap:{lag:number;sharedDigitCount:number;sharedDistinctDigits:number}[]=[];
 for(const lag of clean){const prior=draws[targetIndex-lag];if(!prior)continue;
  for(let p=0;p<5;p++)positionLags.push({position:p as Pos,lag,previousDigit:prior.digits[p],targetDigit:target.digits[p],sameDigit:prior.digits[p]===target.digits[p]});
  for(let from=0;from<5;from++)for(let to=0;to<5;to++)movements.push({lag,fromPosition:from as Pos,toPosition:to as Pos,previousDigit:prior.digits[from],targetDigit:target.digits[to],match:prior.digits[from]===target.digits[to]});
  const shared=prior.digits.filter(d=>target.digits.includes(d)).length;const distinct=new Set(prior.digits.filter(d=>target.digits.includes(d))).size;
  overlap.push({lag,sharedDigitCount:shared,sharedDistinctDigits:distinct});
 }
 return {targetDrawId:target.drawId,availableLags:clean.filter(l=>!!draws[targetIndex-l]),positionLags,crossPositionMovements:movements,wholeDrawOverlap:overlap,notes:["Single target comparisons are descriptive, not estimated transition probabilities.","Use aggregated chronological evaluation across many targets to estimate rates; prevent leakage by using prior draws only."]};
}
/** Aggregates positional transition counts and row-conditional rates across chronological targets. */
export function aggregatePositionTransitions(draws:Draw[],startIndex:number,endIndex:number,lag=1):{lag:number;position:Pos;observations:number;counts:number[][];overallRates:number[][];conditionalRatesByPreviousDigit:number[][]}[] {
 const out=[];const start=Math.max(startIndex,lag);
 for(let p=0;p<5;p++){const counts=Array.from({length:10},()=>Array(10).fill(0));let n=0;
  for(let i=start;i<Math.min(endIndex,draws.length);i++){counts[draws[i-lag].digits[p]][draws[i].digits[p]]++;n++;}
  const overallRates=counts.map(row=>row.map(v=>n?v/n:0));const conditionalRatesByPreviousDigit=counts.map(row=>{const total=row.reduce((s,v)=>s+v,0);return row.map(v=>total?v/total:0);});
  out.push({lag,position:p as Pos,observations:n,counts,overallRates,conditionalRatesByPreviousDigit});
 }
 return out;
}
