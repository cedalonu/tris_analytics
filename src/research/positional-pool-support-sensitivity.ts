/** Phase 40: sensitivity to predeclared minimum-history and block-support thresholds. */
import type {Draw,PoolMethod} from "../research-core";
import type {ProspectiveRegimeLabel} from "./prospective-regime-persistence";
import {summarizePositionalRegimeStability} from "./positional-regime-stability";
import {analyzePositionalPoolConcordance} from "./positional-pool-concordance";
export interface PositionalPoolSupportSensitivityRow {minimumHistory:number;minimumDrawSupport:number;regimeId:string;position:number;method:PoolMethod;poolSize:number;metric:string;correlation:number|null;blocks:number;}
export interface PositionalPoolSupportSensitivityReport {method:string;minimumHistories:number[];minimumDrawSupports:number[];rows:PositionalPoolSupportSensitivityRow[];summary:Array<{minimumHistory:number;minimumDrawSupport:number;evaluated:number;calculable:number;positive:number;negative:number;nullCorrelation:number}>;limitations:string[];}
export function analyzePositionalPoolSupportSensitivity(draws:Draw[],labels:ProspectiveRegimeLabel[],options:{minimumHistories?:number[];minimumDrawSupports?:number[];blockSize?:number;methods?:PoolMethod[];poolSizes?:number[]}={}):PositionalPoolSupportSensitivityReport{
 const histories=options.minimumHistories??[20,30,50],supports=options.minimumDrawSupports??[5,10,15],blockSize=options.blockSize??25;
 if(!histories.length||histories.some(x=>!Number.isInteger(x)||x<1)||new Set(histories).size!==histories.length)throw new Error("minimumHistories must be unique positive integers");
 if(!supports.length||supports.some(x=>!Number.isInteger(x)||x<1||x>blockSize)||new Set(supports).size!==supports.length)throw new Error("minimumDrawSupports must be unique integers from 1 to blockSize");
 const rows:PositionalPoolSupportSensitivityRow[]=[];
 for(const minimumDrawSupport of supports){
  const stability=summarizePositionalRegimeStability(draws,labels,{blockSize,minimumDrawSupport});
  for(const minimumHistory of histories){
   const c=analyzePositionalPoolConcordance(draws,labels,stability,{minimumHistory,methods:options.methods,poolSizes:options.poolSizes});
   for(const g of c.groups)for(const [metric,correlation] of [["dominant-share-inclusion",g.dominantShareVsPoolInclusionCorrelation],["dominant-transition-turnover",g.dominantTransitionVsPoolTurnoverCorrelation],["inclusion-hit-rate",g.dominantInclusionVsHitRateCorrelation]] as Array<[string,number|null]>)rows.push({minimumHistory,minimumDrawSupport,regimeId:g.regimeId,position:g.position,method:g.method,poolSize:g.poolSize,metric,correlation,blocks:g.blocks});
  }
 }
 const summary=histories.flatMap(minimumHistory=>supports.map(minimumDrawSupport=>{const xs=rows.filter(x=>x.minimumHistory===minimumHistory&&x.minimumDrawSupport===minimumDrawSupport),valid=xs.filter(x=>x.correlation!==null);return{minimumHistory,minimumDrawSupport,evaluated:xs.length,calculable:valid.length,positive:valid.filter(x=>x.correlation!>0).length,negative:valid.filter(x=>x.correlation!<0).length,nullCorrelation:xs.length-valid.length};}));
 return{method:"positional-pool-minimum-support-sensitivity-v1",minimumHistories:[...histories].sort((a,b)=>a-b),minimumDrawSupports:[...supports].sort((a,b)=>a-b),rows,summary,limitations:["Los umbrales se declaran antes de inspeccionar resultados; no se escoge el que maximiza correlaciones.","Al cambiar historia mínima cambia qué concursos pueden evaluarse; no son muestras independientes.","Al cambiar soporte mínimo cambia qué bloques se consideran adecuados; no se rellenan ni interpolan bloques.","Las correlaciones siguen siendo descriptivas, retrospectivas y sujetas a multiplicidad; no se calculan p-valores.","No demuestra predictibilidad ni modifica forecasts, candidatos, pesos, portafolios o ledger."]};
}
