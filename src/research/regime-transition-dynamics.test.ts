import test from "node:test";
import assert from "node:assert/strict";
import {analyzeRegimeTransitionDynamics} from "./regime-transition-dynamics";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";
function labels(values:string[]):ProspectiveRegimeLabel[]{return values.map((regimeId,i)=>({drawId:500+i,regimeId,method:"past-only",sourceStartDrawId:400+i,sourceEndDrawId:499+i}));}
test("summarizes raw episode durations and exact transition counts",()=>{
 const r=analyzeRegimeTransitionDynamics(labels(["A","A","B","B","B","A","C","C"]));
 assert.equal(r.rawEpisodeCount,4);assert.equal(r.rawTransitions,3);
 assert.equal(r.meanRawEpisodeLength,2);assert.equal(r.medianRawEpisodeLength,2);
 assert.deepEqual(r.transitionMatrix.map(x=>[x.from,x.to,x.count]),[["A","B",1],["A","C",1],["B","A",1]]);
});
test("compares fixed confirmation thresholds without selecting one",()=>{
 const r=analyzeRegimeTransitionDynamics(labels(["A","A","A","A","B","B","A","A","A","C","C","C"]));
 assert.deepEqual(r.thresholdSensitivity.map(x=>x.minConsecutive),[2,3,4,5]);
 assert.equal(r.thresholdSensitivity[0].meanConfirmationDelay,1);
 assert.equal(r.thresholdSensitivity[1].meanConfirmationDelay,2);
 assert.ok(r.thresholdSensitivity[3].watchShare>=r.thresholdSensitivity[1].watchShare);
});
test("rejects empty labels, duplicate thresholds, and non-past-only labels",()=>{
 assert.throws(()=>analyzeRegimeTransitionDynamics([]));
 assert.throws(()=>analyzeRegimeTransitionDynamics(labels(["A","B"]),{thresholds:[2,2]}));
 const bad=labels(["A"]);bad[0].sourceEndDrawId=500;
 assert.throws(()=>analyzeRegimeTransitionDynamics(bad));
});
