/** Phase 48: deterministic descriptive state transitions over dossier snapshots. */
import type {EvidenceDossier,EvidenceSnapshot} from "./evidence-dossier";
export type TrackingState="first-observation"|"unchanged"|"classification-changed"|"support-increased"|"support-decreased"|"classification-and-support-changed";
export interface HypothesisTracking {candidateKey:string;state:TrackingState;previous:EvidenceSnapshot|null;current:EvidenceSnapshot|null;resolvedDelta:number|null;classificationChanged:boolean;integrity:"clean"|"empty-history"|"candidate-mismatch";note:string;}
export function trackDossier(dossier:EvidenceDossier):HypothesisTracking{
 const h=dossier.history;const current=dossier.current??(h.length?h[h.length-1]:null);const previous=h.length>1?h[h.length-2]:null;
 if(!current)return{candidateKey:dossier.candidateKey,state:"first-observation",previous:null,current:null,resolvedDelta:null,classificationChanged:false,integrity:"empty-history",note:"No snapshots yet; no state inferred."};
 if(current.candidateKey!==dossier.candidateKey||h.some(x=>x.candidateKey!==dossier.candidateKey))return{candidateKey:dossier.candidateKey,state:"first-observation",previous,current,resolvedDelta:null,classificationChanged:false,integrity:"candidate-mismatch",note:"Snapshot candidate identity mismatch; transition blocked."};
 if(!previous)return{candidateKey:dossier.candidateKey,state:"first-observation",previous:null,current,resolvedDelta:null,classificationChanged:false,integrity:"clean",note:"Initial assessment; no prior state for comparison."};
 const classificationChanged=previous.classification!==current.classification;const resolvedDelta=current.resolved-previous.resolved;
 let state:TrackingState;
 if(classificationChanged&&resolvedDelta!==0)state="classification-and-support-changed";
 else if(classificationChanged)state="classification-changed";
 else if(resolvedDelta>0)state="support-increased";
 else if(resolvedDelta<0)state="support-decreased";
 else state="unchanged";
 const note=classificationChanged?"Classification changed; this is a descriptive state transition, not a signal of predictability.":resolvedDelta>0?"Resolved sample count increased; classification remained the same.":resolvedDelta<0?"Resolved sample count decreased; check report scope and data integrity.":"No classification or resolved-count change.";
 return{candidateKey:dossier.candidateKey,state,previous,current,resolvedDelta,classificationChanged,integrity:"clean",note};
}
