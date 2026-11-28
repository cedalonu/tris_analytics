import type { Pos } from "../research-core";
import type { InaContext, ResearchOutput } from "./ina-contracts";
import { createResearchOutput } from "./ina-contracts";
import { analyzePositionAbsences } from "./absence-analysis";
import { createDefaultInaModuleRegistry, validateResearchOutputRegistration } from "./ina-registry";

export interface InaAbsenceDigitReport {
  digit: number;
  occurrences: number;
  rate: number;
  currentAbsence: number;
  completedAbsenceLengths: number[];
  meanCompletedAbsence: number | null;
  medianCompletedAbsence: number | null;
  maxCompletedAbsence: number;
  intervalDistribution: { misses: number; count: number }[];
  returnByPriorAbsence: { priorMisses: number; opportunities: number; returns: number; rate: number; uniformReference: number }[];
  timeline: { drawId: number; present: boolean }[];
}
export interface InaPositionAbsenceReport {
  position: Pos;
  drawCount: number;
  digitReports: InaAbsenceDigitReport[];
}
export interface InaAbsenceKnowledge {
  positions: InaPositionAbsenceReport[];
  timelineLimit: number;
}

/** Versioned descriptive absence/interval output built from the shared INA context. */
export function buildInaAbsence(context: InaContext, options: { maxPriorMisses?: number; timelineLimit?: number } = {}): ResearchOutput<InaAbsenceKnowledge> {
  if (!context.quality.valid) throw new Error("cannot build absence analysis from an invalid INA context");
  const maxPriorMisses = Math.max(0, Math.min(100, Math.floor(options.maxPriorMisses ?? 20)));
  const timelineLimit = Math.max(1, Math.min(500, Math.floor(options.timelineLimit ?? 100)));
  const positions = Array.from({ length: 5 }, (_, index) => {
    const position = index as Pos;
    const report = analyzePositionAbsences([...context.draws], position, maxPriorMisses);
    return {
      position,
      drawCount: report.drawCount,
      digitReports: report.digitReports.map(digit => {
        const histogram = new Map<number, number>();
        digit.completedAbsenceLengths.forEach(misses => histogram.set(misses, (histogram.get(misses) ?? 0) + 1));
        const timelineDraws = context.draws.slice(-timelineLimit);
        return {
          ...digit,
          intervalDistribution: [...histogram.entries()].sort((a, b) => a[0] - b[0]).map(([misses, count]) => ({ misses, count })),
          timeline: timelineDraws.map(draw => ({ drawId: draw.drawId, present: draw.digits[position] === digit.digit })),
        };
      }),
    };
  });
  const result: InaAbsenceKnowledge = { positions, timelineLimit };
  const output = createResearchOutput(context, {
    outputId: "ina-positional-absence-v1",
    outputKey: "research.positional-absence",
    moduleId: "positional-absence",
    engineId: "positional-absence-analysis",
    engineVersion: "1.0.0",
    parameters: { maxPriorMisses, timelineLimit, intervalDefinition: "missed draws strictly between consecutive occurrences" },
    generatedAt: context.builtAt,
    evidence: {
      status: "descriptive",
      phase: "observation",
      notes: [
        "Current absence is the number of consecutive latest draws without the digit.",
        "Completed intervals count missed draws strictly between consecutive appearances; left and right censored intervals are excluded.",
        "Conditional return rates are descriptive opportunities, not independent-trial probabilities or forecasts.",
      ],
    },
    result,
    warnings: [
      "Absence does not make a digit due and does not imply an increased chance in the next draw.",
      "Completed intervals exclude the unobserved waiting time before the first appearance and the unfinished current absence.",
      "Conditional return rates require separate chronological holdout and prospective validation before any predictive interpretation.",
    ],
  });
  const registration = validateResearchOutputRegistration(output, createDefaultInaModuleRegistry());
  if (!registration.valid) throw new Error("absence output rejected by INA registry: " + registration.errors.join("; "));
  return output;
}
