import test from "node:test";
import assert from "node:assert/strict";
import {analyzeContextualMemory} from "./contextual-memory";
import type {Draw} from "../research-core";

const rows=(n:number):Draw[]=>Array.from({length:n},(_,i)=>{
 const digits=[i%2,0,0,0,0] as Draw["digits"];
 return {drawId:7000+i,digits};
});

test("screens both source-pool and duplicate-count contexts across five lags and 25 position pairs",()=>{
 const r=analyzeContextualMemory(rows(240));
 assert.equal(r.scopes[0].comparisons.length,250);
 assert.ok(r.scopes[0].comparisons.some(x=>x.context==="source-pool-size"&&x.lag===5&&x.sourcePosition===4&&x.targetPosition===4));
 assert.ok(r.scopes[0].comparisons.some(x=>x.context==="source-duplicate-count"));
});

test("reports pool-size context information using source contest only",()=>{
 const r=analyzeContextualMemory(rows(240));
 const c=r.scopes[0].comparisons.find(x=>x.context==="source-pool-size"&&x.lag===1&&x.sourcePosition===0&&x.targetPosition===0)!;
 assert.equal(c.observations,239);
 assert.ok(c.contextMutualInformationBits>0.5);
 assert.ok(c.buckets.length>=2);
 assert.ok(c.buckets.every(b=>b.observations>=20));
});

test("creates bounded recent scopes",()=>{
 const r=analyzeContextualMemory(rows(1200));
 assert.deepEqual(r.scopes.map(s=>s.scope),["all-history","last-200","last-1000"]);
 assert.equal(r.scopes[1].draws,200);
 assert.equal(r.scopes[2].draws,1000);
});

test("rejects gaps and malformed rows",()=>{
 const gap=rows(30);gap.splice(4,1);
 assert.throws(()=>analyzeContextualMemory(gap),/non-contiguous/);
 const bad=rows(30);bad[2]={...bad[2],digits:[0,1,2,3,10] as Draw["digits"]};
 assert.throws(()=>analyzeContextualMemory(bad),/invalid draw/);
});
