import type { MotifWindow } from "./structural-motifs";
import { detectMotifCycles, type MotifCycle } from "./structural-motif-cycles";

export type CycleSynchronization = {
  left: MotifCycle;
  right: MotifCycle;
  overlapWindows: number;
  unionWindows: number;
  temporalJaccard: number;
  samePeriod: boolean;
  sameSequenceUpToRotation: boolean;
  synchronizationScore: number;
  classification: "alineada" | "parcial" | "desfasada";
  startLag: number;
};

function rotationsMatch(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.some((_, offset) => a.every((value, index) => value === b[(index + offset) % b.length]));
}

export function analyzeMotifCycleSynchronization(
  windows: MotifWindow[],
  options: { minPeriod?: number; maxPeriod?: number; minRepetitions?: number; minOverlap?: number } = {}
) {
  const detected = detectMotifCycles(windows, options);
  const cycles = detected.cycles;
  const pairs: CycleSynchronization[] = [];
  for (let i = 0; i < cycles.length; i++) {
    for (let j = i + 1; j < cycles.length; j++) {
      const left = cycles[i], right = cycles[j];
      if (left.key === right.key) continue;
      const start = Math.max(left.startWindow, right.startWindow);
      const end = Math.min(left.endWindow, right.endWindow);
      const overlapWindows = Math.max(0, end - start + 1);
      if (!overlapWindows) continue;
      const unionWindows = Math.max(left.endWindow, right.endWindow) - Math.min(left.startWindow, right.startWindow) + 1;
      const temporalJaccard = overlapWindows / unionWindows;
      if (temporalJaccard < (options.minOverlap ?? 0.25)) continue;
      const samePeriod = left.period === right.period;
      const sameSequenceUpToRotation = samePeriod && rotationsMatch(left.sequence, right.sequence);
      const periodScore = samePeriod ? 1 : 0;
      const sequenceScore = sameSequenceUpToRotation ? 1 : 0;
      const synchronizationScore = 0.5 * temporalJaccard + 0.25 * periodScore + 0.25 * sequenceScore;
      const classification = synchronizationScore >= 0.75 ? "alineada" : synchronizationScore >= 0.45 ? "parcial" : "desfasada";
      pairs.push({ left, right, overlapWindows, unionWindows, temporalJaccard, samePeriod, sameSequenceUpToRotation, synchronizationScore, classification, startLag: right.startWindow - left.startWindow });
    }
  }
  pairs.sort((a, b) => b.synchronizationScore - a.synchronizationScore || b.overlapWindows - a.overlapWindows || a.left.key.localeCompare(b.left.key));
  const counts = { alineada: 0, parcial: 0, desfasada: 0 };
  for (const pair of pairs) counts[pair.classification]++;
  const activeByWindow = [...windows].sort((a,b)=>a.index-b.index).map(window => ({
    window: window.index,
    activeCycles: cycles.filter(cycle => cycle.startWindow <= window.index && cycle.endWindow >= window.index).length,
    activeTriads: new Set(cycles.filter(cycle => cycle.startWindow <= window.index && cycle.endWindow >= window.index).map(cycle => cycle.key)).size
  }));
  return {
    cycles,
    pairs,
    activeByWindow,
    summary: {
      cycleCount: cycles.length,
      pairedCycles: pairs.length,
      uniqueTriads: new Set(cycles.map(cycle => cycle.key)).size,
      meanSynchronization: pairs.length ? pairs.reduce((sum,pair)=>sum+pair.synchronizationScore,0)/pairs.length : 0,
      counts
    },
    settings: { ...detected.settings, minOverlap: options.minOverlap ?? 0.25 }
  };
}
