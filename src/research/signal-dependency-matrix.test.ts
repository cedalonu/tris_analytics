import test from "node:test";
import assert from "node:assert/strict";
import {buildSignalDependencyMatrix} from "./signal-dependency-matrix";
const stream=(id:string,alerts:boolean[],components:string[]=[],inputs:string[]=[])=>( {id,family:"demo",components,sharedInputs:inputs,matchedAlerts:alerts.map((alert,i)=>({targetId:String(i),alert}))});
test("pairs align by target IDs and flag strong dependence under permutation null",()=>{
 const x=[true,false,true,false,true,false,true,false,true,false,true,false];
 const r=buildSignalDependencyMatrix([stream("a",x,["x"],["history"]),stream("b",x,["x"],["history"])],{minMatched:10,permutations:100,seed:4});
 assert.equal(r.pairCount,1);assert.equal(r.pairs[0].matchedN,12);assert.equal(r.pairs[0].phi,1);
 assert.equal(r.pairs[0].classification,"empirical-dependence");
});
test("nonmatched target IDs are excluded; structural overlap stays descriptive",()=>{
 const a=stream("a",[true,false,true,false],["common"],["db1"]),b=stream("b",[true,false,true,false],["common"],["db1"]);
 b.matchedAlerts=b.matchedAlerts.map(x=>({...x,targetId:"offset-"+x.targetId}));
 const r=buildSignalDependencyMatrix([a,b],{minMatched:3,permutations:20});
 assert.equal(r.pairs[0].matchedN,0);assert.equal(r.pairs[0].classification,"insufficient");
 assert.deepEqual(r.pairs[0].sharedInputs,["db1"]);assert.equal(r.pairs[0].structuralJaccard,1);
});
test("duplicate IDs and invalid configuration are rejected",()=>{
 const s=stream("same",[true,false]);assert.throws(()=>buildSignalDependencyMatrix([s,s]),/unique/);
 assert.throws(()=>buildSignalDependencyMatrix([s],{minMatched:0}),/options/);
});
test("weak empirical correlation does not become dependence merely by overlap",()=>{
 const a=[true,true,false,false,true,false,false,true,false,true,false,false];
 const b=[false,true,true,false,false,true,false,false,true,false,true,false];
 const r=buildSignalDependencyMatrix([stream("a",a,["shared"]),stream("b",b,["shared"])],{minMatched:10,permutations:100});
 assert.ok(["structural-only","no-dependence-detected"].includes(r.pairs[0].classification));
});
