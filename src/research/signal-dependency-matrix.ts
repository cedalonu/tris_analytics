/**
 * Conservative empirical dependency matrix for alert streams.
 * Structural overlap is descriptive; empirical alert correlation uses matched IDs
 * and a permutation null. No predictive claims or automatic weighting are made.
 */
export interface DependencySignal {
 id:string; family:string; components:string[]; sharedInputs:string[];
 matchedAlerts:Array<{targetId:string;alert:boolean}>;
}
export interface DependencyPair {
 a:string;b:string;matchedN:number;coAlerts:number;coAlertRate:number|null;
 phi:number|null;observedAlertOverlap:number|null;structuralJaccard:number;
 sharedComponents:string[];sharedInputs:string[];permutationP:number|null;
 temporalBlocks:number;blockPhi:Array<number|null>;directionConsistency:number|null;
 classification:"insufficient"|"structural-only"|"empirical-dependence"|"no-dependence-detected";
}
export interface DependencyMatrix {
 signalCount:number;pairCount:number;minMatched:number;permutations:number;
 pairs:DependencyPair[];interpretation:string;
}
function phi(a:boolean[],b:boolean[]):number|null {
 const n11=a.filter((x,i)=>x&&b[i]).length,n10=a.filter((x,i)=>x&&!b[i]).length,n01=a.filter((x,i)=>!x&&b[i]).length,n00=a.filter((x,i)=>!x&&!b[i]).length;
 const den=Math.sqrt((n11+n10)*(n01+n00)*(n11+n01)*(n10+n00));return den?((n11*n00-n10*n01)/den):null;
}
function jaccard(a:string[],b:string[]):number{const A=new Set<string>(a),B=new Set<string>(b),u=new Set<string>([...A,...B]);let intersection=0;for(const item of A)if(B.has(item))intersection++;return u.size?intersection/u.size:0}
function rng(seed:number){let s=seed>>>0;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}}
function permP(a:boolean[],b:boolean[],observed:number|null,reps:number,seed:number):number|null{
 if(observed===null||a.length<2)return null;const random=rng(seed);let exceed=0;
 for(let r=0;r<reps;r++){const shuffled=[...b];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}
 const v=phi(a,shuffled);if(v!==null&&Math.abs(v)>=Math.abs(observed)-1e-12)exceed++}
 return(exceed+1)/(reps+1);
}
export function buildSignalDependencyMatrix(signals:DependencySignal[],options:{minMatched?:number;permutations?:number;seed?:number;phiThreshold?:number;alpha?:number}={}):DependencyMatrix{
 const minMatched=options.minMatched??40,permutations=options.permutations??500,seed=options.seed??20261126,threshold=options.phiThreshold??.3,alpha=options.alpha??.05;
 if(!Array.isArray(signals)||signals.some(s=>!s||!s.id||!s.family||!Array.isArray(s.components)||!Array.isArray(s.sharedInputs)||!Array.isArray(s.matchedAlerts)))throw new Error("invalid dependency signal");
 if(new Set(signals.map(s=>s.id)).size!==signals.length)throw new Error("signal IDs must be unique");
 if(!Number.isInteger(minMatched)||minMatched<2||!Number.isInteger(permutations)||permutations<1||!Number.isFinite(threshold)||threshold<=0||threshold>1||!Number.isFinite(alpha)||alpha<=0||alpha>=1)throw new Error("invalid matrix options");
 const pairs:DependencyPair[]=[];
 for(let i=0;i<signals.length;i++)for(let j=i+1;j<signals.length;j++){
  const a=signals[i],b=signals[j],mapB=new Map<string,boolean>(b.matchedAlerts.map(x=>[x.targetId,x.alert]));
  const matched=a.matchedAlerts.filter(x=>mapB.has(x.targetId)),aa=matched.map(x=>x.alert),bb=matched.map(x=>mapB.get(x.targetId)!);
  const n=matched.length,cor=n>=minMatched?phi(aa,bb):null;
  const sharedComponents=a.components.filter(x=>b.components.some(y=>y===x)),sharedInputs=a.sharedInputs.filter(x=>b.sharedInputs.some(y=>y===x));
  const p=n>=minMatched?permP(aa,bb,cor,permutations,seed+i*7919+j):null;
  const ordered=matched.slice().sort((x,y)=>{const nx=Number(x.targetId),ny=Number(y.targetId);return Number.isFinite(nx)&&Number.isFinite(ny)?nx-ny:x.targetId.localeCompare(y.targetId)});
  const blockSize=Math.max(10,Math.floor(minMatched/2)),blockPhi:Array<number|null>=[];
  for(let start=0;start+blockSize<=ordered.length;start+=blockSize){const block=ordered.slice(start,start+blockSize);blockPhi.push(phi(block.map(x=>x.alert),block.map(x=>mapB.get(x.targetId)!)));}
  const nonzeroBlocks=blockPhi.filter((v):v is number=>v!==null&&v!==0);
  const directionConsistency=cor!==null&&cor!==0&&nonzeroBlocks.length?nonzeroBlocks.filter(v=>Math.sign(v)===Math.sign(cor)).length/nonzeroBlocks.length:null;
  const cls=n<minMatched?"insufficient":cor!==null&&Math.abs(cor)>=threshold&&p!==null&&p<=alpha?"empirical-dependence":sharedComponents.length||sharedInputs.length?"structural-only":"no-dependence-detected";
  const co=aa.filter((x,k)=>x&&bb[k]).length;
  pairs.push({a:a.id,b:b.id,matchedN:n,coAlerts:co,coAlertRate:n?co/n:null,phi:cor,observedAlertOverlap:n?co/n:null,structuralJaccard:jaccard(a.components,b.components),sharedComponents,sharedInputs,permutationP:p,temporalBlocks:blockPhi.length,blockPhi,directionConsistency,classification:cls});
 }
 return{signalCount:signals.length,pairCount:pairs.length,minMatched,permutations,pairs,interpretation:"Structural overlap and empirical dependence are distinguished. Empirical dependence requires a matched sample, |phi| threshold and permutation p-value; it is not causal or predictive. Temporal block Phi and direction consistency are descriptive; no familywise correction is applied. No automatic signal weighting or elimination."};
}
