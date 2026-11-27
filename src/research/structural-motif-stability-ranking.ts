import type {ExperimentRecord} from "./structural-motif-experiment-ledger";
import type {SnapshotFileMap} from "./structural-motif-experiment-snapshot-comparison";
import {analyzeFindingConsensus} from "./structural-motif-finding-consensus";
import {analyzeFindingPersistence} from "./structural-motif-finding-persistence";
import {analyzeEvidenceEvolution} from "./structural-motif-evidence-evolution";
export type StabilityTier="high-documentary-stability"|"repeated-but-not-conclusive"|"contradictory-or-changing"|"context-changed"|"limited-evidence";
export type StabilityRankRow={rank:number;family:string;position:string;tier:StabilityTier;consensus:string|null;evolution:string|null;persistentPhases:number;phasePersistence:{phase:number;status:string;observations:number;missingSnapshots:number}[];observations:number;transitions:number;favorableToOther:number;otherToFavorable:number;crossPhaseConflicts:number;contextChanges:number;missingSnapshots:number;reasons:string[]};
export type StabilityRankingReport={status:"ready"|"insufficient";runsConsidered:number;summary:{groups:number;highDocumentaryStability:number;repeatedButNotConclusive:number;contradictoryOrChanging:number;contextChanged:number;limitedEvidence:number};ranking:StabilityRankRow[];limitations:string[]};
const order:Record<StabilityTier,number>={"high-documentary-stability":0,"repeated-but-not-conclusive":1,"contradictory-or-changing":2,"context-changed":3,"limited-evidence":4};
export function analyzeStabilityRanking(records:ExperimentRecord[],files:Record<string,SnapshotFileMap>):StabilityRankingReport{
 const sorted=[...records].sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt)||a.runId.localeCompare(b.runId));
 const consensus=analyzeFindingConsensus(sorted,files),persistence=analyzeFindingPersistence(sorted,files),evolution=analyzeEvidenceEvolution(sorted,files);
 const pMap=new Map(persistence.series.map(x=>[x.family+"|"+x.position+"|"+x.phase,x]));
 const cMap=new Map(consensus.groups.map(x=>[x.family+"|"+x.position,x])),eMap=new Map(evolution.groups.map(x=>[x.family+"|"+x.position,x]));
 const keys=new Set<string>([...cMap.keys(),...eMap.keys(),...persistence.series.map(x=>x.family+"|"+x.position)]);
 const rows:Omit<StabilityRankRow,"rank">[]=[];
 for(const k of keys){const [family,position]=k.split("|"),c=cMap.get(k),e=eMap.get(k),ps=[95,96,97,98].map(phase=>pMap.get(k+"|"+phase)).filter(Boolean) as typeof persistence.series;
  const persistentPhases=ps.filter(x=>x.status==="persistent").length,observations=ps.reduce((n,x)=>n+x.observations,0),missingSnapshots=ps.reduce((n,x)=>n+x.missingSnapshots,0);
  const transitions=e?.transitions.filter(x=>x.kind!=="unknown-gap").length??0,favorableToOther=e?.transitions.filter(x=>x.kind==="favorable-to-other").length??0,otherToFavorable=e?.transitions.filter(x=>x.kind==="other-to-favorable").length??0,crossPhaseConflicts=e?.conflicts.length??0,contextChanges=e?.transitions.filter(x=>x.contextChanged).length??0;
  const changed=contextChanges>0||c?.status==="context-changed",contradictory=favorableToOther>0||otherToFavorable>0||crossPhaseConflicts>0||e?.status==="contradictory";
  const complete=sorted.length>=3&&!!c&&!!e&&ps.length===4&&ps.every(x=>x.observations>=3&&x.missingSnapshots===0)&&missingSnapshots===0;
  let tier:StabilityTier;
  if(changed)tier="context-changed";else if(contradictory)tier="contradictory-or-changing";
  else if(complete&&c?.status==="concordant-support"&&persistentPhases===4&&e?.status==="stable-labels"&&transitions===0)tier="high-documentary-stability";
  else if(complete&&persistentPhases>=2&&transitions===0&&crossPhaseConflicts===0)tier="repeated-but-not-conclusive";else tier="limited-evidence";
  const reasons:string[]=[];
  if(tier==="high-documentary-stability")reasons.push("Consenso favorable exacto, cuatro series persistentes y sin cambios ni contradicciones detectados.");
  if(tier==="repeated-but-not-conclusive")reasons.push("Al menos dos fases muestran persistencia, pero no se cumplen todos los criterios estrictos de coincidencia favorable.");
  if(contradictory)reasons.push("Se detectaron contradicciones entre fases o cambios hacia/desde etiquetas favorables.");
  if(changed)reasons.push("Hay cambios declarados de método, configuración o entorno.");
  if(!complete)reasons.push("No hay tres ejecuciones completas con cuatro series legibles y al menos tres observaciones por serie.");
  if(persistentPhases<4)reasons.push("Fases persistentes: "+persistentPhases+" de 4.");
  if(missingSnapshots)reasons.push("Snapshots faltantes/ilegibles: "+missingSnapshots+".");
  rows.push({family,position,tier,consensus:c?.status??null,evolution:e?.status??null,persistentPhases,phasePersistence:[95,96,97,98].map(phase=>{const x=pMap.get(k+"|"+phase);return{phase,status:x?.status??"missing",observations:x?.observations??0,missingSnapshots:x?.missingSnapshots??0};}),observations,transitions,favorableToOther,otherToFavorable,crossPhaseConflicts,contextChanges,missingSnapshots,reasons});
 }
 rows.sort((a,b)=>order[a.tier]-order[b.tier]||b.observations-a.observations||a.crossPhaseConflicts-b.crossPhaseConflicts||a.family.localeCompare(b.family)||a.position.localeCompare(b.position));
 const ranking=rows.map((x,i)=>({...x,rank:i+1})),count=(tier:StabilityTier)=>ranking.filter(x=>x.tier===tier).length;
 return{status:ranking.length?"ready":"insufficient",runsConsidered:sorted.length,summary:{groups:ranking.length,highDocumentaryStability:count("high-documentary-stability"),repeatedButNotConclusive:count("repeated-but-not-conclusive"),contradictoryOrChanging:count("contradictory-or-changing"),contextChanged:count("context-changed"),limitedEvidence:count("limited-evidence")},ranking,limitations:["El orden es una prioridad de revisión documental, no una puntuación predictiva ni probabilidad de acierto.","La categoría alta exige tres ejecuciones, cuatro series completas con tres observaciones cada una, consenso favorable exacto, persistencia en las cuatro fases y ausencia de transiciones/contradicciones.","Las etiquetas favorables son las reglas literales de fases 95–98; etiquetas desconocidas no se reinterpretan.","Los informes comparten datos históricos y controles; no son réplicas independientes ni validación prospectiva.","El volumen de observaciones no equivale a tamaño muestral efectivo independiente.","El ranking no recomienda números ni apuestas y no garantiza resultados TRIS."]};
}
