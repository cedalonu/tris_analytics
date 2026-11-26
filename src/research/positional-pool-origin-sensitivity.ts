/**
 * Phase 37: sensitivity of positional-pool concordance to block origin.
 * The block size stays fixed; only predeclared origin offsets change.
 */
import type {Draw,PoolMethod} from "../research-core";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";
import {summarizePositionalRegimeStability} from "./positional-regime-stability";
import {analyzePositionalPoolConcordance} from "./positional-pool-concordance";
export type PositionalPoolOriginMetric="dominant-share-inclusion"|"dominant-transition-turnover"|"inclusion-hit-rate";
export interface PositionalPoolOriginObservation{regimeId:string;position:number;method:PoolMethod;poolSize:number;blockSize:number;blockOffset:number;metric:PositionalPoolOriginMetric;correlation:number|null;blocks:number;}
export interface PositionalPoolOriginGroup{regimeId:string;position:number;method:PoolMethod;poolSize:number;metric:PositionalPoolOriginMetric;offsets:Array<{blockOffset:number;correlation:number|null;blocks:number}>;validOffsets:number;positiveOffsets:number;negativeOffsets:number;status:"same-positive-direction-all-offsets"|"same-negative-direction-all-offsets"|"direction-mixed-across-offsets"|"some-offsets-only"|"insufficient";}
export interface PositionalPoolOriginSensitivityReport{method:string;blockSize:number;blockOffsets:number[];minimumHistory:number;minimumDrawSupport:number;observations:PositionalPoolOriginObservation[];groups:PositionalPoolOriginGroup[];limitations:string[];}
export function analyzePositionalPoolOriginSensitivity(draws:Draw[],labels:ProspectiveRegimeLabel[],options:{blockSize?:number;blockOffsets?:number[];minimumHistory?:number;minimumDrawSupport?:number;methods?:PoolMethod[];poolSizes?:number[]}={}):PositionalPoolOriginSensitivityReport{
 const blockSize=options.blockSize??25,blockOffsets=options.blockOffsets??[0,6,12,18],minimumHistory=options.minimumHistory??30,minimumDrawSupport=options.minimumDrawSupport??10;
 if(!Number.isInteger(blockSize)||blockSize<2)throw new Error("blockSize must be an integer >= 2");
 if(!blockOffsets.length||blockOffsets.some(x=>!Number.isInteger(x)||x<0||x>=blockSize)||new Set(blockOffsets).size!==blockOffsets.length)throw new Error("blockOffsets must be unique integers from 0 to blockSize - 1");
 const observations:PositionalPoolOriginObservation[]=[];
 for(const blockOffset of blockOffsets){
  const stability=summarizePositionalRegimeStability(draws,labels,{blockSize,blockOffset,minimumDrawSupport});
  const concordance=analyzePositionalPoolConcordance(draws,labels,stability,{minimumHistory,methods:options.methods,poolSizes:options.poolSizes});
  for(const g of concordance.groups)for(const [metric,correlation] of [
   ["dominant-share-inclusion",g.dominantShareVsPoolInclusionCorrelation],
   ["dominant-transition-turnover",g.dominantTransitionVsPoolTurnoverCorrelation],
   ["inclusion-hit-rate",g.dominantInclusionVsHitRateCorrelation]
  ] as Array<[PositionalPoolOriginMetric,number|null]>)observations.push({regimeId:g.regimeId,position:g.position,method:g.method,poolSize:g.poolSize,blockSize,blockOffset,metric,correlation,blocks:g.blocks});
 }
 const key=(x:{regimeId:string;position:number;method:string;poolSize:number;metric:string})=>JSON.stringify([x.regimeId,x.position,x.method,x.poolSize,x.metric]);
 const groups:PositionalPoolOriginGroup[]=[...new Set(observations.map(key))].map(k=>{
  const rows=observations.filter(x=>key(x)===k).sort((a,b)=>a.blockOffset-b.blockOffset),valid=rows.filter(x=>x.correlation!==null);
  const positive=valid.filter(x=>x.correlation!>0).length,negative=valid.filter(x=>x.correlation!<0).length;
  const status:PositionalPoolOriginGroup["status"]=valid.length<2?"insufficient":valid.length!==blockOffsets.length?"some-offsets-only":positive===valid.length?"same-positive-direction-all-offsets":negative===valid.length?"same-negative-direction-all-offsets":"direction-mixed-across-offsets";
  const [regimeId,position,method,poolSize,metric]=JSON.parse(k) as [string,number,PoolMethod,number,PositionalPoolOriginMetric];
  return{regimeId,position:Number(position),method:method as PoolMethod,poolSize:Number(poolSize),metric:metric as PositionalPoolOriginMetric,offsets:rows.map(x=>({blockOffset:x.blockOffset,correlation:x.correlation,blocks:x.blocks})),validOffsets:valid.length,positiveOffsets:positive,negativeOffsets:negative,status};
 });
 return{method:"positional-pool-block-origin-sensitivity-v1",blockSize,blockOffsets:[...blockOffsets].sort((a,b)=>a-b),minimumHistory,minimumDrawSupport,observations,groups,limitations:[
  "El tamaño de bloque permanece fijo; solo cambia el origen según offsets declarados antes de examinar resultados.",
  "Los bloques desplazados pueden comenzar o terminar parcialmente; se mantienen visibles y el soporte insuficiente no se fuerza.",
  "Todos los offsets usan los mismos concursos y se solapan sustancialmente; no son réplicas independientes.",
  "Las correlaciones son descriptivas, no tienen p-valores ni corrección por comparaciones múltiples.",
  "Los dominantes de bloque son retrospectivos; los pools para cada concurso se construyen solo con concursos anteriores.",
  "La estabilidad de signo entre offsets no demuestra predictibilidad, causalidad ni sesgo físico; no cambia forecasts, candidatos, pesos, portafolios o ledger."
 ]};
}
