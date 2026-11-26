/** Phase 39: predeclared temporal-window sensitivity for rolling concordance. */
import type {PositionalPoolConcordanceReport} from "./positional-pool-concordance";
import {analyzePositionalPoolTemporalStability} from "./positional-pool-temporal-stability";
export interface PositionalPoolWindowSensitivityReport {method:string;configurations:Array<{windowBlocks:number;stepBlocks:number;minimumPairs:number;groups:number;positive:number;negative:number;unstable:number;insufficient:number}>;limitations:string[];}
export function analyzePositionalPoolWindowSensitivity(report:PositionalPoolConcordanceReport,options:{windows?:number[];minimumPairs?:number;consistencyThreshold?:number;nearZeroThreshold?:number}={}):PositionalPoolWindowSensitivityReport{
 const windows=options.windows??[5,8,10],minimumPairs=options.minimumPairs??3;
 if(!windows.length||windows.some(x=>!Number.isInteger(x)||x<3)||new Set(windows).size!==windows.length)throw new Error("windows must be unique integers >= 3");
 const configurations=windows.map(windowBlocks=>{
  const stepBlocks=Math.max(1,Math.floor(windowBlocks/2));
  const r=analyzePositionalPoolTemporalStability(report,{windowBlocks,stepBlocks,minimumPairs,consistencyThreshold:options.consistencyThreshold,nearZeroThreshold:options.nearZeroThreshold});
  return{windowBlocks,stepBlocks,minimumPairs,groups:r.groups.length,positive:r.groups.filter(x=>x.classification==="temporally-consistent-positive").length,negative:r.groups.filter(x=>x.classification==="temporally-consistent-negative").length,unstable:r.groups.filter(x=>x.classification==="unstable").length,insufficient:r.groups.filter(x=>x.classification==="insufficient").length};
 });
 return{method:"positional-pool-temporal-window-sensitivity-v1",configurations,limitations:["Las ventanas se predeclaran y se comparan sin elegir la configuración que produzca más asociaciones.","Ventanas móviles se solapan y reutilizan los mismos bloques; no son observaciones independientes.","Los conteos de clasificación no son tasas inferenciales ni estiman falsas alertas en TRIS.","El análisis hereda el carácter retrospectivo del dominante de bloque y no valida pronósticos.","No modifica candidatos, pronósticos, pesos, portafolios ni ledger."]};
}
