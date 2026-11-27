import test from "node:test";
import assert from "node:assert/strict";
import { buildCycleCommunities } from "./structural-motif-cycle-communities";
import type { MotifCycle } from "./structural-motif-cycles";
import type { CycleSynchronization } from "./structural-motif-cycle-synchronization";

const cycle=(key:string,startWindow=0):MotifCycle=>({
 key,members:key.split("::") as [string,string,string],sequence:["wedge","triangle"],
 period:2,repetitions:2,startWindow,endWindow:startWindow+3,rightCensored:false
});
const pair=(left:MotifCycle,right:MotifCycle,score:number):CycleSynchronization=>({
 left,right,overlapWindows:4,unionWindows:4,temporalJaccard:1,samePeriod:true,
 sameSequenceUpToRotation:true,synchronizationScore:score,classification:"alineada",startLag:0
});
test("groups connected synchronized cycles and identifies the degree hub",()=>{
 const a=cycle("A::B::C"),b=cycle("D::E::F"),c=cycle("G::H::I");
 const result=buildCycleCommunities([a,b,c],[pair(a,b,.8),pair(b,c,.7)]);
 assert.equal(result.communities.length,1);
 assert.equal(result.communities[0].cycleCount,3);
 assert.equal(result.communities[0].hub?.key,b.key);
 assert.equal(result.communities[0].edgeCount,2);
});
test("retains cycles without qualifying links as isolated communities",()=>{
 const a=cycle("A::B::C"),b=cycle("D::E::F");
 const result=buildCycleCommunities([a,b],[pair(a,b,.4)]);
 assert.equal(result.summary.isolatedCycles,2);
 assert.equal(result.communities[0].classification,"aislada");
});
test("applies the selected synchronization threshold",()=>{
 const a=cycle("A::B::C"),b=cycle("D::E::F");
 assert.equal(buildCycleCommunities([a,b],[pair(a,b,.6)],.5).summary.connectedCommunities,1);
 assert.equal(buildCycleCommunities([a,b],[pair(a,b,.6)],.7).summary.connectedCommunities,0);
});
test("returns an empty result for no cycles",()=>{
 const result=buildCycleCommunities([],[]);
 assert.equal(result.summary.communityCount,0);
 assert.equal(result.summary.meanDensity,0);
});
