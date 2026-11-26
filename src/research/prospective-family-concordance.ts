/**
 * Prospective concordance between frozen candidate families.
 * Uses per-contest averages of paired candidate-minus-baseline outcomes so
 * a family with more candidate rows does not dominate by raw row count.
 * Descriptive only: shared contests and signals remain dependent.
 */
import type {IntuitionCandidate,CandidateFamily} from "./intuition-candidate-generator";
import type {FrozenForecast,ResolvedForecast} from "./intuition-prospective";
import type {ProspectivePortfolioManifest} from "./prospective-portfolio-monitor";

export interface FamilyDrawValue {
  drawId:number; family:CandidateFamily; candidateCount:number; resolvedCount:number;
  hitRate:number; baselineRate:number; meanDifference:number;
}
export interface FamilyConcordanceSummary {
  family:CandidateFamily; candidateCount:number; expectedSignals:number; resolvedSignals:number;
  coveredDraws:number; coverage:number; meanDrawHitRate:number; meanDrawBaselineRate:number;
  meanDrawDifference:number; positiveDraws:number; negativeDraws:number; neutralDraws:number;
}
export interface FamilyPairConcordance {
  familyA:CandidateFamily; familyB:CandidateFamily; commonDraws:number;
  pearsonCorrelation:number|null; sameDirectionDraws:number; oppositeDirectionDraws:number;
  neutralPairDraws:number; directionAgreement:number|null;
}
export interface ProspectiveFamilyConcordance {
  portfolioId:string; firstTargetDrawId:number; lastObservedDrawId:number;
  families:FamilyConcordanceSummary[]; drawValues:FamilyDrawValue[];
  pairs:FamilyPairConcordance[];
  interpretation:string[];
}
const FAMILIES:CandidateFamily[]=["transition","position-mutation","absence-return","pool-ranking"];
function pearson(a:number[],b:number[]):number|null {
  if(a.length<3||a.length!==b.length)return null;
  const ma=a.reduce((x,y)=>x+y,0)/a.length,mb=b.reduce((x,y)=>x+y,0)/b.length;
  let xy=0,xx=0,yy=0;
  for(let i=0;i<a.length;i++){const x=a[i]-ma,y=b[i]-mb;xy+=x*y;xx+=x*x;yy+=y*y;}
  return xx>0&&yy>0?xy/Math.sqrt(xx*yy):null;
}
export function summarizeProspectiveFamilyConcordance(
 manifest:ProspectivePortfolioManifest, catalog:IntuitionCandidate[],
 forecasts:FrozenForecast[], results:ResolvedForecast[], lastObservedDrawId:number
):ProspectiveFamilyConcordance {
 if(!Number.isInteger(lastObservedDrawId)||lastObservedDrawId<manifest.firstTargetDrawId)
  throw new Error("last observed contest precedes prospective start");
 const catalogById=new Map(catalog.map(c=>[c.id,c]));
 const familyById=new Map<string,CandidateFamily>();
 for(const id of manifest.candidateIds){
  const c=catalogById.get(id);
  if(!c||manifest.candidateConfigs[id]!==c.frozenConfig)throw new Error("manifest candidate/config does not match catalog: "+id);
  familyById.set(id,c.family);
 }
 const memberIds=new Set(manifest.candidateIds),forecastById=new Map<string,FrozenForecast>(),forecastByKey=new Map<string,FrozenForecast>(),resultById=new Map<string,ResolvedForecast>();
 for(const f of forecasts){
  if(!memberIds.has(f.candidateId))continue;
  if(f.targetDrawId<manifest.firstTargetDrawId||f.targetDrawId>lastObservedDrawId+1)throw new Error("forecast target outside prospective range");
  if(f.frozenConfig!==manifest.candidateConfigs[f.candidateId]||f.family!==familyById.get(f.candidateId))throw new Error("forecast differs from frozen candidate identity");
  if(forecastById.has(f.forecastId))throw new Error("duplicate forecast ID");
  const key=f.targetDrawId+"|"+f.candidateId;
  if(forecastByKey.has(key))throw new Error("duplicate candidate forecast for target contest");
  forecastById.set(f.forecastId,f);
  forecastByKey.set(key,f);
 }
 for(const r of results){
  if(!memberIds.has(r.candidateId))continue;
  const f=forecastById.get(r.forecastId);
  if(!f||f.candidateId!==r.candidateId||f.targetDrawId!==r.targetDrawId)throw new Error("resolved result has no matching frozen forecast");
  if(resultById.has(r.forecastId))throw new Error("duplicate resolved forecast");
  resultById.set(r.forecastId,r);
 }
 const drawValues:FamilyDrawValue[]=[];
 const valueByFamily=new Map<CandidateFamily,Map<number,number>>();
 const summaries:FamilyConcordanceSummary[]=[];
 for(const family of FAMILIES){
  const ids=manifest.candidateIds.filter(id=>familyById.get(id)===family);
  if(!ids.length)continue;
  let resolvedSignals=0,coveredDraws=0;
  const drawHit:number[]=[],drawBase:number[]=[],drawDiff:number[]=[];
  for(let drawId=manifest.firstTargetDrawId;drawId<=lastObservedDrawId;drawId++){
   let n=0,hits=0,baselineHits=0;
   for(const id of ids){
    const f=forecastByKey.get(drawId+"|"+id);
    if(!f)continue;
    const r=resultById.get(f.forecastId);if(!r)continue;
    n++;if(r.candidateHit)hits++;if(r.baselineHit)baselineHits++;
   }
   if(!n)continue;
   const hitRate=hits/n,baselineRate=baselineHits/n,difference=(hits-baselineHits)/n;
   resolvedSignals+=n;coveredDraws++;
   drawHit.push(hitRate);drawBase.push(baselineRate);drawDiff.push(difference);
   drawValues.push({drawId,family,candidateCount:ids.length,resolvedCount:n,hitRate,baselineRate,meanDifference:difference});
   const series=valueByFamily.get(family)??new Map<number,number>();series.set(drawId,difference);valueByFamily.set(family,series);
  }
  const mean=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
  summaries.push({family,candidateCount:ids.length,expectedSignals:ids.length*(lastObservedDrawId-manifest.firstTargetDrawId+1),resolvedSignals,coveredDraws,coverage:ids.length*(lastObservedDrawId-manifest.firstTargetDrawId+1)?resolvedSignals/(ids.length*(lastObservedDrawId-manifest.firstTargetDrawId+1)):0,meanDrawHitRate:mean(drawHit),meanDrawBaselineRate:mean(drawBase),meanDrawDifference:mean(drawDiff),positiveDraws:drawDiff.filter(x=>x>0).length,negativeDraws:drawDiff.filter(x=>x<0).length,neutralDraws:drawDiff.filter(x=>x===0).length});
 }
 const pairs:FamilyPairConcordance[]=[];
 for(let i=0;i<summaries.length;i++)for(let j=i+1;j<summaries.length;j++){
  const a=summaries[i].family,b=summaries[j].family,as=valueByFamily.get(a)!,bs=valueByFamily.get(b)!;
  const common=[...as.keys()].filter(id=>bs.has(id)).sort((x,y)=>x-y),av=common.map(id=>as.get(id)!),bv=common.map(id=>bs.get(id)!);
  let same=0,opposite=0,neutral=0;
  for(let k=0;k<common.length;k++){if(av[k]===0||bv[k]===0)neutral++;else if(Math.sign(av[k])===Math.sign(bv[k]))same++;else opposite++;}
  const directional=same+opposite;
  pairs.push({familyA:a,familyB:b,commonDraws:common.length,pearsonCorrelation:pearson(av,bv),sameDirectionDraws:same,oppositeDirectionDraws:opposite,neutralPairDraws:neutral,directionAgreement:directional?same/directional:null});
 }
 return{portfolioId:manifest.portfolioId,firstTargetDrawId:manifest.firstTargetDrawId,lastObservedDrawId,families:summaries,drawValues,pairs,interpretation:[
  "Cada punto por familia y concurso es el promedio de (acierto de candidato - acierto de su baseline pareado) entre señales resueltas de esa familia.",
  "Las familias con más candidatos no dominan por cantidad de filas; cobertura y número de señales se muestran por separado.",
  "Correlación y acuerdo direccional comparan concursos coincidentes; no implican causalidad ni independencia estadística.",
  "La composición del portafolio permanece congelada. Este diagnóstico no cambia pesos, candidatos, pronósticos ni estados del ledger.",
  "Las familias pueden tener objetivos distintos y compartir sorteos, etiquetas e historial; no comparar tasas brutas como si midieran el mismo evento."
 ]};
}
