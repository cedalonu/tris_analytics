import test from "node:test";
import assert from "node:assert/strict";
import type {Draw} from "../research-core";
import {freezeLearningCycle,resolveLearningCycleSignal,assessCycleSignalLifecycle,fingerprintCycleHistory,type ResolvedCycleSignal} from "./cycle-learning";
import type {IntuitionCandidate} from "./intuition-candidate-generator";

const history=(n=220):Draw[]=>Array.from({length:n},(_,i)=>({drawId:5000+i,digits:[i%10,(i+1)%10,(i*3)%10,(i*7)%10,(i*9)%10] as Draw["digits"],date:"2026-01-"+String((i%28)+1).padStart(2,"0")}));
const candidate:IntuitionCandidate={id:"pool-frequency-r1-k3-w50",family:"pool-ranking",title:"frequency pool",description:"test",config:{family:"pool-ranking",position:0,method:"frequency",poolSize:3,window:50},frozenConfig:JSON.stringify({family:"pool-ranking",position:0,method:"frequency",poolSize:3,window:50})};
const stamp="2026-11-25T12:00:00.000Z";

test("freezes the next contest from one pre-result history fingerprint",()=>{
 const h=history(),cycle=freezeLearningCycle(h,[{candidate,priorityScore:55,priorityReasons:["test"]}],h.at(-1)!.drawId+1,stamp);
 assert.equal(cycle.targetDrawId,5220);assert.equal(cycle.historySha256,fingerprintCycleHistory(h));assert.equal(cycle.frozenCount,1);
 assert.throws(()=>freezeLearningCycle(h,[{candidate,priorityScore:1,priorityReasons:[]}],5222,stamp),/next consecutive/);
});
test("resolves only the exact frozen target and preserves the prediction",()=>{
 const h=history(),cycle=freezeLearningCycle(h,[{candidate,priorityScore:55,priorityReasons:[]}],5220,stamp),signal=cycle.signals[0];
 const actual:Draw={drawId:5220,digits:[1,2,3,4,5]};
 const resolved=resolveLearningCycleSignal(cycle,signal,actual,h,stamp);
 assert.equal(resolved.targetDrawId,5220);assert.deepEqual(resolved.prediction,signal.forecast.prediction);
 assert.throws(()=>resolveLearningCycleSignal(cycle,signal,{...actual,drawId:5221},h,stamp),/does not match/);
 assert.throws(()=>resolveLearningCycleSignal(cycle,signal,actual,h.slice(1),stamp),/fingerprint/);
});
test("lifecycle uses chronological blocks and detects persistence and decay",()=>{
 const rows:ResolvedCycleSignal[]=[];
 for(let i=0;i<75;i++)rows.push({schemaVersion:1,forecastId:"f"+i,candidateId:"c",family:"pool-ranking",frozenConfig:"{}",targetDrawId:6000+i,generatedAt:stamp,historyThroughDrawId:5999+i,historySha256:"h",prediction:["1"],baseline:["0"],resolvedAt:stamp,actual:"1",candidateHit:i<50,baselineHit:i>=50,cycleId:"cycle"+i,modelVersion:"tris-cycle-learning-v1"});
 const state=assessCycleSignalLifecycle(rows)[0];
 assert.equal(state.positiveBlocks,2);assert.equal(state.negativeBlocks,1);assert.equal(state.status,"weakening");
 assert.equal(state.blocks.length,3);
});
test("does not call a small partial block persistent",()=>{
 const rows:ResolvedCycleSignal[]=[];
 for(let i=0;i<9;i++)rows.push({schemaVersion:1,forecastId:"x"+i,candidateId:"small",family:"pool-ranking",frozenConfig:"{}",targetDrawId:7000+i,generatedAt:stamp,historyThroughDrawId:6999+i,historySha256:"h",prediction:["1"],baseline:["0"],resolvedAt:stamp,actual:"1",candidateHit:true,baselineHit:false,cycleId:"c"+i,modelVersion:"tris-cycle-learning-v1"});
 assert.equal(assessCycleSignalLifecycle(rows)[0].status,"dormant");
});

test("retires a signal after three consecutive negative blocks",()=>{
 const rows:ResolvedCycleSignal[]=[];
 for(let i=0;i<75;i++)rows.push({schemaVersion:1,forecastId:"r"+i,candidateId:"retire-me",family:"pool-ranking",frozenConfig:"{}",targetDrawId:8000+i,generatedAt:stamp,historyThroughDrawId:7999+i,historySha256:"h",prediction:["1"],baseline:["0"],resolvedAt:stamp,actual:"0",candidateHit:false,baselineHit:true,cycleId:"rc"+i,modelVersion:"tris-cycle-learning-v1"});
 assert.equal(assessCycleSignalLifecycle(rows)[0].status,"retired");
});
