/**
 * Persistence, transient-shift and return-to-baseline screening.
 * Uses fixed initial reference and consecutive non-overlapping blocks.
 */
import type {Draw,Digit,Pos} from "../research-core";
export type TrendPattern="persistent"|"transient"|"reverted"|"no-sustained-shift"|"insufficient-history";
export interface BlockSignal {startDrawId:number;endDrawId:number;totalVariation:number;jensenShannonBits:number;watch:boolean;nearBaseline:boolean}
export interface FeatureTrend {feature:string;pattern:TrendPattern;blocks:BlockSignal[];watchRuns:number;longestWatchRun:number;firstWatchBlock:number|null;returnBlock:number|null}
export interface PersistenceReport {drawCount:number;firstDrawId:number;lastDrawId:number;referenceDraws:number;blockSize:number;features:FeatureTrend[];warnings:string[]}
const POSITIONS:Pos[]=[0,1,2,3,4],REFERENCE=50,BLOCK=10,TV=.20,JS=.08,RETURN_TV=.10;
function validate(draws:Draw[]):void{
 if(!draws.length)throw new Error("persistence analysis requires at least one draw");
 for(let i=0;i<draws.length;i++){
  const d=draws[i];
  if(!Number.isInteger(d.drawId)||d.drawId<=0||!Array.isArray(d.digits)||d.digits.length!==5||d.digits.some(x=>!Number.isInteger(x)||x<0||x>9))throw new Error("invalid draw at index "+i);
  if(i&&d.drawId!==draws[i-1].drawId+1)throw new Error("non-contiguous draw IDs");
 }
}
function counts(rows:Draw[],feature:string):number[]{
 if(feature.startsWith("position-")){const p=Number(feature.slice(9));const a=Array(10).fill(0);rows.forEach(d=>a[d.digits[p]]++);return a;}
 if(feature==="pool-size"){const a=Array(5).fill(0);rows.forEach(d=>a[new Set(d.digits).size-1]++);return a;}
 if(feature==="duplicate-pair"){let same=0,total=0;rows.forEach(d=>{for(let p=0;p<5;p++)for(let q=p+1;q<5;q++){total++;if(d.digits[p]===d.digits[q])same++;}});return [same,total-same];}
 const [,ps,qs]=feature.split("-"),p=Number(ps),q=Number(qs),a=Array(100).fill(0);rows.forEach(d=>a[d.digits[p]*10+d.digits[q]]++);return a;
}
function dist(a:number[],b:number[]):{tv:number;js:number}{
 const sa=a.reduce((x,y)=>x+y,0),sb=b.reduce((x,y)=>x+y,0),pa=a.map(x=>sa?x/sa:0),pb=b.map(x=>sb?x/sb:0);
 let tv=0,js=0;for(let i=0;i<pa.length;i++){tv+=Math.abs(pa[i]-pb[i])/2;const m=(pa[i]+pb[i])/2;if(pa[i])js+=.5*pa[i]*Math.log2(pa[i]/m);if(pb[i])js+=.5*pb[i]*Math.log2(pb[i]/m);}
 return {tv,js};
}
function trend(feature:string,reference:Draw[],blocks:Draw[][]):FeatureTrend{
 const baseline=counts(reference,feature),signals:BlockSignal[]=blocks.map(rows=>{
  const d=dist(baseline,counts(rows,feature));
  return {startDrawId:rows[0].drawId,endDrawId:rows.at(-1)!.drawId,totalVariation:d.tv,jensenShannonBits:d.js,watch:d.tv>=TV||d.js>=JS,nearBaseline:d.tv<=RETURN_TV};
 });
 let run=0,longest=0,watchRuns=0,first:number|null=null;
 signals.forEach((s,i)=>{if(s.watch){if(run===0)watchRuns++;run++;if(first===null)first=i;}else run=0;longest=Math.max(longest,run);});
 let pattern:TrendPattern="no-sustained-shift",returnBlock:number|null=null;
 if(blocks.length===0)pattern="insufficient-history";
 else if(longest>=2)pattern="persistent";
 else if(first!==null){
  const later=signals.slice(first+1);
  const ret=later.findIndex(s=>s.nearBaseline);
  if(ret>=1){pattern="reverted";returnBlock=first+1+ret;}
  else if(later.some(s=>!s.watch))pattern="transient";
  else pattern="transient";
 }
 return {feature,pattern,blocks:signals,watchRuns,longestWatchRun:longest,firstWatchBlock:first,returnBlock};
}
export function analyzePersistence(draws:Draw[]):PersistenceReport{
 validate(draws);
 const reference=draws.slice(0,REFERENCE),remaining=draws.slice(REFERENCE),blocks:Draw[][]=[];
 for(let i=0;i+BLOCK<=remaining.length;i+=BLOCK)blocks.push(remaining.slice(i,i+BLOCK));
 const features=[...POSITIONS.map(p=>"position-"+p),"pool-size","duplicate-pair"];
 for(let p=0;p<5;p++)for(let q=p+1;q<5;q++)features.push("joint-"+p+"-"+q);
 return {drawCount:draws.length,firstDrawId:draws[0].drawId,lastDrawId:draws.at(-1)!.drawId,referenceDraws:reference.length,blockSize:BLOCK,
  features:reference.length<REFERENCE?[]:features.map(f=>trend(f,reference,blocks)),
  warnings:[
   "The first 50 draws are a fixed descriptive reference; later blocks are non-overlapping groups of 10.",
   "Persistent means at least two consecutive blocks cross the effect-size screen; it is not statistical confirmation.",
   "Transient and reverted labels describe observed block sequences only; they do not forecast future outcomes.",
   "A return-to-baseline label requires total variation <= 0.10 after a prior watch; absence of a watch is not proof of reversal.",
   "Many correlated features are screened. Random variation, small samples, and multiple comparisons can produce apparent patterns.",
   "Do not adjust pool selection or candidate weights from this report alone. Validate any hypothesis chronologically and prospectively."
 ]};
}
