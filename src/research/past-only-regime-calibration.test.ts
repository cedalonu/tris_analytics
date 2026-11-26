import test from "node:test";
import assert from "node:assert/strict";
import {calibratePastOnlyRegimeClassifier} from "./past-only-regime-calibration";

test("regime calibration is deterministic and reports all frozen scenarios",()=>{
 const a=calibratePastOnlyRegimeClassifier({replications:8,targetsPerReplication:5,seed:77});
 const b=calibratePastOnlyRegimeClassifier({replications:8,targetsPerReplication:5,seed:77});
 assert.deepEqual(a,b);
 assert.equal(a.scenarios.length,3);
 assert.equal(a.window,50);
 assert.ok(a.scenarios.slice(0,2).every(s=>s.observations===40));
 assert.equal(a.scenarios[2].observations,8);
 assert.equal(a.scenarios[2].rate,1);
});
test("rejects invalid calibration parameters",()=>{
 assert.throws(()=>calibratePastOnlyRegimeClassifier({replications:0}));
 assert.throws(()=>calibratePastOnlyRegimeClassifier({targetsPerReplication:26}));
});
