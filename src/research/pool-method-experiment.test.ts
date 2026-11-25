import test from 'node:test';
import assert from 'node:assert/strict';
import { runPoolMethodExperiment, runPoolExperimentMatrix } from './pool-method-experiment';
import type { Draw } from '../research-core';
import { buildPool } from '../research-core';
const draws:Draw[]=Array.from({length:120},(_,i)=>({drawId:i+1,digits:[0,1,2,3,4].map(p=>((i+p)%10)) as Draw['digits'],date:'2026-01-01'}));
test('walk-forward pool experiment reports baselines and paired differences',()=>{
 const result=runPoolMethodExperiment(draws,0,['frequency','long-absence'],[2,5],100,50);
 assert.equal(result.length,4); assert.equal(result[0].window,50);
 assert.ok(result.every(r=>r.tested===20&&[2,5].includes(r.poolSize)));
 assert.ok(result.every(r=>r.uniformRate===r.poolSize/10&&r.fixedFrequencyRate>=0&&r.fixedFrequencyRate<=1&&r.rollingFrequencyRate>=0&&r.rollingFrequencyRate<=1));
 assert.ok(result.every(r=>r.pairedDiffCI95[0]<=r.pairedDiffCI95[1]&&r.pairedDiffVsRolling>=-1&&r.pairedDiffVsRolling<=1));
});
test('experiment is deterministic for fixed inputs',()=>assert.deepEqual(runPoolMethodExperiment(draws,4,['balanced'],[3],100,40),runPoolMethodExperiment(draws,4,['balanced'],[3],100,40)));
test('empty evaluation period returns zero tested and finite output',()=>{
 const result=runPoolMethodExperiment(draws.slice(0,100),2,['recent-frequency'],[4],100,30);
 assert.equal(result[0].tested,0);assert.equal(result[0].hitRate,0);assert.deepEqual(result[0].pairedDiffCI95,[0,0]);
});
test('rejects invalid pool sizes, windows and unsorted draws',()=>{
 assert.throws(()=>runPoolMethodExperiment(draws,0,['frequency'],[0],100,50),/sizes/);
 assert.throws(()=>runPoolMethodExperiment(draws,0,['frequency'],[3],100,0),/window/);
 assert.throws(()=>runPoolMethodExperiment(draws.slice().reverse(),0,['frequency'],[3],100,50),/sorted/);
});
test('matrix expands positions, pool sizes and window choices',()=>{
 const matrix=runPoolExperimentMatrix(draws,[0,2],['balanced'],[2,4],100,[30,50]);
 assert.equal(matrix.length,8);assert.ok(matrix.every(r=>r.tested===20&&(r.window===30||r.window===50)));
});

test('frequency uses all history while recent-frequency uses trailing window',()=>{
 const history=[0,0,0,1,1,2,3,4,5,6,7,8,9] as Draw['digits'][number][];
 assert.deepEqual(buildPool(history,'frequency',2,3),[0,1]);
 assert.deepEqual(buildPool(history,'recent-frequency',2,3),[7,8]);
});
