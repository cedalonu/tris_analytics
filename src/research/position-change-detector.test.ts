import test from "node:test";
import assert from "node:assert/strict";
import {detectPositionBehaviorChanges} from "./position-change-detector";
import type {ResolvedCycleSignal} from "./cycle-learning";
function rows(rates:number[],position=0,config='{"family":"absence-return","position":0,"priorMisses":1}',candidateId="c1"):ResolvedCycleSignal[]{
 const out:ResolvedCycleSignal[]=[];
 rates.forEach((rate,b)=>{for(let i=0;i<25;i++){const hit=i<Math.round(rate*25);out.push({schemaVersion:1,forecastId:"f"+b+"-"+i,candidateId,family:"absence-return",frozenConfig:config,targetDrawId:100+b*25+i,generatedAt:"2026-01-01T00:00:00.000Z",historyThroughDrawId:99+b*25+i,historySha256:"h",prediction:[],baseline:[],resolvedAt:"2026-01-01T00:00:00.000Z",actual:"",candidateHit:hit,baselineHit:false,cycleId:"c"+b,modelVersion:"tris-cycle-learning-v1",position,context:{previousPoolSize:4,previousDuplicatePairs:1,previousRepeatedPositions:1,poolRegime:"mixed",duplicateRegime:"few-duplicates"}})}});
 return out;
}
test("stable behavior remains neutral",()=>assert.equal(detectPositionBehaviorChanges(rows([.2,.2,.2,.2])).series[0].state,"stable"));
test("abrupt sustained change is flagged after two blocks",()=>assert.equal(detectPositionBehaviorChanges(rows([.1,.1,.5,.5])).series[0].state,"persistent-change"));
test("single changed block is only a tentative improvement",()=>assert.equal(detectPositionBehaviorChanges(rows([.1,.1,.1,.5])).series[0].state,"improvement"));
test("gradual change becomes visible only after sustained separation",()=>assert.equal(detectPositionBehaviorChanges(rows([.1,.1,.15,.25,.45,.65])).series[0].state,"persistent-change"));
test("noisy isolated spike does not become persistent",()=>assert.notEqual(detectPositionBehaviorChanges(rows([.1,.1,.5,.1])).series[0].state,"persistent-change"));
test("recovery follows sustained deterioration",()=>assert.equal(detectPositionBehaviorChanges(rows([.9,.9,.1,.1,.9,.9])).series[0].state,"recovery"));
test("insufficient history stays unclassified",()=>assert.equal(detectPositionBehaviorChanges(rows([.2,.4,.4])).series[0].state,"insufficient-data"));
test("position and exact config are not pooled",()=>{const a=rows([.2,.2,.4,.4]),b=rows([.2,.2,.2,.2],1,'{"family":"absence-return","position":1,"priorMisses":2}',"c2");const r=detectPositionBehaviorChanges([...a,...b]);assert.equal(r.seriesCount,2);assert.deepEqual(r.series.map(x=>x.position),[0,1])});
test("duplicate candidate result is rejected",()=>assert.throws(()=>detectPositionBehaviorChanges([...rows([.2,.2,.2,.2]),rows([.2,.2,.2,.2])[0]]),/duplicate candidate outcome/));
test("frozen family or position mismatch is rejected",()=>assert.throws(()=>detectPositionBehaviorChanges(rows([.2,.2,.2,.2],1)),/position does not match/));
test("invalid block size is rejected",()=>assert.throws(()=>detectPositionBehaviorChanges([],9),/blockSize/));
