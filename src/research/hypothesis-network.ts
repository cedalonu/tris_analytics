import { analyzeHypothesisRelations, type HypothesisRelation } from "./hypothesis-relations";
import type { HistoricalPackage } from "./historical-comparison";
export type NetworkNode = { id: string; degree: number; weightedDegree: number; supportedDegree: number; suggestiveDegree: number; x: number; y: number };
export type NetworkEdge = { left: string; right: string; strength: number; status: "supported" | "suggestive"; observations: number; adjustedPValue: number | null; persistent: boolean };
export function buildHypothesisNetwork(items: HistoricalPackage[], options: { permutations?: number; seed?: number } = {}) {
  const analysis = analyzeHypothesisRelations(items, options);
  if (!analysis.valid) return { valid: false as const, errors: analysis.errors, nodes: [] as NetworkNode[], edges: [] as NetworkEdge[], summary: { nodes: 0, edges: 0, supported: 0, suggestive: 0, components: 0, isolated: 0, density: 0 } };
  const keys = analysis.rows.length ? [...new Set(analysis.rows.flatMap(row => [row.left, row.right]))].sort() : [];
  const visible = analysis.rows.filter(row => row.status === "supported" || row.status === "suggestive");
  const edges: NetworkEdge[] = visible.map(row => ({ left: row.left, right: row.right, strength: row.correlation ?? 0, status: row.status as "supported" | "suggestive", observations: row.observations, adjustedPValue: row.adjustedPValue, persistent: row.persistent }));
  const adjacency = new Map(keys.map(key => [key, new Set<string>()]));
  const weighted = new Map(keys.map(key => [key, 0]));
  const supportedDegree = new Map(keys.map(key => [key, 0]));
  const suggestiveDegree = new Map(keys.map(key => [key, 0]));
  for (const edge of edges) {
    adjacency.get(edge.left)!.add(edge.right); adjacency.get(edge.right)!.add(edge.left);
    weighted.set(edge.left, weighted.get(edge.left)! + Math.abs(edge.strength));
    weighted.set(edge.right, weighted.get(edge.right)! + Math.abs(edge.strength));
    const target = edge.status === "supported" ? supportedDegree : suggestiveDegree;
    target.set(edge.left, target.get(edge.left)! + 1); target.set(edge.right, target.get(edge.right)! + 1);
  }
  const components: string[][] = [], visited = new Set<string>();
  for (const key of keys) if (!visited.has(key) && adjacency.get(key)!.size) {
    const stack = [key], component: string[] = []; visited.add(key);
    while (stack.length) { const current = stack.pop()!; component.push(current); for (const next of adjacency.get(current)!) if (!visited.has(next)) { visited.add(next); stack.push(next); } }
    components.push(component);
  }
  const nodes = keys.map((id, index) => {
    const angle = -Math.PI / 2 + 2 * Math.PI * index / Math.max(keys.length, 1);
    return { id, degree: adjacency.get(id)!.size, weightedDegree: weighted.get(id)!, supportedDegree: supportedDegree.get(id)!, suggestiveDegree: suggestiveDegree.get(id)!, x: 250 + 205 * Math.cos(angle), y: 225 + 175 * Math.sin(angle) };
  });
  const possible = keys.length * (keys.length - 1) / 2;
  return { valid: true as const, errors: [] as string[], nodes, edges, summary: { nodes: nodes.length, edges: edges.length, supported: edges.filter(edge => edge.status === "supported").length, suggestive: edges.filter(edge => edge.status === "suggestive").length, components: components.length, isolated: nodes.filter(node => node.degree === 0).length, density: possible ? edges.length / possible : 0 } };
}
