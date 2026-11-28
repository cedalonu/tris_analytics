import type { Evaluation, PoolMethod } from "../research-core";
import type { InaContext, ResearchOutput } from "./ina-contracts";
import { createResearchOutput } from "./ina-contracts";
import { evaluatePool } from "../research-core";
import { createDefaultInaModuleRegistry, validateResearchOutputRegistration } from "./ina-registry";

export interface InaPoolEvaluationParameters {
  poolSize: number;
  windowSize: number;
  minTrain?: number;
  historyLimit?: number;
  methods?: PoolMethod[];
}

export interface InaPoolEvaluationKnowledge {
  poolSize: number;
  windowSize: number;
  minTrain: number;
  historyLimit: number;
  methods: PoolMethod[];
  evaluations: Evaluation[][];
}

/** Wraps the existing walk-forward engine without changing its evaluation logic. */
export function buildInaPoolEvaluation(
  context: InaContext,
  parameters: InaPoolEvaluationParameters,
): ResearchOutput<InaPoolEvaluationKnowledge> {
  if (!context.quality.valid) throw new Error("cannot evaluate pools from an invalid INA context");
  const poolSize = Math.max(1, Math.min(10, Math.floor(parameters.poolSize)));
  const windowSize = Math.max(1, Math.floor(parameters.windowSize));
  const minTrain = Math.max(1, Math.floor(parameters.minTrain ?? 30));
  const historyLimit = Math.max(minTrain + 1, Math.floor(parameters.historyLimit ?? 500));
  const methods = parameters.methods ?? ["frequency", "recent-frequency", "long-absence", "short-absence", "balanced"];
  const train = [...context.draws].slice(-historyLimit);
  const evaluations = Array.from({ length: 5 }, (_, position) =>
    methods.map(method => evaluatePool(train, position as 0 | 1 | 2 | 3 | 4, method, poolSize, minTrain, windowSize)),
  );
  const knowledge: InaPoolEvaluationKnowledge = {
    poolSize,
    windowSize,
    minTrain,
    historyLimit,
    methods: [...methods],
    evaluations,
  };
  const output = createResearchOutput(context, {
    outputId: "ina-pool-evaluation-" + poolSize + "-" + windowSize,
    outputKey: "research.pool-evaluation",
    moduleId: "pool-research",
    engineId: "pool-research-family",
    engineVersion: "1.0.0",
    parameters: { poolSize, windowSize, minTrain, historyLimit, methods: methods.join(",") },
    generatedAt: context.builtAt,
    evidence: {
      status: "backtested",
      phase: "validation",
      notes: ["Walk-forward evaluator sees only prior draws for each target.", "Historical evaluation is not prospective evidence and may be affected by selection."],
    },
    result: knowledge,
    warnings: [
      "Uniform reference k/10 is a descriptive baseline, not a guaranteed null model.",
      "Method selection after comparing historical hit rates is subject to selection bias.",
      "This output does not change or promote the primary forecast.",
    ],
  });
  const registration = validateResearchOutputRegistration(output, createDefaultInaModuleRegistry());
  if (!registration.valid) throw new Error("pool evaluation output rejected by INA registry: " + registration.errors.join("; "));
  return output;
}
