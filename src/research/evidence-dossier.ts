/** Phase 47: append-only descriptive evidence dossier utilities. */
import type {EvidenceDecision} from "./evidence-classifier";
export interface EvidenceSnapshot {schema:"tris-evidence-snapshot-v1";recordedAt:string;sourceReportSchema:string;candidateKey:string;classification:EvidenceDecision["classification"];resolved:number;reasons:string[];limitations:string[];}
export interface EvidenceDossier {schema:"tris-evidence-dossier-v1";candidateKey:string;createdAt:string;history:EvidenceSnapshot[];current:EvidenceSnapshot|null;integrity:"clean"|"duplicate-snapshot"|"candidate-mismatch";}
export function createSnapshot(candidateKey:string,decision:EvidenceDecision,sourceReportSchema:string,recordedAt:string):EvidenceSnapshot{return{schema:"tris-evidence-snapshot-v1",recordedAt,sourceReportSchema,candidateKey,classification:decision.classification,resolved:decision.resolved,reasons:[...decision.reasons],limitations:[...decision.limitations]};}
export function appendEvidenceSnapshot(existing:EvidenceDossier|null,snapshot:EvidenceSnapshot):EvidenceDossier{
 if(existing&&existing.candidateKey!==snapshot.candidateKey)return{...existing,integrity:"candidate-mismatch"};
 const history=existing?.history??[];
 if(history.some(x=>x.recordedAt===snapshot.recordedAt&&x.sourceReportSchema===snapshot.sourceReportSchema))return{schema:"tris-evidence-dossier-v1",candidateKey:snapshot.candidateKey,createdAt:existing?.createdAt??snapshot.recordedAt,history,current:existing?.current??null,integrity:"duplicate-snapshot"};
 const next=[...history,snapshot].sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt));
 return{schema:"tris-evidence-dossier-v1",candidateKey:snapshot.candidateKey,createdAt:existing?.createdAt??snapshot.recordedAt,history:next,current:next[next.length-1],integrity:"clean"};
}
