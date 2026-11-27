import { analyzePackageHistory, type HistoricalPackage } from "./historical-comparison";

export type HypothesisRelation = {
  left: string;
  right: string;
  observations: number;
  correlation: number | null;
  directionAgreement: number | null;
  adjustedPValue: number | null;
  firstHalfCorrelation: number | null;
  secondHalfCorrelation: number | null;
  persistent: boolean;
  lagLeftLeads: number | null;
  lagRightLeads: number | null;
  status: "supported" | "suggestive" | "inconclusive" | "insufficient";
};
type Point = { id: string; values: Map<string, number> };
const MIN_OBSERVATIONS = 8;
function correlation(a: number[], b: number[]) {
  if (a.length !== b.length || a.length < 3) return null;
  const ma = a.reduce((s, x) => s + x, 0) / a.length;
  const mb = b.reduce((s, x) => s + x, 0) / b.length;
  let numerator = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] - ma, y = b[i] - mb;
    numerator += x * y; da += x * x; db += y * y;
  }
  const denominator = Math.sqrt(da * db);
  return denominator > 0 ? numerator / denominator : null;
}
function seeded(seed: number) {
  let state = seed >>> 0 || 1;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}
function shuffle<T>(values: T[], random: () => number) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
function latestResolved(record: HistoricalPackage["package"]["snapshots"][number]) {
  return [...record.history].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)).at(-1)?.resolved;
}
function directionAgreement(a: number[], b: number[]) {
  let same = 0;
  for (let i = 0; i < a.length; i++) if (Math.sign(a[i]) === Math.sign(b[i])) same++;
  return same / a.length;
}
function lagCorrelation(a: Array<number | null>, b: Array<number | null>, shift: number) {
  const x: number[] = [], y: number[] = [];
  for (let i = 0; i < a.length; i++) {
    const j = i + shift;
    if (j >= 0 && j < b.length && a[i] !== null && b[j] !== null) { x.push(a[i]!); y.push(b[j]!); }
  }
  return x.length >= 6 ? correlation(x, y) : null;
}
export function analyzeHypothesisRelations(items: HistoricalPackage[], options: { permutations?: number; seed?: number } = {}) {
  const history = analyzePackageHistory(items);
  const empty = { valid: false as const, errors: [] as string[], rows: [] as HypothesisRelation[], groups: [] as string[][], summary: { hypotheses: 0, pairs: 0, supported: 0, suggestive: 0, insufficient: 0, permutations: 0 } };
  if (!history.valid) return { ...empty, errors: history.errors };
  const ordered = [...items].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
  const keys = history.trajectories.map(t => t.candidateKey).sort();
  const points: Point[] = ordered.map(p => ({ id: p.id, values: new Map(p.package.snapshots.map(r => [r.candidateKey, latestResolved(r)]).filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]))) }));
  const streams = new Map<string, Array<number | null>>();
  for (const key of keys) {
    const values: Array<number | null> = [];
    for (let i = 1; i < points.length; i++) {
      const before = points[i - 1].values.get(key), after = points[i].values.get(key);
      values.push(before === undefined || after === undefined ? null : after - before);
    }
    streams.set(key, values);
  }
  const candidates: Array<{ left: string; right: string; a: number[]; b: number[]; positions: number[]; r: number | null; first: number | null; second: number | null; agree: number | null; lead: number | null; lag: number | null }> = [];
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const left = keys[i], right = keys[j], sa = streams.get(left)!, sb = streams.get(right)!;
    const a: number[] = [], b: number[] = [], positions: number[] = [];
    for (let k = 0; k < sa.length; k++) if (sa[k] !== null && sb[k] !== null) { a.push(sa[k]!); b.push(sb[k]!); positions.push(k); }
    const r = correlation(a, b), split = Math.floor(a.length / 2);
    const first = split >= 3 ? correlation(a.slice(0, split), b.slice(0, split)) : null;
    const second = a.length - split >= 3 ? correlation(a.slice(split), b.slice(split)) : null;
    const lead = lagCorrelation(sa, sb, 1), lag = lagCorrelation(sa, sb, -1);
    candidates.push({ left, right, a, b, positions, r, first, second, agree: a.length ? directionAgreement(a, b) : null, lead, lag });
  }
  const permutations = Math.max(99, Math.min(1999, Math.floor(options.permutations ?? 499)));
  const random = seeded(options.seed ?? 740219);
  const nullMaxima: number[] = [];
  for (let iteration = 0; iteration < permutations; iteration++) {
    let maximum = 0;
    for (const pair of candidates) {
      if (pair.a.length < MIN_OBSERVATIONS) continue;
      const r = correlation(pair.a, shuffle(pair.b, random));
      if (r !== null) maximum = Math.max(maximum, Math.abs(r));
    }
    nullMaxima.push(maximum);
  }
  const rows: HypothesisRelation[] = candidates.map(pair => {
    const enough = pair.a.length >= MIN_OBSERVATIONS && pair.r !== null;
    const p = enough ? (nullMaxima.filter(value => value >= Math.abs(pair.r!)).length + 1) / (permutations + 1) : null;
    const persistent = pair.first !== null && pair.second !== null && Math.sign(pair.first) === Math.sign(pair.second) && Math.abs(pair.first) >= 0.35 && Math.abs(pair.second) >= 0.35;
    const status: HypothesisRelation["status"] = !enough ? "insufficient" : p! <= 0.05 && Math.abs(pair.r!) >= 0.5 && persistent ? "supported" : p! <= 0.1 && Math.abs(pair.r!) >= 0.4 ? "suggestive" : "inconclusive";
    return { left: pair.left, right: pair.right, observations: pair.a.length, correlation: pair.r, directionAgreement: pair.agree, adjustedPValue: p, firstHalfCorrelation: pair.first, secondHalfCorrelation: pair.second, persistent, lagLeftLeads: pair.lead, lagRightLeads: pair.lag, status };
  });
  const adjacency = new Map<string, Set<string>>();
  for (const row of rows) if (row.status === "supported") {
    if (!adjacency.has(row.left)) adjacency.set(row.left, new Set());
    if (!adjacency.has(row.right)) adjacency.set(row.right, new Set());
    adjacency.get(row.left)!.add(row.right); adjacency.get(row.right)!.add(row.left);
  }
  const groups: string[][] = [], visited = new Set<string>();
  for (const key of adjacency.keys()) if (!visited.has(key)) {
    const stack = [key], group: string[] = []; visited.add(key);
    while (stack.length) { const current = stack.pop()!; group.push(current); for (const next of adjacency.get(current) ?? []) if (!visited.has(next)) { visited.add(next); stack.push(next); } }
    if (group.length > 1) groups.push(group.sort());
  }
  const count = (status: HypothesisRelation["status"]) => rows.filter(row => row.status === status).length;
  return { valid: true as const, errors: [] as string[], rows, groups, summary: { hypotheses: keys.length, pairs: rows.length, supported: count("supported"), suggestive: count("suggestive"), insufficient: count("insufficient"), permutations } };
}
