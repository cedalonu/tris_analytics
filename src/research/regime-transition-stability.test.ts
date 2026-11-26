import test from "node:test";
import assert from "node:assert/strict";
import {stabilizePastOnlyRegimes} from "./regime-transition-stability";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";

function labels(regimes:string[]):ProspectiveRegimeLabel[]{
 return regimes.map((regimeId,i)=>({drawId:500+i,regimeId,method:"synthetic-test",sourceStartDrawId:400,sourceEndDrawId:499}));
}

test("online regime stabilization confirms only from the required draw onward",()=>{
 const report=stabilizePastOnlyRegimes(labels(["A","A","A","B","B","B","A","A"]),{minConsecutive:3});
 assert.deepEqual(report.points.map(p=>p.status),["watch","watch","confirmed","watch","watch","confirmed","watch","watch"]);
 assert.deepEqual(report.points.map(p=>p.effectiveRegimeId),["transition-watch","transition-watch","A","transition-watch","transition-watch","B","transition-watch","transition-watch"]);
 assert.equal(report.episodes[0].confirmedAtDrawId,502);
 assert.equal(report.episodes[1].confirmedAtDrawId,505);
 assert.equal(report.episodes[2].status,"transient");
 assert.equal(report.transientEpisodes,1);
});

test("past-only labels reject future source boundaries and noncontiguous IDs",()=>{
 const future=labels(["A","A","A"]);future[1].sourceEndDrawId=future[1].drawId;
 assert.throws(()=>stabilizePastOnlyRegimes(future),/past-only/);
 const gap=labels(["A","A","A"]);gap[2].drawId+=2;
 assert.throws(()=>stabilizePastOnlyRegimes(gap),/contiguous/);
});

test("regime stabilization validates minimum consecutive threshold and empty input",()=>{
 assert.throws(()=>stabilizePastOnlyRegimes(labels(["A"]),{minConsecutive:1}),/minConsecutive/);
 assert.throws(()=>stabilizePastOnlyRegimes([]),/requires labels/);
});
