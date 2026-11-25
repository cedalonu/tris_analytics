import test from "node:test";
import assert from "node:assert/strict";
import {detectPositionBehaviorChanges} from "./position-change-detector";
import type {ResolvedCycleSignal} from "./cycle-learning";
function rows(rates:number[],position=0,config='{"family":"absence-return","lag":1,"position":0}',candidateId="c1"):ResolvedCycleSignal[]{
 const out:ResolvedCycleSignal[]=[];
 rates.forEach((rate,b)=>{for(let i=0;i<25;i++){const hit=i<Math.round(rate*25);out.push({candidateId,family:"absence-return",targetDrawId:100+b*25+i,candidateHit:hit,baselineHit:false,cycleId:"c"+b,modelVersion:"tris-cycle-learning-v1",position,context:{previousPoolSize:4,previousDuplicatePairs:1,previousRepeatedPositions:1,poolRegime:"mixed",duplicateRegime:"few-duplicates"},frozenConfig:config,forecastId:"f"+b+i,forecast:"",baseline:"",resolvedAt:"2026-01-01T00:00:00.000Z",actualDrawId:100+b*25+i,historyThroughDrawId:99+b*25+i,historySha256:"hash"} as unknown as ResolvedCycleSignal)}});return out;
}
test("stable series",()=>assert.equal(detectPositionBehaviorChanges(rows([.2,.2,.2,.2])).series[0].state,"stable"));
test("two positive blocks produce persistent-change",()=>assert.equal(detectPositionBehaviorChanges(rows([.2,.2,.4,.4])).series[0].state,"persistent-change"));
test("one positive block is not persistent",()=>assert.equal(detectPositionBehaviorChanges(rows([.2,.2,.2,.4])).series[0].state,"improvement"));
test("fewer than four blocks is insufficient",()=>assert.equal(detectPositionBehaviorChanges(rows([.2,.4,.4])).series[0].state,"insufficient-data"));
test("positions and configurations are isolated",()=>{const a=rows([.2,.2,.4,.4]),b=rows([.2,.2,.2,.2],1,'{"family":"absence-return","lag":2,"position":1}',"c2");const r=detectPositionBehaviorChanges([...a,...b]);assert.equal(r.seriesCount,2);assert.deepEqual(r.series.map(x=>x.position),[0,1])});
test("invalid block size rejected",()=>assert.throws(()=>detectPositionBehaviorChanges([],9),/blockSize/));
