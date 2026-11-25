import test from "node:test";
import assert from "node:assert/strict";
import { runIntuitionWalkForward, type PhaseBoundary } from "./intuition-walk-forward-engine";
import type { IntuitionCandidate } from "./intuition-candidate-generator";
import type { Draw } from "../research-core";

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
