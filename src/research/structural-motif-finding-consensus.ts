import type {ExperimentRecord} from "./structural-motif-experiment-ledger";
import type {SnapshotFileMap} from "./structural-motif-experiment-snapshot-comparison";
import {analyzeFindingPersistence} from "./structural-motif-finding-persistence";

export type ConsensusStatus="concordant-support"|"mixed"|"insufficient"|"not-interpreted"|"context-changed";
export type ConsensusRow={family:string;position:string;status:ConsensusStatus;phase95:string|null;phase96:string|null;phase97:string|null;phase98:string|null;persistence:{phase:number;status:string;label:string|null}[];favorable:{phase95:boolean;phase96:boolean;phase97:boolean;phase98:boolean;persistence:boolean};missing:number[];unknownLabels:string[];contextChanges:string[];notes:string[]};
export type ConsensusReport={status:"ready"|"insufficient";runsConsidered:number;groups:ConsensusRow[];summary:Record<ConsensusStatus,number>&{groups:number};limitations:string[]};
const unwrap=(x:any)=>x?.report&&typeof x.report==="object"?x.report:x;
type Spec={phase:number;collection:"metrics"|"groups";field:"interpretation"|"conclusion"|"classification"};
const specs:Spec[]=[{phase:95,collection:"metrics",field:"interpretation"},{phase:96,collection:"metrics",field:"interpretation"},{phase:97,collection:"groups",field:"conclusion"},{phase:98,collection:"groups",field:"classification"}];
const key=(family:any,position:any)=>String(family)+"|"+String(position);
function readPhase(phase:number,raw:string|undefined){
 if(!raw)return null;
 try{const root=unwrap(JSON.parse(raw)),spec=specs.find(x=>x.phase===phase),rows=root?.[spec!.collection];if(!Array.isArray(rows))return null;
  const map=new Map<string,{label:string;context:string}>();
  const context=JSON.stringify({method:root?.method??null,settings:root?.settings??null,environment:root?.environment??null});
  for(const row of rows)if(row&&row.family!==undefined&&row.position!==undefined){const label=row[spec!.field];map.set(key(row.family,row.position),{label:typeof label==="string"?label.trim():"",context});}
  return map;
 }catch{return null;}
}
export function analyzeFindingConsensus(records:ExperimentRecord[],filesByRun:Record<string,SnapshotFileMap>):ConsensusReport{
 const sorted=[...records].sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt)||a.runId.localeCompare(b.runId));
 const latest=new Map<number,Map<string,{label:string;context:string}>>(),allKeys=new Set<string>(),missingByPhase=new Map<number,boolean>();
 for(const spec of specs){
  const latestRows=new Map<string,{label:string;context:string}>();let anyMissing=false;
  for(const run of sorted){const artifact=run.artifacts.find(a=>a.phase===spec.phase&&a.kind==="json"),raw=artifact?filesByRun[run.runId]?.[artifact.sourcePath]:undefined;
   const rows=readPhase(spec.phase,raw);if(!rows){anyMissing=true;continue;}
   for(const [k,v] of rows){allKeys.add(k);latestRows.set(k,v);}
  }
  latest.set(spec.phase,latestRows);missingByPhase.set(spec.phase,anyMissing);
 }
 const persistence=analyzeFindingPersistence(sorted,filesByRun);
 const persistenceMap=new Map(persistence.series.map(x=>[key(x.family,x.position)+"|"+x.phase,x]));
 const rows:ConsensusRow[]=[...allKeys].sort().map(k=>{
  const [family,position]=k.split("|"),get=(phase:number)=>latest.get(phase)?.get(k)??null;
  const a=get(95),b=get(96),c=get(97),d=get(98);
  const labels={phase95:a?.label??null,phase96:b?.label??null,phase97:c?.label??null,phase98:d?.label??null};
  const pStatuses=[95,96,97,98].map(phase=>{const x=persistenceMap.get(k+"|"+phase);return{phase,status:x?.status??"missing",label:x?.dominantLabel??null};});
  const fav95=a?.label==="holdout-positive-and-most-training-blocks-positive";
  const fav96=b?.label==="interval-above-zero";
  const fav97=c?.label==="robust-positive-across-block-sizes";
  const fav98=d?.label==="consistent-retrospective-support";
  const favPersistence=pStatuses.every(x=>x.status==="persistent");
  const unknownLabels=[...(a&&a.label&&!fav95?["95:"+a.label]:[]),...(b&&b.label&&!fav96?["96:"+b.label]:[]),...(c&&c.label&&!fav97?["97:"+c.label]:[]),...(d&&d.label&&!fav98?["98:"+d.label]:[])];
  const missing=[...(!a?[95]:[]),...(!b?[96]:[]),...(!c?[97]:[]),...(!d?[98]:[])];
  const contexts=[a?.context,b?.context,c?.context,d?.context].filter(Boolean) as string[];
  const contextChanges=new Set(contexts).size>1?["Los metadatos declarados de método/configuración/entorno difieren entre fases en la captura más reciente."]: [];
  const notes:string[]=[];
  let status:ConsensusStatus;
  if(contextChanges.length)status="context-changed";
  else if(missing.length)status="insufficient";
  else if([a,b,c,d].some(x=>!x?.label))status="not-interpreted";
  else if(!fav95||!fav96||!fav97||!fav98)status="mixed";
  else if(pStatuses.some(x=>x.status==="missing"||x.status==="incomplete"||x.status==="insufficient"))status="insufficient";
  else if(favPersistence)status="concordant-support";
  else status="mixed";
  if(!favPersistence)notes.push("La persistencia no cumple el criterio estricto en las cuatro fases; se muestran estados separados.");
  if(unknownLabels.length)notes.push("Una o más etiquetas no cumplen el criterio favorable predefinido; se conserva su texto literal.");
  if(missing.length)notes.push("Faltan snapshots o filas legibles para una o más fases; no se imputan.");
  if(contextChanges.length)notes.push("La diferencia de contexto impide tratar las fases como una comparación homogénea.");
  return{family,position,status,...labels,persistence:pStatuses,favorable:{phase95:!!fav95,phase96:!!fav96,phase97:!!fav97,phase98:!!fav98,persistence:favPersistence},missing,unknownLabels,contextChanges,notes};
 });
 const count=(s:ConsensusStatus)=>rows.filter(x=>x.status===s).length;
 const limitations=["El consenso aplica etiquetas favorables exactas documentadas: fase95 holdout-positive-and-most-training-blocks-positive; fase96 interval-above-zero; fase97 robust-positive-across-block-sizes; fase98 consistent-retrospective-support.","La persistencia exige que las cuatro series de Fase106 (95–98) sean persistent; los estados y etiquetas originales permanecen visibles y no se mezclan entre fases.","Las fases reutilizan el mismo historial y controles de Fase94; su coincidencia no equivale a evidencia estadística independiente.","Un cambio de método/configuración/entorno declarado entre fases se marca como context-changed. No se atribuye causalidad.","Faltantes, etiquetas desconocidas y etiquetas no favorables no se convierten en soporte positivo ni en probabilidades.","El resultado es retrospectivo y descriptivo: no predice números TRIS, no estima probabilidades de ganar ni recomienda apuestas."];
 return{status:rows.length?"ready":"insufficient",runsConsidered:sorted.length,groups:rows,summary:{groups:rows.length,"concordant-support":count("concordant-support"),mixed:count("mixed"),insufficient:count("insufficient"),"not-interpreted":count("not-interpreted"),"context-changed":count("context-changed")},limitations};
}
