/** Phase 98: conservative cross-phase retrospective evidence summary. */
type Phase95Metric={family:string;position:number;holdout:{deltaVsRandom:number|null};positiveBlocks:number;blocksEvaluated:number;interpretation:string};
type Phase96Metric={family:string;position:number;bootstrap:{q025:number;q975:number};interpretation:string};
type Phase97Group={family:string;position:number;conclusion:string;evaluatedBlockSizes:number;requestedBlockSizes:number[]};
type Report<T>=T[]|{report?:{metrics?:T[];groups?:T[]};metrics?:T[];groups?:T[]};
const rows=<T,>(x:Report<T>|null|undefined):T[]=>{if(!x)return[];const y:any=x;const r=y.report??y;return Array.isArray(r.metrics)?r.metrics:Array.isArray(r.groups)?r.groups:[];};
const key=(x:{family:string;position:number})=>x.family+"|"+x.position;
export function evaluateStructuralMotifJointStability(phase95:any,phase96:any,phase97:any){
 const a=rows<Phase95Metric>(phase95),b=rows<Phase96Metric>(phase96),c=rows<Phase97Group>(phase97);
 const ma=new Map(a.map(x=>[key(x),x])),mb=new Map(b.map(x=>[key(x),x])),mc=new Map(c.map(x=>[key(x),x]));
 const keys=[...new Set([...ma.keys(),...mb.keys(),...mc.keys()])].sort();
 const groups=keys.map(k=>{const x=ma.get(k),y=mb.get(k),z=mc.get(k),[family,p]=k.split("|");
  const complete=!!x&&!!y&&!!z&&typeof x.holdout?.deltaVsRandom==="number"&&Number.isFinite(x.holdout.deltaVsRandom)&&typeof y.bootstrap?.q025==="number"&&typeof y.bootstrap?.q975==="number"&&Number.isFinite(y.bootstrap.q025)&&Number.isFinite(y.bootstrap.q975)&&typeof z.conclusion==="string";
  const temporalPositive=!!x&&x.holdout.deltaVsRandom!==null&&x.holdout.deltaVsRandom>0&&x.interpretation==="holdout-positive-and-most-training-blocks-positive";
  const bootstrapPositive=!!y&&y.bootstrap.q025>0&&y.bootstrap.q975>0&&y.interpretation==="interval-above-zero";
  const sensitivityPositive=!!z&&z.conclusion==="robust-positive-across-block-sizes"&&z.evaluatedBlockSizes===z.requestedBlockSizes.length;
  const classification=!complete?"insufficient-evidence":temporalPositive&&bootstrapPositive&&sensitivityPositive?"consistent-retrospective-support":"mixed-evidence";
  return{family,position:Number(p),classification,phases:{temporalHoldout:x?{deltaVsRandom:x.holdout?.deltaVsRandom??null,positiveBlocks:x.positiveBlocks,blocksEvaluated:x.blocksEvaluated,interpretation:x.interpretation}:null,blockBootstrap:y?{q025:y.bootstrap?.q025??null,q975:y.bootstrap?.q975??null,interpretation:y.interpretation}:null,blockSensitivity:z?{conclusion:z.conclusion,evaluatedBlockSizes:z.evaluatedBlockSizes,requestedBlockSizes:z.requestedBlockSizes}:null},criteria:{temporalPositive,bootstrapPositive,sensitivityPositive},missingPhases:[...(!x?["95"]:[]),...(!y?["96"]:[]),...(!z?["97"]:[])]};
 });
 return{method:"structural-motif-joint-stability-v1",settings:{joinKey:"family|position",rule:"all three phase criteria must be favorable for consistent-retrospective-support",inputs:["phase95-temporal-holdout","phase96-block-bootstrap","phase97-block-size-sensitivity"]},summary:{groups:groups.length,consistentRetrospectiveSupport:groups.filter(g=>g.classification==="consistent-retrospective-support").length,mixedEvidence:groups.filter(g=>g.classification==="mixed-evidence").length,insufficientEvidence:groups.filter(g=>g.classification==="insufficient-evidence").length,missingPhase95:a.length===0,missingPhase96:b.length===0,missingPhase97:c.length===0},groups,limitations:["Los tres informes reutilizan las mismas filas históricas y el control aleatorio de Fase 94; no constituyen evidencia independiente.","La etiqueta consistente resume únicamente coincidencia retrospectiva entre criterios predefinidos; no es validación prospectiva ni prueba predictiva.","La selección posterior de familias, posiciones o parámetros puede introducir sesgo de selección y multiplicidad.","Los intervalos bootstrap son aproximaciones descriptivas y no p-valores; la dependencia temporal puede persistir más allá de los bloques.","Los grupos ausentes o con métricas incompletas se conservan como evidencia insuficiente; no se imputan ni se interpretan como negativos.","Este informe no calcula probabilidades futuras ni justifica apuestas."]};
}
