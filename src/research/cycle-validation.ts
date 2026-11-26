import { analyzePackageHistory, type HistoricalPackage } from "./historical-comparison";
import { detectHistoricalCycles, type CycleBasis } from "./cycle-detector";

export type CycleValidationRow = {
  candidateKey: string;
  basis: CycleBasis;
  period: number;
  observedCoverage: number;
  adjustedPValue: number;
  holdoutCoverage: number | null;
  holdoutEvaluable: boolean;
  status: "supported" | "weak" | "inconclusive" | "not-evaluable";
  permutations: number;
};
type Stream = { candidateKey: string; basis: CycleBasis; tokens: string[] };
const MAX_PERIOD = 8;
function periodCoverage(tokens: string[], period: number) {
  if (period < 2 || tokens.length <= period) return 0;
  let matches = 0;
  for (let i = period; i < tokens.length; i++) if (tokens[i] === tokens[i - period]) matches++;
  return matches / (tokens.length - period);
}
function bestCoverage(tokens: string[]) {
  let best = 0;
  for (let period = 2; period <= Math.min(MAX_PERIOD, Math.floor(tokens.length / 2)); period++) {
    best = Math.max(best, periodCoverage(tokens, period));
  }
  return best;
}
function seeded(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
function shuffle<T>(values: T[], random: () => number) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
function streamsFrom(items: HistoricalPackage[]): Stream[] {
  const history = analyzePackageHistory(items);
  if (!history.valid) return [];
  const streams: Stream[] = [];
  for (const trajectory of history.trajectories) {
    const present = trajectory.points.filter(point => point.present);
    const classes = present.map(point => point.classification ?? "unknown");
    if (new Set(classes).size > 1) streams.push({ candidateKey: trajectory.candidateKey, basis: "classification", tokens: classes });
    const values = present.map(point => point.resolved).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const directions = values.slice(1).map((value, index) => value > values[index] ? "sube" : value < values[index] ? "baja" : "sin-cambio");
    if (new Set(directions).size > 1) streams.push({ candidateKey: trajectory.candidateKey, basis: "direction", tokens: directions });
  }
  return streams;
}
function holdout(stream: Stream, period: number) {
  const split = Math.floor(stream.tokens.length * 0.6);
  const train = stream.tokens.slice(0, split);
  const test = stream.tokens.slice(split);
  if (train.length < Math.max(4, period * 2) || test.length < 2) return { coverage: null, evaluable: false };
  let matches = 0;
  for (let i = 0; i < test.length; i++) {
    const expected = train[(train.length + i) % period];
    if (test[i] === expected) matches++;
  }
  return { coverage: matches / test.length, evaluable: true };
}

export function validateHistoricalCycles(items: HistoricalPackage[], options: { permutations?: number; seed?: number } = {}) {
  const history = analyzePackageHistory(items);
  const detection = detectHistoricalCycles(items);
  if (!history.valid || !detection.valid) return {
    valid: false as const,
    errors: [...history.errors, ...detection.errors],
    rows: [] as CycleValidationRow[],
    summary: { tested: 0, supported: 0, weak: 0, inconclusive: 0, notEvaluable: 0, permutations: 0 },
  };
  const permutations = Math.max(99, Math.min(1999, Math.floor(options.permutations ?? 499)));
  const random = seeded(options.seed ?? 721973);
  const streams = streamsFrom(items);
  const streamMap = new Map(streams.map(stream => [stream.candidateKey + "|" + stream.basis, stream]));
  const observed = detection.patterns.map(pattern => {
    const stream = streamMap.get(pattern.candidateKey + "|" + pattern.basis)!;
    return { pattern, stream, coverage: periodCoverage(stream.tokens, pattern.period) };
  });
  const nullMaxima: number[] = [];
  for (let iteration = 0; iteration < permutations; iteration++) {
    let maximum = 0;
    for (const stream of streams) maximum = Math.max(maximum, bestCoverage(shuffle(stream.tokens, random)));
    nullMaxima.push(maximum);
  }
  const rows: CycleValidationRow[] = observed.map(({ pattern, stream, coverage }) => {
    const exceed = nullMaxima.filter(value => value >= coverage).length;
    const adjustedPValue = (exceed + 1) / (permutations + 1);
    const test = holdout(stream, pattern.period);
    let status: CycleValidationRow["status"];
    if (!test.evaluable) status = "not-evaluable";
    else if (adjustedPValue <= 0.05 && (test.coverage ?? 0) >= 0.8) status = "supported";
    else if (adjustedPValue <= 0.1 || (test.coverage ?? 0) >= 0.8) status = "weak";
    else status = "inconclusive";
    return {
      candidateKey: pattern.candidateKey,
      basis: pattern.basis,
      period: pattern.period,
      observedCoverage: coverage,
      adjustedPValue,
      holdoutCoverage: test.coverage,
      holdoutEvaluable: test.evaluable,
      status,
      permutations,
    };
  });
  const count = (status: CycleValidationRow["status"]) => rows.filter(row => row.status === status).length;
  return {
    valid: true as const,
    errors: [] as string[],
    rows,
    summary: {
      tested: rows.length,
      supported: count("supported"),
      weak: count("weak"),
      inconclusive: count("inconclusive"),
      notEvaluable: count("not-evaluable"),
      permutations,
    },
  };
}
