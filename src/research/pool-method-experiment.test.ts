import test from 'node:test';
import assert from 'node:assert/strict';
import { runPoolMethodExperiment } from './pool-method-experiment';
import type { Draw } from '../research-core';

const draws:Draw[]=Array.from({length:120},(_,i)=>({
 drawId:i+1,
 digits:[0,1,2,3,4].map(p=>((i+p)%10)) as Draw['digits'],
 date:'2026-01-01'
}));

test('walk-forward pool experiment reports baselines and paired differences',()=>{
 const result=runPoolMethodExperiment(draws,0,['frequency','long-absence'],[2,5],100,50);
 assert.equal(result.length,4);
 assert.ok(result.every(r=>r.tested===20));
 assert.ok(result.every(r=>r.poolSize===2||r.poolSize===5));
 assert.ok(result.every(r=>r.uniformRate===r.poolSize/10));
 assert.ok(result.every(r=>r.fixedFrequencyRate>=0&&r.fixedFrequencyRate<=1));
 assert.ok(result.every(r=>r.rollingFrequencyRate>=0&&r.rollingFrequencyRate<=1));
 assert.ok(result.every(r=>r.pairedDiffCI95[0]<=r.pairedDiffCI95[1]));
 assert.ok(result.every(r=>r.pairedDiffVsRolling>=-1&&r.pairedDiffVsRolling<=1));
});
test('experiment is deterministic for fixed inputs',()=>{
 const a=runPoolMethodExperiment(draws,4,['balanced'],[3],100,40);
 const b=runPoolMethodExperiment(draws,4,['balanced'],[3],100,40);
 assert.deepEqual(a,b);
});
test('empty evaluation period returns zero tested and finite output',()=>{
 const result=runPoolMethodExperiment(draws.slice(0,100),2,['recent-frequency'],[4],100,30);
 assert.equal(result[0].tested,0);
 assert.equal(result[0].hitRate,0);
 assert.deepEqual(result[0].pairedDiffCI95,[0,0]);
});
