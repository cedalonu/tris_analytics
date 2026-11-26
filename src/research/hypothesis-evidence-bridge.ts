/** Connects the hypothesis registry to the explicit evidence readiness gate. */
import type { Hypothesis } from "./hypothesis-registry";
import { evaluateSignalEvidence, type SignalEvidenceReport, type MetricDirection } from "./signal-evidence-evaluator";
export interface HypothesisEvidenceContext {
 expectedDraws:number; observedDraws:number; direction:MetricDirection;
 integrityValid:boolean; integrityIssues:string[];
 temporalBlocks:number; directionConsistentBlocks:number;
 sensitivityRuns:number; consistentSensitivityRuns:number;
 independentFamilies:number; adjustedForMultipleTests:boolean;
}
/** Uses the latest prospective registry entry only; historical evidence is not promoted. */
export function evaluateRegisteredHypothesis(hypothesis:Hypothesis,context:HypothesisEvidenceContext):SignalEvidenceReport {
 const prospective=[...hypothesis.evidence].filter(e=>e.split==="prospective").sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt));
 const latest=prospective.at(-1);
 return evaluateSignalEvidence({id:hypothesis.id,name:hypothesis.title,origin:latest?"prospective":"historical",integrity:{valid:context.integrityValid,issues:context.integrityIssues},data:{expected:context.expectedDraws,observed:context.observedDraws,resolved:latest?.sampleSize??0},comparison:{metric:latest?.metric??"unavailable",signalValue:latest?.value??null,baselineValue:latest?.baseline??null,direction:context.direction,adjustedForMultipleTests:context.adjustedForMultipleTests},temporal:{blocks:context.temporalBlocks,directionConsistentBlocks:context.directionConsistentBlocks},sensitivity:{runs:context.sensitivityRuns,consistentRuns:context.consistentSensitivityRuns},independence:{familyCount:context.independentFamilies,notes:"Explicit context; no independence inferred from registry labels."}});
}
