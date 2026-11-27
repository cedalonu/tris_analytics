/** Controlled second-generation hypothesis proposals.
 * Variants are created only from prior resolved prospective evidence and change one parameter.
 * They remain new hypotheses: parent evidence is provenance, never copied into the child ledger.
 */
import type {IntuitionCandidate,CandidateConfig} from "./intuition-candidate-generator";
import type {ResolvedCycleSignal} from "./cycle-learning";
export interface AdaptiveVariantOptions {beforeDrawId:number;minResolvedDraws?:number;priorStrength?:number;maxVariants?:number;retiredCandidateIds?:string[];}
export interface AdaptiveCandidateVariant {candidate:IntuitionCandidate;parentCandidateId:string;changedParameter:"window"|"priorMisses";fromValue:number;toValue:number;parentResolvedDraws:number;parentPairedWins:number;parentPairedLosses:number;parentShrunkAdvantage:number;proposalReason:string;}
const canonical=(config:CandidateConfig)=>JSON.stringify(config,Object.keys(config).sort());
const safeId=(value:string)=>value.toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
export function proposeAdaptiveCandidateVariants(baseCandidates:IntuitionCandidate[],outcomes:ResolvedCycleSignal[],options:AdaptiveVariantOptions):AdaptiveCandidateVariant[]{
 if(!Number.isInteger(options.beforeDrawId)||options.beforeDrawId<1)throw new Error("beforeDrawId must be a positive contest ID");
 const minResolved=Math.max(1,Math.floor(options.minResolvedDraws??25)),prior=options.priorStrength??20,maxVariants=Math.max(0,Math.floor(options.maxVariants??20));
 if(!Number.isFinite(prior)||prior<=0)throw new Error("priorStrength must be positive");
 const baseById=new Map(baseCandidates.map(c=>[c.id,c]));
 if(baseById.size!==baseCandidates.length)throw new Error("base candidate catalog contains duplicate IDs");
 const groups=new Map<string,ResolvedCycleSignal[]>(),seen=new Set<string>();
 for(const row of outcomes){
  if(row.targetDrawId>=options.beforeDrawId)throw new Error("future or target-draw outcome cannot generate variants");
  if(!baseById.has(row.candidateId))continue;
  const key=row.candidateId+"|"+row.targetDrawId;if(seen.has(key))throw new Error("duplicate candidate outcome for variant parent: "+key);seen.add(key);
  const rows=groups.get(row.candidateId)??[];rows.push(row);groups.set(row.candidateId,rows);
 }
 const retired=new Set(options.retiredCandidateIds??[]),proposals:AdaptiveCandidateVariant[]=[];
 for(const parent of baseCandidates){
  if(retired.has(parent.id))continue;
  const rows=groups.get(parent.id)??[];if(rows.length<minResolved)continue;
  const wins=rows.filter(r=>r.candidateHit&&!r.baselineHit).length,losses=rows.filter(r=>!r.candidateHit&&r.baselineHit).length;
  const advantage=(wins-losses)/(rows.length+prior);if(advantage<=0)continue;
  const variants:Array<{parameter:"window"|"priorMisses";from:number;to:number}>=[];
  if(parent.family==="pool-ranking"&&parent.config.window!==undefined){
   const from=parent.config.window;for(const to of [from+100,from+300])if(to<=1000)variants.push({parameter:"window",from,to});
  }else if(parent.family==="absence-return"&&parent.config.priorMisses!==undefined){
   const from=parent.config.priorMisses;for(const to of [from+5,from+10])if(to<=50)variants.push({parameter:"priorMisses",from,to});
  }
  for(const variant of variants){
   const config={...parent.config,[variant.parameter]:variant.to} as CandidateConfig;
   const id=safeId(parent.family+"-adaptive-"+parent.id+"-"+variant.parameter+"-"+variant.to);
   const candidate:IntuitionCandidate={id,family:parent.family,title:"Adaptive variant of "+parent.title+" ("+variant.parameter+" "+variant.from+" → "+variant.to+")",
    description:"New one-parameter variant proposed from a parent with "+rows.length+" resolved prospective contests and positive shrunk paired advantage. This is a new hypothesis, not inherited proof.",
    config,frozenConfig:canonical(config)};
   proposals.push({candidate,parentCandidateId:parent.id,changedParameter:variant.parameter,fromValue:variant.from,toValue:variant.to,
    parentResolvedDraws:rows.length,parentPairedWins:wins,parentPairedLosses:losses,parentShrunkAdvantage:advantage,
    proposalReason:"Parent has at least "+minResolved+" prospective outcomes and positive paired advantage after shrinkage; vary only "+variant.parameter+"."});
  }
 }
 proposals.sort((a,b)=>b.parentShrunkAdvantage-a.parentShrunkAdvantage||b.parentResolvedDraws-a.parentResolvedDraws||a.parentCandidateId.localeCompare(b.parentCandidateId)||a.toValue-b.toValue);
 const ids=new Set<string>();return proposals.filter(p=>!ids.has(p.candidate.id)&&!!ids.add(p.candidate.id)).slice(0,maxVariants);
}
