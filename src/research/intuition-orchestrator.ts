/** Deterministic orchestration for the TRIS intuition research pipeline.
 * This module plans experiments only: it does not ingest draws, call APIs,
 * create outcomes, or infer evidence. Outcomes enter only through a separate
 * walk-forward evaluator supplied by the research runner.
 */
import {generateIntuitionCandidates, candidateToSignalRecord, type CandidateOptions, type IntuitionCandidate} from "./intuition-candidate-generator";
import {selectIntuitionCandidates, type PrioritizerOptions, type CandidateSelection} from "./intuition-prioritizer";
import type {SignalRecord} from "./intuition-ledger";
import type {EvaluationPhase, Observation, HypothesisEvaluation, EvaluatorOptions} from "./intuition-evaluator";
import {evaluateHypothesis} from "./intuition-evaluator";

export interface ResearchPlanOptions {
  createdAt:string;
  candidateOptions?:CandidateOptions;
  prioritizerOptions?:PrioritizerOptions;
  evaluatorOptions?:EvaluatorOptions;
}
export interface PlannedHypothesis {
  candidate:IntuitionCandidate;
  ledgerRecord:SignalRecord;
  frozenConfig:string;
  priorityScore:number;
  priorityReasons:string[];
}
export interface ResearchPlan {
  schemaVersion:"1.0";
  createdAt:string;
  catalogSize:number;
  selectedCount:number;
  budget:number;
  familyCounts:CandidateSelection["familyCounts"];
  hypotheses:PlannedHypothesis[];
  warnings:string[];
}
export interface HypothesisPhaseResult {
  hypothesisId:string;
  phase:EvaluationPhase;
  evaluation:HypothesisEvaluation;
}
export function createResearchPlan(options:ResearchPlanOptions):ResearchPlan {
  if(!Number.isFinite(Date.parse(options.createdAt))) throw new Error("valid createdAt timestamp required");
  const catalog=generateIntuitionCandidates(options.candidateOptions);
  const selection=selectIntuitionCandidates(catalog,options.prioritizerOptions);
  const priorityById=new Map(selection.ranking.map(p=>[p.candidateId,p]));
  const hypotheses=selection.selected.map(candidate=>{
    const priority=priorityById.get(candidate.id)!;
    return {
      candidate,
      ledgerRecord:candidateToSignalRecord(candidate,options.createdAt),
      frozenConfig:candidate.frozenConfig,
      priorityScore:priority.score,
      priorityReasons:priority.reasons
    };
  });
  return {
    schemaVersion:"1.0",createdAt:options.createdAt,catalogSize:catalog.length,
    selectedCount:hypotheses.length,budget:selection.budget,
    familyCounts:selection.familyCounts,hypotheses,
    warnings:[
      ...selection.warnings,
      "This plan contains hypotheses only; no TRIS draw data has been read or evaluated.",
      "Freeze candidate catalog, budget, family caps, baselines, and phase boundaries before outcome inspection.",
      "The runner must compute each candidate outcome using only information available before that draw.",
      "Discovery, validation, holdout, and prospective observations must remain separate and chronologically ordered."
    ]
  };
}
/** Evaluate one planned hypothesis on one explicitly selected phase. */
export function evaluatePlannedHypothesis(
  plan:ResearchPlan,hypothesisId:string,observations:Observation[],
  phase:EvaluationPhase,options:EvaluatorOptions={}
):HypothesisPhaseResult {
  const hypothesis=plan.hypotheses.find(h=>h.candidate.id===hypothesisId);
  if(!hypothesis) throw new Error("hypothesis not found in research plan: "+hypothesisId);
  // The caller must provide paired outcomes. Reject rows outside the requested phase
  // instead of silently mixing partitions.
  if(observations.some(row=>row.phase!==phase)) throw new Error("observations contain rows from a different phase");
  const testCount=options.testCount??plan.selectedCount;
  const evaluation=evaluateHypothesis(observations,phase,{...options,testCount});
  return {hypothesisId,phase,evaluation};
}
/** Stable JSON export for audit/version control; callers should persist the returned string. */
export function serializeResearchPlan(plan:ResearchPlan):string {
  return JSON.stringify(plan,null,2)+"\n";
}
