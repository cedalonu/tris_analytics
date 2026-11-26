import type {Digit,PoolMethod} from "../research-core";
import type {PositionalPoolConcordanceReport,PositionalPoolBlockRow} from "./positional-pool-concordance";
import {analyzePositionalPoolTemporalStability} from "./positional-pool-temporal-stability";

export type PositionalPoolCalibrationScenario="null-independent"|"persistent-positive"|"persistent-negative"|"alternating-sign"|"weak-positive";
export interface PositionalPoolCalibrationOptions{replications?:number;blocksPerReplication?:number;windowBlocks?:number;stepBlocks?:number;minimumPairs?:number;seed?:number;consistencyThreshold?:number;nearZeroThreshold?:number}
export interface PositionalPoolCalibrationScenarioResult{scenario:PositionalPoolCalibrationScenario;replications:number;falseStableAlerts:number;detectedPositive:number;detectedNegative:number;unstableOrInsufficient:number;falseStableAlertRate:number;falseStableAlertWilson95:[number,number];positiveDetectionRate:number;positiveDetectionWilson95:[number,number];negativeDetectionRate:number;negativeDetectionWilson95:[number,number];meanValidWindowCorrelations:number;description:string}
export interface PositionalPoolCalibrationReport{method:string;seed:number;replications:number;blocksPerReplication:number;windowBlocks:number;stepBlocks:number;minimumPairs:number;consistencyThreshold:number;nearZeroThreshold:number;scenarios:PositionalPoolCalibrationScenarioResult[];limitations:string[]}
function rng(seed:number){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function wilson(k:number,n:number):[number,number]{if(!n)return[0,1];const z=1.96,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return[Math.max(0,c-h),Math.min(1,c+h)];}
const clamp=(x:number)=>Math.max(.01,Math.min(.99,x));
function noise(random:()=>number){return(random()+random()+random()+random()-2)*.25;}
function makeRows(scenario:PositionalPoolCalibrationScenario,n:number,random:()=>number,rep:number):PositionalPoolBlockRow[]{
 const rows:PositionalPoolBlockRow[]=[];
 for(let i=0;i<n;i++){
  const x=clamp(.2+.6*random()),segment=Math.floor(i/5)%2;
  const sign=scenario==="persistent-positive"?1:scenario==="persistent-negative"?-1:scenario==="alternating-sign"?(segment===0?1:-1):scenario==="weak-positive"?.25:0;
  const noiseScale=scenario==="persistent-positive"||scenario==="persistent-negative"?.1:1;
  const y=clamp(.5+sign*(x-.5)*1.5+noise(random)*noiseScale);
  const z=clamp(.5+sign*(x-.5)*1.4+noise(random)*noiseScale);
  const w=clamp(.5+sign*(x-.5)*1.3+noise(random)*noiseScale);
  rows.push({regimeId:"SYN-"+rep,position:0,method:"frequency" as PoolMethod,poolSize:5,blockIndex:i,startDrawId:rep*100000+i*100+1,endDrawId:rep*100000+i*100+100,partial:false,
   positionalDominantDigit:(i%10) as Digit,positionalDominantShare:x,tested:100,poolHits:Math.round(w*100),poolHitRate:w,uniformReference:.5,
   dominantDigitPoolInclusionRate:y,meanPoolJaccard:1-z,poolTurnover:z,dominantChangedFromPreviousBlock:i===0?null:x>.5});
 }
 return rows;
}
export function calibratePositionalPoolTemporalStability(o:PositionalPoolCalibrationOptions={}):PositionalPoolCalibrationReport{
 const replications=o.replications??500,blocks=o.blocksPerReplication??30,window=o.windowBlocks??5,step=o.stepBlocks??1,minPairs=o.minimumPairs??3,seed=o.seed??20261130,consistency=o.consistencyThreshold??.7,nearZero=o.nearZeroThreshold??.1;
 if(!Number.isInteger(replications)||replications<1||!Number.isInteger(blocks)||blocks<window||!Number.isInteger(window)||window<3||!Number.isInteger(step)||step<1||!Number.isInteger(minPairs)||minPairs<3||!Number.isInteger(seed))throw new Error("invalid positional pool calibration options");
 if(consistency<=.5||consistency>1||nearZero<0||nearZero>=1)throw new Error("invalid positional pool calibration thresholds");
 const scenarios:PositionalPoolCalibrationScenario[]=["null-independent","persistent-positive","persistent-negative","alternating-sign","weak-positive"],results:PositionalPoolCalibrationScenarioResult[]=[];
 for(let si=0;si<scenarios.length;si++){
  const scenario=scenarios[si];let falseAlerts=0,positive=0,negative=0,other=0,validCorrelations=0;
  for(let r=0;r<replications;r++){
   const random=rng((seed+si*1000003+r*7919)>>>0),rows=makeRows(scenario,blocks,random,r);
   const fixture:PositionalPoolConcordanceReport={method:"synthetic-fixture",minimumHistory:1,poolMethods:["frequency"],poolSizes:[5],blocks:rows,groups:[],limitations:[]};
   const report=analyzePositionalPoolTemporalStability(fixture,{windowBlocks:window,stepBlocks:step,minimumPairs:minPairs,consistencyThreshold:consistency,nearZeroThreshold:nearZero});
   const group=report.groups[0];validCorrelations+=report.windows.reduce((sum,x)=>sum+[x.dominantShareVsPoolInclusion,x.dominantTransitionVsTurnover,x.dominantInclusionVsHitRate].filter(v=>v!==null).length,0);
   if(group.classification==="temporally-consistent-positive")positive++;
   else if(group.classification==="temporally-consistent-negative")negative++;
   else other++;
   if(scenario==="null-independent"||scenario==="alternating-sign")if(group.classification==="temporally-consistent-positive"||group.classification==="temporally-consistent-negative")falseAlerts++;
  }
  results.push({scenario,replications,falseStableAlerts:falseAlerts,detectedPositive:positive,detectedNegative:negative,unstableOrInsufficient:other,
   falseStableAlertRate:falseAlerts/replications,falseStableAlertWilson95:wilson(falseAlerts,replications),
   positiveDetectionRate:scenario==="persistent-positive"?positive/replications:0,positiveDetectionWilson95:scenario==="persistent-positive"?wilson(positive,replications):[0,1],
   negativeDetectionRate:scenario==="persistent-negative"?negative/replications:0,negativeDetectionWilson95:scenario==="persistent-negative"?wilson(negative,replications):[0,1],
   meanValidWindowCorrelations:validCorrelations/replications,
   description:scenario==="null-independent"?"Las tres relaciones se generan sin asociación sistemática.":scenario==="persistent-positive"?"Asociación positiva estable en las tres relaciones medidas.":scenario==="persistent-negative"?"Asociación negativa estable en las tres relaciones medidas.":scenario==="alternating-sign"?"El signo de la asociación cambia cada cinco bloques; las ventanas pueden solaparse entre tramos.":"Asociación positiva débil con ruido elevado."});
 }
 return{method:"synthetic-positional-pool-temporal-stability-calibration-v1",seed,replications,blocksPerReplication:blocks,windowBlocks:window,stepBlocks:step,minimumPairs:minPairs,consistencyThreshold:consistency,nearZeroThreshold:nearZero,scenarios:results,
 limitations:[
  "Escenarios sintéticos diseñados; no estiman la distribución real de TRIS ni validan señales en sorteos observados.",
  "La ventana móvil se solapa deliberadamente; la consistencia de signo es una regla descriptiva, no una prueba inferencial.",
  "Las tres correlaciones dentro de cada ventana comparten variables y no son independientes; se informa el conteo agregado solo como diagnóstico.",
  "El escenario alternante puede parecer consistente localmente cuando la ventana queda dentro de un tramo; esto es parte de la sensibilidad que se desea medir.",
  "El escenario débil no tiene un tamaño de efecto calibrado a datos reales; la detección depende de longitud, ruido y umbrales fijados.",
  "Los intervalos Wilson tratan réplicas sintéticas como unidades binomiales independientes; no corrigen la multiplicidad entre métodos, posiciones o ventanas.",
  "No usa CSV real, APIs, polling ni descargas; no modifica pronósticos, portafolios ni ledger."
 ]};
}
