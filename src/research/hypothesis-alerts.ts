/** Phase 50: descriptive alert events, deterministic and audit-friendly. */
import {createHash} from "node:crypto";
import type {EvidenceDossier,EvidenceSnapshot} from "./evidence-dossier";
export type AlertType="classification-change"|"support-drop"|"support-growth"|"protocol-change"|"duplicate-timestamp"|"candidate-integrity";
export interface HypothesisAlert {eventId:string;candidateKey:string;type:AlertType;recordedAt:string;from:EvidenceSnapshot|null;to:EvidenceSnapshot|null;severity:"info"|"review";message:string;}
const id=(s:string)=>createHash("sha256").update(s).digest("hex").slice(0,24);
export function buildHypothesisAlerts(d:EvidenceDossier):HypothesisAlert[]{
 const out:HypothesisAlert[]=[];const h=[...d.history].sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt));
 const add=(type:AlertType,at:string,from:EvidenceSnapshot|null,to:EvidenceSnapshot|null,severity:"info"|"review",message:string)=>{const key=[d.candidateKey,type,at,from?.recordedAt??"",to?.recordedAt??"",from?.sourceReportSchema??"",to?.sourceReportSchema??""].join("|");out.push({eventId:id(key),candidateKey:d.candidateKey,type,recordedAt:at,from,to,severity,message});};
 if(d.integrity!=="clean")add("candidate-integrity",d.current?.recordedAt??d.createdAt,null,d.current,"review","Dossier integrity is not clean; alert transitions require review.");
 for(let i=1;i<h.length;i++){const a=h[i-1],b=h[i];
 if(a.candidateKey!==d.candidateKey||b.candidateKey!==d.candidateKey){add("candidate-integrity",b.recordedAt,a,b,"review","Candidate identity mismatch; event comparison flagged.");continue;}
 if(a.recordedAt===b.recordedAt)add("duplicate-timestamp",b.recordedAt,a,b,"review","Multiple snapshots share a timestamp; chronology is ambiguous.");
 if(a.sourceReportSchema!==b.sourceReportSchema)add("protocol-change",b.recordedAt,a,b,"review","Source report schema changed; treat as protocol/version transition.");
 if(a.classification!==b.classification)add("classification-change",b.recordedAt,a,b,"info",`Classification changed: ${a.classification} → ${b.classification}; descriptive only.`);
 const delta=b.resolved-a.resolved;
 if(delta<0)add("support-drop",b.recordedAt,a,b,"review",`Resolved count decreased by ${Math.abs(delta)}; investigate report scope or ledger integrity.`);
 else if(delta>=20&&delta/Math.max(1,a.resolved)>=.25)add("support-growth",b.recordedAt,a,b,"info",`Resolved count increased by ${delta} (≥20 and ≥25%); not evidence of improved predictability.`);
 }
 return out;
}
