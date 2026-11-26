/** Phase 38: joint descriptive robustness across block-size and block-origin grids. */
import type {PositionalPoolScaleSensitivityReport} from "./positional-pool-scale-sensitivity";
import type {PositionalPoolOriginSensitivityReport} from "./positional-pool-origin-sensitivity";
type DirectionStatus="same-positive-direction-all-scales"|"same-negative-direction-all-scales"|"direction-mixed-across-scales"|"some-scales-only"|"insufficient";
type OriginStatus="same-positive-direction-all-offsets"|"same-negative-direction-all-offsets"|"direction-mixed-across-offsets"|"some-offsets-only"|"insufficient";
export interface PositionalPoolJointRobustnessRow {regimeId:string;position:number;method:string;poolSize:number;metric:string;scaleStatus:DirectionStatus;originStatus:OriginStatus;scaleValid:number;originValid:number;scalePositive:number;originPositive:number;scaleNegative:number;originNegative:number;classification:"same-positive-across-scale-and-origin"|"same-negative-across-scale-and-origin"|"direction-conflict-between-dimensions"|"sensitive-to-scale-or-origin"|"insufficient";}
export interface PositionalPoolJointRobustnessReport {method:string;scaleCount:number;originCount:number;rows:PositionalPoolJointRobustnessRow[];summary:{total:number;positiveRobust:number;negativeRobust:number;conflict:number;sensitive:number;insufficient:number};limitations:string[];}
export function analyzePositionalPoolJointRobustness(scale:PositionalPoolScaleSensitivityReport,origin:PositionalPoolOriginSensitivityReport):PositionalPoolJointRobustnessReport{
 const key=(x:{regimeId:string;position:number;method:string;poolSize:number;metric:string})=>JSON.stringify([x.regimeId,x.position,x.method,x.poolSize,x.metric]);
 const origins=new Map(origin.groups.map(x=>[key(x),x]));
 const rows:PositionalPoolJointRobustnessRow[]=scale.groups.map(s=>{
  const o=origins.get(key(s));
  if(!o)return{regimeId:s.regimeId,position:s.position,method:s.method,poolSize:s.poolSize,metric:s.metric,scaleStatus:s.status,originStatus:"insufficient",scaleValid:s.validScales,originValid:0,scalePositive:s.positiveScales,originPositive:0,scaleNegative:s.negativeScales,originNegative:0,classification:"insufficient"};
  const bothPositive=s.status==="same-positive-direction-all-scales"&&o.status==="same-positive-direction-all-offsets";
  const bothNegative=s.status==="same-negative-direction-all-scales"&&o.status==="same-negative-direction-all-offsets";
  const scaleDirectional=s.status==="same-positive-direction-all-scales"||s.status==="same-negative-direction-all-scales";
  const originDirectional=o.status==="same-positive-direction-all-offsets"||o.status==="same-negative-direction-all-offsets";
  const conflict=scaleDirectional&&originDirectional&&((s.status==="same-positive-direction-all-scales")!==(o.status==="same-positive-direction-all-offsets"));
  const classification=bothPositive?"same-positive-across-scale-and-origin":bothNegative?"same-negative-across-scale-and-origin":conflict?"direction-conflict-between-dimensions":s.status==="insufficient"||o.status==="insufficient"?"insufficient":"sensitive-to-scale-or-origin";
  return{regimeId:s.regimeId,position:s.position,method:s.method,poolSize:s.poolSize,metric:s.metric,scaleStatus:s.status,originStatus:o.status,scaleValid:s.validScales,originValid:o.validOffsets,scalePositive:s.positiveScales,originPositive:o.positiveOffsets,scaleNegative:s.negativeScales,originNegative:o.negativeOffsets,classification};
 });
 const count=(classification:PositionalPoolJointRobustnessRow["classification"])=>rows.filter(x=>x.classification===classification).length;
 return{method:"joint-positional-pool-scale-origin-robustness-v1",scaleCount:scale.blockSizes.length,originCount:origin.blockOffsets.length,rows,summary:{total:rows.length,positiveRobust:count("same-positive-across-scale-and-origin"),negativeRobust:count("same-negative-across-scale-and-origin"),conflict:count("direction-conflict-between-dimensions"),sensitive:count("sensitive-to-scale-or-origin"),insufficient:count("insufficient")},limitations:["La comparación exige las mismas claves descriptivas; grupos ausentes no se imputan.","Las escalas y offsets reutilizan sorteos y bloques solapados; no son réplicas independientes.","La clasificación conjunta resume consistencia de signo, no magnitud útil, significancia, causalidad ni predictibilidad.","No se combinan tasas de cola ni se calcula un p-valor; no hay corrección de multiplicidad.","No modifica pronósticos, candidatos, pesos, portafolios ni ledger."]};
}
