import type {Draw} from "../research-core";
import {classifyPastOnlyRegimes,type PastOnlyRegimeOptions} from "./past-only-regime-classifier";
import {analyzeRegimeTransitionDynamics} from "./regime-transition-dynamics";
import {analyzePositionalRegimeProfiles} from "./positional-regime-profile";
import {summarizePositionalRegimeStability} from "./positional-regime-stability";
import {comparePositionalRegimes} from "./positional-regime-contrast";
import {analyzePositionalTransitionPersistence} from "./positional-transition-persistence";
export interface HistoricalRegimeComparisonOptions extends PastOnlyRegimeOptions {minimumSupport?:number;blockSize?:number;minimumDrawSupport?:number;minimumRegimeSupport?:number;poolBlockThreshold?:number}
export function analyzeHistoricalRegimeComparison(draws:Draw[],firstTargetDrawId:number,lastTargetDrawId:number,options:HistoricalRegimeComparisonOptions={}){
 const minimumSupport=options.minimumSupport??30,blockSize=options.blockSize??25,minimumDrawSupport=options.minimumDrawSupport??10;
 if(!Number.isInteger(minimumSupport)||minimumSupport<1)throw Error("minimumSupport must be positive");
 const classifier=classifyPastOnlyRegimes(draws,firstTargetDrawId,lastTargetDrawId,{referenceWindow:options.referenceWindow,recentWindow:options.recentWindow,poolTvThreshold:options.poolTvThreshold,duplicateRateThreshold:options.duplicateRateThreshold,distinctMeanThreshold:options.distinctMeanThreshold,entropyThreshold:options.entropyThreshold});
 if(classifier.skippedDrawIds.length)throw Error("targets lack sufficient past history: "+classifier.skippedDrawIds.slice(0,20).join(", "));
 const dynamics=analyzeRegimeTransitionDynamics(classifier.labels);
 const profiles=analyzePositionalRegimeProfiles(draws,classifier.labels,{minimumSupport});
 const stability=summarizePositionalRegimeStability(draws,classifier.labels,{blockSize,minimumDrawSupport});
 const contrasts=comparePositionalRegimes(profiles,stability,{minimumRegimeSupport:options.minimumRegimeSupport??minimumSupport});
 const positionalTransitions=analyzePositionalTransitionPersistence(stability);
 const counts=new Map<string,number>();for(const x of classifier.labels)counts.set(x.regimeId,(counts.get(x.regimeId)??0)+1);
 const episodes:any[]=[];let start=0;
 while(start<classifier.labels.length){let end=start+1;while(end<classifier.labels.length&&classifier.labels[end].regimeId===classifier.labels[start].regimeId)end++;const first=classifier.labels[start],last=classifier.labels[end-1];episodes.push({episode:episodes.length+1,regimeId:first.regimeId,startDrawId:first.drawId,endDrawId:last.drawId,length:end-start,status:end-start>=3?"persistent":"transient",features:classifier.diagnostics[start]});start=end;}
 const regimeCounts=[...counts.entries()].map(([regimeId,n])=>({regimeId,n,share:n/classifier.labels.length})).sort((a,b)=>b.n-a.n||a.regimeId.localeCompare(b.regimeId));
 const shifts=classifier.diagnostics.map((x,i)=>({drawId:x.drawId,regimeId:x.regimeId,poolTotalVariation:x.poolTotalVariation,duplicatePairRateDifference:x.duplicatePairRateDifference,meanDistinctDigitsDifference:x.meanDistinctDigitsDifference,positionalEntropyDifference:x.positionalEntropyDifference,changed:i>0&&classifier.labels[i-1].regimeId!==x.regimeId})).filter(x=>x.changed);
 return{method:"tris-historical-regime-comparison-v1",parameters:{firstTargetDrawId,lastTargetDrawId,referenceWindow:options.referenceWindow??25,recentWindow:options.recentWindow??25,minimumSupport,blockSize,minimumDrawSupport,minimumRegimeSupport:options.minimumRegimeSupport??minimumSupport},summary:{labeledDraws:classifier.labels.length,regimes:regimeCounts.length,episodes:episodes.length,persistentEpisodes:episodes.filter(x=>x.status==="persistent").length,transitions:dynamics.rawTransitions,regimeChanges:shifts.length,limitedRegimes:profiles.regimes.filter(x=>x.support==="limited").length},regimeCounts,episodes,regimeTransitions:dynamics.transitionMatrix,transitionSensitivity:dynamics.thresholdSensitivity,changePoints:shifts,profiles,stability,contrasts,positionalTransitions,diagnostics:classifier.diagnostics,limitations:[...classifier.limitations,...dynamics.limitations,...profiles.limitations,...stability.limitations,...contrasts.limitations,...positionalTransitions.limitations,"Los episodios persistentes usan una longitud descriptiva de tres etiquetas; no son confirmación de un estado latente verdadero.","Las etiquetas rolling se basan en ventanas solapadas; los puntos de cambio pueden reflejar el desplazamiento gradual de esas ventanas.","Concentración y dispersión se describen mediante frecuencias, entropía y perfiles; no se interpretan como sesgo físico ni ventaja predictiva.","Los umbrales deben fijarse antes de examinar los resultados. Este informe no optimiza umbrales ni selecciona una estructura ganadora."]};
}
