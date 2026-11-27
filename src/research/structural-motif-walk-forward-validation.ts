import type { MotifWindow, TriadType } from "./structural-motifs";

const TYPES: TriadType[] = ["empty", "single-edge", "wedge", "triangle"];
export type MotifForecastPoint = {
  targetWindow: number;
  predicted: Record<TriadType, number>;
  baseline: Record<TriadType, number>;
  observed: Record<TriadType, number>;
  modelMae: number;
  baselineMae: number;
  skill: number | null;
};
function mean(values: number[]) { return values.length ? values.reduce((a,b)=>a+b,0)/values.length : null; }
function rates(values: number[]) {
  return Object.fromEntries(TYPES.map((t,i)=>[t,values[i]??0])) as Record<TriadType,number>;
}
function mae(a: Record<TriadType,number>, b: Record<TriadType,number>) {
  return TYPES.reduce((sum,t)=>sum+Math.abs(a[t]-b[t]),0)/TYPES.length;
}
function score(points: MotifForecastPoint[]) {
  const model=mean(points.map(p=>p.modelMae)), baseline=mean(points.map(p=>p.baselineMae));
  return {targets:points.length,modelMae:model,baselineMae:baseline,skill:model===null||baseline===null||baseline===0?null:1-model/baseline};
}
/**
 * One-step walk-forward forecast of the next window's motif-type composition.
 * At target t, the naive model uses only t-1; the expanding baseline uses only
 * windows strictly before t. The target window is read only for scoring.
 */
export function validateMotifStructureWalkForward(windows: MotifWindow[]) {
  const ordered=[...windows].sort((a,b)=>a.index-b.index);
  const points:MotifForecastPoint[]=[];
  for(let i=1;i<ordered.length;i++){
    const previous=ordered[i-1], target=ordered[i];
    const predicted=rates(TYPES.map(t=>previous.rates[t]));
    const prior=ordered.slice(0,i);
    const baseline=rates(TYPES.map(t=>mean(prior.map(w=>w.rates[t]))??0));
    const observed=rates(TYPES.map(t=>target.rates[t]));
    const modelMae=mae(predicted,observed),baselineMae=mae(baseline,observed);
    points.push({targetWindow:target.index,predicted,baseline,observed,modelMae,baselineMae,skill:baselineMae===0?null:1-modelMae/baselineMae});
  }
  const midpoint=Math.ceil(points.length/2);
  const first=score(points.slice(0,midpoint)),second=score(points.slice(midpoint));
  const overall=score(points);
  const classErrors=Object.fromEntries(TYPES.map(t=>[t,{
    lastWindowMae:mean(points.map(p=>Math.abs(p.predicted[t]-p.observed[t]))),
    expandingBaselineMae:mean(points.map(p=>Math.abs(p.baseline[t]-p.observed[t])))
  }])) as Record<TriadType,{lastWindowMae:number|null;expandingBaselineMae:number|null}>;
  return {
    valid:points.length>0,
    points,
    summary:{...overall,firstHalf:first,secondHalf:second,skillPositiveBothHalves:first.skill!==null&&second.skill!==null&&first.skill>0&&second.skill>0,classes:classErrors},
    settings:{forecast:"one-step-ahead",model:"last observed window rates",baseline:"expanding mean of prior windows",targetLeakage:"none: target is used only for scoring",metric:"mean absolute error across four motif-type rates"}
  };
}
