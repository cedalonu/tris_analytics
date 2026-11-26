/**
 * Descriptive positional outcome profiles conditioned on strictly past-only regime labels.
 * Regime assignment is supplied separately; target digits are measured only after assignment.
 * No significance, causality, or predictive advantage is inferred.
 */
import type {Draw} from "../research-core";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";

export interface PositionalDigitProfile {
  position:number; n:number; counts:number[]; shares:number[];
  entropyBits:number; normalizedEntropy:number; effectiveDigits:number;
  dominantDigit:number|null; dominantShare:number|null;
}
export interface PositionalPairProfile {
  firstPosition:number; secondPosition:number; n:number;
  sameDigitCount:number; sameDigitRate:number|null;
  independentExpectedRate:number|null; excessSameDigitRate:number|null;
}
export interface PositionChangeSynchronyPair {firstPosition:number;secondPosition:number;n:number;sameDeltaCount:number;sameDeltaRate:number|null;independentExpectedRate:number|null;excessSameDeltaRate:number|null}
export interface PositionChangeProfile {
  position:number; n:number; sameDigitRate:number|null;
  plusOneModuloRate:number|null; minusOneModuloRate:number|null;
  meanCircularDistance:number|null; deltaCounts:number[];
}
export interface RegimePositionProfile {
  regimeId:string; n:number; support:"adequate"|"limited";
  positions:PositionalDigitProfile[];
  positionPairs:PositionalPairProfile[];
  changesFromPreviousDraw:PositionChangeProfile[];
  meanDistinctDigits:number|null;
  limitations:string[];
}
export interface PositionalRegimeReport {
  method:string; drawCount:number; labeledDrawCount:number;
  global:RegimePositionProfile; regimes:RegimePositionProfile[];
  limitations:string[];
}
function profile(regimeId:string, rows:Draw[], previousById:Map<number,Draw>, minSupport:number):RegimePositionProfile {
  const positions:PositionalDigitProfile[]=[];
  for(let p=0;p<5;p++){
    const counts=Array(10).fill(0) as number[];
    for(const row of rows)counts[row.digits[p]]++;
    const shares=counts.map(x=>rows.length?x/rows.length:0);
    const entropyBits=shares.reduce((h,x)=>x? h-x*Math.log2(x):h,0);
    const dominant=Math.max(...counts);
    positions.push({position:p+1,n:rows.length,counts,shares,entropyBits,
      normalizedEntropy:entropyBits/Math.log2(10),effectiveDigits:2**entropyBits,
      dominantDigit:rows.length?counts.indexOf(dominant):null,
      dominantShare:rows.length?dominant/rows.length:null});
  }
  const positionPairs:PositionalPairProfile[]=[];
  for(let p=0;p<5;p++)for(let q=p+1;q<5;q++){
    let same=0;for(const row of rows)if(row.digits[p]===row.digits[q])same++;
    const expected=positions[p].shares.reduce((s,x,d)=>s+x*positions[q].shares[d],0);
    const rate=rows.length?same/rows.length:null;
    positionPairs.push({firstPosition:p+1,secondPosition:q+1,n:rows.length,
      sameDigitCount:same,sameDigitRate:rate,independentExpectedRate:rows.length?expected:null,
      excessSameDigitRate:rate===null?null:rate-expected});
  }
  const changesFromPreviousDraw:PositionChangeProfile[]=[];
  for(let p=0;p<5;p++){
    let n=0,same=0,plus=0,minus=0,sumDistance=0;const deltaCounts=Array(10).fill(0) as number[];
    for(const row of rows){
      const previous=previousById.get(row.drawId);if(!previous)continue;
      const delta=(row.digits[p]-previous.digits[p]+10)%10;
      n++;deltaCounts[delta]++;if(delta===0)same++;if(delta===1)plus++;if(delta===9)minus++;
      sumDistance+=Math.min(delta,10-delta);
    }
    changesFromPreviousDraw.push({position:p+1,n,sameDigitRate:n?same/n:null,
      plusOneModuloRate:n?plus/n:null,minusOneModuloRate:n?minus/n:null,
      meanCircularDistance:n?sumDistance/n:null,deltaCounts});
  }
  const deltaRows=rows.map(row=>{const previous=previousById.get(row.drawId);return previous?row.digits.map((digit,p)=>(digit-previous.digits[p]+10)%10):null;}).filter((x):x is number[]=>x!==null);
  const changeSynchronyPairs:PositionChangeSynchronyPair[]=[];
  for(let p=0;p<5;p++)for(let q=p+1;q<5;q++){
    const a=Array(10).fill(0) as number[],b=Array(10).fill(0) as number[];let same=0;
    for(const delta of deltaRows){a[delta[p]]++;b[delta[q]]++;if(delta[p]===delta[q])same++;}
    const expected=deltaRows.length?a.reduce((s,x,d)=>s+(x/deltaRows.length)*(b[d]/deltaRows.length),0):null;
    const rate=deltaRows.length?same/deltaRows.length:null;
    changeSynchronyPairs.push({firstPosition:p+1,secondPosition:q+1,n:deltaRows.length,
      sameDeltaCount:same,sameDeltaRate:rate,independentExpectedRate:expected,
      excessSameDeltaRate:rate===null||expected===null?null:rate-expected});
  }
  const meanDistinctDigits=rows.length?rows.reduce((s,row)=>s+new Set(row.digits).size,0)/rows.length:null;
  return {regimeId,n:rows.length,support:rows.length>=minSupport?"adequate":"limited",
    positions,positionPairs,changesFromPreviousDraw,changeSynchronyPairs,meanDistinctDigits,
    limitations:[
      "Las frecuencias describen los dígitos observados dentro del régimen; no son probabilidades futuras.",
      "La tasa esperada de coincidencia entre posiciones es un referente marginal de independencia, no una prueba estadística.",
      "Los cambios comparan cada objetivo con el sorteo inmediatamente anterior, que puede pertenecer a otro régimen.",
      "La sincronía de cambios compara deltas módulo 10 entre posiciones; el referente es marginal y descriptivo, no una prueba de independencia.",
      "El soporte se marca como limitado cuando hay menos de "+minSupport+" sorteos."
    ]};
}
export function analyzePositionalRegimeProfiles(
 draws:Draw[], labels:ProspectiveRegimeLabel[],
 options:{minimumSupport?:number}={}
):PositionalRegimeReport {
  const minimumSupport=options.minimumSupport??30;
  if(!Number.isInteger(minimumSupport)||minimumSupport<1)throw new Error("minimumSupport must be a positive integer");
  if(!draws.length||!labels.length)throw new Error("draws and regime labels are required");
  const byId=new Map<number,Draw>();
  for(let i=0;i<draws.length;i++){
    const d=draws[i];
    if(!Number.isInteger(d.drawId)||d.drawId<1||!Array.isArray(d.digits)||d.digits.length!==5||d.digits.some(x=>!Number.isInteger(x)||x<0||x>9))throw new Error("invalid draw at index "+i);
    if(i&&d.drawId!==draws[i-1].drawId+1)throw new Error("draws must be sorted and contiguous");
    byId.set(d.drawId,d);
  }
  const seen=new Set<number>();
  for(const label of labels){
    if(seen.has(label.drawId))throw new Error("duplicate regime label for draw "+label.drawId);
    seen.add(label.drawId);
    if(!label.regimeId.trim()||!label.method.trim())throw new Error("regime label requires regimeId and method");
    if(!Number.isInteger(label.sourceStartDrawId)||!Number.isInteger(label.sourceEndDrawId)||
      label.sourceStartDrawId<1||label.sourceEndDrawId<label.sourceStartDrawId||
      label.sourceEndDrawId>=label.drawId)throw new Error("regime label must use strictly pre-target history");
    if(!byId.has(label.drawId))throw new Error("labeled target draw is missing: "+label.drawId);
  }
  const grouped=new Map<string,Draw[]>();
  for(const label of labels){const rows=grouped.get(label.regimeId)??[];rows.push(byId.get(label.drawId)!);grouped.set(label.regimeId,rows);}
  const previousById=new Map<number,Draw>();
  for(let i=1;i<draws.length;i++)previousById.set(draws[i].drawId,draws[i-1]);
  const targets=labels.map(x=>byId.get(x.drawId)!);
  const global=profile("ALL_LABELED_TARGETS",targets,previousById,minimumSupport);
  const regimes=[...grouped.entries()].sort(([a],[b])=>a.localeCompare(b))
    .map(([id,rows])=>profile(id,rows,previousById,minimumSupport));
  return {method:"past-only-regime-outcome-profile-v1",drawCount:draws.length,
    labeledDrawCount:labels.length,global,regimes,limitations:[
      "Las etiquetas se reciben de un clasificador past-only y deben corresponder al sorteo objetivo; este módulo valida que sourceEndDrawId sea menor que drawId.",
      "Los dígitos del objetivo se usan únicamente como resultados observados para describir cada grupo, nunca para asignar su régimen.",
      "Los grupos pueden tener tamaños muy diferentes; los perfiles con soporte limitado no deben compararse como evidencia firme.",
      "Las observaciones son secuenciales y pueden depender unas de otras; no se calculan p-valores ni intervalos que presupongan independencia.",
      "Las diferencias entre regímenes son descriptivas, no causales ni garantía de que el comportamiento continúe."
    ]};
}
