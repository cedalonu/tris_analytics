import test from "node:test";
import assert from "node:assert/strict";
import {classifyPastOnlyRegimes} from "./past-only-regime-classifier";
import type {Draw,Digit} from "../research-core";
const make=(start:number,values:Digit[]):Draw[]=>values.map((d,i)=>({drawId:start+i,digits:[d,d,d,d,d]}));
test("labels each target using exactly prior history and never the target draw",()=>{const draws=make(100,Array.from({length:60},(_,i)=>(i<50?i%5:8) as Digit));const r=classifyPastOnlyRegimes(draws,150,159);assert.equal(r.labels.length,10);assert.equal(r.labels[0].sourceEndDrawId,149);assert.equal(r.labels[0].sourceStartDrawId,100);assert.ok(r.labels[0].regimeId.includes("pool-shift"));assert.equal(r.labels[0].drawId,150);});
test("deterministic labels and diagnostics",()=>{const draws=make(1,Array.from({length:80},(_,i)=>(i%10) as Digit));assert.deepEqual(classifyPastOnlyRegimes(draws,51,80),classifyPastOnlyRegimes(draws,51,80));});
test("marks targets without warmup as skipped, without fabricating labels",()=>{const draws=make(1,Array.from({length:55},(_,i)=>(i%10) as Digit));const r=classifyPastOnlyRegimes(draws,26,55);assert.equal(r.labels.length,5);assert.equal(r.skippedDrawIds.length,25);});
test("rejects gaps, absent target ranges, and invalid options",()=>{assert.throws(()=>classifyPastOnlyRegimes([{drawId:1,digits:[1,2,3,4,5]},{drawId:3,digits:[1,2,3,4,5]}],1,3));const draws=make(1,Array.from({length:60},(_,i)=>(i%10) as Digit));assert.throws(()=>classifyPastOnlyRegimes(draws,61,62));assert.throws(()=>classifyPastOnlyRegimes(draws,51,60,{poolTvThreshold:0}));});
