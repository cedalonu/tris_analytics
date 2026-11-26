import {test} from "node:test";
import {strict as assert} from "node:assert";
import {analyzePositionalPoolTemporalStability} from "./positional-pool-temporal-stability";
import type {PositionalPoolConcordanceReport} from "./positional-pool-concordance";

const fixture:PositionalPoolConcordanceReport={method:"fixture",minimumHistory:10,poolMethods:["frequency"],poolSizes:[3],
 blocks:Array.from({length:9},(_,i)=>({regimeId:"pool-stable|dup-stable|distinct-stable|entropy-stable",position:0 as const,method:"frequency" as const,poolSize:3,blockIndex:i,startDrawId:i*10,endDrawId:i*10+9,partial:false,
 positionalDominantDigit:(i%10) as never,positionalDominantShare:.1+i*.08,tested:10,poolHits:3,poolHitRate:.3,uniformReference:.3,
 dominantDigitPoolInclusionRate:.1+i*.08,meanPoolJaccard:.6,poolTurnover:.4,dominantChangedFromPreviousBlock:i%2===0})),
 groups:[],limitations:[]};
test("rolling concordance stability is deterministic and creates consecutive windows",()=>{
 const a=analyzePositionalPoolTemporalStability(fixture,{windowBlocks:5,stepBlocks:2,minimumPairs:3});
 const b=analyzePositionalPoolTemporalStability(fixture,{windowBlocks:5,stepBlocks:2,minimumPairs:3});
 assert.deepEqual(a,b);
 assert.equal(a.windows.length,3);
 assert.equal(a.windows[0].firstBlockIndex,0);
 assert.equal(a.windows[0].lastBlockIndex,4);assert.equal(a.windows[0].regimeId,"pool-stable|dup-stable|distinct-stable|entropy-stable");assert.equal(a.windows[0].position,0);assert.equal(a.windows[0].method,"frequency");assert.equal(a.windows[0].poolSize,3);assert.equal(a.groups[0].regimeId,"pool-stable|dup-stable|distinct-stable|entropy-stable");
});
test("does not bridge missing block indices",()=>{
 const broken={...fixture,blocks:fixture.blocks.filter(x=>x.blockIndex!==4)};
 const result=analyzePositionalPoolTemporalStability(broken,{windowBlocks:5,stepBlocks:1});
 assert.equal(result.windows.length,0);
 assert.ok(result.groups.every(x=>x.classification==="insufficient"));
});
test("rejects invalid temporal settings",()=>{
 assert.throws(()=>analyzePositionalPoolTemporalStability(fixture,{windowBlocks:2}),/invalid temporal window/);
 assert.throws(()=>analyzePositionalPoolTemporalStability(fixture,{consistencyThreshold:.5}),/invalid stability thresholds/);
});
