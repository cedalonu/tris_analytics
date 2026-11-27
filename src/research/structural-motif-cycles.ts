import type { MotifWindow, StructuralMotif, TriadType } from "./structural-motifs";

export type MotifCycle = {
  key: string;
  members: [string, string, string];
  sequence: TriadType[];
  period: number;
  repetitions: number;
  startWindow: number;
  endWindow: number;
  rightCensored: boolean;
};

export function detectMotifCycles(
  windows: MotifWindow[],
  options: { minPeriod?: number; maxPeriod?: number; minRepetitions?: number } = {}
) {
  const minPeriod = Math.max(2, Math.floor(options.minPeriod ?? 2));
  const maxPeriod = Math.max(minPeriod, Math.min(4, Math.floor(options.maxPeriod ?? 4)));
  const minRepetitions = Math.max(2, Math.floor(options.minRepetitions ?? 2));
  const ordered = [...windows].sort((a, b) => a.index - b.index);
  const maps = ordered.map(window => new Map(window.motifs.map((motif: StructuralMotif) => [motif.key, motif])));
  const keys = [...new Set(maps.flatMap(map => [...map.keys()]))].sort();
  const cycles: MotifCycle[] = [];

  for (const key of keys) {
    const exemplar = maps.map(map => map.get(key)).find(Boolean)!;
    const types = maps.map(map => map.get(key)?.type ?? null);
    let segmentStart = 0;
    while (segmentStart < types.length) {
      while (segmentStart < types.length && types[segmentStart] === null) segmentStart++;
      if (segmentStart >= types.length) break;
      let segmentEnd = segmentStart;
      while (segmentEnd + 1 < types.length && types[segmentEnd + 1] !== null) segmentEnd++;
      const segment = types.slice(segmentStart, segmentEnd + 1) as TriadType[];
      let cursor = 0;
      while (cursor < segment.length) {
        let found: MotifCycle | undefined;
        for (let period = minPeriod; period <= maxPeriod && !found; period++) {
          if (cursor + period * minRepetitions > segment.length) continue;
          let repetitions = 1;
          while (cursor + (repetitions + 1) * period <= segment.length) {
            const matches = segment.slice(cursor, cursor + period).every((type, offset) => type === segment[cursor + repetitions * period + offset]);
            if (!matches) break;
            repetitions++;
          }
          if (repetitions >= minRepetitions) {
            const start = segmentStart + cursor;
            const end = start + period * repetitions - 1;
            found = {
              key, members: exemplar.members, sequence: segment.slice(cursor, cursor + period),
              period, repetitions, startWindow: ordered[start].index, endWindow: ordered[end].index,
              rightCensored: end === ordered.length - 1
            };
          }
        }
        if (found) {
          cycles.push(found);
          cursor += found.period * found.repetitions;
        } else cursor++;
      }
      segmentStart = segmentEnd + 1;
    }
  }
  cycles.sort((a, b) => b.repetitions - a.repetitions || a.period - b.period || a.key.localeCompare(b.key) || a.startWindow - b.startWindow);
  const byPeriod = Object.fromEntries([2, 3, 4].map(period => [period, cycles.filter(cycle => cycle.period === period).length])) as Record<number, number>;
  return {
    cycles,
    summary: {
      trackedTriads: keys.length,
      cycleCount: cycles.length,
      cyclicTriads: new Set(cycles.map(cycle => cycle.key)).size,
      meanRepetitions: cycles.length ? cycles.reduce((sum, cycle) => sum + cycle.repetitions, 0) / cycles.length : 0,
      rightCensored: cycles.filter(cycle => cycle.rightCensored).length,
      byPeriod
    },
    settings: { minPeriod, maxPeriod, minRepetitions }
  };
}
