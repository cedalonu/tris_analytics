/**
 * Transparent evidence gate for research signals.
 * This module reports readiness blockers; it never creates predictive claims
 * or auto-promotes hypotheses.
 */
export type EvidenceOrigin = "historical"|"synthetic"|"prospective";
export type SignalEvidenceState = "exploratory"|"pending"|"validating"|"validation-ready"|"rejected";
export type MetricDirection = "higher-is-better"|"lower-is-better";
export interface SignalEvidenceInput {
 id:string; name:string; origin:EvidenceOrigin;
 integrity:{valid:boolean;issues:string[]};
 data:{expected:number;observed:number;resolved:number};
 comparison:{metric:string;signalValue:number|null;baselineValue:number|null;direction:MetricDirection;adjustedForMultipleTests:boolean};
 temporal:{blocks:number;directionConsistentBlocks:number};
 sensitivity:{runs:number;consistentRuns:number};
 independence:{familyCount:number;notes?:string};
}
export interface SignalEvidenceConfig {
 minCoverage:number; minResolved:number; minBlocks:number; minSensitivityConsistency:number; minIndependentFamilies:number;
}
export interface SignalEvidenceReport {
 id:string;name:string;origin:EvidenceOrigin;state:SignalEvidenceState;
 coverage:number;resolved:number;baselineComparison:number|null;
 temporalConsistency:number|null;sensitivityConsistency:number|null;independentFamilies:number;
 blockers:string[];limitations:string[];
}
const defaults:SignalEvidenceConfig={minCoverage:0.8,minResolved:100,minBlocks:5,minSensitivityConsistency:0.8,minIndependentFamilies:2};
function finiteOrNull(v:number|null):number|null{return v!==null&&Number.isFinite(v)?v:null;}
export function evaluateSignalEvidence(input:SignalEvidenceInput,config:Partial<SignalEvidenceConfig>={}):SignalEvidenceReport {
 const c={...defaults,...config};
 if(!input.id.trim()||!input.name.trim())throw new Error("signal id and name required");
 if(!Number.isFinite(c.minCoverage)||c.minCoverage<0||c.minCoverage>1)throw new Error("minCoverage must be 0..1");
 if(!Number.isInteger(c.minResolved)||c.minResolved<1||!Number.isInteger(c.minBlocks)||c.minBlocks<1||!Number.isInteger(c.minIndependentFamilies)||c.minIndependentFamilies<1)throw new Error("thresholds must be positive integers");
 if(!Number.isFinite(c.minSensitivityConsistency)||c.minSensitivityConsistency<0||c.minSensitivityConsistency>1)throw new Error("minSensitivityConsistency must be 0..1");
 const {expected,observed,resolved}=input.data;
 if(!Number.isInteger(expected)||expected<1||!Number.isInteger(observed)||observed<0||observed>expected||!Number.isInteger(resolved)||resolved<0||resolved>observed)throw new Error("invalid data counts");
 if(input.temporal.blocks<0||input.temporal.directionConsistentBlocks<0||input.temporal.directionConsistentBlocks>input.temporal.blocks)throw new Error("invalid temporal counts");
 if(input.sensitivity.runs<0||input.sensitivity.consistentRuns<0||input.sensitivity.consistentRuns>input.sensitivity.runs)throw new Error("invalid sensitivity counts");
 if(input.independence.familyCount<0||!Number.isInteger(input.independence.familyCount))throw new Error("invalid family count");
 const coverage=observed/expected, baselineComparison=finiteOrNull(input.comparison.signalValue)&&finiteOrNull(input.comparison.baselineValue)?(input.comparison.direction==="higher-is-better"?input.comparison.signalValue-input.comparison.baselineValue:input.comparison.baselineValue-input.comparison.signalValue):null;
 const temporalConsistency=input.temporal.blocks?input.temporal.directionConsistentBlocks/input.temporal.blocks:null;
 const sensitivityConsistency=input.sensitivity.runs?input.sensitivity.consistentRuns/input.sensitivity.runs:null;
 const blockers:string[]=[];
 if(!input.integrity.valid)blockers.push("data integrity validation failed");
 if(input.integrity.issues.length)blockers.push("integrity issues require resolution");
 if(coverage<c.minCoverage)blockers.push("data coverage below threshold");
 if(resolved<c.minResolved)blockers.push("resolved sample below threshold");
 if(baselineComparison===null)blockers.push("signal and baseline comparison unavailable");
 else if(baselineComparison<=0)blockers.push("no positive improvement versus baseline");
 if(!input.comparison.adjustedForMultipleTests)blockers.push("multiple-testing adjustment not documented");
 if(input.temporal.blocks<c.minBlocks||temporalConsistency===null||temporalConsistency<0.6)blockers.push("temporal persistence evidence insufficient");
 if(sensitivityConsistency===null||sensitivityConsistency<c.minSensitivityConsistency)blockers.push("parameter sensitivity is unstable or not assessed");
 if(input.independence.familyCount<c.minIndependentFamilies)blockers.push("independent method-family support insufficient");
 let state:SignalEvidenceState;
 if(!input.integrity.valid)state="rejected";
 else if(input.origin!=="prospective")state="exploratory";
 else if(resolved<c.minResolved||coverage<c.minCoverage||baselineComparison===null||temporalConsistency===null||sensitivityConsistency===null)state="pending";
 else if(blockers.length)state="validating";
 else state="validation-ready";
 return {id:input.id,name:input.name,origin:input.origin,state,coverage,resolved,baselineComparison,temporalConsistency,sensitivityConsistency,independentFamilies:input.independence.familyCount,blockers,limitations:[
  "La evaluación aplica umbrales de evidencia explícitos; no calcula probabilidad de ganar ni recomienda jugadas.",
  "validation-ready significa que los requisitos de revisión se cumplen, no que la hipótesis esté demostrada o tenga ventaja futura.",
  "El resultado depende de la calidad de los datos, el baseline congelado, el plan de pruebas y la definición de familia independiente.",
  "Histórico y simulación se mantienen exploratorios; solo datos prospectivos resueltos pueden superar la compuerta de validación."
 ]};
}
