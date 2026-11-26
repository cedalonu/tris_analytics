import {assessEligibility,type EligibilityConfig,type EligibilityStatus} from "./eligibility";
import {assessHistoryQuality} from "./history-quality";
export type PriorityInput={candidateKey:string;history:Array<{candidateKey:string;recordedAt:string;classification:string;resolved:number}>};
export type PriorityResult={candidateKey:string;eligibility:EligibilityStatus;priorityScore:number;queue:"Prioridad alta"|"Prioridad media"|"Prioridad baja"|"Fuera de cola";quality:number;depth:number;stability:number;descriptor:number;notes:string[]};
/** Research workflow triage only. Score ranks review workload and is not predictive or evidence of lottery advantage. */
export function assessResearchPriority(input:PriorityInput,config?:EligibilityConfig):PriorityResult{
 const h=[...input.history].sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt));
 const e=assessEligibility({candidateKey:input.candidateKey,history:h},config);
 const q=assessHistoryQuality({candidateKey:input.candidateKey,history:h});
 const quality=q.score,depth=Math.min(100,h.length/8*100);
 const stable=h.length<2?0:h.slice(1).filter((s,i)=>s.classification===h[i].classification).length/(h.length-1)*100;
 const cl=h.at(-1)?.classification??"";
 const descriptors=cl==="favorable-observed"||cl==="unfavorable-observed"?70:cl==="neutral"?45:cl==="contradictory"?15:25;
 const score=Math.round(quality*.4+depth*.2+stable*.25+descriptors*.15);
 const notes=[`Calidad: ${quality}/100 (40%)`,`Profundidad: ${h.length} revisiones (20%; referencia 8)`,`Estabilidad descriptiva: ${Math.round(stable)}% (25%)`,`Descriptor actual: ${descriptors}/100 (15%; escala de triage)`];
 if(e.status!=="eligible")notes.push(`Elegibilidad ${e.status}: ${e.reasons.join("; ")}`);
 const queue=e.status!=="eligible"?"Fuera de cola":score>=75?"Prioridad alta":score>=55?"Prioridad media":"Prioridad baja";
 return{candidateKey:input.candidateKey,eligibility:e.status,priorityScore:score,queue,quality,depth:Math.round(depth),stability:Math.round(stable),descriptor:descriptors,notes};
}