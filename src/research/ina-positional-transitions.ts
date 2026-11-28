import type { InaContext, ResearchOutput } from "./ina-contracts";
import { createResearchOutput } from "./ina-contracts";
import { createDefaultInaModuleRegistry, validateResearchOutputRegistration } from "./ina-registry";

export interface InaTransitionEdge {
  p: number;
  a: number;
  b: number;
  n: number;
  ratio: number;
  key: string;
  from: string;
  to: string;
}

export interface InaTransitionKnowledge {
  windowSize: number;
  sampleSize: number;
  drawStart: number | null;
  drawCutoff: number | null;
  expectedPerPair: number;
  maxCount: number;
  edges: InaTransitionEdge[];
  nodeCounts: number[][];
}

/** Adjacent-position transition counts over a single INA snapshot and trailing window. */
export function buildInaPositionalTransitions(
  context: InaContext,
  requestedWindow = 150,
): ResearchOutput<InaTransitionKnowledge> {
  if (!context.quality.valid) throw new Error("cannot build transitions from an invalid INA context");
  const windowSize = Math.max(1, Math.floor(requestedWindow));
  const draws = context.draws.slice(-windowSize);
  const sampleSize = draws.length;
  const matrix = Array.from({ length: 4 }, () => Array.from({ length: 10 }, () => Array(10).fill(0)));
  const nodeCounts = Array.from({ length: 5 }, () => Array(10).fill(0));
  for (const draw of draws) {
    for (let position = 0; position < 5; position++) nodeCounts[position][draw.digits[position]]++;
    for (let position = 0; position < 4; position++) matrix[position][draw.digits[position]][draw.digits[position + 1]]++;
  }
  const expectedPerPair = sampleSize / 100;
  const edges: InaTransitionEdge[] = matrix.flatMap((rows, position) =>
    rows.flatMap((row, fromDigit) => row.flatMap((count, toDigit) => count > 0 ? [{
      p: position,
      a: fromDigit,
      b: toDigit,
      n: count,
      ratio: expectedPerPair ? count / expectedPerPair : 0,
      key: position + "-" + fromDigit + "-" + toDigit,
      from: "R" + (position + 1) + "-" + fromDigit,
      to: "R" + (position + 2) + "-" + toDigit,
    }] : [])),
  );
  const knowledge: InaTransitionKnowledge = {
    windowSize,
    sampleSize,
    drawStart: draws[0]?.drawId ?? null,
    drawCutoff: draws.at(-1)?.drawId ?? null,
    expectedPerPair,
    maxCount: Math.max(1, ...edges.map(edge => edge.n)),
    edges,
    nodeCounts,
  };
  const output = createResearchOutput(context, {
    outputId: "ina-positional-transitions-" + windowSize,
    outputKey: "research.positional-transitions",
    moduleId: "positional-transitions",
    engineId: "positional-transition-family",
    engineVersion: "1.0.0",
    parameters: { windowSize, adjacency: "R1-R2-R3-R4-R5", normalization: "uniform-100-pairs-reference" },
    generatedAt: context.builtAt,
    evidence: {
      status: "descriptive",
      phase: "observation",
      notes: ["Edges are observed adjacent-position digit-pair counts.", "Uniform expected count is a rough descriptive reference, not a fitted null model."],
    },
    result: knowledge,
    warnings: [
      "Transition counts describe adjacency in the selected historical window; they do not establish causality.",
      "Observed/expected ratios use a uniform approximation and are not predictive probabilities.",
    ],
  });
  const registration = validateResearchOutputRegistration(output, createDefaultInaModuleRegistry());
  if (!registration.valid) throw new Error("transition output rejected by INA registry: " + registration.errors.join("; "));
  return output;
}
