import {buildHypothesisNetwork,type NetworkEdge} from "./hypothesis-network";
import type {HistoricalPackage} from "./historical-comparison";
export type TriadType="empty"|"single-edge"|"wedge"|"triangle";
export type StructuralMotif={key:string;members:[string,string,string];type:TriadType};
export type MotifWindow={index:number;startDate:string;endDate:string;packageCount:number;nodes:number;edges:number;motifs:StructuralMotif[];counts:Record<TriadType,number>;rates:Record<TriadType,number>};
export type MotifTransition={fromWindow:number;toWindow:number;sharedMotifs:number;newMotifs:number;lostMotifs:number;motifJaccard:number;typeChanges:number};
export type RecurrentMotif={key:string;members:[string,string,string];type:TriadType;windows:number[];frequency:number;typeHistory:Array<{window:number;type:TriadType}>};
const TYPES:TriadType[]=["empty","single-edge","wedge","triangle"];
export function classifyTriad(members:[string,string,string],edges:NetworkEdge[]):StructuralMotif{
 const set=new Set(members),present=new Set<string>();
 for(const e of edges)if(set.has(e.left)&&set.has(e.right))present.add([e.left,e.right].sort().join("|"));
 const count=present.size;
 const type:TriadType=count===0?"empty":count===1?"single-edge":count===2?"wedge":count===3?"triangle":"empty";
 return{key:members.slice().sort().join("::"),members:members.slice().sort() as [string,string,string],type};
}
export function enumerateStructuralMotifs(nodes:string[],edges:NetworkEdge[]):StructuralMotif[]{
 const sorted=[...new Set(nodes)].sort(),out:StructuralMotif[]=[];
 for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length;j++)for(let k=j+1;k<sorted.length;k++)out.push(classifyTriad([sorted[i],sorted[j],sorted[k]],edges));
 return out;
}
export function compareMotifWindows(a:MotifWindow,b:MotifWindow):MotifTransition{
 const before=new Map(a.motifs.map(m=>[m.key,m.type])),after=new Map(b.motifs.map(m=>[m.key,m.type])),shared=[...before.keys()].filter(k=>after.has(k)),union=new Set([...before.keys(),...after.keys()]);
 return{fromWindow:a.index,toWindow:b.index,sharedMotifs:shared.length,newMotifs:[...after.keys()].filter(k=>!before.has(k)).length,lostMotifs:[...before.keys()].filter(k=>!after.has(k)).length,motifJaccard:union.size?shared.length/union.size:1,typeChanges:shared.filter(k=>before.get(k)!==after.get(k)).length};
}
type Options={windowSize?:number;permutations?:number;seed?:number};
function makeChunks(items:HistoricalPackage[],size:number){const ordered=[...items].sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name)),chunks:HistoricalPackage[][]=[];for(let i=0;i<ordered.length;i+=size)chunks.push(ordered.slice(i,i+size));if(chunks.length>1&&chunks[chunks.length-1].length<9)chunks[chunks.length-2].push(...chunks.pop()!);return chunks;}
function summarize(motifs:StructuralMotif[]){const counts:Record<TriadType,number>={empty:0,"single-edge":0,wedge:0,triangle:0};for(const m of motifs)counts[m.type]++;const total=motifs.length||1,rates=Object.fromEntries(TYPES.map(t=>[t,counts[t]/total])) as Record<TriadType,number>;return{counts,rates};}
export function analyzeStructuralMotifs(items:HistoricalPackage[],options:Options={}){
 const windowSize=Math.max(9,Math.min(50,Math.floor(options.windowSize??9))),chunks=makeChunks(items,windowSize);
 if(chunks.length<2)return{valid:false as const,errors:["Se requieren al menos dos ventanas cronológicas de 9 paquetes cada una."],windows:[] as MotifWindow[],transitions:[] as MotifTransition[],recurrent:[] as RecurrentMotif[],summary:{windows:chunks.length,motifTypes:0,recurrentMotifs:0,meanMotifStability:0}};
 const windows:MotifWindow[]=[];
 for(let i=0;i<chunks.length;i++){const network=buildHypothesisNetwork(chunks[i],{permutations:options.permutations??199,seed:(options.seed??830221)+i});if(!network.valid)return{valid:false as const,errors:network.errors,windows:[] as MotifWindow[],transitions:[] as MotifTransition[],recurrent:[] as RecurrentMotif[],summary:{windows:0,motifTypes:0,recurrentMotifs:0,meanMotifStability:0}};
 const edges=network.edges.filter(e=>e.status==="supported"),motifs=enumerateStructuralMotifs(network.nodes.map(n=>n.id),edges),stats=summarize(motifs);
 windows.push({index:i,startDate:chunks[i][0].date,endDate:chunks[i].at(-1)!.date,packageCount:chunks[i].length,nodes:network.nodes.length,edges:edges.length,motifs,...stats});}
 const transitions=windows.slice(1).map((w,i)=>compareMotifWindows(windows[i],w)),registry=new Map<string,{motif:StructuralMotif;windows:number[]}>();
 for(const w of windows)for(const motif of w.motifs){if(!registry.has(motif.key))registry.set(motif.key,{motif,windows:[]});registry.get(motif.key)!.windows.push(w.index);}
 const recurrent=[...registry.values()].filter(x=>x.windows.length>=2).map(x=>({key:x.motif.key,members:x.motif.members,type:x.motif.type,windows:x.windows,frequency:x.windows.length/windows.length})).sort((a,b)=>b.frequency-a.frequency||a.key.localeCompare(b.key));
 return{valid:true as const,errors:[] as string[],windows,transitions,recurrent,summary:{windows:windows.length,motifTypes:new Set(windows.flatMap(w=>w.motifs.map(m=>m.type))).size,recurrentMotifs:recurrent.length,meanMotifStability:transitions.reduce((s,t)=>s+t.motifJaccard,0)/transitions.length},settings:{windowSize}};
}
