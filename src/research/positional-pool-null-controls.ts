import type {PositionalPoolConcordanceReport,PositionalPoolBlockRow} from "./positional-pool-concordance";

export type PositionalPoolNullMetric="dominant-share-inclusion"|"dominant-transition-turnover"|"inclusion-hit-rate";
export interface PositionalPoolNullMetricResult {
 metric:PositionalPoolNullMetric;support:number;observedCorrelation:number|null;
 nullMean:number|null;nullSd:number|null;nullP025:number|null;nullMedian:number|null;nullP975:number|null;
 exceedances:number;replications:number;empiricalTwoSidedTailRate:number|null;
}
export interface PositionalPoolNullGroupResult {regimeId:string;position:number;method:string;poolSize:number;metrics:PositionalPoolNullMetricResult[]}
export interface PositionalPoolNullControlReport {
 method:string;seed:number;replications:number;minimumPairs:number;groups:PositionalPoolNullGroupResult[];
 limitations:string[];
}
function rng(seed:number){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function corr(x:number[],y:number[]):number|null{
 if(x.length<3||x.length!==y.length)return null;
 const mx=x.reduce((a,b)=>a+b,0)/x.length,my=y.reduce((a,b)=>a+b,0)/y.length;
 const xx=x.reduce((a,v)=>a+(v-mx)**2,0),yy=y.reduce((a,v)=>a+(v-my)**2,0);
 if(xx===0||yy===0)return null;
 return x.reduce((a,v,i)=>a+(v-mx)*(y[i]-my),0)/Math.sqrt(xx*yy);
}
function percentile(values:number[],p:number){if(!values.length)return null;const s=[...values].sort((a,b)=>a-b),i=(s.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);return s[lo]+(s[hi]-s[lo])*(i-lo);}
function pairs(rows:PositionalPoolBlockRow[],metric:PositionalPoolNullMetric):[number[],number[]]{
 const valid=rows.filter(r=>metric==="dominant-share-inclusion"?r.positionalDominantShare!==null&&r.dominantDigitPoolInclusionRate!==null:metric==="dominant-transition-turnover"?r.dominantChangedFromPreviousBlock!==null&&r.poolTurnover!==null:r.dominantDigitPoolInclusionRate!==null&&r.poolHitRate!==null);
 if(metric==="dominant-share-inclusion")return [valid.map(r=>r.positionalDominantShare!),valid.map(r=>r.dominantDigitPoolInclusionRate!)];
 if(metric==="dominant-transition-turnover")return [valid.map(r=>r.dominantChangedFromPreviousBlock?1:0),valid.map(r=>r.poolTurnover!)];
 return [valid.map(r=>r.dominantDigitPoolInclusionRate!),valid.map(r=>r.poolHitRate!)];
}
function shuffle<T>(values:T[],random:()=>number):T[]{const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
export function analyzePositionalPoolNullControls(report:PositionalPoolConcordanceReport,options:{replications?:number;minimumPairs?:number;seed?:number}={}):PositionalPoolNullControlReport{
 const replications=options.replications??999,minimumPairs=options.minimumPairs??3,seed=options.seed??20261202;
 if(!Number.isInteger(replications)||replications<1||!Number.isInteger(minimumPairs)||minimumPairs<3||!Number.isInteger(seed))throw new Error("invalid positional pool null-control options");
 const metrics:PositionalPoolNullMetric[]=["dominant-share-inclusion","dominant-transition-turnover","inclusion-hit-rate"],keys=[...new Set(report.blocks.map(r=>[r.regimeId,r.position,r.method,r.poolSize].join("|")))],groups:PositionalPoolNullGroupResult[]=[];
 let groupIndex=0;
 for(const key of keys){
  const rows=report.blocks.filter(r=>[r.regimeId,r.position,r.method,r.poolSize].join("|")===key).sort((a,b)=>a.blockIndex-b.blockIndex);
  const [regimeId,pos,method,size]=key.split("|"),metricResults:PositionalPoolNullMetricResult[]=[];
  for(const metric of metrics){
   const [x,y]=pairs(rows,metric),observedCorrelation=x.length>=minimumPairs?corr(x,y):null;
   const nullValues:number[]=[],random=rng((seed+groupIndex*1000003+metrics.indexOf(metric)*7919)>>>0);
   if(observedCorrelation!==null)for(let i=0;i<replications;i++){const value=corr(x,shuffle(y,random));if(value!==null)nullValues.push(value);}
   const exceedances=observedCorrelation===null?0:nullValues.filter(v=>Math.abs(v)>=Math.abs(observedCorrelation)).length;
   const mean=nullValues.length?nullValues.reduce((a,b)=>a+b,0)/nullValues.length:null;
   const sd=nullValues.length?Math.sqrt(nullValues.reduce((a,b)=>a+(b-mean!)**2,0)/nullValues.length):null;
   metricResults.push({metric,support:x.length,observedCorrelation,nullMean:mean,nullSd:sd,nullP025:percentile(nullValues,.025),nullMedian:percentile(nullValues,.5),nullP975:percentile(nullValues,.975),exceedances,replications:nullValues.length,empiricalTwoSidedTailRate:observedCorrelation===null||!nullValues.length?null:(exceedances+1)/(nullValues.length+1)});
  }
  groups.push({regimeId,position:Number(pos),method,poolSize:Number(size),metrics:metricResults});groupIndex++;
 }
 return {method:"equal-support-permutation-null-control-v1",seed,replications,minimumPairs,groups,limitations:[
  "Cada control permuta la segunda variable dentro del mismo grupo y métrica; conserva exactamente el tamaño de muestra y su distribución marginal observada.",
  "La permutación rompe el emparejamiento temporal y puede romper autocorrelación; por ello es un control de asociación sin emparejar, no un modelo nulo temporal completo.",
  "La tasa de cola empírica con corrección +1 es un diagnóstico Monte Carlo, no una prueba confirmatoria ni un p-valor calibrado para la dependencia temporal.",
  "Los grupos, posiciones, métodos, tamaños y métricas múltiples generan multiplicidad; no se selecciona automáticamente el resultado más favorable.",
  "El análisis es retrospectivo y hereda la naturaleza descriptiva del dígito dominante de bloque.",
  "No prueba predictibilidad ni causalidad y no modifica pronósticos, candidatos, pesos, portafolios o ledger.",
  "No utiliza APIs, polling, descargas ni datos externos; opera sobre los bloques calculados desde el CSV local."
 ]};
}
