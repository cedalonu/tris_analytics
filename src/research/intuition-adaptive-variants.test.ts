import test from "node:test";
import assert from "node:assert/strict";
import {generateIntuitionCandidates} from "./intuition-candidate-generator";
import {proposeAdaptiveCandidateVariants} from "./intuition-adaptive-variants";
import type {ResolvedCycleSignal} from "./cycle-learning";
function row(candidateId:string,frozenConfig:string,targetDrawId:number,hit=true,baselineHit=false):ResolvedCycleSignal {return {candidateId,frozenConfig,targetDrawId,candidateHit:hit,baselineHit,forecastId:candidateId+"-"+targetDrawId} as unknown as ResolvedCycleSignal;}
test("variants require enough prior prospective evidence and change one parameter",()=>{
 const catalog=generateIntuitionCandidates({modes:[],lags:[],positions:[0],absenceThresholds:[13],poolMethods:["frequency"],poolSizes:[2],windows:[50]});
 const parent=catalog.find(c=>c.family==="pool-ranking")!,history=Array.from({length:25},(_,i)=>row(parent.id,parent.frozenConfig,100+i));
 const variants=proposeAdaptiveCandidateVariants(catalog,history,{beforeDrawId:200,maxVariants:10});
 assert.equal(variants.length,2);assert.ok(variants.every(v=>v.parentCandidateId===parent.id&&v.changedParameter==="window"));
 assert.deepEqual(variants.map(v=>v.toValue),[150,350]);assert.ok(variants.every(v=>v.candidate.frozenConfig!==parent.frozenConfig));
});
test("absence variants are deterministic and retired parents are excluded",()=>{
 const catalog=generateIntuitionCandidates({modes:[],lags:[],positions:[0],absenceThresholds:[13],includePools:false});
 const parent=catalog[0],history=Array.from({length:25},(_,i)=>row(parent.id,parent.frozenConfig,100+i));
 assert.equal(proposeAdaptiveCandidateVariants(catalog,history,{beforeDrawId:200,retiredCandidateIds:[parent.id]}).length,0);
 const b=proposeAdaptiveCandidateVariants(catalog,history,{beforeDrawId:200});
 assert.deepEqual(b.map(x=>x.candidate.id),proposeAdaptiveCandidateVariants(catalog,history,{beforeDrawId:200}).map(x=>x.candidate.id));
 assert.deepEqual(b.map(x=>x.toValue),[18,23]);
});
test("variant generation rejects future evidence and does not branch on weak parents",()=>{
 const catalog=generateIntuitionCandidates({modes:[],lags:[],positions:[0],absenceThresholds:[13],includePools:false}),parent=catalog[0];
 assert.throws(()=>proposeAdaptiveCandidateVariants(catalog,[row(parent.id,parent.frozenConfig,200)],{beforeDrawId:200}),/future/);
 const weak=Array.from({length:25},(_,i)=>row(parent.id,parent.frozenConfig,100+i,i<5,true));
 assert.equal(proposeAdaptiveCandidateVariants(catalog,weak,{beforeDrawId:200}).length,0);
});
