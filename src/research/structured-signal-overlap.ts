import {detectPositionBehaviorChanges,type PositionChangeState} from "./position-change-detector";
import type {ResolvedCycleSignal} from "./cycle-learning";

export interface StructuredOverlapOptions {
  signalComponents:string[][];
  replications?:number;
  drawsPerBlock?:number;
  blocks?:number;
  hitRate?:number;
  serialCorrelation?:number;
  seed?:number;
}
export interface StructuredOverlapResult {
  replications:number;signals:number;drawsPerSignal:number;hitRate:number;serialCorrelation:number;seed:number;
  componentCount:number;pairwiseOverlap:Array<{signalA:number;signalB:number;sharedComponents:string[];jaccard:number;cosineOverlap:number;empiricalPearson:number}>;
  falseAlertRate:number;familyWiseFalseAlertRate:number;stateCounts:Record<PositionChangeState,number>;
  interpretation:string;
}
function rng(seed:number){let x=seed>>>0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}}
function markov(previous:boolean|null,p:number,rho:number,random:()=>number):boolean{
 if(previous===null)return random()<p;
 return random()<(previous?p+rho*(1-p):p*(1-rho));
}
function pearson(a:boolean[],b:boolean[]):number{
 const x=a.map(Number),y=b.map(Number),mx=x.reduce((s,v)=>s+v,0)/x.length,my=y.reduce((s,v)=>s+v,0)/y.length;
 let cov=0,vx=0,vy=0;for(let i=0;i<x.length;i++){const dx=x[i]-mx,dy=y[i]-my;cov+=dx*dy;vx+=dx*dx;vy+=dy*dy}
 return vx&&vy?cov/Math.sqrt(vx*vy):0;
}
const STATES:PositionChangeState[]=["insufficient-data","stable","improvement","deterioration","persistent-change","recovery"];
export function simulateStructuredSignalOverlap(options:StructuredOverlapOptions):StructuredOverlapResult{
 const replications=options.replications??300,drawsPerBlock=options.drawsPerBlock??25,blocks=options.blocks??6,hitRate=options.hitRate??.2,serialCorrelation=options.serialCorrelation??.3,seed=options.seed??20261127,components=options.signalComponents;
 if(!Array.isArray(components)||components.length<2||components.some(x=>!Array.isArray(x)||x.length===0||x.some(v=>typeof v!=="string"||!v.trim())||new Set(x).size!==x.length)||!Number.isInteger(replications)||replications<1||!Number.isInteger(drawsPerBlock)||drawsPerBlock<10||!Number.isInteger(blocks)||blocks<4||!Number.isFinite(hitRate)||hitRate<=0||hitRate>=1||!Number.isFinite(serialCorrelation)||serialCorrelation<0||serialCorrelation>=1||!Number.isInteger(seed))throw new Error("invalid structured overlap options");
 const random=rng(seed),draws=drawsPerBlock*blocks,all=[...new Set(components.flat())],counts:Record<PositionChangeState,number>={"insufficient-data":0,stable:0,improvement:0,deterioration:0,"persistent-change":0,recovery:0};
 const empirical=components.map(()=>components.map(()=>({sum:0,n:0})));let falseAlerts=0,total=0,familyWise=0;
 for(let rep=0;rep<replications;rep++){
  const latent=new Map<string,boolean[]>();for(const key of all){const path:boolean[]=[];let prev:boolean|null=null;for(let d=0;d<draws;d++){prev=markov(prev,hitRate,serialCorrelation,random);path.push(prev)}latent.set(key,path)}
  const streams=components.map((keys,s)=>Array.from({length:draws},(_,d)=>latent.get(keys[Math.floor(random()*keys.length)])![d]));
  let anyAlert=false;
  for(let s=0;s<components.length;s++){
   let prev:boolean|null=null;const rows:ResolvedCycleSignal[]=streams[s].map((candidate,d)=>{const baseline=markov(prev,hitRate,serialCorrelation,random);prev=baseline;return {schemaVersion:1,forecastId:"structured-"+rep+"-"+s+"-"+d,candidateId:"structured-"+s,family:"absence-return",frozenConfig:JSON.stringify({family:"absence-return",position:0,components:components[s]}),targetDrawId:d+1,generatedAt:"2026-01-01T00:00:00.000Z",historyThroughDrawId:d,historySha256:"synthetic-structured",prediction:[],baseline:[],resolvedAt:"2026-01-01T00:00:00.000Z",actual:"",candidateHit:candidate,baselineHit:baseline,cycleId:"structured-null",modelVersion:"structured-overlap",position:0,context:{previousPoolSize:4,previousDuplicatePairs:1,previousRepeatedPositions:1,poolRegime:"mixed",duplicateRegime:"few-duplicates"}} as unknown as ResolvedCycleSignal});
   const state=detectPositionBehaviorChanges(rows,drawsPerBlock).series[0]?.state??"insufficient-data";counts[state]++;total++;
   if(state!=="stable"&&state!=="insufficient-data"){falseAlerts++;anyAlert=true}
  }
  if(anyAlert)familyWise++;
  for(let a=0;a<components.length;a++)for(let b=a+1;b<components.length;b++){const c=pearson(streams[a],streams[b]);empirical[a][b].sum+=c;empirical[a][b].n++}
 }
 const pairwiseOverlap=[] as StructuredOverlapResult["pairwiseOverlap"];
 for(let a=0;a<components.length;a++)for(let b=a+1;b<components.length;b++){
  const shared=components[a].filter(x=>components[b].includes(x)),jaccard=shared.length/(components[a].length+components[b].length-shared.length),cosine=shared.length/Math.sqrt(components[a].length*components[b].length);
  pairwiseOverlap.push({signalA:a,signalB:b,sharedComponents:shared,jaccard,cosineOverlap:cosine,empiricalPearson:empirical[a][b].sum/empirical[a][b].n});
 }
 return{replications,signals:components.length,drawsPerSignal:draws,hitRate,serialCorrelation,seed,componentCount:all.length,pairwiseOverlap,falseAlertRate:falseAlerts/total,familyWiseFalseAlertRate:familyWise/replications,stateCounts:counts,interpretation:"Escenario nulo estructurado: cada señal selecciona en cada sorteo un componente latente de su propio conjunto. Los componentes compartidos generan dependencia entre señales; conjuntos disjuntos usan trayectorias latentes independientes. Jaccard y coseno describen el solapamiento nominal; Pearson mide la dependencia realmente observada. La selección de componente por sorteo puede modificar la autocorrelación efectiva. Datos sintéticos, no calibración del TRIS real."};
}
