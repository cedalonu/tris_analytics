import test from "node:test";
import assert from "node:assert/strict";
import {evaluateStructuralMotifBlockBootstrap} from "./structural-motif-block-bootstrap";
const make=(ids:number[])=>ids.map((id,i)=>({targetDrawId:id,family:"F",position:0,structuralHit:i%2===0,randomMean:.3}));
test("bootstrap reproducible for a fixed seed",()=>{const rows=make(Array.from({length:30},(_,i)=>100+i));const a=evaluateStructuralMotifBlockBootstrap(rows,{blockSize:3,replicates:250,seed:42}),b=evaluateStructuralMotifBlockBootstrap(rows,{blockSize:3,replicates:250,seed:42});assert.deepEqual(a,b);assert.equal(a.summary.evaluatedGroups,1);});
test("moving blocks never bridge draw-id gaps",()=>{const rows=make([...Array.from({length:6},(_,i)=>10+i),...Array.from({length:6},(_,i)=>30+i)]);const r=evaluateStructuralMotifBlockBootstrap(rows,{blockSize:3,replicates:200});assert.equal(r.summary.evaluatedGroups,1);assert.equal(r.metrics[0].contiguousRuns,2);assert.equal(r.metrics[0].evaluatedTargets,12);});
test("insufficient contiguous support is skipped rather than imputed",()=>{const r=evaluateStructuralMotifBlockBootstrap(make([1,2,3,4,5,6,7,8,9]),{blockSize:3,replicates:200});assert.equal(r.summary.skippedGroups,1);assert.equal(r.metrics.length,0);});
