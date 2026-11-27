import type {ExperimentRecord,ExperimentArtifact} from "./structural-motif-experiment-ledger";
export type ArtifactDelta={phase:number;kind:string;sourcePath:string;status:"unchanged"|"changed"|"only-baseline"|"only-current";baselineSha:string|null;currentSha:string|null};
export type ExperimentPairComparison={baselineRunId:string;currentRunId:string;status:"identical-artifacts"|"artifact-changes"|"incomplete";sameFingerprint:boolean;gitCommitChanged:boolean|null;capturedAt:{baseline:string;current:string};summary:{unchanged:number;changed:number;onlyBaseline:number;onlyCurrent:number;missingBaseline:number;missingCurrent:number};artifacts:ArtifactDelta[];limitations:string[]};
const identity=(a:ExperimentArtifact)=>a.phase+"|"+a.kind+"|"+a.sourcePath;
export function compareExperimentRecords(baseline:ExperimentRecord,current:ExperimentRecord):ExperimentPairComparison{
 const left=new Map((baseline.artifacts??[]).map(a=>[identity(a),a])),right=new Map((current.artifacts??[]).map(a=>[identity(a),a]));
 const keys=[...new Set([...left.keys(),...right.keys()])].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 const artifacts:ArtifactDelta[]=keys.map(k=>{const a=left.get(k),b=right.get(k),source=a??b!;return{phase:source.phase,kind:source.kind,sourcePath:source.sourcePath,status:!a?"only-current":!b?"only-baseline":a.sha256===b.sha256?"unchanged":"changed",baselineSha:a?.sha256??null,currentSha:b?.sha256??null};});
 const count=(s:ArtifactDelta["status"])=>artifacts.filter(a=>a.status===s).length;
 const missingBaseline=baseline.missing?.length??0,missingCurrent=current.missing?.length??0;
 const incomplete=baseline.status!=="complete"||current.status!=="complete"||missingBaseline>0||missingCurrent>0;
 const changed=count("changed")+count("only-baseline")+count("only-current");
 return{baselineRunId:baseline.runId,currentRunId:current.runId,status:incomplete?"incomplete":changed?"artifact-changes":"identical-artifacts",sameFingerprint:baseline.contentFingerprint===current.contentFingerprint,gitCommitChanged:baseline.gitCommit&&current.gitCommit?baseline.gitCommit!==current.gitCommit:null,capturedAt:{baseline:baseline.capturedAt,current:current.capturedAt},summary:{unchanged:count("unchanged"),changed:count("changed"),onlyBaseline:count("only-baseline"),onlyCurrent:count("only-current"),missingBaseline,missingCurrent},artifacts,limitations:["El ledger conserva hashes y metadatos de archivos, pero no incorpora el contenido de los snapshots dentro de latest.json. Por ello esta comparación identifica artefactos idénticos, modificados o ausentes; no atribuye el cambio a entradas, parámetros o resultados.","No se pueden comparar métricas por familia/posición con el JSON índice del ledger solamente. Para esa comparación se requiere cargar los snapshots de cada ejecución.","Un cambio de hash no demuestra un cambio estadístico: puede deberse a datos, parámetros, entorno, formato o metadatos del informe.","La coincidencia de hashes solo demuestra igualdad byte a byte de los artefactos registrados; no independencia, reproducibilidad científica ni capacidad predictiva."]};
}
export function compareExperimentSelection(records:ExperimentRecord[]):ExperimentPairComparison[]{
 const sorted=[...records].sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt)||a.runId.localeCompare(b.runId));
 if(sorted.length<2)return[];
 const baseline=sorted[0];return sorted.slice(1).map(current=>compareExperimentRecords(baseline,current));
}
