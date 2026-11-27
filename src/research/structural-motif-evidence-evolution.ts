import type {ExperimentRecord} from "./structural-motif-experiment-ledger";
import type {SnapshotFileMap} from "./structural-motif-experiment-snapshot-comparison";
import {analyzeFindingPersistence} from "./structural-motif-finding-persistence";
export type EvidenceChangeKind="favorable-to-other"|"other-to-favorable"|"label-changed"|"reported-to-absent"|"absent-to-reported"|"unknown-gap";
export type EvidenceTransition={phase:number;family:string;position:string;fromRunId:string;toRunId:string;fromDate:string;toDate:string;kind:EvidenceChangeKind;fromLabel:string|null;toLabel:string|null;contextChanged:boolean};
export type EvidenceConflict={family:string;position:string;runId:string;capturedAt:string;favorablePhases:number[];otherPhases:number[];labels:{phase:number;label:string|null}[];kind:"cross-phase-disagreement"};
export type EvidenceEvolutionRow={family:string;position:string;transitions:EvidenceTransition[];conflicts:EvidenceConflict[];observations:number;distinctLabels:number;missingSnapshots:number;changedPhases:number[];status:"contradictory"|"changing"|"stable-labels"|"insufficient"};
export type EvidenceEvolutionReport={status:"ready"|"insufficient";runsConsidered:number;summary:{groups:number;transitions:number;favorableToOther:number;otherToFavorable:number;crossPhaseConflicts:number;contextChanges:number;unknownGaps:number;insufficient:number};groups:EvidenceEvolutionRow[];limitations:string[]};
const specs=[{phase:95,collection:"metrics",field:"interpretation"},{phase:96,collection:"metrics",field:"interpretation"},{phase:97,collection:"groups",field:"conclusion"},{phase:98,collection:"groups",field:"classification"}] as const;
const favorable:Record<number,string>={95:"holdout-positive-and-most-training-blocks-positive",96:"interval-above-zero",97:"robust-positive-across-block-sizes",98:"consistent-retrospective-support"};
const unwrap=(v:any)=>v?.report&&typeof v.report==="object"?v.report:v;
const key=(f:string,p:string)=>f+"|"+p;
function read(raw:string|undefined,phase:number){if(!raw)return null;try{const root=unwrap(JSON.parse(raw)),spec=specs.find(x=>x.phase===phase),arr=root?.[spec!.collection];if(!Array.isArray(arr))return null;const rows=new Map<string,string|null>();for(const r of arr)if(r&&r.family!==undefined&&r.position!==undefined){const v=r[spec!.field];rows.set(key(String(r.family),String(r.position)),typeof v==="string"&&v.trim()?v.trim():null);}return{rows,context:JSON.stringify({method:root.method??null,settings:root.settings??null,environment:root.environment??null})};}catch{return null;}}
export function analyzeEvidenceEvolution(records:ExperimentRecord[],files:Record<string,SnapshotFileMap>):EvidenceEvolutionReport{
 const sorted=[...records].sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt)||a.runId.localeCompare(b.runId)),keys=new Set<string>(),parsed=new Map<string,Map<number,ReturnType<typeof read>>>(),missingByKey=new Map<string,number>();
 for(const run of sorted){const phases=new Map<number,ReturnType<typeof read>>();for(const spec of specs){const a=run.artifacts.find(x=>x.phase===spec.phase&&x.kind==="json"),doc=read(a?files[run.runId]?.[a.sourcePath]:undefined,spec.phase);phases.set(spec.phase,doc);if(doc)for(const k of doc.rows.keys())keys.add(k);}parsed.set(run.runId,phases);}
 const persistence=analyzeFindingPersistence(sorted,files),groups:EvidenceEvolutionRow[]=[];let totalContextChangeCount=0;
 for(const k of [...keys].sort()){
  const [family,position]=k.split("|"),transitions:EvidenceTransition[]=[],conflicts:EvidenceConflict[]=[],observedLabels=new Set<string>(),changedPhases=new Set<number>();let observations=0,missingSnapshots=0,contextChangeCount=0;
  for(let i=0;i<sorted.length;i++){
   const run=sorted[i],phaseRows=parsed.get(run.runId)!;
   const labels=specs.map(s=>({phase:s.phase,doc:phaseRows.get(s.phase),label:phaseRows.get(s.phase)?.rows.get(k)??null}));
   const favorablePhases=labels.filter(x=>x.label===favorable[x.phase]).map(x=>x.phase),otherPhases=labels.filter(x=>x.label!==null&&x.label!==favorable[x.phase]).map(x=>x.phase);
   if(favorablePhases.length&&otherPhases.length)conflicts.push({family,position,runId:run.runId,capturedAt:run.capturedAt,kind:"cross-phase-disagreement",favorablePhases,otherPhases,labels:labels.map(x=>({phase:x.phase,label:x.label}))});
   for(const spec of specs){const current=phaseRows.get(spec.phase);if(!current){missingSnapshots++;continue;}const label=current.rows.get(k);if(label){observations++;observedLabels.add(spec.phase+":"+label);}}
   if(i===0)continue;
   const prior=sorted[i-1],priorRows=parsed.get(prior.runId)!;
   for(const spec of specs){const a=priorRows.get(spec.phase),b=phaseRows.get(spec.phase);if(!a||!b){transitions.push({phase:spec.phase,family,position,fromRunId:prior.runId,toRunId:run.runId,fromDate:prior.capturedAt,toDate:run.capturedAt,kind:"unknown-gap",fromLabel:null,toLabel:null,contextChanged:false});continue;}
    const contextChanged=a.context!==b.context;if(contextChanged){contextChangeCount++;totalContextChangeCount++;changedPhases.add(spec.phase);}const from=a.rows.get(k)??null,to=b.rows.get(k)??null;if(from===to)continue;
    const fromFav=from===favorable[spec.phase],toFav=to===favorable[spec.phase];
    let kind:EvidenceChangeKind;
    if(from&&to)kind=fromFav&&!toFav?"favorable-to-other":!fromFav&&toFav?"other-to-favorable":"label-changed";
    else if(from&&!to)kind="reported-to-absent";else if(!from&&to)kind="absent-to-reported";else continue;
    
    transitions.push({phase:spec.phase,family,position,fromRunId:prior.runId,toRunId:run.runId,fromDate:prior.capturedAt,toDate:run.capturedAt,kind,fromLabel:from,toLabel:to,contextChanged});
   }
  }
  const relevant=persistence.series.filter(x=>x.family===family&&x.position===position);
  const hasEvidence=observations>=3||relevant.some(x=>x.observations>=3);
  const status:EvidenceEvolutionRow["status"]=!hasEvidence?"insufficient":conflicts.length||transitions.some(x=>x.kind==="favorable-to-other"||x.kind==="other-to-favorable")?"contradictory":transitions.some(x=>x.kind!=="unknown-gap")?"changing":"stable-labels";
  groups.push({family,position,transitions,conflicts,observations,distinctLabels:observedLabels.size,missingSnapshots,changedPhases:[...changedPhases].sort((a,b)=>a-b),status});
 }
 const all=groups.flatMap(x=>x.transitions),count=(kind:EvidenceChangeKind)=>all.filter(x=>x.kind===kind).length;
 return{status:groups.some(x=>x.status!=="insufficient")?"ready":"insufficient",runsConsidered:sorted.length,summary:{groups:groups.length,transitions:all.filter(x=>x.kind!=="unknown-gap").length,favorableToOther:count("favorable-to-other"),otherToFavorable:count("other-to-favorable"),crossPhaseConflicts:groups.reduce((n,x)=>n+x.conflicts.length,0),contextChanges:totalContextChangeCount,unknownGaps:count("unknown-gap"),insufficient:groups.filter(x=>x.status==="insufficient").length},groups,limitations:["Solo se considera favorable la etiqueta exacta predefinida para cada fase 95–98; otras etiquetas se denominan «otra/no favorable», sin afirmar que sean estadísticamente negativas.","Las contradicciones entre fases se detectan cuando, en la misma captura y familia/posición, una fase tiene su etiqueta favorable exacta y otra una etiqueta distinta de su propio criterio favorable.","Las transiciones comparan capturas consecutivas. Una ausencia de fila en JSON legible se distingue de un snapshot ausente o ilegible; este último genera unknown-gap.","Cambios de método, configuración o entorno declarados se marcan, pero no se atribuye causalidad.","Las capturas pueden compartir los mismos datos históricos; los cambios no son evidencia independiente ni validación prospectiva.","El análisis es retrospectivo: no predice números TRIS, probabilidades de ganar ni rentabilidad."]};
}
