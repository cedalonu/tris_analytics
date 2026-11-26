import {classifyPastOnlyRegimes} from "./past-only-regime-classifier";
import type {Draw,Digit} from "../research-core";

export interface RegimeCalibrationOptions {replications?:number;targetsPerReplication?:number;seed?:number}
export interface RegimeCalibrationScenario {name:string;replications:number;observations:number;alertCount:number;rate:number;wilson95:[number,number];description:string}
export interface RegimeCalibrationReport {seed:number;replications:number;targetsPerReplication:number;window:number;scenarios:RegimeCalibrationScenario[];limitations:string[]}
function rng(seed:number){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;}}
function wilson(success:number,n:number):[number,number]{if(!n)return[0,1];const z=1.96,p=success/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return[Math.max(0,c-h),Math.min(1,c+h)];}
function digit(random:()=>number,biased=false):Digit{return Math.floor(random()*(biased?2:10)) as Digit;}
function drawRows(random:()=>number,kind:"uniform"|"biased"|"pool-shift",rep:number):Draw[]{
 const rows:Draw[]=[];
 for(let i=0;i<100;i++){
  let digits:Digit[];
  if(kind==="pool-shift"&&i>=50){const d=Math.floor(random()*10) as Digit;digits=[d,d,d,d,d];}
  else digits=Array.from({length:5},()=>digit(random,kind==="biased"));
  rows.push({drawId:rep*1000+i+1,digits});
 }
 return rows;
}
export function calibratePastOnlyRegimeClassifier(options:RegimeCalibrationOptions={}):RegimeCalibrationReport{
 const replications=options.replications??500,targetsPerReplication=options.targetsPerReplication??25,seed=options.seed??20261127;
 if(!Number.isInteger(replications)||replications<1||!Number.isInteger(targetsPerReplication)||targetsPerReplication<1||targetsPerReplication>25||!Number.isInteger(seed))throw new Error("invalid regime calibration options");
 const random=rng(seed),scenarios:RegimeCalibrationScenario[]=[];
 for(const kind of ["uniform","biased"] as const){
  let alerts=0,observations=0;
  for(let r=0;r<replications;r++){
   const rows=drawRows(random,kind,r),result=classifyPastOnlyRegimes(rows,rows[75].drawId,rows[75+targetsPerReplication-1].drawId);
   for(const label of result.labels){observations++;if(!label.regimeId.endsWith("dup-stable|distinct-stable|entropy-stable")||!label.regimeId.startsWith("pool-stable|"))alerts++;}
  }
  scenarios.push({name:"stationary-"+kind,replications,observations,alertCount:alerts,rate:alerts/observations,wilson95:wilson(alerts,observations),description:kind==="uniform"?"Dígitos independientes uniformes, distribución fija durante toda la serie.":"Dígitos independientes con sesgo fijo 0/1, distribución fija durante toda la serie."});
 }
 let detected=0,observations=0;
 for(let r=0;r<replications;r++){
  const rows=drawRows(random,"pool-shift",r),result=classifyPastOnlyRegimes(rows,rows[75].drawId,rows[75+targetsPerReplication-1].drawId);
  const firstPostChangeLabel=result.labels[0];if(firstPostChangeLabel){observations++;if(firstPostChangeLabel.regimeId.includes("pool-shift"))detected++;}
 }
 scenarios.push({name:"abrupt-pool-shift",replications,observations,alertCount:detected,rate:detected/observations,wilson95:wilson(detected,observations),description:"Cambio sintético en el concurso 51: para el primer objetivo posterior al cambio, la ventana reciente contiene 25 concursos concentrados; se mide la detección inicial de pool-shift."});
 return{seed,replications,targetsPerReplication,window:50,scenarios,limitations:[
  "Calibración sintética reproducible; no estima la frecuencia de regímenes ni cambios reales del TRIS.",
  "Los escenarios estacionarios miden etiquetas no estables en procesos independientes con distribución fija; la dependencia temporal real podría cambiar estos resultados.",
  "El escenario de cambio es deliberadamente marcado y no representa todos los cambios posibles ni garantiza sensibilidad a cambios sutiles.",
  "Se mantienen congelados los umbrales del clasificador; esta calibración no los optimiza.",
  "Las observaciones de concursos consecutivos comparten ventanas y no son independientes; los intervalos Wilson son descriptivos y no corrigen esa dependencia."
 ]};
}
