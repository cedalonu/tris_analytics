import test from "node:test";
import assert from "node:assert/strict";
import {analyzeAdaptiveSignalMemory} from "./adaptive-signal-memory";
import type {Draw} from "../research-core";
function draws(n:number):Draw[]{return Array.from({length:n},(_,i)=>({drawId:9000+i,digits:[
 (i*7)%10,(i*3+1)%10,(i*9+2)%10,(i*5+3)%10,(i*2+4)%10
 ] as Draw["digits"]}));}
test("adaptive memory keeps chronological phases and block boundaries",()=>{
 const report=analyzeAdaptiveSignalMemory(draws(240));
 assert.equal(report.drawCount,240);
 assert.equal(report.discoveryDraws+report.validationDraws+report.holdoutDraws,235);
 assert.ok(report.monitoredCandidates<=60);
 assert.equal(report.signals.length,report.monitoredCandidates);
 for(const signal of report.signals){
  for(let i=1;i<signal.blocks.length;i++){
   assert.ok(signal.blocks[i].startDrawId>signal.blocks[i-1].endDrawId);
  }
  assert.ok(["unobserved","emerging","strengthening","persistent","weakening","dormant","unstable"].includes(signal.status));
 }
});
test("adaptive memory refuses short histories and missing contest IDs",()=>{
 assert.throws(()=>analyzeAdaptiveSignalMemory(draws(34)),/at least 35/);
 const rows=draws(50);rows[25]={...rows[25],drawId:rows[25].drawId+2};
 assert.throws(()=>analyzeAdaptiveSignalMemory(rows),/non-contiguous/);
});
