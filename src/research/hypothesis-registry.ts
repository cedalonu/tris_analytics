/** Versioned experiment and hypothesis tracking for TRIS research. */
import type { Draw, Pos, PoolMethod, Evaluation } from "../research-core";
export type HypothesisStatus = "Exploratory"|"Validating"|"Provisionally validated"|"Active"|"Degraded"|"Discarded";
export interface Evidence { id:string; recordedAt:string; datasetVersion:string; split:"discovery"|"validation"|"holdout"|"prospective"; method:string; metric:string; value:number; baseline:number; sampleSize:number; notes?:string }
export interface Hypothesis { id:string; title:string; description:string; createdAt:string; updatedAt:string; status:HypothesisStatus; version:number; evidence:Evidence[]; rationale?:string; failureNotes?:string[] }
export interface ChronologicalSplit { discovery:Draw[]; validation:Draw[]; holdout:Draw[]; warnings:string[] }

/** Split in draw order; no random shuffle, so chronology remains intact. */
export function chronologicalSplit(draws:Draw[], discoveryFraction=.6, validationFraction=.2):ChronologicalSplit {
 const warnings:string[]=[]; const n=draws.length;
 if(discoveryFraction<=0||validationFraction<=0||discoveryFraction+validationFraction>=1) return {discovery:[],validation:[],holdout:[],warnings:["Fractions must be positive and sum to less than 1."]};
 const a=Math.floor(n*discoveryFraction),b=Math.floor(n*(discoveryFraction+validationFraction));
 if(a<1||b<=a||b>=n) warnings.push("Dataset too small for the requested chronological split.");
 return {discovery:draws.slice(0,a),validation:draws.slice(a,b),holdout:draws.slice(b),warnings};
}

/** Bonferroni adjusted alpha; use to guard a family of related tests. */
export function bonferroniAlpha(alpha:number,testCount:number):number { return testCount>0?alpha/testCount:0; }

/** Wilson score interval for a binomial rate; returns [low, high] in 0..1. */
export function wilsonInterval(successes:number,trials:number,z=1.96):[number,number] {
 if(trials<=0||successes<0||successes>trials)return [0,1];
 const p=successes/trials,z2=z*z,den=1+z2/trials,center=(p+z2/(2*trials))/den,half=z*Math.sqrt((p*(1-p)+z2/(4*trials))/trials)/den;
 return [Math.max(0,center-half),Math.min(1,center+half)];
}

/** Lifecycle transitions are intentionally explicit to preserve failed findings. */
const allowed:Record<HypothesisStatus,HypothesisStatus[]>={
 "Exploratory":["Validating","Discarded"], "Validating":["Provisionally validated","Discarded"],
 "Provisionally validated":["Active","Degraded","Discarded"], "Active":["Degraded","Discarded"],
 "Degraded":["Validating","Discarded"], "Discarded":[]
};
export function transitionHypothesis(h:Hypothesis,next:HypothesisStatus,note?:string,now=new Date().toISOString()):Hypothesis {
 if(!allowed[h.status].includes(next))throw new Error("Invalid hypothesis transition: "+h.status+" -> "+next);
 return {...h,status:next,updatedAt:now,version:h.version+1,failureNotes:note?[...(h.failureNotes||[]),note]:h.failureNotes};
}
export function appendEvidence(h:Hypothesis,e:Evidence):Hypothesis { return {...h,evidence:[...h.evidence,e],updatedAt:e.recordedAt,version:h.version+1}; }

/** Standard evidence record for a pool evaluation; never marks a hypothesis validated by itself. */
export function evaluationEvidence(id:string,recordedAt:string,datasetVersion:string,split:Evidence["split"],evaluation:Evaluation,notes?:string):Evidence {
 return {id,recordedAt,datasetVersion,split,method:evaluation.method+"; position="+evaluation.position+"; pool="+evaluation.size,metric:"hitRate",value:evaluation.hitRate,baseline:evaluation.uniformReference,sampleSize:evaluation.tested,notes};
}