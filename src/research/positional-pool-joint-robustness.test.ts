import {test} from "node:test";
import {strict as assert} from "node:assert";
import {analyzePositionalPoolJointRobustness} from "./positional-pool-joint-robustness";
import type {PositionalPoolScaleSensitivityReport} from "./positional-pool-scale-sensitivity";
import type {PositionalPoolOriginSensitivityReport} from "./positional-pool-origin-sensitivity";
const scale={method:"s",blockSizes:[10,20],minimumHistory:30,minimumDrawSupport:5,observations:[],groups:[
 {regimeId:"A",position:1,method:"frequency",poolSize:3,metric:"dominant-share-inclusion",scales:[{blockSize:10,correlation:.4,blocks:5},{blockSize:20,correlation:.5,blocks:4}],validScales:2,positiveScales:2,negativeScales:0,status:"same-positive-direction-all-scales"}
],limitations:[]} as PositionalPoolScaleSensitivityReport;
const origin={method:"o",blockSize:20,blockOffsets:[0,5],minimumHistory:30,minimumDrawSupport:5,observations:[],groups:[
 {regimeId:"A",position:1,method:"frequency",poolSize:3,metric:"dominant-share-inclusion",offsets:[{blockOffset:0,correlation:.3,blocks:5},{blockOffset:5,correlation:.2,blocks:4}],validOffsets:2,positiveOffsets:2,negativeOffsets:0,status:"same-positive-direction-all-offsets"}
],limitations:[]} as PositionalPoolOriginSensitivityReport;
test("identifies joint direction consistency across scales and origins",()=>{const r=analyzePositionalPoolJointRobustness(scale,origin);assert.equal(r.summary.positiveRobust,1);assert.equal(r.rows[0].classification,"same-positive-across-scale-and-origin");});
test("identifies direction conflict between scale and origin",()=>{const o={...origin,groups:origin.groups.map(g=>({...g,status:"same-negative-direction-all-offsets" as const,positiveOffsets:0,negativeOffsets:2}))};assert.equal(analyzePositionalPoolJointRobustness(scale,o).summary.conflict,1);});
