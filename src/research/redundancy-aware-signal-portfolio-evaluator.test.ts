import {test} from "node:test";import assert from "node:assert/strict";
import {selectRedundancyAwareSignalPortfolio} from "./redundancy-aware-signal-portfolio";
import {evaluateSignalPortfolio,runSignalPortfolioComparison} from "./redundancy-aware-signal-portfolio-evaluator";
const scores=[{signalId:"s1",utility:10},{signalId:"s2",utility:9},{signalId:"s3",utility:8}];
const groups={empiricalGroups:[["s1","s2"]],structuralGroups:[["s2","s3"]]};
const alerts=[{signalId:"s1",alerts:[{targetId:"1",alert:true},{targetId:"2",alert:false},{targetId:"3",alert:true},{targetId:"4",alert:false}]},{signalId:"s2",alerts:[{targetId:"1",alert:false},{targetId:"2",alert:true},{targetId:"3",alert:false},{targetId:"4",alert:false}]},{signalId:"s3",alerts:[{targetId:"1",alert:false},{targetId:"2",alert:false},{targetId:"3",alert:false},{targetId:"4",alert:true}]}];
const targets=[{targetId:"1",outcome:true,phase:"validation" as const},{targetId:"2",outcome:false,phase:"validation" as const},{targetId:"3",outcome:true,phase:"holdout" as const},{targetId:"4",outcome:false,phase:"holdout" as const}];
test("OR-combined portfolio reports precision, recall, baseline, and block chronology",()=>{
 const s=selectRedundancyAwareSignalPortfolio("utility-ranked",2,scores,groups);
 const r=evaluateSignalPortfolio(s,alerts,targets,2);
 assert.equal(r.metrics.length,2);assert.equal(r.metrics[0].alerts,2);assert.equal(r.metrics[0].hits,1);assert.equal(r.metrics[0].precision,.5);assert.equal(r.metrics[0].baselineRate,.5);
 assert.equal(r.blocks.length,2);assert.equal(r.blocks[0].firstTargetId,"1");assert.ok(r.warnings.length>=4);
});
test("rejects duplicate targets and incomplete selected-signal alert data",()=>{
 const s=selectRedundancyAwareSignalPortfolio("utility-ranked",2,scores,groups);
 assert.throws(()=>evaluateSignalPortfolio(s,alerts,[targets[0],targets[0]]));
 assert.throws(()=>evaluateSignalPortfolio(s,alerts.filter(a=>a.signalId!=="s2"),targets));
});
test("comparison produces fixed deterministic methods and random repetitions",()=>{
 const r=runSignalPortfolioComparison([1],scores,groups,alerts,targets,[1,2,3],1,2);
 assert.equal(r.length,6);assert.equal(r.filter(x=>x.selection.method==="random").length,3);
});
