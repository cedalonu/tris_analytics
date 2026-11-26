import type {PositionalPoolConcordanceReport,PositionalPoolBlockRow} from "./positional-pool-concordance";

export interface PositionalPoolTemporalWindow {
 regimeId:string;position:number;method:string;poolSize:number;
 windowIndex:number;firstBlockIndex:number;lastBlockIndex:number;blocks:number;
 dominantShareVsPoolInclusion:number|null;
 dominantTransitionVsTurnover:number|null;
 dominantInclusionVsHitRate:number|null;
}
export interface PositionalPoolTemporalStabilityGroup {
 regimeId:string;position:number;method:string;poolSize:number;
 windows:number;positiveWindows:number;negativeWindows:number;nearZeroWindows:number;
 signConsistency:number|null;meanAbsoluteCorrelation:number|null;
 classification:"temporally-consistent-positive"|"temporally-consistent-negative"|"unstable"|"insufficient";
}
export interface PositionalPoolTemporalStabilityReport {
 method:string;windowBlocks:number;stepBlocks:number;minimumPairs:number;
 windows:PositionalPoolTemporalWindow[];groups:PositionalPoolTemporalStabilityGroup[];
 limitations:string[];
}
const corr=(pairs:Array<[number,number]>,minimum:number):number|null=>{
 if(pairs.length<minimum)return null;
 const mx=pairs.reduce((s,p)=>s+p[0],0)/pairs.length,my=pairs.reduce((s,p)=>s+p[1],0)/pairs.length;
 const xx=pairs.reduce((s,p)=>s+(p[0]-mx)**2,0),yy=pairs.reduce((s,p)=>s+(p[1]-my)**2,0);
 if(xx===0||yy===0)return null;
 return pairs.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0)/Math.sqrt(xx*yy);
};
const pairsFor=(rows:PositionalPoolBlockRow[],kind:number):Array<[number,number]>=>{
 if(kind===0)return rows.filter(x=>x.positionalDominantShare!==null&&x.dominantDigitPoolInclusionRate!==null).map(x=>[x.positionalDominantShare!,x.dominantDigitPoolInclusionRate!]);
 if(kind===1)return rows.filter(x=>x.dominantChangedFromPreviousBlock!==null&&x.poolTurnover!==null).map(x=>[x.dominantChangedFromPreviousBlock?1:0,x.poolTurnover!]);
 return rows.filter(x=>x.dominantDigitPoolInclusionRate!==null&&x.poolHitRate!==null).map(x=>[x.dominantDigitPoolInclusionRate!,x.poolHitRate!]);
};
export function analyzePositionalPoolTemporalStability(report:PositionalPoolConcordanceReport,options:{windowBlocks?:number;stepBlocks?:number;minimumPairs?:number;nearZeroThreshold?:number;consistencyThreshold?:number}={}):PositionalPoolTemporalStabilityReport{
 const windowBlocks=options.windowBlocks??5,stepBlocks=options.stepBlocks??1,minimumPairs=options.minimumPairs??3,nearZero=options.nearZeroThreshold??.1,consistency=options.consistencyThreshold??.7;
 if(!Number.isInteger(windowBlocks)||windowBlocks<3||!Number.isInteger(stepBlocks)||stepBlocks<1||!Number.isInteger(minimumPairs)||minimumPairs<3)throw new Error("invalid temporal window configuration");
 if(nearZero<0||nearZero>=1||consistency<=.5||consistency>1)throw new Error("invalid stability thresholds");
 const keys=[...new Set(report.blocks.map(x=>[x.regimeId,x.position,x.method,x.poolSize].join("|")))],windows:PositionalPoolTemporalWindow[]=[];
 for(const key of keys){
  const rows=report.blocks.filter(x=>[x.regimeId,x.position,x.method,x.poolSize].join("|")===key).sort((a,b)=>a.blockIndex-b.blockIndex);
  for(let start=0;start+windowBlocks<=rows.length;start+=stepBlocks){
   const part=rows.slice(start,start+windowBlocks),indices=part.map(x=>x.blockIndex);
   if(indices.some((v,i)=>i>0&&v!==indices[i-1]+1))continue;
   const [regimeId,position,method,size]=key.split("|");
   windows.push({regimeId,position:Number(position),method,poolSize:Number(size),windowIndex:Math.floor(start/stepBlocks),
    firstBlockIndex:part[0].blockIndex,lastBlockIndex:part.at(-1)!.blockIndex,blocks:part.length,
    dominantShareVsPoolInclusion:corr(pairsFor(part,0),minimumPairs),
    dominantTransitionVsTurnover:corr(pairsFor(part,1),minimumPairs),
    dominantInclusionVsHitRate:corr(pairsFor(part,2),minimumPairs)});
  }
 }
 const groups:PositionalPoolTemporalStabilityGroup[]=[];
 for(const key of keys){
  const rows=windows.filter(x=>[x.regimeId,x.position,x.method,x.poolSize].join("|")===key);
  const values=rows.flatMap(x=>[x.dominantShareVsPoolInclusion,x.dominantTransitionVsTurnover,x.dominantInclusionVsHitRate].filter((v):v is number=>v!==null));
  const positive=values.filter(x=>x>nearZero).length,negative=values.filter(x=>x< -nearZero).length,zero=values.length-positive-negative;
  const signConsistency=values.length?Math.max(positive,negative)/values.length:null;
  const meanAbsoluteCorrelation=values.length?values.reduce((s,x)=>s+Math.abs(x),0)/values.length:null;
  const classification:PositionalPoolTemporalStabilityGroup["classification"]=values.length<3?"insufficient":
   signConsistency!>=consistency&&positive>negative?"temporally-consistent-positive":
   signConsistency!>=consistency&&negative>positive?"temporally-consistent-negative":"unstable";
  const [regimeId,position,method,size]=key.split("|");
  groups.push({regimeId,position:Number(position),method,poolSize:Number(size),windows:rows.length,positiveWindows:positive,negativeWindows:negative,nearZeroWindows:zero,signConsistency,meanAbsoluteCorrelation,classification});
 }
 return{method:"rolling-positional-pool-concordance-stability-v1",windowBlocks,stepBlocks,minimumPairs,windows,groups,
 limitations:[
  "Ventanas móviles solapadas no son observaciones independientes; la consistencia de signo es descriptiva, no inferencial.",
  "Las correlaciones se calculan solo cuando hay variación y al menos el mínimo de pares; valores no calculables se omiten, no se convierten en cero.",
  "La estabilidad de signo no implica magnitud útil, causalidad ni capacidad predictiva.",
  "El análisis hereda la naturaleza retrospectiva del dominante de bloque y las limitaciones de la referencia uniforme k/10.",
  "No hay p-valores ni corrección por comparaciones múltiples; no modifica pronósticos, pesos, candidatos, portafolios o ledger."
 ]};
}
