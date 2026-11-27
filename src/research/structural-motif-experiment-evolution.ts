import type {ExperimentRecord} from "./structural-motif-experiment-ledger";
import type {SnapshotFileMap} from "./structural-motif-experiment-snapshot-comparison";
export type TrendDirection="increasing"|"decreasing"|"stable"|"mixed"|"insufficient";
export type MetricEvolution={phase:number;family:string;position:string;metric:string;direction:TrendDirection;observations:number;transitions:number;increases:number;decreases:number;unchanged:number;firstValue:number;lastValue:number;netChange:number;min:number;max:number;series:{runId:string;capturedAt:string;value:number}[];contextChanges:string[]};
export type EvolutionReport={status:"ready"|"insufficient";runsConsidered:number;completeRuns:number;series:MetricEvolution[];limitations:string[]};
const unwrap=(v:any)=>v?.report&&typeof v.report==="object"?v.report:v;
const excluded=/(^id$|drawid|contest|timestamp|seed|version|position|rank|index|count$|sample|resolved|forecast|bytes|duration|millisecond|year$|month$|day$)/i;
function numericLeaves(value:any,prefix="",out:{path:string;value:number}[]=[]):{path:string;value:number}[]{
 if(!value||typeof value!=="object")return out;
 for(const [key,v] of Object.entries(value)){
  const path=prefix?prefix+"."+key:key;
  if(typeof v==="number"&&Number.isFinite(v)&&!excluded.test(path))out.push({path,value:v});
  else if(v&&typeof v==="object"&&!Array.isArray(v))numericLeaves(v,path,out);
 }
 return out;
}
function metricRows(phase:number,doc:any):{family:string;position:string;value:any}[]{
 const r=unwrap(doc),rows=phase===95||phase===96?r.metrics:phase===97||phase===98?r.groups:null;
 return Array.isArray(rows)?rows.filter((x:any)=>x&&x.family!==undefined&&x.position!==undefined).map((x:any)=>({family:String(x.family),position:String(x.position),value:x})): [];
}
export function analyzeExperimentEvolution(records:ExperimentRecord[],filesByRun:Record<string,SnapshotFileMap>):EvolutionReport{
 const sorted=[...records].sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt)||a.runId.localeCompare(b.runId));
 const phases=[95,96,97,98],observations=new Map<string,{phase:number;family:string;position:string;metric:string;series:{runId:string;capturedAt:string;value:number}[];contexts:Set<string>}>();
 let completeRuns=0;
 for(const record of sorted){
  let runComplete=true;
  for(const phase of phases){
   const artifact=record.artifacts.find(a=>a.phase===phase&&a.kind==="json"),raw=artifact?filesByRun[record.runId]?.[artifact.sourcePath]:undefined;
   if(!raw){runComplete=false;continue;}
   let doc:any;try{doc=JSON.parse(raw);}catch{runComplete=false;continue;}
   const root=unwrap(doc),context=JSON.stringify({method:root?.method??null,settings:root?.settings??null,environment:root?.environment??null});
   for(const row of metricRows(phase,doc))for(const metric of numericLeaves(row.value)){
    const key=[phase,row.family,row.position,metric.path].join("|");
    let item=observations.get(key);if(!item){item={phase,family:row.family,position:row.position,metric:metric.path,series:[],contexts:new Set()};observations.set(key,item);}
    item.series.push({runId:record.runId,capturedAt:record.capturedAt,value:metric.value});item.contexts.add(context);
   }
  }
  if(runComplete)completeRuns++;
 }
 const series:MetricEvolution[]=[];
 for(const item of observations.values()){
  const values=item.series,transitions=Math.max(0,values.length-1);
  const diffs=values.slice(1).map((x,i)=>x.value-values[i].value),increases=diffs.filter(x=>x>0).length,decreases=diffs.filter(x=>x<0).length,unchanged=diffs.filter(x=>x===0).length;
  const direction:TrendDirection=values.length<3?"insufficient":increases>0&&decreases>0?"mixed":increases>decreases?"increasing":decreases>increases?"decreasing":"stable";
  series.push({phase:item.phase,family:item.family,position:item.position,metric:item.metric,direction,observations:values.length,transitions,increases,decreases,unchanged,firstValue:values[0].value,lastValue:values[values.length-1].value,netChange:values[values.length-1].value-values[0].value,min:Math.min(...values.map(x=>x.value)),max:Math.max(...values.map(x=>x.value)),series:values,contextChanges:[...item.contexts].length>1?["Método, configuración o entorno declarado cambió entre las observaciones; la evolución no puede atribuirse a una sola causa."]:[]});
 }
 series.sort((a,b)=>a.phase-b.phase||a.family.localeCompare(b.family)||a.position.localeCompare(b.position)||a.metric.localeCompare(b.metric));
 return{status:series.some(x=>x.observations>=3)?"ready":"insufficient",runsConsidered:sorted.length,completeRuns,series,limitations:["Solo se analizan campos numéricos presentes en las filas métricas de fases 95–98; se excluyen campos que parecen identificadores, índices, semillas, tamaños de muestra y fechas.","Las tendencias describen cambios entre capturas guardadas, no evolución concurso a concurso ni validación prospectiva.","No se presupone que un valor mayor o menor sea mejor: el significado depende del campo y de su definición en el informe original.","Si cambian método, configuración o entorno declarados, la serie se marca con cambio de contexto; no se atribuye causalidad.","Se requieren al menos tres observaciones para asignar una dirección. Series más cortas se marcan insuficientes.","Las capturas pueden compartir los mismos datos históricos; no son evidencia independiente ni permiten inferir números ganadores o rentabilidad."]};
}
