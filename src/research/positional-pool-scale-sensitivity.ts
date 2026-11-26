/**
 * Phase 36: block-size sensitivity for positional-pool concordance.
 * Rebuilds non-overlapping blocks from the same raw draws at predeclared scales.
 * Descriptive only; never selects a preferred scale.
 */
import type {Draw,PoolMethod} from "../research-core";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";
import {summarizePositionalRegimeStability} from "./positional-regime-stability";
import {analyzePositionalPoolConcordance} from "./positional-pool-concordance";
export type PositionalPoolScaleMetric="dominant-share-inclusion"|"dominant-transition-turnover"|"inclusion-hit-rate";
export interface PositionalPoolScaleObservation {regimeId:string;position:number;method:PoolMethod;poolSize:number;blockSize:number;metric:PositionalPoolScaleMetric;correlation:number|null;blocks:number;}
export interface PositionalPoolScaleGroup {regimeId:string;position:number;method:PoolMethod;poolSize:number;metric:PositionalPoolScaleMetric;scales:Array<{blockSize:number;correlation:number|null;blocks:number}>;validScales:number;positiveScales:number;negativeScales:number;status:"same-positive-direction-all-scales"|"same-negative-direction-all-scales"|"direction-mixed-across-scales"|"some-scales-only"|"insufficient";}
export interface PositionalPoolScaleSensitivityReport {method:string;blockSizes:number[];minimumHistory:number;minimumDrawSupport:number;observations:PositionalPoolScaleObservation[];groups:PositionalPoolScaleGroup[];limitations:string[];}
export function analyzePositionalPoolScaleSensitivity(draws:Draw[],labels:ProspectiveRegimeLabel[],options:{blockSizes?:number[];minimumHistory?:number;minimumDrawSupport?:number;methods?:PoolMethod[];poolSizes?:number[]}={}):PositionalPoolScaleSensitivityReport {
 const blockSizes=options.blockSizes??[10,15,25,40],minimumHistory=options.minimumHistory??30,minimumDrawSupport=options.minimumDrawSupport??10;
 if(!blockSizes.length||blockSizes.some(n=>!Number.isInteger(n)||n<2||n<minimumDrawSupport)||new Set(blockSizes).size!==blockSizes.length)throw new Error("blockSizes must be unique integers >= 2 and >= minimumDrawSupport");
 if(!Number.isInteger(minimumDrawSupport)||minimumDrawSupport<1)throw new Error("minimumDrawSupport must be a positive integer");
 const observations:PositionalPoolScaleObservation[]=[];
 for(const blockSize of blockSizes){
  const stability=summarizePositionalRegimeStability(draws,labels,{blockSize,minimumDrawSupport});
  const concordance=analyzePositionalPoolConcordance(draws,labels,stability,{minimumHistory,methods:options.methods,poolSizes:options.poolSizes});
  for(const g of concordance.groups)for(const [metric,correlation] of [
   ["dominant-share-inclusion",g.dominantShareVsPoolInclusionCorrelation],
   ["dominant-transition-turnover",g.dominantTransitionVsPoolTurnoverCorrelation],
   ["inclusion-hit-rate",g.dominantInclusionVsHitRateCorrelation]
  ] as Array<[PositionalPoolScaleMetric,number|null]>)observations.push({regimeId:g.regimeId,position:g.position,method:g.method,poolSize:g.poolSize,blockSize,metric,correlation,blocks:g.blocks});
 }
 const key=(x:{regimeId:string;position:number;method:string;poolSize:number;metric:string})=>JSON.stringify([x.regimeId,x.position,x.method,x.poolSize,x.metric]);
 const groups:PositionalPoolScaleGroup[]=[...new Set(observations.map(key))].map(k=>{
  const rows=observations.filter(x=>key(x)===k).sort((a,b)=>a.blockSize-b.blockSize),valid=rows.filter(x=>x.correlation!==null);
  const positive=valid.filter(x=>x.correlation!>0).length,negative=valid.filter(x=>x.correlation!<0).length;
  const status:PositionalPoolScaleGroup["status"]=valid.length<2?"insufficient":valid.length!==blockSizes.length?"some-scales-only":positive===valid.length?"same-positive-direction-all-scales":negative===valid.length?"same-negative-direction-all-scales":"direction-mixed-across-scales";
  const [regimeId,position,method,poolSize,metric]=JSON.parse(k) as [string,number,PoolMethod,number,PositionalPoolScaleMetric];
  return{regimeId,position:Number(position),method:method as PoolMethod,poolSize:Number(poolSize),metric:metric as PositionalPoolScaleMetric,scales:rows.map(x=>({blockSize:x.blockSize,correlation:x.correlation,blocks:x.blocks})),validScales:valid.length,positiveScales:positive,negativeScales:negative,status};
 });
 return{method:"positional-pool-block-size-sensitivity-v1",blockSizes:[...blockSizes].sort((a,b)=>a-b),minimumHistory,minimumDrawSupport,observations,groups,limitations:[
  "Cada escala reconstruye bloques no solapados desde el primer concurso etiquetado; no se reutilizan bloques agregados de otra escala.",
  "Las escalas predeterminadas 10, 15, 25 y 40 se fijan antes de observar resultados; ninguna escala se elige como ganadora.",
  "Las escalas comparten los mismos sorteos y no son réplicas independientes; concordancia de signo no es evidencia inferencial.",
  "Las correlaciones son descriptivas, sensibles al soporte y no incluyen p-valores ni corrección por comparaciones múltiples.",
  "Los dominantes de bloque son retrospectivos; la inclusión y el acierto de pool se calculan usando únicamente historia anterior al concurso objetivo.",
  "No demuestra predictibilidad, causalidad ni sesgo físico; no modifica pronósticos, candidatos, pesos, portafolios o ledger."
 ]};
}
