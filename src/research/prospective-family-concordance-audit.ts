/**
 * Compares observed prospective family concordance with synthetic null envelopes.
 * This is a diagnostic stress comparison, not a calibrated p-value or causal test.
 */
import type {ProspectiveFamilyConcordance} from "./prospective-family-concordance";
import {simulateFamilyConcordanceNull,type FamilyConcordanceNullResult} from "./family-concordance-null-simulation";
export interface FamilyConcordanceAuditScenario {
 crossFamilyOverlap:number; nullCorrelationP05:number|null; nullCorrelationMedian:number|null; nullCorrelationP95:number|null;
 observedCorrelationStatus:"below-null-envelope"|"inside-null-envelope"|"above-null-envelope"|"unavailable";
 nullDirectionP05:number|null; nullDirectionMedian:number|null; nullDirectionP95:number|null;
 observedDirectionStatus:"below-null-envelope"|"inside-null-envelope"|"above-null-envelope"|"unavailable";
 nullAllPositiveRate:number;
}
export interface ProspectiveFamilyConcordanceAudit {
 portfolioId:string; firstTargetDrawId:number; lastObservedDrawId:number;
 observedCommonDraws:number; comparableFamilyPairs:number; familyCount:number; medianCandidatesPerFamily:number;
 observedMeanPairwiseCorrelation:number|null; observedMeanDirectionAgreement:number|null; nullHitRate:number;
 minimumDrawSupport:number; sufficientSupport:boolean; nullScenarios:FamilyConcordanceAuditScenario[];
 limitations:string[];
}
function envelopeStatus(value:number|null,low:number|null,high:number|null):FamilyConcordanceAuditScenario["observedCorrelationStatus"]{
 if(value===null||low===null||high===null)return"unavailable";
 return value<low?"below-null-envelope":value>high?"above-null-envelope":"inside-null-envelope";
}
function median(values:number[]):number{const s=[...values].sort((a,b)=>a-b);return s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2;}
export function auditProspectiveFamilyConcordance(
 observed:ProspectiveFamilyConcordance,
 options:{replications?:number;minimumDrawSupport?:number;seed?:number;hitRate?:number;pairedDependence?:number;overlapLevels?:number[]}={}
):ProspectiveFamilyConcordanceAudit{
 const minimumDrawSupport=options.minimumDrawSupport??30,validPairs=observed.pairs.filter(p=>p.commonDraws>=3&&p.pearsonCorrelation!==null);
 const correlationValues=validPairs.map(p=>p.pearsonCorrelation!);
 const directionValues=observed.pairs.filter(p=>p.directionAgreement!==null).map(p=>p.directionAgreement!);
 const observedMeanCorrelation=correlationValues.length?correlationValues.reduce((a,b)=>a+b,0)/correlationValues.length:null;
 const observedMeanDirection=directionValues.length?directionValues.reduce((a,b)=>a+b,0)/directionValues.length:null;
 const support=observed.pairs.length?Math.min(...observed.pairs.map(p=>p.commonDraws)):0;
 const counts=observed.families.map(f=>f.candidateCount).filter(n=>n>0),medianCandidates=counts.length?Math.max(1,Math.round(median(counts))):0;
 const sufficient=observed.families.length>=2&&support>=minimumDrawSupport&&medianCandidates>0;
 const estimatedBaselineRate=observed.families.length?observed.families.reduce((s,f)=>s+f.meanDrawBaselineRate,0)/observed.families.length:.2;
 const nullHitRate=options.hitRate??Math.max(.01,Math.min(.99,estimatedBaselineRate));
 const nullResults:FamilyConcordanceNullResult[]=sufficient?(options.overlapLevels??[0,.25,.5,.75,1]).map((crossFamilyOverlap,i)=>simulateFamilyConcordanceNull({
  replications:options.replications??2000,draws:support,families:observed.families.length,candidatesPerFamily:medianCandidates,
  hitRate:nullHitRate,pairedDependence:options.pairedDependence??.5,crossFamilyOverlap,seed:(options.seed??20261125)+i*100
 })): [];
 return{
  portfolioId:observed.portfolioId,firstTargetDrawId:observed.firstTargetDrawId,lastObservedDrawId:observed.lastObservedDrawId,
  observedCommonDraws:support,comparableFamilyPairs:validPairs.length,familyCount:observed.families.length,medianCandidatesPerFamily:medianCandidates,
  observedMeanPairwiseCorrelation:observedMeanCorrelation,observedMeanDirectionAgreement:observedMeanDirection,nullHitRate,
  minimumDrawSupport,sufficientSupport:sufficient,
  nullScenarios:nullResults.map(n=>({
   crossFamilyOverlap:n.crossFamilyOverlap,nullCorrelationP05:n.correlationP05,nullCorrelationMedian:n.correlationMedian,nullCorrelationP95:n.correlationP95,
   observedCorrelationStatus:envelopeStatus(observedMeanCorrelation,n.correlationP05,n.correlationP95),
   nullDirectionP05:n.directionAgreementP05,nullDirectionMedian:n.directionAgreementMedian,nullDirectionP95:n.directionAgreementP95,
   observedDirectionStatus:envelopeStatus(observedMeanDirection,n.directionAgreementP05,n.directionAgreementP95),
   nullAllPositiveRate:n.allFamiliesPositiveRate
  })),
  limitations:[
   "Se utilizan solo concursos resueltos y pronósticos congelados del ledger local; no se completa ni reconstruye historia faltante.",
   "El nulo iguala una tasa marginal candidata-baseline y aproxima tamaños de familia con la mediana de candidatos; no reproduce toda la estructura ni heterogeneidad del sorteo.",
   "El solapamiento latente es un parámetro de estrés, no una estimación observada de dependencia real.",
   "Los límites 5–95% son envolventes descriptivas de réplicas sintéticas, no intervalos de confianza ni p-valores sobre TRIS.",
   "La correlación observada puede estar afectada por autocorrelación temporal, selección previa y tamaños pequeños; no implica causalidad ni ventaja predictiva.",
   "La comparación no modifica portafolio, pesos, umbrales, ledger ni pronósticos."
  ]
 };
}
