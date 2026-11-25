import test from "node:test";
import assert from "node:assert/strict";
import { analyzeRegimeChanges } from "./regime-change";
import type { Draw, Digit } from "../research-core";

const make=(start:number,values:Digit[]):Draw[]=>values.map((d,i)=>({drawId:start+i,digits:[d,d,d,d,d]}));

test("stable distributions do not trigger a watch flag",()=>{
 const values=Array.from({length:260},(_,i)=>(i%10) as Digit);
 const report=analyzeRegimeChanges(make(7000,values));
 assert.equal(report.comparisons.length,3);
 assert.ok(report.comparisons.every(c=>c.status==="stable"));
});

test("large positional and pool shift is flagged using disjoint windows",()=>{
 const values:Digit[]=[...Array.from({length:100},(_,i)=>(i%5) as Digit),...Array.from({length:20},()=>8 as Digit)];
 const report=analyzeRegimeChanges(make(8000,values));
 const short=report.comparisons.find(c=>c.referenceDraws===100&&c.recentDraws===20);
 assert.ok(short);
 assert.equal(short!.status,"watch");
 assert.ok(short!.watchFeatures.includes("position-0"));
 assert.equal(short!.referenceEndId+1,short!.recentStartId);
});

test("short history reports insufficient evidence rather than inventing comparisons",()=>{
 const report=analyzeRegimeChanges(make(9000,[1,2,3,4,5,6,7,8,9,0]));
 assert.equal(report.comparisons.length,0);
});

test("rejects gaps and malformed draws",()=>{
 assert.throws(()=>analyzeRegimeChanges([{drawId:1,digits:[1,2,3,4,5]},{drawId:3,digits:[1,2,3,4,5]}]),/non-contiguous/);
 assert.throws(()=>analyzeRegimeChanges([{drawId:1,digits:[1,2,3,4,10] as Draw["digits"]}]),/invalid draw/);
});
