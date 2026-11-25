/** Immutable prospective portfolio and descriptive block monitor. */
import type {IntuitionCandidate} from "./intuition-candidate-generator";
import {selectCandidatePortfolio,type CandidatePortfolioMethod} from "./candidate-portfolio-selector";
import type {FrozenForecast,ResolvedForecast} from "./intuition-prospective";

export interface ProspectivePortfolioManifest {
 schemaVersion:1; portfolioId:string; createdAt:string; method:CandidatePortfolioMethod; seed:number;
 candidateIds:string[]; candidateConfigs:Record<string,string>; firstTargetDrawId:number; blockSize:number;
}
export interface ProspectivePortfolioBlock {
 firstDrawId:number;lastDrawId:number;partial:boolean;expectedSignals:number;forecastedSignals:number;
 resolvedSignals:number;pendingSignals:number;unforecastedSignals:number;hits:number;baselineHits:number;
 rate:number;baselineRate:number;difference:number;coverage:number;
}
export interface ProspectivePortfolioSummary {
 portfolioId:string;candidateCount:number;firstTargetDrawId:number;lastObservedDrawId:number;
 resolvedSignals:number;forecastedSignals:number;pendingSignals:number;unforecastedSignals:number;
 hits:number;baselineHits:number;rate:number;baselineRate:number;difference:number;coverage:number;
 blockSize:number;blocks:ProspectivePortfolioBlock[];positiveBlocks:number;negativeBlocks:number;
 neutralBlocks:number;rateRange:number;rateStdDev:number;meanBlockDifference:number;
}
export function createProspectivePortfolioManifest(catalog:IntuitionCandidate[],options:{
 createdAt:string;firstTargetDrawId:number;size?:number;method?:CandidatePortfolioMethod;seed?:number;blockSize?:number;
}):ProspectivePortfolioManifest{
 const {createdAt,firstTargetDrawId}=options,size=options.size??20,method=options.method??"family-balanced",seed=options.seed??20261125,blockSize=options.blockSize??25;
 if(!Number.isFinite(Date.parse(createdAt))||!Number.isInteger(firstTargetDrawId)||firstTargetDrawId<1)throw new Error("valid creation timestamp and first target contest required");
 if(!Number.isInteger(blockSize)||blockSize<2)throw new Error("block size must be an integer >= 2");
 const portfolio=selectCandidatePortfolio(method,size,seed,catalog);
 if(portfolio.candidateIds.length!==size)throw new Error("portfolio could not meet requested size");
 const byId=new Map(catalog.map(c=>[c.id,c]));
 const candidateConfigs=Object.fromEntries(portfolio.candidateIds.map(id=>[id,byId.get(id)!.frozenConfig]));
 const identity=[method,seed,firstTargetDrawId,blockSize,...portfolio.candidateIds].join("|");
 // Stable identity is based on frozen design, not on later outcomes.
 let hash=2166136261;for(let i=0;i<identity.length;i++)hash=Math.imul(hash^identity.charCodeAt(i),16777619);
 return{schemaVersion:1,portfolioId:"tris-portfolio-"+(hash>>>0).toString(16).padStart(8,"0"),createdAt,method,seed,candidateIds:portfolio.candidateIds,candidateConfigs,firstTargetDrawId,blockSize};
}
export function validateProspectivePortfolioManifest(manifest:ProspectivePortfolioManifest,catalog:IntuitionCandidate[]):void{
 if(manifest.schemaVersion!==1||!manifest.portfolioId||!Number.isFinite(Date.parse(manifest.createdAt)))throw new Error("invalid prospective portfolio manifest");
 if(!Number.isInteger(manifest.firstTargetDrawId)||manifest.firstTargetDrawId<1||!Number.isInteger(manifest.blockSize)||manifest.blockSize<2)throw new Error("invalid prospective portfolio range or block size");
 if(!manifest.candidateIds.length||new Set(manifest.candidateIds).size!==manifest.candidateIds.length)throw new Error("prospective portfolio candidate IDs must be nonempty and unique");
 const byId=new Map(catalog.map(c=>[c.id,c]));
 for(const id of manifest.candidateIds){const c=byId.get(id);if(!c)throw new Error("manifest references unknown candidate: "+id);if(manifest.candidateConfigs[id]!==c.frozenConfig)throw new Error("candidate frozen config changed: "+id);}
}
export function summarizeProspectivePortfolio(manifest:ProspectivePortfolioManifest,forecasts:FrozenForecast[],results:ResolvedForecast[],lastObservedDrawId:number):ProspectivePortfolioSummary{
 if(!Number.isInteger(lastObservedDrawId)||lastObservedDrawId<manifest.firstTargetDrawId)throw new Error("last observed contest precedes prospective start");
 const members=new Set(manifest.candidateIds),forecastByKey=new Map<string,FrozenForecast>(),resultById=new Map<string,ResolvedForecast>();
 for(const f of forecasts){
  if(!members.has(f.candidateId))continue;
  if(f.targetDrawId<manifest.firstTargetDrawId)throw new Error("forecast predates frozen portfolio start");
  const key=f.targetDrawId+"|"+f.candidateId;if(forecastByKey.has(key))throw new Error("duplicate candidate forecast for target contest");
  if(f.frozenConfig!==manifest.candidateConfigs[f.candidateId])throw new Error("forecast config differs from frozen portfolio manifest");
  forecastByKey.set(key,f);
 }
 for(const r of results){
  if(!members.has(r.candidateId))continue;
  const f=forecastByKey.get(r.targetDrawId+"|"+r.candidateId);
  if(!f||f.forecastId!==r.forecastId)throw new Error("resolved result has no matching frozen portfolio forecast");
  if(resultById.has(r.forecastId))throw new Error("duplicate resolved forecast");
  resultById.set(r.forecastId,r);
 }
 const blocks:ProspectivePortfolioBlock[]=[];
 for(let first=manifest.firstTargetDrawId;first<=lastObservedDrawId;first+=manifest.blockSize){
  const last=Math.min(lastObservedDrawId,first+manifest.blockSize-1),partial=last-first+1<manifest.blockSize;
  let forecastedSignals=0,resolvedSignals=0,hits=0,baselineHits=0;
  for(let drawId=first;drawId<=last;drawId++)for(const candidateId of manifest.candidateIds){
   const f=forecastByKey.get(drawId+"|"+candidateId);if(!f)continue;forecastedSignals++;
   const r=resultById.get(f.forecastId);if(!r)continue;resolvedSignals++;if(r.candidateHit)hits++;if(r.baselineHit)baselineHits++;
  }
  const expectedSignals=(last-first+1)*manifest.candidateIds.length,pendingSignals=forecastedSignals-resolvedSignals,unforecastedSignals=expectedSignals-forecastedSignals;
  blocks.push({firstDrawId:first,lastDrawId:last,partial,expectedSignals,forecastedSignals,resolvedSignals,pendingSignals,unforecastedSignals,hits,baselineHits,rate:resolvedSignals?hits/resolvedSignals:0,baselineRate:resolvedSignals?baselineHits/resolvedSignals:0,difference:resolvedSignals?(hits-baselineHits)/resolvedSignals:0,coverage:expectedSignals?resolvedSignals/expectedSignals:0});
 }
 const resolvedSignals=blocks.reduce((n,b)=>n+b.resolvedSignals,0),forecastedSignals=blocks.reduce((n,b)=>n+b.forecastedSignals,0),pendingSignals=blocks.reduce((n,b)=>n+b.pendingSignals,0),unforecastedSignals=blocks.reduce((n,b)=>n+b.unforecastedSignals,0),hits=blocks.reduce((n,b)=>n+b.hits,0),baselineHits=blocks.reduce((n,b)=>n+b.baselineHits,0);
 const rates=blocks.filter(b=>b.resolvedSignals>0).map(b=>b.rate),mean=rates.length?rates.reduce((a,b)=>a+b,0)/rates.length:0;
 const rateStdDev=rates.length?Math.sqrt(rates.reduce((n,x)=>n+(x-mean)**2,0)/rates.length):0;
 const positiveBlocks=blocks.filter(b=>b.resolvedSignals>0&&b.difference>0).length,negativeBlocks=blocks.filter(b=>b.resolvedSignals>0&&b.difference<0).length;
 return{portfolioId:manifest.portfolioId,candidateCount:manifest.candidateIds.length,firstTargetDrawId:manifest.firstTargetDrawId,lastObservedDrawId,resolvedSignals,forecastedSignals,pendingSignals,unforecastedSignals,hits,baselineHits,rate:resolvedSignals?hits/resolvedSignals:0,baselineRate:resolvedSignals?baselineHits/resolvedSignals:0,difference:resolvedSignals?(hits-baselineHits)/resolvedSignals:0,coverage:(lastObservedDrawId-manifest.firstTargetDrawId+1)*manifest.candidateIds.length?resolvedSignals/((lastObservedDrawId-manifest.firstTargetDrawId+1)*manifest.candidateIds.length):0,blockSize:manifest.blockSize,blocks,positiveBlocks,negativeBlocks,neutralBlocks:blocks.filter(b=>!b.resolvedSignals||b.difference===0).length,rateRange:rates.length?Math.max(...rates)-Math.min(...rates):0,rateStdDev,meanBlockDifference:blocks.length?blocks.reduce((n,b)=>n+b.difference,0)/blocks.length:0};
}
