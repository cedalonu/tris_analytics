import test from "node:test";
import assert from "node:assert/strict";
import {simulatePositionChangeNull} from "./position-change-null-simulation";
test("null simulation is reproducible for a fixed seed",()=>{const a=simulatePositionChangeNull({replications:20,seed:77}),b=simulatePositionChangeNull({replications:20,seed:77});assert.deepEqual(a,b)});
test("null simulation validates options",()=>assert.throws(()=>simulatePositionChangeNull({replications:0}),/invalid null simulation options/));
test("family-wise false alarm rate is bounded",()=>{const r=simulatePositionChangeNull({replications:12,seriesPerReplication:5,seed:11});assert.ok(r.familyWiseFalseAlertRate>=0&&r.familyWiseFalseAlertRate<=1);assert.equal(r.stateCounts.stable+r.stateCounts["insufficient-data"]+r.stateCounts.improvement+r.stateCounts.deterioration+r.stateCounts["persistent-change"]+r.stateCounts.recovery,60)});
test("serial correlation and paired dependence are configurable",()=>{const r=simulatePositionChangeNull({replications:5,serialCorrelation:.4,pairedDependence:.7});assert.equal(r.serialCorrelation,.4);assert.equal(r.pairedDependence,.7)});
test("invalid dependence and inconsistent block sizes are rejected",()=>{assert.throws(()=>simulatePositionChangeNull({serialCorrelation:1}),/invalid null simulation options/);assert.throws(()=>simulatePositionChangeNull({pairedDependence:-.1}),/invalid null simulation options/);assert.throws(()=>simulatePositionChangeNull({drawsPerBlock:20,blockSize:25}),/invalid null simulation options/)});

import {simulatePositionChangeAlternative} from "./position-change-null-simulation";
test("alternative simulation is reproducible",()=>{const a=simulatePositionChangeAlternative({replications:10,seed:99}),b=simulatePositionChangeAlternative({replications:10,seed:99});assert.deepEqual(a,b)});
test("alternative simulation rejects invalid parameters and inconsistent block sizes",()=>{assert.throws(()=>simulatePositionChangeAlternative({blocks:4}),/invalid alternative simulation options/);assert.throws(()=>simulatePositionChangeAlternative({drawsPerBlock:20,blockSize:25}),/invalid alternative simulation options/)});
test("alternative scenarios report bounded detection metrics",()=>{for(const shape of ["abrupt-improvement","abrupt-deterioration","gradual-improvement","recovery"] as const){const r=simulatePositionChangeAlternative({replications:8,shape,seed:5});assert.ok(r.detectionRate>=0&&r.detectionRate<=1);assert.ok(r.correctDirectionRate>=0&&r.correctDirectionRate<=1)}});

test("alternative detection latency is never negative and only counts detected series",()=>{const r=simulatePositionChangeAlternative({replications:80,shape:"gradual-improvement",seed:2026});const latencyCount=Object.values(r.latencyDistribution).reduce((a,b)=>a+b,0);assert.ok(Object.keys(r.latencyDistribution).every(k=>Number(k)>=0));assert.ok(latencyCount<=r.replications);if(r.medianDetectionLatencyBlocks!==null)assert.ok(r.medianDetectionLatencyBlocks>=0)});
