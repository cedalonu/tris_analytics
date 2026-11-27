import type {ExperimentRecord} from "./structural-motif-experiment-ledger";
export type SnapshotFileMap=Record<string,string>;
export type SnapshotDelta={phase:number;category:"source-data"|"parameters"|"method"|"results"|"audit"|"availability";key:string;field:string;status:"changed"|"only-baseline"|"only-current";baseline:string|null;current:string|null};
export type SnapshotPairResult={baselineRunId:string;currentRunId:string;status:"comparable"|"incomplete";summary:{sourceDataChanges:number;parameterChanges:number;methodChanges:number;resultChanges:number;auditChanges:number;missingFiles:number;comparedPhases:number};deltas:SnapshotDelta[];phaseAvailability:{phase:number;baseline:boolean;current:boolean}[];limitations:string[]};
const stable=(v:any):string=>{if(v===undefined)return"undefined";if(v===null||typeof v!=="object")return JSON.stringify(v);if(Array.isArray(v))return"["+v.map(stable).join(",")+"]";return"{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+stable(v[k])).join(",")+"}";};
const printable=(v:any)=>v===undefined?null:typeof v==="string"?v:stable(v);
const unwrap=(v:any)=>v?.report&&typeof v.report==="object"?v.report:v;
function rowsFor(phase:number,doc:any):{key:string;value:any;category:SnapshotDelta["category"]}[]{
 const r=unwrap(doc);
 const metadata:any={};for(const field of ["method","settings","environment","sourceReport","sourceReports"])if(r?.[field]!==undefined)metadata[field]=r[field];
 const metaRows=Object.keys(metadata).length?[{key:"_metadata",value:metadata,category:"parameters" as const}]:[];
 if(phase===94)return[...metaRows,...(Array.isArray(r.rows)?r.rows:[]).map((x:any)=>({key:[x.targetDrawId,x.family,x.position].join("|"),value:x,category:"source-data"}))];
 if(phase===95||phase===96)return[...metaRows,...(Array.isArray(r.metrics)?r.metrics:[]).map((x:any)=>({key:[x.family,x.position].join("|"),value:x,category:"results"}))];
 if(phase===97||phase===98)return[...metaRows,...(Array.isArray(r.groups)?r.groups:[]).map((x:any)=>({key:[x.family,x.position].join("|"),value:x,category:"results"}))];
 if(phase===99)return[...metaRows,{key:"summary",value:r.summary??null,category:"audit"},{key:"provenance",value:r.provenance??null,category:"source-data"},...(Array.isArray(r.checks)?r.checks.map((x:any)=>({key:String(x.id),value:x,category:"audit" as const})):[])];
 if(phase===101)return[...metaRows,...(Array.isArray(r.phases)?r.phases:[]).map((x:any)=>({key:String(x.phase),value:x,category:"results"}))];
 return[];
}
function classifyField(phase:number,field:string,defaultCategory:SnapshotDelta["category"]):SnapshotDelta["category"]{
 if(field==="method")return"method";
 if(field==="settings"||field==="environment")return"parameters";
 if(field==="inputFiles"||field==="sourceReport"||field==="sourceReports"||field==="phase94Sha256")return"source-data";
 if(field==="outputHashes")return"results";
 return phase===99?"audit":defaultCategory;
}
function extractChanges(phase:number,b:any,c:any):SnapshotDelta[]{
 const left=rowsFor(phase,b),right=rowsFor(phase,c),lm=new Map(left.map(x=>[x.key,x])),rm=new Map(right.map(x=>[x.key,x])),keys=[...new Set([...lm.keys(),...rm.keys()])].sort(),out:SnapshotDelta[]=[];
 for(const key of keys){const a=lm.get(key),z=rm.get(key),base=a?.value,now=z?.value,category=a?.category??z?.category??"results";
  if(!a||!z){out.push({phase,category,key,field:"record",status:a?"only-baseline":"only-current",baseline:printable(base),current:printable(now)});continue;}
  const fields=[...new Set([...Object.keys(base??{}),...Object.keys(now??{})])].sort();
  for(const field of fields)if(stable(base?.[field])!==stable(now?.[field]))out.push({phase,category:classifyField(phase,field,category),key,field,status:"changed",baseline:printable(base?.[field]),current:printable(now?.[field])});
 }
 return out;
}
export function compareExperimentSnapshots(baseline:ExperimentRecord,current:ExperimentRecord,baselineFiles:SnapshotFileMap,currentFiles:SnapshotFileMap):SnapshotPairResult{
 const phaseIds=[94,95,96,97,98,99,101],deltas:SnapshotDelta[]=[],phaseAvailability=phaseIds.map(phase=>{
  const a=baseline.artifacts.find(x=>x.phase===phase&&x.kind==="json"),b=current.artifacts.find(x=>x.phase===phase&&x.kind==="json");
  const aText=a?baselineFiles[a.sourcePath]:undefined,bText=b?currentFiles[b.sourcePath]:undefined;
  if(aText&&bText){try{deltas.push(...extractChanges(phase,JSON.parse(aText),JSON.parse(bText)));}catch{deltas.push({phase,category:"availability",key:"json",field:"parse",status:"changed",baseline:"JSON no legible",current:"JSON no legible"});}}
  return{phase,baseline:!!aText,current:!!bText};
 });
 const missingFiles=phaseAvailability.reduce((n,x)=>n+Number(!x.baseline)+Number(!x.current),0),count=(category:SnapshotDelta["category"])=>deltas.filter(x=>x.category===category).length;
 const comparedPhases=phaseAvailability.filter(x=>x.baseline&&x.current).length;
 return{baselineRunId:baseline.runId,currentRunId:current.runId,status:missingFiles?"incomplete":"comparable",summary:{sourceDataChanges:count("source-data"),parameterChanges:count("parameters"),methodChanges:count("method"),resultChanges:count("results"),auditChanges:count("audit"),missingFiles,comparedPhases},deltas,phaseAvailability,limitations:["La comparación es estructural y descriptiva: un campo distinto no demuestra por sí solo un efecto causal ni una mejora del método.","Las métricas comparadas proceden de las mismas familias de análisis y pueden compartir los mismos datos históricos; no son evidencia independiente.","Fase101 aporta metadatos declarados de entradas, parámetros y hashes de salida; no demuestra que todas las dependencias externas estén registradas.","Si faltan snapshots o no se puede interpretar el JSON, el resultado queda incompleto; no se imputan datos.","Ninguna diferencia se interpreta como probabilidad futura, predicción de números ganadores ni rentabilidad."]};
}
export function compareSnapshotSelection(records:ExperimentRecord[],filesByRun:Record<string,SnapshotFileMap>):SnapshotPairResult[]{
 const sorted=[...records].sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt)||a.runId.localeCompare(b.runId));
 if(sorted.length<2)return[];
 const base=sorted[0];return sorted.slice(1).map(now=>compareExperimentSnapshots(base,now,filesByRun[base.runId]??{},filesByRun[now.runId]??{}));
}
