/** Walk-forward pool method comparison against uniform and frequency baselines.
 * Descriptive research only; callers must supply validated, chronologically sorted draws.
 */
import type { Draw, Digit, Pos, PoolMethod } from '../research-core';
import { buildPool } from '../research-core';

export interface PoolExperimentRow {
  position:Pos; method:PoolMethod; poolSize:number; tested:number;
  hits:number; hitRate:number; uniformRate:number; liftVsUniform:number;
  fixedFrequencyHits:number; fixedFrequencyRate:number;
  rollingFrequencyHits:number; rollingFrequencyRate:number;
  pairedDiffVsRolling:number; pairedDiffCI95:[number,number];
  warnings:string[];
}
const topFrequency=(history:Digit[],size:number):Digit[]=>{
 const counts=Array.from({length:10},(_,d)=>history.filter(x=>x===d).length);
 return Array.from({length:10},(_,d)=>d as Digit).sort((a,b)=>counts[b]-counts[a]||a-b).slice(0,size);
};
/** Approximate paired confidence interval for mean per-draw hit difference. */
const pairedCI=(values:number[]):[number,number]=>{
 if(!values.length)return [0,0];
 const mean=values.reduce((s,x)=>s+x,0)/values.length;
 if(values.length<2)return [mean,mean];
 const variance=values.reduce((s,x)=>s+(x-mean)**2,0)/(values.length-1);
 const se=Math.sqrt(variance/values.length);
 return [mean-1.96*se,mean+1.96*se];
};
/** Walk-forward experiment: all pools for target draw use prior observations only. */
export function runPoolMethodExperiment(draws:Draw[],position:Pos,methods:PoolMethod[],sizes:number[],minTrain=100,window=50):PoolExperimentRow[]{
 const out:PoolExperimentRow[]=[];
 for(const method of methods)for(const rawSize of sizes){
  const k=Math.max(1,Math.min(10,Math.floor(rawSize)));
  let hits=0,fixedHits=0,rollingHits=0,tested=0;const deltas:number[]=[];
  for(let i=minTrain;i<draws.length;i++){
   const prior=draws.slice(0,i).map(d=>d.digits[position]),target=draws[i].digits[position];
   const recent=prior.slice(-window);
   const pool=buildPool(prior,method,k,window);
   const fixedPool=topFrequency(draws.slice(0,minTrain).map(d=>d.digits[position]),k);
   const rollingPool=topFrequency(recent,k);
   const h=pool.includes(target)?1:0,fh=fixedPool.includes(target)?1:0,rh=rollingPool.includes(target)?1:0;
   hits+=h;fixedHits+=fh;rollingHits+=rh;deltas.push(h-rh);tested++;
  }
  const rate=tested?hits/tested:0,fr=tested?fixedHits/tested:0,rr=tested?rollingHits/tested:0;
  out.push({position,method,poolSize:k,tested,hits,hitRate:rate,uniformRate:k/10,liftVsUniform:(k/10)?rate/(k/10):0,
    fixedFrequencyHits:fixedHits,fixedFrequencyRate:fr,rollingFrequencyHits:rollingHits,rollingFrequencyRate:rr,
    pairedDiffVsRolling:tested?deltas.reduce((s,x)=>s+x,0)/tested:0,pairedDiffCI95:pairedCI(deltas),
    warnings:['Walk-forward pools use only preceding draws; baseline pools use the same prior history for each evaluated draw.',
      'Paired CI is a simple normal approximation and does not account for serial dependence or multiple comparisons.',
      'Candidate method/size selection creates optimism; treat this as discovery, then freeze candidates for new validation data.']});
 }
 return out;
}
