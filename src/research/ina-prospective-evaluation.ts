import type { Draw } from "../research-core";
import type { InaContext, ResearchOutput } from "./ina-contracts";
import { createResearchOutput } from "./ina-contracts";
import { createDefaultInaModuleRegistry, validateResearchOutputRegistration } from "./ina-registry";
import { auditProspectiveLedger } from "./prospective-ledger-audit";
import { buildProspectivePerformanceReport } from "./prospective-performance";
import { fingerprintCycleHistory, type FrozenLearningCycle, type ResolvedCycleSignal } from "./cycle-learning";
import type { FrozenForecast, ResolvedForecast } from "./intuition-prospective";

export interface InaProspectiveEvaluation {
  cycles: number;
  frozenForecasts: number;
  resolvedForecasts: number;
  pendingForecasts: number;
  lastFrozenTargetDrawId: number | null;
  lastResolvedTargetDrawId: number | null;
  ledgerAudit: ReturnType<typeof auditProspectiveLedger>;
  performance: ReturnType<typeof buildProspectivePerformanceReport>;
}

/** Adapt the append-only live learning-cycle ledger to the frozen-forecast evaluator.
 * Verifies each forecast against the exact pre-result prefix and each resolution against
 * the canonical draw before publishing descriptive performance by frozen configuration.
 */
export function buildInaProspectiveEvaluation(
  context: InaContext,
  cycles: FrozenLearningCycle[],
  resolutions: ResolvedCycleSignal[],
): ResearchOutput<InaProspectiveEvaluation> {
  if (!context.quality.valid) throw new Error("cannot evaluate prospective ledger from an invalid INA context");
  const draws = [...context.draws] as Draw[];
  const firstDrawId = draws[0]?.drawId ?? 0;
  const drawById = new Map(draws.map(draw => [draw.drawId, draw]));
  const forecasts: FrozenForecast[] = [];
  const cycleTargets = new Set<number>();
  const cycleIds = new Set<string>();
  for (const cycle of cycles) {
    if (cycleTargets.has(cycle.targetDrawId) || cycleIds.has(cycle.cycleId)) {
      throw new Error("duplicate frozen cycle target or cycle ID");
    }
    cycleTargets.add(cycle.targetDrawId);
    cycleIds.add(cycle.cycleId);
    if (cycle.historyThroughDrawId !== cycle.targetDrawId - 1) {
      throw new Error("cycle target is not exactly after its frozen history");
    }
    const prior = draws.filter(draw => draw.drawId <= cycle.historyThroughDrawId);
    if (prior.length !== cycle.historyThroughDrawId - firstDrawId + 1 ||
        prior.at(-1)?.drawId !== cycle.historyThroughDrawId ||
        fingerprintCycleHistory(prior) !== cycle.historySha256) {
      throw new Error("frozen cycle history fingerprint does not match the canonical pre-result prefix");
    }
    for (const signal of cycle.signals) {
      const forecast = signal.forecast;
      if (forecast.targetDrawId !== cycle.targetDrawId ||
          forecast.historyThroughDrawId !== cycle.historyThroughDrawId ||
          forecast.historySha256 !== cycle.historySha256 ||
          forecast.candidateId !== signal.candidateId) {
        throw new Error("frozen signal does not match its cycle identity or history");
      }
      forecasts.push(forecast);
    }
  }
  for (const resolution of resolutions) {
    const actual = drawById.get(resolution.targetDrawId);
    if (!actual) throw new Error("resolved prospective target is absent from canonical history: " + resolution.targetDrawId);
    if (resolution.actual !== actual.digits.join("")) {
      throw new Error("prospective resolution differs from canonical draw " + resolution.targetDrawId);
    }
    if (!cycleIds.has(resolution.cycleId)) {
      throw new Error("prospective resolution references an unknown frozen cycle");
    }
  }
  const ledgerAudit = auditProspectiveLedger(forecasts, resolutions as ResolvedForecast[]);
  if (ledgerAudit.summary.integrity === "invalid") {
    throw new Error("prospective frozen ledger integrity is invalid: " + ledgerAudit.issues.slice(0, 10).map(issue => issue.code).join(", "));
  }
  const performance = buildProspectivePerformanceReport(forecasts, resolutions as ResolvedForecast[]);
  const result: InaProspectiveEvaluation = {
    cycles: cycles.length,
    frozenForecasts: forecasts.length,
    resolvedForecasts: ledgerAudit.summary.resolved,
    pendingForecasts: ledgerAudit.summary.pending,
    lastFrozenTargetDrawId: forecasts.length ? Math.max(...forecasts.map(row => row.targetDrawId)) : null,
    lastResolvedTargetDrawId: resolutions.length ? Math.max(...resolutions.map(row => row.targetDrawId)) : null,
    ledgerAudit,
    performance,
  };
  const output = createResearchOutput(context, {
    outputId: "ina-prospective-evaluation-v1",
    outputKey: "research.prospective-evaluation",
    moduleId: "prospective-evaluator",
    engineId: "prospective-evaluation-family",
    engineVersion: "1.0.0",
    parameters: {
      ledger: "append-only data/cycles/cycles.jsonl + outcomes.jsonl",
      forecastHistory: "exact canonical prefix through targetDrawId - 1",
      performanceGrouping: "family + frozenConfig",
      resolution: "exact target draw and canonical result",
    },
    generatedAt: context.builtAt,
    evidence: {
      status: "descriptive",
      phase: "prospective",
      notes: [
        "Forecasts remain frozen; this adapter never recalculates predictions after results.",
        "Resolved outcomes are checked against the canonical draw at the exact target contest.",
        "Performance is grouped by exact family and frozen configuration; it is not a calibrated probability or profit estimate.",
      ],
    },
    result,
    warnings: [
      ...ledgerAudit.limitations,
      ...performance.limitations,
      "Only forecasts present in the append-only live cycle ledger are evaluated; missed contests are not backfilled.",
      "A current module status proves provenance and integrity, not predictive advantage.",
    ],
  });
  const registration = validateResearchOutputRegistration(output, createDefaultInaModuleRegistry());
  if (!registration.valid) throw new Error("prospective output rejected by INA registry: " + registration.errors.join("; "));
  return output;
}
