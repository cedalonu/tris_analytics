import type { MotifWindow, StructuralMotif, TriadType } from "./structural-motifs";
import type { MotifTransitionCategory } from "./structural-motif-transitions";

export type MotifPersistenceEpisode = {
  key: string;
  members: [string, string, string];
  category: Exclude<MotifTransitionCategory, "stable">;
  fromWindow: number;
  toWindow: number;
  fromType: TriadType | null;
  toType: TriadType | null;
  persistenceWindows: number;
  rightCensored: boolean;
};
export type MotifStableRun = {
  key: string;
  members: [string, string, string];
  type: TriadType;
  startWindow: number;
  endWindow: number;
  length: number;
  rightCensored: boolean;
};
const categories: Array<Exclude<MotifTransitionCategory, "stable">> = ["formation", "dissolution", "reconfiguration"];

function mapWindow(window: MotifWindow) {
  return new Map(window.motifs.map((motif: StructuralMotif) => [motif.key, motif]));
}

export function analyzeMotifPersistence(windows: MotifWindow[], minimumPersistentWindows = 2) {
  const ordered = [...windows].sort((a, b) => a.index - b.index);
  const maps = ordered.map(mapWindow);
  const keys = [...new Set(maps.flatMap(map => [...map.keys()]))].sort();
  const episodes: MotifPersistenceEpisode[] = [];
  const stableRuns: MotifStableRun[] = [];

  for (const key of keys) {
    const present = maps.map(map => map.get(key));
    const exemplar = present.find(Boolean)!;
    let runStart = 0;
    while (runStart < present.length) {
      const currentType = present[runStart]?.type ?? null;
      let runEnd = runStart;
      while (runEnd + 1 < present.length && (present[runEnd + 1]?.type ?? null) === currentType) runEnd++;
      if (currentType !== null && runEnd > runStart) {
        stableRuns.push({
          key, members: exemplar.members, type: currentType,
          startWindow: ordered[runStart].index, endWindow: ordered[runEnd].index,
          length: runEnd - runStart + 1, rightCensored: runEnd === present.length - 1
        });
      }
      runStart = runEnd + 1;
    }

    for (let i = 1; i < present.length; i++) {
      const fromType = present[i - 1]?.type ?? null;
      const toType = present[i]?.type ?? null;
      if (fromType === toType) continue;
      const category: Exclude<MotifTransitionCategory, "stable"> = fromType === null ? "formation" : toType === null ? "dissolution" : "reconfiguration";
      let persistenceWindows = 1;
      while (i + persistenceWindows < present.length && (present[i + persistenceWindows]?.type ?? null) === toType) persistenceWindows++;
      episodes.push({
        key, members: exemplar.members, category,
        fromWindow: ordered[i - 1].index, toWindow: ordered[i].index,
        fromType, toType, persistenceWindows,
        rightCensored: i + persistenceWindows === present.length
      });
    }
  }

  const persistentEpisodes = episodes.filter(episode => episode.persistenceWindows >= Math.max(1, Math.floor(minimumPersistentWindows)));
  const byCategory = Object.fromEntries(categories.map(category => {
    const selected = episodes.filter(episode => episode.category === category);
    return [category, {
      episodes: selected.length,
      persistent: selected.filter(episode => episode.persistenceWindows >= Math.max(1, Math.floor(minimumPersistentWindows))).length,
      meanDuration: selected.length ? selected.reduce((sum, episode) => sum + episode.persistenceWindows, 0) / selected.length : 0,
      maxDuration: selected.reduce((max, episode) => Math.max(max, episode.persistenceWindows), 0)
    }];
  })) as Record<Exclude<MotifTransitionCategory, "stable">, { episodes: number; persistent: number; meanDuration: number; maxDuration: number }>;

  return {
    episodes: episodes.sort((a, b) => b.persistenceWindows - a.persistenceWindows || a.key.localeCompare(b.key) || a.toWindow - b.toWindow),
    stableRuns: stableRuns.sort((a, b) => b.length - a.length || a.key.localeCompare(b.key)),
    persistentEpisodes,
    byCategory,
    summary: {
      windows: ordered.length,
      trackedTriads: keys.length,
      changeEpisodes: episodes.length,
      persistentEpisodes: persistentEpisodes.length,
      persistentShare: episodes.length ? persistentEpisodes.length / episodes.length : 0,
      stableRuns: stableRuns.length,
      rightCensoredEpisodes: episodes.filter(episode => episode.rightCensored).length
    },
    minimumPersistentWindows: Math.max(1, Math.floor(minimumPersistentWindows))
  };
}
