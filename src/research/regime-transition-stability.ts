/**
 * Past-only stabilization of rolling regime labels.
 * Online assignments never backfill: a new regime is accepted only after
 * minConsecutive consecutive labels, and only from the confirmation draw onward.
 * A separate episode summary is retrospective descriptive segmentation.
 */
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";

export type RegimeOnlineStatus="watch"|"confirmed"|"stable"|"return-to-confirmed";
export type RegimeEpisodeStatus="persistent"|"transient"|"unconfirmed-at-end";
export interface RegimeStabilityPoint {
 drawId:number; rawRegimeId:string; effectiveRegimeId:string;
 status:RegimeOnlineStatus; consecutiveCount:number;
 confirmedRegimeId:string|null; confirmedAtDrawId:number|null;
}
export interface RegimeEpisode {
 episodeIndex:number; regimeId:string; startDrawId:number; endDrawId:number;
 length:number; status:RegimeEpisodeStatus; confirmedAtDrawId:number|null;
}
export interface RegimeStabilityReport {
 minConsecutive:number; points:RegimeStabilityPoint[]; episodes:RegimeEpisode[];
 auditLabels:ProspectiveRegimeLabel[];
 transitions:number; confirmedTransitions:number; transientEpisodes:number;
 limitations:string[];
}
export function stabilizePastOnlyRegimes(
 labels:ProspectiveRegimeLabel[], options:{minConsecutive?:number}={}
):RegimeStabilityReport {
 const minConsecutive=options.minConsecutive??3;
 if(!Number.isInteger(minConsecutive)||minConsecutive<2)throw new Error("minConsecutive must be an integer >= 2");
 if(!labels.length)throw new Error("regime stability requires labels");
 for(let i=0;i<labels.length;i++){
  const x=labels[i];
  if(!Number.isInteger(x.drawId)||!x.regimeId.trim()||!x.method.trim()||
   !Number.isInteger(x.sourceStartDrawId)||!Number.isInteger(x.sourceEndDrawId)||
   x.sourceStartDrawId<1||x.sourceEndDrawId<x.sourceStartDrawId||x.sourceEndDrawId>=x.drawId)
   throw new Error("invalid or non-past-only regime label at index "+i);
  if(i&&x.drawId!==labels[i-1].drawId+1)throw new Error("regime labels must be contiguous");
 }
 const points:RegimeStabilityPoint[]=[];
 let previousRaw:string|null=null,run=0,confirmedRegimeId:string|null=null,confirmedAtDrawId:number|null=null;
 for(const label of labels){
  run=label.regimeId===previousRaw?run+1:1;
  previousRaw=label.regimeId;
  let status:RegimeOnlineStatus,effectiveRegimeId:string;
  if(label.regimeId===confirmedRegimeId){
   status=run>=minConsecutive?"stable":"return-to-confirmed";
   effectiveRegimeId=confirmedRegimeId;
  }else if(run>=minConsecutive){
   status="confirmed";confirmedRegimeId=label.regimeId;confirmedAtDrawId=label.drawId;
   effectiveRegimeId=confirmedRegimeId;
  }else{
   status="watch";effectiveRegimeId="transition-watch";
  }
  points.push({drawId:label.drawId,rawRegimeId:label.regimeId,effectiveRegimeId,status,consecutiveCount:run,confirmedRegimeId,confirmedAtDrawId});
 }
 const episodes:RegimeEpisode[]=[];
 let start=0;
 while(start<labels.length){
  let end=start+1;while(end<labels.length&&labels[end].regimeId===labels[start].regimeId)end++;
  const length=end-start,ended=end<labels.length;
  const status:RegimeEpisodeStatus=length>=minConsecutive?"persistent":ended?"transient":"unconfirmed-at-end";
  const confirmedAtDrawId=length>=minConsecutive?labels[start+minConsecutive-1].drawId:null;
  episodes.push({episodeIndex:episodes.length+1,regimeId:labels[start].regimeId,startDrawId:labels[start].drawId,endDrawId:labels[end-1].drawId,length,status,confirmedAtDrawId});
  start=end;
 }
 const auditLabels=labels.map((label,i)=>({...label,regimeId:points[i].effectiveRegimeId,method:label.method+"|past-only-stability-min="+minConsecutive}));
 const confirmedTransitions=episodes.filter((e,i)=>i>0&&e.status==="persistent").length;
 return{
  minConsecutive,points,episodes,auditLabels,
  transitions:Math.max(0,episodes.length-1),confirmedTransitions,
  transientEpisodes:episodes.filter(e=>e.status==="transient").length,
  limitations:[
   "La aceptación online exige minConsecutive etiquetas consecutivas iguales; el régimen nuevo solo se aplica desde el concurso de confirmación.",
   "Los primeros concursos de una posible transición se asignan a transition-watch; nunca se reclasifican retroactivamente.",
   "return-to-confirmed indica que una etiqueta volvió al último régimen confirmado antes de completar una nueva racha.",
   "La clasificación de episodios persistent/transient usa la secuencia completa y es retrospectiva descriptiva; no debe usarse para tomar decisiones históricas como si se conociera entonces.",
   "La estabilidad temporal no prueba que exista un estado generador real, ni aporta por sí misma ventaja predictiva.",
   "Las etiquetas base siguen siendo past-only y cada sourceEndDrawId debe ser anterior al concurso objetivo."
  ]
 };
}
