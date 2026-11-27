import test from "node:test";
import assert from "node:assert/strict";
import { buildHypothesisNetwork } from "./hypothesis-network";
import type { HistoricalPackage } from "./historical-comparison";
const pack = (id: string, date: string, values: Array<[string, number]>): HistoricalPackage => ({ id, name: id, date, package: { manifest: { schema: "tris-reproducibility-manifest-v1", snapshotFingerprint: id }, snapshots: values.map(([candidateKey, resolved]) => ({ candidateKey, history: [{ recordedAt: date, classification: "neutral", resolved }] })) } });
test("builds a network with stable node coordinates and valid edge endpoints", () => {
 const items: HistoricalPackage[] = [];
 for(let i=0;i<24;i++){const v=Math.sin(i*1.37)*8+i;items.push(pack(String(i),"2026-01-"+String(i+1).padStart(2,"0"),[["A",v],["B",v*2],["C",100-v*3],["D",i*i]]));}
 const result=buildHypothesisNetwork(items,{permutations:199,seed:33});
 assert.equal(result.valid,true);
 if(result.valid){assert.equal(result.nodes.length,4);assert.equal(result.nodes.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y)),true);assert.equal(result.edges.every(e=>result.nodes.some(n=>n.id===e.left)&&result.nodes.some(n=>n.id===e.right)),true);assert.equal(result.summary.edges,result.edges.length);}
});
test("returns a valid empty network when fewer than two hypotheses exist",()=>{
 const result=buildHypothesisNetwork([pack("1","2026-02-01",[["A",1]]),pack("2","2026-02-02",[["A",2]])]);
 assert.equal(result.valid,true);
 if(result.valid){assert.equal(result.nodes.length,0);assert.equal(result.edges.length,0);}
});
