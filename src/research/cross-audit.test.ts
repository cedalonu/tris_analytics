import test from "node:test";import assert from "node:assert/strict";
import {auditConsolidatedDiagnostics} from "./cross-audit";
const report={rows:[{candidateKey:"a",status:"OK" as const,qualityScore:80,qualityLabel:"Alta",eligibility:"eligible",priorityScore:75,robustness:"Robusta",rankSensitivity:"80/100",temporal:"70/100",degradation:"stable",findings:[]}],summary:{total:1,ok:1,review:0,issues:0,insufficient:0}};
test("passes consistent output",()=>assert.equal(auditConsolidatedDiagnostics(report).valid,true));
test("detects summary mismatch",()=>assert.ok(auditConsolidatedDiagnostics({...report,summary:{...report.summary,ok:0}}).issues.some(i=>i.code==="SUMMARY_MISMATCH")));
test("flags contradictory OK rows",()=>assert.ok(auditConsolidatedDiagnostics({...report,rows:[{...report.rows[0],eligibility:"review",findings:["needs review"]}]}).issues.some(i=>i.code==="OK_CONTRADICTION")));
test("checks bounded scores",()=>assert.ok(auditConsolidatedDiagnostics({...report,rows:[{...report.rows[0],priorityScore:101}]}).issues.some(i=>i.code==="PRIORITY_RANGE")));
test("detects duplicate keys",()=>assert.ok(auditConsolidatedDiagnostics({...report,rows:[report.rows[0],report.rows[0]],summary:{total:2,ok:2,review:0,issues:0,insufficient:0}}).issues.some(i=>i.code==="DUPLICATE_KEY")));
