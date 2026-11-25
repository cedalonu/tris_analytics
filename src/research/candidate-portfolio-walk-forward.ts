/** Descriptive walk-forward evaluation of frozen structural candidate portfolios.
 * Uses only pre-target history via the strict intuition walk-forward engine.
 * Aggregated signal rows are dependent; no portfolio-level p-value or profit claim is made.
 */
import type {Draw} from "../research-core";
import type {IntuitionCandidate} from "./intuition-candidate-generator";
import type {CandidatePortfolio} from "./candidate-portfolio-selector";
import {runIntuitionWalkForward,type PhaseBoundary} from "./intuition-walk-forward-engine";
import type {EvaluationPhase} from "./intuition-evaluator";

export interface PortfolioPhaseSummary {
 phase:EvaluationPhase; candidateCount:number; signalDraws:number; distinctDraws:number;
 hits:number; baselineHits:number; rate:number; baselineRate:number; difference:number;
 coverage:number; skipped:number;
}
export interface PortfolioStabilityBlock extends PortfolioPhaseSummary {
 firstDrawId:number; lastDrawId:number; partial:boolean; underpowered:boolean;
}
export interface PortfolioStabilitySummary {
 blockSize:number; blockCount:number; positiveBlocks:number; negativeBlocks:number; neutralBlocks:number;
 meanRate:number; minRate:number; maxRate:number; rateRange:number; rateStdDev:number;
 meanDifference:number; positiveDifferenceBlocks:number; negativeDifferenceBlocks:number;
 longestPositiveStreak:number; longestNegativeStreak:number;
}
export interface PortfolioWalkForwardReport {
 method:string; seed:number; candidateIds:string[];
 phases:PortfolioPhaseSummary[]; stabilityBlocks:PortfolioStabilityBlock[];
 stability:PortfolioStabilitySummary|null; warnings:string[];
}
const PHASES:EvaluationPhase[]=["discovery","validation","holdout","prospective"];
export function buildPortfolioPhaseBoundaries(draws:Draw[],fractions:{discovery?:number;validation?:number}={}):PhaseBoundary[]{
 if(draws.length<201)throw new Error("at least 201 contiguous draws are required");
 const d=fractions.discovery??.6,v=fractions.validation??.2;
 if(!Number.isFinite(d)||!Number.isFinite(v)||d<=0||v<=0||d+v>=1)throw new Error("phase fractions must be positive and sum to less than one");
 for(let i=1;i<draws.length;i++)if(draws[i].drawId!==draws[i-1].drawId+1)throw new Error("draw IDs must be contiguous and ascending");
 const first=200,n=draws.length-first,discoveryEnd=first+Math.floor(n*d),validationEnd=first+Math.floor(n*(d+v));
 const bounds:PhaseBoundary[]=[];
 if(discoveryEnd>first)bounds.push({phase:"discovery",firstDrawId:draws[first].drawId,lastDrawId:draws[discoveryEnd-1].drawId});
 if(validationEnd>discoveryEnd)bounds.push({phase:"validation",firstDrawId:draws[discoveryEnd].drawId,lastDrawId:draws[validationEnd-1].drawId});
 if(draws.length>validationEnd)bounds.push({phase:"holdout",firstDrawId:draws[validationEnd].drawId,lastDrawId:draws.at(-1)!.drawId});
 return bounds;
}
export function buildHoldoutStabilityBlocks(boundaries:PhaseBoundary[],blockSize=25,minPartialSize=10):Array<{phase:"holdout";firstDrawId:number;lastDrawId:number;partial:boolean;underpowered:boolean}>{
 if(!Number.isInteger(blockSize)||blockSize<2)throw new Error("block size must be an integer >= 2");
 if(!Number.isInteger(minPartialSize)||minPartialSize<1||minPartialSize>blockSize)throw new Error("minimum partial block size must be between 1 and block size");
 const holdout=boundaries.find(b=>b.phase==="holdout");
 if(!holdout)return [];
 const blocks=[];
 for(let first=holdout.firstDrawId;first<=holdout.lastDrawId;first+=blockSize){
  const last=Math.min(holdout.lastDrawId,first+blockSize-1),size=last-first+1,partial=size<blockSize;
  blocks.push({phase:"holdout" as const,firstDrawId:first,lastDrawId:last,partial,underpowered:partial&&size<minPartialSize});
 }
 return blocks;
}
function summarizeStability(blocks:PortfolioStabilityBlock[],blockSize:number):PortfolioStabilitySummary|null{
 if(!blocks.length)return null;
 const rates=blocks.filter(b=>b.signalDraws>0).map(b=>b.rate),differences=blocks.filter(b=>b.signalDraws>0).map(b=>b.difference);
 const mean=(values:number[])=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
 const avg=mean(rates),variance=mean(rates.map(x=>(x-avg)**2));
 let positive=0,negative=0,longestPositive=0,longestNegative=0,currentPositive=0,currentNegative=0;
 for(const b of blocks){
  if(b.signalDraws&&b.difference>0){positive++;currentPositive++;currentNegative=0;longestPositive=Math.max(longestPositive,currentPositive);}
  else if(b.signalDraws&&b.difference<0){negative++;currentNegative++;currentPositive=0;longestNegative=Math.max(longestNegative,currentNegative);}
  else{currentPositive=0;currentNegative=0;}
 }
 const validRates=rates.length?rates:[0];
 return{blockSize,blockCount:blocks.length,positiveBlocks:positive,negativeBlocks:negative,neutralBlocks:blocks.filter(b=>!b.signalDraws||b.difference===0).length,meanRate:avg,minRate:Math.min(...validRates),maxRate:Math.max(...validRates),rateRange:Math.max(...validRates)-Math.min(...validRates),rateStdDev:Math.sqrt(variance),meanDifference:mean(differences),positiveDifferenceBlocks:positive,negativeDifferenceBlocks:negative,longestPositiveStreak:longestPositive,longestNegativeStreak:longestNegative};
}
export function evaluateCandidatePortfolioWalkForward(draws:Draw[],portfolio:CandidatePortfolio,catalog:IntuitionCandidate[],boundaries:PhaseBoundary[],label:string=portfolio.method,stabilityBlockSize=25):PortfolioWalkForwardReport{
 const byId=new Map(catalog.map(c=>[c.id,c]));
 const candidates=portfolio.candidateIds.map(id=>{const c=byId.get(id);if(!c)throw new Error("portfolio references unknown candidate: "+id);return c;});
 if(new Set(portfolio.candidateIds).size!==portfolio.candidateIds.length)throw new Error("portfolio candidate IDs must be unique");
 const results=candidates.map(c=>runIntuitionWalkForward(draws,c,boundaries));
 const phases=PHASES.filter(phase=>boundaries.some(b=>b.phase===phase)).map(phase=>{
  const rows=results.flatMap(r=>r.observations.filter(o=>o.phase===phase));
  const hits=rows.filter(r=>r.hit).length,baselineHits=rows.filter(r=>r.baselineHit).length;
  const targetIds=new Set(rows.map(r=>r.drawId));
  const skipped=results.reduce((n,r)=>n+r.skipped.filter(s=>boundaries.some(b=>b.phase===phase&&s.drawId>=b.firstDrawId&&s.drawId<=b.lastDrawId)).length,0);
  const possible=candidates.length*boundaries.filter(b=>b.phase===phase).reduce((n,b)=>n+b.lastDrawId-b.firstDrawId+1,0);
  return{phase,candidateCount:candidates.length,signalDraws:rows.length,distinctDraws:targetIds.size,hits,baselineHits,rate:rows.length?hits/rows.length:0,baselineRate:rows.length?baselineHits/rows.length:0,difference:rows.length?(hits-baselineHits)/rows.length:0,coverage:possible?rows.length/possible:0,skipped};
 });
 const stabilityRanges=buildHoldoutStabilityBlocks(boundaries,stabilityBlockSize);
 const stabilityBlocks:PortfolioStabilityBlock[]=stabilityRanges.map(block=>{
  const rows=results.flatMap(r=>r.observations.filter(o=>o.phase==="holdout"&&o.drawId>=block.firstDrawId&&o.drawId<=block.lastDrawId));
  const hits=rows.filter(r=>r.hit).length,baselineHits=rows.filter(r=>r.baselineHit).length;
  const skipped=results.reduce((n,r)=>n+r.skipped.filter(x=>x.drawId>=block.firstDrawId&&x.drawId<=block.lastDrawId).length,0);
  const possible=candidates.length*(block.lastDrawId-block.firstDrawId+1);
  return{...block,candidateCount:candidates.length,signalDraws:rows.length,distinctDraws:new Set(rows.map(r=>r.drawId)).size,hits,baselineHits,rate:rows.length?hits/rows.length:0,baselineRate:rows.length?baselineHits/rows.length:0,difference:rows.length?(hits-baselineHits)/rows.length:0,coverage:possible?rows.length/possible:0,skipped};
 });
 const stability=summarizeStability(stabilityBlocks,stabilityBlockSize);
 return{method:label,seed:portfolio.seed,candidateIds:[...portfolio.candidateIds],phases,stabilityBlocks,stability,warnings:[
  "Every candidate is scored strictly from draws preceding the target; the first 200 draws are warm-up history.",
  "All portfolios use the same draw sequence, phase boundaries and candidate-level paired baselines.",
  "Aggregated candidate-by-draw rows are dependent; rates are descriptive and no naive p-value is reported.",
  "Structural portfolio selection does not use outcomes. This report measures signal coverage, not ticket-level prize return or profitability.",
  "Holdout stability is split into fixed chronological blocks; a short final block is flagged and must not be treated as equally informative.",
  "Block rates use eligible candidate-draw observations; coverage and skipped counts are reported separately. Blocks and candidates may be dependent.",
  "Holdout is historical and is not prospective evidence; confirm any surviving result on future manually supplied draws."
 ]};
}
