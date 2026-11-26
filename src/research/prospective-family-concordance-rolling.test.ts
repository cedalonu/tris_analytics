import test from "node:test";
import assert from "node:assert/strict";
import type {ProspectiveFamilyConcordance} from "./prospective-family-concordance";
import {summarizeProspectiveFamilyConcordanceRolling} from "./prospective-family-concordance-rolling";

function fixture(last=30):ProspectiveFamilyConcordance {
  const drawValues:ProspectiveFamilyConcordance["drawValues"]=[];
  for(let drawId=1;drawId<=last;drawId++){
    const value=drawId-15;
    drawValues.push({drawId,family:"transition",candidateCount:2,resolvedCount:2,hitRate:.3,baselineRate:.2,meanDifference:value});
    drawValues.push({drawId,family:"pool-ranking",candidateCount:2,resolvedCount:2,hitRate:.3,baselineRate:.2,meanDifference:value});
  }
  return{portfolioId:"fixture",firstTargetDrawId:1,lastObservedDrawId:last,families:[],drawValues,pairs:[{familyA:"transition",familyB:"pool-ranking",commonDraws:last,pearsonCorrelation:1,sameDirectionDraws:last,oppositeDirectionDraws:0,neutralPairDraws:0,directionAgreement:1}],interpretation:[]};
}
test("rolling windows are full, overlap by configured step, and preserve concordance",()=>{
  const result=summarizeProspectiveFamilyConcordanceRolling(fixture(),{windowSize:10,stepSize:5,minimumDrawSupport:8});
  const pair=result.pairs[0];
  assert.equal(pair.windows.length,5);
  assert.deepEqual(pair.windows.map(w=>[w.startDrawId,w.endDrawId]),[[1,10],[6,15],[11,20],[16,25],[21,30]]);
  assert.equal(pair.supportedWindows,5);
  assert.equal(pair.positiveWindows,5);
  assert.equal(pair.negativeWindows,0);
  assert.equal(pair.meanCorrelation,1);
  assert.equal(pair.meanDirectionAgreement,1);
});
test("short horizon yields no incomplete rolling windows",()=>{
  const result=summarizeProspectiveFamilyConcordanceRolling(fixture(9),{windowSize:10,stepSize:5,minimumDrawSupport:8});
  assert.equal(result.pairs[0].windows.length,0);
});
test("missing family observations reduce common support without imputation",()=>{
  const observed=fixture(20);
  observed.drawValues=observed.drawValues.filter(v=>v.family!=="pool-ranking"||v.drawId%2===0);
  const result=summarizeProspectiveFamilyConcordanceRolling(observed,{windowSize:10,stepSize:5,minimumDrawSupport:8});
  assert.equal(result.pairs[0].windows[0].commonDraws,5);
  assert.equal(result.pairs[0].windows[0].status,"underpowered");
});
test("invalid rolling configuration is rejected",()=>{
  assert.throws(()=>summarizeProspectiveFamilyConcordanceRolling(fixture(),{windowSize:2}));
  assert.throws(()=>summarizeProspectiveFamilyConcordanceRolling(fixture(),{windowSize:10,stepSize:11}));
  assert.throws(()=>summarizeProspectiveFamilyConcordanceRolling(fixture(),{windowSize:10,minimumDrawSupport:11}));
});
