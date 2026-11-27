import test from "node:test";
import assert from "node:assert/strict";
import {evaluateStructuralMotifBootstrapSensitivity} from "./structural-motif-bootstrap-sensitivity";
const rows=Array.from({length:50},(_,i)=>({targetDrawId:500+i,family:"F",position:1,structuralHit:i%3===0,randomMean:.25}));
test("sensitivity reports all requested block lengths and is deterministic",()=>{const a=evaluateStructuralMotifBootstrapSensitivity(rows,{blockSizes:[3,5,7],replicates:250,seed:77}),b=evaluateStructuralMotifBootstrapSensitivity(rows,{blockSizes:[3,5,7],replicates:250,seed:77});assert.deepEqual(a,b);assert.deepEqual(a.summary.requestedBlockSizes,[3,5,7]);assert.equal(a.groups[0].evaluatedBlockSizes,3);});
test("missing block-size support is explicitly incomplete",()=>{const short=rows.slice(0,18),r=evaluateStructuralMotifBootstrapSensitivity(short,{blockSizes:[3,5,7],replicates:200});assert.equal(r.groups[0].evaluatedBlockSizes,2);assert.equal(r.groups[0].conclusion,"incomplete-across-block-sizes");assert.equal(r.perBlock[2].summary.evaluatedGroups,0);});
test("no fabricated groups when input is empty",()=>{const r=evaluateStructuralMotifBootstrapSensitivity([],{blockSizes:[3],replicates:200});assert.equal(r.summary.groups,0);});
