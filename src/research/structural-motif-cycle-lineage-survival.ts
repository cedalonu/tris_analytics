import type { CommunitySnapshot } from "./structural-motif-cycle-evolution";
import type { CommunityLineage } from "./structural-motif-cycle-lineages";
import type { CycleCommunity } from "./structural-motif-cycle-communities";
import type { MotifCycle } from "./structural-motif-cycles";
const episodeId=(c:MotifCycle)=>[c.key,c.startWindow,c.endWindow,c.period,c.sequence.join(",")].join("|");
const overlap=(a:CycleCommunity,b:CycleCommunity)=>{const x=new Set(a.cycles.map(episodeId)),y=new Set(b.cycles.map(episodeId));const shared=[...x].filter(k=>y.has(k)).length;return{x:x.size,y:y.size,shared,jaccard:x.size+y.size-shared?shared/(x.size+y.size-shared):0};};
export type LineageSurvival={lineageId:string;rootNodeId:string;observations:number;coverage:number;longestRun:number;meanJaccard:number;meanDensity:number;densityVolatility:number;weakeningEvents:number;recoveryEvents:number;maxDensityDrop:number;status:"robusta"|"moderada"|"fragil"|"insuficiente";activeAtEnd:boolean;windowSeries:{window:number;cycleCount:number;density:number;change:number|null;jaccardToPrevious:number|null}[]};
export function analyzeCycleCommunityLineageSurvival(snapshots:CommunitySnapshot[],lineages:CommunityLineage[]){
 const ordered=[...snapshots].sort((a,b)=>a.window-b.window),total=ordered.length;
 const results:LineageSurvival[]=lineages.map(lineage=>{
  const observations=lineage.descendants.map(id=>{const m=/^V(-?\d+):(.*)$/.exec(id);if(!m)return null;const window=Number(m[1]),community=ordered.find(s=>s.window===window)?.communities.find(c=>c.id===m[2]);return community?{window,community}:null;}).filter((x):x is {window:number;community:CycleCommunity}=>!!x).sort((a,b)=>a.window-b.window);
  const series=observations.map((o,i)=>{const prev=observations[i-1];const ov=prev&&o.window===prev.window+1?overlap(prev.community,o.community):null;return{window:o.window,cycleCount:o.community.cycleCount,density:o.community.density,change:prev?o.community.density-prev.community.density:null,jaccardToPrevious:ov?.jaccard??null};});
  const runs:number[]=[];let run=0,last:number|null=null;for(const o of observations){if(last!==null&&o.window===last+1)run++;else{if(run)runs.push(run);run=1;}last=o.window;}if(run)runs.push(run);
  const densities=series.map(s=>s.density),jaccards=series.map(s=>s.jaccardToPrevious).filter((v):v is number=>v!==null);
  const mean=(a:number[])=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
  const volatility=Math.sqrt(mean(densities.map(v=>(v-mean(densities))**2)));
  let weakeningEvents=0,recoveryEvents=0,maxDensityDrop=0,trough:number|null=null;
  for(let i=1;i<densities.length;i++){const delta=densities[i]-densities[i-1];if(delta<=-.15){weakeningEvents++;trough=densities[i];maxDensityDrop=Math.max(maxDensityDrop,-delta);}else if(trough!==null&&delta>=.15&&densities[i]>trough){recoveryEvents++;trough=null;}}
  const coverage=total?new Set(observations.map(o=>o.window)).size/total:0,longestRun=Math.max(0,...runs),meanJaccard=mean(jaccards),meanDensity=mean(densities);
  const status=observations.length<2?"insuficiente":coverage>=.75&&longestRun>=4&&meanJaccard>=.5?"robusta":coverage>=.4&&longestRun>=2?"moderada":"fragil";
  return{lineageId:lineage.id,rootNodeId:lineage.rootNodeId,observations:observations.length,coverage,longestRun,meanJaccard,meanDensity,densityVolatility:volatility,weakeningEvents,recoveryEvents,maxDensityDrop,status,activeAtEnd:lineage.activeAtEnd,windowSeries:series};
 });
 const rank={robusta:0,moderada:1,fragil:2,insuficiente:3};
 return{lineages:results.sort((a,b)=>rank[a.status]-rank[b.status]||b.coverage-a.coverage||b.longestRun-a.longestRun||a.lineageId.localeCompare(b.lineageId)),summary:{evaluated:results.length,robust:results.filter(x=>x.status==="robusta").length,moderate:results.filter(x=>x.status==="moderada").length,fragile:results.filter(x=>x.status==="fragil").length,insufficient:results.filter(x=>x.status==="insuficiente").length,weakeningEvents:results.reduce((n,x)=>n+x.weakeningEvents,0),recoveryEvents:results.reduce((n,x)=>n+x.recoveryEvents,0)},settings:{robustCoverage:.75,moderateCoverage:.4,minRobustRun:4,minMeanJaccard:.5,densityChangeThreshold:.15}};
}