import test from "node:test";
import assert from "node:assert/strict";
import {selectCandidatePortfolio,compareCandidatePortfolioMethods} from "./candidate-portfolio-selector";
import {generateIntuitionCandidates} from "./intuition-candidate-generator";
test("all portfolio methods are deterministic and respect requested size",()=>{
 for(const m of ["family-balanced","max-diversity","redundancy-control","random"] as const){
  const a=selectCandidatePortfolio(m,20,123),b=selectCandidatePortfolio(m,20,123);
  assert.deepEqual(a,b);assert.equal(a.candidateIds.length,20);assert.equal(a.metrics.size,20);
 }
});
test("family-balanced portfolio distributes small selections across families",()=>{
 const p=selectCandidatePortfolio("family-balanced",8,5);
 assert.ok(Object.values(p.metrics.familyCounts).every(x=>x===2));
});
test("diversity selection is no more redundant than redundancy control on fixed catalog",()=>{
 const d=selectCandidatePortfolio("max-diversity",20,7),r=selectCandidatePortfolio("redundancy-control",20,7);
 assert.ok(d.metrics.meanPairJaccard<=r.metrics.meanPairJaccard);
});
test("random replicates are reproducible and sizes are capped",()=>{
 const c=generateIntuitionCandidates({modes:["full5"],lags:[1],positions:[0],absenceThresholds:[0],includePools:false});
 assert.equal(selectCandidatePortfolio("random",999,1,c).candidateIds.length,c.length);
 assert.equal(compareCandidatePortfolioMethods([3],[1,2],c).length,5);
});
test("candidate IDs must be unique",()=>{
 const c=generateIntuitionCandidates({modes:["full5"],lags:[1],positions:[0],absenceThresholds:[0],includePools:false});
 assert.throws(()=>selectCandidatePortfolio("random",2,1,[c[0],c[0]]),/unique/);
});
