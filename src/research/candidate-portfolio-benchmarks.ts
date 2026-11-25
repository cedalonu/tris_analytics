/** Equal-budget, outcome-blind reference portfolios for walk-forward comparison. */
import type {IntuitionCandidate} from "./intuition-candidate-generator";
import {selectCandidatePortfolio,type CandidatePortfolio} from "./candidate-portfolio-selector";
export type BenchmarkPortfolioName="baseline-frequency-only"|"baseline-transition-only"|"baseline-recent-pool";
export interface NamedBenchmarkPortfolio {name:BenchmarkPortfolioName;portfolio:CandidatePortfolio;}
export function buildBenchmarkPortfolios(catalog:IntuitionCandidate[],size:number,seed=20261125):NamedBenchmarkPortfolio[]{
 const specs:{name:BenchmarkPortfolioName;filter:(c:IntuitionCandidate)=>boolean}[]=[
  {name:"baseline-frequency-only",filter:c=>c.family==="pool-ranking"&&c.config.method==="frequency"},
  {name:"baseline-transition-only",filter:c=>c.family==="transition"},
  {name:"baseline-recent-pool",filter:c=>c.family==="pool-ranking"&&c.config.method==="recent-frequency"}
 ];
 return specs.map(spec=>{
  const eligible=catalog.filter(spec.filter);
  if(eligible.length<size)throw new Error(spec.name+" has only "+eligible.length+" candidates for requested budget "+size);
  return{name:spec.name,portfolio:selectCandidatePortfolio("random",size,seed,eligible)};
 });
}
