import { analyzeHypothesisCommunities, type HypothesisCommunity } from "./hypothesis-communities";
import type { HistoricalPackage } from "./historical-comparison";
export type TemporalCommunity={id:string;members:string[];size:number;cohesion:number;conductance:number};
export type CommunityEvent={type:"appeared"|"persistent"|"split"|"merged"|"disappeared";windowIndex:number;communityId:string;relatedIds:string[];overlap:number};
export type CommunityWindow={index:number;startDate:string;endDate:string;packageCount:number;communities:TemporalCommunity[];events:CommunityEvent[]};
function asTemporal(rows:HypothesisCommunity[]):TemporalCommunity[]{return rows.map(row=>({id:"C"+row.id,members:row.members,size:row.size,cohesion:row.cohesion,conductance:row.conductance}));}
function jaccard(a:string[],b:string[]){const x=new Set(a),y=new Set(b),intersection=[...x].filter(v=>y.has(v)).length,union=new Set([...x,...y]).size;return union?intersection/union:0;}
export function classifyCommunityTransitions(previous:TemporalCommunity[],current:TemporalCommunity[],windowIndex:number,threshold=0.25):CommunityEvent[]{
 const links=new Map<string,Array<{id:string;overlap:number}>>(),reverse=new Map<string,Array<{id:string;overlap:number}>>();
 for(const now of current)for(const before of previous){const overlap=jaccard(before.members,now.members);if(overlap>=threshold){if(!links.has(now.id))links.set(now.id,[]);links.get(now.id)!.push({id:before.id,overlap});if(!reverse.has(before.id))reverse.set(before.id,[]);reverse.get(before.id)!.push({id:now.id,overlap});}}
 const events:CommunityEvent[]=[];
 for(const now of current){const matches=links.get(now.id)??[];const splitSource=matches.length===1&&(reverse.get(matches[0].id)?.length??0)>1;const type:CommunityEvent["type"]=matches.length===0?"appeared":matches.length>1?"merged":splitSource?"split":"persistent";events.push({type,windowIndex,communityId:now.id,relatedIds:matches.map(m=>m.id),overlap:matches.length?Math.max(...matches.map(m=>m.overlap)):0});}
 for(const before of previous)if(!(reverse.get(before.id)?.length))events.push({type:"disappeared",windowIndex,communityId:before.id,relatedIds:[],overlap:0});
 return events;
}
function makeWindows(items:HistoricalPackage[],windowSize:number){const ordered=[...items].sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name));const chunks:HistoricalPackage[][]=[];for(let i=0;i<ordered.length;i+=windowSize)chunks.push(ordered.slice(i,i+windowSize));if(chunks.length>1&&chunks[chunks.length-1].length<9)chunks[chunks.length-2].push(...chunks.pop()!);return chunks;}
export function analyzeCommunityEvolution(items:HistoricalPackage[],options:{windowSize?:number;permutations?:number;seed?:number;overlapThreshold?:number}={}){
 const windowSize=Math.max(9,Math.min(50,Math.floor(options.windowSize??9))),chunks=makeWindows(items,windowSize);
 if(chunks.length<2)return{valid:false as const,errors:["Se requieren al menos dos ventanas cronológicas de 9 paquetes cada una para comparar comunidades."],windows:[] as CommunityWindow[],summary:{windows:chunks.length,events:0,persistent:0,appeared:0,disappeared:0,splits:0,merges:0}};
 const windows:CommunityWindow[]=[];
 for(let i=0;i<chunks.length;i++){const analysis=analyzeHypothesisCommunities(chunks[i],{permutations:options.permutations??199,seed:(options.seed??770219)+i});if(!analysis.valid)return{valid:false as const,errors:analysis.errors,windows:[] as CommunityWindow[],summary:{windows:0,events:0,persistent:0,appeared:0,disappeared:0,splits:0,merges:0}};const communities=asTemporal(analysis.communities);const previous=windows.at(-1)?.communities??[];const events=i?classifyCommunityTransitions(previous,communities,i,options.overlapThreshold??0.25):communities.map(c=>({type:"appeared" as const,windowIndex:i,communityId:c.id,relatedIds:[] as string[],overlap:0}));windows.push({index:i,startDate:chunks[i][0].date,endDate:chunks[i].at(-1)!.date,packageCount:chunks[i].length,communities,events});}
 const all=windows.flatMap(w=>w.events),count=(type:CommunityEvent["type"])=>all.filter(e=>e.type===type).length;
 return{valid:true as const,errors:[] as string[],windows,summary:{windows:windows.length,events:all.length,persistent:count("persistent"),appeared:count("appeared"),disappeared:count("disappeared"),splits:count("split"),merges:count("merged")}};
}
