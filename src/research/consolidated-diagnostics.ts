import {assessHistoryQuality} from "./history-quality";
import {assessEligibility,type EligibilityConfig} from "./eligibility";
import {assessResearchPriority} from "./research-priority";
import {assessDecisionRobustness} from "./decision-robustness";
import {assessRankStability} from "./rank-stability";
import {assessTemporalRankStability} from "./temporal-rank-stability";
import {assessDegradationRecovery} from "./degradation-recovery";
export type DiagnosticStatus="OK"|"REVISAR"|"PROBLEMA"|"INSUFICIENTE";
export type DiagnosticRow={candidateKey:string;status:DiagnosticStatus;qualityScore:number;qualityLabel:string;eligibility:string;priorityScore:number;robustness:string;rankSensitivity:string;temporal:string;degradation:string;findings:string[]};
type Snap={candidateKey:string;recordedAt:string;classification:string;resolved:number};type Input={candidateKey:string;history:Snap[]};
export type ConsolidatedDiagnostics={rows:DiagnosticRow[];summary:{total:number;ok:number;review:number;issues:number;insufficient:number}};
export function buildConsolidatedDiagnostics(records:Input[],config:EligibilityConfig={minimumQuality:75,minimumRevisions:3}):ConsolidatedDiagnostics{
 const q=records.map(r=>assessHistoryQuality({candidateKey:r.candidateKey,history:r.history}));
 const elig=records.map(r=>assessEligibility({candidateKey:r.candidateKey,history:r.history},config));
 const prio=records.map(r=>assessResearchPriority(r,config));
 const rob=assessDecisionRobustness(records),rank=assessRankStability(records),temp=assessTemporalRankStability(records),deg=assessDegradationRecovery(records);
 const rows=records.map((r,i)=>{const quality=q[i],gate=elig[i],p=prio[i],rr=rob.rows.find(x=>x.candidateKey===r.candidateKey),rk=rank.rows.find(x=>x.candidateKey===r.candidateKey),tr=temp.rows.find(x=>x.candidateKey===r.candidateKey),dr=deg.rows.find(x=>x.candidateKey===r.candidateKey);const findings:string[]=[];
 if(quality.invalidDates||quality.outOfOrder||quality.duplicateDates||quality.identityMismatch)findings.push("Integridad estructural requiere corrección");
 if(quality.shallow)findings.push("Historial corto");
 if(gate.status==="blocked")findings.push("Gate bloqueado");else if(gate.status==="review")findings.push("Gate en revisión");
 if(rr?.fragileEligible)findings.push("Elegibilidad sensible a umbrales");if(rr&&!rr.robustEligible&&!rr.fragileEligible)findings.push("No elegible en cuadrícula");
 if(rk&&rk.stabilityScore<50)findings.push("Ranking sensible a configuración");if(tr&&tr.periodsPresent>=2&&tr.temporalStability<50)findings.push("Ranking temporal volátil");
 if(dr&&["watch","degraded","recovering"].includes(dr.state))findings.push("Cambio de score: "+dr.state);
 let status:DiagnosticStatus;if(quality.records<2)status="INSUFICIENTE";else if(quality.invalidDates||quality.outOfOrder||quality.duplicateDates||quality.identityMismatch||gate.status==="blocked"||dr?.state==="degraded")status="PROBLEMA";else if(gate.status==="review"||quality.shallow||rr?.fragileEligible||rk?.stabilityScore<50||tr?.temporalStability<50||["watch","recovering"].includes(dr?.state??""))status="REVISAR";else status="OK";
 return{candidateKey:r.candidateKey,status,qualityScore:quality.score,qualityLabel:quality.label,eligibility:gate.status,priorityScore:p.priorityScore,robustness:rr?.robustEligible?"Robusta":rr?.fragileEligible?"Frágil":"No elegible",rankSensitivity:rk?rk.stabilityScore+"/100":"N/D",temporal:tr&&tr.periodsPresent>=2?tr.temporalStability+"/100":"N/D",degradation:dr?.state??"N/D",findings};});
 const order:Record<DiagnosticStatus,number>={PROBLEMA:0,REVISAR:1,INSUFICIENTE:2,OK:3};rows.sort((a,b)=>order[a.status]-order[b.status]||a.candidateKey.localeCompare(b.candidateKey));
 const count=(s:DiagnosticStatus)=>rows.filter(r=>r.status===s).length;return{rows,summary:{total:rows.length,ok:count("OK"),review:count("REVISAR"),issues:count("PROBLEMA"),insufficient:count("INSUFICIENTE")}};
}