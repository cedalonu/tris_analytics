/** Phase 41: read-only integrity audit for frozen prospective forecast ledgers. */
import type {FrozenForecast,ResolvedForecast} from "./intuition-prospective";
import {MODES} from "./draw-evolution";
export type ProspectiveLedgerIssueCode="duplicate-forecast-id"|"duplicate-candidate-target"|"invalid-forecast-identity"|"invalid-target-order"|"invalid-history-fingerprint"|"invalid-digit-pool"|"orphan-resolution"|"duplicate-resolution"|"immutable-forecast-mismatch"|"invalid-actual-result"|"invalid-resolution-time"|"resolution-before-generation";
export interface ProspectiveLedgerIssue {code:ProspectiveLedgerIssueCode;recordId:string;detail:string;}
export interface ProspectiveLedgerAuditReport {method:"read-only-prospective-ledger-integrity-v1";summary:{forecasts:number;resolutions:number;pending:number;resolved:number;orphanResolutions:number;duplicateForecastIds:number;duplicateCandidateTargets:number;issues:number;integrity:"clean"|"warnings"|"invalid"};coverage:Array<{targetDrawId:number;forecasts:number;resolved:number;pending:number}>;issues:ProspectiveLedgerIssue[];limitations:string[];}
const digits=(xs:unknown,length:number):boolean=>Array.isArray(xs)&&xs.length>0&&xs.every(x=>typeof x==="string"&&/^[0-9]+$/.test(x)&&x.length===length);
const outcomeLength=(f:FrozenForecast):number=>{
 if(f.family!=="transition")return 1;
 try{const config=JSON.parse(f.frozenConfig) as {mode?:string};return MODES.find(x=>x.mode===config.mode)?.positions.length??-1;}
 catch{return -1;}
};
const immutable=(f:FrozenForecast,r:ResolvedForecast):boolean=>f.schemaVersion===r.schemaVersion&&f.forecastId===r.forecastId&&f.candidateId===r.candidateId&&f.family===r.family&&f.frozenConfig===r.frozenConfig&&f.targetDrawId===r.targetDrawId&&f.generatedAt===r.generatedAt&&f.historyThroughDrawId===r.historyThroughDrawId&&f.historySha256===r.historySha256&&JSON.stringify(f.prediction)===JSON.stringify(r.prediction)&&JSON.stringify(f.baseline)===JSON.stringify(r.baseline);
export function auditProspectiveLedger(forecasts:FrozenForecast[],resolutions:ResolvedForecast[]):ProspectiveLedgerAuditReport {
 const issues:ProspectiveLedgerIssue[]=[];const add=(code:ProspectiveLedgerIssueCode,recordId:string,detail:string)=>issues.push({code,recordId,detail});
 const forecastById=new Map<string,FrozenForecast>(),candidateTargets=new Set<string>();let duplicateForecastIds=0,duplicateCandidateTargets=0;
 for(const f of forecasts){
  if(forecastById.has(f.forecastId)){duplicateForecastIds++;add("duplicate-forecast-id",f.forecastId,"El identificador de pronóstico aparece más de una vez.");}else forecastById.set(f.forecastId,f);
  const pair=f.candidateId+"|"+f.targetDrawId;if(candidateTargets.has(pair)){duplicateCandidateTargets++;add("duplicate-candidate-target",f.forecastId,"Existe más de un pronóstico para el mismo candidato y concurso.");}candidateTargets.add(pair);
  if(!f.forecastId||!f.candidateId||!f.frozenConfig||f.schemaVersion!==1)add("invalid-forecast-identity",f.forecastId||"(sin-id)","Faltan campos de identidad o schemaVersion no soportada.");
  if(!Number.isInteger(f.targetDrawId)||f.targetDrawId!==f.historyThroughDrawId+1)add("invalid-target-order",f.forecastId,"El concurso objetivo no es exactamente el siguiente al historial congelado.");
  if(!/^[a-f0-9]{64}$/i.test(f.historySha256))add("invalid-history-fingerprint",f.forecastId,"La huella SHA-256 del historial no tiene formato válido.");
  const outcomeDigits=outcomeLength(f);
  if(outcomeDigits<1||!digits(f.prediction,outcomeDigits)||!digits(f.baseline,outcomeDigits))add("invalid-digit-pool",f.forecastId,"Predicción y baseline deben contener cadenas numéricas con la longitud de salida definida por la familia y el modo congelado.");
  if(!Number.isFinite(Date.parse(f.generatedAt)))add("invalid-forecast-identity",f.forecastId,"generatedAt no es una fecha válida.");
 }
 const resolutionById=new Map<string,ResolvedForecast>();
 for(const r of resolutions){
  if(resolutionById.has(r.forecastId)){add("duplicate-resolution",r.forecastId,"El pronóstico tiene más de una resolución.");continue;}resolutionById.set(r.forecastId,r);
  const f=forecastById.get(r.forecastId);if(!f){add("orphan-resolution",r.forecastId,"La resolución no tiene pronóstico congelado correspondiente.");continue;}
  if(!immutable(f,r))add("immutable-forecast-mismatch",r.forecastId,"La resolución no conserva exactamente los campos congelados del pronóstico.");
  if(!/^\d{5}$/.test(r.actual))add("invalid-actual-result",r.forecastId,"El resultado real debe ser una cadena de cinco dígitos.");
  const generated=Date.parse(f.generatedAt),resolved=Date.parse(r.resolvedAt);
  if(!Number.isFinite(resolved))add("invalid-resolution-time",r.forecastId,"resolvedAt no es una fecha válida.");else if(Number.isFinite(generated)&&resolved<generated)add("resolution-before-generation",r.forecastId,"La resolución aparece antes de la generación del pronóstico.");
  if(typeof r.candidateHit!=="boolean"||typeof r.baselineHit!=="boolean")add("invalid-actual-result",r.forecastId,"Los indicadores de acierto deben ser booleanos.");
 }
 const coverageMap=new Map<number,{forecasts:number;resolved:number}>();for(const f of forecasts){const x=coverageMap.get(f.targetDrawId)??{forecasts:0,resolved:0};x.forecasts++;if(resolutionById.has(f.forecastId))x.resolved++;coverageMap.set(f.targetDrawId,x);}
 const coverage=[...coverageMap].sort((a,b)=>a[0]-b[0]).map(([targetDrawId,x])=>({targetDrawId,...x,pending:x.forecasts-x.resolved}));
 const orphanResolutions=issues.filter(x=>x.code==="orphan-resolution").length,resolved=forecasts.filter(f=>resolutionById.has(f.forecastId)).length,pending=forecasts.length-resolved;
 const invalidCodes=new Set<ProspectiveLedgerIssueCode>(["invalid-forecast-identity","invalid-target-order","invalid-history-fingerprint","invalid-digit-pool","orphan-resolution","immutable-forecast-mismatch","invalid-actual-result","invalid-resolution-time","resolution-before-generation"]);
 const integrity=issues.some(x=>invalidCodes.has(x.code))?"invalid":issues.length?"warnings":"clean";
 return{method:"read-only-prospective-ledger-integrity-v1",summary:{forecasts:forecasts.length,resolutions:resolutions.length,pending,resolved,orphanResolutions,duplicateForecastIds,duplicateCandidateTargets,issues:issues.length,integrity},coverage,issues,limitations:["La auditoría es de integridad estructural; no valida si un método predice mejor que el azar.","No puede verificar que generatedAt preceda al sorteo si el CSV solo conserva fecha sin hora oficial.","Los indicadores candidateHit y baselineHit se verifican por tipo, no se recalculan sin reinterpretar la configuración histórica.","No reconstruye pronósticos faltantes, no corrige ni modifica archivos y no altera candidatos, pesos, señales o portafolios."]};
}
