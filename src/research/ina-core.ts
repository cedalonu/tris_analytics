import type { Digit, Pos } from "../research-core";
import {
  createInaContext,
  createResearchOutput,
  type InaContextInput,
  type InaContext,
  type ResearchOutput,
} from "./ina-contracts";

export interface InaDigitProfile {
  digit: Digit;
  occurrences: number;
  empiricalRate: number;
  lastSeenDrawId: number | null;
  currentAbsence: number;
  meanInterarrivalDraws: number | null;
}

export interface InaPositionProfile {
  position: Pos;
  sampleSize: number;
  digits: InaDigitProfile[];
}

export interface InaKnowledge {
  drawCount: number;
  firstDrawId: number | null;
  drawCutoff: number | null;
  firstDate: string | null;
  lastDate: string | null;
  positions: InaPositionProfile[];
  contestGaps: number[];
  warnings: string[];
}

export interface InaCoreResult {
  status: "ready" | "quarantined";
  context: InaContext;
  knowledge: InaKnowledge | null;
  outputs: ResearchOutput<InaKnowledge>[];
  blockers: string[];
}

function buildPositionProfile(draws: InaContext["draws"], position: Pos): InaPositionProfile {
  const sampleSize = draws.length;
  const digits = Array.from({ length: 10 }, (_, digit) => {
    const occurrencesAt: number[] = [];
    draws.forEach((draw, index) => {
      if (draw.digits[position] === digit) occurrencesAt.push(index);
    });
    const gaps = occurrencesAt.slice(1).map((index, i) => index - occurrencesAt[i] - 1);
    const lastIndex = occurrencesAt.at(-1);
    return {
      digit: digit as Digit,
      occurrences: occurrencesAt.length,
      empiricalRate: sampleSize ? occurrencesAt.length / sampleSize : 0,
      lastSeenDrawId: lastIndex === undefined ? null : draws[lastIndex].drawId,
      currentAbsence: lastIndex === undefined ? sampleSize : sampleSize - 1 - lastIndex,
      meanInterarrivalDraws: gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : null,
    };
  });
  return { position, sampleSize, digits };
}

/**
 * Builds INA's first shared descriptive knowledge layer from one validated snapshot.
 * It does not forecast, score candidate numbers, or infer statistical significance.
 */
export function buildInaCore(input: InaContextInput): InaCoreResult {
  const context = createInaContext(input);
  if (!context.quality.valid) {
    return {
      status: "quarantined",
      context,
      knowledge: null,
      outputs: [],
      blockers: [...context.quality.errors],
    };
  }

  const draws = context.draws;
  const dates = draws.map(draw => draw.date).filter((date): date is string => Boolean(date)).sort();
  const knowledge: InaKnowledge = {
    drawCount: draws.length,
    firstDrawId: draws[0]?.drawId ?? null,
    drawCutoff: draws.at(-1)?.drawId ?? null,
    firstDate: dates[0] ?? null,
    lastDate: dates.at(-1) ?? null,
    positions: Array.from({ length: 5 }, (_, position) => buildPositionProfile(draws, position as Pos)),
    contestGaps: draws.slice(1).map((draw, index) => draw.drawId - draws[index].drawId),
    warnings: [
      "Position rates and recurrence measures are descriptive summaries of the supplied historical snapshot.",
      "Empirical frequency is not a calibrated probability of the next draw.",
      "Absence and interarrival gaps do not imply that a digit is due.",
    ],
  };

  const output = createResearchOutput(context, {
    outputId: "ina-position-knowledge-v1",
    outputKey: "ina.position-profile",
    moduleId: "ina-core",
    engineId: "ina-core-position-profile",
    engineVersion: "1.0.0",
    parameters: { positions: 5, digitDomain: "0-9", method: "empirical-counts" },
    generatedAt: input.builtAt ?? context.snapshot.fetchedAt,
    evidence: {
      status: "descriptive",
      phase: "observation",
      notes: ["Derived only from validated draws in the identified snapshot.", "No predictive claim or significance test."],
    },
    result: knowledge,
    warnings: knowledge.warnings,
  });

  return { status: "ready", context, knowledge, outputs: [output], blockers: [] };
}
