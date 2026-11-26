/**
 * Descriptive duration, transition, and confirmation-threshold sensitivity audit.
 * No threshold is selected or optimized from observed outcomes.
 */
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";
import {stabilizePastOnlyRegimes} from "./regime-transition-stability";
export interface RegimeTransitionCell {from:string;to:string;count:number;shareOfTransitions:number}
export interface RegimeThresholdSensitivity {
 minConsecutive:number;episodes:number;persistentEpisodes:number;transientEpisodes:number;
 unconfirmedTerminalEpisodes:number;confirmedTransitions:number;watchDraws:number;
 watchShare:number;meanEpisodeLength:number|null;medianEpisodeLength:number|null;
 maxEpisodeLength:number;confirmationDelays:number[];meanConfirmationDelay:number|null;
}
export interface RegimeTransitionDynamics {
 drawCount:number;rawEpisodeCount:number;rawTransitions:number;
 meanRawEpisodeLength:number|null;medianRawEpisodeLength:number|null;maxRawEpisodeLength:number;
 transitionMatrix:RegimeTransitionCell[];thresholdSensitivity:RegimeThresholdSensitivity[];
 limitations:string[];
}
function median(xs:number[]):number|null {if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
export function analyzeRegimeTransitionDynamics(
 labels:ProspectiveRegimeLabel[],options:{thresholds?:number[]}={}
):RegimeTransitionDynamics {
 if(!labels.length)throw new Error("regime transition dynamics requires labels");
 const thresholds=options.thresholds??[2,3,4,5];
 if(!thresholds.length||thresholds.some(x=>!Number.isInteger(x)||x<2)||new Set(thresholds).size!==thresholds.length)throw new Error("thresholds must be unique integers >= 2");
 const base=stabilizePastOnlyRegimes(labels,{minConsecutive:2});
 const rawEpisodes: {regimeId:string;length:number}[]=[];
 let start=0;
 while(start<labels.length){let end=start+1;while(end<labels.length&&labels[end].regimeId===labels[start].regimeId)end++;rawEpisodes.push({regimeId:labels[start].regimeId,length:end-start});start=end;}
 const counts=new Map<string,number>();let transitions=0;
 for(let i=1;i<labels.length;i++){if(labels[i-1].regimeId!==labels[i].regimeId){const key=labels[i-1].regimeId+"\u0000"+labels[i].regimeId;counts.set(key,(counts.get(key)??0)+1);transitions++;}}
 const transitionMatrix=[...counts.entries()].map(([key,count])=>{const [from,to]=key.split("\u0000");return{from,to,count,shareOfTransitions:transitions?count/transitions:0};}).sort((a,b)=>a.from.localeCompare(b.from)||a.to.localeCompare(b.to));
 const lengths=rawEpisodes.map(x=>x.length);
 const thresholdSensitivity=thresholds.map(minConsecutive=>{
  const report=stabilizePastOnlyRegimes(labels,{minConsecutive});
  const episodeLengths=report.episodes.map(x=>x.length);
  const persistent=report.episodes.filter(x=>x.status==="persistent");
  const delays=persistent.map(()=>minConsecutive-1);
  const watchDraws=report.points.filter(x=>x.status==="watch").length;
  return{minConsecutive,episodes:report.episodes.length,persistentEpisodes:persistent.length,
   transientEpisodes:report.episodes.filter(x=>x.status==="transient").length,
   unconfirmedTerminalEpisodes:report.episodes.filter(x=>x.status==="unconfirmed-at-end").length,
   confirmedTransitions:report.confirmedTransitions,watchDraws,watchShare:watchDraws/labels.length,
   meanEpisodeLength:episodeLengths.reduce((s,x)=>s+x,0)/episodeLengths.length,
   medianEpisodeLength:median(episodeLengths),maxEpisodeLength:Math.max(...episodeLengths),
   confirmationDelays:delays,meanConfirmationDelay:delays.length?delays.reduce((s,x)=>s+x,0)/delays.length:null};
 });
 return{drawCount:labels.length,rawEpisodeCount:rawEpisodes.length,rawTransitions:Math.max(0,rawEpisodes.length-1),
  meanRawEpisodeLength:lengths.reduce((s,x)=>s+x,0)/lengths.length,medianRawEpisodeLength:median(lengths),
  maxRawEpisodeLength:Math.max(...lengths),transitionMatrix,thresholdSensitivity,
  limitations:[
   "Las duraciones y transiciones se calculan sobre etiquetas rolling; las ventanas históricas se solapan y las etiquetas consecutivas no son independientes.",
   "La matriz de transición cuenta cambios observados entre etiquetas exactas; categorías raras pueden producir celdas con soporte muy bajo.",
   "La sensibilidad compara umbrales predefinidos de 2, 3, 4 y 5 etiquetas consecutivas; no elige un ganador ni optimiza usando aciertos.",
   "El retraso de confirmación es mecánico (umbral menos uno) y representa el coste temporal de la regla, no una medida de precisión.",
   "No se calculan p-valores, no se infieren estados generadores verdaderos y no se modifican pronósticos o portafolios."
  ]};
}
