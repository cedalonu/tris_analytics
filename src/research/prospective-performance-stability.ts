/** Phase 44: chronological stability of prospective paired performance. */
import type {FrozenForecast,ResolvedForecast} from "./intuition-prospective";
export type StabilityStatus="consistently-positive"|"consistently-negative"|"mixed-direction"|"no-directional-edge"|"insufficient-evidence";
export interface PerformanceWindow {startDrawId:number;endDrawId:number;forecasts:number;resolved:number;candidateHits:number;baselineHits:number;candidateRate:number|null;baselineRate:number|null;candidateOnlyWins:number;baselineOnlyWins:number;ties:number;pairedDifference:number|null;}
export interface PerformanceStabilityGroup {key:string;family:string;config:string;windowDraws:number;minimumResolvedPerWindow:number;minimumWindows:number;windows:PerformanceWindow[];evaluatedWindows:number;positiveWindows:number;negativeWindows:number;neutralWindows:number;status:StabilityStatus;overallPairedDifference:number|null;}
export interface PerformanceStabilityReport {method:"prospective-performance-temporal-stability-v1";settings:{windowDraws:number;minimumResolvedPerWindow:number;minimumWindows:number};summary:{forecastRecords:number;resolvedRecords:number;groups:number;consistentPositive:number;consistentNegative:number;mixed:number;insufficient:number};groups:PerformanceStabilityGroup[];limitations:string[];}
export function auditProspectivePerformanceStability(forecasts:FrozenForecast[],resolutions:ResolvedForecast[],options:{windowDraws?:number;minimumResolvedPerWindow?:number;minimumWindows?:number}={}):PerformanceStabilityReport{
 const windowDraws=options.windowDraws??20,minimumResolvedPerWindow=options.minimumResolvedPerWindow??5,minimumWindows=options.minimumWindows??3;
 if(!Number.isInteger(windowDraws)||windowDraws<2||!Number.isInteger(minimumResolvedPerWindow)||minimumResolvedPerWindow<1||!Number.isInteger(minimumWindows)||minimumWindows<2)throw new Error("invalid temporal stability settings");
 const unique=new Map<string,FrozenForecast>();for(const f of forecasts)if(!unique.has(f.forecastId))unique.set(f.forecastId,f);
 const validResolutions=new Map<string,ResolvedForecast>();for(const r of resolutions){const f=unique.get(r.forecastId);if(f&&f.targetDrawId===r.targetDrawId&&!validResolutions.has(r.forecastId))validResolutions.set(r.forecastId,r);}
 const groups=new Map<string,FrozenForecast[]>();for(const f of unique.values()){const key=f.family+"|"+f.frozenConfig;const a=groups.get(key)??[];a.push(f);groups.set(key,a);}
 const allTargets=[...unique.values()].map(f=>f.targetDrawId),origin=allTargets.length?Math.min(...allTargets):0;
 const output:PerformanceStabilityGroup[]=[];
 for(const [key,items] of groups){
  const first=items[0],maxIndex=Math.floor((Math.max(...items.map(x=>x.targetDrawId))-origin)/windowDraws),windows:PerformanceWindow[]=[];
  for(let idx=0;idx<=maxIndex;idx++){
   const startDrawId=origin+idx*windowDraws,endDrawId=startDrawId+windowDraws-1,inside=items.filter(f=>f.targetDrawId>=startDrawId&&f.targetDrawId<=endDrawId),resolved=inside.map(f=>({f,r:validResolutions.get(f.forecastId)})).filter((x):x is {f:FrozenForecast;r:ResolvedForecast}=>!!x.r);
   const n=resolved.length,ch=resolved.filter(x=>x.r.candidateHit).length,bh=resolved.filter(x=>x.r.baselineHit).length,cw=resolved.filter(x=>x.r.candidateHit&&!x.r.baselineHit).length,bw=resolved.filter(x=>!x.r.candidateHit&&x.r.baselineHit).length,ties=n-cw-bw;
   windows.push({startDrawId,endDrawId,forecasts:inside.length,resolved:n,candidateHits:ch,baselineHits:bh,candidateRate:n?ch/n:null,baselineRate:n?bh/n:null,candidateOnlyWins:cw,baselineOnlyWins:bw,ties,pairedDifference:n?(cw-bw)/n:null});
  }
  const evaluable=windows.filter(w=>w.resolved>=minimumResolvedPerWindow),positive=evaluable.filter(w=>(w.pairedDifference??0)>0).length,negative=evaluable.filter(w=>(w.pairedDifference??0)<0).length,neutral=evaluable.length-positive-negative;
  let status:StabilityStatus="insufficient-evidence";
  if(evaluable.length>=minimumWindows){if(positive===evaluable.length)status="consistently-positive";else if(negative===evaluable.length)status="consistently-negative";else if(positive+negative===0)status="no-directional-edge";else status="mixed-direction";}
  const totalResolved=items.filter(f=>validResolutions.has(f.forecastId)).length,totalWins=items.filter(f=>{const r=validResolutions.get(f.forecastId);return r&&r.candidateHit&&!r.baselineHit;}).length,totalLosses=items.filter(f=>{const r=validResolutions.get(f.forecastId);return r&&!r.candidateHit&&r.baselineHit;}).length;
  output.push({key,family:first.family,config:first.frozenConfig,windowDraws,minimumResolvedPerWindow,minimumWindows,windows,evaluatedWindows:evaluable.length,positiveWindows:positive,negativeWindows:negative,neutralWindows:neutral,status,overallPairedDifference:totalResolved?(totalWins-totalLosses)/totalResolved:null});
 }
 output.sort((a,b)=>a.family.localeCompare(b.family)||a.key.localeCompare(b.key));
 const count=(s:StabilityStatus)=>output.filter(g=>g.status===s).length;
 return {method:"prospective-performance-temporal-stability-v1",settings:{windowDraws,minimumResolvedPerWindow,minimumWindows},summary:{forecastRecords:unique.size,resolvedRecords:validResolutions.size,groups:output.length,consistentPositive:count("consistently-positive"),consistentNegative:count("consistently-negative"),mixed:count("mixed-direction"),insufficient:count("insufficient-evidence")+count("no-directional-edge")},groups:output,limitations:["Las ventanas se anclan al primer concurso objetivo observado del ledger y usan intervalos fijos de concursos; no se eligen según los resultados.","Se muestran también ventanas sin resoluciones; no se rellenan aciertos ni se interpolan resultados.","La clasificación exige soporte mínimo por ventana y varias ventanas evaluables; con poca evidencia queda insuficiente.","La consistencia temporal es descriptiva, no prueba causalidad ni predictibilidad; no corrige multiplicidad ni dependencia entre ventanas.","Se agrupa por familia y configuración congelada exactas; no se combinan estrategias incompatibles."]};
}
