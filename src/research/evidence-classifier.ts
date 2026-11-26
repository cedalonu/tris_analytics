/** Phase 46: conservative descriptive evidence classification for exact prospective configurations. */
export type EvidenceClass="insufficient"|"neutral"|"favorable-observed"|"unfavorable-observed"|"contradictory";
export interface EvidenceInput {key:string;resolved:number;pairedDifference:number|null;stabilityStatus:string|null;sensitivityConclusion:string|null;integrity:string|null;coverageRate:number|null;}
export interface EvidenceDecision {key:string;classification:EvidenceClass;resolved:number;reasons:string[];limitations:string[];}
export const EVIDENCE_MIN_RESOLVED=30;
export function classifyEvidence(x:EvidenceInput):EvidenceDecision{
 const reasons:string[]=[];
 const limitations=["Clasificación descriptiva de resultados observados; no implica predictibilidad ni ventaja futura.","El mínimo de 30 resueltos es un umbral operativo predefinido, no garantía de potencia estadística.","No corrige multiplicidad ni dependencia temporal entre concursos."];
 if(x.integrity!=="clean"){reasons.push("Auditoría de ledger ausente o no limpia; no se permite una conclusión direccional.");return{key:x.key,classification:"insufficient",resolved:x.resolved,reasons,limitations};}
 if(x.resolved<EVIDENCE_MIN_RESOLVED||x.coverageRate===null||x.coverageRate<0.8||x.stabilityStatus===null||x.sensitivityConclusion===null||x.pairedDifference===null){
  reasons.push("Muestra, cobertura o reportes requeridos insuficientes (mínimo 30 resueltos y cobertura observada ≥80%).");return{key:x.key,classification:"insufficient",resolved:x.resolved,reasons,limitations};
 }
 if(x.stabilityStatus==="mixed-direction"||x.sensitivityConclusion==="parameter-sensitive"){
  reasons.push("Dirección variable entre ventanas o sensibilidad a parámetros.");return{key:x.key,classification:"contradictory",resolved:x.resolved,reasons,limitations};
 }
 if(x.stabilityStatus==="consistently-positive"&&x.sensitivityConclusion==="robust-positive"&&x.pairedDifference>0){
  reasons.push("Diferencia pareada positiva, estabilidad positiva y sensibilidad robusta concordantes.");return{key:x.key,classification:"favorable-observed",resolved:x.resolved,reasons,limitations};
 }
 if(x.stabilityStatus==="consistently-negative"&&x.sensitivityConclusion==="robust-negative"&&x.pairedDifference<0){
  reasons.push("Diferencia pareada negativa, estabilidad negativa y sensibilidad robusta concordantes.");return{key:x.key,classification:"unfavorable-observed",resolved:x.resolved,reasons,limitations};
 }
 if((x.stabilityStatus==="no-directional-edge"&&x.sensitivityConclusion==="robust-no-edge")||x.pairedDifference===0){
  reasons.push("No se detecta dirección comparativa consistente en los reportes disponibles.");return{key:x.key,classification:"neutral",resolved:x.resolved,reasons,limitations};
 }
 reasons.push("Los criterios direccionales no coinciden o no alcanzan la concordancia requerida.");return{key:x.key,classification:"contradictory",resolved:x.resolved,reasons,limitations};
}
