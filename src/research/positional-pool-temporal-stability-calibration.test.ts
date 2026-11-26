import {test} from "node:test";
import {strict as assert} from "node:assert";
import {calibratePositionalPoolTemporalStability} from "./positional-pool-temporal-stability-calibration";

test("phase 30 calibration is deterministic and includes null, stable and alternating scenarios",()=>{
 const options={replications:12,blocksPerReplication:20,windowBlocks:5,stepBlocks:1,seed:1234};
 const a=calibratePositionalPoolTemporalStability(options),b=calibratePositionalPoolTemporalStability(options);
 assert.deepEqual(a,b);
 assert.deepEqual(a.scenarios.map(x=>x.scenario),["null-independent","persistent-positive","persistent-negative","alternating-sign","weak-positive"]);
 assert.ok(a.scenarios.every(x=>x.replications===12));
 assert.ok(a.scenarios.every(x=>x.falseStableAlertRate>=0&&x.falseStableAlertRate<=1));
 assert.ok(a.scenarios.every(x=>x.falseStableAlertWilson95[0]<=x.falseStableAlertWilson95[1]));
});

test("stable positive and negative scenarios exercise the expected classifications",()=>{
 const report=calibratePositionalPoolTemporalStability({replications:20,blocksPerReplication:25,windowBlocks:5,seed:42});
 const positive=report.scenarios.find(x=>x.scenario==="persistent-positive")!;
 const negative=report.scenarios.find(x=>x.scenario==="persistent-negative")!;
 assert.ok(positive.detectedPositive>0);
 assert.ok(negative.detectedNegative>0);
});

test("rejects invalid calibration settings",()=>{
 assert.throws(()=>calibratePositionalPoolTemporalStability({blocksPerReplication:4}),/invalid positional pool calibration/);
 assert.throws(()=>calibratePositionalPoolTemporalStability({consistencyThreshold:.5}),/invalid positional pool calibration/);
});
