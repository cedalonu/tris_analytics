/**
 * Position- and pre-draw-context-conditioned memory from resolved prospective cycles.
 * A row is a frozen candidate trial; repeated candidates within a draw are aggregated
 * to one draw-level mean before chronological blocks are formed.
 */
import type {ResolvedCycleSignal,PreDrawContext} from "./cycle-learning";

export type PositionFamily="position-mutation"|"absence-return"|"pool-ranking";
export interface PositionContextBlock {
 startDrawId:number;
 endDrawId:number;
 draws:number;
 candidateTrials:number;
 meanCandidateHitRate:number;
 meanBaselineHitRate:number;
 difference:number;
 state:"favorable"|"unfavorable"|"neutral";
}
export interface PositionContextMemory {
 position:number;
 family:PositionFamily;
 configuration:string;
 poolRegime:PreDrawContext["poolRegime"];
 duplicateRegime:PreDrawContext["duplicateRegime"];
 draws:number;
 candidateTrials:number;
 distinctCandidates:number;
 meanCandidateHitRate:number;
 meanBaselineHitRate:number;
 difference:number;
 positiveBlocks:number;
 negativeBlocks:number;
 latestBlock:PositionContextBlock|null;
 blocks:PositionContextBlock[];
 interpretation:string;
}
export interface PositionModeMemory {
 mode:string;
 draws:number;
 candidateTrials:number;
 meanCandidateHitRate:number;
 meanBaselineHitRate:number;
 difference:number;
}
export interface PositionContextReport {
 resolvedOutcomes:number;
 positionSpecificTrials:number;
 modeLevelTrials:number;
 minimumDrawsForSummary:number;
 blockSize:number;
 positions:PositionContextMemory[];
 modeScopes:PositionModeMemory[];
 warnings:string[];
}
type Trial={drawId:number;candidateId:string;candidateHit:boolean;baselineHit:boolean;position:number;family:PositionFamily;configuration:string;poolRegime:PreDrawContext["poolRegime"];duplicateRegime:PreDrawContext["duplicateRegime"]};
const BLOCK=25,MIN_BLOCK=10,MIN_SUMMARY=10;
function mean(values:number[]):number{return values.length?values.reduce((a,b)=>a+b,0)/values.length:0;}
function makeBlocks(trials:Trial[]):PositionContextBlock[]{
 const byDraw=new Map<number,Trial[]>();
 for(const t of trials){const a=byDraw.get(t.drawId)??[];a.push(t);byDraw.set(t.drawId,a);}
 const draws=[...byDraw.entries()].sort((a,b)=>a[0]-b[0]);
 const blocks:PositionContextBlock[]=[];
 for(let i=0;i<draws.length;i+=BLOCK){
  const chunk=draws.slice(i,i+BLOCK);if(chunk.length<MIN_BLOCK)continue;
  const candidateRates=chunk.map(([,rows])=>mean(rows.map(r=>Number(r.candidateHit))));
  const baselineRates=chunk.map(([,rows])=>mean(rows.map(r=>Number(r.baselineHit))));
  const candidateTrials=chunk.reduce((s,[,rows])=>s+rows.length,0);
  const candidateRate=mean(candidateRates),baselineRate=mean(baselineRates),difference=candidateRate-baselineRate;
  blocks.push({startDrawId:chunk[0][0],endDrawId:chunk.at(-1)![0],draws:chunk.length,candidateTrials,
   meanCandidateHitRate:candidateRate,meanBaselineHitRate:baselineRate,difference,
   state:difference>=.02?"favorable":difference<=-.02?"unfavorable":"neutral"});
 }
 return blocks;
}
export function analyzePositionContextMemory(rows:ResolvedCycleSignal[]):PositionContextReport{
 const groups=new Map<string,Trial[]>(),modeGroups=new Map<string,Trial[]>();
 let positionSpecificTrials=0,modeLevelTrials=0;
 for(const row of rows){
  const config=JSON.parse(row.frozenConfig) as {family:string;position?:number;mode?:string};
  if(row.family==="transition"){
   modeLevelTrials++;
   const mode=config.mode??"unknown",list=modeGroups.get(mode)??[];
   list.push({drawId:row.targetDrawId,candidateId:row.candidateId,candidateHit:row.candidateHit,baselineHit:row.baselineHit,position:-1,family:"pool-ranking",configuration:mode,poolRegime:row.context.poolRegime,duplicateRegime:row.context.duplicateRegime});
   modeGroups.set(mode,list);continue;
  }
  if(row.position===null||row.position<0||row.position>4)continue;
  positionSpecificTrials++;
  const cfg=JSON.parse(row.frozenConfig) as {lag?:number;priorMisses?:number;method?:string;poolSize?:number;window?:number};
  const configuration=JSON.stringify({lag:cfg.lag??null,priorMisses:cfg.priorMisses??null,method:cfg.method??null,poolSize:cfg.poolSize??null,window:cfg.window??null});
  const trial:Trial={drawId:row.targetDrawId,candidateId:row.candidateId,candidateHit:row.candidateHit,baselineHit:row.baselineHit,
   position:row.position,family:row.family as PositionFamily,configuration,poolRegime:row.context.poolRegime,duplicateRegime:row.context.duplicateRegime};
  const key=[trial.position,trial.family,trial.configuration,trial.poolRegime,trial.duplicateRegime].join("|");
  const list=groups.get(key)??[];list.push(trial);groups.set(key,list);
 }
 const positions:PositionContextMemory[]=[];
 for(const trials of groups.values()){
  const ordered=trials.slice().sort((a,b)=>a.drawId-b.drawId||a.candidateId.localeCompare(b.candidateId));
  const first=ordered[0],byDraw=new Map<number,Trial[]>();
  for(const t of ordered){const a=byDraw.get(t.drawId)??[];a.push(t);byDraw.set(t.drawId,a);}
  const drawGroups=[...byDraw.values()],candidateRates=drawGroups.map(a=>mean(a.map(x=>Number(x.candidateHit))));
  const baselineRates=drawGroups.map(a=>mean(a.map(x=>Number(x.baselineHit))));
  const candidateRate=mean(candidateRates),baselineRate=mean(baselineRates),difference=candidateRate-baselineRate;
  const blocks=makeBlocks(ordered),latest=blocks.at(-1)??null;
  positions.push({position:first.position,family:first.family,configuration:first.configuration,poolRegime:first.poolRegime,duplicateRegime:first.duplicateRegime,
   draws:drawGroups.length,candidateTrials:ordered.length,distinctCandidates:new Set(ordered.map(x=>x.candidateId)).size,
   meanCandidateHitRate:candidateRate,meanBaselineHitRate:baselineRate,difference,
   positiveBlocks:blocks.filter(b=>b.state==="favorable").length,negativeBlocks:blocks.filter(b=>b.state==="unfavorable").length,
   latestBlock:latest,blocks,interpretation:drawGroups.length<MIN_SUMMARY?"Insufficient unique contests for a contextual comparison.":
    latest?.state==="favorable"?"The latest chronological block is above its paired baseline; replication is still required.":
    latest?.state==="unfavorable"?"The latest chronological block is below its paired baseline.":
    "No material advantage in the latest eligible block."
  });
 }
 positions.sort((a,b)=>a.position-b.position||a.family.localeCompare(b.family)||a.poolRegime.localeCompare(b.poolRegime)||a.duplicateRegime.localeCompare(b.duplicateRegime));
 const modeScopes:PositionModeMemory[]=[];
 for(const [mode,trials] of modeGroups){
  const byDraw=new Map<number,Trial[]>();for(const t of trials){const a=byDraw.get(t.drawId)??[];a.push(t);byDraw.set(t.drawId,a);}
  const sets=[...byDraw.values()];
  modeScopes.push({mode,draws:sets.length,candidateTrials:trials.length,
   meanCandidateHitRate:mean(sets.map(a=>mean(a.map(x=>Number(x.candidateHit))))),
   meanBaselineHitRate:mean(sets.map(a=>mean(a.map(x=>Number(x.baselineHit))))),
   difference:mean(sets.map(a=>mean(a.map(x=>Number(x.candidateHit)-Number(x.baselineHit)))))});
 }
 modeScopes.sort((a,b)=>a.mode.localeCompare(b.mode));
 return {resolvedOutcomes:rows.length,positionSpecificTrials,modeLevelTrials,minimumDrawsForSummary:MIN_SUMMARY,blockSize:BLOCK,positions,modeScopes,warnings:[
  "Position-specific summaries include only frozen candidates whose configuration targets one digit position; full-result transition modes remain separate and are never copied into five position rows.",
  "Context (previous pool size and duplicate structure) was frozen from the immediately preceding contest, before the target result.",
  "Multiple candidate trials in one contest are correlated; rates are first averaged within each unique contest so a draw with more candidates does not receive extra weight.",
  "These are coverage rates for candidate pools, not calibrated probabilities, causal effects or proof of a predictive edge.",
  "Context strata and candidate configurations were screened from a large research catalog; comparisons are exploratory and need prospective replication.",
  "A block contains 25 unique contests; a final partial block is shown only with at least 10 unique contests.",
  "No signal is promoted, retired, reweighted or used to change frozen predictions by this report."
 ]};
}
