/**
 * Candidate-level persistence audit across fixed prospective contest blocks.
 * Each candidate is compared only with its own frozen paired baseline.
 * Descriptive diagnostics; no selection, promotion, or weight updates.
 */
import type {FrozenForecast,ResolvedForecast} from "./intuition-prospective";
import type {ProspectivePortfolioManifest} from "./prospective-portfolio-monitor";

export interface CandidatePersistenceBlock {
  blockIndex:number;firstDrawId:number;lastDrawId:number;partial:boolean;
  expectedDraws:number;forecastedDraws:number;resolvedDraws:number;
  pendingDraws:number;unforecastedDraws:number;hits:number;baselineHits:number;
  difference:number|null;status:"positive"|"negative"|"neutral"|"underpowered";
}
export interface CandidatePersistenceSummary {
  candidateId:string;family:string;expectedDraws:number;forecastedDraws:number;
  resolvedDraws:number;pendingDraws:number;unforecastedDraws:number;
  hits:number;baselineHits:number;overallDifference:number|null;coverage:number;
  blocks:CandidatePersistenceBlock[];supportedBlocks:number;underpoweredBlocks:number;
  positiveBlocks:number;negativeBlocks:number;neutralBlocks:number;
  positiveBlockShare:number|null;longestPositiveRun:number;longestNegativeRun:number;
  interpretation:"positive-dominant"|"negative-dominant"|"mixed"|"insufficient";
}
export interface ProspectiveCandidatePersistence {
  portfolioId:string;firstTargetDrawId:number;lastObservedDrawId:number;
  blockSize:number;minimumResolvedDrawsPerBlock:number;
  candidates:CandidatePersistenceSummary[];limitations:string[];
}
function longest(blocks:CandidatePersistenceBlock[],status:"positive"|"negative"):number {
 let best=0,current=0;
 for(const b of blocks){if(b.status===status){current++;best=Math.max(best,current);}else current=0;}
 return best;
}
export function summarizeProspectiveCandidatePersistence(
 manifest:ProspectivePortfolioManifest,forecasts:FrozenForecast[],results:ResolvedForecast[],
 lastObservedDrawId:number,options:{blockSize?:number;minimumResolvedDrawsPerBlock?:number}={}
):ProspectiveCandidatePersistence {
 const blockSize=options.blockSize??25,minimum=options.minimumResolvedDrawsPerBlock??10;
 if(!Number.isInteger(lastObservedDrawId)||lastObservedDrawId<manifest.firstTargetDrawId)throw new Error("last observed contest precedes prospective start");
 if(!Number.isInteger(blockSize)||blockSize<2)throw new Error("blockSize must be an integer >= 2");
 if(!Number.isInteger(minimum)||minimum<1||minimum>blockSize)throw new Error("minimumResolvedDrawsPerBlock must be between 1 and blockSize");
 const members=new Set(manifest.candidateIds),forecastByKey=new Map<string,FrozenForecast>(),forecastById=new Map<string,FrozenForecast>(),resultById=new Map<string,ResolvedForecast>();
 for(const f of forecasts){
  if(!members.has(f.candidateId))continue;
  if(f.targetDrawId<manifest.firstTargetDrawId||f.targetDrawId>lastObservedDrawId+1)throw new Error("forecast target outside prospective range");
  if(f.frozenConfig!==manifest.candidateConfigs[f.candidateId])throw new Error("forecast config differs from frozen manifest");
  const key=f.targetDrawId+"|"+f.candidateId;
  if(forecastByKey.has(key)||forecastById.has(f.forecastId))throw new Error("duplicate frozen forecast");
  forecastByKey.set(key,f);forecastById.set(f.forecastId,f);
 }
 for(const r of results){
  const f=forecastById.get(r.forecastId);
  if(!f){if(members.has(r.candidateId))throw new Error("resolved result has no matching frozen forecast");continue;}
  if(f.candidateId!==r.candidateId||f.targetDrawId!==r.targetDrawId)throw new Error("resolved result identity differs from frozen forecast");
  if(resultById.has(r.forecastId))throw new Error("duplicate resolved result");
  resultById.set(r.forecastId,r);
 }
 const total=lastObservedDrawId-manifest.firstTargetDrawId+1,count=Math.ceil(total/blockSize);
 const candidates:CandidatePersistenceSummary[]=[];
 for(const candidateId of manifest.candidateIds){
  const candidateForecasts=[...forecastByKey.values()].filter(f=>f.candidateId===candidateId);
  const family=candidateForecasts[0]?.family??"unknown";
  const blocks:CandidatePersistenceBlock[]=[];
  let totalForecasted=0,totalResolved=0,totalHits=0,totalBaseline=0;
  for(let i=0;i<count;i++){
   const first=manifest.firstTargetDrawId+i*blockSize,last=Math.min(lastObservedDrawId,first+blockSize-1);
   let forecasted=0,resolved=0,hits=0,baselineHits=0;
   for(let drawId=first;drawId<=last;drawId++){
    const f=forecastByKey.get(drawId+"|"+candidateId);if(!f)continue;
    forecasted++;const r=resultById.get(f.forecastId);if(!r)continue;
    resolved++;if(r.candidateHit)hits++;if(r.baselineHit)baselineHits++;
   }
   totalForecasted+=forecasted;totalResolved+=resolved;totalHits+=hits;totalBaseline+=baselineHits;
   const expected=last-first+1,difference=resolved?(hits-baselineHits)/resolved:null;
   const status:CandidatePersistenceBlock["status"]=resolved<minimum?"underpowered":difference!>0?"positive":difference!<0?"negative":"neutral";
   blocks.push({blockIndex:i+1,firstDrawId:first,lastDrawId:last,partial:last-first+1<blockSize,expectedDraws:expected,forecastedDraws:forecasted,resolvedDraws:resolved,pendingDraws:forecasted-resolved,unforecastedDraws:expected-forecasted,hits,baselineHits,difference,status});
  }
  const supported=blocks.filter(b=>b.status!=="underpowered"),positive=blocks.filter(b=>b.status==="positive").length,negative=blocks.filter(b=>b.status==="negative").length,neutral=blocks.filter(b=>b.status==="neutral").length;
  const positiveShare=supported.length?positive/supported.length:null;
  const interpretation:CandidatePersistenceSummary["interpretation"]=supported.length<3?"insufficient":positiveShare!>=.7?"positive-dominant":positiveShare!<=.3?"negative-dominant":"mixed";
  candidates.push({candidateId,family,expectedDraws:total,forecastedDraws:totalForecasted,resolvedDraws:totalResolved,pendingDraws:totalForecasted-totalResolved,unforecastedDraws:total-totalForecasted,hits:totalHits,baselineHits:totalBaseline,overallDifference:totalResolved?(totalHits-totalBaseline)/totalResolved:null,coverage:total?totalResolved/total:0,blocks,supportedBlocks:supported.length,underpoweredBlocks:blocks.length-supported.length,positiveBlocks:positive,negativeBlocks:negative,neutralBlocks:neutral,positiveBlockShare:positiveShare,longestPositiveRun:longest(blocks,"positive"),longestNegativeRun:longest(blocks,"negative"),interpretation});
 }
 return{portfolioId:manifest.portfolioId,firstTargetDrawId:manifest.firstTargetDrawId,lastObservedDrawId,blockSize,minimumResolvedDrawsPerBlock:minimum,candidates,limitations:[
  "Cada candidato se compara exclusivamente contra su propio baseline congelado; no se comparan tasas brutas entre modalidades distintas.",
  "Los bloques son consecutivos y no solapados; el último puede ser parcial y se identifica.",
  "Los bloques con menos del mínimo de resultados resueltos se consideran insuficientes y no cuentan como positivos, negativos o neutrales.",
  "Los concursos sin pronóstico no se reconstruyen; se reportan como oportunidades no pronosticadas. Pronósticos pendientes tampoco se cuentan como resueltos.",
  "Dominancia positiva/negativa es una etiqueta descriptiva por consistencia de bloques, no una prueba de significancia ni una garantía futura.",
  "No se calculan p-valores ni se cambian candidatos, pesos, portafolio, pronósticos o estados del ledger."
 ]};
}
