/** Phase 42: read-only coverage audit of every contest in the prospective observation window. */
import type {Draw} from "../research-core";
import type {FrozenForecast,ResolvedForecast} from "./intuition-prospective";
export type CoverageStatus="no-forecast-record"|"forecast-pending"|"resolved"|"result-present-but-unresolved"|"forecast-target-not-yet-observed";
export interface ContestCoverageRow {targetDrawId:number;observed:boolean;forecastCount:number;resolvedCount:number;pendingCount:number;status:CoverageStatus;}
export interface ProspectiveCoverageReport {method:"prospective-contest-coverage-v1";summary:{firstTargetDrawId:number;lastObservedDrawId:number;lastAuditedTargetDrawId:number;contestsAudited:number;observedContests:number;contestsWithForecasts:number;contestsWithoutForecasts:number;contestsFullyResolved:number;contestsWithPendingForecasts:number;resultsPresentButUnresolved:number;totalForecasts:number;totalResolved:number;totalPending:number;coverageRate:number|null};contests:ContestCoverageRow[];limitations:string[];}
export function auditProspectiveCoverage(draws:Draw[],forecasts:FrozenForecast[],resolutions:ResolvedForecast[]):ProspectiveCoverageReport {
 if(!draws.length)throw new Error("coverage audit requires validated local draw history");
 for(let i=1;i<draws.length;i++)if(draws[i].drawId!==draws[i-1].drawId+1)throw new Error("draw history must be contiguous");
 if(!forecasts.length)throw new Error("coverage audit requires at least one frozen forecast to define the prospective window");
 const firstTargetDrawId=Math.min(...forecasts.map(f=>f.targetDrawId));
 const lastObservedDrawId=draws.at(-1)!.drawId;
 const lastAuditedTargetDrawId=Math.max(lastObservedDrawId,Math.max(...forecasts.map(f=>f.targetDrawId)));
 const forecastCounts=new Map<number,number>(),resolvedCounts=new Map<number,number>();
 for(const f of forecasts)forecastCounts.set(f.targetDrawId,(forecastCounts.get(f.targetDrawId)??0)+1);
 const forecastIds=new Set(forecasts.map(f=>f.forecastId));
 for(const r of resolutions)if(forecastIds.has(r.forecastId))resolvedCounts.set(r.targetDrawId,(resolvedCounts.get(r.targetDrawId)??0)+1);
 const contests:ContestCoverageRow[]=[];
 for(let id=firstTargetDrawId;id<=lastAuditedTargetDrawId;id++){
  const forecastCount=forecastCounts.get(id)??0,resolvedCount=resolvedCounts.get(id)??0,pendingCount=Math.max(0,forecastCount-resolvedCount),observed=id<=lastObservedDrawId;
  let status:CoverageStatus;
  if(!observed)status="forecast-target-not-yet-observed";
  else if(forecastCount===0)status="no-forecast-record";
  else if(resolvedCount===0)status="result-present-but-unresolved";
  else if(pendingCount>0)status="forecast-pending";
  else status="resolved";
  contests.push({targetDrawId:id,observed,forecastCount,resolvedCount,pendingCount,status});
 }
 const observedContests=contests.filter(x=>x.observed),contestsWithForecasts=observedContests.filter(x=>x.forecastCount>0).length,contestsWithoutForecasts=observedContests.filter(x=>x.forecastCount===0).length;
 const totalForecasts=forecasts.length,totalResolved=resolutions.filter(r=>forecastIds.has(r.forecastId)).length,totalPending=Math.max(0,totalForecasts-totalResolved);
 return {method:"prospective-contest-coverage-v1",summary:{firstTargetDrawId,lastObservedDrawId,lastAuditedTargetDrawId,contestsAudited:contests.length,observedContests:observedContests.length,contestsWithForecasts,contestsWithoutForecasts,contestsFullyResolved:observedContests.filter(x=>x.forecastCount>0&&x.pendingCount===0&&x.resolvedCount>0).length,contestsWithPendingForecasts:observedContests.filter(x=>x.pendingCount>0).length,resultsPresentButUnresolved:observedContests.filter(x=>x.status==="result-present-but-unresolved").length,totalForecasts,totalResolved,totalPending,coverageRate:observedContests.length?contestsWithForecasts/observedContests.length:null},contests,limitations:["La ausencia de pronóstico se reporta como falta de registro; no se atribuye una causa ni se inventa una explicación.","El análisis cubre desde el primer concurso objetivo registrado hasta el último concurso del CSV local; no demuestra que el CSV completo se haya sincronizado en cada momento.","La cobertura mide presencia de registros, no calidad predictiva ni ventaja sobre el azar.","La auditoría es de solo lectura y no reconstruye pronósticos retroactivos ni modifica los ledgers."]};
}
