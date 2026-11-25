import test from "node:test";
import assert from "node:assert/strict";
import {buildCandidateRedundancyReport} from "./candidate-redundancy-matrix";
import {generateIntuitionCandidates} from "./intuition-candidate-generator";

test("full catalog pair matrix accounts for every unordered pair",()=>{
 const r=buildCandidateRedundancyReport();
 assert.equal(r.candidateCount,1095);
 assert.equal(r.pairCount,1095*1094/2);
 assert.equal(Object.values(r.classificationCounts).reduce((a,b)=>a+b,0),r.pairCount);
 assert.equal(r.familyMatrix.reduce((s,x)=>s+x.pairCount,0),r.pairCount);
});
test("matrix separates exact, partial and disjoint structural overlap",()=>{
 const c=generateIntuitionCandidates({modes:["full5"],lags:[1],positions:[0],absenceThresholds:[0],includePools:false});
 const r=buildCandidateRedundancyReport(c);
 assert.equal(r.candidateCount,c.length);
 assert.ok(r.classificationCounts["highly-related"]+r.classificationCounts["partially-related"]+r.classificationCounts["low-overlap"]+r.classificationCounts.disjoint===c.length*(c.length-1)/2);
});
test("profiles expose nearest neighbors and explicit descriptive thresholds",()=>{
 const r=buildCandidateRedundancyReport();
 assert.deepEqual(r.thresholds,{high:.6,partial:.25});
 assert.ok(r.profiles.every(p=>p.nearestNeighbors.length<=5));
});
