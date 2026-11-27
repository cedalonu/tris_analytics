import { buildHypothesisNetwork } from "./hypothesis-network";
import { simulateStructuralPropagation, type PropagationRow } from "./community-propagation";
import type { HistoricalPackage } from "./historical-comparison";
export type ExposureWindow={index:number;startDate:string;endDate:string;packageCount:number;nodes:number;edges:number;pairs:Set<string>;rows:PropagationRow[]};
export type StabilityTransition={fromWindow:number;toWindow:number;persistentPairs:number;newPairs:number;lostPairs:number;pairJaccard:number;seedStability:number;meanExposureDelta:number};
type Options={windowSize?:number;permutations?:number;seed?:number;maxHops?:number;minExposure?:number};
function chunksOf(items:HistoricalPackage[],size:number){const ordered=[...items].sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name)),chunks:HistoricalPackage[][]=[];for(let i=0;i<ordered.length;i+=size)chunks.push(ordered.slice(i,i+size));if(chunks.length>1&&chunks[chunks.length-1].length<9)chunks[chunks.length-2].push(...chunks.pop()!);return chunks;}
function pairKey(seed:string,target:string){return JSON.stringify([seed,target]);}
export function compareExposureWindows(previous:ExposureWindow,current:ExposureWindow):StabilityTransition{
 const before=previous.pairs,after=current.pairs,persistent=[...before].filter(x=>after.has(x)),union=new Set([...before,...after]),seedIds=new Set([...previous.rows.map(r=>r.seed),...current.rows.map(r=>r.seed)]);
 const oldRows=new Map(previous.rows.map(r=>[r.seed,new Set(r.exposed.map(x=>x.id))])),newRows=new Map(current.rows.map(r=>[r.seed,new Set(r.exposed.map(x=>x.id))]));
 const seedScores=[...seedIds].map(seed=>{const a=oldRows.get(seed)??new Set<string>(),b=newRows.get(seed)??new Set<string>(),u=new Set([...a,...b]);return u.size?[...a].filter(x=>b.has(x)).length/u.size:1;});
 const oldExposure=new Map(previous.rows.flatMap(r=>r.exposed.map(x=>[pairKey(r.seed,x.id),x.exposure] as const))),newExposure=new Map(current.rows.flatMap(r=>r.exposed.map(x=>[pairKey(r.seed,x.id),x.exposure] as const)));
 const meanExposureDelta=persistent.length?persistent.reduce((s,k)=>s+Math.abs((oldExposure.get(k)??0)-(newExposure.get(k)??0)),0)/persistent.length:0;
 return{fromWindow:previous.index,toWindow:current.index,persistentPairs:persistent.length,newPairs:[...after].filter(x=>!before.has(x)).length,lostPairs:[...before].filter(x=>!after.has(x)).length,pairJaccard:union.size?persistent.length/union.size:1,seedStability:seedScores.length?seedScores.reduce((a,b)=>a+b,0)/seedScores.length:1,meanExposureDelta};
}
export function analyzeCommunityPropagationStability(items:HistoricalPackage[],options:Options={}){
 const windowSize=Math.max(9,Math.min(50,Math.floor(options.windowSize??9))),chunks=chunksOf(items,windowSize);
 if(chunks.length<2)return{valid:false as const,errors:["Se requieren al menos dos ventanas cronológicas de 9 paquetes cada una."],windows:[] as ExposureWindow[],transitions:[] as StabilityTransition[],summary:{windows:chunks.length,meanPairStability:0,meanSeedStability:0,persistentPairs:0,newPairs:0,lostPairs:0}};
 const windows:ExposureWindow[]=[];
 for(let i=0;i<chunks.length;i++){const network=buildHypothesisNetwork(chunks[i],{permutations:options.permutations??199,seed:(options.seed??820221)+i});if(!network.valid)return{valid:false as const,errors:network.errors,windows:[] as ExposureWindow[],transitions:[] as StabilityTransition[],summary:{windows:0,meanPairStability:0,meanSeedStability:0,persistentPairs:0,newPairs:0,lostPairs:0}};
 const strict=network.edges.filter(e=>e.status==="supported"),propagation=simulateStructuralPropagation(network.nodes,strict,options);
 const pairs=new Set(propagation.rows.flatMap(r=>r.exposed.map(x=>pairKey(r.seed,x.id))));
 windows.push({index:i,startDate:chunks[i][0].date,endDate:chunks[i].at(-1)!.date,packageCount:chunks[i].length,nodes:network.nodes.length,edges:strict.length,pairs,rows:propagation.rows});}
 const transitions=windows.slice(1).map((w,i)=>compareExposureWindows(windows[i],w));
 return{valid:true as const,errors:[] as string[],windows,transitions,summary:{windows:windows.length,meanPairStability:transitions.reduce((s,t)=>s+t.pairJaccard,0)/transitions.length,meanSeedStability:transitions.reduce((s,t)=>s+t.seedStability,0)/transitions.length,persistentPairs:transitions.reduce((s,t)=>s+t.persistentPairs,0),newPairs:transitions.reduce((s,t)=>s+t.newPairs,0),lostPairs:transitions.reduce((s,t)=>s+t.lostPairs,0)},settings:{windowSize,maxHops:Math.max(1,Math.min(4,Math.floor(options.maxHops??3))),minExposure:Math.max(0,Math.min(1,options.minExposure??0.1))}};
}
