/**
 * Regime-conditioned persistence audit for frozen prospective TRIS signals.
 * Regime labels must be assigned using information available strictly before each target draw.
 */
import type {FrozenForecast,ResolvedForecast} from "./intuition-prospective";
import type {ProspectivePortfolioManifest} from "./prospective-portfolio-monitor";

export interface ProspectiveRegimeLabel {
  drawId:number; regimeId:string; method:string;
  sourceStartDrawId:number; sourceEndDrawId:number;
}
export interface RegimeCandidateSummary {
  regimeId:string; candidateId:string; family:string;
  expectedDraws:number; forecastedDraws:number; resolvedDraws:number;
  pendingDraws:number; unforecastedDraws:number; hits:number; baselineHits:number;
  difference:number|null; coverage:number;
  status:"positive"|"negative"|"neutral"|"underpowered";
}
export interface RegimePersistenceReport {
  portfolioId:string; firstTargetDrawId:number; lastObservedDrawId:number;
  minimumResolvedDraws:number; regimes:string[];
  summaries:RegimeCandidateSummary[]; limitations:string[];
}
export function summarizeProspectiveRegimePersistence(
 manifest:ProspectivePortfolioManifest, forecasts:FrozenForecast[], results:ResolvedForecast[],
 labels:ProspectiveRegimeLabel[], lastObservedDrawId:number,
 options:{minimumResolvedDraws?:number}={}
):RegimePersistenceReport {
 const minimum=options.minimumResolvedDraws??10;
 if(!Number.isInteger(minimum)||minimum<1) throw new Error("minimumResolvedDraws must be a positive integer");
 if(!Number.isInteger(lastObservedDrawId)||lastObservedDrawId<manifest.firstTargetDrawId) throw new Error("invalid prospective observation range");
 const labelByDraw=new Map<number,ProspectiveRegimeLabel>();
 for(const label of labels){
  if(!Number.isInteger(label.drawId)||label.drawId<manifest.firstTargetDrawId||label.drawId>lastObservedDrawId) throw new Error("regime label draw is outside observed prospective range");
  if(!label.regimeId.trim()||!label.method.trim()) throw new Error("regime label requires regimeId and method");
  if(!Number.isInteger(label.sourceStartDrawId)||!Number.isInteger(label.sourceEndDrawId)||label.sourceStartDrawId<1||label.sourceEndDrawId<label.sourceStartDrawId||label.sourceEndDrawId>=label.drawId) throw new Error("regime label must use strictly pre-target history");
  if(labelByDraw.has(label.drawId)) throw new Error("duplicate regime label for draw");
  labelByDraw.set(label.drawId,label);
 }
 for(let d=manifest.firstTargetDrawId;d<=lastObservedDrawId;d++) if(!labelByDraw.has(d)) throw new Error("missing pre-result regime label for draw "+d);
 const members=new Set(manifest.candidateIds), forecastByKey=new Map<string,FrozenForecast>(), forecastById=new Map<string,FrozenForecast>(), resultById=new Map<string,ResolvedForecast>();
 for(const f of forecasts){
  if(!members.has(f.candidateId)) continue;
  if(f.targetDrawId<manifest.firstTargetDrawId||f.targetDrawId>lastObservedDrawId+1) throw new Error("forecast target outside prospective range");
  if(f.frozenConfig!==manifest.candidateConfigs[f.candidateId]) throw new Error("forecast config differs from frozen manifest");
  const key=f.targetDrawId+"|"+f.candidateId;
  if(forecastByKey.has(key)||forecastById.has(f.forecastId)) throw new Error("duplicate frozen forecast");
  forecastByKey.set(key,f);forecastById.set(f.forecastId,f);
 }
 for(const r of results){
  const f=forecastById.get(r.forecastId);
  if(!f){if(members.has(r.candidateId))throw new Error("resolved result has no matching frozen forecast");continue;}
  if(f.candidateId!==r.candidateId||f.targetDrawId!==r.targetDrawId) throw new Error("resolved result identity differs from frozen forecast");
  if(resultById.has(r.forecastId)) throw new Error("duplicate resolved result");
  resultById.set(r.forecastId,r);
 }
 const regimes=[...new Set(labels.map(x=>x.regimeId))].sort();
 const summaries:RegimeCandidateSummary[]=[];
 for(const regimeId of regimes) for(const candidateId of manifest.candidateIds){
  const draws=labels.filter(x=>x.regimeId===regimeId).map(x=>x.drawId);
  let forecasted=0,resolved=0,hits=0,baselineHits=0;
  for(const drawId of draws){
   const f=forecastByKey.get(drawId+"|"+candidateId);if(!f)continue;
   forecasted++;const r=resultById.get(f.forecastId);if(!r)continue;
   resolved++;if(r.candidateHit)hits++;if(r.baselineHit)baselineHits++;
  }
  const difference=resolved?(hits-baselineHits)/resolved:null;
  summaries.push({regimeId,candidateId,family:draws.map(d=>forecastByKey.get(d+"|"+candidateId)?.family).find(Boolean)??"unknown",
   expectedDraws:draws.length,forecastedDraws:forecasted,resolvedDraws:resolved,pendingDraws:forecasted-resolved,
   unforecastedDraws:draws.length-forecasted,hits,baselineHits,difference,coverage:draws.length?resolved/draws.length:0,
   status:resolved<minimum?"underpowered":difference!>0?"positive":difference!<0?"negative":"neutral"});
 }
 return {portfolioId:manifest.portfolioId,firstTargetDrawId:manifest.firstTargetDrawId,lastObservedDrawId,minimumResolvedDraws:minimum,regimes,summaries,
 limitations:[
  "Cada etiqueta de régimen declara el método y el intervalo histórico usado; sourceEndDrawId debe ser anterior al concurso objetivo para evitar fuga de información.",
  "La calidad de la segmentación depende del método de etiquetas aportado. Este auditor no descubre ni optimiza regímenes automáticamente.",
  "Cada candidato se compara solo con su baseline congelado; no se comparan tasas brutas entre candidatos o familias.",
  "Pronósticos pendientes y oportunidades sin pronóstico se mantienen separados; no se reconstruyen datos ausentes.",
  "Los resultados por régimen son descriptivos y pueden tener soporte desigual; no son pruebas de significancia ni garantías predictivas.",
  "No se modifican pronósticos, candidatos, pesos, portafolio ni ledger."
 ]};
}
