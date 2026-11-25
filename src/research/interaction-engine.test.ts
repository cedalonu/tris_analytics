import test from "node:test";
import assert from "node:assert/strict";
import {analyzeSignalInteractions} from "./interaction-engine";
import type {Draw} from "../research-core";

function sequence(n:number):Draw[]{
 return Array.from({length:n},(_,i)=>({drawId:5000+i,digits:[
  (i*7)%10,(i*3+1)%10,(i*9+2)%10,(i*5+3)%10,(i*2+4)%10
 ] as Draw["digits"]}));
}
test("interaction engine creates chronological split and bounded candidates",()=>{
 const report=analyzeSignalInteractions(sequence(240));
 assert.equal(report.drawCount,240);
 assert.deepEqual(report.split,{discovery:60,validation:20,holdout:20});
 assert.equal(report.featureCount,8);
 assert.equal(report.combinationsTested,50*84);
 assert.ok(report.selected.length<=60);
 for(let i=1;i<report.selected.length;i++)assert.ok(report.selected[i-1].discovery.incrementalVsBestSingle>=report.selected[i].discovery.incrementalVsBestSingle);
 for(const candidate of report.selected){
  assert.ok(candidate.features.length===2||candidate.features.length===3);
  assert.ok(candidate.discovery.observations>candidate.validation.observations);
  assert.ok(candidate.validation.observations>=candidate.holdout.observations);
 }
});
test("interaction engine rejects gaps and short histories",()=>{
 assert.throws(()=>analyzeSignalInteractions(sequence(34)),/at least 35/);
 const rows=sequence(40);rows[20]={...rows[20],drawId:rows[20].drawId+1};
 assert.throws(()=>analyzeSignalInteractions(rows),/non-contiguous/);
});
