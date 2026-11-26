import test from "node:test";
import assert from "node:assert/strict";
import {auditProspectiveFamilyConcordance} from "./prospective-family-concordance-audit";
import type {ProspectiveFamilyConcordance} from "./prospective-family-concordance";
const sample:ProspectiveFamilyConcordance={portfolioId:"test",firstTargetDrawId:100,lastObservedDrawId:139,families:[
 {family:"transition",candidateCount:4,expectedSignals:160,resolvedSignals:160,coveredDraws:40,coverage:1,meanDrawHitRate:.2,meanDrawBaselineRate:.2,meanDrawDifference:0,positiveDraws:10,negativeDraws:10,neutralDraws:20},
 {family:"pool-ranking",candidateCount:6,expectedSignals:240,resolvedSignals:240,coveredDraws:40,coverage:1,meanDrawHitRate:.2,meanDrawBaselineRate:.2,meanDrawDifference:0,positiveDraws:10,negativeDraws:10,neutralDraws:20}],
 drawValues:[],pairs:[{familyA:"transition",familyB:"pool-ranking",commonDraws:40,pearsonCorrelation:.1,sameDirectionDraws:18,oppositeDirectionDraws:12,neutralPairDraws:10,directionAgreement:.6}],interpretation:[]};
test("audit compares observed metrics against reproducible synthetic null envelopes",()=>{const a=auditProspectiveFamilyConcordance(sample,{replications:30,seed:44}),b=auditProspectiveFamilyConcordance(sample,{replications:30,seed:44});assert.deepEqual(a,b);assert.equal(a.sufficientSupport,true);assert.equal(a.nullScenarios.length,5);assert.ok(["below-null-envelope","inside-null-envelope","above-null-envelope"].includes(a.nullScenarios[0].observedCorrelationStatus));});
test("audit refuses to simulate when prospective overlap is too small",()=>{const a=auditProspectiveFamilyConcordance({...sample,pairs:[{...sample.pairs[0],commonDraws:12}]},{minimumDrawSupport:30,replications:10});assert.equal(a.sufficientSupport,false);assert.equal(a.nullScenarios.length,0);});
test("audit handles unavailable observed correlations",()=>{const a=auditProspectiveFamilyConcordance({...sample,pairs:[{...sample.pairs[0],pearsonCorrelation:null,directionAgreement:null}]},{replications:10});assert.equal(a.observedMeanPairwiseCorrelation,null);assert.equal(a.observedMeanDirectionAgreement,null);});
