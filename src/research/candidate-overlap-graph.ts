import {generateIntuitionCandidates,type IntuitionCandidate} from "./intuition-candidate-generator";

export interface CandidateOverlapNode {
  id:string;family:IntuitionCandidate["family"];components:string[];frozenConfig:string;
}
export interface CandidateOverlapEdge {
  a:string;b:string;sharedComponents:string[];jaccard:number;cosine:number;
}
export interface CandidateOverlapGraph {
  nodeCount:number;componentCount:number;componentFrequency:Array<{component:string,nodes:number}>;
  familyCounts:Record<IntuitionCandidate["family"],number>;
  nodes:CandidateOverlapNode[];edges:CandidateOverlapEdge[];
  interpretation:string;
}
const modePositions:Record<string,number[]>={full5:[0,1,2,3,4],last4:[1,2,3,4],last3:[2,3,4],first2:[0,1],last2:[3,4],firstLast:[0,4]};
function componentsFor(c:IntuitionCandidate):string[]{
 const x=c.config,parts:string[]=[];
 if(x.position!==undefined)parts.push("position:R"+(x.position+1));
 if(x.family==="transition"){
  for(const p of modePositions[x.mode??""]??[])parts.push("position:R"+(p+1));
  if(x.mode)parts.push("transition-mode:"+x.mode);
  if(x.lag!==undefined)parts.push("lag:"+x.lag);
 }else if(x.family==="position-mutation"){
  if(x.lag!==undefined)parts.push("lag:"+x.lag);
 }else if(x.family==="absence-return"){
  if(x.priorMisses!==undefined)parts.push("prior-misses:"+x.priorMisses);
 }else{
  if(x.method)parts.push("pool-method:"+x.method);
  if(x.poolSize!==undefined)parts.push("pool-size:"+x.poolSize);
  if(x.window!==undefined)parts.push("window:"+x.window);
 }
 return [...new Set(parts)].sort();
}
export function buildCandidateOverlapGraph(candidates:IntuitionCandidate[]=generateIntuitionCandidates()):CandidateOverlapGraph{
 if(!Array.isArray(candidates)||candidates.some(c=>!c||typeof c.id!=="string"||!c.id||!c.config||!c.family))throw new Error("invalid candidate catalog");
 if(new Set(candidates.map(c=>c.id)).size!==candidates.length)throw new Error("candidate IDs must be unique");
 const nodes=candidates.map(c=>({id:c.id,family:c.family,components:componentsFor(c),frozenConfig:c.frozenConfig}));
 const freq=new Map<string,number>();for(const n of nodes)for(const k of n.components)freq.set(k,(freq.get(k)??0)+1);
 const componentFrequency=[...freq].map(([component,nodes])=>({component,nodes})).sort((a,b)=>b.nodes-a.nodes||a.component.localeCompare(b.component));
 const familyCounts:CandidateOverlapGraph["familyCounts"]={transition:0,"position-mutation":0,"absence-return":0,"pool-ranking":0};
 for(const n of nodes)familyCounts[n.family]++;
 const edges:CandidateOverlapEdge[]=[];
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
  const shared=nodes[i].components.filter(k=>nodes[j].components.includes(k));
  if(!shared.length)continue;
  const union=new Set([...nodes[i].components,...nodes[j].components]).size;
  edges.push({a:nodes[i].id,b:nodes[j].id,sharedComponents:shared,jaccard:shared.length/union,cosine:shared.length/Math.sqrt(nodes[i].components.length*nodes[j].components.length)});
 }
 return{nodeCount:nodes.length,componentCount:freq.size,componentFrequency,familyCounts,nodes,edges,interpretation:"Grafo estructural derivado de las configuraciones del catálogo, no de resultados observados. Los componentes representan dimensiones compartidas de entrada/configuración (posición, rezago, modo, método, tamaño de pool, ventana o umbral de ausencia). Una arista indica solapamiento nominal, no correlación estadística demostrada. Se requiere medir correlaciones en resultados prospectivos congelados."};
}
