import {detectPositionBehaviorChanges, type PositionChangeState} from "./position-change-detector";
import type {ResolvedCycleSignal} from "./cycle-learning";
export interface NullSimulationOptions{replications?:number;seriesPerReplication?:number;drawsPerBlock?:number;blocks?:number;hitRate?:number;seed?:number;blockSize?:number;serialCorrelation?:number;pairedDependence?:number}
export interface NullSimulationResult{hitRate:number;replications:number;seriesPerReplication:number;drawsPerBlock:number;blocks:number;seed:number;serialCorrelation:number;pairedDependence:number;falseAlertRate:number;persistentFalseAlertRate:number;familyWiseFalseAlertRate:number;stateCounts:Record<PositionChangeState,number>;wilson95:[number,number];interpretation:string}
function rng(seed:number){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
function wilson(success:number,n:number):[number,number]{if(!n)return[0,1];const z=1.96,p=success/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return[Math.max(0,c-h),Math.min(1,c+h)]}
const STATES:PositionChangeState[]=["insufficient-data","stable","improvement","deterioration","persistent-change","recovery"];
function markov(previous:boolean|null,p:number,rho:number,random:()=>number):boolean{if(previous===null)return random()<p;const conditional=previous?p+rho*(1-p):p*(1-rho);return random()<conditional}
function syntheticRows(random:()=>number,p:number,draws:number,rep:number,series:number,rho:number,paired:number):ResolvedCycleSignal[]{
 const rows:ResolvedCycleSignal[]=[],candidateId="null-"+rep+"-"+series,config=JSON.stringify({family:"absence-return",position:0,priorMisses:1});
 let previousCandidate:boolean|null=null,previousBaseline:boolean|null=null;
 for(let i=0;i<draws;i++){const candidate=markov(previousCandidate,p,rho,random),independentBaseline=markov(previousBaseline,p,rho,random),baseline=random()<paired?candidate:independentBaseline;previousCandidate=candidate;previousBaseline=baseline;
 rows.push({schemaVersion:1,forecastId:"f-"+rep+"-"+series+"-"+i,candidateId,family:"absence-return",frozenConfig:config,targetDrawId:i+1,generatedAt:"2026-01-01T00:00:00.000Z",historyThroughDrawId:i,historySha256:"synthetic",prediction:[],baseline:[],resolvedAt:"2026-01-01T00:00:00.000Z",actual:"",candidateHit:candidate,baselineHit:baseline,cycleId:"null",modelVersion:"null-simulation",position:0,context:{previousPoolSize:4,previousDuplicatePairs:1,previousRepeatedPositions:1,poolRegime:"mixed",duplicateRegime:"few-duplicates"}} as unknown as ResolvedCycleSignal)}
 return rows;
}
export function simulatePositionChangeNull(options:NullSimulationOptions={}):NullSimulationResult{
 const replications=options.replications??1000,seriesPerReplication=options.seriesPerReplication??1,drawsPerBlock=options.drawsPerBlock??25,blocks=options.blocks??6,hitRate=options.hitRate??.2,seed=options.seed??20261125,blockSize=options.blockSize??drawsPerBlock,serialCorrelation=options.serialCorrelation??0,pairedDependence=options.pairedDependence??0;
 if(!Number.isInteger(replications)||replications<1||!Number.isInteger(seriesPerReplication)||seriesPerReplication<1||!Number.isInteger(drawsPerBlock)||drawsPerBlock<10||!Number.isInteger(blocks)||blocks<4||!Number.isFinite(hitRate)||hitRate<=0||hitRate>=1||!Number.isInteger(seed)||!Number.isInteger(blockSize)||blockSize<10||!Number.isFinite(serialCorrelation)||serialCorrelation<0||serialCorrelation>=1||!Number.isFinite(pairedDependence)||pairedDependence<0||pairedDependence>1)throw new Error("invalid null simulation options");
 const random=rng(seed),counts:Record<PositionChangeState,number>={"insufficient-data":0,stable:0,improvement:0,deterioration:0,"persistent-change":0,recovery:0};
 let falseAlerts=0,persistent=0,familyWise=0,total=0;
 for(let r=0;r<replications;r++){let any=false;for(let s=0;s<seriesPerReplication;s++){const rows=syntheticRows(random,hitRate,drawsPerBlock*blocks,r,s,serialCorrelation,pairedDependence),state=detectPositionBehaviorChanges(rows,blockSize).series[0]?.state??"insufficient-data";counts[state]++;total++;if(state!=="stable"&&state!=="insufficient-data"){falseAlerts++;any=true}if(state==="persistent-change"||state==="recovery")persistent++}if(any)familyWise++}
 const interval=wilson(falseAlerts,total);
 return{hitRate,replications,seriesPerReplication,drawsPerBlock,blocks,seed,serialCorrelation,pairedDependence,falseAlertRate:falseAlerts/total,persistentFalseAlertRate:persistent/total,familyWiseFalseAlertRate:familyWise/replications,stateCounts:counts,wilson95:interval,interpretation:"Null sintético: candidato y baseline tienen la misma probabilidad marginal. La autocorrelación se controla con un proceso Markov estacionario y la dependencia emparejada mezcla una proporción configurable de resultados iguales. No reproduce necesariamente el TRIS real."};
}

export type AlternativeShape="abrupt-improvement"|"abrupt-deterioration"|"gradual-improvement"|"recovery";
export interface AlternativeSimulationOptions{replications?:number;drawsPerBlock?:number;blocks?:number;baselineRate?:number;effectSize?:number;seed?:number;blockSize?:number;shape?:AlternativeShape}
export interface AlternativeSimulationResult{shape:AlternativeShape;replications:number;drawsPerBlock:number;blocks:number;baselineRate:number;effectSize:number;seed:number;detectionRate:number;correctDirectionRate:number;medianDetectionLatencyBlocks:number|null;latencyDistribution:Record<string,number>;stateCounts:Record<PositionChangeState,number>;wilson95:[number,number];interpretation:string}
function effectAt(shape:AlternativeShape,block:number,blocks:number,effect:number):number{
 const onset=blocks-2;
 if(shape==="abrupt-improvement")return block>=onset?effect:0;
 if(shape==="abrupt-deterioration")return block>=onset?-effect:0;
 if(shape==="gradual-improvement"){const start=Math.max(0,blocks-4);return block<start?0:effect*(block-start+1)/(blocks-start)}
 if(shape==="recovery"){if(block>=blocks-2)return effect;if(block>=blocks-4)return-effect;return 0}
 return 0;
}
function alternativeRows(random:()=>number,base:number,draws:number,rep:number,shape:AlternativeShape,blocks:number,effect:number,blockSize:number):ResolvedCycleSignal[]{
 const rows:ResolvedCycleSignal[]=[],candidateId="alt-"+rep,config=JSON.stringify({family:"absence-return",position:0,priorMisses:1});
 for(let i=0;i<draws;i++){const block=Math.floor(i/blockSize),p=Math.max(.001,Math.min(.999,base+effectAt(shape,block,blocks,effect)));
 rows.push({schemaVersion:1,forecastId:"af-"+rep+"-"+i,candidateId,family:"absence-return",frozenConfig:config,targetDrawId:i+1,generatedAt:"2026-01-01T00:00:00.000Z",historyThroughDrawId:i,historySha256:"synthetic-alternative",prediction:[],baseline:[],resolvedAt:"2026-01-01T00:00:00.000Z",actual:"",candidateHit:random()<p,baselineHit:random()<base,cycleId:"alternative",modelVersion:"alternative-simulation",position:0,context:{previousPoolSize:4,previousDuplicatePairs:1,previousRepeatedPositions:1,poolRegime:"mixed",duplicateRegime:"few-duplicates"}} as unknown as ResolvedCycleSignal)}
 return rows;
}
export function simulatePositionChangeAlternative(options:AlternativeSimulationOptions={}):AlternativeSimulationResult{
 const replications=options.replications??500,drawsPerBlock=options.drawsPerBlock??25,blocks=options.blocks??8,baselineRate=options.baselineRate??.2,effectSize=options.effectSize??.15,seed=options.seed??20261126,blockSize=options.blockSize??drawsPerBlock,shape=options.shape??"abrupt-improvement";
 if(!Number.isInteger(replications)||replications<1||!Number.isInteger(drawsPerBlock)||drawsPerBlock<10||!Number.isInteger(blocks)||blocks<6||!Number.isFinite(baselineRate)||baselineRate<=0||baselineRate>=1||!Number.isFinite(effectSize)||effectSize<=0||effectSize>=.5||baselineRate+effectSize>=1||!Number.isInteger(seed)||!Number.isInteger(blockSize)||blockSize<10||!["abrupt-improvement","abrupt-deterioration","gradual-improvement","recovery"].includes(shape))throw new Error("invalid alternative simulation options");
 const random=rng(seed),counts:Record<PositionChangeState,number>={"insufficient-data":0,stable:0,improvement:0,deterioration:0,"persistent-change":0,recovery:0},latencies:number[]=[];
 let detected=0,correct=0;
 const expected=shape==="abrupt-deterioration"?"deterioration":shape==="recovery"?"recovery":"improvement";
 for(let r=0;r<replications;r++){const rows=alternativeRows(random,baselineRate,drawsPerBlock*blocks,r,shape,blocks,effectSize,blockSize);
 let firstDetection:number|null=null;
 for(let completed=4;completed<=blocks;completed++){const prefix=rows.slice(0,completed*blockSize),state=detectPositionBehaviorChanges(prefix,blockSize).series[0]?.state??"insufficient-data";
 if(firstDetection===null&&((expected==="improvement"&&(state==="improvement"||state==="persistent-change"))||(expected==="deterioration"&&(state==="deterioration"||state==="persistent-change"))||(expected==="recovery"&&state==="recovery")))firstDetection=completed;
 }
 const state=detectPositionBehaviorChanges(rows,blockSize).series[0]?.state??"insufficient-data";counts[state]++;
 if(state!=="stable"&&state!=="insufficient-data")detected++;
 if(state===expected||((expected==="improvement"||expected==="deterioration")&&state==="persistent-change"))correct++;
 if(firstDetection!==null)latencies.push(firstDetection-(blocks-2)+1);
 }
 const latencyDistribution:Record<string,number>={};for(const n of latencies){const k=String(n);latencyDistribution[k]=(latencyDistribution[k]??0)+1}
 const sorted=latencies.slice().sort((a,b)=>a-b),median=sorted.length?sorted[Math.floor((sorted.length-1)/2)]:null;
 return{shape,replications,drawsPerBlock,blocks,baselineRate,effectSize,seed,detectionRate:detected/replications,correctDirectionRate:correct/replications,medianDetectionLatencyBlocks:median,latencyDistribution,stateCounts:counts,wilson95:wilson(correct,replications),interpretation:"Alternativa sintética: la probabilidad del candidato cambia según el escenario y la baseline permanece fija. La detección mide el estado correcto al final; la latencia cuenta bloques desde el inicio del cambio hasta la primera alerta direccional. Los flujos se generan independientemente y sin autocorrelación."};
}
