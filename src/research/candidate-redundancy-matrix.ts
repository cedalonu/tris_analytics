import {buildCandidateOverlapGraph,type CandidateOverlapNode} from "./candidate-overlap-graph";
import {generateIntuitionCandidates,type CandidateFamily, type IntuitionCandidate} from "./intuition-candidate-generator";

export type RedundancyClass="highly-related"|"partially-related"|"low-overlap"|"disjoint";
export interface FamilyPairSummary {
  familyA:CandidateFamily;familyB:CandidateFamily;pairCount:number;
  highlyRelated:number;partiallyRelated:number;lowOverlap:number;disjoint:number;
  meanJaccard:number;meanCosine:number;
}
export interface CandidateRedundancyProfile {
  candidateId:string;family:CandidateFamily;components:number;
  highlyRelatedNeighbors:number;partiallyRelatedNeighbors:number;lowOverlapNeighbors:number;
  nearestNeighbors:Array<{candidateId:string;family:CandidateFamily;jaccard:number;cosine:number}>;
}
export interface CandidateRedundancyReport {
  candidateCount:number;pairCount:number;thresholds:{high:number;partial:number};
  classificationCounts:Record<RedundancyClass,number>;
  familyMatrix:FamilyPairSummary[];
  componentFrequency:Array<{component:string;candidateCount:number}>;
  profiles:CandidateRedundancyProfile[];
  mostRedundantPairs:Array<{a:string;b:string;familyA:CandidateFamily;familyB:CandidateFamily;jaccard:number;cosine:number;sharedComponents:string[]}>;
  mostDiversePairs:Array<{a:string;b:string;familyA:CandidateFamily;familyB:CandidateFamily;jaccard:number;cosine:number}>;
  interpretation:string;
}
const FAMILIES:CandidateFamily[]=["transition","position-mutation","absence-return","pool-ranking"];
const classify=(j:number):RedundancyClass=>j>=.6?"highly-related":j>=.25?"partially-related":j>0?"low-overlap":"disjoint";
function similarity(a:CandidateOverlapNode,b:CandidateOverlapNode){
 const shared=a.components.filter(x=>b.components.includes(x)).length;
 const union=new Set([...a.components,...b.components]).size;
 return{jaccard:union?shared/union:0,cosine:shared?shared/Math.sqrt(a.components.length*b.components.length):0,sharedComponents:a.components.filter(x=>b.components.includes(x))};
}
export function buildCandidateRedundancyReport(candidates:IntuitionCandidate[]=generateIntuitionCandidates()):CandidateRedundancyReport{
 const graph=buildCandidateOverlapGraph(candidates),nodes=graph.nodes;
 const matrix=new Map<string,FamilyPairSummary>();
 for(const a of FAMILIES)for(const b of FAMILIES){
  if(FAMILIES.indexOf(a)>FAMILIES.indexOf(b))continue;
  matrix.set(a+"|"+b,{familyA:a,familyB:b,pairCount:0,highlyRelated:0,partiallyRelated:0,lowOverlap:0,disjoint:0,meanJaccard:0,meanCosine:0});
 }
 const counts:CandidateRedundancyReport["classificationCounts"]={"highly-related":0,"partially-related":0,"low-overlap":0,disjoint:0};
 const profiles=new Map(nodes.map(n=>[n.id,{candidateId:n.id,family:n.family,components:n.components.length,highlyRelatedNeighbors:0,partiallyRelatedNeighbors:0,lowOverlapNeighbors:0,nearestNeighbors:[] as CandidateRedundancyProfile["nearestNeighbors"]}]));
 const mostRedundantPairs:CandidateRedundancyReport["mostRedundantPairs"]=[],mostDiversePairs:CandidateRedundancyReport["mostDiversePairs"]=[];
 const sums=new Map<string,{j:number;c:number}>();
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
  const a=nodes[i],b=nodes[j],s=similarity(a,b),kind=classify(s.jaccard);
  counts[kind]++;
  const key=FAMILIES.indexOf(a.family)<=FAMILIES.indexOf(b.family)?a.family+"|"+b.family:b.family+"|"+a.family;
  const row=matrix.get(key)!;row.pairCount++;row[kind==="highly-related"?"highlyRelated":kind==="partially-related"?"partiallyRelated":kind==="low-overlap"?"lowOverlap":"disjoint"]++;
  const sum=sums.get(key)??{j:0,c:0};sum.j+=s.jaccard;sum.c+=s.cosine;sums.set(key,sum);
  const pa=profiles.get(a.id)!,pb=profiles.get(b.id)!;
  const add=(p:typeof pa,n:CandidateOverlapNode)=>{if(kind==="highly-related")p.highlyRelatedNeighbors++;else if(kind==="partially-related")p.partiallyRelatedNeighbors++;else if(kind==="low-overlap")p.lowOverlapNeighbors++;p.nearestNeighbors.push({candidateId:n.id,family:n.family,jaccard:s.jaccard,cosine:s.cosine})};
  add(pa,b);add(pb,a);
  if(s.jaccard>=.6)mostRedundantPairs.push({a:a.id,b:b.id,familyA:a.family,familyB:b.family,jaccard:s.jaccard,cosine:s.cosine,sharedComponents:s.sharedComponents});
  if(s.jaccard===0)mostDiversePairs.push({a:a.id,b:b.id,familyA:a.family,familyB:b.family,jaccard:0,cosine:0});
 }
 for(const [key,row] of matrix){const sum=sums.get(key)??{j:0,c:0};if(row.pairCount){row.meanJaccard=sum.j/row.pairCount;row.meanCosine=sum.c/row.pairCount}}
 const sortedProfiles=[...profiles.values()].map(p=>({...p,nearestNeighbors:p.nearestNeighbors.sort((a,b)=>b.jaccard-a.jaccard||a.candidateId.localeCompare(b.candidateId)).slice(0,5)}));
 const freq=new Map<string,number>();for(const n of nodes)for(const c of n.components)freq.set(c,(freq.get(c)??0)+1);
 return{candidateCount:nodes.length,pairCount:nodes.length*(nodes.length-1)/2,thresholds:{high:.6,partial:.25},classificationCounts:counts,familyMatrix:[...matrix.values()],componentFrequency:[...freq].map(([component,candidateCount])=>({component,candidateCount})).sort((a,b)=>b.candidateCount-a.candidateCount||a.component.localeCompare(b.component)),profiles:sortedProfiles,mostRedundantPairs:mostRedundantPairs.sort((a,b)=>b.jaccard-a.jaccard).slice(0,100),mostDiversePairs:mostDiversePairs.slice(0,100),interpretation:"Clasificación estructural de configuraciones, no de resultados. Jaccard >= 0.60 = muy relacionadas; >= 0.25 y < 0.60 = relación parcial; > 0 y < 0.25 = solapamiento bajo; 0 = disjuntas. Los umbrales son descriptivos y no equivalen a correlación estadística, independencia ni rendimiento predictivo. La matriz cuenta todos los pares de candidatos por familia."};
}
