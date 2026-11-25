import test from "node:test";
import assert from "node:assert/strict";
import {createResearchPlan,evaluatePlannedHypothesis,serializeResearchPlan} from "./intuition-orchestrator";
import type {Observation} from "./intuition-evaluator";
const createdAt="2026-11-25T12:00:00.000Z";
test("default plan respects available candidates and fills 100 budget",()=>{
 const p=createResearchPlan({createdAt});
 assert.equal(p.catalogSize,1095);assert.equal(p.selectedCount,100);
 assert.deepEqual(p.familyCounts,{transition:25,"position-mutation":25,"absence-return":25,"pool-ranking":25});
 assert.ok(p.hypotheses.every(h=>h.ledgerRecord.status==="hypothesis"&&h.ledgerRecord.evidence.length===0));
});
test("plan is deterministic and export stable",()=>{
 const a=createResearchPlan({createdAt}),b=createResearchPlan({createdAt});
 assert.equal(serializeResearchPlan(a),serializeResearchPlan(b));
});
test("custom budget and family caps are respected",()=>{
 const p=createResearchPlan({createdAt,prioritizerOptions:{maxCandidates:12,familyCaps:{transition:2,"position-mutation":4,"absence-return":3,"pool-ranking":3}}});
 assert.equal(p.selectedCount,12);assert.equal(p.familyCounts.transition,2);
 assert.equal(p.familyCounts["position-mutation"],4);
});
test("evaluation accepts only requested phase and planned IDs",()=>{
 const p=createResearchPlan({createdAt,prioritizerOptions:{maxCandidates:4}});
 const id=p.hypotheses[0].candidate.id;
 const rows:Observation[]=Array.from({length:120},(_,i)=>({drawId:i+1,phase:"validation",hit:i<90,baselineHit:i<60,period:i<60?"A":"B"}));
 const result=evaluatePlannedHypothesis(p,id,rows,"validation",{minimumN:100});
 assert.equal(result.hypothesisId,id);assert.equal(result.phase,"validation");
 assert.equal(result.evaluation.candidate.n,120);
 assert.throws(()=>evaluatePlannedHypothesis(p,"missing",rows,"validation"));
 assert.throws(()=>evaluatePlannedHypothesis(p,id,[...rows,{drawId:121,phase:"holdout",hit:true,baselineHit:false}],"validation"));
});
test("plan rejects invalid timestamp",()=>{
 assert.throws(()=>createResearchPlan({createdAt:"not-a-date"}));
});
