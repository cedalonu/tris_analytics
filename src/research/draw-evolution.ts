/**
 * Draw evolution / transition research module v1.
 * Descriptive + empirical proposal ranking only; not a claim of predictability.
 * Input must be chronological and must contain only history available at forecast time.
 */
import type { Draw, Digit, Pos } from "../research-core";

export type GameMode = "full5"|"last4"|"last3"|"first2"|"last2"|"firstLast";
export interface ModeSpec { mode:GameMode; positions:Pos[]; label:string; }
export const MODES:ModeSpec[]=[
 {mode:"full5",positions:[0,1,2,3,4],label:"5 digits"},
 {mode:"last4",positions:[1,2,3,4],label:"Last 4"},
 {mode:"last3",positions:[2,3,4],label:"Last 3"},
 {mode:"first2",positions:[0,1],label:"First 2"},
 {mode:"last2",positions:[3,4],label:"Last 2"},
 {mode:"firstLast",positions:[0,4],label:"First + last"},
];
export type Lag=1|2|3|4|5;
export interface TransitionCount { from:string; to:string; count:number; rate:number; n:number; }
export interface PositionMutation { position:Pos; lag:Lag; same:number; plus1mod10:number; minus1mod10:number; meanAbsoluteChange:number; changeHistogram:number[]; n:number; }
export interface EvolutionReport { transitions:Record<Lag,TransitionCount[]>; mutations:PositionMutation[]; modeTransitionCounts:Record<GameMode,TransitionCount[]>; warnings:string[]; }
const key=(digits:Digit[],positions:Pos[])=>positions.map(p=>digits[p]).join("");
const rate=(c:number,n:number)=>n?c/n:0;

/** Count transitions from lagged mode outcome to current mode outcome. */
export function countModeTransitions(draws:Draw[],mode:GameMode,lag:Lag=1):TransitionCount[]{
 const positions=MODES.find(x=>x.mode===mode)!.positions,counts=new Map<string,number>(),fromCounts=new Map<string,number>();
 for(let i=lag;i<draws.length;i++){const a=key(draws[i-lag].digits,positions),b=key(draws[i].digits,positions),k=a+"→"+b;counts.set(k,(counts.get(k)||0)+1);fromCounts.set(a,(fromCounts.get(a)||0)+1);}
 return [...counts.entries()].map(([k,count])=>{const [from,to]=k.split("→");return {from,to,count,rate:rate(count,fromCounts.get(from)||0),n:fromCounts.get(from)||0};}).sort((a,b)=>b.count-a.count||a.from.localeCompare(b.from)||a.to.localeCompare(b.to));
}
/** Position mutation descriptors for lags -1/-2/-3/-4/-5; modulo movement is separately flagged. */
export function positionMutations(draws:Draw[]):PositionMutation[]{
 const out:PositionMutation[]=[];
 for(let p=0;p<5;p++)for(const lag of [1,2,3,4,5] as Lag[]){let same=0,plus=0,minus=0,total=0,sumAbs=0;const hist=Array(10).fill(0);
  for(let i=lag;i<draws.length;i++){const a=draws[i-lag].digits[p],b=draws[i].digits[p],delta=(b-a+10)%10;total++;hist[delta]++;sumAbs+=Math.min(delta,10-delta);if(a===b)same++;if(delta===1)plus++;if(delta===9)minus++;}
  out.push({position:p as Pos,lag,same,plus1mod10:plus,minus1mod10:minus,meanAbsoluteChange:total?sumAbs/total:0,changeHistogram:hist,n:total});
 }return out;
}
export function evolutionReport(draws:Draw[]):EvolutionReport{
 const transitions={} as Record<Lag,TransitionCount[]>;for(const lag of [1,2,3] as Lag[])transitions[lag]=countModeTransitions(draws,"full5",lag);
 const modeTransitionCounts={} as Record<GameMode,TransitionCount[]>;for(const m of MODES)modeTransitionCounts[m.mode]=countModeTransitions(draws,m.mode,1);
 return {transitions,mutations:positionMutations(draws),modeTransitionCounts,warnings:["Transition counts are descriptive and may be sparse for full 5-digit outcomes.","Do not infer a digit is due from absence or transition frequency.","All predictive evaluations must be chronological walk-forward and compared to empirical/chance baselines.","Use adequate sample sizes, uncertainty intervals, and multiple-testing correction."]};
}

export interface Candidate { value:string; count:number; probability:number; support:number; }
/** Rank next outcomes for a mode based on empirical lag-conditioned transitions. Use only pre-forecast history. */
export function rankTransitionCandidates(history:Draw[],mode:GameMode,lag:Lag=1,limit=20,minSupport=5):Candidate[]{
 const spec=MODES.find(x=>x.mode===mode)!;if(history.length<=lag)return [];
 const counts=new Map<string,number>(),contextCounts=new Map<string,number>(),context=key(history[history.length-lag].digits,spec.positions);
 for(let i=lag;i<history.length;i++){const c=key(history[i-lag].digits,spec.positions),v=key(history[i].digits,spec.positions);if(c===context){counts.set(v,(counts.get(v)||0)+1);contextCounts.set(c,(contextCounts.get(c)||0)+1);}}
 const n=contextCounts.get(context)||0;return [...counts.entries()].filter(([,c])=>c>=minSupport).map(([value,count])=>({value,count,probability:rate(count,n),support:n})).sort((a,b)=>b.count-a.count||a.value.localeCompare(b.value)).slice(0,limit);
}

/** Diverse portfolio selection: reduce overlap between candidate digit strings without claiming optimality. */
export function diversifyCandidates(candidates:Candidate[],maxCount=10,maxOverlap=0.8):Candidate[]{
 const selected:Candidate[]=[];for(const c of candidates){if(selected.length>=maxCount)break;const overlaps=selected.some(s=>{const len=Math.min(s.value.length,c.value.length);if(!len)return false;let equal=0;for(let i=0;i<len;i++)if(s.value[i]===c.value[i])equal++;return equal/len>=maxOverlap;});if(!overlaps)selected.push(c);}return selected;
}

/** Convert digits to the selected game-mode string, preserving leading zeroes. */
export function outcomeForMode(digits:Digit[],mode:GameMode):string{return key(digits,MODES.find(x=>x.mode===mode)!.positions);}