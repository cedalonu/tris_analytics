/** Walk-forward pool method comparison against uniform and frequency baselines.
 * Descriptive research only; callers must supply validated, chronologically sorted draws.
 */
import type { Draw, Digit, Pos, PoolMethod } from '../research-core';
import { buildPool } from '../research-core';

export interface PoolExperimentRow {
  position:Pos; method:PoolMethod; poolSize:number; window:number; tested:number;
  hits:number; hitRate:number; uniformRate:number; liftVsUniform:number;
  fixedFrequencyHits:number; fixedFrequencyRate:number;
  rollingFrequencyHits:number; rollingFrequencyRate:number;
  pairedDiffVsRolling:number; pairedDiffCI95:[number,number];
  warnings:string[];
}
const METHODS:PoolMethod[]=['frequency','long-absence','short-absence','balanced','recent-frequency'];
const DIGITS:Digit[]=[0,1,2,3,4,5,6,7,8,9];
const topFrequency=(history:Digit[],size:number):Digit[]=>{
 const counts=Array(10).fill(0);
 for(const d of history)counts[d]++;
 return DIGITS.slice().sort((a,b)=>counts[b]-counts[a]||a-b).slice(0,size);
};
/** Approximate paired confidence interval for mean per-draw hit difference. */
const pairedCI=(values:number[]):[number,number]=>
{
 if(!values.length)return [0,0];
 const mean=values.reduce((s,x)=>s+x,0)/values.length;
 if(values.length<2)return [mean,mean];
 const variance=values.reduce((s,x)=>s+(x-mean)**2,0)/(values.length-1);
 const se=Math.sqrt(variance/values.length);
 return [mean-1.96*se,mean+1.96*se];
};
const validateInputs=(draws:Draw[],position:Pos,methods:PoolMethod[],sizes:number[],minTrain:number,window:number)=>{
 if(!Number.isInteger(position)||position<0||position>4)throw new Error('position must be an integer from 0 to 4');
 if(!Number.isInteger(minTrain)||minTrain<1)throw new Error('minTrain must be a positive integer');
 if(!Number.isInteger(window)||window<1)throw new Error('window must be a positive integer');
 if(!methods.length||methods.some(m=>!METHODS.includes(m)))throw new Error('methods must contain valid pool methods');
 if(!sizes.length||sizes.some(s=>!Number.isInteger(s)||s<1||s>10))throw new Error('sizes must be integers from 1 to 10');
 for(let i=0;i<draws.length;i++){
  const d=draws[i];
  if(!Number.isInteger(d.drawId)||d.drawId<=0||!Array.isArray(d.digits)||d.digits.length!==5||d.digits.some(x=>!Number.isInteger(x)||x<0||x>9))
   throw new Error('draws must be validated with five digits 0-9 and positive integer IDs');
  if(i&&draws[i].drawId<=draws[i-1].drawId)throw new Error('draws must be strictly sorted by ascending drawId');
 }
};
/** Walk-forward: all pools for target draw use prior observations only. */
export function runPoolMethodExperiment(draws:Draw[],position:Pos,methods:PoolMethod[],sizes:number[],minTrain=100,window=50):PoolExperimentRow[]{
 validateInputs(draws,position,methods,sizes,minTrain,window);
 const out:PoolExperimentRow[]=[];
 const fixedHistory=draws.slice(0,minTrain).map(d=>d.digits[position]);
 const fixedPools=new Map<number,Digit[]>([...new Set(sizes)].map(k=>[k,topFrequency(fixedHistory,k)]));
 for(const method of methods)for(const k of [...new Set(sizes)]){
  let hits=0,fixedHits=0,rollingHits=0,tested=0;const deltas:number[]=[];
  for(let i=minTrain;i<draws.length;i++){
   const prior=draws.slice(0,i).map(d=>d.digits[position]),target=draws[i].digits[position];
   const recent=prior.slice(-window);
   const pool=buildPool(prior,method,k,window);
   const fixedPool=fixedPools.get(k)!;
   const rollingPool=topFrequency(recent,k);
   const h=pool.includes(target)?1:0,fh=fixedPool.includes(target)?1:0,rh=rollingPool.includes(target)?1:0;
   hits+=h;fixedHits+=fh;rollingHits+=rh;deltas.push(h-rh);tested++;
  }
  const rate=tested?hits/tested:0,fr=tested?fixedHits/tested:0,rr=tested?rollingHits/tested:0;
  out.push({position,method,poolSize:k,window,tested,hits,hitRate:rate,uniformRate:k/10,liftVsUniform:rate/(k/10),
    fixedFrequencyHits:fixedHits,fixedFrequencyRate:fr,rollingFrequencyHits:rollingHits,rollingFrequencyRate:rr,
    pairedDiffVsRolling:tested?deltas.reduce((s,x)=>s+x,0)/tested:0,pairedDiffCI95:pairedCI(deltas),
    warnings:['Walk-forward pools use only preceding draws; baseline pools use the same prior history for each evaluated draw.',
      'Paired CI is a simple normal approximation and does not account for serial dependence or multiple comparisons.',
      'Candidate method/size/window selection creates optimism; treat this as discovery, then freeze candidates for new validation data.']});
 }
 return out;
}
/** Full exploratory matrix across positions, methods, pool sizes and trailing windows. */
export function runPoolExperimentMatrix(draws:Draw[],positions:Pos[]=[0,1,2,3,4],methods:PoolMethod[]=METHODS,sizes:number[]=[1,2,3,4,5,6,7,8,9,10],minTrain=100,windows:number[]=[20,50,100,200]):PoolExperimentRow[]{
 if(!windows.length||windows.some(w=>!Number.isInteger(w)||w<1))throw new Error('windows must be positive integers');
 const rows:PoolExperimentRow[]=[];
 for(const position of positions)for(const window of [...new Set(windows)])
  rows.push(...runPoolMethodExperiment(draws,position,methods,sizes,minTrain,window));
 return rows;
}
