import test from "node:test";
import assert from "node:assert/strict";
import {evaluateHypothesis} from "./intuition-evaluator";
const rows=(phase:"validation"|"holdout"|"prospective",n:number,hits:number,baseHits:number,periods=2)=>{
 const out=[];for(let i=0;i<n;i++){const hit=i<hits,baselineHit=i<baseHits;out.push({drawId:i+1,phase,hit,baselineHit,period:"P"+(i%periods+1)});}return out;
};
test("insufficient sample never promotes",()=>{
 const r=evaluateHypothesis(rows("validation",30,25,15),"validation",{minimumN:100});
 assert.equal(r.decision,"insufficient-data");assert.equal(r.candidate.n,30);
});
test("paired evaluation exposes baseline and exact comparison",()=>{
 const r=evaluateHypothesis(rows("validation",200,140,100),"validation",{minimumN:100,testCount:10});
 assert.equal(r.candidate.rate,.7);assert.equal(r.baseline.rate,.5);
 assert.equal(r.difference,.2);assert.equal(r.adjustedAlpha,.005);assert.equal(r.periodsWithData,2);
 assert.equal(r.decision,"continue-research");
});
test("holdout and prospective phases are evaluated independently",()=>{
 const v=evaluateHypothesis([...rows("validation",200,140,100),...rows("holdout",200,140,100),...rows("prospective",200,140,100)],"holdout",{minimumN:100});
 const p=evaluateHypothesis([...rows("validation",200,140,100),...rows("prospective",200,140,100)],"prospective",{minimumN:100});
 assert.equal(v.decision,"holdout-confirmed");assert.equal(p.decision,"prospective-replicated");
});
test("no evidence when candidate does not beat baseline",()=>{
 const r=evaluateHypothesis(rows("validation",200,90,100),"validation",{minimumN:100});
 assert.equal(r.decision,"no-evidence");assert.ok(r.difference<0);
});
test("multiple test correction makes threshold stricter",()=>{
 const r=evaluateHypothesis(rows("validation",200,140,100),"validation",{minimumN:100,testCount:1000});
 assert.equal(r.adjustedAlpha,.00005);assert.ok(r.adjustedP>=r.exactMcNemarP);
});
test("discovery cannot claim confirmation",()=>{
 const r=evaluateHypothesis(rows("discovery",200,160,100),"discovery",{minimumN:100});
 assert.equal(r.decision,"insufficient-data");assert.ok(r.warnings.some(w=>w.includes("descriptive")));
});
test("paired ties give no advantage",()=>{
 const obs=rows("validation",100,50,50);
 const r=evaluateHypothesis(obs,"validation",{minimumN:100});
 assert.equal(r.difference,0);assert.equal(r.decision,"no-evidence");
});
