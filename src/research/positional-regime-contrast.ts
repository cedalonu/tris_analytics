/**
 * Cross-regime comparison of positional profiles and within-regime block stability.
 * Reports descriptive contrasts only; it does not infer a physical cause or predict outcomes.
 */
import type {PositionalRegimeReport} from "./positional-regime-profile";
import type {PositionalRegimeStabilityReport} from "./positional-regime-stability";

export type PositionalRegimeContrastClass="persistent-same-dominant"|"regime-specific-dominant"|"distribution-shift"|"not-established"|"insufficient";
export interface PositionalRegimePairContrast {
 firstRegimeId:string;secondRegimeId:string;position:number;
 firstN:number;secondN:number;firstDominantDigit:number|null;secondDominantDigit:number|null;
 firstDominantShare:number|null;secondDominantShare:number|null;
 dominantShareDifference:number|null;entropyDifferenceBits:number|null;
 jensenShannonDistance:number|null;
 firstStability: "stable-dominant"|"variable-dominance"|"insufficient";
 secondStability: "stable-dominant"|"variable-dominance"|"insufficient";
 classification:PositionalRegimeContrastClass;
}
export interface PositionalRegimeContrastReport {
 method:string;minimumRegimeSupport:number;jsDistanceThreshold:number;entropyDifferenceThresholdBits:number;
 contrasts:PositionalRegimePairContrast[];limitations:string[];
}
function jsDistance(a:number[],b:number[]):number {
 let js=0;
 for(let i=0;i<10;i++){const m=(a[i]+b[i])/2;if(a[i]>0)js+=.5*a[i]*Math.log2(a[i]/m);if(b[i]>0)js+=.5*b[i]*Math.log2(b[i]/m);}
 return Math.sqrt(Math.max(0,js));
}
export function comparePositionalRegimes(
 profiles:PositionalRegimeReport,stability:PositionalRegimeStabilityReport,
 options:{minimumRegimeSupport?:number;jensenShannonDistanceThreshold?:number;entropyDifferenceThresholdBits?:number}={}
):PositionalRegimeContrastReport {
 const minimum=options.minimumRegimeSupport??30,jsThreshold=options.jensenShannonDistanceThreshold??.10,entropyThreshold=options.entropyDifferenceThresholdBits??.25;
 if(!Number.isInteger(minimum)||minimum<1||!Number.isFinite(jsThreshold)||jsThreshold<0||jsThreshold>1||!Number.isFinite(entropyThreshold)||entropyThreshold<0)throw new Error("invalid positional regime contrast options");
 const regimes=[...profiles.regimes].sort((a,b)=>a.regimeId.localeCompare(b.regimeId));
 const stabilityByKey=new Map(stability.regimes.map(x=>[x.regimeId+"|"+x.position,x]));
 const contrasts:PositionalRegimePairContrast[]=[];
 for(let i=0;i<regimes.length;i++)for(let j=i+1;j<regimes.length;j++)for(let p=1;p<=5;p++){
  const a=regimes[i],b=regimes[j],pa=a.positions.find(x=>x.position===p)!,pb=b.positions.find(x=>x.position===p)!;
  const sa=stabilityByKey.get(a.regimeId+"|"+p),sb=stabilityByKey.get(b.regimeId+"|"+p);
  const firstStability=sa?.interpretation??"insufficient",secondStability=sb?.interpretation??"insufficient";
  const enough=a.n>=minimum&&b.n>=minimum&&pa.n>=minimum&&pb.n>=minimum;
  const distance=enough?jsDistance(pa.shares,pb.shares):null;
  const shareDiff=enough&&pa.dominantShare!==null&&pb.dominantShare!==null?Math.abs(pa.dominantShare-pb.dominantShare):null;
  const entropyDiff=enough?Math.abs(pa.entropyBits-pb.entropyBits):null;
  let classification:PositionalRegimeContrastClass="insufficient";
  if(enough){
   if(firstStability==="stable-dominant"&&secondStability==="stable-dominant"&&pa.dominantDigit===pb.dominantDigit)classification="persistent-same-dominant";
   else if(firstStability==="stable-dominant"&&secondStability==="stable-dominant"&&pa.dominantDigit!==pb.dominantDigit)classification="regime-specific-dominant";
   else if(distance!==null&&(distance>=jsThreshold||(entropyDiff??0)>=entropyThreshold))classification="distribution-shift";
   else classification="not-established";
  }
  contrasts.push({firstRegimeId:a.regimeId,secondRegimeId:b.regimeId,position:p,firstN:a.n,secondN:b.n,firstDominantDigit:pa.dominantDigit,secondDominantDigit:pb.dominantDigit,firstDominantShare:pa.dominantShare,secondDominantShare:pb.dominantShare,dominantShareDifference:shareDiff,entropyDifferenceBits:entropyDiff,jensenShannonDistance:distance,firstStability,secondStability,classification});
 }
 return{method:"cross-regime-positional-profile-contrast-v1",minimumRegimeSupport:minimum,jensenShannonDistanceThreshold:jsThreshold,entropyDifferenceThresholdBits:entropyThreshold,contrasts,limitations:[
  "La comparación solo incluye pares de regímenes con soporte mínimo en ambos perfiles; insuficiente no equivale a ausencia de cambio.",
  "persistent-same-dominant exige dominancia estable por bloques en ambos regímenes y el mismo dígito dominante; no implica que la distribución completa sea idéntica.",
  "regime-specific-dominant describe dígitos dominantes distintos con estabilidad interna en ambos regímenes; no demuestra que el régimen cause el cambio.",
  "distribution-shift usa umbrales descriptivos fijos de distancia Jensen-Shannon o diferencia de entropía; no son p-valores ni umbrales optimizados.",
  "La distancia Jensen-Shannon se calcula sobre distribuciones empíricas; el soporte pequeño puede hacerla ruidosa incluso cuando cumple el mínimo.",
  "Los regímenes y sorteos son secuenciales y pueden depender; no se asume independencia ni se calculan intervalos inferenciales.",
  "Las clasificaciones resumen datos observados y no pronostican el próximo dígito, ni demuestran sesgo físico."
 ]};
}
