/**
 * Null calibration for cross-family concordance.
 * Candidate and paired baseline have identical marginal hit probability.
 * Shared latent outcomes create configurable cross-family dependence.
 * Synthetic stress test only; not an estimate of real TRIS dependence.
 */
export interface FamilyConcordanceNullOptions {
  replications?: number; draws?: number; families?: number; candidatesPerFamily?: number;
  hitRate?: number; pairedDependence?: number; crossFamilyOverlap?: number; seed?: number;
}
export interface FamilyConcordanceNullResult {
  replications:number; draws:number; families:number; candidatesPerFamily:number;
  hitRate:number; pairedDependence:number; crossFamilyOverlap:number; seed:number;
  meanPairwiseCorrelation:number|null; correlationP05:number|null; correlationMedian:number|null; correlationP95:number|null;
  meanDirectionAgreement:number|null; allFamiliesPositiveRate:number; anyFamilyPositiveRate:number;
  meanPositiveFamilies:number; wilson95AllPositive:[number,number]; interpretation:string[];
}
function rng(seed:number){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;}}
function pearson(a:number[],b:number[]):number|null{
 if(a.length<3)return null;const ma=a.reduce((s,x)=>s+x,0)/a.length,mb=b.reduce((s,x)=>s+x,0)/b.length;
 let xy=0,xx=0,yy=0;for(let i=0;i<a.length;i++){const x=a[i]-ma,y=b[i]-mb;xy+=x*y;xx+=x*x;yy+=y*y;}
 return xx&&yy?xy/Math.sqrt(xx*yy):null;
}
function wilson(k:number,n:number):[number,number]{if(!n)return[0,1];const z=1.96,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return[Math.max(0,c-h),Math.min(1,c+h)];}
function quantile(xs:number[],q:number):number|null{if(!xs.length)return null;const s=[...xs].sort((a,b)=>a-b);return s[Math.min(s.length-1,Math.floor(q*(s.length-1)))];}
export function simulateFamilyConcordanceNull(options:FamilyConcordanceNullOptions={}):FamilyConcordanceNullResult{
 const replications=options.replications??1000,draws=options.draws??100,families=options.families??4,candidatesPerFamily=options.candidatesPerFamily??5,hitRate=options.hitRate??.2,pairedDependence=options.pairedDependence??.5,crossFamilyOverlap=options.crossFamilyOverlap??0,seed=options.seed??20261125;
 if(!Number.isInteger(replications)||replications<1||!Number.isInteger(draws)||draws<3||!Number.isInteger(families)||families<2||!Number.isInteger(candidatesPerFamily)||candidatesPerFamily<1||!Number.isFinite(hitRate)||hitRate<=0||hitRate>=1||!Number.isFinite(pairedDependence)||pairedDependence<0||pairedDependence>1||!Number.isFinite(crossFamilyOverlap)||crossFamilyOverlap<0||crossFamilyOverlap>1||!Number.isInteger(seed))throw new Error("invalid family concordance null options");
 const random=rng(seed),correlations:number[]=[],agreements:number[]=[];let allPositive=0,anyPositive=0,positiveTotal=0;
 for(let rep=0;rep<replications;rep++){
  const series=Array.from({length:families},()=>[] as number[]);
  for(let draw=0;draw<draws;draw++){
   const shared=random()<hitRate;
   for(let family=0;family<families;family++){
    let diff=0;
    for(let c=0;c<candidatesPerFamily;c++){
     const candidate=random()<crossFamilyOverlap?shared:random()<hitRate;
     const baseline=random()<pairedDependence?candidate:random()<hitRate;
     diff+=(Number(candidate)-Number(baseline));
    }
    series[family].push(diff/candidatesPerFamily);
   }
  }
  let positive=0;for(const s of series)if(s.reduce((a,b)=>a+b,0)/draws>0)positive++;
  positiveTotal+=positive;if(positive===families)allPositive++;if(positive>0)anyPositive++;
  const pairCorr:number[]=[],pairAgreement:number[]=[];
  for(let a=0;a<families;a++)for(let b=a+1;b<families;b++){
   const corr=pearson(series[a],series[b]);if(corr!==null)pairCorr.push(corr);
   let same=0,opposite=0;for(let i=0;i<draws;i++){const x=series[a][i],y=series[b][i];if(x!==0&&y!==0){if(Math.sign(x)===Math.sign(y))same++;else opposite++;}}
   if(same+opposite)pairAgreement.push(same/(same+opposite));
  }
  if(pairCorr.length)correlations.push(pairCorr.reduce((a,b)=>a+b,0)/pairCorr.length);
  if(pairAgreement.length)agreements.push(pairAgreement.reduce((a,b)=>a+b,0)/pairAgreement.length);
 }
 const mean=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
 const interval=wilson(allPositive,replications);
 return{replications,draws,families,candidatesPerFamily,hitRate,pairedDependence,crossFamilyOverlap,seed,meanPairwiseCorrelation:mean(correlations),correlationP05:quantile(correlations,.05),correlationMedian:quantile(correlations,.5),correlationP95:quantile(correlations,.95),meanDirectionAgreement:mean(agreements),allFamiliesPositiveRate:allPositive/replications,anyFamilyPositiveRate:anyPositive/replications,meanPositiveFamilies:positiveTotal/replications,wilson95AllPositive:interval,interpretation:[
  "En cada familia, candidato y baseline tienen la misma probabilidad marginal de acierto; el nulo no contiene ventaja predictiva.",
  "pairedDependence controla la probabilidad de que baseline copie el resultado candidato; crossFamilyOverlap controla el uso de un resultado latente común entre familias.",
  "Correlación y acuerdo pueden aparecer bajo el nulo por ruido compartido; no demuestran capacidad predictiva.",
  "allFamiliesPositiveRate es la fracción de réplicas donde todas las familias muestran diferencia media positiva por azar; anyFamilyPositiveRate indica al menos una.",
  "Los intervalos Wilson cuantifican solo error Monte Carlo de allFamiliesPositiveRate; no son intervalos sobre TRIS real.",
  "Simulación sintética de estrés, no calibración empírica del sorteo. No ajusta umbrales ni selecciona candidatos."
 ]};
}
