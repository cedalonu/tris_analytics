/** Aggregate pool performance and pool composition; additive research module. */
import type { Draw, Digit, Pos, PoolMethod } from "../research-core";
import { buildPool } from "../research-core";
export interface PoolHitSummary { poolSize:number; tested:number; hitRate:number; expectedUniform:number; lift:number; hitDistribution:number[]; meanHits:number; }
export interface PoolOverlap { methodA:PoolMethod; methodB:PoolMethod; position:Pos; size:number; overlapCount:number; jaccard:number; }
export interface PoolSizeReport { position:Pos; method:PoolMethod; reports:PoolHitSummary[]; warnings:string[]; }

/** Walk-forward coverage of a pool for a five-digit draw; only past history is used. */
export function summarizePool(draws:Draw[],position:Pos,method:PoolMethod,size:number,minTrain=30,window=50):PoolHitSummary {
 const k=Math.max(1,Math.min(10,Math.floor(size))),dist=[0,0,0,0,0,0],n=Math.max(0,draws.length-minTrain);let totalHits=0;
 for(let i=minTrain;i<draws.length;i++){
  const prior=draws.slice(0,i).map(d=>d.digits[position]),pool=buildPool(prior,method,k,window);
  const hit=pool.includes(draws[i].digits[position])?1:0;dist[hit]++;totalHits+=hit;
 }
 const rate=n?totalHits/n:0,ref=k/10;
 return {poolSize:k,tested:n,hitRate:rate,expectedUniform:ref,lift:ref?rate/ref:0,hitDistribution:dist,meanHits:rate};
}

export function poolSizeReport(draws:Draw[],position:Pos,method:PoolMethod,sizes:number[]=[2,3,4,5,6,7,8,9],minTrain=30,window=50):PoolSizeReport {
 const reports=[...new Set(sizes)].filter(s=>s>=1&&s<=10).sort((a,b)=>a-b).map(s=>summarizePool(draws,position,method,s,minTrain,window));
 return {position,method,reports,warnings:["Pool hit rates increase mechanically with pool size; compare against size-specific k/10 reference.","Historical walk-forward results remain exploratory; reserve untouched holdout/prospective draws."]};
}

/** Similarity of two pools, computed from digit sets. */
export function poolOverlap(poolA:Digit[],poolB:Digit[],methodA:PoolMethod,methodB:PoolMethod,position:Pos,size:number):PoolOverlap {
 const a=new Set(poolA),b=new Set(poolB),intersection=[...a].filter(x=>b.has(x)).length,union=new Set([...a,...b]).size;
 return {methodA,methodB,position,size,overlapCount:intersection,jaccard:union?intersection/union:0};
}

/** Membership changes between consecutive pools; an exploratory stability measure. */
export function poolStability(history:Digit[],method:PoolMethod,size:number,window=50):{compared:number;meanJaccard:number;values:number[]} {
 const values:number[]=[];for(let i=1;i<history.length;i++){
  const p1=buildPool(history.slice(0,i),method,size,window),p2=buildPool(history.slice(0,i+1),method,size,window),u=new Set([...p1,...p2]),inter=p1.filter(d=>p2.includes(d)).length;
  values.push(u.size?inter/u.size:1);
 }
 return {compared:values.length,meanJaccard:values.length?values.reduce((s,v)=>s+v,0)/values.length:0,values};
}