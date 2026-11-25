import test from "node:test";
import assert from "node:assert/strict";
import {generateIntuitionCandidates} from "./intuition-candidate-generator";
import {scoreIntuitionCandidate,selectIntuitionCandidates} from "./intuition-prioritizer";
test("priority score is transparent and deterministic",()=>{
 const candidates=generateIntuitionCandidates({includePools:false});
 const a=scoreIntuitionCandidate(candidates[0]),b=scoreIntuitionCandidate(candidates[0]);
 assert.deepEqual(a,b);assert.ok(a.reasons.length>0);assert.equal(a.candidateId,candidates[0].id);
});
test("selector obeys budget and family caps",()=>{
 const candidates=generateIntuitionCandidates({includePools:false});
 const result=selectIntuitionCandidates(candidates,{maxCandidates:9,familyCaps:{transition:3,"position-mutation":3,"absence-return":3}});
 assert.equal(result.selected.length,9);assert.deepEqual(result.familyCounts,{transition:3,"position-mutation":3,"absence-return":3,"pool-ranking":0});
});
test("selector is stable across repeated runs and pool complexity is reflected",()=>{
 const candidates=generateIntuitionCandidates({positions:[0],poolMethods:["frequency"],poolSizes:[2,9],windows:[50,200]});
 const first=selectIntuitionCandidates(candidates,{maxCandidates:4}),second=selectIntuitionCandidates(candidates,{maxCandidates:4});
 assert.deepEqual(first.selected.map(c=>c.id),second.selected.map(c=>c.id));
 const small=candidates.find(c=>c.config.poolSize===2&&c.config.window===50)!;
 const large=candidates.find(c=>c.config.poolSize===9&&c.config.window===200)!;
 assert.ok(scoreIntuitionCandidate(small).score>scoreIntuitionCandidate(large).score);
});
test("empty/zero budget returns no selection",()=>{
 const candidates=generateIntuitionCandidates({includePools:false});
 assert.equal(selectIntuitionCandidates(candidates,{maxCandidates:0}).selected.length,0);
});
