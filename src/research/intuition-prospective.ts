/**
 * Frozen prospective TRIS forecast records.
 * Predictions are generated only from the supplied pre-result history.
 * Resolution is a separate operation after the target contest appears in the CSV.
 */
import { createHash } from "node:crypto";
import type { Draw, Digit, Pos, PoolMethod } from "../research-core";
import { buildPool } from "../research-core";
import type { IntuitionCandidate, CandidateConfig, CandidateFamily } from "./intuition-candidate-generator";
import { MODES, outcomeForMode } from "./draw-evolution";

export interface FrozenForecast {
  schemaVersion:1;
  forecastId:string;
  candidateId:string;
  family:CandidateFamily;
  frozenConfig:string;
  targetDrawId:number;
  generatedAt:string;
  historyThroughDrawId:number;
  historySha256:string;
  prediction:string[];
  baseline:string[];
}
export interface ResolvedForecast extends FrozenForecast {
  resolvedAt:string;
  actual:string;
  candidateHit:boolean;
  baselineHit:boolean;
}
const DIGITS:Digit[]=[0,1,2,3,4,5,6,7,8,9];
const sha=(s:string)=>createHash("sha256").update(s,"utf8").digest("hex");
const historyHash=(draws:Draw[])=>sha(draws.map(d=>d.drawId+"|"+d.digits.join("")+"|"+(d.date??"")).join("\n")+"\n");
const modePositions=(mode:string):Pos[]=>{
 const spec=MODES.find(x=>x.mode===mode);
 if(!spec)throw new Error("unsupported mode: "+mode);
 return spec.positions;
};
const topString=(values:string[]):string|null=>{
 if(!values.length)return null;
 const counts=new Map<string,number>();
 values.forEach(v=>counts.set(v,(counts.get(v)??0)+1));
 return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0][0];
};
const topDigit=(values:Digit[]):Digit|null=>{
 if(!values.length)return null;
 const counts=Array(10).fill(0);
 values.forEach(v=>counts[v]++);
 return DIGITS.slice().sort((a,b)=>counts[b]-counts[a]||a-b)[0];
};
function validateHistory(draws:Draw[]):void{
 if(draws.length<200)throw new Error("at least 200 prior draws are required to freeze a forecast");
 for(let i=0;i<draws.length;i++){
  if(i&&draws[i].drawId!==draws[i-1].drawId+1)throw new Error("history must be contiguous by contest ID");
  if(draws[i].digits.length!==5||draws[i].digits.some(d=>!Number.isInteger(d)||d<0||d>9))throw new Error("invalid draw history");
 }
}
function predict(candidate:IntuitionCandidate,history:Draw[]):{prediction:string[];baseline:string[]}|null{
 const c=candidate.config,latest=history.length-1;
 switch(candidate.family){
  case "transition":{
   const lag=c.lag!,positions=modePositions(c.mode!),source=history[latest-lag];
   if(!source)return null;
   const context=positions.map(p=>source.digits[p]).join("");
   const prior:string[]=[];
   for(let i=lag;i<history.length;i++){
    const sourceValue=positions.map(p=>history[i-lag].digits[p]).join("");
    if(sourceValue===context)prior.push(positions.map(p=>history[i].digits[p]).join(""));
   }
   if(prior.length<5)return null;
   const predicted=topString(prior),base=topString(history.map(d=>positions.map(p=>d.digits[p]).join("")));
   return predicted===null||base===null?null:{prediction:[predicted],baseline:[base]};
  }
  case "position-mutation":{
   const lag=c.lag!,position=c.position!,source=history[latest-lag];
   if(!source)return null;
   const sourceDigit=source.digits[position],changes=Array(10).fill(0);let n=0;
   for(let i=lag;i<history.length;i++)if(history[i-lag].digits[position]===sourceDigit){
    changes[(history[i].digits[position]-sourceDigit+10)%10]++;n++;
   }
   if(n<5)return null;
   const change=DIGITS.slice().sort((a,b)=>changes[b]-changes[a]||a-b)[0];
   const predicted=String((sourceDigit+change)%10),base=topDigit(history.map(d=>d.digits[position]));
   return base===null?null:{prediction:[predicted],baseline:[String(base)]};
  }
  case "absence-return":{
   const position=c.position!,threshold=c.priorMisses!,misses=Array(10).fill(0);
   for(const digit of DIGITS){let count=0;for(let i=latest;i>=0&&history[i].digits[position]!==digit;i--)count++;misses[digit]=count;}
   const pool=DIGITS.filter(d=>misses[d]===threshold);
   if(!pool.length)return null;
   const counts=Array(10).fill(0);history.forEach(d=>counts[d.digits[position]]++);
   const baseline=DIGITS.slice().sort((a,b)=>counts[b]-counts[a]||a-b).slice(0,pool.length);
   return {prediction:pool.map(String),baseline:baseline.map(String)};
  }
  case "pool-ranking":{
   const position=c.position!,method=c.method as PoolMethod,size=c.poolSize!,window=c.window!;
   const values=history.map(d=>d.digits[position]);
   return {prediction:buildPool(values,method,size,window).map(String),baseline:buildPool(values,"recent-frequency",size,window).map(String)};
  }
 }
 return null;
}
export function freezeProspectiveForecast(
 history:Draw[],candidate:IntuitionCandidate,targetDrawId:number,generatedAt:string
):FrozenForecast|null{
 validateHistory(history);
 if(!Number.isInteger(targetDrawId)||targetDrawId!==history.at(-1)!.drawId+1)
  throw new Error("target must be the next consecutive contest after the supplied history");
 if(!Number.isFinite(Date.parse(generatedAt)))throw new Error("valid generatedAt timestamp required");
 const result=predict(candidate,history);
 if(!result)return null;
 const fingerprint=historyHash(history);
 const identity=[candidate.id,candidate.frozenConfig,targetDrawId,fingerprint,generatedAt].join("|");
 return {
  schemaVersion:1,forecastId:sha(identity),candidateId:candidate.id,family:candidate.family,frozenConfig:candidate.frozenConfig,
  targetDrawId,generatedAt,historyThroughDrawId:history.at(-1)!.drawId,historySha256:fingerprint,
  prediction:result.prediction,baseline:result.baseline
 };
}
/** Resolve only after the exact target draw is present. Never rewrites the frozen prediction. */
export function resolveProspectiveForecast(
 forecast:FrozenForecast,actualDraw:Draw,resolvedAt:string
):ResolvedForecast{
 if(actualDraw.drawId!==forecast.targetDrawId)throw new Error("actual draw ID does not match frozen forecast target");
 if(actualDraw.digits.length!==5||actualDraw.digits.some(d=>!Number.isInteger(d)||d<0||d>9))throw new Error("invalid actual draw");
 if(!Number.isFinite(Date.parse(resolvedAt)))throw new Error("valid resolvedAt timestamp required");
 const actual=actualDraw.digits.join("");
 let config:CandidateConfig;
 try { config=JSON.parse(forecast.frozenConfig) as CandidateConfig; }
 catch { throw new Error("frozen forecast config is not valid JSON"); }
 if(config.family!==forecast.family)throw new Error("frozen forecast family does not match its config");
 let outcome:string;
 if(forecast.family==="transition") outcome=outcomeForMode(actualDraw.digits,config.mode as Parameters<typeof outcomeForMode>[1]);
 else {
  if(!Number.isInteger(config.position)||config.position!<0||config.position!>4)throw new Error("frozen forecast position is invalid");
  outcome=String(actualDraw.digits[config.position!]);
 }
 return {
  ...forecast,resolvedAt,actual,
  candidateHit:forecast.prediction.includes(outcome),
  baselineHit:forecast.baseline.includes(outcome)
 };
}
