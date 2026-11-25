/**
 * Collective digit behavior analysis for TRIS.
 * Descriptive only: no prediction, no APIs, and no claim of non-random structure.
 * Every window is a trailing slice of the supplied chronological history.
 */
import type { Draw, Digit, Pos } from "../research-core";

export interface PairAssociation {
  positions:[Pos,Pos];
  digits:[Digit,Digit];
  observed:number;
  expected:number;
  lift:number;
}
export interface LagMigration {
  lag:1|2|3|4|5;
  observations:number;
  sameDigitRate:number;
  meanCircularDistance:number;
  topMoves:{from:Digit;to:Digit;count:number;rate:number}[];
}
export interface CollectiveWindowReport {
  window:number;
  draws:number;
  uniqueOrderedOutcomes:number;
  uniqueUnorderedPools:number;
  meanDistinctDigits:number;
  poolSizeDistribution:Record<1|2|3|4|5,number>;
  duplicatePairRate:number;
  positionalEntropyBits:number[];
  pairAssociations:PairAssociation[];
}
export interface CollectiveBehaviorReport {
  drawCount:number;
  firstDrawId:number;
  lastDrawId:number;
  windows:CollectiveWindowReport[];
  migrations:LagMigration[];
  warnings:string[];
}
const DIGITS:Digit[]=[0,1,2,3,4,5,6,7,8,9];
const POSITIONS:Pos[]=[0,1,2,3,4];
const WINDOWS=[5,10,20,50] as const;
const entropy=(counts:number[],n:number):number=>{
 if(!n)return 0;let h=0;
 for(const count of counts)if(count){const p=count/n;h-=p*Math.log2(p);}
 return h;
};
function validate(draws:Draw[]):void{
 if(!draws.length)throw new Error("collective analysis requires at least one draw");
 for(let i=0;i<draws.length;i++){
  const d=draws[i];
  if(!Number.isInteger(d.drawId)||d.drawId<=0||d.digits.length!==5||d.digits.some(x=>!Number.isInteger(x)||x<0||x>9))
   throw new Error("invalid draw at index "+i);
  if(i&&d.drawId!==draws[i-1].drawId+1)throw new Error("non-contiguous draw IDs");
 }
}
function analyzeWindow(draws:Draw[],window:number):CollectiveWindowReport{
 const rows=draws.slice(-window),n=rows.length;
 const ordered=new Set<string>(),unordered=new Set<string>(),poolDist:Record<1|2|3|4|5,number>={1:0,2:0,3:0,4:0,5:0};
 const positional=Array.from({length:5},()=>Array(10).fill(0));
 const joint=Array.from({length:10},()=>Array.from({length:10},()=>Array(10).fill(0)));
 let distinctTotal=0,duplicatePairs=0,totalPairs=0;
 for(const draw of rows){
  ordered.add(draw.digits.join(""));
  const unique=[...new Set(draw.digits)].sort((a,b)=>a-b);
  unordered.add(unique.join(""));
  poolDist[unique.length as 1|2|3|4|5]++;
  distinctTotal+=unique.length;
  for(let p=0;p<5;p++)positional[p][draw.digits[p]]++;
  for(let p=0;p<5;p++)for(let q=p+1;q<5;q++){
   const a=draw.digits[p],b=draw.digits[q];
   joint[p*5+q][a][b]++;
   if(a===b)duplicatePairs++;
   totalPairs++;
  }
 }
 const associations:PairAssociation[]=[];
 for(let p=0;p<5;p++)for(let q=p+1;q<5;q++){
  const pair=joint[p*5+q];
  for(const a of DIGITS)for(const b of DIGITS){
   const observed=pair[a][b];if(observed<Math.max(3,Math.ceil(n*.01)))continue;
   const expected=positional[p][a]*positional[q][b]/n;
   if(expected>0)associations.push({positions:[p as Pos,q as Pos],digits:[a,b],observed,expected,lift:observed/expected});
  }
 }
 associations.sort((a,b)=>b.lift-a.lift||b.observed-a.observed||a.positions[0]-b.positions[0]||a.digits[0]-b.digits[0]);
 return {
  window,draws:n,uniqueOrderedOutcomes:ordered.size,uniqueUnorderedPools:unordered.size,
  meanDistinctDigits:n?distinctTotal/n:0,poolSizeDistribution:poolDist,
  duplicatePairRate:totalPairs?duplicatePairs/totalPairs:0,
  positionalEntropyBits:positional.map(c=>entropy(c,n)),
  pairAssociations:associations.slice(0,10)
 };
}
function migration(draws:Draw[],lag:1|2|3|4|5):LagMigration{
 const counts=Array.from({length:10},()=>Array(10).fill(0));let same=0,total=0,distance=0;
 for(let i=lag;i<draws.length;i++)for(const p of POSITIONS)for(const q of POSITIONS){
  const a=draws[i-lag].digits[p],b=draws[i].digits[q];
  counts[a][b]++;total++;if(a===b)same++;
  const delta=Math.abs(a-b);distance+=Math.min(delta,10-delta);
 }
 const moves:{from:Digit;to:Digit;count:number;rate:number}[]=[];
 for(const a of DIGITS)for(const b of DIGITS)if(counts[a][b]){
  const n=counts[a].reduce((s,x)=>s+x,0);
  moves.push({from:a,to:b,count:counts[a][b],rate:counts[a][b]/n});
 }
 moves.sort((a,b)=>b.count-a.count||a.from-b.from||a.to-b.to);
 return {lag,observations:total,sameDigitRate:total?same/total:0,meanCircularDistance:total?distance/total:0,topMoves:moves.slice(0,15)};
}
export function analyzeCollectiveBehavior(draws:Draw[]):CollectiveBehaviorReport{
 validate(draws);
 return {
  drawCount:draws.length,firstDrawId:draws[0].drawId,lastDrawId:draws.at(-1)!.drawId,
  windows:WINDOWS.map(w=>analyzeWindow(draws,w)),
  migrations:([1,2,3,4,5] as const).filter(lag=>draws.length>lag).map(lag=>migration(draws,lag)),
  warnings:[
   "Descriptive co-occurrence and migration are not evidence of predictive advantage.",
   "Pair lift is measured against independence of the two observed positional marginals; multiple comparisons can create extreme lifts by chance.",
   "Small windows are intentionally descriptive and have low statistical power.",
   "The lag migration matrix aggregates all 25 source-position/target-position pairs; it does not imply a causal path.",
   "Any predictive use requires a frozen chronological walk-forward test and prospective replication."
  ]
 };
}
