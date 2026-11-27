import test from "node:test";
import assert from "node:assert/strict";
import {generateIntuitionCandidates} from "./intuition-candidate-generator";
import {selectAdaptiveIntuitionCandidates} from "./intuition-adaptive-investigator";
import type {ResolvedCycleSignal} from "./cycle-learning";
const candidates=generateIntuitionCandidates({modes:["full5"],lags:[1],positions:[0],absenceThresholds:[1],poolMethods:["frequency"],poolSizes:[2,3,4],windows:[20]});
function row(candidateId:string,frozenConfig:string,targetDrawId:number,hit:boolean,baselineHit:boolean):ResolvedCycleSignal {return {candidateId,frozenConfig,targetDrawId,candidateHit:hit,baselineHit,forecastId:candidateId+"-"+targetDrawId} as unknown as ResolvedCycleSignal;}
test("adaptive investigator balances paired evidence and under-tested exploration",()=>{
 const pool=candidates.filter(c=>c.family==="pool-ranking"),strong=pool[0],weak=pool[1],unseen=pool[2];
 const history=Array.from({length:30},(_,i)=>row(strong.id,strong.frozenConfig,100+i,true,false)).concat(Array.from({length:30},(_,i)=>row(weak.id,weak.frozenConfig,100+i,false,true)));
 const result=selectAdaptiveIntuitionCandidates(candidates,history,{beforeDrawId:200,budget:2,familyCaps:{transition:0,"position-mutation":0,"absence-return":0,"pool-ranking":2},explorationFraction:.5});
 assert.equal(result.selected.length,2);assert.ok(result.selected.some(x=>x.candidate.id===strong.id));assert.ok(result.selected.some(x=>x.candidate.id===unseen.id));assert.equal(result.explorationCount,1);assert.equal(result.exploitationCount,1);
});
test("adaptive investigator rejects future evidence and duplicate candidate contest rows",()=>{
 const c=candidates[0];assert.throws(()=>selectAdaptiveIntuitionCandidates(candidates,[row(c.id,c.frozenConfig,200,true,false)],{beforeDrawId:200}),/future/);
 assert.throws(()=>selectAdaptiveIntuitionCandidates(candidates,[row(c.id,c.frozenConfig,100,true,false),row(c.id,c.frozenConfig,100,false,true)],{beforeDrawId:200}),/duplicate/);
});
test("retired candidates are excluded and selection is deterministic",()=>{
 const pool=candidates.filter(c=>c.family==="pool-ranking"),retired=pool[0];
 const options={beforeDrawId:500,budget:2,familyCaps:{transition:0,"position-mutation":0,"absence-return":0,"pool-ranking":2},retiredCandidateIds:[retired.id]};
 const a=selectAdaptiveIntuitionCandidates(candidates,[],options),b=selectAdaptiveIntuitionCandidates(candidates,[],options);
 assert.deepEqual(a.selected.map(x=>x.candidate.id),b.selected.map(x=>x.candidate.id));assert.ok(!a.selected.some(x=>x.candidate.id===retired.id));assert.equal(a.retiredExcluded,1);
});

test("default 100-candidate budget splits exactly 50 exploration and 50 exploitation",()=>{
 const fullCatalog=generateIntuitionCandidates();
 const result=selectAdaptiveIntuitionCandidates(fullCatalog,[],{beforeDrawId:900,budget:100,familyCaps:{transition:25,"position-mutation":25,"absence-return":25,"pool-ranking":25},explorationFraction:.5});
 assert.equal(result.selected.length,100);
 assert.equal(result.explorationCount,50);assert.equal(result.exploitationCount,50);
 assert.deepEqual(result.familyCounts,{transition:25,"position-mutation":25,"absence-return":25,"pool-ranking":25});
});

test("default family caps never exceed a non-divisible budget",()=>{
 const result=selectAdaptiveIntuitionCandidates(generateIntuitionCandidates(),[],{beforeDrawId:901,budget:5});
 assert.equal(result.selected.length,5);
 assert.deepEqual(result.familyCounts,{transition:2,"position-mutation":1,"absence-return":1,"pool-ranking":1});
 assert.throws(()=>selectAdaptiveIntuitionCandidates(generateIntuitionCandidates(),[],{beforeDrawId:901,budget:5,familyCaps:{transition:5,"position-mutation":5}}),/cannot exceed/);
});
