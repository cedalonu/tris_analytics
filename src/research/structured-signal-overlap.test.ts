import test from "node:test";
import assert from "node:assert/strict";
import {simulateStructuredSignalOverlap} from "./structured-signal-overlap";

const base={replications:80,drawsPerBlock:25,blocks:6,hitRate:.2,serialCorrelation:.2,seed:20261127};
test("disjoint component sets are empirically independent within Monte Carlo tolerance",()=>{
 const r=simulateStructuredSignalOverlap({...base,signalComponents:[["position:R1"],["position:R2"],["lag:1"]]});
 assert.ok(r.pairwiseOverlap.every(x=>x.sharedComponents.length===0&&x.jaccard===0&&Math.abs(x.empiricalPearson)<.15));
});
test("identical singleton components create perfect shared trajectories",()=>{
 const r=simulateStructuredSignalOverlap({...base,signalComponents:[["R1-lag1"],["R1-lag1"]]});
 assert.equal(r.pairwiseOverlap[0].jaccard,1);assert.equal(r.pairwiseOverlap[0].cosineOverlap,1);assert.equal(r.pairwiseOverlap[0].empiricalPearson,1);
});
test("partial component overlap yields positive but non-perfect dependence",()=>{
 const r=simulateStructuredSignalOverlap({...base,signalComponents:[["R1","lag1"],["R1","pool-small"],["R5","lag3"]]});
 const shared=r.pairwiseOverlap.find(x=>x.signalA===0&&x.signalB===1)!;
 assert.equal(shared.jaccard,1/3);assert.equal(shared.cosineOverlap,.5);assert.ok(shared.empiricalPearson>0&&shared.empiricalPearson<1);
 assert.ok(Math.abs(r.pairwiseOverlap.find(x=>x.signalA===0&&x.signalB===2)!.empiricalPearson)<.15);
});
test("structured overlap simulation is deterministic and rejects malformed components",()=>{
 const options={...base,signalComponents:[["a","b"],["b","c"]]};assert.deepEqual(simulateStructuredSignalOverlap(options),simulateStructuredSignalOverlap(options));
 assert.throws(()=>simulateStructuredSignalOverlap({...base,signalComponents:[["a","a"],["b"]]}),/invalid structured overlap options/);
});
