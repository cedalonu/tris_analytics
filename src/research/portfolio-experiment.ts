/** Chronological experiment helpers. These functions do not generate predictions. */
import type { Draw } from '../research-core';
export interface SplitConfig { discoveryFraction?:number; validationFraction?:number; }
export interface ChronologicalSplit<T> { discovery:T[]; validation:T[]; holdout:T[]; boundaries:{discoveryEnd:number;validationEnd:number;total:number}; warnings:string[]; }
/** Preserve input order. Caller must provide validated, unique, chronological draws. */
export function splitChronologically<T>(rows:T[],config:SplitConfig={}):ChronologicalSplit<T>{
 const d=config.discoveryFraction??0.6,v=config.validationFraction??0.2,warnings:string[]=[];
 if(!Number.isFinite(d)||!Number.isFinite(v)||d<=0||v<=0||d+v>=1)throw new Error('Split fractions must be finite, positive, and sum to less than 1.');
 const discoveryEnd=Math.floor(rows.length*d),validationEnd=Math.floor(rows.length*(d+v));
 return {discovery:rows.slice(0,discoveryEnd),validation:rows.slice(discoveryEnd,validationEnd),holdout:rows.slice(validationEnd),boundaries:{discoveryEnd,validationEnd,total:rows.length},warnings:['Historical holdout must be used only once after configuration freeze.','Prior exploratory test data are not untouched holdout.']};
}
export type ResearchTicketMode='direct5'|'direct4'|'direct3'|'pairInitial'|'pairFinal'|'singleInitial'|'singleFinal';
const LENGTH:Record<ResearchTicketMode,number>={direct5:5,direct4:4,direct3:3,pairInitial:2,pairFinal:2,singleInitial:1,singleFinal:1};
function seededRandom(seed:number):()=>number{let s=(seed>>>0)||1;return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
/** Reproducible random baseline. Repeated tickets are allowed and counted as separate purchases. */
export function randomPortfolio(mode:ResearchTicketMode,count:number,seed:number):string[]{
 const n=Number.isFinite(count)?Math.max(0,Math.floor(count)):0,rng=seededRandom(seed),len=LENGTH[mode],out:string[]=[];
 for(let i=0;i<n;i++){let s='';for(let p=0;p<len;p++)s+=Math.floor(rng()*10);out.push(s);}return out;
}
export interface ExperimentPlan { protocolVersion:string; sourceUrl:string; sourceFetchedAt:string; dataFingerprint?:string; totalDraws:number; drawIdStart:number|null; drawIdEnd:number|null; mode:ResearchTicketMode; ticketCounts:number[]; seeds:number[]; strategyVersion:string; notes:string[]; }
export function createPlan(draws:Draw[],mode:ResearchTicketMode,seeds:number[],strategyVersion:string,sourceFetchedAt:string,dataFingerprint?:string):ExperimentPlan{
 const ordered=[...draws].sort((a,b)=>a.drawId-b.drawId);
 return {protocolVersion:'portfolio-experiment-v1',sourceUrl:'https://raw.githubusercontent.com/pakinja/pakin/master/Tris.csv',sourceFetchedAt,dataFingerprint,totalDraws:ordered.length,drawIdStart:ordered[0]?.drawId??null,drawIdEnd:ordered.at(-1)?.drawId??null,mode,ticketCounts:[5,10,20,50,100],seeds:[...seeds],strategyVersion,notes:['Plan metadata only; no outcomes evaluated.','Confirm chronological validation/holdout boundaries and freeze strategy settings before experiment.','Verify input draw quality and chronology before using this plan.']};
}
