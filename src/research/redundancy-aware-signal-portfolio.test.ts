import {test} from "node:test";
import assert from "node:assert/strict";
import {selectRedundancyAwareSignalPortfolio,compareRedundancySignalPortfolios} from "./redundancy-aware-signal-portfolio";
const signals=[{signalId:"A",utility:9},{signalId:"B",utility:8},{signalId:"C",utility:7},{signalId:"D",utility:6},{signalId:"E",utility:5}];
const groups={empiricalGroups:[["A","B","C"]],structuralGroups:[["A","B"],["D","E"]]};
test("diversity selection avoids a same-group lower-utility member when possible",()=>{
 const rank=selectRedundancyAwareSignalPortfolio("utility-ranked",3,signals,groups);
 const diverse=selectRedundancyAwareSignalPortfolio("empirical-diversity",3,signals,groups,7,4);
 assert.deepEqual(rank.selectedSignalIds,["A","B","C"]);
 assert.equal(diverse.metrics.empiricalGroupedCount,1);
 assert.ok(diverse.metrics.meanUtility<=rank.metrics.meanUtility);
});
test("structural and empirical grouping remain distinct metrics",()=>{
 const result=selectRedundancyAwareSignalPortfolio("structural-diversity",3,signals,groups);
 assert.equal(result.metrics.empiricalGroupedCount,2);
 assert.equal(result.metrics.structuralGroupedCount,3);
});
test("random controls reproducible and size-bounded",()=>{
 const a=selectRedundancyAwareSignalPortfolio("random",3,signals,groups,22);
 const b=selectRedundancyAwareSignalPortfolio("random",3,signals,groups,22);
 assert.deepEqual(a.selectedSignalIds,b.selectedSignalIds);
 assert.equal(a.selectedSignalIds.length,3);
});
test("comparison repeats random seeds and single deterministic strategies",()=>{
 const rows=compareRedundancySignalPortfolios([2],signals,groups,[1,2,3]);
 assert.equal(rows.length,6);
});
test("reject invalid input",()=>{
 assert.throws(()=>selectRedundancyAwareSignalPortfolio("utility-ranked",2,signals,{empiricalGroups:[["Z"]],structuralGroups:[]}));
 assert.throws(()=>selectRedundancyAwareSignalPortfolio("utility-ranked",2,signals,groups,1,-1));
});
