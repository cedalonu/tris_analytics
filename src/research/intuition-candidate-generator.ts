/** Deterministic hypothesis templates that bridge TRIS analyses into the intuition ledger.
 * Candidate generation is data-independent: it creates testable ideas, not findings.
 * Generated candidates must be evaluated with chronological splits and frozen configs.
 */
import type { SignalRecord } from "./intuition-ledger";

export type CandidateFamily = "transition"|"position-mutation"|"absence-return"|"pool-ranking";
export interface CandidateConfig {
  family:CandidateFamily;
  mode?:string;
  lag?:1|2|3|4|5;
  position?:0|1|2|3|4;
  priorMisses?:number;
  method?:string;
  poolSize?:number;
  window?:number;
}
export interface IntuitionCandidate {
  id:string;
  family:CandidateFamily;
  title:string;
  description:string;
  config:CandidateConfig;
  frozenConfig:string;
}
const safeId=(parts:string[])=>parts.join("-").toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
const canonical=(config:CandidateConfig)=>JSON.stringify(config,Object.keys(config).sort());

export interface CandidateOptions {
  modes?:string[];
  lags?:(1|2|3|4|5)[];
  positions?:(0|1|2|3|4)[];
  absenceThresholds?:number[];
  poolMethods?:string[];
  poolSizes?:number[];
  windows?:number[];
  includePools?:boolean;
}
const defaults:Required<CandidateOptions>={
 modes:["full5","last4","last3","first2","last2","firstLast"],
 lags:[1,2,3,4,5],
 positions:[0,1,2,3,4],
 absenceThresholds:[0,1,2,3,5,8,13,20],
 poolMethods:["frequency","long-absence","short-absence","balanced","recent-frequency"],
 poolSizes:[1,2,3,4,5,6,7,8,9,10],
 windows:[20,50,100,200],
 includePools:true
};
/** Creates a deterministic, deduplicated catalog of candidate signals. */
export function generateIntuitionCandidates(options:CandidateOptions={}):IntuitionCandidate[] {
 const o={...defaults,...options},out:IntuitionCandidate[]=[];
 const add=(family:CandidateFamily,title:string,config:CandidateConfig,description:string)=>{
  const frozenConfig=canonical(config),id=safeId([family,...Object.entries(config).map(([k,v])=>`${k}-${v}`)]);
  if(!out.some(c=>c.id===id))out.push({id,family,title,description,config,frozenConfig});
 };
 for(const mode of o.modes)for(const lag of o.lags){
  const config:CandidateConfig={family:"transition",mode,lag};
  add("transition",`${mode} transition at lag ${lag}`,config,"Test whether outcome transitions conditioned on this lag outperform a simple historical/chance baseline in chronological validation.");
 }
 for(const position of o.positions)for(const lag of o.lags){
  const config:CandidateConfig={family:"position-mutation",position,lag};
  add("position-mutation",`Position ${position+1} mutation at lag ${lag}`,config,"Test position-specific digit mutation patterns at this lag against the position baseline.");
 }
 for(const position of o.positions)for(const priorMisses of o.absenceThresholds){
  const config:CandidateConfig={family:"absence-return",position,priorMisses};
  add("absence-return",`Position ${position+1} return after ${priorMisses} prior misses`,config,"Test conditional return frequency at this prior absence length against the uniform 10% reference; absence is not interpreted as due.");
 }
 if(o.includePools)for(const position of o.positions)for(const method of o.poolMethods)for(const poolSize of o.poolSizes)for(const window of o.windows){
  const config:CandidateConfig={family:"pool-ranking",position,method,poolSize,window};
  add("pool-ranking",`Position ${position+1} ${method} pool size ${poolSize} window ${window}`,config,"Evaluate the ranked pool in chronological walk-forward tests against uniform and fixed-history baselines.");
 }
 return out;
}
/** Initialize an evidence-free ledger record. Stable IDs/config fingerprints support reproducibility. */
export function candidateToSignalRecord(candidate:IntuitionCandidate,createdAt:string):SignalRecord {
 if(!Number.isFinite(Date.parse(createdAt)))throw new Error("valid creation timestamp required");
 return {id:candidate.id,description:candidate.description,status:"hypothesis",evidence:[],createdAt,updatedAt:createdAt,frozenConfig:candidate.frozenConfig};
}
