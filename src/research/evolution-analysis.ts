/** Evolution and lagged-draw descriptors for TRIS. Descriptive/experimental; not a prediction guarantee. */
import type { Draw, Digit, Pos } from "../research-core";
const D:Digit[]=[0,1,2,3,4,5,6,7,8,9];
export interface PositionLagReport { position:Pos; lag:number; observations:number; sameDigitCount:number; sameDigitRate:number; transitionCounts:number[][]; transitionRates:number[][]; }
export interface CrossPositionMovement { lag:number; fromPosition:Pos; toPosition:Pos; observations:number; digitMatches:number; matchRate:number; }
export interface DrawEvolutionReport { targetDrawId:number; availableLags:number[]; positionLags:PositionLagReport[]; crossPositionMovements:CrossPositionMovement[]; wholeDrawOverlap:{lag:number;sharedDigitCount:number;sharedDigitRate:number}[]; notes:string[]; }
/** Input must be ordered by draw ID. For target at index i, compare with lagged prior outcomes only. */
export function analyzeDrawEvolution(draws:Draw[],targetIndex:number,lags:number[]=[1,2,3]):DrawEvolutionReport {
 const target=draws[targetIndex]; if(!target)throw new Error("targetIndex out of range");
 const clean=[...new Set(lags.filter(l=>Number.isInteger(l)&&l>0))].sort((a,b)=>a-b);
 const positionLags:PositionLagReport[]=[];
 const movements:CrossPositionMovement[]=[];
 const overlap:{lag:number;sharedDigitCount:number;sharedDigitRate:number}[]=[];
 for(const lag of clean){const prior=draws[targetIndex-lag];if(!prior)continue;
  for(let p=0;p<5;p++){const counts=Array.from({length:10},()=>Array(10).fill(0));counts[prior.digits[p]][target.digits[p]]++;
   const same=prior.digits[p]===target.digits[p]?1:0;
   positionLags.push({position:p as Pos,lag,observations:1,sameDigitCount:same,sameDigitRate:same,transitionCounts:counts,transitionRates:counts.map(row=>row.map(v=>v)),});
  }
  for(let from=0;from<5;from++)for(let to=0;to<5;to++){const match=prior.digits[from]===target.digits[to]?1:0;movements.push({lag,fromPosition:from as Pos,toPosition:to as Pos,observations:1,digitMatches:match,matchRate:match});}
  const shared=prior.digits.filter(d=>target.digits.includes(d)).length;
  overlap.push({lag,sharedDigitCount:shared,sharedDigitRate:shared/5});
 }
 return {targetDrawId:target.drawId,availableLags:clean.filter(l=>!!draws[targetIndex-l]),positionLags,crossPositionMovements:movements,wholeDrawOverlap:overlap,notes:["Single target comparisons are descriptive, not estimated transition probabilities.","Use aggregated chronological evaluation across many targets to estimate rates; prevent leakage by using prior draws only.","Repeated digits affect overlap counts; report both multiset and distinct-digit overlap in future extension."]};
}
/** Aggregates lag-conditioned positional transition matrices over a chronological target interval. */
export function aggregatePositionTransitions(draws:Draw[],startIndex:number,endIndex:number,lag=1):{lag:number;position:Pos;observations:number;counts:number[][];rates:number[][];fromRates:number[][]}[] {
 const out=[];const start=Math.max(startIndex,lag);
 for(let p=0;p<5;p++){const counts=Array.from({length:10},()=>Array(10).fill(0));let n=0;
  for(let i=start;i<Math.min(endIndex,draws.length);i++){counts[draws[i-lag].digits[p]][draws[i].digits[p]]++;n++;}
  const rates=counts.map(row=>row.map(v=>n?v/n:0));const fromRates=counts.map(row=>{const total=row.reduce((s,v)=>s+v,0);return row.map(v=>total?v/total:0);});
  out.push({lag,position:p as Pos,observations:n,counts,rates,fromRates});
 }
 return out;
}
