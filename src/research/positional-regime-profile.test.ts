import {test} from "node:test";
import {strict as assert} from "node:assert";
import {analyzePositionalRegimeProfiles} from "./positional-regime-profile";
import type {Draw} from "../research-core";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";

const draws:Draw[]=Array.from({length:8},(_,i)=>({drawId:100+i,digits:
  i<4?[1,1,2,3,4]:[8,8,8,8,8]}));
const labels:ProspectiveRegimeLabel[]=draws.slice(1).map((d,i)=>({
  drawId:d.drawId,regimeId:i<3?"A":"B",method:"past-only-test",
  sourceStartDrawId:d.drawId-1,sourceEndDrawId:d.drawId-1
}));
test("profiles positional digits and separates groups by past-only label",()=>{
 const report=analyzePositionalRegimeProfiles(draws,labels,{minimumSupport:3});
 assert.equal(report.labeledDrawCount,7);
 assert.equal(report.regimes.length,2);
 const a=report.regimes.find(x=>x.regimeId==="A")!;
 const b=report.regimes.find(x=>x.regimeId==="B")!;
 assert.equal(a.n,3);assert.equal(b.n,4);
 assert.equal(a.positions[0].dominantDigit,1);
 assert.equal(b.positions[0].dominantDigit,8);
 assert.equal(a.positions[0].entropyBits,0);
 assert.equal(a.changeSynchronyPairs[0].sameDeltaRate,1);
 assert.equal(b.positions[0].effectiveDigits,1);
 assert.equal(b.positionPairs[0].sameDigitRate,1);
 assert.equal(b.positionPairs[0].excessSameDigitRate,0);
});
test("uses target outcomes only after checking label history is strictly earlier",()=>{
 const invalid=[{...labels[0],sourceEndDrawId:labels[0].drawId}];
 assert.throws(()=>analyzePositionalRegimeProfiles(draws,invalid),/strictly pre-target/);
});
test("rejects duplicate labels, gaps, and invalid support",()=>{
 assert.throws(()=>analyzePositionalRegimeProfiles(draws,[labels[0],labels[0]]),/duplicate/);
 assert.throws(()=>analyzePositionalRegimeProfiles(draws.slice(0,3).concat({...draws[3],drawId:105}),labels.slice(0,2)),/contiguous/);
 assert.throws(()=>analyzePositionalRegimeProfiles(draws,labels,{minimumSupport:0}),/minimumSupport/);
});
test("marks small regime groups as limited",()=>{
 const report=analyzePositionalRegimeProfiles(draws,labels,{minimumSupport:10});
 assert.ok(report.regimes.every(x=>x.support==="limited"));
});
