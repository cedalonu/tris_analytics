import {assessHistoryQuality, type HistoryQualityInput} from "./history-quality";
export type EligibilityStatus="eligible"|"review"|"blocked";
export type EligibilityConfig={minimumQuality:number;minimumRevisions:number};
export type EligibilityResult={status:EligibilityStatus;qualityScore:number;revisionCount:number;reasons:string[]};
/** Research-stage gate only: never a predictive score or lottery forecast. */
export function assessEligibility(input:HistoryQualityInput,config:EligibilityConfig={minimumQuality:75,minimumRevisions:3}):EligibilityResult{
 const q=assessHistoryQuality(input),reasons:string[]=[];
 const structural=q.invalidDates>0||q.outOfOrder>0||q.duplicateDates>0||q.identityMismatch>0;
 if(q.invalidDates)reasons.push("Fechas inválidas");
 if(q.outOfOrder)reasons.push("Cronología desordenada");
 if(q.duplicateDates)reasons.push("Fechas duplicadas");
 if(q.identityMismatch)reasons.push("Identidad inconsistente");
 if(q.score<config.minimumQuality)reasons.push(`Calidad ${q.score}/100 menor al umbral ${config.minimumQuality}`);
 if(q.records<config.minimumRevisions)reasons.push(`Historial de ${q.records} revisiones; mínimo ${config.minimumRevisions}`);
 const status:EligibilityStatus=structural||q.score<config.minimumQuality?"blocked":q.records<config.minimumRevisions?"review":"eligible";
 if(!reasons.length)reasons.push("Cumple criterios de calidad y profundidad para análisis de investigación");
 return {status,qualityScore:q.score,revisionCount:q.records,reasons};
}