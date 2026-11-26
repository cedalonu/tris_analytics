import type {PositionalPoolBlockRow} from "./positional-pool-concordance";
export type PositionalPoolSplitMetric="dominant-share-inclusion"|"dominant-transition-turnover"|"inclusion-hit-rate";
export type PositionalPoolSplitStatus="same-direction-both-periods"|"discovery-only"|"validation-only"|"opposite-directions"|"below-descriptive-threshold-both"|"insufficient-support";
export interface PositionalPoolSplitMetricResult{
 metric:PositionalPoolSplitMetric;status:PositionalPoolSplitStatus;
 discoveryBlocks:number;validationBlocks:number;
 discoveryStartBlock:number|null;discoveryEndBlock:number|null;
 validationStartBlock:number|null;validationEndBlock:number|null;
 discoveryCorrelation:number|null;validationCorrelation:number|null;
 correlationChange:number|null;minimumAbsoluteCorrelation:number;
}
export interface PositionalPoolSplitGroup{regimeId:string;position:number;method:string;poolSize:number;metrics:PositionalPoolSplitMetricResult[]}
export interface PositionalPoolTemporalSplitReport{
 method:"chronological-half-split-robustness-v1";splitRule:"first-half-discovery-second-half-validation";
 minimumPairsPerHalf:number;minimumAbsoluteCorrelation:number;
 groups:PositionalPoolSplitGroup[];evaluatedMetrics:number;insufficientMetrics:number;
 limitations:string[];
}
type Pair={blockIndex:number,x:number,y:number};
const METRICS:PositionalPoolSplitMetric[]=["dominant-share-inclusion","dominant-transition-turnover","inclusion-hit-rate"];
const groupKey=(r:PositionalPoolBlockRow)=>JSON.stringify([r.regimeId,r.position,r.method,r.poolSize]);
function correlation(pairs:Pair[]):number|null{
 if(pairs.length<3)return null;
 const mx=pairs.reduce((s,p)=>s+p.x,0)/pairs.length,my=pairs.reduce((s,p)=>s+p.y,0)/pairs.length;
 const xx=pairs.reduce((s,p)=>s+(p.x-mx)**2,0),yy=pairs.reduce((s,p)=>s+(p.y-my)**2,0);
 if(xx===0||yy===0)return null;
 return pairs.reduce((s,p)=>s+(p.x-mx)*(p.y-my),0)/Math.sqrt(xx*yy);
}
function getPairs(rows:PositionalPoolBlockRow[],metric:PositionalPoolSplitMetric):Pair[]{
 return rows.flatMap(r=>{
  let x:number|null=null,y:number|null=null;
  if(metric==="dominant-share-inclusion"&&r.positionalDominantShare!==null&&r.dominantDigitPoolInclusionRate!==null){x=r.positionalDominantShare;y=r.dominantDigitPoolInclusionRate;}
  if(metric==="dominant-transition-turnover"&&r.dominantChangedFromPreviousBlock!==null&&r.poolTurnover!==null){x=r.dominantChangedFromPreviousBlock?1:0;y=r.poolTurnover;}
  if(metric==="inclusion-hit-rate"&&r.dominantDigitPoolInclusionRate!==null&&r.poolHitRate!==null){x=r.dominantDigitPoolInclusionRate;y=r.poolHitRate;}
  return x===null||y===null?[]:[{blockIndex:r.blockIndex,x,y}];
 }).sort((a,b)=>a.blockIndex-b.blockIndex);
}
export function analyzePositionalPoolTemporalSplit(rows:PositionalPoolBlockRow[],options:{minimumPairsPerHalf?:number;minimumAbsoluteCorrelation?:number}={}):PositionalPoolTemporalSplitReport{
 const minimumPairsPerHalf=options.minimumPairsPerHalf??3,minimumAbsoluteCorrelation=options.minimumAbsoluteCorrelation??.3;
 if(!Number.isInteger(minimumPairsPerHalf)||minimumPairsPerHalf<3||!Number.isFinite(minimumAbsoluteCorrelation)||minimumAbsoluteCorrelation<0||minimumAbsoluteCorrelation>1)throw new Error("invalid temporal split options");
 const groups:PositionalPoolSplitGroup[]=[];let evaluatedMetrics=0,insufficientMetrics=0;
 const map=new Map<string,PositionalPoolBlockRow[]>();for(const row of rows){const k=groupKey(row);const list=map.get(k)??[];list.push(row);map.set(k,list);}
 for(const [k,groupRows] of [...map.entries()].sort(([a],[b])=>a.localeCompare(b))){
  const [regimeId,position,method,poolSize]=JSON.parse(k) as [string,number,string,number];
  const results=METRICS.map(metric=>{
   const pairs=getPairs(groupRows,metric),split=Math.floor(pairs.length/2),discovery=pairs.slice(0,split),validation=pairs.slice(split);
   const enough=discovery.length>=minimumPairsPerHalf&&validation.length>=minimumPairsPerHalf;
   const d=enough?correlation(discovery):null,v=enough?correlation(validation):null;
   let status:PositionalPoolSplitStatus="insufficient-support";
   if(d!==null&&v!==null){
    const da=Math.abs(d)>=minimumAbsoluteCorrelation,va=Math.abs(v)>=minimumAbsoluteCorrelation;
    if(da&&va)status=Math.sign(d)===Math.sign(v)?"same-direction-both-periods":"opposite-directions";
    else if(da)status="discovery-only";
    else if(va)status="validation-only";
    else status="below-descriptive-threshold-both";
    evaluatedMetrics++;
   }else insufficientMetrics++;
   return {metric,status,discoveryBlocks:discovery.length,validationBlocks:validation.length,
    discoveryStartBlock:discovery[0]?.blockIndex??null,discoveryEndBlock:discovery.at(-1)?.blockIndex??null,
    validationStartBlock:validation[0]?.blockIndex??null,validationEndBlock:validation.at(-1)?.blockIndex??null,
    discoveryCorrelation:d,validationCorrelation:v,correlationChange:d===null||v===null?null:v-d,minimumAbsoluteCorrelation};
  });
  groups.push({regimeId,position,method,poolSize,metrics:results});
 }
 return {method:"chronological-half-split-robustness-v1",splitRule:"first-half-discovery-second-half-validation",minimumPairsPerHalf,minimumAbsoluteCorrelation,groups,evaluatedMetrics,insufficientMetrics,limitations:[
  "Divide cronológicamente las observaciones completas: primera mitad para descubrimiento y segunda mitad para validación; no mezcla ni baraja bloques.",
  "La validación es una comprobación temporal descriptiva dentro del mismo historial, no una muestra externa independiente ni una validación prospectiva de pronósticos.",
  "Las variables de dominancia y frecuencia del bloque se calculan retrospectivamente; su correlación no constituye una señal disponible al inicio del bloque.",
  "El umbral absoluto es una etiqueta descriptiva fija, no una prueba estadística ni una optimización. Se muestran las correlaciones y soportes de ambas mitades.",
  "Las mitades pueden diferir en tamaño por observaciones incompletas; no se imputan valores ni se puentean pares faltantes.",
  "No corrige multiplicidad, no selecciona métodos ni modifica pronósticos, candidatos, pesos, portafolios o ledger.",
  "Opera offline sobre bloques derivados del CSV local; no usa APIs, polling, descargas ni datos externos."
 ]};
}
