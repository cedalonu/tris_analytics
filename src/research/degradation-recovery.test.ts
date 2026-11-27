import test from "node:test";import assert from "node:assert/strict";
import {assessDegradationRecovery} from "./degradation-recovery";
const make=(scores:number[])=>scores.map((s,i)=>({candidateKey:"h",recordedAt:new Date(Date.UTC(2020,0,i+1)).toISOString(),classification:s>=65?"favorable-observed":s>=45?"neutral":"unfavorable-observed",resolved:10+i*5}));
test("handles insufficient histories",()=>assert.equal(assessDegradationRecovery([{candidateKey:"x",history:[]}]).rows[0].state,"insufficient"));
test("is deterministic",()=>{const input=[{candidateKey:"x",history:make([40,40,40])}];assert.deepEqual(assessDegradationRecovery(input),assessDegradationRecovery(input));});
test("returns stable state for flat history",()=>{const r=assessDegradationRecovery([{candidateKey:"x",history:make([50,50,50,50])}]);assert.equal(r.rows[0].events.length,0);});
test("ties events to chronological snapshots",()=>{const r=assessDegradationRecovery([{candidateKey:"x",history:make([85,65,40,65,85])}]);assert.equal(r.rows[0].observations,5);assert.ok(r.rows[0].events.every(e=>e.score>=0&&e.score<=100));});
test("uses running peak rather than future maximum",()=>{const r=assessDegradationRecovery([{candidateKey:"x",history:make([50,45,80])}]);assert.equal(r.rows[0].events.some(e=>e.to==="degraded"&&e.at===new Date(Date.UTC(2020,0,2)).toISOString()),false);});
test("does not use omitted future snapshots",()=>{const all=make([70,60,50,70]),a=assessDegradationRecovery([{candidateKey:"x",history:all.slice(0,2)}]).rows[0],b=assessDegradationRecovery([{candidateKey:"x",history:all.slice(0,2)}]).rows[0];assert.deepEqual(a,b);});
