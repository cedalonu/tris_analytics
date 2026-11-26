import type {PositionalPoolNullControlReport,PositionalPoolNullMetric} from "./positional-pool-null-controls";
import type {PositionalPoolCircularShiftReport} from "./positional-pool-circular-shift";

export type PositionalPoolNullComparisonStatus =
 | "outside-both-reference-envelopes"
 | "outside-permutation-only"
 | "outside-circular-shift-only"
 | "inside-both-reference-envelopes"
 | "insufficient-or-unmatched";

export interface PositionalPoolNullComparisonMetric {
 metric:PositionalPoolNullMetric;
 status:PositionalPoolNullComparisonStatus;
 supportPermutation:number|null;
 supportCircularShift:number|null;
 observedPermutation:number|null;
 observedCircularShift:number|null;
 permutationP025:number|null;
 permutationP975:number|null;
 circularShiftP025:number|null;
 circularShiftP975:number|null;
 permutationTailRate:number|null;
 circularShiftTailRate:number|null;
}
export interface PositionalPoolNullComparisonGroup {
 regimeId:string;position:number;method:string;poolSize:number;
 metrics:PositionalPoolNullComparisonMetric[];
}
export interface PositionalPoolNullComparisonReport {
 method:"dual-null-reference-envelope-comparison-v1";
 groups:PositionalPoolNullComparisonGroup[];
 matchedMetrics:number;
 unmatchedMetrics:number;
 limitations:string[];
}
const metrics:PositionalPoolNullMetric[]=["dominant-share-inclusion","dominant-transition-turnover","inclusion-hit-rate"];
const key=(g:{regimeId:string;position:number;method:string;poolSize:number})=>JSON.stringify([g.regimeId,g.position,g.method,g.poolSize]);
export function comparePositionalPoolNullControls(permutation:PositionalPoolNullControlReport,circular:PositionalPoolCircularShiftReport):PositionalPoolNullComparisonReport{
 const pGroups=new Map(permutation.groups.map(g=>[key(g),g]));
 const cGroups=new Map(circular.groups.map(g=>[key(g),g]));
 const keys=[...new Set([...pGroups.keys(),...cGroups.keys()])].sort();
 const groups:PositionalPoolNullComparisonGroup[]=[];
 let matchedMetrics=0,unmatchedMetrics=0;
 for(const k of keys){
  const p=pGroups.get(k),c=cGroups.get(k),base=p??c!;
  const pMetrics=new Map((p?.metrics??[]).map(m=>[m.metric,m]));
  const cMetrics=new Map((c?.metrics??[]).map(m=>[m.metric,m]));
  const results=metrics.map(metric=>{
   const pm=pMetrics.get(metric),cm=cMetrics.get(metric);
   const supportsMatch=!!pm&&!!cm&&pm.support===cm.support;
   const observedMatch=!!pm&&!!cm&&pm.observedCorrelation!==null&&cm.observedCorrelation!==null&&Math.abs(pm.observedCorrelation-cm.observedCorrelation)<1e-10;
   const usable=supportsMatch&&observedMatch&&pm!.nullP025!==null&&pm!.nullP975!==null&&cm!.status==="evaluated"&&cm!.nullP025!==null&&cm!.nullP975!==null;
   let status:PositionalPoolNullComparisonStatus="insufficient-or-unmatched";
   if(usable){
    const observed=pm!.observedCorrelation!;
    const outsideP=observed<pm!.nullP025!||observed>pm!.nullP975!;
    const outsideC=observed<cm!.nullP025!||observed>cm!.nullP975!;
    status=outsideP&&outsideC?"outside-both-reference-envelopes":outsideP?"outside-permutation-only":outsideC?"outside-circular-shift-only":"inside-both-reference-envelopes";
    matchedMetrics++;
   }else unmatchedMetrics++;
   return {metric,status,supportPermutation:pm?.support??null,supportCircularShift:cm?.support??null,
    observedPermutation:pm?.observedCorrelation??null,observedCircularShift:cm?.observedCorrelation??null,
    permutationP025:pm?.nullP025??null,permutationP975:pm?.nullP975??null,
    circularShiftP025:cm?.nullP025??null,circularShiftP975:cm?.nullP975??null,
    permutationTailRate:pm?.empiricalTwoSidedTailRate??null,circularShiftTailRate:cm?.empiricalTwoSidedTailRate??null};
  });
  groups.push({regimeId:base.regimeId,position:base.position,method:base.method,poolSize:base.poolSize,metrics:results});
 }
 return {method:"dual-null-reference-envelope-comparison-v1",groups,matchedMetrics,unmatchedMetrics,limitations:[
  "Compara envolventes percentiles 2.5–97.5 de dos controles distintos; quedar fuera de una envolvente es una descripción, no significancia estadística ni evidencia predictiva.",
  "El control por permutación rompe el emparejamiento y puede destruir autocorrelación; el desplazamiento circular conserva el orden cíclico pero introduce una unión artificial y requiere bloques consecutivos.",
  "Solo se comparan métricas con grupo, soporte y correlación observada coincidentes y con desplazamiento circular evaluado. Los demás casos se marcan insuficientes o no emparejados.",
  "Las tasas de cola Monte Carlo se muestran como diagnósticos separados; no se combinan ni se interpretan como p-valores confirmatorios.",
  "No aplica corrección de multiplicidad, no elige métodos ni umbrales y no modifica pronósticos, candidatos, pesos, portafolios o ledger.",
  "Análisis offline sobre reportes generados desde el CSV local; no usa APIs, polling, descargas ni datos externos."
 ]};
}
