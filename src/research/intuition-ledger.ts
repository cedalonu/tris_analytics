/** Evidence ledger primitives: tracks signal history without claiming predictive certainty. */
export type SignalStatus = 'hypothesis'|'testing'|'provisional'|'active'|'weakening'|'retired';
export type EvidencePhase = 'exploration'|'validation'|'prospective';
export interface SignalEvidence {
  id:string;
  phase:EvidencePhase;
  evaluatedAt:string;
  n:number;
  hits:number;
  baselineHits:number;
  baselineN:number;
  discordantCandidateWins?:number;
  discordantBaselineWins?:number;
  testCount?:number;
  notes?:string;
}
export interface SignalRecord {
  id:string;
  description:string;
  status:SignalStatus;
  evidence:SignalEvidence[];
  createdAt:string;
  updatedAt:string;
  frozenConfig?:string;
}
export interface SignalAssessment {
  status:SignalStatus;
  signalRate:number|null;
  baselineRate:number|null;
  difference:number|null;
  n:number;
  reasons:string[];
}
/** Wilson score lower bound for observed hit rate. */
export function wilsonLower(hits:number,n:number,z=1.96):number {
 if(!Number.isInteger(hits)||!Number.isInteger(n)||n<0||hits<0||hits>n)throw new Error('invalid hit counts');
 if(n===0)return 0;
 const p=hits/n,z2=z*z,den=1+z2/n;
 return (p+z2/(2*n)-z*Math.sqrt((p*(1-p)+z2/(4*n))/n))/den;
}
function binomPmf(k:number,n:number):number{
 let log=0;for(let i=1;i<=k;i++)log+=Math.log(n-i+1)-Math.log(i);
 return Math.exp(log-n*Math.log(2));
}
function exactMcNemar(a:number,b:number):number{
 const n=a+b;if(!n)return 1;
 const observed=binomPmf(Math.min(a,b),n);let p=0;
 for(let k=0;k<=n;k++)if(binomPmf(k,n)<=observed+1e-12)p+=binomPmf(k,n);
 return Math.min(1,p);
}
function pairedLower(wins:number,losses:number,n:number):number{
 if(!n)return -1;
 const d=(wins-losses)/n,variance=Math.max(0,(wins+losses)/n-d*d);
 return d-1.96*Math.sqrt(variance/n);
}
function pairedEvidencePass(rows:SignalEvidence[]):boolean{
 const wins=rows.reduce((s,e)=>s+(e.discordantCandidateWins??0),0);
 const losses=rows.reduce((s,e)=>s+(e.discordantBaselineWins??0),0);
 const n=rows.reduce((s,e)=>s+e.n,0);
 const testCount=Math.max(1,...rows.map(e=>e.testCount??1));
 const adjustedP=Math.min(1,exactMcNemar(wins,losses)*testCount);
 return pairedLower(wins,losses,n)>0&&adjustedP<=.05;
}
/** Assessment is deliberately conservative. Exploration alone cannot promote a signal. */
export function assessSignal(record:SignalRecord):SignalAssessment {
 const validation=record.evidence.filter(e=>e.phase==='validation');
 const prospective=record.evidence.filter(e=>e.phase==='prospective');
 const reasons:string[]=[];
 if(!validation.length)reasons.push('No separate validation evidence yet.');
 const valN=validation.reduce((s,e)=>s+e.n,0),valHits=validation.reduce((s,e)=>s+e.hits,0);
 const baseN=validation.reduce((s,e)=>s+e.baselineN,0),baseHits=validation.reduce((s,e)=>s+e.baselineHits,0);
 const signalRate=valN?valHits/valN:null,baselineRate=baseN?baseHits/baseN:null;
 const diff=signalRate!==null&&baselineRate!==null?signalRate-baselineRate:null;
 let status:SignalStatus='hypothesis';
 if(validation.length)status='testing';
 const validationPass=valN>=100&&baseN>0&&diff!==null&&diff>0&&
  wilsonLower(valHits,valN)>baselineRate&&pairedEvidencePass(validation);
 if(validationPass)status='provisional';
 else if(valN>=100)reasons.push('Validation has not passed the paired uncertainty and multiplicity-adjusted significance gates.');
 if(prospective.length){
  const pn=prospective.reduce((s,e)=>s+e.n,0),ph=prospective.reduce((s,e)=>s+e.hits,0);
  const pbn=prospective.reduce((s,e)=>s+e.baselineN,0),pbh=prospective.reduce((s,e)=>s+e.baselineHits,0);
  const prospectivePass=pn>=100&&pbn>0&&ph/pn>pbh/pbn&&
   wilsonLower(ph,pn)>pbh/pbn&&pairedEvidencePass(prospective);
  if(status==='provisional'&&prospectivePass)status='active';
  else if(status==='provisional')status='weakening';
  reasons.push('Prospective evidence is assessed separately with paired testing and multiplicity correction.');
 }
 if(status==='provisional')reasons.push('Historical validation passed conservative gates; prospective confirmation is still required.');
 if(status==='active')reasons.push('Validation and prospective evidence passed conservative gates; continue monitoring, not a guarantee.');
 if(status==='weakening')reasons.push('Prospective evidence did not maintain the validated advantage.');
 if(!prospective.length&&status==='provisional')reasons.push('Do not label active until frozen prospective evidence confirms it.');
 return {status,signalRate,baselineRate,difference:diff,n:valN,reasons};
}
/** Creates an append-only evidence record; rejects malformed or negative evidence counts. */
export function appendEvidence(record:SignalRecord,evidence:SignalEvidence):SignalRecord {
 if(!evidence.id||!Number.isFinite(Date.parse(evidence.evaluatedAt)))throw new Error('evidence ID and valid timestamp required');
 for(const k of ['n','hits','baselineN','baselineHits'] as const){
  if(!Number.isInteger(evidence[k])||evidence[k]<0)throw new Error('evidence counts must be nonnegative integers');
 }
 if(evidence.hits>evidence.n||evidence.baselineHits>evidence.baselineN)throw new Error('hits cannot exceed sample size');
 for(const k of ['discordantCandidateWins','discordantBaselineWins'] as const)if(evidence[k]!==undefined&&(!Number.isInteger(evidence[k])||evidence[k]!<0||evidence[k]!>evidence.n))throw new Error('discordant counts must be nonnegative and within sample size');
 if(evidence.discordantCandidateWins!==undefined&&evidence.discordantBaselineWins!==undefined&&evidence.discordantCandidateWins+evidence.discordantBaselineWins>evidence.n)throw new Error('discordant outcomes cannot exceed sample size');
 if(evidence.testCount!==undefined&&(!Number.isInteger(evidence.testCount)||evidence.testCount<1))throw new Error('testCount must be a positive integer');
 if(record.evidence.some(e=>e.id===evidence.id))throw new Error('evidence ID already exists');
 return {...record,evidence:[...record.evidence,evidence],updatedAt:evidence.evaluatedAt};
}
