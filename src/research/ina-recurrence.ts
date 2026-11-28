import type { InaContext, ResearchOutput } from "./ina-contracts";
import { createResearchOutput } from "./ina-contracts";
import { createDefaultInaModuleRegistry, validateResearchOutputRegistration } from "./ina-registry";

export interface InaCombinationRecurrence {
  combination: string;
  count: number;
  firstDraw: number;
  firstDate: string | null;
  lastDraw: number;
  lastDate: string | null;
  aging: number;
  dayAging: number | null;
  gaps: number[];
  meanGap: number | null;
  medianGap: number | null;
  maxGap: number | null;
}

export interface InaRecurrenceKnowledge {
  combinations: InaCombinationRecurrence[];
  uniqueCombinations: number;
  recurrentCombinations: number;
  extraOccurrences: number;
  drawCutoff: number | null;
  warnings: string[];
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Descriptive recurrence over exact ordered R1-R5 combinations; leading zeros are preserved. */
export function buildInaRecurrence(
  context: InaContext,
): ResearchOutput<InaRecurrenceKnowledge> {
  if (!context.quality.valid) throw new Error("cannot build recurrence from an invalid INA context");
  const grouped = new Map<string, typeof context.draws[number][]>();
  for (const draw of context.draws) {
    const key = draw.digits.join("");
    const rows = grouped.get(key) ?? [];
    rows.push(draw);
    grouped.set(key, rows);
  }
  const latest = context.draws.at(-1);
  const combinations = [...grouped.entries()].map(([combination, rows]) => {
    const first = rows[0];
    const last = rows.at(-1)!;
    const gaps = rows.slice(1).map((draw, index) => draw.drawId - rows[index].drawId);
    const dayAging = latest?.date && last.date
      ? Math.max(0, Math.round((Date.parse(latest.date) - Date.parse(last.date)) / 86400000))
      : null;
    return {
      combination,
      count: rows.length,
      firstDraw: first.drawId,
      firstDate: first.date ?? null,
      lastDraw: last.drawId,
      lastDate: last.date ?? null,
      aging: latest ? latest.drawId - last.drawId : 0,
      dayAging,
      gaps,
      meanGap: gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : null,
      medianGap: median(gaps),
      maxGap: gaps.length ? Math.max(...gaps) : null,
    };
  });
  const knowledge: InaRecurrenceKnowledge = {
    combinations,
    uniqueCombinations: combinations.length,
    recurrentCombinations: combinations.filter(row => row.count > 1).length,
    extraOccurrences: combinations.reduce((sum, row) => sum + row.count - 1, 0),
    drawCutoff: context.version.drawCutoff,
    warnings: [
      "Aging is the difference between contest IDs, not necessarily observed-row count when the source has gaps.",
      "The first occurrence means the first occurrence in this snapshot, not necessarily the first ever.",
      "Observed recurrence and absence do not imply that a combination is due or more likely next time.",
    ],
  };
  const output = createResearchOutput(context, {
    outputId: "ina-combination-recurrence-v1",
    outputKey: "research.combination-recurrence",
    moduleId: "combination-recurrence",
    engineId: "ina-combination-recurrence",
    engineVersion: "1.0.0",
    parameters: { key: "ordered-R1-R5", agingUnit: "contest-id", gapUnit: "contest-id" },
    generatedAt: context.builtAt,
    evidence: {
      status: "descriptive",
      phase: "observation",
      notes: ["Exact five-position combinations; digits and order are preserved.", "No predictive interpretation."],
    },
    result: knowledge,
    warnings: knowledge.warnings,
  });
  const registration = validateResearchOutputRegistration(output, createDefaultInaModuleRegistry());
  if (!registration.valid) throw new Error("recurrence output rejected by INA registry: " + registration.errors.join("; "));
  return output;
}
