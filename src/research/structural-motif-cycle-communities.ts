import type { MotifCycle } from "./structural-motif-cycles";
import type { CycleSynchronization } from "./structural-motif-cycle-synchronization";

export type CycleCommunity = {
  id: string;
  cycles: MotifCycle[];
  cycleCount: number;
  uniqueTriads: number;
  edgeCount: number;
  density: number;
  meanScore: number;
  maxDegree: number;
  hub: MotifCycle | null;
  classification: "aislada" | "pareja" | "cohesiva" | "dispersa";
};

function cycleId(cycle: MotifCycle) {
  return [cycle.key, cycle.startWindow, cycle.endWindow, cycle.period, cycle.sequence.join(",")].join("|");
}

export function buildCycleCommunities(
  cycles: MotifCycle[],
  pairs: CycleSynchronization[],
  minScore = 0.45
) {
  const nodes = new Map<string, MotifCycle>();
  for (const cycle of cycles) nodes.set(cycleId(cycle), cycle);
  const adjacency = new Map<string, Map<string, number>>();
  for (const id of nodes.keys()) adjacency.set(id, new Map());
  for (const pair of pairs) {
    if (pair.synchronizationScore < minScore) continue;
    const left = cycleId(pair.left), right = cycleId(pair.right);
    if (!nodes.has(left) || !nodes.has(right) || left === right) continue;
    adjacency.get(left)!.set(right, Math.max(adjacency.get(left)!.get(right) ?? 0, pair.synchronizationScore));
    adjacency.get(right)!.set(left, Math.max(adjacency.get(right)!.get(left) ?? 0, pair.synchronizationScore));
  }
  const visited = new Set<string>();
  const communities: CycleCommunity[] = [];
  for (const root of [...nodes.keys()].sort()) {
    if (visited.has(root)) continue;
    const queue = [root], ids: string[] = [];
    visited.add(root);
    while (queue.length) {
      const current = queue.shift()!;
      ids.push(current);
      for (const neighbor of [...adjacency.get(current)!.keys()].sort()) {
        if (!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
      }
    }
    const members = ids.map(id => nodes.get(id)!);
    const edgeCount = ids.reduce((sum,id)=>sum+adjacency.get(id)!.size,0)/2;
    const n = members.length, density = n > 1 ? edgeCount/(n*(n-1)/2) : 0;
    const strengths = ids.map(id=>[id,adjacency.get(id)!.size,[...adjacency.get(id)!.values()].reduce((a,b)=>a+b,0)] as const);
    strengths.sort((a,b)=>b[1]-a[1]||b[2]-a[2]||a[0].localeCompare(b[0]));
    const hub = n > 1 ? nodes.get(strengths[0][0])! : null;
    const scores = ids.flatMap(id=>[...adjacency.get(id)!.values()]);
    const classification = n===1 ? "aislada" : n===2 ? "pareja" : density>=0.5 ? "cohesiva" : "dispersa";
    communities.push({
      id: ids.slice().sort()[0], cycles: members, cycleCount:n,
      uniqueTriads:new Set(members.map(c=>c.key)).size, edgeCount, density,
      meanScore:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0,
      maxDegree:strengths[0][1], hub, classification
    });
  }
  communities.sort((a,b)=>b.cycleCount-a.cycleCount||b.density-a.density||a.id.localeCompare(b.id));
  const connected = communities.filter(c=>c.cycleCount>1);
  return {
    communities,
    summary:{
      communityCount:communities.length,
      connectedCommunities:connected.length,
      isolatedCycles:communities.filter(c=>c.classification==="aislada").length,
      cyclesInCommunities:connected.reduce((sum,c)=>sum+c.cycleCount,0),
      largestCommunity:communities[0]?.cycleCount??0,
      meanDensity:connected.length?connected.reduce((sum,c)=>sum+c.density,0)/connected.length:0
    },
    settings:{minScore}
  };
}
