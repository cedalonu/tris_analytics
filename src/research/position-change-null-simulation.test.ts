import test from "node:test";
import assert from "node:assert/strict";
import {simulatePositionChangeNull} from "./position-change-null-simulation";
test("null simulation is reproducible for a fixed seed",()=>{const a=simulatePositionChangeNull({replications:20,seed:77}),b=simulatePositionChangeNull({replications:20,seed:77});assert.deepEqual(a,b)});
test("null simulation validates options",()=>assert.throws(()=>simulatePositionChangeNull({replications:0}),/invalid null simulation options/));
test("family-wise false alarm rate is bounded",()=>{const r=simulatePositionChangeNull({replications:12,seriesPerReplication:5,seed:11});assert.ok(r.familyWiseFalseAlertRate>=0&&r.familyWiseFalseAlertRate<=1);assert.equal(r.stateCounts.stable+r.stateCounts["insufficient-data"]+r.stateCounts.improvement+r.stateCounts.deterioration+r.stateCounts["persistent-change"]+r.stateCounts.recovery,60)});
test("serial correlation and paired dependence are configurable",()=>{const r=simulatePositionChangeNull({replications:5,serialCorrelation:.4,pairedDependence:.7});assert.equal(r.serialCorrelation,.4);assert.equal(r.pairedDependence,.7)});
test("invalid dependence parameters are rejected",()=>{assert.throws(()=>simulatePositionChangeNull({serialCorrelation:1}),/invalid null simulation options/);assert.throws(()=>simulatePositionChangeNull({pairedDependence:-.1}),/invalid null simulation options/)});
