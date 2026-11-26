/** Phase 43: descriptive prospective performance by exact frozen modality/configuration. */
import type {FrozenForecast,ResolvedForecast} from "./intuition-prospective";
export interface PerformanceGroup {
 key:string; family:string; config:string; position:number|null; mode:string|null; method:string|null; poolSize:number|null; window:number|null;
 forecasts:number; resolved:number; pending:number; candidateHits:number; baselineHits:number;
 candidateRate:number|null; baselineRate:number|null; candidateWilson:{lower:number;upper:number}|null; baselineWilson:{lower:number;upper:number}|null;
 candidateOnlyWins:number; baselineOnlyWins:number; ties:number; pairedDifference:number|null;
}
export interface ProspectivePerformanceReport {
 method:"prospective-performance-by-config-v1";
 summary:{forecastRecords:number;resolvedRecords:number;pendingRecords:number;groups:number;groupsWithEvidence:number;duplicateForecastIds:number;duplicateOrMismatchedResolutions:number};
 groups:PerformanceGroup[];
 limitations:string[];
}
function wilson(hits:number,n:number):{lower:number;upper:number}|null {
 if(n===0)return null; const z=1.959963984540054,p=hits/n,z2=z*z,den=1+z2/n,center=(p+z2/(2*n))/den,half=z*Math.sqrt((p*(1-p)+z2/(4*n))/n)/den;
 return {lower:Math.max(0,center-half),upper:Math.min(1,center+half)};
}
function numeric(config:Record<string,unknown>,key:string):number|null {const v=config[key];return typeof v==="number"&&Number.isFinite(v)?v:null;}
export function buildProspectivePerformanceReport(forecasts:FrozenForecast[],resolutions:ResolvedForecast[]):ProspectivePerformanceReport {
 const ids=new Set<string>(),duplicateIds=new Set<string>(); for(const f of forecasts){if(ids.has(f.forecastId))duplicateIds.add(f.forecastId);ids.add(f.forecastId);}
 const byId=new Map<string,FrozenForecast>(); for(const f of forecasts)if(!byId.has(f.forecastId))byId.set(f.forecastId,f); const uniqueForecasts=[...byId.values()];
 const resolved=new Map<string,ResolvedForecast>();let invalidResolutions=0;
 for(const r of resolutions){const f=byId.get(r.forecastId);if(!f||f.targetDrawId!==r.targetDrawId||resolved.has(r.forecastId)){invalidResolutions++;continue;}resolved.set(r.forecastId,r);}
 const grouped=new Map<string,{forecast:FrozenForecast;resolved:ResolvedForecast}[]>();
 for(const f of uniqueForecasts){const key=f.family+"|"+f.frozenConfig;const list=grouped.get(key)??[];const r=resolved.get(f.forecastId);list.push({forecast:f,resolved:r as ResolvedForecast});grouped.set(key,list);}
 const groups:PerformanceGroup[]=[];
 for(const [key,items] of grouped){
  const first=items[0].forecast;let config:Record<string,unknown>={};try{const parsed=JSON.parse(first.frozenConfig);if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))config=parsed;}catch{}
  const valid=items.filter(x=>x.resolved&&x.resolved.forecastId===x.forecast.forecastId),n=valid.length,ch=valid.filter(x=>x.resolved.candidateHit).length,bh=valid.filter(x=>x.resolved.baselineHit).length,cw=valid.filter(x=>x.resolved.candidateHit&&!x.resolved.baselineHit).length,bw=valid.filter(x=>!x.resolved.candidateHit&&x.resolved.baselineHit).length,ties=n-cw-bw;
  groups.push({key,family:first.family,config:first.frozenConfig,position:numeric(config,"position"),mode:typeof config.mode==="string"?config.mode:null,method:typeof config.method==="string"?config.method:null,poolSize:numeric(config,"poolSize"),window:numeric(config,"window"),forecasts:items.length,resolved:n,pending:items.length-n,candidateHits:ch,baselineHits:bh,candidateRate:n?ch/n:null,baselineRate:n?bh/n:null,candidateWilson:wilson(ch,n),baselineWilson:wilson(bh,n),candidateOnlyWins:cw,baselineOnlyWins:bw,ties,pairedDifference:n?(cw-bw)/n:null});
 }
 groups.sort((a,b)=>a.family.localeCompare(b.family)||a.key.localeCompare(b.key));
 const resolvedRecords=groups.reduce((s,g)=>s+g.resolved,0),forecastRecords=uniqueForecasts.length;
 return {method:"prospective-performance-by-config-v1",summary:{forecastRecords,resolvedRecords,pendingRecords:Math.max(0,forecastRecords-resolvedRecords),groups:groups.length,groupsWithEvidence:groups.filter(g=>g.resolved>0).length,duplicateForecastIds:duplicateIds.size,duplicateOrMismatchedResolutions:invalidResolutions},groups,limitations:["Cada grupo conserva la familia y la configuración congelada exactas; no se mezclan posiciones, modalidades, tamaños de pool ni ventanas diferentes.","Las tasas e intervalos de Wilson son descriptivos y no corrigen selección múltiple ni dependencia temporal entre sorteos.","La diferencia pareada compara los mismos pronósticos resueltos; no demuestra predictibilidad ni ventaja futura.","Los pronósticos pendientes se conservan en el denominador de cobertura, pero no en tasas de acierto.","Los registros duplicados de pronóstico se señalan; para el cálculo se conserva una sola resolución por ID y se evita duplicar la fila dentro del grupo. La auditoría de integridad debe revisarse por separado."]};
}
