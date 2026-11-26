/**
 * Overlapping rolling-window view of prospective family concordance.
 * Windows are descriptive and dependent by construction; no inferential claims.
 */
import type {ProspectiveFamilyConcordance} from "./prospective-family-concordance";

export interface RollingConcordanceWindow {
  windowIndex:number; startDrawId:number; endDrawId:number; familyA:string; familyB:string;
  commonDraws:number; correlation:number|null; sameDirectionDraws:number;
  oppositeDirectionDraws:number; neutralPairDraws:number; directionAgreement:number|null;
  status:"positive"|"negative"|"mixed"|"underpowered";
}
export interface RollingConcordancePairSummary {
  familyA:string; familyB:string; windows:RollingConcordanceWindow[];
  supportedWindows:number; underpoweredWindows:number; positiveWindows:number;
  negativeWindows:number; mixedWindows:number; meanCorrelation:number|null;
  meanDirectionAgreement:number|null;
}
export interface ProspectiveFamilyConcordanceRolling {
  portfolioId:string; firstTargetDrawId:number; lastObservedDrawId:number;
  windowSize:number; stepSize:number; minimumDrawSupport:number;
  pairs:RollingConcordancePairSummary[]; limitations:string[];
}
function pearson(a:number[],b:number[]):number|null {
  if(a.length<3)return null;
  const ma=a.reduce((s,x)=>s+x,0)/a.length,mb=b.reduce((s,x)=>s+x,0)/b.length;
  let xy=0,xx=0,yy=0;
  for(let i=0;i<a.length;i++){const x=a[i]-ma,y=b[i]-mb;xy+=x*y;xx+=x*x;yy+=y*y;}
  return xx>0&&yy>0?xy/Math.sqrt(xx*yy):null;
}
export function summarizeProspectiveFamilyConcordanceRolling(
  observed:ProspectiveFamilyConcordance,
  options:{windowSize?:number;stepSize?:number;minimumDrawSupport?:number}={}
):ProspectiveFamilyConcordanceRolling {
  const windowSize=options.windowSize??25,stepSize=options.stepSize??5,minimumDrawSupport=options.minimumDrawSupport??10;
  if(!Number.isInteger(windowSize)||windowSize<3)throw new Error("windowSize must be an integer >= 3");
  if(!Number.isInteger(stepSize)||stepSize<1||stepSize>windowSize)throw new Error("stepSize must be between 1 and windowSize");
  if(!Number.isInteger(minimumDrawSupport)||minimumDrawSupport<3||minimumDrawSupport>windowSize)throw new Error("minimumDrawSupport must be between 3 and windowSize");
  const values=new Map<string,Map<number,number>>();
  for(const v of observed.drawValues){const m=values.get(v.family)??new Map<number,number>();if(m.has(v.drawId))throw new Error("duplicate family/draw value");m.set(v.drawId,v.meanDifference);values.set(v.family,m);}
  const pairs:RollingConcordancePairSummary[]=[];
  for(const pair of observed.pairs){
    const a=values.get(pair.familyA)??new Map<number,number>(),b=values.get(pair.familyB)??new Map<number,number>();
    const windows:RollingConcordanceWindow[]=[];
    const lastStart=observed.lastObservedDrawId-windowSize+1;
    let index=0;
    for(let start=observed.firstTargetDrawId;start<=lastStart;start+=stepSize){
      index++;const end=start+windowSize-1,ids:number[]=[];
      for(let d=start;d<=end;d++)if(a.has(d)&&b.has(d))ids.push(d);
      const av=ids.map(d=>a.get(d)!),bv=ids.map(d=>b.get(d)!);
      let same=0,opposite=0,neutral=0;
      for(let i=0;i<ids.length;i++){if(av[i]===0||bv[i]===0)neutral++;else if(Math.sign(av[i])===Math.sign(bv[i]))same++;else opposite++;}
      const directional=same+opposite,supported=ids.length>=minimumDrawSupport;
      windows.push({windowIndex:index,startDrawId:start,endDrawId:end,familyA:pair.familyA,familyB:pair.familyB,commonDraws:ids.length,correlation:pearson(av,bv),sameDirectionDraws:same,oppositeDirectionDraws:opposite,neutralPairDraws:neutral,directionAgreement:directional?same/directional:null,status:!supported?"underpowered":same>opposite?"positive":opposite>same?"negative":"mixed"});
    }
    const supported=windows.filter(w=>w.status!=="underpowered");
    const mean=(xs:number[])=>xs.length?xs.reduce((s,x)=>s+x,0)/xs.length:null;
    pairs.push({familyA:pair.familyA,familyB:pair.familyB,windows,supportedWindows:supported.length,underpoweredWindows:windows.length-supported.length,positiveWindows:supported.filter(w=>w.status==="positive").length,negativeWindows:supported.filter(w=>w.status==="negative").length,mixedWindows:supported.filter(w=>w.status==="mixed").length,meanCorrelation:mean(supported.map(w=>w.correlation).filter((x):x is number=>x!==null)),meanDirectionAgreement:mean(supported.map(w=>w.directionAgreement).filter((x):x is number=>x!==null))});
  }
  return{portfolioId:observed.portfolioId,firstTargetDrawId:observed.firstTargetDrawId,lastObservedDrawId:observed.lastObservedDrawId,windowSize,stepSize,minimumDrawSupport,pairs,limitations:[
    "Las ventanas son completas, consecutivas y solapadas; no se generan ventanas parciales al final.",
    "El solapamiento hace que ventanas adyacentes sean dependientes; sus conteos no son ensayos independientes.",
    "Solo se comparan concursos presentes en ambas familias; no se imputan observaciones ausentes.",
    "Los estados positivo/negativo/mixed describen mayoría direccional, no significancia ni capacidad predictiva.",
    "No se calculan p-valores ni se modifican candidatos, pesos, pronósticos o estados del ledger."
  ]};
}
