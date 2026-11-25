/** Position-specific absence and return analysis. Descriptive only: absence does not imply a digit is due. */
import type { Digit, Pos, Draw } from "../research-core";
const DIGITS:Digit[]=[0,1,2,3,4,5,6,7,8,9];
export interface AbsenceDigitReport {
 digit:Digit; occurrences:number; rate:number; currentAbsence:number;
 completedAbsenceLengths:number[]; meanCompletedAbsence:number|null;
 medianCompletedAbsence:number|null; maxCompletedAbsence:number;
 returnByPriorAbsence:{priorMisses:number;opportunities:number;returns:number;rate:number;uniformReference:number}[];
}
function median(values:number[]):number|null {if(!values.length)return null;const s=[...values].sort((a,b)=>a-b),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}
export function analyzeAbsences(history:Digit[],maxPriorMisses=20):AbsenceDigitReport[] {
 return DIGITS.map(digit=>{
  const indices:number[]=[];history.forEach((v,i)=>{if(v===digit)indices.push(i)});
  const gaps:number[]=[];for(let i=1;i<indices.length;i++)gaps.push(indices[i]-indices[i-1]-1);
  const current=indices.length?history.length-1-indices[indices.length-1]:history.length;
  const byMiss=new Map<number,{opportunities:number;returns:number}>();
  let misses=0;history.forEach(v=>{const entry=byMiss.get(misses)||{opportunities:0,returns:0};entry.opportunities++;if(v===digit)entry.returns++;byMiss.set(misses,entry);misses=v===digit?0:misses+1;});
  const rows=[...byMiss.entries()].filter(([g])=>g<=maxPriorMisses).sort((a,b)=>a[0]-b[0]).map(([priorMisses,v])=>({priorMisses,opportunities:v.opportunities,returns:v.returns,rate:v.opportunities?v.returns/v.opportunities:0,uniformReference:0.1}));
  return {digit,occurrences:indices.length,rate:history.length?indices.length/history.length:0,currentAbsence:current,completedAbsenceLengths:gaps,meanCompletedAbsence:gaps.length?gaps.reduce((s,v)=>s+v,0)/gaps.length:null,medianCompletedAbsence:median(gaps),maxCompletedAbsence:gaps.length?Math.max(...gaps):0,returnByPriorAbsence:rows};
 });
}
export interface PositionAbsenceSummary {position:Pos;drawCount:number;digitReports:AbsenceDigitReport[];notes:string[]}
/** Requires chronologically ordered draws; analyzes the requested position. */
export function analyzePositionAbsences(draws:Draw[],position:Pos,maxPriorMisses=20):PositionAbsenceSummary {
 const history=draws.map(d=>d.digits[position]);
 return {position,drawCount:history.length,digitReports:analyzeAbsences(history,maxPriorMisses),notes:["Descriptive statistics only; no prediction or due-digit interpretation.","Conditional return rates use all observed opportunities and are not independent trials.","Compare rates to the uniform 10% reference and use chronological holdout/prospective validation before claiming an effect."]};
}
