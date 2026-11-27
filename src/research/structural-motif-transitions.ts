import type { MotifWindow, StructuralMotif, TriadType } from "./structural-motifs";

export type MotifTransitionCategory = "stable" | "formation" | "dissolution" | "reconfiguration";
export type MotifTransitionEvent = {
  key: string;
  members: [string, string, string];
  fromWindow: number;
  toWindow: number;
  fromType: TriadType | null;
  toType: TriadType | null;
  category: MotifTransitionCategory;
};
export type MotifShapeTransition = { fromType: TriadType; toType: TriadType; count: number };
export type MotifWindowTransitionAnalysis = {
  fromWindow: number;
  toWindow: number;
  events: MotifTransitionEvent[];
  counts: Record<MotifTransitionCategory, number>;
  shapeTransitions: MotifShapeTransition[];
  persistenceRate: number;
  reconfigurationRate: number;
};

const categories: MotifTransitionCategory[] = ["stable", "formation", "dissolution", "reconfiguration"];
const triadTypes: TriadType[] = ["empty", "single-edge", "wedge", "triangle"];

function motifMap(motifs: StructuralMotif[]) {
  return new Map(motifs.map(motif => [motif.key, motif]));
}

export function classifyMotifTransitions(previous: MotifWindow, current: MotifWindow): MotifTransitionEvent[] {
  const before = motifMap(previous.motifs);
  const after = motifMap(current.motifs);
  const keys = [...new Set([...before.keys(), ...after.keys()])].sort();
  return keys.map(key => {
    const a = before.get(key), b = after.get(key);
    const category: MotifTransitionCategory = !a ? "formation" : !b ? "dissolution" : a.type === b.type ? "stable" : "reconfiguration";
    return {
      key,
      members: (b ?? a)!.members,
      fromWindow: previous.index,
      toWindow: current.index,
      fromType: a?.type ?? null,
      toType: b?.type ?? null,
      category
    };
  });
}

export function analyzeMotifWindowTransition(previous: MotifWindow, current: MotifWindow): MotifWindowTransitionAnalysis {
  const events = classifyMotifTransitions(previous, current);
  const counts = Object.fromEntries(categories.map(category => [category, events.filter(event => event.category === category).length])) as Record<MotifTransitionCategory, number>;
  const shapeMap = new Map<string, number>();
  for (const event of events) if (event.fromType && event.toType) {
    const key = event.fromType + "->" + event.toType;
    shapeMap.set(key, (shapeMap.get(key) ?? 0) + 1);
  }
  const shapeTransitions = [...shapeMap].map(([key, count]) => {
    const [fromType, toType] = key.split("->") as [TriadType, TriadType];
    return { fromType, toType, count };
  }).sort((a, b) => b.count - a.count || a.fromType.localeCompare(b.fromType) || a.toType.localeCompare(b.toType));
  const comparable = counts.stable + counts.reconfiguration;
  return {
    fromWindow: previous.index,
    toWindow: current.index,
    events,
    counts,
    shapeTransitions,
    persistenceRate: comparable ? counts.stable / comparable : 0,
    reconfigurationRate: comparable ? counts.reconfiguration / comparable : 0
  };
}

export function analyzeStructuralMotifTransitions(windows: MotifWindow[]) {
  const transitions = windows.slice(1).map((window, index) => analyzeMotifWindowTransition(windows[index], window));
  const counts = Object.fromEntries(categories.map(category => [category, transitions.reduce((sum, transition) => sum + transition.counts[category], 0)])) as Record<MotifTransitionCategory, number>;
  const shapeMap = new Map<string, number>();
  for (const transition of transitions) for (const shape of transition.shapeTransitions) {
    const key = shape.fromType + "->" + shape.toType;
    shapeMap.set(key, (shapeMap.get(key) ?? 0) + shape.count);
  }
  const shapeTransitions = [...shapeMap].map(([key, count]) => {
    const [fromType, toType] = key.split("->") as [TriadType, TriadType];
    return { fromType, toType, count };
  }).sort((a, b) => b.count - a.count || a.fromType.localeCompare(b.fromType) || a.toType.localeCompare(b.toType));
  const comparable = counts.stable + counts.reconfiguration;
  const eventCount = categories.reduce((sum, category) => sum + counts[category], 0);
  return {
    transitions,
    counts,
    shapeTransitions,
    summary: {
      comparisons: transitions.length,
      events: eventCount,
      persistenceRate: comparable ? counts.stable / comparable : 0,
      reconfigurationRate: comparable ? counts.reconfiguration / comparable : 0,
      formation: counts.formation,
      dissolution: counts.dissolution
    },
    types: triadTypes
  };
}
