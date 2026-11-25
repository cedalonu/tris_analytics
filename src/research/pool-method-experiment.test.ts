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

test('ranking-prefix optimization preserves pool membership and hit totals',()=>{
 const methods=['frequency','long-absence','short-absence','balanced','recent-frequency'] as const;
 const sizes=[1,3,6,10],position=1,minTrain=100,window=35;
 const optimized=runPoolMethodExperiment(draws,position,[...methods],sizes,minTrain,window);
 const frequency=(hist:Draw['digits'][number][],k:number)=>Array.from({length:10},(_,d)=>d)
  .sort((a,b)=>hist.filter(x=>x===b).length-hist.filter(x=>x===a).length||a-b).slice(0,k);
 for(const row of optimized){
  let expectedHits=0,expectedFixed=0,expectedRolling=0;
  for(let i=minTrain;i<draws.length;i++){
   const hist=draws.slice(0,i).map(d=>d.digits[position]),target=draws[i].digits[position];
   const pool=buildPool(hist,row.method,row.poolSize,window);
   const fixed=frequency(draws.slice(0,minTrain).map(d=>d.digits[position]),row.poolSize);
   const rolling=frequency(hist.slice(-window),row.poolSize);
   expectedHits+=Number(pool.includes(target));expectedFixed+=Number(fixed.includes(target));expectedRolling+=Number(rolling.includes(target));
  }
  assert.equal(row.hits,expectedHits,row.method+' pool '+row.poolSize);
  assert.equal(row.fixedFrequencyHits,expectedFixed);
  assert.equal(row.rollingFrequencyHits,expectedRolling);
 }
});


test('incremental pool rankings match buildPool for seeded varied history',()=>{
 let state=123456789;
 const next=()=>{state=(1664525*state+1013904223)>>>0;return state%10;};
 const varied:Draw[]=Array.from({length:240},(_,i)=>({drawId:i+1,digits:Array.from({length:5},next) as Draw['digits']}));
 for(const position of [0,2,4] as const)for(const window of [20,50,100]){
  const rows=runPoolMethodExperiment(varied,position,[...methods],[1,2,5,8,10],30,window);
  for(const row of rows)for(let i=30;i<varied.length;i++){
   const history=varied.slice(0,i).map(d=>d.digits[position]);
   const actual=buildPool(history,row.method,row.poolSize,window);
   const target=varied[i].digits[position];
   // Per-row hit totals must match the direct, non-optimized builder.
   const directHits=actual.includes(target)?1:0;
   assert.ok(directHits===0||directHits===1);
  }
  // Directly compare aggregated results for each candidate setting.
  for(const row of rows){
   let hitCount=0;
   for(let i=30;i<varied.length;i++){
    const history=varied.slice(0,i).map(d=>d.digits[position]);
    hitCount+=Number(buildPool(history,row.method,row.poolSize,window).includes(varied[i].digits[position]));
   }
   assert.equal(row.hits,hitCount,`pos=${position} method=${row.method} size=${row.poolSize} window=${window}`);
  }
 }
});
