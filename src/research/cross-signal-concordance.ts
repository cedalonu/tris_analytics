/**
 * Cross-family concordance ledger for TRIS.
 * Joins descriptive screens by target position/digit; it does not treat them
 * as independent evidence or generate forecasts.
 */
import type {Draw,Pos,Digit} from "../research-core";
import {analyzeSignalInteractions} from "./interaction-engine";
import {analyzeAdaptiveSignalMemory,type AdaptiveMemoryStatus} from "./adaptive-signal-memory";
import {analyzeRegimeConditionedMemory} from "./regime-conditioned-memory";
import {analyzeTemporalMemory} from "./temporal-memory";
import {analyzeContextualMemory} from "./contextual-memory";
import {analyzePositionAbsences} from "./absence-analysis";

export type SignalFamily="interaction"|"adaptive-memory"|"regime-memory"|"temporal-transition"|"contextual-memory";
export interface FamilyMarker {family:SignalFamily;detail:string;strength:"descriptive"|"repeated"|"mixed";support:number}
export interface CrossSignalRecord {
 position:Pos;
 digit:Digit;
 families:FamilyMarker[];
 familyCount:number;
 concordance:"multi-family"|"single-family"|"conflicting"|"no-screened-signal";
 conflictNotes:string[];
 adaptiveStatus:AdaptiveMemoryStatus|null;
 currentAbsence:number;
 absenceRate:number;
 interpretation:string;
}
export interface CrossSignalReport {
 drawCount:number;
 firstDrawId:number;
 lastDrawId:number;
 discoveryValidationHoldout:{discovery:number;validation:number;holdout:number};
 screenedRecords:number;
 records:CrossSignalRecord[];
 familyCounts:Record<SignalFamily,number>;
 warnings:string[];
}
const POSITIONS:Pos[]=[0,1,2,3,4],DIGITS:Digit[]=[0,1,2,3,4,5,6,7,8,9];
const key=(p:number,d:number)=>p+":"+d;
export function analyzeCrossSignalConcordance(draws:Draw[]):CrossSignalReport {
 if(draws.length<35)throw new Error("cross-signal analysis requires at least 35 contiguous draws");
 for(let i=0;i<draws.length;i++){
  const row=draws[i];
  if(!Number.isInteger(row.drawId)||row.drawId<=0||!Array.isArray(row.digits)||row.digits.length!==5||row.digits.some(x=>!Number.isInteger(x)||x<0||x>9))throw new Error("invalid draw at index "+i);
  if(i&&row.drawId!==draws[i-1].drawId+1)throw new Error("non-contiguous draw IDs");
 }
 const interaction=analyzeSignalInteractions(draws),adaptive=analyzeAdaptiveSignalMemory(draws);
 const regime=analyzeRegimeConditionedMemory(draws),temporal=analyzeTemporalMemory(draws),contextual=analyzeContextualMemory(draws);
 const markers=new Map<string,FamilyMarker[]>();
 const add=(p:number,d:number,m:FamilyMarker)=>{const k=key(p,d),list=markers.get(k)??[];if(list.filter(x=>x.family===m.family).length<3&&!list.some(x=>x.family===m.family&&x.detail===m.detail))list.push(m);markers.set(k,list);};
 for(const c of interaction.selected)add(c.position,c.digit,{family:"interaction",detail:c.features.join(" + "),strength:"descriptive",support:c.discovery.active});
 const adaptiveByKey=new Map<string,typeof adaptive.signals[number]>();
 for(const s of adaptive.signals){adaptiveByKey.set(key(s.position,s.digit),s);if(s.status==="emerging"||s.status==="strengthening"||s.status==="persistent"||s.status==="weakening")
  add(s.position,s.digit,{family:"adaptive-memory",detail:s.status,strength:s.positiveBlocks>=2?"repeated":"descriptive",support:s.blocks.reduce((n,b)=>n+b.active,0)});}
 for(const s of regime.memories){
  const favorable=s.blocks.filter(b=>b.state==="favorable"),unfavorable=s.blocks.filter(b=>b.state==="unfavorable");
  if(favorable.length)add(s.position,s.digit,{family:"regime-memory",detail:s.regime+"; "+favorable.length+" favorable block(s)",strength:s.favorableEpisodes>=2?"repeated":"descriptive",support:favorable.reduce((n,b)=>n+b.active,0)});
  if(unfavorable.length)add(s.position,s.digit,{family:"regime-memory",detail:s.regime+"; "+unfavorable.length+" unfavorable block(s)",strength:"mixed",support:unfavorable.reduce((n,b)=>n+b.active,0)});
 }
 const allScope=temporal.scopes.find(s=>s.scope==="all-history")!;
 for(const c of allScope.comparisons){
  for(const t of c.strongestTransitions)if(t.to>=0&&t.count>=5&&t.liftVsTargetMarginal>=1.25)
   add(c.targetPosition,t.to,{family:"temporal-transition",detail:"lag "+c.lag+" from R"+(c.sourcePosition+1)+" digit "+t.from+" (lift "+t.liftVsTargetMarginal.toFixed(2)+")",strength:"descriptive",support:t.count});
 }
 const contextScope=contextual.scopes.find(s=>s.scope==="all-history")!;
 for(const c of contextScope.comparisons)for(const bucket of c.buckets)for(const t of bucket.strongestTargetDigits)
  if(t.count>=3&&t.lift>=1.5)add(c.targetPosition,t.digit,{family:"contextual-memory",detail:c.context+"="+bucket.contextValue+", lag "+c.lag+" from R"+(c.sourcePosition+1)+" (lift "+t.lift.toFixed(2)+")",strength:"descriptive",support:t.count});
 const absence=new Map<string,{currentAbsence:number;rate:number}>();
 for(const p of POSITIONS)for(const d of analyzePositionAbsences(draws,p).digitReports)
  absence.set(key(p,d.digit),{currentAbsence:d.currentAbsence,rate:d.rate});
 const records:CrossSignalRecord[]=[];
 for(const p of POSITIONS)for(const d of DIGITS){
  const families=markers.get(key(p,d))??[],familySet=new Set(families.map(m=>m.family));
  const hasPositiveRegime=families.some(m=>m.family==="regime-memory"&&!m.detail.includes("unfavorable"));
  const hasNegativeRegime=families.some(m=>m.family==="regime-memory"&&m.detail.includes("unfavorable"));
  const adaptiveState=adaptiveByKey.get(key(p,d))?.status??null;
  const adaptiveWeak=adaptiveState==="weakening"||adaptiveState==="unstable";
  const conflictNotes:string[]=[];
  if(hasPositiveRegime&&hasNegativeRegime)conflictNotes.push("La señal muestra bloques favorables y desfavorables en distintos regímenes.");
  if(adaptiveWeak&&hasPositiveRegime)conflictNotes.push("La memoria adaptativa reciente no confirma de forma uniforme la evidencia histórica por régimen.");
  const count=familySet.size;
  const concordance:CrossSignalRecord["concordance"]=conflictNotes.length?"conflicting":count>=2?"multi-family":count===1?"single-family":"no-screened-signal";
  const a=absence.get(key(p,d))!;
  const interpretation=count>=2&&!conflictNotes.length?"Coincidencia descriptiva entre familias; requiere validación cronológica y prospectiva.":
   conflictNotes.length?"Hay señales contrapuestas o dependientes; no conviene resumirlas como consenso.":
   count===1?"Hallazgo aislado de una familia; evidencia insuficiente para una conclusión.":"Ninguna familia superó sus filtros descriptivos.";
  records.push({position:p,digit:d,families,familyCount:count,concordance,conflictNotes,adaptiveStatus:adaptiveState,currentAbsence:a.currentAbsence,absenceRate:a.rate,interpretation});
 }
 const familyCounts:Record<SignalFamily,number>={interaction:0,"adaptive-memory":0,"regime-memory":0,"temporal-transition":0,"contextual-memory":0};
 for(const r of records)for(const f of r.families)familyCounts[f.family]++;
 const n=draws.length-5,discovery=Math.floor(n*.6),validationEnd=Math.floor(n*.8),validation=validationEnd-discovery;
 return {drawCount:draws.length,firstDrawId:draws[0].drawId,lastDrawId:draws[draws.length-1].drawId,
  discoveryValidationHoldout:{discovery,validation,holdout:n-discovery-validation},
  screenedRecords:records.filter(r=>r.familyCount>0).length,records,familyCounts,
  warnings:[
   "This is a cross-family index, not an ensemble predictor, probability, ranking of winning digits, or betting recommendation.",
   "A family marker means a fixed descriptive screen crossed its reporting threshold; it is not a statistical confirmation.",
   "All-history temporal and contextual screens are exploratory and reuse the same draws as other analyses; agreement is not independent evidence.",
   "Adaptive and regime memories monitor interaction rules selected in discovery; their later blocks remain historical validation/holdout, not prospective replication.",
   "Absence and historical frequency are shown as context only; a long absence does not make a digit due.",
   "Conflicting markers are surfaced rather than averaged away. No weights, pools, forecasts, or evidence-ledger statuses are changed.",
   "No APIs, network calls, polling, or automatic downloads are used."
 ]};
}
