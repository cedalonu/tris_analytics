import type { InaContext, ResearchOutput } from "./ina-contracts";
import { createResearchOutput } from "./ina-contracts";
import { createDefaultInaModuleRegistry, validateResearchOutputRegistration } from "./ina-registry";

export interface InaTransitionStabilityRow {
  p: number;
  a: number;
  b: number;
  full: number;
  recent: number;
  delta: number;
}

export interface InaDigitEntropyRow {
  p: number;
  recent: number;
  previous: number;
  delta: number;
  recentCounts: number[];
  previousCounts: number[];
}

export interface InaTransitionStabilityKnowledge {
  recentDrawCount: number;
  previousDrawCount: number;
  recentStart: number | null;
  recentCutoff: number | null;
  previousStart: number | null;
  previousCutoff: number | null;
  stability: InaTransitionStabilityRow[];
  digitEntropy: InaDigitEntropyRow[];
}

function normalizedEntropy(counts: number[]): number {
  const total = counts.reduce((sum, count) => sum + count, 0);
  return total
    ? counts.reduce((entropy, count) => count ? entropy - (count / total) * Math.log10(count / total) : entropy, 0) / Math.log10(10)
    : 0;
}

/** Compares two adjacent, non-overlapping windows using descriptive rates and normalized entropy. */
export function buildInaTransitionStability(
  context: InaContext,
  recentWindow = 50,
  previousWindow = 50,
): ResearchOutput<InaTransitionStabilityKnowledge> {
  if (!context.quality.valid) throw new Error("cannot build transition stability from an invalid INA context");
  const recentSize = Math.max(1, Math.floor(recentWindow));
  const previousSize = Math.max(1, Math.floor(previousWindow));
  const recent = context.draws.slice(-recentSize);
  const previous = context.draws.slice(-(recentSize + previousSize), -recentSize);
  const countEdges = (draws: InaContext["draws"]) => {
    const matrix = Array.from({ length: 4 }, () => Array.from({ length: 10 }, () => Array(10).fill(0)));
    draws.forEach(draw => {
      for (let position = 0; position < 4; position++) matrix[position][draw.digits[position]][draw.digits[position + 1]]++;
    });
    return matrix;
  };
  const recentMatrix = countEdges(recent);
  const previousMatrix = countEdges(previous);
  const stability = Array.from({ length: 4 }, (_, position) =>
    Array.from({ length: 10 }, (_, fromDigit) =>
      Array.from({ length: 10 }, (_, toDigit) => ({
        p: position,
        a: fromDigit,
        b: toDigit,
        full: previousMatrix[position][fromDigit][toDigit],
        recent: recentMatrix[position][fromDigit][toDigit],
        delta: recentMatrix[position][fromDigit][toDigit] / Math.max(1, recent.length)
          - previousMatrix[position][fromDigit][toDigit] / Math.max(1, previous.length),
      })),
    ),
  ).flat(2).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const digitEntropy = Array.from({ length: 5 }, (_, position) => {
    const recentCounts = Array.from({ length: 10 }, (_, digit) => recent.filter(draw => draw.digits[position] === digit).length);
    const previousCounts = Array.from({ length: 10 }, (_, digit) => previous.filter(draw => draw.digits[position] === digit).length);
    const recentEntropy = normalizedEntropy(recentCounts);
    const previousEntropy = normalizedEntropy(previousCounts);
    return {
      p: position,
      recent: recentEntropy,
      previous: previousEntropy,
      delta: recentEntropy - previousEntropy,
      recentCounts,
      previousCounts,
    };
  });
  const result: InaTransitionStabilityKnowledge = {
    recentDrawCount: recent.length,
    previousDrawCount: previous.length,
    recentStart: recent[0]?.drawId ?? null,
    recentCutoff: recent.at(-1)?.drawId ?? null,
    previousStart: previous[0]?.drawId ?? null,
    previousCutoff: previous.at(-1)?.drawId ?? null,
    stability,
    digitEntropy,
  };
  const output = createResearchOutput(context, {
    outputId: "ina-transition-stability-" + recentSize + "-" + previousSize,
    outputKey: "research.transition-stability",
    moduleId: "positional-transitions",
    engineId: "positional-transition-family",
    engineVersion: "1.0.0",
    parameters: { recentWindow: recentSize, previousWindow: previousSize, comparison: "adjacent-non-overlapping" },
    generatedAt: context.builtAt,
    evidence: {
      status: "descriptive",
      phase: "observation",
      notes: ["Transition deltas compare normalized rates across adjacent windows.", "Digit entropy is descriptive dispersion, not predictive quality."],
    },
    result,
    warnings: [
      "The windows may have different sample sizes when the available history is shorter than their combined length.",
      "Many transition pairs are compared; apparent changes require separate calibration and out-of-sample validation.",
    ],
  });
  const registration = validateResearchOutputRegistration(output, createDefaultInaModuleRegistry());
  if (!registration.valid) throw new Error("transition stability output rejected by INA registry: " + registration.errors.join("; "));
  return output;
}
