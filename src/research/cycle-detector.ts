import { analyzePackageHistory, type HistoricalPackage } from "./historical-comparison";

export type CycleBasis = "classification" | "direction";
export type CyclePattern = {
  candidateKey: string;
  basis: CycleBasis;
  period: number;
  repetitions: number;
  coverage: number;
  sequence: string[];
  observations: number;
  regimeBreaks: number;
};

function findRepeatedPeriod(tokens: string[]) {
  if (tokens.length < 4) return null;
  const maxPeriod = Math.min(8, Math.floor(tokens.length / 2));
  for (let period = 2; period <= maxPeriod; period++) {
    const compared = tokens.length - period;
    let matches = 0;
    for (let i = period; i < tokens.length; i++) {
      if (tokens[i] === tokens[i % period]) matches++;
    }
    const coverage = compared ? matches / compared : 0;
    const repetitions = Math.floor(tokens.length / period);
    if (repetitions >= 2 && coverage >= 0.8) {
      return {
        period,
        repetitions,
        coverage,
        sequence: tokens.slice(0, period),
      };
    }
  }
  return null;
}

export function detectHistoricalCycles(items: HistoricalPackage[]) {
  const history = analyzePackageHistory(items);
  if (!history.valid) {
    return {
      valid: false as const,
      errors: history.errors,
      patterns: [] as CyclePattern[],
      summary: { candidates: 0, detected: 0, classificationCycles: 0, directionCycles: 0, insufficient: 0, regimeBreaks: 0 },
    };
  }

  const patterns: CyclePattern[] = [];
  let insufficient = 0;
  let regimeBreaks = 0;

  for (const trajectory of history.trajectories) {
    const points = trajectory.points;
    const present = points.filter(point => point.present);
    const classes = present.map(point => point.classification ?? "unknown");
    let breaks = 0;
    for (let i = 1; i < classes.length; i++) {
      if (classes[i] !== classes[i - 1]) breaks++;
    }
    regimeBreaks += breaks;

    const classificationCycle = findRepeatedPeriod(classes);
    if (classificationCycle) {
      patterns.push({
        candidateKey: trajectory.candidateKey,
        basis: "classification",
        ...classificationCycle,
        observations: classes.length,
        regimeBreaks: breaks,
      });
    }

    const values = present.map(point => point.resolved).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const directions = values.slice(1).map((value, index) => {
      const delta = value - values[index];
      return delta > 0 ? "sube" : delta < 0 ? "baja" : "sin-cambio";
    });
    const directionCycle = findRepeatedPeriod(directions);
    if (directionCycle) {
      patterns.push({
        candidateKey: trajectory.candidateKey,
        basis: "direction",
        ...directionCycle,
        observations: directions.length,
        regimeBreaks: breaks,
      });
    }

    if (present.length < 4) insufficient++;
  }

  const classificationCycles = patterns.filter(pattern => pattern.basis === "classification").length;
  const directionCycles = patterns.filter(pattern => pattern.basis === "direction").length;
  return {
    valid: true as const,
    errors: [] as string[],
    patterns: patterns.sort((a, b) => a.candidateKey.localeCompare(b.candidateKey) || a.basis.localeCompare(b.basis)),
    summary: {
      candidates: history.trajectories.length,
      detected: new Set(patterns.map(pattern => pattern.candidateKey)).size,
      classificationCycles,
      directionCycles,
      insufficient,
      regimeBreaks,
    },
  };
}
