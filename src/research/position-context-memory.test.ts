import test from "node:test";
import assert from "node:assert/strict";
import {analyzePositionContextMemory} from "./position-context-memory";
import type {ResolvedCycleSignal} from "./cycle-learning";

const make=(i:number,position:number|null,family:"pool-ranking"|"transition",mode="last3"):ResolvedCycleSignal=>{
 const config=family==="transition"?{family,mode}:{family,position,method:"frequency",poolSize:3,window:50};
 return {schemaVersion:1,forecastId:"f"+i,candidateId:"candidate-"+(position??mode),family,frozenConfig:JSON.stringify(config),
  targetDrawId:9000+i,generatedAt:"2026-11-25T12:00:00.000Z",historyThroughDrawId:8999+i,historySha256:"hash",
  prediction:["1"],baseline:["0"],resolvedAt:"2026-11-25T13:00:00.000Z",actual:"1",candidateHit:i%2===0,baselineHit:false,
  cycleId:"cycle"+i,modelVersion:"tris-cycle-learning-v1",position,context:{previousPoolSize:3,previousDuplicatePairs:2,previousRepeatedPositions:2,poolRegime:"compact",duplicateRegime:"many-duplicates"}};
};
test("groups positional forecasts by position, family and frozen pre-draw context",()=>{
 const rows=Array.from({length:30},(_,i)=>make(i,1,"pool-ranking"));
 const report=analyzePositionContextMemory(rows);
 assert.equal(report.positionSpecificTrials,30);assert.equal(report.positions.length,1);
 assert.equal(report.positions[0].position,1);assert.equal(report.positions[0].draws,30);
 assert.equal(report.positions[0].poolRegime,"compact");assert.equal(report.positions[0].duplicateRegime,"many-duplicates");
 assert.equal(report.positions[0].blocks.length,1);
});
test("keeps full-result transition modes separate from R1-R5 position summaries",()=>{
 const rows=Array.from({length:12},(_,i)=>make(i,null,"transition","last4"));
 const report=analyzePositionContextMemory(rows);
 assert.equal(report.modeLevelTrials,12);assert.equal(report.positionSpecificTrials,0);
 assert.equal(report.positions.length,0);assert.equal(report.modeScopes[0].mode,"last4");
});
test("averages candidate coverage within each unique contest before block summaries",()=>{
 const one=make(0,2,"pool-ranking"),two={...one,forecastId:"f1",candidateId:"candidate-2",candidateHit:false,baselineHit:true};
 const report=analyzePositionContextMemory([one,two]);
 assert.equal(report.positions[0].draws,1);assert.equal(report.positions[0].candidateTrials,2);
 assert.equal(report.positions[0].meanCandidateHitRate,.5);assert.equal(report.positions[0].meanBaselineHitRate,.5);
});
