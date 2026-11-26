import {test} from "node:test";
import {strict as assert} from "node:assert";
import {analyzePositionalPoolWindowSensitivity} from "./positional-pool-window-sensitivity";
import type {PositionalPoolConcordanceReport} from "./positional-pool-concordance";
const report={method:"fixture",minimumHistory:5,poolMethods:["frequency"],poolSizes:[3],groups:[],limitations:[],blocks:Array.from({length:24},(_,i)=>({regimeId:"A",position:0,method:"frequency",poolSize:3,blockIndex:i+1,startDrawId:i*10+1,endDrawId:i*10+10,partial:false,positionalDominantDigit:i%10,positionalDominantShare:.2+(i%3)*.01,tested:10,poolHits:3,poolHitRate:.3,uniformReference:.3,dominantDigitPoolInclusionRate:.2+(i%4)*.05,meanPoolJaccard:.5,poolTurnover:.5,dominantChangedFromPreviousBlock:i%2===0}))} as PositionalPoolConcordanceReport;
test("evaluates every declared temporal window deterministically",()=>{const r=analyzePositionalPoolWindowSensitivity(report,{windows:[5,8,10]});assert.deepEqual(r.configurations.map(x=>x.windowBlocks),[5,8,10]);assert.ok(r.configurations.every(x=>x.groups===1));});
test("rejects duplicate and invalid windows",()=>{assert.throws(()=>analyzePositionalPoolWindowSensitivity(report,{windows:[5,5]}));assert.throws(()=>analyzePositionalPoolWindowSensitivity(report,{windows:[2]}));});
