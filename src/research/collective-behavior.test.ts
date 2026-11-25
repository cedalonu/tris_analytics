import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCollectiveBehavior } from "./collective-behavior";
import type { Draw } from "../research-core";

const repeated:Draw[]=Array.from({length:60},(_,i)=>({
 drawId:5000+i,
 digits:(i%2===0?[1,1,2,2,3]:[1,1,2,2,3]) as Draw["digits"]
}));

test("reports ordered outcomes, unordered pools, repeated-digit pools and positional entropy",()=>{
 const report=analyzeCollectiveBehavior(repeated);
 assert.equal(report.drawCount,60);
 assert.equal(report.firstDrawId,5000);
 assert.equal(report.lastDrawId,5059);
 assert.deepEqual(report.windows.map(w=>w.window),[5,10,20,50]);
 const w=report.windows[0];
 assert.equal(w.uniqueOrderedOutcomes,1);
 assert.equal(w.uniqueUnorderedPools,1);
 assert.equal(w.meanDistinctDigits,3);
 assert.equal(w.poolSizeDistribution[3],5);
 assert.equal(w.duplicatePairRate,0.2);
 assert.ok(w.positionalEntropyBits.every(x=>x===0));
});

test("correlated positions show lift above independence baseline",()=>{
 const correlated:Draw[]=Array.from({length:60},(_,i)=>({
  drawId:6000+i,
  digits:[(i%2) as 0|1,(i%2) as 0|1,2,3,4] as Draw["digits"]
 }));
 const report=analyzeCollectiveBehavior(correlated);
 const association=report.windows.at(-1)!.pairAssociations.find(x=>
  x.positions[0]===0&&x.positions[1]===1&&x.digits[0]===0&&x.digits[1]===0
 );
 assert.ok(association);
 assert.equal(association!.observed,30);
 assert.equal(association!.expected,15);
 assert.equal(association!.lift,2);
});

