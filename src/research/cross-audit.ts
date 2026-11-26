import type {ConsolidatedDiagnostics,DiagnosticStatus} from "./consolidated-diagnostics";
export type AuditSeverity="error"|"warning";
export type AuditIssue={code:string;severity:AuditSeverity;candidateKey?:string;message:string};
export type CrossAudit={valid:boolean;checkedRows:number;issues:AuditIssue[];summary:{errors:number;warnings:number}};
const statusOrder:Record<DiagnosticStatus,number>={PROBLEMA:0,REVISAR:1,INSUFICIENTE:2,OK:3};
/** Cross-checks the consolidated output itself; it does not recompute evidence or imply predictive validity. */
export function auditConsolidatedDiagnostics(report:ConsolidatedDiagnostics):CrossAudit{
 const issues:AuditIssue[]=[];
 const keys=new Set<string>();
 for(const row of report.rows){
  if(keys.has(row.candidateKey))issues.push({code:"DUPLICATE_KEY",severity:"error",candidateKey:row.candidateKey,message:"Candidate key appears more than once."});
  keys.add(row.candidateKey);
  if(!Number.isFinite(row.qualityScore)||row.qualityScore<0||row.qualityScore>100)issues.push({code:"QUALITY_RANGE",severity:"error",candidateKey:row.candidateKey,message:"Quality score outside 0–100 or non-finite."});
  if(!Number.isFinite(row.priorityScore)||row.priorityScore<0||row.priorityScore>100)issues.push({code:"PRIORITY_RANGE",severity:"error",candidateKey:row.candidateKey,message:"Priority score outside 0–100 or non-finite."});
  if(row.status==="OK"&&(row.eligibility!=="eligible"||row.findings.length>0))issues.push({code:"OK_CONTRADICTION",severity:"error",candidateKey:row.candidateKey,message:"OK row has review/block status or findings."});
  if(row.status==="PROBLEMA"&&row.findings.length===0)issues.push({code:"ISSUE_WITHOUT_FINDING",severity:"warning",candidateKey:row.candidateKey,message:"Problem status has no explicit finding."});
  if(row.status==="INSUFICIENTE"&&row.qualityLabel!=="Baja")issues.push({code:"INSUFFICIENT_LABEL",severity:"warning",candidateKey:row.candidateKey,message:"Insufficient status but quality label is not low."});
  if(row.eligibility==="blocked"&&row.status!=="PROBLEMA")issues.push({code:"BLOCKED_STATUS",severity:"error",candidateKey:row.candidateKey,message:"Blocked eligibility is not reflected as problem status."});
 }
 const tally={total:report.rows.length,ok:report.rows.filter(r=>r.status==="OK").length,review:report.rows.filter(r=>r.status==="REVISAR").length,issues:report.rows.filter(r=>r.status==="PROBLEMA").length,insufficient:report.rows.filter(r=>r.status==="INSUFICIENTE").length};
 for(const [k,v] of Object.entries(tally))if(report.summary[k as keyof typeof tally]!==v)issues.push({code:"SUMMARY_MISMATCH",severity:"error",message:`Summary field ${k} is inconsistent with rows.`});
 return{valid:issues.every(i=>i.severity!=="error"),checkedRows:report.rows.length,issues,summary:{errors:issues.filter(i=>i.severity==="error").length,warnings:issues.filter(i=>i.severity==="warning").length}};
}