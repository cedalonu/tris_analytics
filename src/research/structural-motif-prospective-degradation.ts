export type ProspectiveSnapshot={capturedAt:string;report:any};
export type DegradationState="insufficient"|"stable"|"degraded"|"recovering"|"recovered"|"context-changed";
export type MonitorOptions={minimumTargets?:number;changeThreshold?:number};
const key=(m:any)=>String(m.family)+"|"+String(m.position);
const validDate=(x:any)=>typeof x==="string"&&Number.isFinite(Date.parse(x));
export function analyzeProspectiveDegradation(snapshots:ProspectiveSnapshot[],options:MonitorOptions={}){
 const minimumTargets=options.minimumTargets??30,changeThreshold=options.changeThreshold??0.05;
 if(!Number.isInteger(minimumTargets)||minimumTargets<1||!Number.isFinite(changeThreshold)||changeThreshold<=0||changeThreshold>1)throw Error("invalid monitor thresholds");
 if(snapshots.length<1)throw Error("at least one prospective snapshot is required");
 const ordered=[...snapshots].sort((a,b)=>Date.parse(a.capturedAt)-Date.parse(b.capturedAt));
 for(let i=0;i<ordered.length;i++){
  const s=ordered[i],r=s.report;
  if(!validDate(s.capturedAt)||r?.method!=="tris-prospective-stability-validation-v1"||!r.lock?.rankingFingerprint||!Array.isArray(r.metrics))throw Error("invalid snapshot or prospective report");
  if(i&&Date.parse(s.capturedAt)<=Date.parse(ordered[i-1].capturedAt))throw Error("snapshot timestamps must be strictly increasing");
  if(i&&(r.lock.rankingFingerprint!==ordered[0].report.lock.rankingFingerprint||r.lock.cutoffDrawId!==ordered[0].report.lock.cutoffDrawId))throw Error("context changed: snapshots must share the same frozen lock and cutoff");
 }
 const byKey=new Map<string,any[]>();
 for(const s of ordered)for(const m of s.report.metrics){if(!m||typeof m.family!=="string"||!Number.isInteger(m.position)||!Number.isInteger(m.targets)||m.targets<0||typeof m.delta!=="number"||!Number.isFinite(m.delta))continue;const k=key(m),a=byKey.get(k)??[];a.push({capturedAt:s.capturedAt,targets:m.targets,delta:m.delta,candidateRate:m.candidateRate,baselineRate:m.baselineRate,classification:m.classification});byKey.set(k,a);}
 const rows:any[]=[];
 for(const [k,history] of byKey){
  let state:DegradationState="insufficient",worstDelta:number|null=null,previous:any=null;const events:any[]=[];
  const observations=history.map((o,i)=>{
   let next:DegradationState;
   if(o.targets<minimumTargets)next="insufficient";
   else if(!previous||previous.targets<minimumTargets)next=o.delta>0?"stable":"degraded";
   else if(o.delta<=0&&previous.delta>o.delta)next="degraded";
   else if(o.delta<=0)next=state==="degraded"?"degraded":"degraded";
   else if(state==="degraded"||state==="recovering"){
    const recovered=o.delta>0&&worstDelta!==null&&o.delta-worstDelta>=changeThreshold;
    next=recovered?"recovered":"recovering";
   }else if(previous.delta-o.delta>=changeThreshold)next="degraded";
   else if(Math.abs(o.delta-previous.delta)<changeThreshold)next="stable";
   else next="stable";
   if(next!==state){events.push({capturedAt:o.capturedAt,from:state,to:next,delta:o.delta,targets:o.targets});}
   if(o.targets>=minimumTargets){if(worstDelta===null||o.delta<worstDelta)worstDelta=o.delta;}
   state=next;previous=o;return{...o,state:next};
  });
  const [family,position]=k.split("|");
  rows.push({family,position:Number(position),state,observations:observations.length,latestTargets:history.at(-1).targets,latestDelta:history.at(-1).delta,worstObservedDelta:worstDelta,events,history:observations});
 }
 const order:Record<DegradationState,number>={degraded:0,recovering:1,insufficient:2,"context-changed":3,stable:4,recovered:5};
 rows.sort((a,b)=>order[a.state]-order[b.state]||a.family.localeCompare(b.family)||a.position-b.position);
 return{method:"tris-prospective-degradation-monitor-v1",context:{rankingFingerprint:ordered[0].report.lock.rankingFingerprint,cutoffDrawId:ordered[0].report.lock.cutoffDrawId,snapshots:ordered.length,firstCapturedAt:ordered[0].capturedAt,lastCapturedAt:ordered.at(-1)!.capturedAt},settings:{minimumTargets,changeThreshold},summary:{families:rows.length,degraded:rows.filter(x=>x.state==="degraded").length,recovering:rows.filter(x=>x.state==="recovering").length,recovered:rows.filter(x=>x.state==="recovered").length,stable:rows.filter(x=>x.state==="stable").length,insufficient:rows.filter(x=>x.state==="insufficient").length},rows,limitations:["El monitor compara capturas acumulativas del mismo lock; no reconstruye concursos individuales ni corrige cambios en la calidad de los datos de origen.","El umbral de cambio es configurable y descriptivo, no un umbral de significancia estadística.","La recuperación requiere delta positivo y mejora de al menos el umbral respecto del peor delta elegible observado; una sola captura no basta para probar persistencia de recuperación.","Las capturas deben ser acumulativas, ordenadas y compartir el mismo rankingFingerprint y cutoffDrawId.","No demuestra causalidad, capacidad predictiva ni rentabilidad."]};
}
