/**
 * Phase 29: descriptive concordance between positional dominance and past-only pool dynamics.
 * Pools for target draw t are built exclusively from draws with drawId < t.
 */
import type {Draw,Digit,Pos,PoolMethod} from "../research-core";
import {buildPool} from "../research-core";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";
import type {PositionalRegimeStabilityReport} from "./positional-regime-stability";

export interface PositionalPoolBlockRow {
 regimeId:string;position:Pos;method:PoolMethod;poolSize:number;
 blockIndex:number;startDrawId:number;endDrawId:number;partial:boolean;
 positionalDominantDigit:Digit|null;positionalDominantShare:number|null;
 tested:number;poolHits:number;poolHitRate:number|null;uniformReference:number;
 dominantDigitPoolInclusionRate:number|null;meanPoolJaccard:number|null;poolTurnover:number|null;
 dominantChangedFromPreviousBlock:boolean|null;
}
export interface PositionalPoolConcordanceGroup {
 regimeId:string;position:Pos;method:PoolMethod;poolSize:number;blocks:number;
 dominantShareVsPoolInclusionCorrelation:number|null;
 dominantTransitionVsPoolTurnoverCorrelation:number|null;
 dominantInclusionVsHitRateCorrelation:number|null;
 interpretation:"concordant-descriptive"|"mixed-descriptive"|"distinct-descriptive"|"insufficient";
}
export interface PositionalPoolConcordanceReport {
 method:string;minimumHistory:number;poolMethods:PoolMethod[];poolSizes:number[];
 blocks:PositionalPoolBlockRow[];groups:PositionalPoolConcordanceGroup[];
 limitations:string[];
}
const METHODS:PoolMethod[]=["frequency","long-absence","short-absence","balanced","recent-frequency"];
const pearson=(pairs:Array<[number,number]>):number|null=>{
 if(pairs.length<3)return null;
 const mx=pairs.reduce((s,p)=>s+p[0],0)/pairs.length,my=pairs.reduce((s,p)=>s+p[1],0)/pairs.length;
 const xx=pairs.reduce((s,p)=>s+(p[0]-mx)**2,0),yy=pairs.reduce((s,p)=>s+(p[1]-my)**2,0);
 if(xx===0||yy===0)return null;
 return pairs.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0)/Math.sqrt(xx*yy);
};
export function analyzePositionalPoolConcordance(
 draws:Draw[],labels:ProspectiveRegimeLabel[],stability:PositionalRegimeStabilityReport,
 options:{methods?:PoolMethod[];poolSizes?:number[];minimumHistory?:number}={}
):PositionalPoolConcordanceReport {
 const methods=options.methods??METHODS,sizes=options.poolSizes??[3,5,7],minimumHistory=options.minimumHistory??30;
 if(!Number.isInteger(minimumHistory)||minimumHistory<1)throw new Error("minimumHistory must be a positive integer");
 if(!methods.length||methods.some(m=>!METHODS.includes(m))||new Set(methods).size!==methods.length)throw new Error("methods must be unique valid pool methods");
 if(!sizes.length||sizes.some(k=>!Number.isInteger(k)||k<1||k>10)||new Set(sizes).size!==sizes.length)throw new Error("poolSizes must be unique integers from 1 to 10");
 for(let i=1;i<draws.length;i++)if(draws[i].drawId<=draws[i-1].drawId)throw new Error("draws must be strictly chronological");
 const drawIndex=new Map(draws.map((d,i)=>[d.drawId,i])),labelByDraw=new Map<number,ProspectiveRegimeLabel>();
 for(const label of labels){
  if(labelByDraw.has(label.drawId))throw new Error("duplicate regime label");
  if(label.sourceEndDrawId>=label.drawId)throw new Error("regime label must be strictly past-only");
  labelByDraw.set(label.drawId,label);
 }
 const blocks:PositionalPoolBlockRow[]=[];
 for(const profile of stability.regimes){
  const position=(profile.position-1) as Pos;
  for(const block of profile.blocks){
   if(block.status!=="supported"||block.dominantDigit===null)continue;
   const targetRows=draws.filter(d=>d.drawId>=block.startDrawId&&d.drawId<=block.endDrawId&&labelByDraw.get(d.drawId)?.regimeId===profile.regimeId);
   for(const method of methods)for(const poolSize of sizes){
    let tested=0,hits=0,dominantIncluded=0,jaccardTotal=0,jaccardN=0,previousPool:Set<Digit>|null=null;
    for(const target of targetRows){
     const index=drawIndex.get(target.drawId)!;
     if(index<minimumHistory)continue;
     const prior=draws.slice(0,index).map(d=>d.digits[position]);
     const pool=buildPool(prior,method,poolSize);
     tested++;
     if(pool.includes(target.digits[position]))hits++;
     if(pool.includes(block.dominantDigit))dominantIncluded++;
     const current=new Set(pool);
     if(previousPool){const union=new Set([...previousPool,...current]),intersection=[...previousPool].filter(d=>current.has(d)).length;jaccardTotal+=union.size?intersection/union.size:1;jaccardN++;}
     previousPool=current;
    }
    const previousSupported=[...profile.blocks].filter(b=>b.status==="supported"&&b.blockIndex<block.blockIndex).at(-1);
    blocks.push({regimeId:profile.regimeId,position,method,poolSize,blockIndex:block.blockIndex,startDrawId:block.startDrawId,endDrawId:block.endDrawId,partial:block.partial,
     positionalDominantDigit:block.dominantDigit,positionalDominantShare:block.dominantShare,tested,poolHits:hits,poolHitRate:tested?hits/tested:null,
     uniformReference:poolSize/10,dominantDigitPoolInclusionRate:tested?dominantIncluded/tested:null,
     meanPoolJaccard:jaccardN?jaccardTotal/jaccardN:null,poolTurnover:jaccardN?1-jaccardTotal/jaccardN:null,
     dominantChangedFromPreviousBlock:previousSupported?.dominantDigit===undefined?null:previousSupported.dominantDigit!==block.dominantDigit});
   }
  }
 }
 const groups:PositionalPoolConcordanceGroup[]=[];
 const keys=[...new Set(blocks.map(b=>[b.regimeId,b.position,b.method,b.poolSize].join("|")))];
 for(const key of keys){
  const rows=blocks.filter(b=>[b.regimeId,b.position,b.method,b.poolSize].join("|")===key);
  const inclusion=pearson(rows.filter(b=>b.positionalDominantShare!==null&&b.dominantDigitPoolInclusionRate!==null).map(b=>[b.positionalDominantShare!,b.dominantDigitPoolInclusionRate!] as [number,number]));
  const transition=pearson(rows.filter(b=>b.dominantChangedFromPreviousBlock!==null&&b.poolTurnover!==null).map(b=>[b.dominantChangedFromPreviousBlock?1:0,b.poolTurnover!] as [number,number]));
  const hit=pearson(rows.filter(b=>b.dominantDigitPoolInclusionRate!==null&&b.poolHitRate!==null).map(b=>[b.dominantDigitPoolInclusionRate!,b.poolHitRate!] as [number,number]));
  const values=[inclusion,transition,hit].filter((x):x is number=>x!==null);
  const interpretation:PositionalPoolConcordanceGroup["interpretation"]=rows.length<3||values.length===0?"insufficient":
   values.every(x=>x>=.3)?"concordant-descriptive":values.every(x=>x<=-.3)?"distinct-descriptive":"mixed-descriptive";
  const [regimeId,pos,method,size]=key.split("|");
  groups.push({regimeId,position:Number(pos) as Pos,method:method as PoolMethod,poolSize:Number(size),blocks:rows.length,
   dominantShareVsPoolInclusionCorrelation:inclusion,dominantTransitionVsPoolTurnoverCorrelation:transition,
   dominantInclusionVsHitRateCorrelation:hit,interpretation});
 }
 return{method:"past-only-positional-pool-concordance-v1",minimumHistory,poolMethods:methods,poolSizes:sizes,blocks,groups,
 limitations:[
  "Cada pool del concurso objetivo se construye solo con concursos anteriores; el resultado del objetivo nunca participa en su propio pool.",
  "El dígito dominante y su frecuencia se calculan retrospectivamente dentro del bloque para comparar descripciones; no son variables disponibles al inicio del bloque ni señales de pronóstico.",
  "La inclusión del dominante mide si el pool pasado contiene el dominante observado del bloque; no equivale a anticipar ese dominante.",
  "La tasa de acierto se compara con k/10 como referencia uniforme; la uniformidad puede no describir la distribución marginal real.",
  "Las correlaciones entre bloques requieren al menos tres observaciones, son descriptivas, sensibles al soporte y no incluyen p-valores ni corrección por comparaciones múltiples.",
  "Los bloques consecutivos y los sorteos pueden depender; los métodos y tamaños múltiples aumentan el riesgo de hallazgos por exploración.",
  "No demuestra predictibilidad, causalidad ni sesgo físico; no modifica pronósticos, candidatos, pesos, portafolio o ledger."
 ]};
}
