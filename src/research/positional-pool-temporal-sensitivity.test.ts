import {test} from "node:test";
import {strict as assert} from "node:assert";
import {analyzePositionalPoolSensitivity} from "./positional-pool-temporal-sensitivity";
test("phase 31 sensitivity grid is deterministic and spans window overlap and thresholds",()=>{
 const options={replications:8,blocksPerReplication:12,windowBlocks:[5,8],stepModes:["one","non-overlap"] as Array<"one"|"non-overlap">,consistencyThresholds:[.7,.8],seed:99};
 const a=analyzePositionalPoolSensitivity(options),b=analyzePositionalPoolSensitivity(options);
 assert.deepEqual(a,b);
 assert.equal(a.rows.length,8);
 assert.ok(a.rows.every(x=>x.nullFalseStableRate>=0&&x.nullFalseStableRate<=1));
 assert.ok(a.rows.every(x=>x.stepBlocks===1||x.stepBlocks===x.windowBlocks));
});
test("phase 31 rejects invalid grids",()=>{
 assert.throws(()=>analyzePositionalPoolSensitivity({windowBlocks:[2]}),/invalid positional pool sensitivity/);
 assert.throws(()=>analyzePositionalPoolSensitivity({consistencyThresholds:[.5]}),/invalid positional pool sensitivity/);
});
