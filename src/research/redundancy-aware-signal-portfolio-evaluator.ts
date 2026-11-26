/** Chronological outcome evaluation of frozen signal portfolios.
 * Alerts are OR-combined per target. Utility scores must be frozen from discovery.
 * This evaluator only accepts aligned target outcome rows and alert rows; callers
 * must document that alerts were generated strictly before each target outcome.
 */
import type {PortfolioSelectionMethod,SignalPortfolioInput,SignalPortfolioGroups,SignalPortfolioResult} from "./redundancy-aware-signal-portfolio";
import {selectRedundancyAwareSignalPortfolio} from "./redundancy-aware-signal-portfolio";
export interface PortfolioTarget {targetId:string;outcome:boolean;phase:"discovery"|"validation"|"holdout"|"prospective";}
export interface SignalAlerts {signalId:string;alerts:Array<{targetId:string;alert:boolean}>;}
export interface SignalOutcomeMetric {phase:string;targets:number;alerts:number;hits:number;baselineHits:number;precision:number|null;recall:number|null;baselineRate:number|null;lift:number|null;falseAlertRate:number|null;alertCoverage:number;differencePrecision:number|null;}
export interface BlockMetric extends SignalOutcomeMetric {firstTargetId:string;lastTargetId:string;blockIndex:number;}
export interface SignalPortfolioEvaluation {selection:SignalPortfolioResult;metrics:SignalOutcomeMetric[];blocks:BlockMetric[];warnings:string[];}
export function evaluateSignalPortfolio(selection:SignalPortfolioResult,signals:SignalAlerts[],targets:PortfolioTarget[],blockSize=25):SignalPortfolioEvaluation{
 if(!Number.isInteger(blockSize)||blockSize<2)throw new Error("blockSize must be integer >=2");
 if(new Set(targets.map(t=>t.targetId)).size!==targets.length)throw new Error("target IDs must be unique");
 const ordered=[...targets].sort((a,b)=>{const na=Number(a.targetId),nb=Number(b.targetId);return Number.isFinite(na)&&Number.isFinite(nb)?na-nb:a.targetId.localeCompare(b.targetId)});
 const idx=new Map(ordered.map((t,i)=>[t.targetId,i]));
 const byId=new Map(signals.map(s=>[s.signalId,s]));
 if(byId.size!==signals.length)throw new Error("signal IDs must be unique");
 for(const id of selection.selectedSignalIds){const s=byId.get(id);if(!s)throw new Error("selected signal missing alerts: "+id);if(new Set(s.alerts.map(a=>a.targetId)).size!==s.alerts.length)throw new Error("duplicate alert target IDs in "+id);if(s.alerts.some(a=>!idx.has(a.targetId)))throw new Error("alert references unknown target in "+id);}
 const alertsByTarget=new Map<string,boolean>(ordered.map(t=>[t.targetId,false]));
 for(const id of selection.selectedSignalIds)for(const a of byId.get(id)!.alerts)if(a.alert)alertsByTarget.set(a.targetId,true);
 const summarize=(rows:PortfolioTarget[]):SignalOutcomeMetric=>{
  const alerted=rows.filter(t=>alertsByTarget.get(t.targetId)),hits=alerted.filter(t=>t.outcome).length,totalHits=rows.filter(t=>t.outcome).length,precision=alerted.length?hits/alerted.length:null,recall=totalHits?hits/totalHits:null,base=rows.length?totalHits/rows.length:null;
  return{phase:rows[0]?.phase??"empty",targets:rows.length,alerts:alerted.length,hits,baselineHits:totalHits,precision,recall,baselineRate:base,lift:precision!==null&&base!==null&&base>0?precision/base:null,falseAlertRate:alerted.length? (alerted.length-hits)/alerted.length:null,alertCoverage:rows.length?alerted.length/rows.length:0,differencePrecision:precision!==null&&base!==null?precision-base:null};
 };
 const phases=["validation","holdout","prospective"] as const;
 const metrics=phases.map(phase=>summarize(ordered.filter(t=>t.phase===phase))).filter(m=>m.targets>0);
 const blocks:BlockMetric[]=[];
 for(const phase of phases){const phaseRows=ordered.filter(t=>t.phase===phase);for(let start=0;start<phaseRows.length;start+=blockSize){const rows=phaseRows.slice(start,start+blockSize),m=summarize(rows);blocks.push({...m,firstTargetId:rows[0].targetId,lastTargetId:rows.at(-1)!.targetId,blockIndex:Math.floor(start/blockSize)+1});}}
 return{selection,metrics,blocks,warnings:["Alerts are OR-combined across selected signals; this is a descriptive portfolio policy, not an optimized threshold.","Caller must verify alerts were generated strictly before each target outcome and scores/groups were frozen in discovery.","Targets and signal alerts may be temporally dependent; block summaries are descriptive, not independent confidence intervals.","Historical holdout is not prospective evidence. Do not tune using holdout results."]};
}
export function runSignalPortfolioComparison(sizes:number[],scores:SignalPortfolioInput[],groups:SignalPortfolioGroups,alerts:SignalAlerts[],targets:PortfolioTarget[],seeds:number[]=Array.from({length:100},(_,i)=>20261126+i),penalty=1,blockSize=25){
 const output:SignalPortfolioEvaluation[]=[];
 for(const size of sizes)for(const method of ["utility-ranked","empirical-diversity","structural-diversity","random"] as PortfolioSelectionMethod[]){
  const reps=method==="random"?seeds:[seeds[0]??20261126];
  for(const seed of reps){const selection=selectRedundancyAwareSignalPortfolio(method,size,scores,groups,seed,penalty);output.push(evaluateSignalPortfolio(selection,alerts,targets,blockSize));}
 }
 return output;
}
