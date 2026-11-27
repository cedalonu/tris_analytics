import type {ExperimentRecord} from "./structural-motif-experiment-ledger";
import type {SnapshotFileMap} from "./structural-motif-experiment-snapshot-comparison";
export type PersistenceStatus="persistent"|"emerging"|"intermittent"|"disappeared-from-report"|"unstable"|"insufficient"|"incomplete";
export type PersistenceSeries={phase:number;family:string;position:string;field:string;status:PersistenceStatus;observations:number;knownReports:number;missingSnapshots:number;dominantLabel:string|null;dominantShare:number|null;consecutiveTail:number;distinctLabels:number;timeline:{runId:string;capturedAt:string;label:string|null;known:boolean}[];contextChanges:string[];note:string};
export type PersistenceReport={status:"ready"|"insufficient";runsConsidered:number;series:PersistenceSeries[];summary:{persistent:number;emerging:number;intermittent:number;disappearedFromReport:number;unstable:number;insufficient:number;incomplete:number};limitations:string[]};
const unwrap=(v:any)=>v?.report&&typeof v.report==="object"?v.report:v;
const schema:{phase:number;collection:"metrics"|"groups";field:"interpretation"|"conclusion"|"classification"}[]=[
 {phase:95,collection:"metrics",field:"interpretation"},
 {phase:96,collection:"metrics",field:"interpretation"},
 {phase:97,collection:"groups",field:"conclusion"},
 {phase:98,collection:"groups",field:"classification"}
];
type Event={runId:string;capturedAt:string;label:string|null;known:boolean};
type Acc={phase:number;family:string;position:string;field:string;events:Event[];contexts:Set<string>;missingSnapshots:number};
export function analyzeFindingPersistence(records:ExperimentRecord[],filesByRun:Record<string,SnapshotFileMap>):PersistenceReport{
 const sorted=[...records].sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt)||a.runId.localeCompare(b.runId));
 const acc=new Map<string,Acc>();
 for(const spec of schema){
  const keys=new Set<string>();
  const parsed=new Map<string,{rows:Map<string,string>;context:string}>();
  for(const record of sorted){
   const artifact=record.artifacts.find(a=>a.phase===spec.phase&&a.kind==="json"),raw=artifact?filesByRun[record.runId]?.[artifact.sourcePath]:undefined;
   if(!raw)continue;
   try{
    const root=unwrap(JSON.parse(raw)),arr=root?.[spec.collection];
    if(!Array.isArray(arr))continue;
    const rows=new Map<string,string>();
    for(const row of arr){
     if(!row||row.family===undefined||row.position===undefined)continue;
     const label=row[spec.field];
     if(typeof label!=="string"||!label.trim())continue;
     const key=String(row.family)+"|"+String(row.position);
     rows.set(key,label.trim());keys.add(key);
    }
    parsed.set(record.runId,{rows,context:JSON.stringify({method:root?.method??null,settings:root?.settings??null,environment:root?.environment??null})});
   }catch{/* malformed snapshots are unknown, never treated as absent */}
  }
  for(const key of keys){
   const [family,position]=key.split("|"),id=[spec.phase,key,spec.field].join("|");
   const item:Acc={phase:spec.phase,family,position,field:spec.field,events:[],contexts:new Set(),missingSnapshots:0};
   for(const record of sorted){
    const p=parsed.get(record.runId);
    if(!p){item.events.push({runId:record.runId,capturedAt:record.capturedAt,label:null,known:false});item.missingSnapshots++;continue;}
    item.contexts.add(p.context);
    item.events.push({runId:record.runId,capturedAt:record.capturedAt,label:p.rows.get(key)??null,known:true});
   }
   acc.set(id,item);
  }
 }
 const series:PersistenceSeries[]=[];
 for(const item of acc.values()){
  const observed=item.events.filter(x=>x.known&&x.label!==null),counts=new Map<string,number>();
  for(const e of observed)counts.set(e.label!, (counts.get(e.label!)??0)+1);
  const ranked=[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  const dominant=ranked[0],share=dominant?dominant[1]/observed.length:null;
  let tail=0;for(let i=item.events.length-1;i>=0;i--){const e=item.events[i];if(!e.known)break;if(e.label===dominant?.[0])tail++;else break;}
  const lastTwoKnown=item.events.filter(x=>x.known).slice(-2),priorPresent=item.events.slice(0,-2).some(x=>x.known&&x.label!==null);
  const vanished=lastTwoKnown.length===2&&lastTwoKnown.every(x=>x.label===null)&&priorPresent;
  let status:PersistenceStatus;
  if(observed.length<3)status=item.missingSnapshots?"incomplete":"insufficient";
  else if(vanished)status="disappeared-from-report";
  else if(share!==null&&share>=.75&&tail>=2)status="persistent";
  else if(tail>=2)status="emerging";
  else if(share!==null&&share>=.6)status="intermittent";
  else status="unstable";
  const note=status==="disappeared-from-report"?"La clave dejó de aparecer en los dos últimos informes legibles; esto no demuestra que el fenómeno haya desaparecido.":status==="persistent"?"La misma etiqueta se repite en al menos tres observaciones y domina al menos el 75% de las observaciones, incluida la captura más reciente.":status==="emerging"?"La etiqueta dominante se repite en las dos últimas capturas legibles, pero todavía no alcanza el criterio de persistencia.":status==="intermittent"?"Una etiqueta domina el historial, pero no se mantiene en las capturas más recientes.":status==="unstable"?"Las etiquetas cambian con frecuencia; no se observa una categoría dominante persistente.":status==="incomplete"?"Faltan snapshots legibles; la ausencia de datos no se interpreta como ausencia del hallazgo.":"Menos de tres observaciones legibles; no se clasifica persistencia.";
  series.push({phase:item.phase,family:item.family,position:item.position,field:item.field,status,observations:observed.length,knownReports:item.events.filter(x=>x.known).length,missingSnapshots:item.missingSnapshots,dominantLabel:dominant?.[0]??null,dominantShare:share,consecutiveTail:tail,distinctLabels:counts.size,timeline:item.events,contextChanges:item.contexts.size>1?["Cambió el método, la configuración o el entorno declarado entre informes; no se atribuye el cambio a una sola causa."]:[],note});
 }
 series.sort((a,b)=>a.phase-b.phase||a.family.localeCompare(b.family)||a.position.localeCompare(b.position));
 const count=(s:PersistenceStatus)=>series.filter(x=>x.status===s).length;
 return{status:series.some(x=>x.observations>=3)?"ready":"insufficient",runsConsidered:sorted.length,series,summary:{persistent:count("persistent"),emerging:count("emerging"),intermittent:count("intermittent"),disappearedFromReport:count("disappeared-from-report"),unstable:count("unstable"),insufficient:count("insufficient"),incomplete:count("incomplete")},limitations:["La persistencia se calcula sobre etiquetas cualitativas de los informes: fase 95–96 interpretation, fase 97 conclusion y fase 98 classification. No se mezclan sus vocabularios.","Persistente requiere al menos tres observaciones, una etiqueta con al menos 75% de frecuencia y esa misma etiqueta en las dos últimas capturas legibles.","Emergente significa que la etiqueta dominante aparece en las dos últimas capturas legibles, sin alcanzar el criterio de persistencia; es una descripción, no una predicción.","Desaparecido del informe significa que una clave previamente informada falta en los dos últimos snapshots legibles. No demuestra que el fenómeno haya desaparecido.","Un snapshot ausente o ilegible se trata como desconocido, no como ausencia de la etiqueta. Una fila ausente en un JSON legible se registra como no reportada.","Los cambios de método, configuración o entorno se señalan; no se atribuye causalidad ni mejora.","Las capturas pueden compartir datos históricos; no son evidencia independiente, predicción de números ganadores ni recomendación de apuesta."]};
}
