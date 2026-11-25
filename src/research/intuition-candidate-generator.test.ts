import test from "node:test";
import assert from "node:assert/strict";
import {candidateToSignalRecord,generateIntuitionCandidates} from "./intuition-candidate-generator";

test("candidate catalog is deterministic and IDs are unique",()=>{
 const a=generateIntuitionCandidates({includePools:false}),b=generateIntuitionCandidates({includePools:false});
 assert.deepEqual(a,b);assert.equal(new Set(a.map(c=>c.id)).size,a.length);
});
test("families include transition, mutation and absence hypotheses",()=>{
 const candidates=generateIntuitionCandidates({includePools:false});
 assert.ok(candidates.some(c=>c.family==="transition"&&c.config.lag===3));
 assert.ok(candidates.some(c=>c.family==="position-mutation"&&c.config.position===4));
 assert.ok(candidates.some(c=>c.family==="absence-return"&&c.config.priorMisses===20));
});
test("pool catalog can be generated and config is frozen deterministically",()=>{
 const candidates=generateIntuitionCandidates({positions:[0],poolMethods:["frequency"],poolSizes:[2,5],windows:[20,50]});
 const pools=candidates.filter(c=>c.family==="pool-ranking");
 assert.equal(pools.length,4);assert.ok(pools.every(c=>c.frozenConfig===JSON.stringify(c.config,Object.keys(c.config).sort())));
});
test("conversion creates empty hypothesis record without promoting it",()=>{
 const c=generateIntuitionCandidates({includePools:false})[0],r=candidateToSignalRecord(c,"2026-11-25T12:00:00Z");
 assert.equal(r.status,"hypothesis");assert.equal(r.evidence.length,0);assert.ok(r.frozenConfig);
 assert.throws(()=>candidateToSignalRecord(c,"invalid timestamp"),/timestamp/);
});
