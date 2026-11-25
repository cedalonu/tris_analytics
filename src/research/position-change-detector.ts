import type {ResolvedCycleSignal,PreDrawContext} from "./cycle-learning";
import type {CandidateFamily} from "./intuition-candidate-generator";
export type PositionChangeState="insufficient-data"|"stable"|"improvement"|"deterioration"|"persistent-change"|"recovery";
export interface PositionChangeBlock{startDrawId:number;endDrawId:number;draws:number;trials:number;candidateRate:number;baselineRate:number;advantage:number;drawAdvantageStdDev:number;standardError:number}
export interface PositionChangeSeries{position:number;family:CandidateFamily;configuration:string;poolRegime:PreDrawContext["poolRegime"];duplicateRegime:PreDrawContext["duplicateRegime"];totalDraws:number;blocks:PositionChangeBlock[];referenceAdvantage:number|null;referenceStandardError:number|null;referenceVariability:number|null;latestAdvantage:number|null;latestStandardError:number|null;latestInterval95:[number,number]|null;change:number|null;state:PositionChangeState;consecutiveDirectionalBlocks:number;interpretation:string}
export interface PositionChangeReport{sourceOutcomes:number;excludedTransitionOutcomes:number;seriesCount:number;blockSize:number;minimumPartialBlock:number;neutralFloor:number;series:PositionChangeSeries[];warnings:string[]}
type Trial={drawId:number;candidateId:string;forecastId:string;candidateHit:boolean;baselineHit:boolean;position:number;family:CandidateFamily;configuration:string;poolRegime:PreDrawContext["poolRegime"];duplicateRegime:PreDrawContext["duplicateRegime"]};
const mean=(a:number[])=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const sampleSd=(a:number[])=>a.length<2?0:Math.sqrt(a.reduce((s,x)=>s+(x-mean(a))**2,0)/(a.length-1));
const DELTA=.02,MIN_PARTIAL=10;
function canonicalConfig(raw:string):Record<string,unknown>{
 let parsed:unknown;try{parsed=JSON.parse(raw)}catch{throw new Error("resolved outcome has invalid frozenConfig JSON")}
 if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("frozenConfig must be a JSON object");
 const entries=Object.entries(parsed as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b));
 return Object.fromEntries(entries);
}
function blockStats(drawRows:Array<[number,Trial[]]>):PositionChangeBlock{
 const perDraw=drawRows.map(([,rows])=>mean(rows.map(t=>Number(t.candidateHit)-Number(t.baselineHit))));
 const candidateRates=drawRows.map(([,rows])=>mean(rows.map(t=>Number(t.candidateHit))));
 const baselineRates=drawRows.map(([,rows])=>mean(rows.map(t=>Number(t.baselineHit))));
 const sd=sampleSd(perDraw);
 return{startDrawId:drawRows[0][0],endDrawId:drawRows.at(-1)![0],draws:drawRows.length,
  trials:drawRows.reduce((s,[,rows])=>s+rows.length,0),candidateRate:mean(candidateRates),baselineRate:mean(baselineRates),
  advantage:mean(perDraw),drawAdvantageStdDev:sd,standardError:sd/Math.sqrt(perDraw.length)};
}
function classify(blocks:PositionChangeBlock[]){
 if(blocks.length<4)return{referenceAdvantage:null,referenceStandardError:null,referenceVariability:null,latestAdvantage:blocks.at(-1)?.advantage??null,latestStandardError:blocks.at(-1)?.standardError??null,latestInterval95:null,change:null,state:"insufficient-data" as const,consecutiveDirectionalBlocks:0,interpretation:"Se requieren al menos dos bloques de referencia y dos bloques recientes."};
 const referenceBlocks=blocks.slice(0,-2),recent=blocks.slice(-2),reference=mean(referenceBlocks.map(b=>b.advantage));
 const refSE=Math.sqrt(referenceBlocks.reduce((s,b)=>s+b.standardError**2,0))/referenceBlocks.length;
 const refVariability=sampleSd(referenceBlocks.map(b=>b.advantage));
 const threshold=(b:PositionChangeBlock)=>Math.max(DELTA,1.96*Math.sqrt(refSE**2+b.standardError**2));
 const direction=(b:PositionChangeBlock)=>{const d=b.advantage-reference,t=threshold(b);return d>=t?1:d<=-t?-1:0};
 const d1=direction(recent[0]),d2=direction(recent[1]),consecutive=d1!==0&&d1===d2?2:0;
 const latest=recent[1],change=latest.advantage-reference,interval:[number,number]=[latest.advantage-1.96*latest.standardError,latest.advantage+1.96*latest.standardError];
 let state:"stable"|"improvement"|"deterioration"|"persistent-change"|"recovery"="stable",interpretation="Los bloques recientes permanecen dentro de la zona neutral ajustada por variabilidad.";
 // Recovery is a three-phase contrast: an early reference, a two-block trough, then a two-block rebound.
 // This avoids comparing the rebound only with a reference already diluted by the trough.
 let recoveryDetected=false;
 if(blocks.length>=6){
  const early=blocks.slice(0,-4),trough=blocks.slice(-4,-2),rebound=blocks.slice(-2);
  const average=(items:PositionChangeBlock[])=>mean(items.map(b=>b.advantage));
  const meanSE=(items:PositionChangeBlock[])=>Math.sqrt(sampleSd(items.map(b=>b.advantage))**2/items.length+items.reduce((s,b)=>s+b.standardError**2,0)/(items.length**2));
  const earlyMean=average(early),troughMean=average(trough),reboundMean=average(rebound);
  const declineThreshold=Math.max(DELTA,1.96*Math.sqrt(meanSE(early)**2+meanSE(trough)**2));
  const reboundThreshold=Math.max(DELTA,1.96*Math.sqrt(meanSE(trough)**2+meanSE(rebound)**2));
  recoveryDetected=trough.every(b=>b.advantage<=earlyMean-declineThreshold)&&rebound.every(b=>b.advantage>=troughMean+reboundThreshold);
 }
 if(recoveryDetected){state="recovery";interpretation="Los dos bloques del valle se deterioran frente a la referencia inicial y los dos bloques finales rebotan frente al valle. La recuperación puede ser parcial; se informa como cambio de fase, no como retorno garantizado al nivel inicial."}
 else if(consecutive===2){state="persistent-change";interpretation="Dos bloques recientes consecutivos muestran un cambio en la misma dirección frente a la referencia."}
 else if(d2>0){state="improvement";interpretation="El último bloque mejora frente a la referencia; falta persistencia."}
 else if(d2<0){state="deterioration";interpretation="El último bloque se deteriora frente a la referencia; falta persistencia."}
 return{referenceAdvantage:reference,referenceStandardError:refSE,referenceVariability:refVariability,latestAdvantage:latest.advantage,latestStandardError:latest.standardError,latestInterval95:interval,change,state,consecutiveDirectionalBlocks:consecutive,interpretation};
}
export function detectPositionBehaviorChanges(rows:ResolvedCycleSignal[],blockSize=25):PositionChangeReport{
 if(!Number.isInteger(blockSize)||blockSize<10)throw new Error("blockSize must be an integer >= 10");
 const groups=new Map<string,Trial[]>(),candidateIdentity=new Map<string,string>(),seen=new Set<string>(),seenForecasts=new Set<string>();
 let excludedTransitionOutcomes=0;
 for(const r of rows){
  if(r.family==="transition"){excludedTransitionOutcomes++;continue}
  if(!Number.isInteger(r.targetDrawId)||r.targetDrawId<=0||!r.candidateId||!r.forecastId||typeof r.candidateHit!=="boolean"||typeof r.baselineHit!=="boolean")throw new Error("invalid resolved outcome identity or hit fields");
  const config=canonicalConfig(r.frozenConfig);
  if(config.family!==r.family)throw new Error("resolved family does not match frozen configuration for "+r.candidateId);
  if(!Number.isInteger(r.position)||r.position===null||r.position<0||r.position>4||config.position!==r.position)throw new Error("resolved position does not match frozen configuration for "+r.candidateId);
  if(!r.context||!["compact","mixed","broad"].includes(r.context.poolRegime)||!["few-duplicates","many-duplicates"].includes(r.context.duplicateRegime))throw new Error("invalid frozen pre-draw context");
  const configuration=JSON.stringify(config),identity=JSON.stringify([r.family,r.position,configuration]);
  const priorIdentity=candidateIdentity.get(r.candidateId);
  if(priorIdentity&&priorIdentity!==identity)throw new Error("candidate identity/configuration changed across resolved outcomes: "+r.candidateId);
  candidateIdentity.set(r.candidateId,identity);
  const unique=r.candidateId+"|"+r.targetDrawId;
  if(seen.has(unique))throw new Error("duplicate candidate outcome for target contest: "+unique);
  if(seenForecasts.has(r.forecastId))throw new Error("duplicate forecastId in resolved outcomes: "+r.forecastId);
  seen.add(unique);seenForecasts.add(r.forecastId);
  const t:Trial={drawId:r.targetDrawId,candidateId:r.candidateId,forecastId:r.forecastId,candidateHit:r.candidateHit,baselineHit:r.baselineHit,position:r.position,family:r.family as CandidateFamily,configuration,poolRegime:r.context.poolRegime,duplicateRegime:r.context.duplicateRegime};
  const key=JSON.stringify([t.position,t.family,t.configuration,t.poolRegime,t.duplicateRegime]),a=groups.get(key)??[];a.push(t);groups.set(key,a);
 }
 const series:PositionChangeSeries[]=[];
 for(const a of groups.values()){
  const ordered=a.slice().sort((x,y)=>x.drawId-y.drawId||x.candidateId.localeCompare(y.candidateId)),byDraw=new Map<number,Trial[]>();
  for(const t of ordered){const x=byDraw.get(t.drawId)??[];x.push(t);byDraw.set(t.drawId,x)}
  const draws=[...byDraw.entries()].sort((x,y)=>x[0]-y[0]),blocks:PositionChangeBlock[]=[];
  for(let i=0;i<draws.length;i+=blockSize){const chunk=draws.slice(i,i+blockSize);if(chunk.length>=MIN_PARTIAL)blocks.push(blockStats(chunk))}
  const f=ordered[0];series.push({position:f.position,family:f.family,configuration:f.configuration,poolRegime:f.poolRegime,duplicateRegime:f.duplicateRegime,totalDraws:draws.length,blocks,...classify(blocks)});
 }
 series.sort((a,b)=>a.position-b.position||a.family.localeCompare(b.family)||a.configuration.localeCompare(b.configuration)||a.poolRegime.localeCompare(b.poolRegime)||a.duplicateRegime.localeCompare(b.duplicateRegime));
 return{sourceOutcomes:rows.length,excludedTransitionOutcomes,seriesCount:series.length,blockSize,minimumPartialBlock:MIN_PARTIAL,neutralFloor:DELTA,series,warnings:[
  "Solo se admiten outcomes prospectivos resueltos; se valida la identidad inmutable de candidato/configuración y se rechazan duplicados.",
  "Series separadas por posición, familia, configuración exacta y contexto previo congelado.",
  "Cada concurso recibe el mismo peso; los candidatos de un mismo concurso se promedian antes de formar bloques.",
  "Bloques cronológicos no solapados de concursos observados; un bloque parcial requiere al menos 10 concursos únicos.",
  "La referencia usa todos los bloques anteriores a los dos más recientes; el umbral combina un mínimo de 2 pp y 1.96 errores estándar descriptivos.",
  "El intervalo aproximado de 95% y la variabilidad no corrigen autocorrelación ni multiplicidad; no son pruebas confirmatorias.",
  "Las alertas son descriptivas. No se transfiere evidencia entre posiciones, familias, configuraciones o contextos.",
  "No modifica predicciones congeladas, pesos, selección, ciclo de vida ni registro de hipótesis; las señales transition se mantienen fuera del análisis posicional."
 ]};
}
