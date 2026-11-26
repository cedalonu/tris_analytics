/**
 * Phase 29: descriptive concordance between positional dominance and past-only pool dynamics.
 * Pools for target draw t are built exclusively from draws with drawId < t.
 * Rankings are precomputed incrementally so long histories remain tractable.
 */
import type {Draw,Digit,Pos,PoolMethod} from "../research-core";
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
const DIGITS:Digit[]=[0,1,2,3,4,5,6,7,8,9];
const POOL_WINDOW=50;
const pearson=(pairs:Array<[number,number]>):number|null=>{
 if(pairs.length<3)return null;
 const mx=pairs.reduce((s,p)=>s+p[0],0)/pairs.length,my=pairs.reduce((s,p)=>s+p[1],0)/pairs.length;
 const xx=pairs.reduce((s,p)=>s+(p[0]-mx)**2,0),yy=pairs.reduce((s,p)=>s+(p[1]-my)**2,0);
 if(xx===0||yy===0)return null;
 return pairs.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0)/Math.sqrt(xx*yy);
};
function lowerBound(draws:Draw[],drawId:number):number{
 let lo=0,hi=draws.length;
 while(lo<hi){const mid=(lo+hi)>>>1;if(draws[mid].drawId<drawId)lo=mid+1;else hi=mid;}
 return lo;
}
/** Build the same rankings as buildPool(history, method, 10, 50), but update counts once per target. */
function precomputeRanks(draws:Draw[],position:Pos,methods:PoolMethod[]):Map<PoolMethod,Uint8Array>{
 const n=draws.length,global=Array(10).fill(0) as number[],recent=Array(10).fill(0) as number[],lastSeen=Array(10).fill(-1) as number[];
 const result=new Map<PoolMethod,Uint8Array>(methods.map(m=>[m,new Uint8Array(n*10)]));
 for(let i=0;i<n;i++){
  if(i>0){
   const added=draws[i-1].digits[position];global[added]++;recent[added]++;lastSeen[added]=i-1;
   if(i-1>=POOL_WINDOW){const removed=draws[i-1-POOL_WINDOW].digits[position];recent[removed]--;}
  }
  const recentLength=Math.min(i,POOL_WINDOW);
  for(const method of methods){
   const ranking=[...DIGITS].sort((a,b)=>{
    const absenceA=recent[a]>0?i-1-lastSeen[a]:recentLength;
    const absenceB=recent[b]>0?i-1-lastSeen[b]:recentLength;
    const rateA=recentLength?recent[a]/recentLength:0;
    const rateB=recentLength?recent[b]/recentLength:0;
    let scoreA=0,scoreB=0;
    switch(method){
     case "frequency":scoreA=global[a];scoreB=global[b];break;
     case "long-absence":scoreA=absenceA;scoreB=absenceB;break;
     case "short-absence":scoreA=-absenceA;scoreB=-absenceB;break;
     case "recent-frequency":scoreA=recent[a];scoreB=recent[b];break;
     case "balanced":scoreA=rateA+absenceA/Math.max(1,i);scoreB=rateB+absenceB/Math.max(1,i);break;
    }
    return scoreA===scoreB?a-b:scoreB-scoreA;
   });
   const ranks=result.get(method)!;
   ranking.forEach((digit,rank)=>{ranks[i*10+digit]=rank;});
  }
 }
 return result;
}
export function analyzePositionalPoolConcordance(
 draws:Draw[],labels:ProspectiveRegimeLabel[],stability:PositionalRegimeStabilityReport,
 options:{methods?:PoolMethod[];poolSizes?:number[];minimumHistory?:number}={}
):PositionalPoolConcordanceReport {
 const methods=options.methods??METHODS,sizes=options.poolSizes??[3,5,7],minimumHistory=options.minimumHistory??30;
 if(!Number.isInteger(minimumHistory)||minimumHistory<1)throw new Error("minimumHistory must be a positive integer");
 if(!methods.length||methods.some(m=>!METHODS.includes(m))||new Set(methods).size!==methods.length)throw new Error("methods must be unique valid pool methods");
 if(!sizes.length||sizes.some(k=>!Number.isInteger(k)||k<1||k>10)||new Set(sizes).size!==sizes.length)throw new Error("poolSizes must be unique integers from 1 to 10");
 for(let i=1;i<draws.length;i++)if(draws[i].drawId<=draws[i-1].drawId)throw new Error("draws must be strictly chronological");
 const labelByDraw=new Map<number,ProspectiveRegimeLabel>();
 for(const label of labels){
  if(labelByDraw.has(label.drawId))throw new Error("duplicate regime label");
  if(label.sourceEndDrawId>=label.drawId)throw new Error("regime label must be strictly past-only");
  labelByDraw.set(label.drawId,label);
 }
 const ranksByPosition=new Map<Pos,Map<PoolMethod,Uint8Array>>();
 for(let p=0;p<5;p++)ranksByPosition.set(p as Pos,precomputeRanks(draws,p as Pos,methods));
 const blocks:PositionalPoolBlockRow[]=[];
 for(const profile of stability.regimes){
  const position=(profile.position-1) as Pos,positionRanks=ranksByPosition.get(position)!;
  const previousByBlock=new Map(profile.blocks.map(b=>[b.blockIndex,b]));
  for(const block of profile.blocks){
   if(block.status!=="supported"||block.dominantDigit===null)continue;
   const dominantDigit=block.dominantDigit as Digit;
   const first=lowerBound(draws,block.startDrawId),last=lowerBound(draws,block.endDrawId+1);
   const targetIndices:number[]=[];
   for(let i=first;i<last;i++)if(labelByDraw.get(draws[i].drawId)?.regimeId===profile.regimeId)targetIndices.push(i);
   for(const method of methods){
    const ranks=positionRanks.get(method)!;
    for(const poolSize of sizes){
     let tested=0,hits=0,dominantIncluded=0,jaccardTotal=0,jaccardN=0,previousIndex=-1;
     for(const index of targetIndices){
      if(index<minimumHistory)continue;
      const offset=index*10;
      tested++;
      if(ranks[offset+draws[index].digits[position]]<poolSize)hits++;
      if(ranks[offset+dominantDigit]<poolSize)dominantIncluded++;
      if(previousIndex>=0){
       const previousOffset=previousIndex*10;let intersection=0;
       for(const digit of DIGITS)if(ranks[previousOffset+digit]<poolSize&&ranks[offset+digit]<poolSize)intersection++;
       const union=2*poolSize-intersection;
       jaccardTotal+=union?intersection/union:1;jaccardN++;
      }
      previousIndex=index;
     }
     const previousSupported=previousByBlock.get(block.blockIndex-1);
     blocks.push({regimeId:profile.regimeId,position,method,poolSize,blockIndex:block.blockIndex,startDrawId:block.startDrawId,endDrawId:block.endDrawId,partial:block.partial,
      positionalDominantDigit:dominantDigit,positionalDominantShare:block.dominantShare,tested,poolHits:hits,poolHitRate:tested?hits/tested:null,
      uniformReference:poolSize/10,dominantDigitPoolInclusionRate:tested?dominantIncluded/tested:null,
      meanPoolJaccard:jaccardN?jaccardTotal/jaccardN:null,poolTurnover:jaccardN?1-jaccardTotal/jaccardN:null,
      dominantChangedFromPreviousBlock:previousSupported?.status==="supported"&&previousSupported.dominantDigit!==null?previousSupported.dominantDigit!==block.dominantDigit:null});
    }
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
