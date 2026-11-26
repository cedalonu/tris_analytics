/**
 * Signal redundancy grouping v1.
 * Empirical and structural graph clusters are reported separately.
 * Only BH-qualified empirical edges enter empirical clusters; temporal support
 * is summarized descriptively, and clusters do not alter model weights.
 */
import type {DependencyMatrix,DependencyPair} from "./signal-dependency-matrix";
export interface RedundancyGroup {
 groupId:string;kind:"empirical"|"structural";members:string[];
 qualifyingEdges:number;edgeCount:number;meanAbsPhi:number|null;
 temporalSupportMean:number|null;classification:"supported"|"fragile"|"structural-only";
}
export interface SignalRedundancyReport {
 signalIds:string[];empiricalGroups:RedundancyGroup[];structuralGroups:RedundancyGroup[];
 empiricalEdges:Array<{a:string;b:string;phi:number;q:number;temporalSupport:number|null}>;
 structuralEdges:Array<{a:string;b:string;sharedComponents:string[];sharedInputs:string[]}>;
 isolatedSignals:string[];interpretation:string;
}
function components(nodes:string[],edges:Array<[string,string]>):string[][]{
 const parent=new Map(nodes.map(n=>[n,n]));
 const find=(x:string):string=>{let p=parent.get(x)!;if(p!==x){p=find(p);parent.set(x,p)}return p};
 for(const [a,b] of edges){const ra=find(a),rb=find(b);if(ra!==rb)parent.set(ra,rb)}
 const groups=new Map<string,string[]>();for(const n of nodes){const r=find(n);if(!groups.has(r))groups.set(r,[]);groups.get(r)!.push(n)}
 return [...groups.values()].filter(g=>g.length>1).map(g=>g.sort()).sort((a,b)=>a[0].localeCompare(b[0]));
}
function temporalSupport(pair:DependencyPair):number|null{
 const vals=pair.blockPhi.filter((v):v is number=>v!==null&&v!==0);
 if(!vals.length||pair.phi===null||pair.phi===0)return null;
 return vals.filter(v=>Math.sign(v)===Math.sign(pair.phi!)).length/vals.length;
}
export function groupSignalRedundancy(matrix:DependencyMatrix,options:{phiThreshold?:number;qThreshold?:number;temporalSupportThreshold?:number}={}):SignalRedundancyReport{
 const phiThreshold=options.phiThreshold??.3,qThreshold=options.qThreshold??.05,temporalThreshold=options.temporalSupportThreshold??.7;
 if(!Number.isFinite(phiThreshold)||phiThreshold<=0||phiThreshold>1||!Number.isFinite(qThreshold)||qThreshold<=0||qThreshold>=1||!Number.isFinite(temporalThreshold)||temporalThreshold<0||temporalThreshold>1)throw new Error("invalid grouping options");
 const ids=[...new Set(matrix.pairs.flatMap(p=>[p.a,p.b]))].sort();
 const emp=matrix.pairs.filter(p=>p.phi!==null&&p.adjustedQ!==null&&Math.abs(p.phi)>=phiThreshold&&p.adjustedQ<=qThreshold);
 const structural=matrix.pairs.filter(p=>p.sharedComponents.length>0||p.sharedInputs.length>0);
 const empComponents=components(ids,emp.map(p=>[p.a,p.b]));const strComponents=components(ids,structural.map(p=>[p.a,p.b]));
 const build=(groups:string[][],kind:"empirical"|"structural",edges:DependencyPair[]):RedundancyGroup[]=>groups.map((members,i)=>{
  const inside=edges.filter(p=>members.includes(p.a)&&members.includes(p.b)),supports=inside.map(temporalSupport).filter((v):v is number=>v!==null);
  const support=supports.length?supports.reduce((a,b)=>a+b,0)/supports.length:null;
  const phiMean=kind==="empirical"&&inside.length?inside.reduce((s,p)=>s+Math.abs(p.phi!),0)/inside.length:null;
  const classification=kind==="structural"?"structural-only":support!==null&&support>=temporalThreshold?"supported":"fragile";
  return{groupId:(kind==="empirical"?"E":"S")+String(i+1).padStart(3,"0"),kind,members,qualifyingEdges:inside.length,edgeCount:inside.length,meanAbsPhi:phiMean,temporalSupportMean:support,classification};
 });
 const empiricalGroups=build(empComponents,"empirical",emp),structuralGroups=build(strComponents,"structural",structural);
 const covered=new Set([...empiricalGroups,...structuralGroups].flatMap(g=>g.members));
 return{signalIds:ids,empiricalGroups,structuralGroups,empiricalEdges:emp.map(p=>({a:p.a,b:p.b,phi:p.phi!,q:p.adjustedQ!,temporalSupport:temporalSupport(p)})),structuralEdges:structural.map(p=>({a:p.a,b:p.b,sharedComponents:p.sharedComponents,sharedInputs:p.sharedInputs})),isolatedSignals:ids.filter(id=>!covered.has(id)),interpretation:"Empirical clusters use only pairwise BH-qualified dependencies. Structural clusters use shared components or input labels and are kept separate from empirical evidence. Temporal support is a descriptive proportion of nonzero blocks matching full-sample Phi direction; group classification is not predictive. No signals are removed, weighted, or promoted automatically."};
}
