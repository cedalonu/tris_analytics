/**
 * Temporal-memory research for TRIS.
 * Measures lagged digit dependencies without treating them as forecasts.
 * All calculations are descriptive; predictive claims require walk-forward tests.
 */
import type { Draw, Digit, Pos } from "../research-core";

export type MemoryLag = 1|2|3|4|5;
export type MemoryScope = "all-history"|"last-200"|"last-1000";
export interface MemoryTransition {
  from: Digit;
  to: Digit;
  count: number;
  conditionalRate: number;
  targetMarginalRate: number;
  liftVsTargetMarginal: number;
}
export interface PositionPairMemory {
  sourcePosition: Pos;
  targetPosition: Pos;
  lag: MemoryLag;
  observations: number;
  sameDigitRate: number;
  mutualInformationBits: number;
  conditionalEntropyBits: number;
  strongestTransitions: MemoryTransition[];
}
export interface TemporalMemoryScope {
  scope: MemoryScope;
  draws: number;
  firstDrawId: number;
  lastDrawId: number;
  comparisons: PositionPairMemory[];
}
export interface TemporalMemoryReport {
  drawCount: number;
  firstDrawId: number;
  lastDrawId: number;
  scopes: TemporalMemoryScope[];
  warnings: string[];
}
const DIGITS: Digit[]=[0,1,2,3,4,5,6,7,8,9];
const POSITIONS: Pos[]=[0,1,2,3,4];
const LAGS: MemoryLag[]=[1,2,3,4,5];
const MIN_TRANSITION_SUPPORT=5;
const log2=(x:number)=>Math.log(x)/Math.LN2;

function validate(draws:Draw[]):void {
  if(draws.length<2)throw new Error("temporal memory requires at least two draws");
  for(let i=0;i<draws.length;i++){
    const d=draws[i];
    if(!Number.isInteger(d.drawId)||d.drawId<=0||!Array.isArray(d.digits)||d.digits.length!==5||
      d.digits.some(x=>!Number.isInteger(x)||x<0||x>9))
      throw new Error("invalid draw at index "+i);
    if(i&&d.drawId!==draws[i-1].drawId+1)
      throw new Error("non-contiguous draw IDs: "+draws[i-1].drawId+" -> "+d.drawId);
  }
}

function analyzePair(rows:Draw[],sourcePosition:Pos,targetPosition:Pos,lag:MemoryLag):PositionPairMemory {
  const joint=Array.from({length:10},()=>Array(10).fill(0));
  const sourceCounts=Array(10).fill(0),targetCounts=Array(10).fill(0);
  let same=0,n=0;
  for(let i=lag;i<rows.length;i++){
    const from=rows[i-lag].digits[sourcePosition],to=rows[i].digits[targetPosition];
    joint[from][to]++;sourceCounts[from]++;targetCounts[to]++;n++;
    if(from===to)same++;
  }
  let mutualInformationBits=0,conditionalEntropyBits=0;
  for(const from of DIGITS){
    const rowN=sourceCounts[from];
    if(!rowN)continue;
    const pFrom=rowN/n;
    let rowEntropy=0;
    for(const to of DIGITS){
      const cell=joint[from][to];
      if(!cell)continue;
      const pToGivenFrom=cell/rowN;
      const pJoint=cell/n;
      const pTo=targetCounts[to]/n;
      rowEntropy-=pToGivenFrom*log2(pToGivenFrom);
      mutualInformationBits+=pJoint*log2(pToGivenFrom/pTo);
    }
    conditionalEntropyBits+=pFrom*rowEntropy;
  }
  const transitions:MemoryTransition[]=[];
  for(const from of DIGITS){
    const rowN=sourceCounts[from];
    if(rowN<MIN_TRANSITION_SUPPORT)continue;
    for(const to of DIGITS){
      const count=joint[from][to];
      if(count<MIN_TRANSITION_SUPPORT)continue;
      const targetMarginalRate=targetCounts[to]/n;
      const conditionalRate=count/rowN;
      transitions.push({
        from,to,count,conditionalRate,targetMarginalRate,
        liftVsTargetMarginal:targetMarginalRate?conditionalRate/targetMarginalRate:0
      });
    }
  }
  transitions.sort((a,b)=>b.count-a.count||b.liftVsTargetMarginal-a.liftVsTargetMarginal||a.from-b.from||a.to-b.to);
  return {
    sourcePosition,targetPosition,lag,observations:n,
    sameDigitRate:sourcePosition===targetPosition&&n?same/n:0,
    mutualInformationBits,conditionalEntropyBits,
    strongestTransitions:transitions.slice(0,10)
  };
}

function analyzeScope(rows:Draw[],scope:MemoryScope):TemporalMemoryScope {
  const comparisons:PositionPairMemory[]=[];
  for(const lag of LAGS)
    for(const sourcePosition of POSITIONS)
      for(const targetPosition of POSITIONS)
        comparisons.push(analyzePair(rows,sourcePosition,targetPosition,lag));
  return {
    scope,draws:rows.length,firstDrawId:rows[0].drawId,lastDrawId:rows[rows.length-1].drawId,comparisons
  };
}

/** Analyze same-position continuity and cross-position dependencies at lags -1..-5. */
export function analyzeTemporalMemory(draws:Draw[]):TemporalMemoryReport {
  validate(draws);
  const scopes:TemporalMemoryScope[]=[analyzeScope(draws,"all-history")];
  if(draws.length>=200)scopes.push(analyzeScope(draws.slice(-200),"last-200"));
  if(draws.length>=1000)scopes.push(analyzeScope(draws.slice(-1000),"last-1000"));
  return {
    drawCount:draws.length,firstDrawId:draws[0].drawId,lastDrawId:draws[draws.length-1].drawId,scopes,
    warnings:[
      "Lag -1 through -5 means exact contest-ID offsets; missing IDs are rejected, never bridged.",
      "All metrics are descriptive in-sample summaries. Mutual information and transition lifts are upward-biased or unstable in small samples.",
      "The 5-observation transition support floor is a reporting filter, not a significance threshold.",
      "The strongest transitions are selected from many position-pair and lag comparisons; do not treat them as independent evidence.",
      "Same-digit rate is descriptive and is not by itself evidence of memory; compare it with the empirical marginal baseline.",
      "No forecast is generated and no hypothesis or candidate weight is promoted. Use chronological walk-forward and prospective replication before predictive interpretation."
    ]
  };
}
