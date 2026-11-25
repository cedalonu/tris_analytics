import test from "node:test";
import assert from "node:assert/strict";
import { runIntuitionWalkForward, type PhaseBoundary } from "./intuition-walk-forward-engine";
import type { IntuitionCandidate } from "./intuition-candidate-generator";
import { buildPool, type Draw } from "../research-core";

const draws:Draw[]=Array.from({length:240},(_,i)=>{
  let x=(i*7919+17)%100000;
  const digits=Array.from({length:5},(_,p)=>{x=(x*48271+ p*31)%2147483647;return x%10;}) as Draw["digits"];
  return {drawId:1000+i,digits,date:"2026-01-"+String((i%28)+1).padStart(2,"0")};
});
const boundaries:PhaseBoundary[]=[
 {phase:"discovery",firstDrawId:1200,lastDrawId:1209},
 {phase:"validation",firstDrawId:1210,lastDrawId:1219},
 {phase:"holdout",firstDrawId:1220,lastDrawId:1229},
 {phase:"prospective",firstDrawId:1230,lastDrawId:1239}
];
const candidate=(family:IntuitionCandidate["family"],config:IntuitionCandidate["config"]):IntuitionCandidate=>({
 id:"test-"+family,family,title:"test",description:"test",config,frozenConfig:JSON.stringify(config)
});

test("walk-forward returns paired observations and chronological phase labels",()=>{
 const result=runIntuitionWalkForward(draws,candidate("pool-ranking",{family:"pool-ranking",position:0,method:"frequency",poolSize:3,window:20}),boundaries);
 assert.ok(result.observations.length>0);
 assert.ok(result.observations.every(row=>row.drawId>=1200&&row.drawId<=1239));
 assert.ok(result.observations.some(row=>row.phase==="validation"));
 assert.equal(result.coverage.eligible,result.observations.length);
 assert.equal(result.coverage.skipped,result.skipped.length);
});

test("rejects a missing contest ID instead of treating adjacent rows as lag one",()=>{
 const broken=draws.map(d=>({...d}));
 broken.splice(100,1);
 assert.throws(()=>runIntuitionWalkForward(broken,candidate("position-mutation",{family:"position-mutation",position:0,lag:1}),boundaries),/non-contiguous/);
});

test("rejects overlapping or out-of-order phase boundaries",()=>{
 assert.throws(()=>runIntuitionWalkForward(draws,candidate("pool-ranking",{family:"pool-ranking",position:0,method:"frequency",poolSize:2,window:20}),[
  {phase:"validation",firstDrawId:1200,lastDrawId:1210},
  {phase:"holdout",firstDrawId:1210,lastDrawId:1220}
 ]),/phase boundaries/);
});

test("future outcomes cannot alter earlier candidate observations",()=>{
 const c=candidate("pool-ranking",{family:"pool-ranking",position:2,method:"frequency",poolSize:4,window:30});
 const first=runIntuitionWalkForward(draws,c,boundaries);
 const altered=draws.map((d,i)=>i>220?{...d,digits:[9,9,9,9,9] as Draw["digits"]}:d);
 const second=runIntuitionWalkForward(altered,c,boundaries);
 assert.deepEqual(first.observations.filter(x=>x.drawId<=1220),second.observations.filter(x=>x.drawId<=1220));
});

test("absence candidate skips empty pools rather than counting misses",()=>{
 const constant:Draw[]=Array.from({length:240},(_,i)=>({drawId:2000+i,digits:[1,1,1,1,1] as Draw["digits"]}));
 const result=runIntuitionWalkForward(constant,candidate("absence-return",{family:"absence-return",position:0,priorMisses:1}),[
  {phase:"validation",firstDrawId:2220,lastDrawId:2239}
 ]);
 assert.equal(result.observations.length,0);
 assert.equal(result.skipped.length,20);
});

test("top-1 transition preserves leading zeroes in mode outcomes",()=>{
 const leading:Draw[]=Array.from({length:240},(_,i)=>({
  drawId:3000+i,
  digits:(i<220?[0,1,2,3,4]:[0,1,2,3,4]) as Draw["digits"]
 }));
 const result=runIntuitionWalkForward(leading,candidate("transition",{family:"transition",mode:"last4",lag:1}),[
  {phase:"validation",firstDrawId:3220,lastDrawId:3239}
 ]);
 assert.equal(result.observations.length,20);
 assert.ok(result.observations.every(row=>row.hit));
});

test("incremental pools match the reference pool builder for every method",()=>{
 const {buildPool}=require("../research-core") as typeof import("../research-core");
 for(const method of ["frequency","long-absence","short-absence","balanced","recent-frequency"] as const){
  const c=candidate("pool-ranking",{family:"pool-ranking",position:3,method,poolSize:4,window:20});
  const result=runIntuitionWalkForward(draws,c,boundaries);
  const expected=[];
  for(let i=200;i<draws.length;i++){
   const phase=boundaries.find(b=>draws[i].drawId>=b.firstDrawId&&draws[i].drawId<=b.lastDrawId)?.phase;
   if(!phase)continue;
   const prior=draws.slice(0,i).map(d=>d.digits[3]);
   const pool=buildPool(prior,method,4,20),baseline=buildPool(prior,"recent-frequency",4,20);
   expected.push({drawId:draws[i].drawId,phase,hit:pool.includes(draws[i].digits[3]),baselineHit:baseline.includes(draws[i].digits[3])});
  }
  assert.deepEqual(result.observations.map(({drawId,phase,hit,baselineHit})=>({drawId,phase,hit,baselineHit})),expected);
 }
});

test("incremental mutation counts preserve the lagged source digit comparison",()=>{
 const c=candidate("position-mutation",{family:"position-mutation",position:1,lag:3});
 const result=runIntuitionWalkForward(draws,c,boundaries);
 const expected=[];
 for(let i=200;i<draws.length;i++){
  const phase=boundaries.find(b=>draws[i].drawId>=b.firstDrawId&&draws[i].drawId<=b.lastDrawId)?.phase;
  if(!phase)continue;
  const source=draws[i-3].digits[1],counts=Array(10).fill(0);let n=0;
  for(let j=3;j<i;j++)if(draws[j-3].digits[1]===source){counts[(draws[j].digits[1]-source+10)%10]++;n++;}
  if(n<5)continue;
  const change=counts.indexOf(Math.max(...counts)),prediction=(source+change)%10;
  const history=draws.slice(0,i).map(d=>d.digits[1]),freq=Array(10).fill(0);history.forEach(d=>freq[d]++);
  const baseline=freq.indexOf(Math.max(...freq));
  expected.push({drawId:draws[i].drawId,phase,hit:draws[i].digits[1]===prediction,baselineHit:draws[i].digits[1]===baseline});
 }
 assert.deepEqual(result.observations.map(({drawId,phase,hit,baselineHit})=>({drawId,phase,hit,baselineHit})),expected);
});
