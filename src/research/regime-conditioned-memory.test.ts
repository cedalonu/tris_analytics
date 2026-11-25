import test from "node:test";
import assert from "node:assert/strict";
import {analyzeRegimeConditionedMemory} from "./regime-conditioned-memory";
import type {Draw} from "../research-core";
function rows(n:number):Draw[]{return Array.from({length:n},(_,i)=>({drawId:12000+i,digits:[
 (i*7)%10,(i*3+1)%10,(i*9+2)%10,(i*5+3)%10,(i*2+4)%10
 ] as Draw["digits"]}));}
test("regime-conditioned memory preserves chronological phases and only reports observed regimes",()=>{
 const report=analyzeRegimeConditionedMemory(rows(240));
 assert.equal(report.drawCount,240);
 assert.equal(report.discoveryDraws+report.validationDraws+report.holdoutDraws,235);
 assert.ok(report.monitoredCandidates<=60);
 for(const memory of report.memories){
  assert.ok(["compact|few-duplicates","compact|many-duplicates","mixed|few-duplicates","mixed|many-duplicates","broad|few-duplicates","broad|many-duplicates"].includes(memory.regime));
  for(let i=1;i<memory.blocks.length;i++)assert.ok(memory.blocks[i].startDrawId>memory.blocks[i-1].endDrawId);
  assert.ok(memory.reappearances<=memory.favorableEpisodes);
 }
});
test("regime-conditioned memory rejects short and non-contiguous histories",()=>{
 assert.throws(()=>analyzeRegimeConditionedMemory(rows(34)),/at least 35/);
 const data=rows(60);data[20]={...data[20],drawId:data[20].drawId+2};
 assert.throws(()=>analyzeRegimeConditionedMemory(data),/non-contiguous/);
});
