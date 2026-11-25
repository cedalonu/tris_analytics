import test from "node:test";
import assert from "node:assert/strict";
import type {Draw} from "../research-core";
import {generateIntuitionCandidates} from "./intuition-candidate-generator";
import {selectCandidatePortfolio} from "./candidate-portfolio-selector";
import {buildPortfolioPhaseBoundaries,buildHoldoutStabilityBlocks,evaluateCandidatePortfolioWalkForward} from "./candidate-portfolio-walk-forward";

const draws:Draw[]=Array.from({length:260},(_,i)=>{let x=(i*7919+17)%100000;const digits=Array.from({length:5},(_,p)=>{x=(x*48271+p*31)%2147483647;return x%10}) as Draw["digits"];return{drawId:5000+i,digits};});
const catalog=generateIntuitionCandidates({modes:["full5"],lags:[1],positions:[0,1],absenceThresholds:[1],poolMethods:["frequency"],poolSizes:[2,3],windows:[20],includePools:true});

test("portfolio walk-forward evaluates a frozen portfolio across common phases",()=>{
 const p=selectCandidatePortfolio("family-balanced",4,19,catalog);
 const bounds=buildPortfolioPhaseBoundaries(draws);
 const report=evaluateCandidatePortfolioWalkForward(draws,p,catalog,bounds);
 assert.equal(report.candidateIds.length,4);
 assert.ok(report.phases.some(x=>x.phase==="validation"));
 assert.ok(report.phases.every(x=>x.candidateCount===4));
 assert.ok(report.phases.every(x=>x.rate>=0&&x.rate<=1&&x.baselineRate>=0&&x.baselineRate<=1));
 assert.ok(report.warnings.some(x=>x.includes("dependent")));
});

test("portfolio evaluator rejects unknown and duplicate candidate IDs",()=>{
 const bounds=buildPortfolioPhaseBoundaries(draws);
 const p=selectCandidatePortfolio("random",1,1,catalog);
 assert.throws(()=>evaluateCandidatePortfolioWalkForward(draws,{...p,candidateIds:["missing"]},catalog,bounds),/unknown candidate/);
 assert.throws(()=>evaluateCandidatePortfolioWalkForward(draws,{...p,candidateIds:[p.candidateIds[0],p.candidateIds[0]]},catalog,bounds),/unique/);
});

test("phase splitter rejects gaps and invalid fractions",()=>{
 const broken=draws.map(d=>({...d}));broken.splice(210,1);
 assert.throws(()=>buildPortfolioPhaseBoundaries(broken),/contiguous/);
 assert.throws(()=>buildPortfolioPhaseBoundaries(draws,{discovery:0.8,validation:0.3}),/fractions/);
});

test("future outcomes cannot change earlier portfolio observations",()=>{
 const p=selectCandidatePortfolio("family-balanced",4,19,catalog),bounds=buildPortfolioPhaseBoundaries(draws);
 const a=evaluateCandidatePortfolioWalkForward(draws,p,catalog,bounds);
 const changed=draws.map((d,i)=>i>250?{...d,digits:[9,9,9,9,9] as Draw["digits"]}:d);
 const b=evaluateCandidatePortfolioWalkForward(changed,p,catalog,bounds);
 const early=(x:typeof a)=>x.phases.filter(p=>p.phase!=="holdout");
 assert.deepEqual(early(a),early(b));
});


test("holdout stability blocks cover the interval exactly and flag a short tail",()=>{
 const blocks=buildHoldoutStabilityBlocks([{phase:"holdout",firstDrawId:5200,lastDrawId:5258}],25,10);
 assert.deepEqual(blocks.map(b=>[b.firstDrawId,b.lastDrawId,b.partial,b.underpowered]),[
  [5200,5224,false,false],[5225,5249,false,false],[5250,5258,true,true]
 ]);
 assert.equal(blocks.reduce((n,b)=>n+b.lastDrawId-b.firstDrawId+1,0),59);
 assert.throws(()=>buildHoldoutStabilityBlocks([{phase:"holdout",firstDrawId:1,lastDrawId:5}],1),/block size/);
});

test("holdout stability reports common blocks, eligible denominators and coverage separately",()=>{
 const p=selectCandidatePortfolio("family-balanced",4,19,catalog);
 const bounds=[{phase:"holdout" as const,firstDrawId:5200,lastDrawId:5259}];
 const report=evaluateCandidatePortfolioWalkForward(draws,p,catalog,bounds);
 assert.deepEqual(report.stabilityBlocks.map(b=>[b.firstDrawId,b.lastDrawId,b.partial]),[
  [5200,5224,false],[5225,5249,false],[5250,5259,true]
 ]);
 for(const block of report.stabilityBlocks){
  assert.equal(block.signalDraws+block.skipped,block.candidateCount*(block.lastDrawId-block.firstDrawId+1));
  assert.equal(block.coverage,block.signalDraws/(block.candidateCount*(block.lastDrawId-block.firstDrawId+1)));
  assert.ok(block.rate>=0&&block.rate<=1);
 }
 assert.equal(report.stability?.blockCount,3);
 assert.ok((report.stability?.rateStdDev??-1)>=0);
});

test("future outcomes cannot alter earlier holdout stability blocks",()=>{
 const p=selectCandidatePortfolio("family-balanced",4,19,catalog);
 const bounds=[{phase:"holdout" as const,firstDrawId:5200,lastDrawId:5259}];
 const a=evaluateCandidatePortfolioWalkForward(draws,p,catalog,bounds);
 const changed=draws.map(d=>d.drawId>=5225?{...d,digits:[9,9,9,9,9] as Draw["digits"]}:d);
 const b=evaluateCandidatePortfolioWalkForward(changed,p,catalog,bounds);
 assert.deepEqual(a.stabilityBlocks[0],b.stabilityBlocks[0]);
});
