/**
 * Chronological stability of prospective family concordance.
 * Fixed calendar-contest blocks; missing family observations are never imputed.
 * Descriptive only: no p-values, promotion, or portfolio mutation.
 */
import type {ProspectiveFamilyConcordance,FamilyDrawValue,FamilyPairConcordance} from "./prospective-family-concordance";

export interface FamilyConcordanceStabilityBlock {
  blockIndex:number; startDrawId:number; endDrawId:number; partial:boolean;
  familyA:string; familyB:string; commonDraws:number; correlation:number|null;
  sameDirectionDraws:number; oppositeDirectionDraws:number; neutralPairDraws:number;
  directionAgreement:number|null; status:"positive"|"negative"|"mixed"|"underpowered";
}
export interface FamilyConcordanceStabilityPairSummary {
  familyA:string; familyB:string; blocks:FamilyConcordanceStabilityBlock[];
  supportedBlocks:number; underpoweredBlocks:number; positiveBlocks:number; negativeBlocks:number;
  mixedBlocks:number; meanCorrelation:number|null; correlationRange:number|null;
  correlationStdDev:number|null; meanDirectionAgreement:number|null;
  longestPositiveRun:number; longestNegativeRun:number;
}
export interface ProspectiveFamilyConcordanceStability {
  portfolioId:string; firstTargetDrawId:number; lastObservedDrawId:number;
  blockSize:number; minimumDrawSupport:number; pairs:FamilyConcordanceStabilityPairSummary[];
  limitations:string[];
}
function pearson(a:number[],b:number[]):number|null {
 if(a.length<3)return null;
 const ma=a.reduce((s,x)=>s+x,0)/a.length,mb=b.reduce((s,x)=>s+x,0)/b.length;
 let xy=0,xx=0,yy=0;
 for(let i=0;i<a.length;i++){const x=a[i]-ma,y=b[i]-mb;xy+=x*y;xx+=x*x;yy+=y*y;}
 return xx>0&&yy>0?xy/Math.sqrt(xx*yy):null;
}
function longest(values:FamilyConcordanceStabilityBlock[],status:"positive"|"negative"):number {
 let best=0,current=0;
 for(const b of values){if(b.status===status){current++;best=Math.max(best,current);}else current=0;}
 return best;
}
export function summarizeProspectiveFamilyConcordanceStability(
 observed:ProspectiveFamilyConcordance,
 options:{blockSize?:number;minimumDrawSupport?:number}={}
):ProspectiveFamilyConcordanceStability {
 const blockSize=options.blockSize??25,minimumDrawSupport=options.minimumDrawSupport??10;
 if(!Number.isInteger(blockSize)||blockSize<2)throw new Error("blockSize must be an integer >= 2");
 if(!Number.isInteger(minimumDrawSupport)||minimumDrawSupport<3||minimumDrawSupport>blockSize)throw new Error("minimumDrawSupport must be between 3 and blockSize");
 const values=new Map<string,Map<number,number>>();
 for(const v of observed.drawValues){const key=v.family;const m=values.get(key)??new Map<number,number>();if(m.has(v.drawId))throw new Error("duplicate family/draw value");m.set(v.drawId,v.meanDifference);values.set(key,m);}
 const pairs:FamilyConcordanceStabilityPairSummary[]=[];
 for(const pair of observed.pairs){
  const a=values.get(pair.familyA)??new Map<number,number>(),b=values.get(pair.familyB)??new Map<number,number>();
  const blocks:FamilyConcordanceStabilityBlock[]=[];
  const total=observed.lastObservedDrawId-observed.firstTargetDrawId+1;
  const count=Math.ceil(total/blockSize);
  for(let i=0;i<count;i++){
   const start=observed.firstTargetDrawId+i*blockSize,end=Math.min(observed.lastObservedDrawId,start+blockSize-1);
   const ids:number[]=[];for(let d=start;d<=end;d++)if(a.has(d)&&b.has(d))ids.push(d);
   const av=ids.map(d=>a.get(d)!),bv=ids.map(d=>b.get(d)!);
   let same=0,opposite=0,neutral=0;
   for(let k=0;k<ids.length;k++){if(av[k]===0||bv[k]===0)neutral++;else if(Math.sign(av[k])===Math.sign(bv[k]))same++;else opposite++;}
   const directional=same+opposite,correlation=pearson(av,bv);
   const supported=ids.length>=minimumDrawSupport;
   const status:FamilyConcordanceStabilityBlock["status"]=!supported?"underpowered":same>opposite?"positive":opposite>same?"negative":"mixed";
   blocks.push({blockIndex:i+1,startDrawId:start,endDrawId:end,partial:end-start+1<blockSize,familyA:pair.familyA,familyB:pair.familyB,commonDraws:ids.length,correlation,sameDirectionDraws:same,oppositeDirectionDraws:opposite,neutralPairDraws:neutral,directionAgreement:directional?same/directional:null,status});
  }
  const supported=blocks.filter(x=>x.status!=="underpowered"),corr=supported.map(x=>x.correlation).filter((x):x is number=>x!==null),agreements=supported.map(x=>x.directionAgreement).filter((x):x is number=>x!==null);
  const mean=(xs:number[])=>xs.length?xs.reduce((s,x)=>s+x,0)/xs.length:null;
  const mc=mean(corr),variance=mc===null?null:corr.reduce((s,x)=>s+(x-mc)**2,0)/corr.length;
  pairs.push({familyA:pair.familyA,familyB:pair.familyB,blocks,supportedBlocks:supported.length,underpoweredBlocks:blocks.length-supported.length,positiveBlocks:supported.filter(x=>x.status==="positive").length,negativeBlocks:supported.filter(x=>x.status==="negative").length,mixedBlocks:supported.filter(x=>x.status==="mixed").length,meanCorrelation:mc,correlationRange:corr.length?Math.max(...corr)-Math.min(...corr):null,correlationStdDev:variance===null?null:Math.sqrt(variance),meanDirectionAgreement:mean(agreements),longestPositiveRun:longest(blocks,"positive"),longestNegativeRun:longest(blocks,"negative")});
 }
 return{portfolioId:observed.portfolioId,firstTargetDrawId:observed.firstTargetDrawId,lastObservedDrawId:observed.lastObservedDrawId,blockSize,minimumDrawSupport,pairs,limitations:[
  "Los bloques son consecutivos y se anclan al primer concurso prospectivo; el último puede ser parcial.",
  "Solo se comparan concursos observados en ambas familias; no se imputan sorteos ausentes.",
  "Los bloques con menos del soporte mínimo se etiquetan como insuficientes y no cuentan como positivos o negativos.",
  "La estabilidad es descriptiva; bloques consecutivos y pares de familias no son observaciones independientes.",
  "No se calculan p-valores ni se cambian candidatos, pesos, pronósticos o estados del ledger."
 ]};
}
