import type {PositionalPoolConcordanceReport,PositionalPoolBlockRow} from "./positional-pool-concordance";
import type {PositionalPoolNullMetric} from "./positional-pool-null-controls";

export interface PositionalPoolCircularShiftMetricResult {
 metric:PositionalPoolNullMetric;support:number;observedCorrelation:number|null;
 nullMean:number|null;nullSd:number|null;nullP025:number|null;nullMedian:number|null;nullP975:number|null;
 exceedances:number;replications:number;empiricalTwoSidedTailRate:number|null;status:"evaluated"|"insufficient-support"|"non-contiguous-blocks";
}
export interface PositionalPoolCircularShiftGroupResult {regimeId:string;position:number;method:string;poolSize:number;metrics:PositionalPoolCircularShiftMetricResult[]}
export interface PositionalPoolCircularShiftReport {
 method:string;seed:number;replications:number;minimumPairs:number;groups:PositionalPoolCircularShiftGroupResult[];
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
function percentile(a:number[],p:number){if(!a.length)return null;const s=[...a].sort((x,y)=>x-y),i=(s.length-1)*p,l=Math.floor(i),h=Math.ceil(i);return s[l]+(s[h]-s[l])*(i-l);}
function values(rows:PositionalPoolBlockRow[],metric:PositionalPoolNullMetric):{x:number[];y:number[];indices:number[]}{
 const valid=rows.filter(r=>metric==="dominant-share-inclusion"?r.positionalDominantShare!==null&&r.dominantDigitPoolInclusionRate!==null:metric==="dominant-transition-turnover"?r.dominantChangedFromPreviousBlock!==null&&r.poolTurnover!==null:r.dominantDigitPoolInclusionRate!==null&&r.poolHitRate!==null);
 const x:number[]=[],y:number[]=[];
 for(const r of valid){if(metric==="dominant-share-inclusion"){x.push(r.positionalDominantShare!);y.push(r.dominantDigitPoolInclusionRate!);}else if(metric==="dominant-transition-turnover"){x.push(r.dominantChangedFromPreviousBlock?1:0);y.push(r.poolTurnover!);}else{x.push(r.dominantDigitPoolInclusionRate!);y.push(r.poolHitRate!);}}
 return{x,y,indices:valid.map(r=>r.blockIndex)};
}
export function analyzePositionalPoolCircularShiftControls(report:PositionalPoolConcordanceReport,options:{replications?:number;minimumPairs?:number;seed?:number}={}):PositionalPoolCircularShiftReport{
 const replications=options.replications??999,minimumPairs=options.minimumPairs??5,seed=options.seed??20261203;
 if(!Number.isInteger(replications)||replications<1||!Number.isInteger(minimumPairs)||minimumPairs<3||!Number.isInteger(seed))throw new Error("invalid circular-shift options");
 const metrics:PositionalPoolNullMetric[]=["dominant-share-inclusion","dominant-transition-turnover","inclusion-hit-rate"];
 const groupKey=(r:PositionalPoolBlockRow)=>JSON.stringify([r.regimeId,r.position,r.method,r.poolSize]),keys=[...new Set(report.blocks.map(groupKey))],groups:PositionalPoolCircularShiftGroupResult[]=[];
 let groupIndex=0;
 for(const key of keys){
  const rows=report.blocks.filter(r=>groupKey(r)===key).sort((a,b)=>a.blockIndex-b.blockIndex);
  const [regimeId,pos,method,size]=JSON.parse(key) as [string,number,string,number],results:PositionalPoolCircularShiftMetricResult[]=[];
  for(const metric of metrics){
   const {x,y,indices}=values(rows,metric),contiguous=indices.every((v,i)=>i===0||v===indices[i-1]+1);
   const observed=contiguous&&x.length>=minimumPairs?corr(x,y):null,random=rng((seed+groupIndex*1000003+metrics.indexOf(metric)*7919)>>>0),nulls:number[]=[];
   if(observed!==null&&x.length>=3){
    for(let rep=0;rep<replications;rep++){
     const offset=1+Math.floor(random()*(y.length-1));
     const shifted=y.map((_,i)=>y[(i+offset)%y.length]);
     const v=corr(x,shifted);if(v!==null)nulls.push(v);
    }
   }
   const mean=nulls.length?nulls.reduce((a,b)=>a+b,0)/nulls.length:null;
   const exceed=observed===null?0:nulls.filter(v=>Math.abs(v)>=Math.abs(observed)).length;
   results.push({metric,support:x.length,observedCorrelation:observed,nullMean:mean,
    nullSd:nulls.length?Math.sqrt(nulls.reduce((a,v)=>a+(v-mean!)**2,0)/nulls.length):null,
    nullP025:percentile(nulls,.025),nullMedian:percentile(nulls,.5),nullP975:percentile(nulls,.975),
    exceedances:exceed,replications:nulls.length,empiricalTwoSidedTailRate:observed===null||!nulls.length?null:(exceed+1)/(nulls.length+1),
    status:!contiguous?"non-contiguous-blocks":observed===null?"insufficient-support":"evaluated"});
  }
  groups.push({regimeId,position:Number(pos),method,poolSize:Number(size),metrics:results});groupIndex++;
 }
 return{method:"within-series-circular-shift-null-control-v1",seed,replications,minimumPairs,groups,limitations:[
  "El segundo vector se desplaza circularmente por un offset distinto de cero dentro de cada serie; conserva exactamente sus valores y su orden cíclico, rompiendo la alineación original con el primer vector.",
  "Solo se evalúan grupos con pares completos y bloques consecutivos; no se rellenan ni se puentean huecos.",
  "El desplazamiento circular conserva la secuencia interna pero introduce una unión artificial entre el último y el primer bloque; con series cortas, la resolución de offsets es limitada.",
  "Este control supone que los desplazamientos temporales son comparables bajo una hipótesis de invariancia aproximada; cambios de régimen y tendencias pueden invalidar esa interpretación.",
  "La tasa de cola empírica con corrección +1 es un diagnóstico Monte Carlo, no un p-valor confirmatorio; no corrige multiplicidad.",
  "Debe leerse junto al control de permutación de fase 32: ambos responden preguntas distintas y ninguno por sí solo establece predictibilidad.",
  "No modifica pronósticos, candidatos, pesos, portafolios o ledger y no usa APIs ni datos externos."
 ]};
}
