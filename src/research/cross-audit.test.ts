import {describe,it,expect} from "vitest";
import {auditConsolidatedDiagnostics} from "./cross-audit";
const report={rows:[{candidateKey:"a",status:"OK" as const,qualityScore:80,qualityLabel:"Alta",eligibility:"eligible",priorityScore:75,robustness:"Robusta",rankSensitivity:"80/100",temporal:"70/100",degradation:"stable",findings:[]}],summary:{total:1,ok:1,review:0,issues:0,insufficient:0}};
describe("cross-audit",()=>{
 it("passes consistent output",()=>expect(auditConsolidatedDiagnostics(report).valid).toBe(true));
 it("detects summary mismatch",()=>expect(auditConsolidatedDiagnostics({...report,summary:{...report.summary,ok:0}}).issues.map(i=>i.code)).toContain("SUMMARY_MISMATCH"));
 it("flags contradictory OK rows",()=>expect(auditConsolidatedDiagnostics({...report,rows:[{...report.rows[0],eligibility:"review",findings:["needs review"]}]}).issues.map(i=>i.code)).toContain("OK_CONTRADICTION"));
 it("checks bounded scores",()=>expect(auditConsolidatedDiagnostics({...report,rows:[{...report.rows[0],priorityScore:101}]}).issues.map(i=>i.code)).toContain("PRIORITY_RANGE"));
 it("detects duplicate candidate keys",()=>expect(auditConsolidatedDiagnostics({...report,rows:[report.rows[0],report.rows[0]],summary:{total:2,ok:2,review:0,issues:0,insufficient:0}}).issues.map(i=>i.code)).toContain("DUPLICATE_KEY"));
});