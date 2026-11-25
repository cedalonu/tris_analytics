/** Additive statistical research core. Does not modify the existing UI or predictor. */
export type Digit = 0|1|2|3|4|5|6|7|8|9;
export type Pos = 0|1|2|3|4;
export interface Draw { drawId:number; date?:string; digits:Digit[]; source?:string }
export interface Validation { valid:Draw[]; errors:string[]; warnings:string[] }
export interface Stats { digit:Digit; count:number; rate:number; currentAbsence:number; meanGap:number|null; gaps:number[] }
export type PoolMethod = "frequency"|"long-absence"|"short-absence"|"balanced"|"recent-frequency";
export interface Evaluation { method:PoolMethod; position:Pos; size:number; tested:number; hits:number; hitRate:number; uniformReference:number; lift:number; hitDistribution:number[]; warnings:string[] }
const DIGITS:Digit[]=[0,1,2,3,4,5,6,7,8,9];
const isDigit=(v:unknown):v is Digit=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<=9;

/** Validates rows and flags duplicate IDs. Sorts the validated records chronologically by draw ID. */
export function validateDraws(rows:Draw[]):Validation {
 const errors:string[]=[],warnings:string[]=[],seen=new Set<number>(),valid:Draw[]=[];
 rows.forEach((r,i)=>{
  if(!Number.isInteger(r.drawId)||r.drawId<=0){errors.push("row "+i+": invalid draw ID");return;}
  if(seen.has(r.drawId)){errors.push("duplicate draw ID "+r.drawId);return;} seen.add(r.drawId);
  if(!Array.isArray(r.digits)||r.digits.length!==5||r.digits.some(x=>!isDigit(x))){errors.push("draw "+r.drawId+": must have exactly five digits 0-9");return;}
  if(r.date&&Number.isNaN(Date.parse(r.date)))warnings.push("draw "+r.drawId+": unparseable date");
  valid.push({...r,digits:r.digits.map(Number) as Digit[]});
 });
 valid.sort((a,b)=>a.drawId-b.drawId);
 for(let i=1;i<valid.length;i++)if(valid[i].drawId-valid[i-1].drawId>1)warnings.push("draw ID gap between "+valid[i-1].drawId+" and "+valid[i].drawId);
 return {valid,errors,warnings};
}

export function positionHistory(draws:Draw[],position:Pos):Digit[]{return draws.map(d=>d.digits[position]);}

/** Presence + absence descriptors, optionally on a trailing window. */
export function digitStats(history:Digit[],windowSize?:number):Stats[]{
 const h=windowSize?history.slice(-windowSize):history;
 return DIGITS.map(digit=>{
  const idx:number[]=[];h.forEach((d,i)=>{if(d===digit)idx.push(i)});
  const gaps:number[]=[];for(let i=1;i<idx.length;i++)gaps.push(idx[i]-idx[i-1]-1);
  return {digit,count:idx.length,rate:h.length?idx.length/h.length:0,currentAbsence:idx.length?h.length-1-idx[idx.length-1]:h.length,meanGap:gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:null,gaps};
 });
}

/** Select pool membership using only supplied prior history. */
export function buildPool(history:Digit[],method:PoolMethod,size:number,window=50):Digit[]{
 const k=Math.max(1,Math.min(10,Math.floor(size))),stats=digitStats(history,window),recent=history.slice(-window);
 const recentCount=new Map<Digit,number>(DIGITS.map(d=>[d,0]));recent.forEach(d=>recentCount.set(d,(recentCount.get(d)||0)+1));
 const ranked=[...DIGITS].sort((a,b)=>{
  const A=stats[a],B=stats[b];let sa=0,sb=0;
  switch(method){
   case "frequency":sa=A.count;sb=B.count;break;
   case "long-absence":sa=A.currentAbsence;sb=B.currentAbsence;break;
   case "short-absence":sa=-A.currentAbsence;sb=-B.currentAbsence;break;
   case "recent-frequency":sa=recentCount.get(a)||0;sb=recentCount.get(b)||0;break;
   case "balanced":sa=A.rate+A.currentAbsence/Math.max(1,history.length);sb=B.rate+B.currentAbsence/Math.max(1,history.length);break;
  }
  return sa===sb?a-b:sb-sa;
 });
 return ranked.slice(0,k);
}

/** Walk-forward: for each evaluated draw, pool construction sees only earlier draws. */
export function evaluatePool(draws:Draw[],position:Pos,method:PoolMethod,size:number,minTrain=30,window=50):Evaluation{
 const k=Math.max(1,Math.min(10,Math.floor(size))),dist=[0,0,0,0,0,0];let hits=0,tested=0;
 for(let i=minTrain;i<draws.length;i++){
  const prior=draws.slice(0,i).map(d=>d.digits[position]);
  const pool=buildPool(prior,method,k,window),hit=pool.includes(draws[i].digits[position])?1:0;
  tested++;hits+=hit;dist[hit]++;
 }
 const rate=tested?hits/tested:0,ref=k/10;
 return {method,position,size:k,tested,hits,hitRate:rate,uniformReference:ref,lift:ref?rate/ref:0,hitDistribution:dist,warnings:["Reference k/10 assumes uniform digit distribution.","Exploratory historical performance is not proof; selection and repeated testing can overfit.","Keep prospective/holdout evaluation separate."]};
}

export function comparePoolSizes(draws:Draw[],position:Pos,method:PoolMethod,sizes:number[]= [2,3,4,5,6,7,8,9],minTrain=30,window=50):Evaluation[]{
 return [...new Set(sizes)].filter(s=>s>=1&&s<=10).sort((a,b)=>a-b).map(s=>evaluatePool(draws,position,method,s,minTrain,window));
}
