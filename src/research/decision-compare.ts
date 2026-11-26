import {buildDecisionLog,type DecisionSnapshot} from "./decision-log";
import type {EligibilityConfig} from "./eligibility";
export type DecisionComparisonRow={candidateKey:string;baseline:{eligibility:string;queue:string;priorityScore:number};comparison:{eligibility:string;queue:string;priorityScore:number};changes:{eligibility:boolean;queue:boolean;priority:boolean};changeType:"unchanged"|"improved-gate"|"lost-gate"|"queue-change"|"score-change";};
export type DecisionComparison={baselineConfig:EligibilityConfig;comparisonConfig:EligibilityConfig;summary:{total:number;unchanged:number;eligibilityChanged:number;gainedEligibility:number;lostEligibility:number;queueChanged:number;scoreChanged:number;highPriorityGained:number;highPriorityLost:number};rows:DecisionComparisonRow[]};
export function compareDecisionConfigs(records:Array<{candidateKey:string;history:DecisionSnapshot[]}>,baseline:EligibilityConfig,comparison:EligibilityConfig):DecisionComparison{
 const a=buildDecisionLog(records,baseline),b=buildDecisionLog(records,comparison);
 const last=(events:typeof a)=>{const map=new Map<string,(typeof events)[number]>();for(const e of events)if(!map.has(e.candidateKey))map.set(e.candidateKey,e);return map;};
 const aa=last(a),bb=last(b),rows:DecisionComparisonRow[]=[];
 for(const key of [...new Set([...aa.keys(),...bb.keys()])].sort()){const x=aa.get(key),y=bb.get(key);if(!x||!y)continue;
 const eligibility=x.eligibility!==y.eligibility,queue=x.queue!==y.queue,score=x.priorityScore!==y.priorityScore;
 let changeType:DecisionComparisonRow["changeType"]="unchanged";
 if(x.eligibility!=="eligible"&&y.eligibility==="eligible")changeType="improved-gate";
 else if(x.eligibility==="eligible"&&y.eligibility!=="eligible")changeType="lost-gate";
 else if(queue)changeType="queue-change";
 else if(score)changeType="score-change";
 rows.push({candidateKey:key,baseline:{eligibility:x.eligibility,queue:x.queue,priorityScore:x.priorityScore},comparison:{eligibility:y.eligibility,queue:y.queue,priorityScore:y.priorityScore},changes:{eligibility,queue,priority:score},changeType});
 }
 const sum=(fn:(r:DecisionComparisonRow)=>boolean)=>rows.filter(fn).length;
 return{baselineConfig:{...baseline},comparisonConfig:{...comparison},summary:{total:rows.length,unchanged:sum(r=>r.changeType==="unchanged"),eligibilityChanged:sum(r=>r.changes.eligibility),gainedEligibility:sum(r=>r.changeType==="improved-gate"),lostEligibility:sum(r=>r.changeType==="lost-gate"),queueChanged:sum(r=>r.changes.queue),scoreChanged:sum(r=>r.changes.priority),highPriorityGained:sum(r=>r.baseline.queue!=="Prioridad alta"&&r.comparison.queue==="Prioridad alta"),highPriorityLost:sum(r=>r.baseline.queue==="Prioridad alta"&&r.comparison.queue!=="Prioridad alta")},rows};
}