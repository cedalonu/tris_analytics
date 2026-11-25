/**
 * Descriptive regime-shift screening for TRIS.
 * Compares disjoint recent/reference windows; never predicts or promotes hypotheses.
 */
import type { Draw, Digit, Pos } from "../research-core";

export type RegimeStatus = "insufficient-history" | "stable" | "watch";
export interface RegimeMetric {
  feature:string;
  totalVariation:number;
  jensenShannonBits:number;
  status:"stable"|"watch";
  thresholdTV:number;
  thresholdJS:number;
}
export interface RegimeComparison {
  referenceDraws:number;
  recentDraws:number;
  referenceStartId:number;
  referenceEndId:number;
  recentStartId:number;
  recentEndId:number;
  status:RegimeStatus;
  metrics:RegimeMetric[];
  watchFeatures:string[];
}
export interface RegimeChangeReport {
  drawCount:number;
  firstDrawId:number;
  lastDrawId:number;
  comparisons:RegimeComparison[];
  warnings:string[];
}
const DIGITS:Digit[]=[0,1,2,3,4,5,6,7,8,9];
const POSITIONS:Pos[]=[0,1,2,3,4];
const PLANS=[{reference:50,recent:10},{reference:100,recent:20},{reference:200,recent:50}] as const;
const TV_THRESHOLD=.20;
const JS_THRESHOLD=.08;
function validate(draws:Draw[]):void {
 if(!draws.length)throw new Error("regime analysis requires at least one draw");
 for(let i=0;i<draws.length;i++){
  const d=draws[i];
  if(!Number.isInteger(d.drawId)||d.drawId<=0||!Array.isArray(d.digits)||d.digits.length!==5||d.digits.some(x=>!Number.isInteger(x)||x<0||x>9))
   throw new Error("invalid draw at index "+i);
  if(i&&d.drawId!==draws[i-1].drawId+1)throw new Error("non-contiguous draw IDs");
 }
}
function distribution(rows:Draw[],feature:string):number[] {
 const counts:number[]=[];
 const add=(index:number,size:number)=>{while(counts.length<size)counts.push(0);counts[index]++;};
 if(feature.startsWith("position-")){
  const p=Number(feature.slice(9));rows.forEach(d=>add(d.digits[p],10));
 } else if(feature==="pool-size"||feature==="distinct-digits"){
  rows.forEach(d=>add(new Set(d.digits).size-1,5));
 } else if(feature==="duplicate-pair"){
  let duplicates=0,total=0;
  rows.forEach(d=>{for(let p=0;p<5;p++)for(let q=p+1;q<5;q++){total++;if(d.digits[p]===d.digits[q])duplicates++;}});
  return total?[duplicates,total-duplicates]:[0,0];
 } else if(feature.startsWith("joint-")){
  const [,ps,qs]=feature.split("-"),p=Number(ps),q=Number(qs);
  rows.forEach(d=>add(d.digits[p]*10+d.digits[q],100));
 } else throw new Error("unknown feature "+feature);
 return counts;
}
function normalized(values:number[]):number[] {
 const sum=values.reduce((a,b)=>a+b,0);
 return values.map(v=>sum?v/sum:0);
}
function divergence(a:number[],b:number[]):{tv:number;js:number} {
 const pa=normalized(a),pb=normalized(b),m=pa.map((v,i)=>(v+pb[i])/2);
 let js=0;
 for(let i=0;i<pa.length;i++){
  if(pa[i]>0)js+=.5*pa[i]*Math.log2(pa[i]/m[i]);
  if(pb[i]>0)js+=.5*pb[i]*Math.log2(pb[i]/m[i]);
 }
 return {tv:.5*pa.reduce((s,v,i)=>s+Math.abs(v-pb[i]),0),js};
}
function compare(reference:Draw[],recent:Draw[]):RegimeComparison {
 const features=[...POSITIONS.map(p=>"position-"+p),"pool-size","distinct-digits","duplicate-pair"];
 for(let p=0;p<5;p++)for(let q=p+1;q<5;q++)features.push("joint-"+p+"-"+q);
 const metrics=features.map(feature=>{
  const d=divergence(distribution(reference,feature),distribution(recent,feature));
  const watch=d.tv>=TV_THRESHOLD||d.js>=JS_THRESHOLD;
  return {feature,totalVariation:d.tv,jensenShannonBits:d.js,status:watch?"watch" as const:"stable" as const,thresholdTV:TV_THRESHOLD,thresholdJS:JS_THRESHOLD};
 });
 const watchFeatures=metrics.filter(m=>m.status==="watch").map(m=>m.feature);
 return {
  referenceDraws:reference.length,recentDraws:recent.length,
  referenceStartId:reference[0].drawId,referenceEndId:reference.at(-1)!.drawId,
  recentStartId:recent[0].drawId,recentEndId:recent.at(-1)!.drawId,
  status:watchFeatures.length?"watch":"stable",metrics,watchFeatures
 };
}
export function analyzeRegimeChanges(draws:Draw[]):RegimeChangeReport {
 validate(draws);
 const comparisons:RegimeComparison[]=PLANS.filter(p=>draws.length>=p.reference+p.recent).map(p=>{
  const recent=draws.slice(-p.recent),reference=draws.slice(-(p.reference+p.recent),-p.recent);
  return compare(reference,recent);
 });
 return {
  drawCount:draws.length,firstDrawId:draws[0].drawId,lastDrawId:draws.at(-1)!.drawId,comparisons,
  warnings:[
   "A watch flag means a descriptive distribution shift crossed an effect-size threshold; it is not a significance test or proof of a new regime.",
   "Reference and recent windows are disjoint. The comparison is retrospective screening, not a forecast.",
   "Many features are inspected simultaneously; watch flags are exploratory and must not be treated as independent confirmations.",
   "Small samples, ordinary random fluctuation, and rare categories can create apparent shifts.",
   "Do not change pools, candidate weights, or frozen hypotheses from this report alone. Validate any idea chronologically and prospectively."
  ]
 };
}
