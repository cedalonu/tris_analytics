import {strict as assert} from "node:assert";
import {test} from "node:test";
import {analyzeHistoricalRegimeComparison} from "./historical-regime-comparison";
import type {Draw} from "../research-core";
function sample(n=180):Draw[]{return Array.from({length:n},(_,i)=>({drawId:i+1,date:"2025-01-01",digits:(i<90?[0,0,0,0,0]:[i%10,(i+2)%10,(i+4)%10,(i+6)%10,(i+8)%10]) as any}));}
test("builds a chronological report with episode and positional sections",()=>{const d=sample();const r=analyzeHistoricalRegimeComparison(d,51,180);assert.equal(r.method,"tris-historical-regime-comparison-v1");assert.ok(r.episodes.length>0);assert.ok(r.profiles.regimes.length>0);assert.equal(r.summary.labeledDraws,130);});
test("rejects target windows without sufficient prior history",()=>assert.throws(()=>analyzeHistoricalRegimeComparison(sample(),10,40),/lack sufficient past history/));
test("rejects invalid minimum support",()=>assert.throws(()=>analyzeHistoricalRegimeComparison(sample(),51,180,{minimumSupport:0}),/minimumSupport/));
test("reports exact configured windows",()=>{const r=analyzeHistoricalRegimeComparison(sample(),51,180,{referenceWindow:20,recentWindow:20,minimumSupport:10});assert.equal(r.parameters.referenceWindow,20);assert.equal(r.parameters.recentWindow,20);});
test("does not classify absent evidence as a regime shift",()=>{const r=analyzeHistoricalRegimeComparison(sample(),51,180);assert.ok(r.changePoints.every(x=>x.changed));});
