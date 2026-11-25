import test from "node:test";
import assert from "node:assert/strict";
import {generateIntuitionCandidates} from "./intuition-candidate-generator";
import {createProspectivePortfolioManifest} from "./prospective-portfolio-monitor";
import {summarizeProspectiveFamilyConcordance} from "./prospective-family-concordance";
import type {FrozenForecast,ResolvedForecast} from "./intuition-prospective";

const catalog=generateIntuitionCandidates({modes:["full5"],lags:[1],positions:[0],absenceThresholds:[1],poolMethods:["frequency"],poolSizes:[2],windows:[20]});
const manifest=createProspectivePortfolioManifest(catalog,{createdAt:"2026-11-25T12:00:00.000Z",firstTargetDrawId:9001,size:4,method:"family-balanced",blockSize:5});
function makeForecast(candidateId:string,drawId:number,id:string):FrozenForecast {
 const c=catalog.find(x=>x.id===candidateId)!;
 return{schemaVersion:1,forecastId:id,candidateId,family:c.family,frozenConfig:c.frozenConfig,targetDrawId:drawId,generatedAt:"2026-11-25T12:00:00.000Z",historyThroughDrawId:drawId-1,historySha256:"a".repeat(64),prediction:["1"],baseline:["2"]};
}
function makeResult(f:FrozenForecast,hit:boolean,base:boolean):ResolvedForecast {
 return{...f,resolvedAt:"2026-11-25T13:00:00.000Z",actual:"1",candidateHit:hit,baselineHit:base};
}
test("family concordance averages paired differences within each contest before across contests",()=>{
 const forecasts:FrozenForecast[]=[],results:ResolvedForecast[]=[];
 const [a,b,c,d]=manifest.candidateIds;
 for(const drawId of [9001,9002,9003]){
  const rows=[makeForecast(a,drawId,a+drawId),makeForecast(b,drawId,b+drawId),makeForecast(c,drawId,c+drawId),makeForecast(d,drawId,d+drawId)];
  forecasts.push(...rows);
  for(let i=0;i<rows.length;i++)results.push(makeResult(rows[i],drawId!==9002,drawId===9002));
 }
 const summary=summarizeProspectiveFamilyConcordance(manifest,catalog,forecasts,results,9003);
 assert.equal(summary.families.length,4);
 assert.equal(summary.families.every(x=>x.resolvedSignals===3),true);
 assert.equal(summary.drawValues.length,12);
 assert.equal(summary.pairs.length,6);
 assert.equal(summary.pairs[0].sameDirectionDraws+summary.pairs[0].oppositeDirectionDraws+summary.pairs[0].neutralPairDraws,3);
 assert.equal(summary.families.every(x=>x.meanDrawDifference===1/3),true);
});
test("family concordance excludes unresolved forecasts and reports coverage",()=>{
 const [id]=manifest.candidateIds,f=makeForecast(id,9001,"only");
 const summary=summarizeProspectiveFamilyConcordance(manifest,catalog,[f],[],9002);
 const family=summary.families.find(x=>x.family===catalog.find(c=>c.id===id)!.family)!;
 assert.equal(family.resolvedSignals,0);
 assert.equal(family.coverage,0);
 assert.equal(family.coveredDraws,0);
});
test("family concordance rejects mismatched and duplicate frozen records",()=>{
 const [id]=manifest.candidateIds,f=makeForecast(id,9001,"dup");
 assert.throws(()=>summarizeProspectiveFamilyConcordance(manifest,catalog,[f,{...f}],[],9001),/duplicate forecast ID/);
 assert.throws(()=>summarizeProspectiveFamilyConcordance(manifest,catalog,[f],[{...makeResult(f,true,false),targetDrawId:9002}],9001),/no matching/);
});
