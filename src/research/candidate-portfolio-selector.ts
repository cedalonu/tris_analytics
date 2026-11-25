import {generateIntuitionCandidates,type IntuitionCandidate,type CandidateFamily} from "./intuition-candidate-generator";
import {buildCandidateOverlapGraph} from "./candidate-overlap-graph";
export type CandidatePortfolioMethod="family-balanced"|"max-diversity"|"redundancy-control"|"random";
export interface CandidatePortfolioMetrics {
 size:number;familyCounts:Record<CandidateFamily,number>;uniqueComponents:number;
 meanPairJaccard:number;maxPairJaccard:number;meanPairCosine:number;
}
export interface CandidatePortfolio {
 method:CandidatePortfolioMethod;seed:number;candidateIds:string[];
 metrics:CandidatePortfolioMetrics;
 interpretation:string;
}
const FAMILIES:CandidateFamily[]=["transition","position-mutation","absence-return","pool-ranking"];
function rng(seed:number){let s=(seed>>>0)||1;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296}}
function shuffle<T>(xs:T[],seed:number):T[]{const a=[...xs],r=rng(seed);for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function pair(a:IntuitionCandidate,b:IntuitionCandidate){const x=buildCandidateOverlapGraph([a,b]).nodes;const A=x[0].components,B=x[1].components,shared=A.filter(k=>B.includes(k)).length,union=new Set([...A,...B]).size;return{j:union?shared/union:0,c:shared?shared/Math.sqrt(A.length*B.length):0}}
function metrics(selected:IntuitionCandidate[]):CandidatePortfolioMetrics{
 const familyCounts:Record<CandidateFamily,number>={transition:0,"position-mutation":0,"absence-return":0,"pool-ranking":0},components=new Set<string>();
 for(const c of selected){familyCounts[c.family]++;const n=buildCandidateOverlapGraph([c]).nodes[0];for(const x of n.components)components.add(x)}
 let j=0,c=0,max=0,pairs=0;
 for(let i=0;i<selected.length;i++)for(let k=i+1;k<selected.length;k++){const s=pair(selected[i],selected[k]);j+=s.j;c+=s.c;max=Math.max(max,s.j);pairs++}
 return{size:selected.length,familyCounts,uniqueComponents:components.size,meanPairJaccard:pairs?j/pairs:0,maxPairJaccard:max,meanPairCosine:pairs?c/pairs:0}
}
function scoreNovelty(c:IntuitionCandidate,selected:IntuitionCandidate[]):number{
 if(!selected.length)return 1;
 return Math.min(...selected.map(s=>1-pair(c,s).j));
}
export function selectCandidatePortfolio(method:CandidatePortfolioMethod,size:number,seed=20261125,candidates:IntuitionCandidate[]=generateIntuitionCandidates()):CandidatePortfolio{
 const n=Number.isFinite(size)?Math.max(0,Math.min(candidates.length,Math.floor(size))):0;
 if(new Set(candidates.map(c=>c.id)).size!==candidates.length)throw new Error("candidate IDs must be unique");
 let selected:IntuitionCandidate[]=[];
 if(method==="random")selected=shuffle(candidates,seed).slice(0,n);
 else if(method==="family-balanced"){
  const queues=FAMILIES.map(f=>shuffle(candidates.filter(c=>c.family===f),seed+FAMILIES.indexOf(f)));
  while(selected.length<n){let progressed=false;for(const q of queues){if(q.length&&selected.length<n){selected.push(q.shift()!);progressed=true}}if(!progressed)break}
 }else{
  const pool=[...candidates],r=shuffle(pool,seed);
  if(r.length&&n)selected.push(r[0]);
  while(selected.length<n){
   let best:IntuitionCandidate|undefined,bestScore=method==="max-diversity"?-Infinity:Infinity;
   for(const c of pool){if(selected.some(s=>s.id===c.id))continue;
    const distances=selected.map(s=>1-pair(c,s).j);
    const score=distances.length?distances.reduce((a,b)=>a+b,0)/distances.length:0;
    if(method==="max-diversity"?(score>bestScore||(score===bestScore&&c.id<(best?.id??"~"))):(score<bestScore||(score===bestScore&&c.id<(best?.id??"~")))){best=c;bestScore=score}
   }
   if(!best)break;selected.push(best);
  }
 }
 const interpretation=method==="random"?"Referencia aleatoria de configuraciones; no usa aciertos.":method==="family-balanced"?"Cuotas round-robin por familia; no usa resultados ni puntuaciones.":method==="max-diversity"?"Selección greedy que maximiza la similitud Jaccard mínima media frente a los ya elegidos.": "Control deliberadamente redundante: selección greedy que minimiza la similitud Jaccard media.";
 return{method,seed,candidateIds:selected.map(c=>c.id),metrics:metrics(selected),interpretation};
}
export function compareCandidatePortfolioMethods(sizes:number[],seeds:number[]=Array.from({length:100},(_,i)=>20261125+i),candidates:IntuitionCandidate[]=generateIntuitionCandidates()){
 const rows:CandidatePortfolio[]=[];
 for(const size of sizes)for(const method of ["family-balanced","max-diversity","redundancy-control","random"] as CandidatePortfolioMethod[]){
  const reps=method==="random"?seeds:[seeds[0]??20261125];
  for(const seed of reps)rows.push(selectCandidatePortfolio(method,size,seed,candidates));
 }
 return rows;
}
