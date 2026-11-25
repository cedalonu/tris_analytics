/**
 * Strict walk-forward scorer for frozen TRIS intuition hypotheses.
 * Offline only: consumes validated local draws and never performs network access.
 */
import type { Draw, Digit, Pos } from "../research-core";
import { buildPool } from "../research-core";
import type { IntuitionCandidate, CandidateConfig } from "./intuition-candidate-generator";
import type { EvaluationPhase, Observation } from "./intuition-evaluator";
import { MODES, outcomeForMode } from "./draw-evolution";

export interface PhaseBoundary { phase: EvaluationPhase; firstDrawId: number; lastDrawId: number; }
export interface SkippedTarget { drawId: number; reason: string; }
export interface CandidateWalkForwardResult {
  candidateId: string;
  frozenConfig: string;
  observations: Observation[];
  skipped: SkippedTarget[];
  coverage: { eligible: number; skipped: number; availableTargets: number; rate: number };
  warnings: string[];
}
const MIN_HISTORY = 200;
const DIGITS: Digit[] = [0,1,2,3,4,5,6,7,8,9];
const modePositions = (mode: string): number[] => {
  const spec = MODES.find(item => item.mode === mode);
  if (!spec) throw new Error("unsupported transition mode: " + mode);
  return spec.positions;
};
const modeValue = (draw: Draw, positions: number[]): string => positions.map(p => String(draw.digits[p])).join("");
const mostFrequentString = (values: string[]): string | null => {
  if (!values.length) return null;
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]))[0][0];
};
const mostFrequentDigit = (values: Digit[]): Digit | null => {
  if (!values.length) return null;
  const counts = Array(10).fill(0);
  values.forEach(value => counts[value]++);
  return DIGITS.slice().sort((a,b) => counts[b]-counts[a] || a-b)[0];
};
function validateDrawSequence(draws: Draw[]): void {
  if (draws.length < MIN_HISTORY + 1) throw new Error("at least 201 contiguous validated draws are required");
  for (let i=0;i<draws.length;i++) {
    const draw=draws[i];
    if (!Number.isInteger(draw.drawId) || draw.drawId<=0 || !Array.isArray(draw.digits) ||
      draw.digits.length!==5 || draw.digits.some(d=>!Number.isInteger(d)||d<0||d>9))
      throw new Error("invalid draw at index " + i);
    if (i && draw.drawId !== draws[i-1].drawId+1)
      throw new Error("non-contiguous draw IDs: " + draws[i-1].drawId + " -> " + draw.drawId);
  }
}
function validateBoundaries(boundaries: PhaseBoundary[], firstId: number, lastId: number): void {
  const allowed: EvaluationPhase[]=["discovery","validation","holdout","prospective"];
  let previous=firstId-1;
  for (const boundary of boundaries) {
    if (!allowed.includes(boundary.phase) || !Number.isInteger(boundary.firstDrawId) ||
      !Number.isInteger(boundary.lastDrawId) || boundary.firstDrawId>boundary.lastDrawId ||
      boundary.firstDrawId<=previous || boundary.firstDrawId<firstId || boundary.lastDrawId>lastId)
      throw new Error("phase boundaries must be valid, ordered, non-overlapping and within dataset");
    previous=boundary.lastDrawId;
  }
}
const phaseFor = (id:number, boundaries:PhaseBoundary[]) => boundaries.find(b=>id>=b.firstDrawId&&id<=b.lastDrawId)?.phase;

function scoreTransition(draws:Draw[], targetIndex:number, config:CandidateConfig): {hit:boolean; baselineHit:boolean}|null {
  const lag=config.lag!, positions=modePositions(config.mode!);
  const target=draws[targetIndex], sourceId=target.drawId-lag;
  const source=draws.find(d=>d.drawId===sourceId);
  if (!source) return null;
  const context=modeValue(source,positions);
  const priorPairs=draws.slice(0,targetIndex).filter(d=>d.drawId-lag>=draws[0].drawId)
    .map(d=>({source:draws.find(s=>s.drawId===d.drawId-lag),target:d}))
    .filter(pair=>pair.source && pair.target.drawId<target.drawId && modeValue(pair.source,positions)===context);
  if(priorPairs.length<5) return null;
  const prediction=mostFrequentString(priorPairs.map(pair=>modeValue(pair.target,positions)));
  const baseline=mostFrequentString(draws.slice(0,targetIndex).map(d=>modeValue(d,positions)));
  if(prediction===null||baseline===null)return null;
  const actual=modeValue(target,positions);
  return {hit:actual===prediction,baselineHit:actual===baseline};
}
function scoreMutation(draws:Draw[], targetIndex:number, config:CandidateConfig): {hit:boolean;baselineHit:boolean}|null {
  const lag=config.lag!, position=config.position!, target=draws[targetIndex], sourceId=target.drawId-lag;
  const source=draws.find(d=>d.drawId===sourceId);
  if(!source)return null;
  const sourceDigit=source.digits[position];
  const pairs=draws.slice(0,targetIndex).filter(d=>d.drawId-lag>=draws[0].drawId)
    .map(d=>({source:draws.find(s=>s.drawId===d.drawId-lag),target:d}))
    .filter(pair=>pair.source && pair.source.digits[position]===sourceDigit);
  if(pairs.length<5)return null;
  const changes=Array(10).fill(0);
  pairs.forEach(pair=>changes[(pair.target.digits[position]-pair.source!.digits[position]+10)%10]++);
  const change=DIGITS.slice().sort((a,b)=>changes[b]-changes[a]||a-b)[0];
  const predicted=((sourceDigit+change)%10) as Digit;
  const baseline=mostFrequentDigit(draws.slice(0,targetIndex).map(d=>d.digits[position]));
  if(baseline===null)return null;
  return {hit:target.digits[position]===predicted,baselineHit:target.digits[position]===baseline};
}
function scoreAbsence(draws:Draw[], targetIndex:number, config:CandidateConfig): {hit:boolean;baselineHit:boolean}|null {
  const position=config.position!, threshold=config.priorMisses!;
  const history=draws.slice(0,targetIndex).map(d=>d.digits[position]);
  const misses=Array(10).fill(0);
  for(const digit of DIGITS) {
    let count=0;
    for(let i=history.length-1;i>=0&&history[i]!==digit;i--)count++;
    misses[digit]=count;
  }
  const pool=DIGITS.filter(d=>misses[d]===threshold);
  if(!pool.length)return null;
  const baseline=DIGITS.slice().sort((a,b)=>{
    const ca=history.filter(d=>d===a).length,cb=history.filter(d=>d===b).length;
    return cb-ca||a-b;
  }).slice(0,pool.length);
  const actual=draws[targetIndex].digits[position];
  return {hit:pool.includes(actual),baselineHit:baseline.includes(actual)};
}
function scorePool(draws:Draw[], targetIndex:number, config:CandidateConfig): {hit:boolean;baselineHit:boolean} {
  const position=config.position!, history=draws.slice(0,targetIndex).map(d=>d.digits[position]);
  const pool=buildPool(history,config.method as Parameters<typeof buildPool>[1],config.poolSize!,config.window!);
  const baseline=buildPool(history,"recent-frequency",config.poolSize!,config.window!);
  const actual=draws[targetIndex].digits[position];
  return {hit:pool.includes(actual),baselineHit:baseline.includes(actual)};
}
function scoreCandidate(draws:Draw[], targetIndex:number, candidate:IntuitionCandidate) {
  switch(candidate.family) {
    case "transition": return scoreTransition(draws,targetIndex,candidate.config);
    case "position-mutation": return scoreMutation(draws,targetIndex,candidate.config);
    case "absence-return": return scoreAbsence(draws,targetIndex,candidate.config);
    case "pool-ranking": return scorePool(draws,targetIndex,candidate.config);
  }
}
/** Score one frozen candidate. The full input must be contiguous and chronological. */
export function runIntuitionWalkForward(
  draws:Draw[], candidate:IntuitionCandidate, boundaries:PhaseBoundary[]
): CandidateWalkForwardResult {
  validateDrawSequence(draws);
  validateBoundaries(boundaries,draws[0].drawId,draws[draws.length-1].drawId);
  const observations:Observation[]=[], skipped:SkippedTarget[]=[];
  const firstTarget=MIN_HISTORY;
  for(let i=firstTarget;i<draws.length;i++) {
    const target=draws[i],phase=phaseFor(target.drawId,boundaries);
    if(!phase)continue;
    const result=scoreCandidate(draws,i,candidate);
    if(!result) { skipped.push({drawId:target.drawId,reason:candidate.family==="absence-return"?"empty exact-absence pool or insufficient prior history":"insufficient matching context/history"}); continue; }
    observations.push({drawId:target.drawId,phase,hit:result.hit,baselineHit:result.baselineHit,period:target.date?.slice(0,7)});
  }
  const availableTargets=boundaries.reduce((sum,b)=>sum+Math.max(0,b.lastDrawId-Math.max(b.firstDrawId,draws[MIN_HISTORY].drawId)+1),0);
  const eligible=observations.length, skippedCount=skipped.length;
  return {
    candidateId:candidate.id,frozenConfig:candidate.frozenConfig,observations,skipped,
    coverage:{eligible,skipped:skippedCount,availableTargets,rate:availableTargets?eligible/availableTargets:0},
    warnings:[
      "All scored features use draws strictly before the target contest; initial history is 200 draws.",
      "Exact contest-ID lags are used; non-contiguous input is rejected rather than bridged.",
      "Conditional candidates with insufficient context or empty absence pools are skipped, not scored as misses.",
      "Candidate and paired baseline are evaluated on identical eligible target draws.",
      "The scorer does not fetch data, write evidence to the ledger, or claim predictive value."
    ]
  };
}
