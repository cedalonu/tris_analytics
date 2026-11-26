import test from "node:test";
import assert from "node:assert/strict";
import {groupSignalRedundancy} from "./signal-redundancy-groups";
import type {DependencyMatrix} from "./signal-dependency-matrix";
const matrix:DependencyMatrix={signalCount:4,pairCount:6,minMatched:20,permutations:100,adjustmentMethod:"benjamini-hochberg",pairs:[
 {a:"A",b:"B",matchedN:30,coAlerts:10,coAlertRate:.3,phi:.7,observedAlertOverlap:.3,structuralJaccard:0,sharedComponents:[],sharedInputs:[],permutationP:.01,adjustedQ:.02,temporalBlocks:3,blockPhi:[.4,.6,.7],directionConsistency:1,classification:"empirical-dependence"},
 {a:"B",b:"C",matchedN:30,coAlerts:9,coAlertRate:.3,phi:.6,observedAlertOverlap:.3,structuralJaccard:0,sharedComponents:[],sharedInputs:[],permutationP:.02,adjustedQ:.03,temporalBlocks:3,blockPhi:[.2,.4,.5],directionConsistency:1,classification:"empirical-dependence"},
 {a:"A",b:"C",matchedN:30,coAlerts:8,coAlertRate:.2,phi:.1,observedAlertOverlap:.2,structuralJaccard:0,sharedComponents:[],sharedInputs:[],permutationP:.8,adjustedQ:.8,temporalBlocks:3,blockPhi:[.1,-.1,.2],directionConsistency:.5,classification:"no-dependence-detected"},
 {a:"A",b:"D",matchedN:30,coAlerts:10,coAlertRate:.3,phi:.5,observedAlertOverlap:.3,structuralJaccard:1,sharedComponents:["shared"],sharedInputs:["input"],permutationP:.02,adjustedQ:.1,temporalBlocks:3,blockPhi:[.4,-.2,.3],directionConsistency:.66,classification:"structural-only"},
 {a:"B",b:"D",matchedN:30,coAlerts:10,coAlertRate:.3,phi:.2,observedAlertOverlap:.3,structuralJaccard:0,sharedComponents:[],sharedInputs:[],permutationP:.4,adjustedQ:.5,temporalBlocks:3,blockPhi:[.2,.1,-.1],directionConsistency:.66,classification:"no-dependence-detected"},
 {a:"C",b:"D",matchedN:30,coAlerts:10,coAlertRate:.3,phi:.2,observedAlertOverlap:.3,structuralJaccard:0,sharedComponents:[],sharedInputs:[],permutationP:.4,adjustedQ:.5,temporalBlocks:3,blockPhi:[.2,.1,-.1],directionConsistency:.66,classification:"no-dependence-detected"}
],interpretation:"test"};
test("empirical connected clusters use only BH qualified edges and temporal support",()=>{
 const r=groupSignalRedundancy(matrix);
 assert.equal(r.empiricalGroups.length,1);assert.deepEqual(r.empiricalGroups[0].members,["A","B","C"]);
 assert.equal(r.empiricalGroups[0].classification,"supported");assert.equal(r.empiricalGroups[0].temporalSupportMean,1);
 assert.equal(r.empiricalEdges.length,2);
});
test("structural clusters remain separate from empirical groups",()=>{
 const r=groupSignalRedundancy(matrix);assert.equal(r.structuralGroups.length,1);
 assert.deepEqual(r.structuralGroups[0].members,["A","D"]);assert.equal(r.structuralGroups[0].classification,"structural-only");
 assert.deepEqual(r.isolatedSignals,[]);
});
test("weak q or low phi excluded; invalid config rejected",()=>{
 const r=groupSignalRedundancy(matrix,{phiThreshold:.65});assert.deepEqual(r.empiricalGroups[0].members,["A","B"]);
 assert.throws(()=>groupSignalRedundancy(matrix,{qThreshold:1}),/options/);
});
test("temporal inconsistency makes empirical cluster fragile",()=>{
 const m={...matrix,pairs:[{...matrix.pairs[0],blockPhi:[.5,-.4,.2]}]};
 const r=groupSignalRedundancy(m);assert.equal(r.empiricalGroups[0].classification,"fragile");
});
