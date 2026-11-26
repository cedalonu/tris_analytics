import {test} from "node:test";
import {strict as assert} from "node:assert";
import {calibratePositionalRegimeStability} from "./positional-regime-stability-calibration";
test("synthetic calibration is deterministic and covers five scenarios",()=>{const o={replications:4,drawsPerReplication:76,blockSize:25,minimumDrawSupport:10,seed:12345};const a=calibratePositionalRegimeStability(o),b=calibratePositionalRegimeStability(o);assert.deepEqual(a,b);assert.deepEqual(a.scenarios.map(x=>x.scenario),["stationary-uniform","stationary-concentrated","abrupt-shift","gradual-shift","temporary-pulse"]);assert.ok(a.scenarios.every(x=>x.positionObservations===20));});
test("calibration rejects invalid length and support",()=>{assert.throws(()=>calibratePositionalRegimeStability({drawsPerReplication:50}),/invalid positional stability/);assert.throws(()=>calibratePositionalRegimeStability({blockSize:10,minimumDrawSupport:11}),/invalid positional stability/);});
