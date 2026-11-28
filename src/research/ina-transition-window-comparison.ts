import type { InaContext, ResearchOutput } from "./ina-contracts";
import { createResearchOutput } from "./ina-contracts";
import { createDefaultInaModuleRegistry, validateResearchOutputRegistration } from "./ina-registry";

export const INA_TRANSITION_COMPARISON_WINDOWS = [50, 150, 500] as const;

export interface InaTransitionWindowSummary {
  windowSize: number;
  sampleSize: number;
  topKeys: string[];
}

export interface InaTransitionWindowRow {
  key: string;
  p: number;
  a: number;
  b: number;
  topTenAppearances: number;
  counts: [number, number, number];
}

export interface InaTransitionWindowComparison {
  windows: InaTransitionWindowSummary[];
  ranked: InaTransitionWindowRow[];
  minimumTopTenAppearances: number;
}

/**
 * Reproduces the dashboard's historical top-10 comparison across trailing
 * 50/150/500-draw windows. Ranking and tie-breaking are intentionally stable
 * so the migration can be checked numerically against the former inline code.
 */
export function buildInaTransitionWindowComparison(
  context: InaContext,
): ResearchOutput<InaTransitionWindowComparison> {
  if (!context.quality.valid) throw new Error("cannot compare transition windows from an invalid INA context");

  const perWindow = INA_TRANSITION_COMPARISON_WINDOWS.map(windowSize => {
    const draws = context.draws.slice(-windowSize);
    const counts = new Map<string, number>();
    for (const draw of draws) {
      for (let position = 0; position < 4; position++) {
        const key = position + "-" + draw.digits[position] + "-" + draw.digits[position + 1];
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    const topKeys = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([key]) => key);
    return { windowSize, sampleSize: draws.length, counts, topKeys: new Set(topKeys) };
  });

  const all = new Map<string, InaTransitionWindowRow>();
  perWindow.forEach((window, index) => {
    window.counts.forEach((count, key) => {
      const [p, a, b] = key.split("-").map(Number);
      const row = all.get(key) ?? {
        key, p, a, b, topTenAppearances: 0, counts: [0, 0, 0],
      };
      row.counts[index] = count;
      if (window.topKeys.has(key)) row.topTenAppearances++;
      all.set(key, row);
    });
  });

  const ranked = [...all.values()]
    .filter(row => row.topTenAppearances >= 2)
    .sort((a, b) =>
      b.topTenAppearances - a.topTenAppearances ||
      b.counts[0] - a.counts[0] ||
      b.counts[1] - a.counts[1] ||
      b.counts[2] - a.counts[2],
    )
    .slice(0, 12);

  const result: InaTransitionWindowComparison = {
    windows: perWindow.map(window => ({
      windowSize: window.windowSize,
      sampleSize: window.sampleSize,
      topKeys: [...window.topKeys],
    })),
    ranked,
    minimumTopTenAppearances: 2,
  };
  const output = createResearchOutput(context, {
    outputId: "ina-transition-window-comparison-50-150-500",
    outputKey: "research.transition-window-comparison",
    moduleId: "positional-transitions",
    engineId: "positional-transition-family",
    engineVersion: "1.0.0",
    parameters: {
      windows: INA_TRANSITION_COMPARISON_WINDOWS.join(","),
      topN: 10,
      minimumTopTenAppearances: 2,
      resultLimit: 12,
      tieBreak: "key-ascending-for-window-top10;count-descending-then-window-counts-descending",
    },
    generatedAt: context.builtAt,
    evidence: {
      status: "descriptive",
      phase: "observation",
      notes: [
        "Compares top-10 adjacent-position transitions in three trailing windows.",
        "Repeated top-10 presence describes historical rank stability, not predictive advantage.",
      ],
    },
    result,
    warnings: [
      "The windows overlap and have different sample sizes; raw counts are not directly comparable as rates.",
      "Top-10 membership is rank-based and subject to ties and selection effects.",
      "This output is descriptive and must not be interpreted as a forecast or probability.",
    ],
  });
  const registration = validateResearchOutputRegistration(output, createDefaultInaModuleRegistry());
  if (!registration.valid) throw new Error("transition window comparison rejected by INA registry: " + registration.errors.join("; "));
  return output;
}
