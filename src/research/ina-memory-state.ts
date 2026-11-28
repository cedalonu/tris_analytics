import type { Draw } from "../research-core";
import type { InaContext, ResearchOutput } from "./ina-contracts";
import { createResearchOutput } from "./ina-contracts";
import { createDefaultInaModuleRegistry, validateResearchOutputRegistration } from "./ina-registry";
import { analyzeTemporalMemory, type TemporalMemoryReport } from "./temporal-memory";
import { analyzeContextualMemory, type ContextualMemoryReport } from "./contextual-memory";

export interface InaMemoryKnowledge {
  temporal: TemporalMemoryReport;
  contextual: ContextualMemoryReport;
}

/** Combines lagged and context-conditioned memory summaries from the shared validated INA history. */
export function buildInaMemoryState(context: InaContext): ResearchOutput<InaMemoryKnowledge> {
  if (!context.quality.valid) throw new Error("cannot build memory state from an invalid INA context");
  const draws = [...context.draws] as Draw[];
  const result: InaMemoryKnowledge = {
    temporal: analyzeTemporalMemory(draws),
    contextual: analyzeContextualMemory(draws),
  };
  const output = createResearchOutput(context, {
    outputId: "ina-memory-state-v1",
    outputKey: "research.memory-state",
    moduleId: "memory-research",
    engineId: "research-memory-family",
    engineVersion: "1.0.0",
    parameters: {
      lags: "1-5 exact contest offsets",
      temporalScopes: "all-history,last-200,last-1000 when available",
      contextualDimensions: "source-pool-size,source-duplicate-count",
      minimumTransitionSupport: 5,
      minimumContextBucket: 20,
    },
    generatedAt: context.builtAt,
    evidence: {
      status: "descriptive",
      phase: "observation",
      notes: [
        "Temporal and contextual dependencies are computed only from the validated chronological history.",
        "All-history and trailing scopes are descriptive screens, not independent replications.",
        "No forecast, pool adjustment, or hypothesis promotion is produced.",
      ],
    },
    result,
    warnings: [
      ...result.temporal.warnings,
      ...result.contextual.warnings,
      "Multiple lag, position, and context comparisons create selection and multiplicity risks.",
      "Memory metrics require predeclared chronological holdout and prospective replication before predictive interpretation.",
    ],
  });
  const registration = validateResearchOutputRegistration(output, createDefaultInaModuleRegistry());
  if (!registration.valid) throw new Error("memory output rejected by INA registry: " + registration.errors.join("; "));
  return output;
}
