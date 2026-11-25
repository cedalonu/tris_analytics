import {detectPositionBehaviorChanges, type PositionChangeState} from "./position-change-detector";
import type {ResolvedCycleSignal} from "./cycle-learning";
export interface NullSimulationOptions{replications?:number;seriesPerReplication?:number;drawsPerBlock?:number;blocks?:number;hitRate?:number;seed?:number;blockSize?:number}
export interface NullSimulationResult{hitRate:number;replications:number;seriesPerReplication:number;drawsPerBlock:number;blocks:number;seed:number;falseAlertRate:number;persistentFalseAlertRate:number;familyWiseFalseAlertRate:number;stateCounts:Record<PositionChangeState,number>;wilson95:[number,number];interpretation:string}
function rng(seed:number){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
function wilson(success:number,n:number):[number,number]{if(!n)return[0,1];const z=1.96,p=success/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return[Math.max(0,c-h),Math.min(1,c+h)]}
const STATES:PositionChangeState[]=["insufficient-data","stable","improvement","deterioration","persistent-change","recovery"];
function syntheticRows(random:()=>number,hitRate:number,draws:number,rep:number,series:number):ResolvedCycleSignal[]{
 const rows:ResolvedCycleSignal[]=[],candidateId="null-"+rep+"-"+series,config=JSON.stringify({family:"absence-return",position:0,priorMisses:1});
 for(let i=0;i<draws;i++){rows.push({schemaVersion:1,forecastId:"f-"+rep+"-"+series+"-"+i,candidateId,family:"absence-return",frozenConfig:config,targetDrawId:i+1,generatedAt:"2026-01-01T00:00:00.000Z",historyThroughDrawId:i,historySha256:"synthetic",prediction:[],baseline:[],resolvedAt:"2026-01-01T00:00:00.000Z",actual:"",candidateHit:random()<hitRate,baselineHit:random()<hitRate,cycleId:"null",modelVersion:"null-simulation",position:0,context:{previousPoolSize:4,previousDuplicatePairs:1,previousRepeatedPositions:1,poolRegime:"mixed",duplicateRegime:"few-duplicates"}} as unknown as ResolvedCycleSignal)}
 return rows;
}
export function simulatePositionChangeNull(options:NullSimulationOptions={}):NullSimulationResult{
 const replications=options.replications??1000,seriesPerReplication=options.seriesPerReplication??1,drawsPerBlock=options.drawsPerBlock??25,blocks=options.blocks??6,hitRate=options.hitRate??.2,seed=options.seed??20261125,blockSize=options.blockSize??drawsPerBlock;
 if(!Number.isInteger(replications)||replications<1||!Number.isInteger(seriesPerReplication)||seriesPerReplication<1||!Number.isInteger(drawsPerBlock)||drawsPerBlock<10||!Number.isInteger(blocks)||blocks<4||!Number.isFinite(hitRate)||hitRate<=0||hitRate>=1||!Number.isInteger(seed)||!Number.isInteger(blockSize)||blockSize<10)throw new Error("invalid null simulation options");
 const random=rng(seed),counts:Record<PositionChangeState,number>={"insufficient-data":0,stable:0,improvement:0,deterioration:0,"persistent-change":0,recovery:0};
 let falseAlerts=0,persistent=0,familyWise=0,total=0;
 for(let r=0;r<replications;r++){let any=false;for(let s=0;s<seriesPerReplication;s++){const rows=syntheticRows(random,hitRate,drawsPerBlock*blocks,r,s),state=detectPositionBehaviorChanges(rows,blockSize).series[0]?.state??"insufficient-data";counts[state]++;total++;if(state!=="stable"&&state!=="insufficient-data"){falseAlerts++;any=true}if(state==="persistent-change"||state==="recovery")persistent++}if(any)familyWise++}
 const interval=wilson(falseAlerts,total);
 return{hitRate,replications,seriesPerReplication,drawsPerBlock,blocks,seed,falseAlertRate:falseAlerts/total,persistentFalseAlertRate:persistent/total,familyWiseFalseAlertRate:familyWise/replications,stateCounts:counts,wilson95:interval,interpretation:"Null sintético: candidato y baseline tienen la misma probabilidad marginal de acierto y se generan independientemente. La tasa mide alertas bajo este supuesto, no la tasa real del TRIS ni una garantía frente a autocorrelación o selección múltiple."};
}
