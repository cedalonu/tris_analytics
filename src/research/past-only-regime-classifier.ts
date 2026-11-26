/**
 * Deterministic past-only regime classifier for prospective TRIS contests.
 * For target draw t, features use only the preceding 50 contests:
 * reference = older 25, recent = latest 25. Thresholds are fixed a priori.
 */
import type {Draw} from "../research-core";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";

export interface PastOnlyRegimeOptions {
 referenceWindow?:number; recentWindow?:number;
 poolTvThreshold?:number; duplicateRateThreshold?:number;
 distinctMeanThreshold?:number; entropyThreshold?:number;
}
export interface PastOnlyRegimeDiagnostics {
 drawId:number; regimeId:string; referenceStartDrawId:number; referenceEndDrawId:number;
 recentStartDrawId:number; recentEndDrawId:number;
 poolTotalVariation:number; duplicatePairRateDifference:number;
 meanDistinctDigitsDifference:number; positionalEntropyDifference:number;
}
export interface PastOnlyRegimeReport {
 method:string; warmupDraws:number; labels:ProspectiveRegimeLabel[];
 diagnostics:PastOnlyRegimeDiagnostics[]; skippedDrawIds:number[];
 limitations:string[];
}
const defaults={referenceWindow:25,recentWindow:25,poolTvThreshold:.2,duplicateRateThreshold:.08,distinctMeanThreshold:.5,entropyThreshold:.35};
function validate(draws:Draw[]):void{
 if(!draws.length)throw new Error("regime classifier requires draws");
 for(let i=0;i<draws.length;i++){
  const d=draws[i];
  if(!Number.isInteger(d.drawId)||d.drawId<1||!Array.isArray(d.digits)||d.digits.length!==5||d.digits.some(x=>!Number.isInteger(x)||x<0||x>9))throw new Error("invalid draw at index "+i);
  if(i&&d.drawId!==draws[i-1].drawId+1)throw new Error("non-contiguous draw IDs");
 }
}
function features(rows:Draw[]){
 const pool=[0,0,0,0,0],position=Array.from({length:5},()=>Array(10).fill(0));
 let distinct=0,duplicate=0,pairs=0;
 for(const d of rows){
  const n=new Set(d.digits).size;pool[n-1]++;distinct+=n;
  for(let p=0;p<5;p++)position[p][d.digits[p]]++;
  for(let p=0;p<5;p++)for(let q=p+1;q<5;q++){pairs++;if(d.digits[p]===d.digits[q])duplicate++;}
 }
 const entropy=position.map(counts=>{let h=0;for(const c of counts)if(c){const p=c/rows.length;h-=p*Math.log2(p);}return h;});
 return {pool:pool.map(x=>x/rows.length),duplicateRate:pairs?duplicate/pairs:0,meanDistinct:distinct/rows.length,meanEntropy:entropy.reduce((a,b)=>a+b,0)/5};
}
function tv(a:number[],b:number[]){return .5*a.reduce((s,x,i)=>s+Math.abs(x-b[i]),0);}
function direction(delta:number,threshold:number,up:string,down:string,stable:string){return delta>=threshold?up:delta<=-threshold?down:stable;}
export function classifyPastOnlyRegimes(draws:Draw[],firstTargetDrawId:number,lastTargetDrawId:number,options:PastOnlyRegimeOptions={}):PastOnlyRegimeReport{
 validate(draws);
 const o={...defaults,...options};
 for(const [k,v] of Object.entries(o))if(!Number.isFinite(v)||v<=0)throw new Error("invalid regime classifier option "+k);
 if(!Number.isInteger(firstTargetDrawId)||!Number.isInteger(lastTargetDrawId)||firstTargetDrawId>lastTargetDrawId)throw new Error("invalid target range");
 const first=draws.findIndex(d=>d.drawId===firstTargetDrawId),last=draws.findIndex(d=>d.drawId===lastTargetDrawId);
 if(first<0||last<0||last<first)throw new Error("target range is not fully present in CSV");
 const needed=o.referenceWindow+o.recentWindow,labels:ProspectiveRegimeLabel[]=[],diagnostics:PastOnlyRegimeDiagnostics[]=[],skippedDrawIds:number[]=[];
 const method="past-only-window-v1:ref="+o.referenceWindow+",recent="+o.recentWindow+",poolTV="+o.poolTvThreshold+",dupDelta="+o.duplicateRateThreshold+",distinctDelta="+o.distinctMeanThreshold+",entropyDelta="+o.entropyThreshold;
 for(let i=first;i<=last;i++){
  if(i<needed){skippedDrawIds.push(draws[i].drawId);continue;}
  const reference=features(draws.slice(i-needed,i-o.recentWindow));
  const recent=features(draws.slice(i-o.recentWindow,i));
  const poolTv=tv(reference.pool,recent.pool),dupDelta=recent.duplicateRate-reference.duplicateRate;
  const distinctDelta=recent.meanDistinct-reference.meanDistinct,entropyDelta=recent.meanEntropy-reference.meanEntropy;
  const poolState=poolTv>=o.poolTvThreshold?"pool-shift":"pool-stable";
  const dupState=direction(dupDelta,o.duplicateRateThreshold,"dup-up","dup-down","dup-stable");
  const distinctState=direction(distinctDelta,o.distinctMeanThreshold,"distinct-up","distinct-down","distinct-stable");
  const entropyState=direction(entropyDelta,o.entropyThreshold,"entropy-up","entropy-down","entropy-stable");
  const regimeId=[poolState,dupState,distinctState,entropyState].join("|");
  const target=draws[i],sourceStart=draws[i-needed].drawId,sourceEnd=draws[i-1].drawId;
  labels.push({drawId:target.drawId,regimeId,method,sourceStartDrawId:sourceStart,sourceEndDrawId:sourceEnd});
  diagnostics.push({drawId:target.drawId,regimeId,referenceStartDrawId:sourceStart,referenceEndDrawId:draws[i-o.recentWindow-1].drawId,recentStartDrawId:draws[i-o.recentWindow].drawId,recentEndDrawId:sourceEnd,poolTotalVariation:poolTv,duplicatePairRateDifference:dupDelta,meanDistinctDigitsDifference:distinctDelta,positionalEntropyDifference:entropyDelta});
 }
 return {method,warmupDraws:needed,labels,diagnostics,skippedDrawIds,limitations:[
  "Para cada objetivo, solo se usan los concursos anteriores: 25 de referencia y 25 recientes por defecto.",
  "Los umbrales son fijos y explícitos; no se ajustan usando resultados del periodo evaluado.",
  "Las etiquetas son estados descriptivos de características agregadas, no estados ocultos verdaderos ni predicciones.",
  "Las etiquetas pueden cambiar entre concursos consecutivos y los regímenes pueden tener tamaños muy desiguales.",
  "No se interpretan diferencias entre regímenes como causalidad, significancia ni ventaja predictiva.",
  "Si faltan concursos o no existe suficiente historia previa, la clasificación se bloquea o el objetivo se marca como omitido."
 ]};
}
