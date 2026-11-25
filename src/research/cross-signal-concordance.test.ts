import test from "node:test";
import assert from "node:assert/strict";
import {analyzeCrossSignalConcordance} from "./cross-signal-concordance";
import type {Draw} from "../research-core";
function rows(n:number):Draw[]{return Array.from({length:n},(_,i)=>({drawId:15000+i,digits:[
 (i*7)%10,(i*3+1)%10,(i*9+2)%10,(i*5+3)%10,(i*2+4)%10
] as Draw["digits"]}));}
test("cross-signal report covers all 50 position-digit targets without inventing consensus",()=>{
 const report=analyzeCrossSignalConcordance(rows(240));
 assert.equal(report.records.length,50);
 assert.equal(report.drawCount,240);
 assert.equal(report.discoveryValidationHoldout.discovery+report.discoveryValidationHoldout.validation+report.discoveryValidationHoldout.holdout,235);
 for(const row of report.records){
  assert.ok(row.familyCount>=0&&row.familyCount<=5);
  assert.equal(row.familyCount,new Set(row.families.map(f=>f.family)).size);
  if(row.conflictNotes.length)assert.equal(row.concordance,"conflicting");
 }
});
test("cross-signal report rejects short and discontinuous histories",()=>{
 assert.throws(()=>analyzeCrossSignalConcordance(rows(34)),/at least 35/);
 const data=rows(60);data[30]={...data[30],drawId:data[30].drawId+2};
 assert.throws(()=>analyzeCrossSignalConcordance(data),/non-contiguous/);
});
