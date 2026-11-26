import test from "node:test";
import assert from "node:assert/strict";
import {stabilizePastOnlyRegimes} from "./regime-transition-stability";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";
function labels(values:string[]):ProspectiveRegimeLabel[]{return values.map((regimeId,i)=>({drawId:100+i,regimeId,method:"past-only-v1",sourceStartDrawId:50+i,sourceEndDrawId:99+i}));}
test("requires three consecutive labels and never backfills the first two",()=>{
 const r=stabilizePastOnlyRegimes(labels(["A","A","A","A","B","B","B","B"]));
 assert.deepEqual(r.points.map(x=>x.status),["watch","watch","confirmed","stable","watch","watch","confirmed","stable"]);
 assert.deepEqual(r.auditLabels.map(x=>x.regimeId),["transition-watch","transition-watch","A","A","transition-watch","transition-watch","B","B"]);
 assert.equal(r.points[4].confirmedRegimeId,"A");
 assert.equal(r.points[6].confirmedAtDrawId,106);
});
test("distinguishes a transient fluctuation from a persistent episode",()=>{
 const r=stabilizePastOnlyRegimes(labels(["A","A","A","A","B","B","A","A","A","C","C","C"]));
 assert.deepEqual(r.episodes.map(x=>x.status),["persistent","transient","persistent","persistent"]);
 assert.equal(r.transientEpisodes,1);
 assert.equal(r.episodes[1].length,2);
 assert.equal(r.points[6].status,"return-to-confirmed");
 assert.equal(r.points[6].effectiveRegimeId,"A");
});
test("keeps an unfinished terminal run unconfirmed",()=>{
 const r=stabilizePastOnlyRegimes(labels(["A","A","A","B","B"]));
 assert.equal(r.episodes[1].status,"unconfirmed-at-end");
 assert.equal(r.points[4].effectiveRegimeId,"transition-watch");
});
test("rejects noncontiguous, leaky, empty, and invalid inputs",()=>{
 assert.throws(()=>stabilizePastOnlyRegimes([]));
 assert.throws(()=>stabilizePastOnlyRegimes(labels(["A","B"]),{minConsecutive:1}));
 const gap=labels(["A","B"]);gap[1].drawId++;
 assert.throws(()=>stabilizePastOnlyRegimes(gap));
 const leak=labels(["A"]);leak[0].sourceEndDrawId=100;
 assert.throws(()=>stabilizePastOnlyRegimes(leak));
});
