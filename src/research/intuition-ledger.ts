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
 if(valN>=100&&diff!==null&&diff>0&&wilsonLower(valHits,valN)>baselineRate)status='provisional';
 if(prospective.length){
  const pn=prospective.reduce((s,e)=>s+e.n,0),ph=prospective.reduce((s,e)=>s+e.hits,0);
  const pbn=prospective.reduce((s,e)=>s+e.baselineN,0),pbh=prospective.reduce((s,e)=>s+e.baselineHits,0);
  if(pn>=100&&pbn>0&&ph/pn>pbh/pbn&&wilsonLower(ph,pn)>pbh/pbn)status='active';
  else if(status==='provisional')status='weakening';
  reasons.push('Prospective evidence evaluated separately from historical validation.');
 }
 if(status==='provisional')reasons.push('Historical validation is positive with conservative uncertainty bound; prospective confirmation still required.');
 if(status==='active')reasons.push('Prospective performance meets conservative criteria versus baseline; continue monitoring, not a guarantee.');
 if(status==='weakening')reasons.push('Prospective evidence did not maintain provisional advantage.');
 if(!prospective.length&&status==='provisional')reasons.push('Do not label active until a frozen prospective test confirms it.');
 return {status,signalRate,baselineRate,difference:diff,n:valN,reasons};
}
/** Creates an append-only evidence record; rejects malformed or negative evidence counts. */
export function appendEvidence(record:SignalRecord,evidence:SignalEvidence):SignalRecord {
 if(!evidence.id||!Number.isFinite(Date.parse(evidence.evaluatedAt)))throw new Error('evidence ID and valid timestamp required');
 for(const k of ['n','hits','baselineN','baselineHits'] as const){
  if(!Number.isInteger(evidence[k])||evidence[k]<0)throw new Error('evidence counts must be nonnegative integers');
 }
 if(evidence.hits>evidence.n||evidence.baselineHits>evidence.baselineN)throw new Error('hits cannot exceed sample size');
 if(record.evidence.some(e=>e.id===evidence.id))throw new Error('evidence ID already exists');
 return {...record,evidence:[...record.evidence,evidence],updatedAt:evidence.evaluatedAt};
}
