/**
 * Descriptive persistence and recurrence audit for changes in block-level dominant digits.
 * Uses the fixed non-overlapping blocks from positional-regime-stability.
 * A low-support block breaks continuity; no gap is silently bridged.
 */
import type {PositionalRegimeStabilityReport,PositionalRegimeBlockSummary,PositionalStabilityBlock} from "./positional-regime-stability";
export interface PositionalDominanceEpisode {
 regimeId:string;position:number;digit:number;startBlockIndex:number;endBlockIndex:number;
 startDrawId:number;endDrawId:number;blocks:number;supportedDraws:number;status:"transient"|"sustained";
}
export interface PositionalDominanceTransition {
 regimeId:string;position:number;fromDigit:number;toDigit:number;atBlockIndex:number;
 atDrawId:number;destinationBlocks:number;destinationSupportedDraws:number;
 status:"transient"|"sustained";returnsToEarlierDigit:boolean;
}
export interface PositionalTransitionSeries {
 regimeId:string;position:number;eligibleBlocks:number;underpoweredBlocks:number;
 episodes:PositionalDominanceEpisode[];transitions:PositionalDominanceTransition[];
 transitionCount:number;transientTransitions:number;sustainedTransitions:number;
 returnsToEarlierDigit:number;returnRate:number|null;
 meanEpisodeBlocks:number|null;medianEpisodeBlocks:number|null;maxEpisodeBlocks:number;
 meanEpisodeDraws:number|null;meanSustainedEpisodeBlocks:number|null;
}
export interface PositionalTransitionThresholdSummary {minimumConsecutiveBlocks:number;episodes:number;transientEpisodes:number;sustainedEpisodes:number;transitions:number;transientTransitions:number;sustainedTransitions:number;returns:number;returnRate:number|null}
export interface PositionalTransitionPersistenceReport {
 method:string;minimumConsecutiveBlocksForSustained:number;
 sensitivityThresholds:number[];sensitivityByThreshold:PositionalTransitionThresholdSummary[];series:PositionalTransitionSeries[];
 summaryByPosition:{position:number;regimeCount:number;transitions:number;transient:number;sustained:number;returns:number;returnRate:number|null}[];
 limitations:string[];
}
function median(xs:number[]):number|null{if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function auditSeries(s:PositionalRegimeBlockSummary,minConsecutive:number):PositionalTransitionSeries{
 const episodes:PositionalDominanceEpisode[]=[];
 const supported=s.blocks.filter(b=>b.status==="supported"&&b.dominantDigit!==null);
 const runs:Array<{digit:number;blocks:PositionalStabilityBlock[]}>=[];
 let current:{digit:number;blocks:PositionalStabilityBlock[]}|null=null,lastIndex:number|null=null;
 for(const b of s.blocks){
  if(b.status!=="supported"||b.dominantDigit===null){if(current)runs.push(current);current=null;lastIndex=null;continue;}
  if(current&&lastIndex!==null&&b.blockIndex===lastIndex+1&&current.digit===b.dominantDigit)current.blocks.push(b);
  else{if(current)runs.push(current);current={digit:b.dominantDigit,blocks:[b]};}
  lastIndex=b.blockIndex;
 }
 if(current)runs.push(current);
 for(const run of runs){const first=run.blocks[0],last=run.blocks[run.blocks.length-1];episodes.push({regimeId:s.regimeId,position:s.position,digit:run.digit,startBlockIndex:first.blockIndex,endBlockIndex:last.blockIndex,startDrawId:first.startDrawId,endDrawId:last.endDrawId,blocks:run.blocks.length,supportedDraws:run.blocks.reduce((n,b)=>n+b.n,0),status:run.blocks.length>=minConsecutive?"sustained":"transient"});}
 const seenDigits=new Set<number>(),transitions:PositionalDominanceTransition[]=[];
 if(episodes.length)seenDigits.add(episodes[0].digit);
 for(let i=1;i<episodes.length;i++){const prior=episodes[i-1],next=episodes[i];if(next.startBlockIndex!==prior.endBlockIndex+1){seenDigits.clear();seenDigits.add(next.digit);continue;}
  const earlier=seenDigits.has(next.digit);
  transitions.push({regimeId:s.regimeId,position:s.position,fromDigit:prior.digit,toDigit:next.digit,atBlockIndex:next.startBlockIndex,atDrawId:next.startDrawId,destinationBlocks:next.blocks,destinationSupportedDraws:next.supportedDraws,status:next.blocks>=minConsecutive?"sustained":"transient",returnsToEarlierDigit:earlier});
  seenDigits.add(next.digit);
 }
 const lengths=episodes.map(e=>e.blocks),drawLengths=episodes.map(e=>e.supportedDraws),sustained=episodes.filter(e=>e.status==="sustained").map(e=>e.blocks);
 const returns=transitions.filter(t=>t.returnsToEarlierDigit).length;
 return{regimeId:s.regimeId,position:s.position,eligibleBlocks:supported.length,underpoweredBlocks:s.blocks.length-supported.length,episodes,transitions,transitionCount:transitions.length,transientTransitions:transitions.filter(t=>t.status==="transient").length,sustainedTransitions:transitions.filter(t=>t.status==="sustained").length,returnsToEarlierDigit:returns,returnRate:transitions.length?returns/transitions.length:null,meanEpisodeBlocks:lengths.length?lengths.reduce((a,b)=>a+b,0)/lengths.length:null,medianEpisodeBlocks:median(lengths),maxEpisodeBlocks:lengths.length?Math.max(...lengths):0,meanEpisodeDraws:drawLengths.length?drawLengths.reduce((a,b)=>a+b,0)/drawLengths.length:null,meanSustainedEpisodeBlocks:sustained.length?sustained.reduce((a,b)=>a+b,0)/sustained.length:null};
}
export function analyzePositionalTransitionPersistence(report:PositionalRegimeStabilityReport,options:{minimumConsecutiveBlocksForSustained?:number;sensitivityThresholds?:number[]}={}):PositionalTransitionPersistenceReport{
 const minimum=options.minimumConsecutiveBlocksForSustained??2,thresholds=options.sensitivityThresholds??[1,2,3];
 if(!Number.isInteger(minimum)||minimum<1)throw new Error("minimumConsecutiveBlocksForSustained must be a positive integer");
 if(!thresholds.length||thresholds.some(x=>!Number.isInteger(x)||x<1)||new Set(thresholds).size!==thresholds.length)throw new Error("sensitivityThresholds must be unique positive integers");
 const series=report.regimes.map(s=>auditSeries(s,minimum));
 const sensitivityByThreshold=thresholds.map(minConsecutiveBlocks=>{const rows=report.regimes.map(s=>auditSeries(s,minConsecutiveBlocks));const episodes=rows.flatMap(x=>x.episodes),transitions=rows.flatMap(x=>x.transitions),returns=transitions.filter(x=>x.returnsToEarlierDigit).length;return{minimumConsecutiveBlocks,episodes:episodes.length,transientEpisodes:episodes.filter(x=>x.status==="transient").length,sustainedEpisodes:episodes.filter(x=>x.status==="sustained").length,transitions:transitions.length,transientTransitions:transitions.filter(x=>x.status==="transient").length,sustainedTransitions:transitions.filter(x=>x.status==="sustained").length,returns,returnRate:transitions.length?returns/transitions.length:null};});
 const summaryByPosition=Array.from({length:5},(_,i)=>{const xs=series.filter(x=>x.position===i+1),transitions=xs.reduce((n,x)=>n+x.transitionCount,0),returns=xs.reduce((n,x)=>n+x.returnsToEarlierDigit,0);return{position:i+1,regimeCount:xs.length,transitions,transient:xs.reduce((n,x)=>n+x.transientTransitions,0),sustained:xs.reduce((n,x)=>n+x.sustainedTransitions,0),returns,returnRate:transitions?returns/transitions:null};});
 return{method:"block-dominance-transition-persistence-v1",minimumConsecutiveBlocksForSustained:minimum,sensitivityThresholds:thresholds,sensitivityByThreshold,series,summaryByPosition,limitations:[
  "La unidad de observación es el bloque no solapado de la fase 24, no cada sorteo; un cambio dentro de un bloque puede quedar oculto.",
  "Un bloque insuficiente rompe la secuencia; no se conectan episodios a través de huecos de soporte.",
  "transient y sustained dependen del umbral explícito de bloques consecutivos; la tabla de sensibilidad no selecciona un umbral óptimo.",
  "El retorno significa que el dígito dominante reaparece después de otro episodio dentro de la misma serie régimen/posición; no implica periodicidad.",
  "Las duraciones cuentan bloques y concursos con soporte, no tiempo de reloj; los sorteos y posiciones pueden depender.",
  "Los episodios y transiciones son descriptivos, no p-valores, causalidad, sesgo físico ni pronósticos."
 ]};
}
