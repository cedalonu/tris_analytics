import {assessResearchPriority} from "./research-priority";
import type {EligibilityConfig} from "./eligibility";
export type DegradationState="insufficient"|"stable"|"watch"|"degraded"|"recovering"|"recovered";
export type DegradationReport={rows:Array<{candidateKey:string;state:DegradationState;latestScore:number|null;baselineScore:number|null;peakScore:number|null;troughScore:number|null;dropFromPeak:number|null;alertCount:number;observations:number;events:Array<{at:string;from:DegradationState;to:DegradationState;score:number;reason:string}>}>;summary:{observations:number;watch:number;degraded:number;recovering:number;recovered:number;insufficient:number}};
type Snap={candidateKey:string;recordedAt:string;classification:string;resolved:number};type Input={candidateKey:string;history:Snap[]};
/** Descriptive score-change monitoring only; does not measure draw accuracy or predictive power. */
export function assessDegradationRecovery(records:Input[],config:EligibilityConfig={minimumQuality:75,minimumRevisions:3}):DegradationReport{
 const rows=records.map(record=>{
  const h=[...record.history].sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt));
  if(h.length<2)return{candidateKey:record.candidateKey,state:"insufficient" as DegradationState,latestScore:h.length?assessResearchPriority({candidateKey:record.candidateKey,history:h},config).priorityScore:null,baselineScore:null,peakScore:null,troughScore:null,dropFromPeak:null,alertCount:0,observations:h.length,events:[]};
  const scores=h.map((snap,i)=>assessResearchPriority({candidateKey:record.candidateKey,history:h.slice(0,i+1)},config).priorityScore);
  const baseline=scores[0],peak=Math.max(...scores),trough=Math.min(...scores),events=[] as Array<{at:string;from:DegradationState;to:DegradationState;score:number;reason:string}>;
  let state:DegradationState="stable",downStreak=0,low=baseline,runningPeak=baseline;
  for(let i=1;i<scores.length;i++){const score=scores[i],prev=scores[i-1];runningPeak=Math.max(runningPeak,score);const dropPeak=runningPeak-score;if(score<=prev-8)downStreak++;else downStreak=0;let next=state,reason="";
   if(state==="stable"&&(prev-score>=10||downStreak>=2)){next="watch";reason="Caída reciente del score (≥10) o dos descensos consecutivos";}
   if((state==="watch"||state==="stable")&&(dropPeak>=15||downStreak>=3)){next="degraded";reason="Descenso persistente o ≥15 puntos bajo el máximo";}
   if(state==="degraded"&&score>=low+10){next="recovering";reason="Mejora ≥10 puntos desde el mínimo";}
   if(state==="recovering"&&score>=baseline-5){next="recovered";reason="Score vuelve a ±5 puntos de la referencia inicial";}
   if(score<low)low=score;
   if(next!==state){events.push({at:h[i].recordedAt,from:state,to:next,score,reason});state=next;}
  }
  const drop=peak-scores[scores.length-1];
  return{candidateKey:record.candidateKey,state,latestScore:scores.at(-1)??null,baselineScore:baseline,peakScore:peak,troughScore:trough,dropFromPeak:drop,alertCount:events.length,observations:h.length,events};
 }).sort((a,b)=>b.alertCount-a.alertCount||a.candidateKey.localeCompare(b.candidateKey));
 return{rows,summary:{observations:rows.length,watch:rows.filter(r=>r.state==="watch").length,degraded:rows.filter(r=>r.state==="degraded").length,recovering:rows.filter(r=>r.state==="recovering").length,recovered:rows.filter(r=>r.state==="recovered").length,insufficient:rows.filter(r=>r.state==="insufficient").length}};
}