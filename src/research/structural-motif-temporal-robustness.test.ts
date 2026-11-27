import test from "node:test";
import assert from "node:assert/strict";
import {evaluateStructuralMotifTemporalRobustness} from "./structural-motif-temporal-robustness";
const rows=Array.from({length:40},(_,i)=>({targetDrawId:100+i,family:"f",position:0,structuralHit:i>=30,randomMean:.2}));
test("keeps the terminal chronological holdout separate",()=>{const r=evaluateStructuralMotifTemporalRobustness(rows,{blocks:4,minimumPerBlock:5,holdoutFraction:.25});assert.equal(r.metrics.length,1);assert.equal(r.metrics[0].holdoutStart,130);assert.equal(r.metrics[0].holdoutEnd,139);assert.equal(r.metrics[0].holdout.structuralRate,1);assert.equal(r.metrics[0].training.structuralRate,0);});
test("does not report groups without enough training and holdout observations",()=>{const r=evaluateStructuralMotifTemporalRobustness(rows.slice(0,8));assert.equal(r.metrics.length,0);assert.equal(r.skipped.length,1);});
test("sorts input chronologically and produces deterministic blocks",()=>{const a=evaluateStructuralMotifTemporalRobustness([...rows].reverse()),b=evaluateStructuralMotifTemporalRobustness(rows);assert.deepEqual(a,b);});
