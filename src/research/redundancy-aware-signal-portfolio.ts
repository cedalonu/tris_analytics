/** Outcome-blind redundancy-aware signal portfolio selection.
 * Utility must be supplied from a pre-frozen discovery stage. This module
 * compares ranking-only selection with greedy redundancy penalties and random
 * controls; it does not evaluate hits or claim predictive benefit.
 */
export type PortfolioSelectionMethod="utility-ranked"|"empirical-diversity"|"structural-diversity"|"random";
export interface SignalPortfolioInput {signalId:string;utility:number;}
export interface SignalPortfolioGroups {empiricalGroups:string[][];structuralGroups:string[][];}
export interface SignalPortfolioMetrics {
 size:number;meanUtility:number;empiricalGroupedCount:number;empiricalGroupedFraction:number;
 empiricalGroupCoverage:number;structuralGroupedCount:number;structuralGroupedFraction:number;
 structuralGroupCoverage:number;maxWithinGroupSelected:number;
}
export interface SignalPortfolioResult {method:PortfolioSelectionMethod;seed:number;selectedSignalIds:string[];metrics:SignalPortfolioMetrics;interpretation:string;}
function rng(seed:number){let s=(seed>>>0)||1;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296}}
function shuffle<T>(items:T[],seed:number){const a=[...items],r=rng(seed);for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a}
function memberships(groups:string[][]){const map=new Map<string,string[]>();groups.forEach((members,i)=>members.forEach(id=>{if(!map.has(id))map.set(id,[]);map.get(id)!.push("G"+(i+1))}));return map}
function metrics(selected:SignalPortfolioInput[],empirical:string[][],structural:string[][]):SignalPortfolioMetrics{
 const em=memberships(empirical),st=memberships(structural),ids=selected.map(s=>s.signalId);
 const groupedE=ids.filter(id=>(em.get(id)?.length??0)>0),groupedS=ids.filter(id=>(st.get(id)?.length??0)>0);
 const coverage=(groups:string[][])=>new Set(groups.flatMap(g=>g.filter(id=>ids.includes(id)))).size;
 const maxCount=(groups:string[][])=>Math.max(0,...groups.map(g=>g.filter(id=>ids.includes(id)).length));
 return {size:selected.length,meanUtility:selected.length?selected.reduce((a,b)=>a+b.utility,0)/selected.length:0,
  empiricalGroupedCount:groupedE.length,empiricalGroupedFraction:selected.length?groupedE.length/selected.length:0,
  empiricalGroupCoverage:coverage(empirical),structuralGroupedCount:groupedS.length,structuralGroupedFraction:selected.length?groupedS.length/selected.length:0,
  structuralGroupCoverage:coverage(structural),maxWithinGroupSelected:maxCount(empirical)};
}
export function selectRedundancyAwareSignalPortfolio(method:PortfolioSelectionMethod,size:number,signals:SignalPortfolioInput[],groups:SignalPortfolioGroups,seed=20261126,penalty=1):SignalPortfolioResult{
 if(!Number.isFinite(penalty)||penalty<0)throw new Error("penalty must be finite and non-negative");
 if(signals.some(s=>!Number.isFinite(s.utility)))throw new Error("utility scores must be finite");
 if(new Set(signals.map(s=>s.signalId)).size!==signals.length)throw new Error("signal IDs must be unique");
 const allGroupIds=[...groups.empiricalGroups,...groups.structuralGroups].flat();
 if(allGroupIds.some(id=>!signals.some(s=>s.signalId===id)))throw new Error("groups reference unknown signal");
 const n=Math.max(0,Math.min(signals.length,Math.floor(Number.isFinite(size)?size:0)));
 let chosen:SignalPortfolioInput[]=[];
 if(method==="random")chosen=shuffle(signals,seed).slice(0,n);
 else if(method==="utility-ranked")chosen=[...signals].sort((a,b)=>b.utility-a.utility||a.signalId.localeCompare(b.signalId)).slice(0,n);
 else{
  const target=method==="empirical-diversity"?groups.empiricalGroups:groups.structuralGroups;
  const groupMap=memberships(target);
  const pool=[...signals];
  while(chosen.length<n){
   let best:SignalPortfolioInput|undefined,bestScore=-Infinity;
   for(const candidate of pool){
    if(chosen.some(s=>s.signalId===candidate.signalId))continue;
    const groupsForCandidate=groupMap.get(candidate.signalId)??[];
    const groupOverlap=chosen.reduce((sum,s)=>sum+(groupsForCandidate.some(g=>(groupMap.get(s.signalId)??[]).includes(g))?1:0),0);
    const score=candidate.utility-penalty*groupOverlap;
    if(score>bestScore||(score===bestScore&&candidate.signalId<(best?.signalId??"~"))){best=candidate;bestScore=score}
   }
   if(!best)break;chosen.push(best);
  }
 }
 const labels={ "utility-ranked":"Ordena por utilidad congelada; ignora redundancia.","empirical-diversity":"Greedy penaliza señales que comparten grupo empírico; no elimina por regla fija.","structural-diversity":"Greedy penaliza grupos estructurales, sin confundirlos con dependencia empírica.","random":"Control aleatorio reproducible, sin usar utilidad."};
 return{method,seed,selectedSignalIds:chosen.map(s=>s.signalId),metrics:metrics(chosen,groups.empiricalGroups,groups.structuralGroups),interpretation:labels[method]};
}
export function compareRedundancySignalPortfolios(sizes:number[],signals:SignalPortfolioInput[],groups:SignalPortfolioGroups,seeds:number[]=Array.from({length:100},(_,i)=>20261126+i),penalty=1){
 const output:SignalPortfolioResult[]=[];
 for(const size of sizes)for(const method of ["utility-ranked","empirical-diversity","structural-diversity","random"] as PortfolioSelectionMethod[]){
  const reps=method==="random"?seeds:[seeds[0]??20261126];
  for(const seed of reps)output.push(selectRedundancyAwareSignalPortfolio(method,size,signals,groups,seed,penalty));
 }
 return output;
}
