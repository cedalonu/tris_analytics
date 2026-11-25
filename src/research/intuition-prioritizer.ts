/** Transparent research-budget selector. It prioritizes testability and diversity,
 * not predictive performance. Scores are scheduling heuristics only.
 */
import type { IntuitionCandidate, CandidateFamily } from "./intuition-candidate-generator";
export interface CandidatePriority { candidateId:string; score:number; reasons:string[]; family:CandidateFamily; }
export interface PrioritizerOptions {
 maxCandidates?:number;
 familyCaps?:Partial<Record<CandidateFamily,number>>;
 familyOrder?:CandidateFamily[];
}
export interface CandidateSelection {
 selected:IntuitionCandidate[];
 ranking:CandidatePriority[];
 skipped:IntuitionCandidate[];
 budget:number;
 familyCounts:Record<CandidateFamily,number>;
 warnings:string[];
}
const FAMILIES:CandidateFamily[]=["transition","position-mutation","absence-return","pool-ranking"];
/** Scheduling score: prefer lower-complexity/easier-to-interpret tests; never reads draw outcomes. */
export function scoreIntuitionCandidate(c:IntuitionCandidate):CandidatePriority{
 const cfg=c.config,reasons:string[]=[];let score=50;
 if(cfg.lag!==undefined){score+=cfg.lag===1?12:cfg.lag===2?7:cfg.lag===3?4:cfg.lag===4?2:1;reasons.push(cfg.lag===1?"lag 1 is simplest temporal comparison":cfg.lag===2?"lag 2 prioritized after lag 1":cfg.lag===3?"lag 3 is exploratory":cfg.lag===4?"lag 4 is lower-priority extended memory":"lag 5 is the longest initial lag and lowest priority");}
 if(cfg.position!==undefined){score+=2;reasons.push("position-specific design");}
 if(cfg.priorMisses!==undefined){score+=cfg.priorMisses<=3?8:cfg.priorMisses<=8?4:0;reasons.push(cfg.priorMisses<=3?"short absence strata prioritized to reduce sparse samples":"long absence strata are lower priority due to sparse conditioning");}
 if(cfg.poolSize!==undefined){score+=cfg.poolSize<=3?9:cfg.poolSize<=5?5:cfg.poolSize<=7?2:0;reasons.push(cfg.poolSize<=3?"small pools are easier to interpret":"larger pools are lower priority in the initial budget");}
 if(cfg.window!==undefined){score+=cfg.window===50?8:cfg.window===100?6:cfg.window===20?3:1;reasons.push(cfg.window===50?"moderate window prioritized as initial reference":"alternate window kept for robustness checks");}
 if(cfg.method==="frequency"){score+=3;reasons.push("simple frequency method is an interpretable benchmark candidate");}
 return {candidateId:c.id,score,family:c.family,reasons};
}
/** Score within each family, then round-robin families to prevent pool candidates monopolizing budget. */
export function selectIntuitionCandidates(candidates:IntuitionCandidate[],options:PrioritizerOptions={}):CandidateSelection{
 const budget=Math.max(0,Math.floor(options.maxCandidates??100));
 const caps:Record<CandidateFamily,number>={transition:budget,"position-mutation":budget,"absence-return":budget,"pool-ranking":budget,...options.familyCaps};
 const familyOrder=options.familyOrder??FAMILIES;
 const ranking=candidates.map(scoreIntuitionCandidate).sort((a,b)=>b.score-a.score||familyOrder.indexOf(a.family)-familyOrder.indexOf(b.family)||a.candidateId.localeCompare(b.candidateId));
 const byId=new Map(candidates.map(c=>[c.id,c]));
 const groups=new Map<CandidateFamily,CandidatePriority[]>();
 for(const family of familyOrder)groups.set(family,ranking.filter(r=>r.family===family));
 const counts:Record<CandidateFamily,number>={transition:0,"position-mutation":0,"absence-return":0,"pool-ranking":0};
 const selected:IntuitionCandidate[]=[],selectedIds=new Set<string>();
 let progressed=true;
 while(selected.length<budget&&progressed){progressed=false;
  for(const family of familyOrder){if(selected.length>=budget)break;
   const cap=Math.max(0,Math.floor(caps[family]??budget));if(counts[family]>=cap)continue;
   const next=(groups.get(family)||[]).find(p=>!selectedIds.has(p.candidateId));if(!next)continue;
   const c=byId.get(next.candidateId);if(!c)continue;
   selected.push(c);selectedIds.add(c.id);counts[family]++;progressed=true;
  }
 }
 const skipped=candidates.filter(c=>!selectedIds.has(c.id));
 return {selected,ranking,skipped,budget,familyCounts:counts,warnings:[
  "Priority scores are research-scheduling heuristics, not predictive scores or calibrated probabilities.",
  "Candidate priority does not use historical outcomes; evidence is only added after a separate evaluation.",
  "Families are round-robin allocated to avoid a large pool catalog monopolizing the initial budget.",
  "Family caps and budgets are applied before any results are known; do not retrospectively change them to favor winners."
 ]};
}
