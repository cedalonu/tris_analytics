/**
 * Context-conditioned temporal memory for TRIS.
 * Context is measured on the source contest at t-lag; target is measured at t.
 * Descriptive only: no strategy changes, forecasts, or evidence promotion.
 */
import type {Draw,Digit,Pos} from "../research-core";
import type {MemoryLag} from "./temporal-memory";

export type ContextKind="source-pool-size"|"source-duplicate-count";
export interface ContextBucket {
  contextValue:string;
  observations:number;
  targetEntropyBits:number;
  targetDistribution:number[];
  totalVariationVsMarginal:number;
  strongestTargetDigits:{digit:Digit;count:number;conditionalRate:number;marginalRate:number;lift:number}[];
}
export interface ContextualMemoryComparison {
  context:ContextKind;
  lag:MemoryLag;
  sourcePosition:Pos;
  targetPosition:Pos;
  observations:number;
  contextMutualInformationBits:number;
  buckets:ContextBucket[];
  eligibleBuckets:number;
}
export interface ContextualMemoryScope {
  scope:"all-history"|"last-200"|"last-1000";
  draws:number;
  comparisons:ContextualMemoryComparison[];
}
export interface ContextualMemoryReport {
  drawCount:number;
  firstDrawId:number;
  lastDrawId:number;
  scopes:ContextualMemoryScope[];
  warnings:string[];
}
const POSITIONS:Pos[]=[0,1,2,3,4],LAGS:MemoryLag[]=[1,2,3,4,5];
const MIN_BUCKET_N=20,MIN_DIGIT_N=3;
const log2=(x:number)=>Math.log(x)/Math.LN2;
const entropy=(counts:number[])=>{
 const n=counts.reduce((a,b)=>a+b,0);
 return n?counts.reduce((s,c)=>c?s-(c/n)*log2(c/n):s,0):0;
};
function poolSize(d:Draw):number{return new Set(d.digits).size;}
function duplicateBucket(d:Draw):string{
 const repeats=5-poolSize(d);
 return repeats===0?"0":repeats===1?"1":"2+";
}
function contextValue(d:Draw,kind:ContextKind):string{
 return kind==="source-pool-size"?String(poolSize(d)):duplicateBucket(d);
}
function validate(draws:Draw[]):void{
 if(draws.length<2)throw new Error("contextual memory requires at least two draws");
 for(let i=0;i<draws.length;i++){
  const d=draws[i];
  if(!Number.isInteger(d.drawId)||d.drawId<=0||!Array.isArray(d.digits)||d.digits.length!==5||d.digits.some(x=>!Number.isInteger(x)||x<0||x>9))throw new Error("invalid draw at index "+i);
  if(i&&d.drawId!==draws[i-1].drawId+1)throw new Error("non-contiguous draw IDs");
 }
}
function compare(rows:Draw[],kind:ContextKind,lag:MemoryLag,sourcePosition:Pos,targetPosition:Pos):ContextualMemoryComparison{
 const groups=new Map<string,number[]>(),marginal=Array(10).fill(0);
 let n=0;
 for(let i=lag;i<rows.length;i++){
  const ctx=contextValue(rows[i-lag],kind),target=rows[i].digits[targetPosition];
  if(!groups.has(ctx))groups.set(ctx,Array(10).fill(0));
  groups.get(ctx)![target]++;marginal[target]++;n++;
 }
 const buckets:ContextBucket[]=[];
 let conditionalEntropy=0;
 for(const [ctx,counts] of groups){
  const count=counts.reduce((a,b)=>a+b,0),h=entropy(counts);
  conditionalEntropy+=(count/n)*h;
  if(count<MIN_BUCKET_N)continue;
  const targetDistribution=counts.map(x=>x/count);
  const tv=.5*targetDistribution.reduce((s,p,i)=>s+Math.abs(p-marginal[i]/n),0);
  const strongestTargetDigits=counts.map((c,digit)=>({digit:digit as Digit,count:c,conditionalRate:c/count,marginalRate:marginal[digit]/n,lift:marginal[digit]?c/count/(marginal[digit]/n):0}))
   .filter(x=>x.count>=MIN_DIGIT_N).sort((a,b)=>b.count-a.count||b.lift-a.lift).slice(0,5);
  buckets.push({contextValue:ctx,observations:count,targetEntropyBits:h,targetDistribution,totalVariationVsMarginal:tv,strongestTargetDigits});
 }
 buckets.sort((a,b)=>a.contextValue.localeCompare(b.contextValue,undefined,{numeric:true}));
 return {context:kind,lag,sourcePosition,targetPosition,observations:n,
  contextMutualInformationBits:Math.max(0,entropy(marginal)-conditionalEntropy),buckets,eligibleBuckets:buckets.length};
}
function scope(rows:Draw[],name:ContextualMemoryScope["scope"]):ContextualMemoryScope{
 const comparisons:ContextualMemoryComparison[]=[];
 for(const context of ["source-pool-size","source-duplicate-count"] as const)
  for(const lag of LAGS)for(const sourcePosition of POSITIONS)for(const targetPosition of POSITIONS)
   comparisons.push(compare(rows,context,lag,sourcePosition,targetPosition));
 return {scope:name,draws:rows.length,comparisons};
}
export function analyzeContextualMemory(draws:Draw[]):ContextualMemoryReport{
 validate(draws);
 const scopes=[scope(draws,"all-history")];
 if(draws.length>=200)scopes.push(scope(draws.slice(-200),"last-200"));
 if(draws.length>=1000)scopes.push(scope(draws.slice(-1000),"last-1000"));
 return {drawCount:draws.length,firstDrawId:draws[0].drawId,lastDrawId:draws[draws.length-1].drawId,scopes,warnings:[
  "Context is computed from the source contest at the exact lag; the target result is never used to define its own context.",
  "Contextual mutual information is descriptive and may be positively biased in finite samples.",
  "Buckets with fewer than 20 observations are omitted from bucket detail; this is a reporting floor, not evidence of no relationship.",
  "The analysis screens many context, lag, and position combinations. Apparent high lifts can arise by chance and multiple comparisons.",
  "Pool size and duplicate-count context are overlapping descriptions, not independent confirmations.",
  "No forecast or pool recommendation is produced. Any candidate signal must be predeclared, walk-forward tested, and prospectively replicated."
 ]};
}
