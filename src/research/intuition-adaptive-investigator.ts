/** Evidence-guided TRIS investigator. Uses only resolved outcomes strictly before the next target draw. */
import type {IntuitionCandidate,CandidateFamily} from "./intuition-candidate-generator";
import {scoreIntuitionCandidate} from "./intuition-prioritizer";
import type {ResolvedCycleSignal} from "./cycle-learning";
export interface AdaptiveInvestigatorOptions {beforeDrawId:number;budget?:number;familyCaps?:Partial<Record<CandidateFamily,number>>;explorationFraction?:number;priorStrength?:number;recentWindow?:number;retiredCandidateIds?:string[];}
export interface AdaptiveSelectedCandidate {candidate:IntuitionCandidate;priorityScore:number;priorityReasons:string[];}
export interface AdaptiveCandidateStats {candidateId:string;family:CandidateFamily;resolvedDraws:number;pairedWins:number;pairedLosses:number;shrunkAdvantage:number;recentAdvantage:number;schedulingScore:number;retired:boolean;}
export interface AdaptiveInvestigatorResult {beforeDrawId:number;catalogSize:number;budget:number;selected:AdaptiveSelectedCandidate[];familyCounts:Record<CandidateFamily,number>;explorationCount:number;exploitationCount:number;retiredExcluded:number;stats:AdaptiveCandidateStats[];warnings:string[];}
const FAMILIES:CandidateFamily[]=["transition","position-mutation","absence-return","pool-ranking"];
export function selectAdaptiveIntuitionCandidates(candidates:IntuitionCandidate[],outcomes:ResolvedCycleSignal[],options:AdaptiveInvestigatorOptions):AdaptiveInvestigatorResult {
 if(!Number.isInteger(options.beforeDrawId)||options.beforeDrawId<1)throw new Error("beforeDrawId must be a positive contest ID");
 const budget=Math.max(0,Math.floor(options.budget??100)),explorationFraction=options.explorationFraction??.5;
 const priorStrength=options.priorStrength??20,recentWindow=Math.max(1,Math.floor(options.recentWindow??25));
 if(!Number.isFinite(explorationFraction)||explorationFraction<0||explorationFraction>1)throw new Error("explorationFraction must be between 0 and 1");
 if(!Number.isFinite(priorStrength)||priorStrength<=0)throw new Error("priorStrength must be positive");
 const candidateById=new Map(candidates.map(c=>[c.id,c]));
 if(candidateById.size!==candidates.length)throw new Error("candidate catalog contains duplicate IDs");
 const history=new Map<string,ResolvedCycleSignal[]>(),seen=new Set<string>();
 for(const row of outcomes) {
  if(row.targetDrawId>=options.beforeDrawId)throw new Error("future or target-draw outcome cannot influence candidate selection");
  const candidate=candidateById.get(row.candidateId);if(!candidate)continue;
  if(candidate.frozenConfig!==row.frozenConfig)throw new Error("candidate configuration differs from frozen historical evidence: "+row.candidateId);
  const key=row.candidateId+"|"+row.targetDrawId;if(seen.has(key))throw new Error("duplicate candidate outcome for contest "+key);seen.add(key);
  const rows=history.get(row.candidateId)??[];rows.push(row);history.set(row.candidateId,rows);
 }
 for(const rows of history.values())rows.sort((a,b)=>a.targetDrawId-b.targetDrawId);
 const retired=new Set(options.retiredCandidateIds??[]);
 const stats:AdaptiveCandidateStats[]=candidates.map(candidate=>{
  const rows=history.get(candidate.id)??[],wins=rows.filter(r=>r.candidateHit&&!r.baselineHit).length,losses=rows.filter(r=>!r.candidateHit&&r.baselineHit).length;
  const recent=rows.slice(-recentWindow),recentWins=recent.filter(r=>r.candidateHit&&!r.baselineHit).length,recentLosses=recent.filter(r=>!r.candidateHit&&r.baselineHit).length;
  return {candidateId:candidate.id,family:candidate.family,resolvedDraws:rows.length,pairedWins:wins,pairedLosses:losses,shrunkAdvantage:(wins-losses)/(rows.length+priorStrength),recentAdvantage:(recentWins-recentLosses)/(recent.length+10),schedulingScore:scoreIntuitionCandidate(candidate).score,retired:retired.has(candidate.id)};
 });
 const statById=new Map(stats.map(s=>[s.candidateId,s]));
 const defaultCap=Math.ceil(budget/4);
 const caps:Record<CandidateFamily,number>={transition:defaultCap,"position-mutation":defaultCap,"absence-return":defaultCap,"pool-ranking":defaultCap,...options.familyCaps};
 const counts:Record<CandidateFamily,number>={transition:0,"position-mutation":0,"absence-return":0,"pool-ranking":0};
 const selected:AdaptiveSelectedCandidate[]=[],selectedIds=new Set<string>();let explorationCount=0,exploitationCount=0;
 const byFamily=new Map(FAMILIES.map(f=>[f,candidates.filter(c=>c.family===f&&!retired.has(c.id))]));
 const add=(candidate:IntuitionCandidate,kind:"exploration"|"exploitation")=>{
  if(selectedIds.has(candidate.id))return;
  const stat=statById.get(candidate.id)!,base=scoreIntuitionCandidate(candidate);
  const score=kind==="exploration"?1000-stat.resolvedDraws+base.score/1000:100*(stat.shrunkAdvantage+.25*stat.recentAdvantage)+base.score/1000;
  const reasons=kind==="exploration"?["Exploración: "+stat.resolvedDraws+" concursos resueltos; se prioriza cubrir configuraciones menos observadas.",...base.reasons]:["Explotación investigativa: ventaja pareada contra baseline con contracción; "+stat.resolvedDraws+" concursos, "+stat.pairedWins+" victorias y "+stat.pairedLosses+" derrotas pareadas.","Ventaja reciente contraída: "+stat.recentAdvantage.toFixed(4)+".",...base.reasons];
  selected.push({candidate,priorityScore:score,priorityReasons:reasons});selectedIds.add(candidate.id);counts[candidate.family]++;
  if(kind==="exploration")explorationCount++;else exploitationCount++;
 };
 for(const family of FAMILIES) {
  const cap=Math.max(0,Math.floor(caps[family]??0)),group=byFamily.get(family)??[];
  const exploitQuota=Math.min(cap,Math.floor(cap*(1-explorationFraction))),exploreQuota=cap-exploitQuota;
  const exploitRanked=[...group].sort((a,b)=>{
   const x=statById.get(a.id)!,y=statById.get(b.id)!;
   return (100*(y.shrunkAdvantage+.25*y.recentAdvantage)+y.schedulingScore/1000)-(100*(x.shrunkAdvantage+.25*x.recentAdvantage)+x.schedulingScore/1000)||a.id.localeCompare(b.id);
  });
  for(const candidate of exploitRanked.slice(0,exploitQuota))add(candidate,"exploitation");
  const exploreRanked=group.filter(c=>!selectedIds.has(c.id)).sort((a,b)=>{
   const x=statById.get(a.id)!,y=statById.get(b.id)!;
   return x.resolvedDraws-y.resolvedDraws||y.schedulingScore-x.schedulingScore||a.id.localeCompare(b.id);
  });
  for(const candidate of exploreRanked.slice(0,exploreQuota))add(candidate,"exploration");
  const remaining=cap-counts[family];
  if(remaining>0)for(const candidate of group.filter(c=>!selectedIds.has(c.id)).sort((a,b)=>statById.get(b.id)!.schedulingScore-statById.get(a.id)!.schedulingScore||a.id.localeCompare(b.id)).slice(0,remaining))add(candidate,"exploration");
 }
 return {beforeDrawId:options.beforeDrawId,catalogSize:candidates.length,budget,selected,familyCounts:counts,explorationCount,exploitationCount,retiredExcluded:stats.filter(s=>s.retired).length,stats,warnings:["Solo se usaron resultados resueltos con targetDrawId menor que beforeDrawId; se rechaza cualquier fuga temporal.","La mitad aproximada de cada cuota familiar explora candidatos poco observados; el resto prioriza ventajas pareadas históricas con contracción.","Los puntajes asignan presupuesto de investigación; no son probabilidades ni evidencia de rentabilidad.","Cada pronóstico del siguiente concurso se congela antes de conocer su resultado y nunca se reescribe."]};
}
