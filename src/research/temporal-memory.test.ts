import test from "node:test";
import assert from "node:assert/strict";
import { analyzeTemporalMemory } from "./temporal-memory";
import type { Draw } from "../research-core";

function makeDraws(n:number):Draw[]{
  return Array.from({length:n},(_,i)=>{
    const a=i%10,b=(a+1)%10;
    return {drawId:5000+i,digits:[a,b,(i*3)%10,(i*7)%10,(i*9)%10] as Draw["digits"]};
  });
}

test("temporal memory evaluates all 25 position pairs at lags one through five",()=>{
  const report=analyzeTemporalMemory(makeDraws(240));
  assert.equal(report.scopes.length,2);
  assert.equal(report.scopes[0].comparisons.length,125);
  assert.equal(report.scopes[0].comparisons[0].observations,239);
  assert.ok(report.scopes[0].comparisons.some(x=>x.lag===5&&x.sourcePosition===4&&x.targetPosition===4));
});

test("detects a deterministic lag-one positional dependency descriptively",()=>{
  const report=analyzeTemporalMemory(makeDraws(300));
  const pair=report.scopes[0].comparisons.find(x=>x.lag===1&&x.sourcePosition===0&&x.targetPosition===0)!;
  assert.ok(pair.mutualInformationBits>0.5);
  assert.ok(pair.strongestTransitions.length>0);
  assert.equal(pair.strongestTransitions[0].conditionalRate,1);
  assert.equal(pair.strongestTransitions[0].liftVsTargetMarginal,1);
});

test("recent scopes are bounded and preserve the correct contest range",()=>{
  const report=analyzeTemporalMemory(makeDraws(1200));
  const recent=report.scopes.find(x=>x.scope==="last-200")!;
  const long=report.scopes.find(x=>x.scope==="last-1000")!;
  assert.equal(recent.draws,200);
  assert.equal(recent.firstDrawId,6000);
  assert.equal(recent.lastDrawId,6199);
  assert.equal(long.draws,1000);
  assert.equal(long.firstDrawId,5200);
});

test("rejects gaps instead of silently treating rows as adjacent",()=>{
  const rows=makeDraws(20);rows.splice(5,1);
  assert.throws(()=>analyzeTemporalMemory(rows),/non-contiguous/);
});

test("rejects malformed digits",()=>{
  const rows=makeDraws(20);rows[4]={...rows[4],digits:[0,1,2,3,10] as Draw["digits"]};
  assert.throws(()=>analyzeTemporalMemory(rows),/invalid draw/);
});
