/** Phase 45: prespecified sensitivity of prospective performance stability to temporal settings. */
import type {FrozenForecast,ResolvedForecast} from "./intuition-prospective";
import {auditProspectivePerformanceStability,type StabilityStatus} from "./prospective-performance-stability";

export type SensitivityConclusion="robust-positive"|"robust-negative"|"robust-no-edge"|"parameter-sensitive"|"insufficient-evidence";
export interface SensitivitySetting {windowDraws:number;minimumResolvedPerWindow:number;originOffsetDraws:number;}
export interface SensitivityCell {setting:SensitivitySetting;status:StabilityStatus;evaluatedWindows:number;positiveWindows:number;negativeWindows:number;neutralWindows:number;overallPairedDifference:number|null;}
export interface ProspectiveSensitivityGroup {key:string;family:string;config:string;cells:SensitivityCell[];evaluatedConfigurations:number;positiveConfigurations:number;negativeConfigurations:number;noEdgeConfigurations:number;insufficientConfigurations:number;conclusion:SensitivityConclusion;}
export interface ProspectiveSensitivityReport {method:"prospective-performance-sensitivity-v1";settings:{windowSizes:number[];minimumResolvedValues:number[];offsetFractions:number[];minimumWindows:number;configurations:number};summary:{forecastRecords:number;resolvedRecords:number;groups:number;robustPositive:number;robustNegative:number;robustNoEdge:number;parameterSensitive:number;insufficient:number};groups:ProspectiveSensitivityGroup[];limitations:string[];}

export function auditProspectivePerformanceSensitivity(forecasts:FrozenForecast[],resolutions:ResolvedForecast[],options:{windowSizes?:number[];minimumResolvedValues?:number[];offsetFractions?:number[];minimumWindows?:number}={}):ProspectiveSensitivityReport{
 const windowSizes=options.windowSizes??[10,20,30,40],minimumResolvedValues=options.minimumResolvedValues??[3,5,10],offsetFractions=options.offsetFractions??[0,0.25,0.5],minimumWindows=options.minimumWindows??3;
 const validIntegers=(xs:number[],min:number)=>xs.length>0&&xs.every(x=>Number.isInteger(x)&&x>=min);
 const validFractions=offsetFractions.length>0&&offsetFractions.every(x=>Number.isFinite(x)&&x>=0&&x<1);
 if(!validIntegers(windowSizes,2)||!validIntegers(minimumResolvedValues,1)||!validFractions||!Number.isInteger(minimumWindows)||minimumWindows<2)throw new Error("invalid prospective sensitivity settings");
 const settings:SensitivitySetting[]=[];
 for(const windowDraws of [...new Set(windowSizes)].sort((a,b)=>a-b))for(const minimumResolvedPerWindow of [...new Set(minimumResolvedValues)].sort((a,b)=>a-b))for(const fraction of [...new Set(offsetFractions)].sort((a,b)=>a-b)){
  const originOffsetDraws=Math.floor(windowDraws*fraction);
  if(originOffsetDraws>=windowDraws)throw new Error("origin offset must be smaller than its window");
  settings.push({windowDraws,minimumResolvedPerWindow,originOffsetDraws});
 }
 const byGroup=new Map<string,{family:string;config:string;cells:SensitivityCell[]}>();
 for(const setting of settings){
  const report=auditProspectivePerformanceStability(forecasts,resolutions,{...setting,minimumWindows});
  for(const group of report.groups){
   const entry=byGroup.get(group.key)??{family:group.family,config:group.config,cells:[]};
   entry.cells.push({setting,status:group.status,evaluatedWindows:group.evaluatedWindows,positiveWindows:group.positiveWindows,negativeWindows:group.negativeWindows,neutralWindows:group.neutralWindows,overallPairedDifference:group.overallPairedDifference});
   byGroup.set(group.key,entry);
  }
 }
 const groups:ProspectiveSensitivityGroup[]=[...byGroup.entries()].map(([key,g])=>{
  const evaluated=g.cells.filter(c=>c.status!=="insufficient-evidence"),positive=evaluated.filter(c=>c.status==="consistently-positive").length,negative=evaluated.filter(c=>c.status==="consistently-negative").length,noEdge=evaluated.filter(c=>c.status==="no-directional-edge").length;
  let conclusion:SensitivityConclusion="insufficient-evidence";
  if(evaluated.length===g.cells.length&&positive===g.cells.length)conclusion="robust-positive";
  else if(evaluated.length===g.cells.length&&negative===g.cells.length)conclusion="robust-negative";
  else if(evaluated.length===g.cells.length&&noEdge===g.cells.length)conclusion="robust-no-edge";
  else if(evaluated.length>0)conclusion="parameter-sensitive";
  return {key,family:g.family,config:g.config,cells:g.cells,evaluatedConfigurations:evaluated.length,positiveConfigurations:positive,negativeConfigurations:negative,noEdgeConfigurations:noEdge,insufficientConfigurations:g.cells.length-evaluated.length,conclusion};
 }).sort((a,b)=>a.family.localeCompare(b.family)||a.key.localeCompare(b.key));
 const count=(c:SensitivityConclusion)=>groups.filter(g=>g.conclusion===c).length;
 const uniqueForecasts=new Set(forecasts.map(f=>f.forecastId));
 const validResolutionIds=new Set(resolutions.filter(r=>uniqueForecasts.has(r.forecastId)&&forecasts.some(f=>f.forecastId===r.forecastId&&f.targetDrawId===r.targetDrawId)).map(r=>r.forecastId));
 return {method:"prospective-performance-sensitivity-v1",settings:{windowSizes:[...new Set(windowSizes)].sort((a,b)=>a-b),minimumResolvedValues:[...new Set(minimumResolvedValues)].sort((a,b)=>a-b),offsetFractions:[...new Set(offsetFractions)].sort((a,b)=>a-b),minimumWindows,configurations:settings.length},summary:{forecastRecords:uniqueForecasts.size,resolvedRecords:validResolutionIds.size,groups:groups.length,robustPositive:count("robust-positive"),robustNegative:count("robust-negative"),robustNoEdge:count("robust-no-edge"),parameterSensitive:count("parameter-sensitive"),insufficient:count("insufficient-evidence")},groups,limitations:["La cuadrícula de ventanas, soportes y desplazamientos queda predefinida; no se elige la combinación que maximice aciertos.","Los desplazamientos resegmentan los mismos concursos y las configuraciones se solapan; no son muestras independientes.","Cada celda reutiliza pronósticos congelados y resoluciones válidas; no crea pronósticos, no completa huecos ni altera el ledger.","Una conclusión robusta exige que todas las configuraciones evaluables tengan soporte suficiente y coincidan; cualquier mezcla se marca sensible.","El análisis es descriptivo y no prueba predictibilidad, no corrige multiplicidad ni dependencia temporal.","Solo lee el ledger local; no usa APIs, polling, descargas ni fuentes externas."]};
}
