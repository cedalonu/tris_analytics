import test from "node:test";
import assert from "node:assert/strict";
import {analyzePersistence} from "./regime-persistence";
import type {Draw,Digit} from "../research-core";
const make=(start:number,values:Digit[]):Draw[]=>values.map((d,i)=>({drawId:start+i,digits:[d,d,d,d,d]}));
const baseline=Array.from({length:50},(_,i)=>(i%5) as Digit);
test("persistent shift requires two consecutive flagged blocks",()=>{
 const values:Digit[]=[...baseline,...Array.from({length:30},()=>8 as Digit)];
 const r=analyzePersistence(make(1000,values));
 const p=r.features.find(f=>f.feature==="position-0")!;
 assert.equal(p.pattern,"persistent");assert.equal(p.longestWatchRun,3);
});
test("one shifted block followed by baseline-like blocks is transient",()=>{
 const values:Digit[]=[...baseline,...Array.from({length:10},()=>8 as Digit),...Array.from({length:20},(_,i)=>(i%5) as Digit)];
 const p=analyzePersistence(make(2000,values)).features.find(f=>f.feature==="position-0")!;
 assert.equal(p.pattern,"transient");
});
test("a later return close to the fixed reference is labelled reverted",()=>{
 const values:Digit[]=[...baseline,...Array.from({length:20},()=>8 as Digit),...Array.from({length:10},(_,i)=>(i%5) as Digit)];
 const p=analyzePersistence(make(3000,values)).features.find(f=>f.feature==="position-0")!;
 assert.equal(p.pattern,"persistent"); // two shifted blocks take precedence over later return
 assert.equal(p.returnBlock,2);
});
test("insufficient reference history produces no feature conclusions",()=>{
 const r=analyzePersistence(make(4000,[1,2,3,4,5,6,7,8,9,0]));
 assert.equal(r.features.length,0);
});
test("rejects gaps and invalid digits",()=>{
 assert.throws(()=>analyzePersistence([{drawId:1,digits:[1,2,3,4,5]},{drawId:3,digits:[1,2,3,4,5]}]),/non-contiguous/);
 assert.throws(()=>analyzePersistence([{drawId:1,digits:[1,2,3,4,10] as Draw["digits"]}]),/invalid/);
});
