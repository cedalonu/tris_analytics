import test from "node:test";
import assert from "node:assert/strict";
import {buildCandidateOverlapGraph} from "./candidate-overlap-graph";
import {generateIntuitionCandidates} from "./intuition-candidate-generator";

test("default candidate graph covers all 1,095 candidates with expected family counts",()=>{
 const graph=buildCandidateOverlapGraph();
 assert.equal(graph.nodeCount,1095);
 assert.deepEqual(graph.familyCounts,{transition:30,"position-mutation":25,"absence-return":40,"pool-ranking":1000});
 assert.ok(graph.componentCount>0&&graph.edges.length>0);
});
test("shared positions and lags create explicit edges while disjoint configs may not",()=>{
 const candidates=generateIntuitionCandidates({modes:["full5"],lags:[1],positions:[0],absenceThresholds:[0],includePools:false});
 const graph=buildCandidateOverlapGraph(candidates);
 const transition=graph.nodes.find(x=>x.family==="transition")!;
 const mutation=graph.nodes.find(x=>x.family==="position-mutation")!;
 assert.ok(transition.components.includes("position:R1"));
 assert.ok(transition.components.includes("lag:1"));
 assert.ok(mutation.components.includes("position:R1"));
 assert.ok(mutation.components.includes("lag:1"));
 assert.ok(graph.edges.some(e=>e.a===transition.id&&e.b===mutation.id||e.a===mutation.id&&e.b===transition.id));
});
test("graph rejects duplicate candidate IDs",()=>{
 const c=generateIntuitionCandidates({modes:["full5"],lags:[1],positions:[0],absenceThresholds:[0],includePools:false});
 assert.throws(()=>buildCandidateOverlapGraph([c[0],c[0]]),/unique/);
});
