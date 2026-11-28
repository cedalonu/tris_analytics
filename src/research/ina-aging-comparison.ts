import type { Draw, Pos } from "../research-core";
import type { InaContext, ResearchOutput } from "./ina-contracts";
import { createResearchOutput } from "./ina-contracts";
import { createDefaultInaModuleRegistry, validateResearchOutputRegistration } from "./ina-registry";

export interface InaRankedDigit {
  digit: number;
  score: number;
  frequency: number;
  agingScore: number;
}

export interface InaAgingComparisonParameters {
  poolSize: number;
  historyLimit?: number;
  recentWindow?: number;
  broadWindow?: number;
  minTrain?: number;
  testLimit?: number;
}

export interface InaAgingComparisonKnowledge {
  poolSize: number;
  historyCount: number;
  agingPools: number[][];
  comparison: {
    baseHits: number[];
    experimentalHits: number[];
    tested: number;
  };
  parameters: Required<InaAgingComparisonParameters>;
}

export function rankInaDigitsByFrequencyAndAging(
  history: Draw[],
  position: Pos,
  agingMode: boolean,
  recentWindow = 50,
  broadWindow = 150,
): InaRankedDigit[] {
  const recent = history.slice(-recentWindow);
  const broad = history.slice(-broadWindow);
  const latestId = history.at(-1)?.drawId ?? 0;
  return Array.from({ length: 10 }, (_, digit) => {
    const recentCount = recent.filter(draw => draw.digits[position] === digit).length;
    const broadCount = broad.filter(draw => draw.digits[position] === digit).length;
    const frequency = recentCount / 50 * 0.65 + broadCount / 150 * 0.35;
    if (!agingMode) return { digit, score: frequency, frequency, agingScore: 0 };
    const ids = history.filter(draw => draw.digits[position] === digit).map(draw => draw.drawId);
    const gaps = ids.slice(1).map((id, index) => id - ids[index]);
    const meanGap = gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0;
    const aging = ids.length ? latestId - ids[ids.length - 1] : 0;
    const ratio = meanGap > 0 ? Math.min(2, aging / meanGap) : 0;
    const agingScore = ratio / 2;
    return { digit, score: frequency * 0.8 + agingScore * 0.2, frequency, agingScore };
  }).sort((a, b) => b.score - a.score || a.digit - b.digit);
}

/** Isolated experimental comparison; never modifies the base pool or primary forecast. */
export function buildInaAgingComparison(
  context: InaContext,
  parameters: InaAgingComparisonParameters,
): ResearchOutput<InaAgingComparisonKnowledge> {
  if (!context.quality.valid) throw new Error("cannot compare aging from an invalid INA context");
  const poolSize = Math.max(1, Math.min(10, Math.floor(parameters.poolSize)));
  const minTrain = Math.max(1, Math.floor(parameters.minTrain ?? 30));
  const historyLimit = Math.max(minTrain, Math.floor(parameters.historyLimit ?? 500));
  const recentWindow = Math.max(1, Math.floor(parameters.recentWindow ?? 50));
  const broadWindow = Math.max(recentWindow, Math.floor(parameters.broadWindow ?? 150));
  const testLimit = Math.max(0, Math.floor(parameters.testLimit ?? 100));
  const train = [...context.draws].slice(-historyLimit);
  const agingPools = Array.from({ length: 5 }, (_, position) =>
    rankInaDigitsByFrequencyAndAging(train, position as Pos, true, recentWindow, broadWindow)
      .slice(0, poolSize).map(row => row.digit),
  );

  const tested = Math.min(testLimit, Math.max(0, train.length - minTrain));
  const testStart = train.length - tested;
  const baseHits = Array(5).fill(0) as number[];
  const experimentalHits = Array(5).fill(0) as number[];
  for (let targetIndex = testStart; targetIndex < train.length; targetIndex++) {
    const prior = train.slice(0, targetIndex);
    const actual = train[targetIndex];
    if (prior.length < minTrain) continue;
    for (let position = 0; position < 5; position++) {
      const base = rankInaDigitsByFrequencyAndAging(prior, position as Pos, false, recentWindow, broadWindow)
        .slice(0, poolSize);
      const experimental = rankInaDigitsByFrequencyAndAging(prior, position as Pos, true, recentWindow, broadWindow)
        .slice(0, poolSize);
      if (base.some(row => row.digit === actual.digits[position])) baseHits[position]++;
      if (experimental.some(row => row.digit === actual.digits[position])) experimentalHits[position]++;
    }
  }

  const resolvedParameters = { poolSize, historyLimit, recentWindow, broadWindow, minTrain, testLimit };
  const output = createResearchOutput(context, {
    outputId: "ina-aging-comparison-" + poolSize + "-" + recentWindow + "-" + broadWindow,
    outputKey: "research.aging-comparison",
    moduleId: "aging-experiment",
    engineId: "ina-aging-comparison",
    engineVersion: "1.0.0",
    parameters: resolvedParameters,
    generatedAt: context.builtAt,
    evidence: {
      status: "exploratory",
      phase: "validation",
      notes: [
        "Aging overlay is an experimental comparator, not the base pool.",
        "Walk-forward comparison reconstructs rankings using only history before each target draw.",
        "Retrospective performance is not prospective confirmation and may be affected by selection bias.",
      ],
    },
    result: {
      poolSize,
      historyCount: train.length,
      agingPools,
      comparison: { baseHits, experimentalHits, tested },
      parameters: resolvedParameters,
    },
    warnings: [
      "Aging is based on observed contest-ID gaps and does not imply that a digit is due.",
      "Do not merge the experimental overlay into the primary forecast without independent prospective evidence.",
    ],
  });
  const registration = validateResearchOutputRegistration(output, createDefaultInaModuleRegistry());
  if (!registration.valid) throw new Error("aging comparison output rejected by INA registry: " + registration.errors.join("; "));
  return output;
}
