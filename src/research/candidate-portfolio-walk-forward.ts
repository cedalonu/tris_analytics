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
export interface PortfolioWalkForwardReport {
 method:CandidatePortfolio["method"]; seed:number; candidateIds:string[];
 phases:PortfolioPhaseSummary[]; warnings:string[];
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
export function evaluateCandidatePortfolioWalkForward(draws:Draw[],portfolio:CandidatePortfolio,catalog:IntuitionCandidate[],boundaries:PhaseBoundary[]):PortfolioWalkForwardReport{
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
 return{method:portfolio.method,seed:portfolio.seed,candidateIds:[...portfolio.candidateIds],phases,warnings:[
  "Every candidate is scored strictly from draws preceding the target; the first 200 draws are warm-up history.",
  "All portfolios use the same draw sequence, phase boundaries and candidate-level paired baselines.",
  "Aggregated candidate-by-draw rows are dependent; rates are descriptive and no naive p-value is reported.",
  "Structural portfolio selection does not use outcomes. This report measures signal coverage, not ticket-level prize return or profitability.",
  "Holdout is historical and is not prospective evidence; confirm any surviving result on future manually supplied draws."
 ]};
}
