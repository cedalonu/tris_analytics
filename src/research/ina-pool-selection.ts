import type { PoolMethod } from "../research-core";
import { buildPool } from "../research-core";
import type { InaContext, ResearchOutput } from "./ina-contracts";
import { createResearchOutput } from "./ina-contracts";
import { buildInaPoolEvaluation } from "./ina-pool-evaluation";
import { createDefaultInaModuleRegistry, validateResearchOutputRegistration } from "./ina-registry";

export type InaPoolSelectionMethod = PoolMethod | "adaptive";

export interface InaPoolSelectionParameters {
  poolSize: number;
  windowSize: number;
  method: InaPoolSelectionMethod;
  minTrain?: number;
  historyLimit?: number;
}

export interface InaPoolCandidateCombination {
  digits: number[];
  score: number;
}

export interface InaPoolSelectionKnowledge {
  poolSize: number;
  windowSize: number;
  method: InaPoolSelectionMethod;
  selectedMethods: PoolMethod[];
  pools: number[][];
  primary: string;
  combinations: InaPoolCandidateCombination[];
  historyCount: number;
}

/** Creates the unchanged base pools from the INA snapshot and existing research methods. */
export function buildInaPoolSelection(
  context: InaContext,
  parameters: InaPoolSelectionParameters,
): ResearchOutput<InaPoolSelectionKnowledge> {
  if (!context.quality.valid) throw new Error("cannot select pools from an invalid INA context");
  const poolSize = Math.max(1, Math.min(10, Math.floor(parameters.poolSize)));
  const windowSize = Math.max(1, Math.floor(parameters.windowSize));
  const minTrain = Math.max(1, Math.floor(parameters.minTrain ?? 30));
  const historyLimit = Math.max(minTrain + 1, Math.floor(parameters.historyLimit ?? 500));
  const methods: PoolMethod[] = ["frequency", "recent-frequency", "long-absence", "short-absence", "balanced"];
  const evaluation = buildInaPoolEvaluation(context, { poolSize, windowSize, minTrain, historyLimit, methods });
  const selectedMethods = evaluation.result.evaluations.map(rows =>
    parameters.method === "adaptive"
      ? [...rows].sort((a, b) => b.hitRate - a.hitRate)[0].method
      : parameters.method,
  );
  const train = [...context.draws].slice(-historyLimit);
  const pools = selectedMethods.map((method, position) =>
    buildPool(train.map(draw => draw.digits[position]), method, poolSize, windowSize),
  );
  const primary = pools.map(pool => pool[0]).join("");
  const combinations = Array.from({ length: poolSize ** 5 }, (_, index) => {
    let remaining = index;
    const digits: number[] = [];
    for (let position = 0; position < 5; position++) {
      digits.push(pools[position][remaining % poolSize]);
      remaining = Math.floor(remaining / poolSize);
    }
    const score = digits.reduce((sum, digit, position) => sum + (poolSize - pools[position].indexOf(digit)), 0);
    return { digits, score };
  }).sort((a, b) => b.score - a.score || a.digits.join("").localeCompare(b.digits.join(""))).slice(0, 12);

  const output = createResearchOutput(context, {
    outputId: "ina-pool-selection-" + poolSize + "-" + windowSize + "-" + parameters.method,
    outputKey: "research.pool-selection",
    moduleId: "pool-research",
    engineId: "pool-research-family",
    engineVersion: "1.0.0",
    parameters: { poolSize, windowSize, minTrain, historyLimit, method: parameters.method },
    generatedAt: context.builtAt,
    evidence: {
      status: "exploratory",
      phase: "exploration",
      notes: [
        "Pools preserve the existing selection algorithms; adaptive mode selects the highest retrospective hit rate by position.",
        "Candidate combinations are ranked by pool-member rank, not by calibrated probability.",
        "The experimental aging overlay is intentionally excluded from this base output.",
      ],
    },
    result: {
      poolSize,
      windowSize,
      method: parameters.method,
      selectedMethods,
      pools,
      primary,
      combinations,
      historyCount: train.length,
    },
    warnings: [
      "Adaptive selection based on historical hit rate is exposed to selection bias and overfitting.",
      "A ranked pool is not a probability estimate and does not change the draw's randomness.",
      "The separate aging overlay remains experimental and is not merged into the base method.",
    ],
  });
  const registration = validateResearchOutputRegistration(output, createDefaultInaModuleRegistry());
  if (!registration.valid) throw new Error("pool selection output rejected by INA registry: " + registration.errors.join("; "));
  return output;
}
