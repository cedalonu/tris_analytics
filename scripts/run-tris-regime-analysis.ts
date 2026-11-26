#!/usr/bin/env tsx
/**
 * End-to-end offline regime analysis: manually supplied CSV -> past-only labels -> frozen prospective audit.
 * No APIs, polling, downloads, or backfilled forecasts.
 */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,basename} from "node:path";
import {createHash} from "node:crypto";
import {importTrisCsv} from "../src/research/data-adapter";
import type {FrozenForecast,ResolvedForecast} from "../src/research/intuition-prospective";
import type {ProspectivePortfolioManifest} from "../src/research/prospective-portfolio-monitor";
import {classifyPastOnlyRegimes} from "../src/research/past-only-regime-classifier";
import {stabilizePastOnlyRegimes} from "../src/research/regime-transition-stability";
import {analyzeRegimeTransitionDynamics} from "../src/research/regime-transition-dynamics";
import {analyzePositionalRegimeProfiles} from "../src/research/positional-regime-profile";
import {summarizePositionalRegimeStability} from "../src/research/positional-regime-stability";
import {comparePositionalRegimes} from "../src/research/positional-regime-contrast";
import {analyzePositionalTransitionPersistence} from "../src/research/positional-transition-persistence";
import {summarizeProspectiveRegimePersistence} from "../src/research/prospective-regime-persistence";

const input=process.argv[2],dir=resolve(process.argv[3]??"data/prospective-portfolio");
if(!input){console.error("Usage: npm run research:regime-analysis -- <local-Tris.csv> [ledger-directory]");process.exit(2);}
async function json<T>(path:string):Promise<T>{return JSON.parse(await readFile(resolve(dir,path),"utf8")) as T;}
async function jsonl<T>(path:string):Promise<T[]>{return(await readFile(resolve(dir,path),"utf8")).split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line) as T);}
const csv=await readFile(resolve(input),"utf8");
const imported=importTrisCsv(csv);
if(imported.validation.errors.length){console.error(imported.validation.errors.slice(0,30).join("\n"));process.exit(1);}
if(imported.validation.warnings.some(x=>x.startsWith("draw gap "))){console.error("CSV contains contest gaps; analysis blocked.");process.exit(1);}
const manifest=await json<ProspectivePortfolioManifest>("portfolio-manifest.json");
const latest=await json<{manifest:{portfolioId:string};summary:{lastObservedDrawId:number}}>("latest-summary.json");
if(latest.manifest?.portfolioId!==manifest.portfolioId){console.error("Latest summary does not match portfolio manifest.");process.exit(1);}
const last=latest.summary.lastObservedDrawId;
if(!Number.isInteger(last)||last<manifest.firstTargetDrawId){console.error("Invalid prospective observation boundary.");process.exit(1);}
const classifier=classifyPastOnlyRegimes(imported.validation.valid,manifest.firstTargetDrawId,last);
if(classifier.skippedDrawIds.length){console.error("Insufficient history for targets: "+classifier.skippedDrawIds.join(", "));process.exit(1);}
const forecasts=await jsonl<FrozenForecast>("forecasts.jsonl");
const results=await jsonl<ResolvedForecast>("results.jsonl");
if(!results.length){console.error("No resolved prospective results; refusing to produce a performance audit.");process.exit(2);}
const stability=stabilizePastOnlyRegimes(classifier.labels,{minConsecutive:Number(process.env.TRIS_REGIME_MIN_CONSECUTIVE??3)});
const dynamics=analyzeRegimeTransitionDynamics(classifier.labels);
const positionalProfiles=analyzePositionalRegimeProfiles(imported.validation.valid,stability.auditLabels,{minimumSupport:Number(process.env.TRIS_REGIME_POSITION_MIN_SUPPORT??30)});
const positionalStability=summarizePositionalRegimeStability(imported.validation.valid,stability.auditLabels,{blockSize:Number(process.env.TRIS_REGIME_POSITION_BLOCK_SIZE??25),minimumDrawSupport:Number(process.env.TRIS_REGIME_POSITION_BLOCK_MIN_SUPPORT??10)});
const positionalContrasts=comparePositionalRegimes(positionalProfiles,positionalStability,{minimumRegimeSupport:Number(process.env.TRIS_REGIME_CONTRAST_MIN_SUPPORT??30),jensenShannonDistanceThreshold:Number(process.env.TRIS_REGIME_CONTRAST_JS_THRESHOLD??0.10),entropyDifferenceThresholdBits:Number(process.env.TRIS_REGIME_CONTRAST_ENTROPY_BITS??0.25)});
const positionalTransitions=analyzePositionalTransitionPersistence(positionalStability,{minimumConsecutiveBlocksForSustained:Number(process.env.TRIS_POSITIONAL_TRANSITION_MIN_BLOCKS??2)});
const report=summarizeProspectiveRegimePersistence(manifest,forecasts,results,stability.auditLabels,last,{minimumResolvedDraws:Number(process.env.TRIS_REGIME_PERSISTENCE_MIN_DRAWS??10)});
const sourceSha256=createHash("sha256").update(csv,"utf8").digest("hex");
const out=resolve(dir,"regime-analysis");await mkdir(out,{recursive:true});
const generatedAt=new Date().toISOString();
await writeFile(resolve(dir,"regime-labels.jsonl"),classifier.labels.map(x=>JSON.stringify(x)).join("\n")+"\n","utf8");
await writeFile(resolve(dir,"regime-labels-diagnostics.json"),JSON.stringify({source:basename(resolve(input)),sourceSha256,method:classifier.method,warmupDraws:classifier.warmupDraws,labels:classifier.labels.length,regimeCounts:classifier.labels.reduce((a,x)=>({...a,[x.regimeId]:(a[x.regimeId]??0)+1}),{} as Record<string,number>),diagnostics:classifier.diagnostics,stability,dynamics,positionalProfiles,positionalStability,positionalContrasts,positionalTransitions,limitations:classifier.limitations},null,2)+"\n","utf8");
const full={generatedAt,source:basename(resolve(input)),sourceSha256,classifierMethod:classifier.method,stability,dynamics,positionalProfiles,positionalStability,positionalContrasts,positionalTransitions,report};
await writeFile(resolve(out,"latest.json"),JSON.stringify(full,null,2)+"\n","utf8");
const pct=(x:number|null)=>x===null?"n/d":(100*x).toFixed(1)+"%";
const md=["# TRIS — análisis integral de persistencia por régimen","","- Fuente CSV: "+basename(resolve(input)),"- SHA-256 CSV: "+sourceSha256,"- Método de clasificación: "+classifier.method,"- Portafolio: "+report.portfolioId,"- Concursos observados: "+report.firstTargetDrawId+"–"+report.lastObservedDrawId,"- Etiquetas generadas: "+classifier.labels.length,"- Confirmación mínima de régimen: "+stability.minConsecutive+" etiquetas consecutivas","- Transiciones observadas: "+stability.transitions,"- Transiciones confirmadas: "+stability.confirmedTransitions,"- Episodios transitorios: "+stability.transientEpisodes,"","## Episodios de régimen", "| Episodio | Régimen | Inicio | Fin | Concursos | Clasificación | Confirmación |","|---:|---|---:|---:|---:|---|---:|",...stability.episodes.map(e=>"| "+e.episodeIndex+" | "+e.regimeId+" | "+e.startDrawId+" | "+e.endDrawId+" | "+e.length+" | "+e.status+" | "+(e.confirmedAtDrawId??"n/d")+" |"),"","## Sensibilidad a la regla de confirmación","| Racha mínima | Episodios | Persistentes | Transitorios | Transiciones confirmadas | Concursos en observación | % observación | Retraso medio |","|---:|---:|---:|---:|---:|---:|---:|---:|",...dynamics.thresholdSensitivity.map(x=>"| "+x.minConsecutive+" | "+x.episodes+" | "+x.persistentEpisodes+" | "+x.transientEpisodes+" | "+x.confirmedTransitions+" | "+x.watchDraws+" | "+(100*x.watchShare).toFixed(1)+"% | "+(x.meanConfirmationDelay??"n/d")+" |"),"","## Reglas de transición",...stability.limitations.map(x=>"- "+x),"","| Régimen | Candidato | Familia | Resueltos / esperados | Pendientes | Sin pronóstico | Aciertos | Baseline | Diferencia | Cobertura | Estado |","|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|",...report.summaries.map(s=>"| "+s.regimeId+" | "+s.candidateId+" | "+s.family+" | "+s.resolvedDraws+" / "+s.expectedDraws+" | "+s.pendingDraws+" | "+s.unforecastedDraws+" | "+s.hits+" | "+s.baselineHits+" | "+pct(s.difference)+" | "+pct(s.coverage)+" | "+s.status+" |"),"","## Perfil posicional por régimen",
"- Concursos etiquetados: "+positionalProfiles.labeledDrawCount,
"- Umbral de soporte adecuado: "+(process.env.TRIS_REGIME_POSITION_MIN_SUPPORT??30)+" sorteos por régimen",
"",
"| Régimen | n | Soporte | Dígitos distintos promedio |",
"|---|---:|---|---:|",
...positionalProfiles.regimes.map(x=>"| "+x.regimeId+" | "+x.n+" | "+x.support+" | "+(x.meanDistinctDigits?.toFixed(2)??"n/d")+" |"),
"",
"| Régimen | Posición | Dígito dominante | Frecuencia | Entropía (bits) | Dígitos efectivos |",
"|---|---:|---:|---:|---:|---:|",
...positionalProfiles.regimes.flatMap(x=>x.positions.map(p=>"| "+x.regimeId+" | R"+p.position+" | "+(p.dominantDigit??"n/d")+" | "+(p.dominantShare===null?"n/d":(100*p.dominantShare).toFixed(1)+"%")+" | "+p.entropyBits.toFixed(3)+" | "+p.effectiveDigits.toFixed(2)+" |")),
"",
"| Régimen | Par de posiciones | Coincidencia observada | Referente marginal | Exceso descriptivo |",
"|---|---|---:|---:|---:|",
...positionalProfiles.regimes.flatMap(x=>x.positionPairs.map(p=>"| "+x.regimeId+" | R"+p.firstPosition+"–R"+p.secondPosition+" | "+(p.sameDigitRate===null?"n/d":(100*p.sameDigitRate).toFixed(1)+"%")+" | "+(p.independentExpectedRate===null?"n/d":(100*p.independentExpectedRate).toFixed(1)+"%")+" | "+(p.excessSameDigitRate===null?"n/d":(100*p.excessSameDigitRate).toFixed(1)+" pp")+" |")),
"",
"| Régimen | Par de posiciones | Cambios iguales observados | Referente marginal | Exceso descriptivo |",
"|---|---|---:|---:|---:|",
...positionalProfiles.regimes.flatMap(x=>x.changeSynchronyPairs.map(p=>"| "+x.regimeId+" | R"+p.firstPosition+"–R"+p.secondPosition+" | "+(p.sameDeltaRate===null?"n/d":(100*p.sameDeltaRate).toFixed(1)+"%")+" | "+(p.independentExpectedRate===null?"n/d":(100*p.independentExpectedRate).toFixed(1)+"%")+" | "+(p.excessSameDeltaRate===null?"n/d":(100*p.excessSameDeltaRate).toFixed(1)+" pp")+" |")),
"",
"## Estabilidad posicional por bloques no solapados",
"- Tamaño de bloque: "+positionalStability.blockSize+" concursos",
"- Soporte mínimo por bloque y régimen: "+positionalStability.minimumDrawSupport,
"",
"| Régimen | Posición | Bloques válidos | Consistencia dominante | Rango frecuencia dominante | Rango entropía | Interpretación |",
"|---|---:|---:|---:|---:|---:|---|",
...positionalStability.regimes.map(x=>"| "+x.regimeId+" | R"+x.position+" | "+x.supportedBlocks+" | "+(x.dominantConsistency===null?"n/d":(100*x.dominantConsistency).toFixed(1)+"%")+" | "+(x.dominantShareRange===null?"n/d":(100*x.dominantShareRange).toFixed(1)+" pp")+" | "+(x.entropyRange===null?"n/d":x.entropyRange.toFixed(3))+" | "+x.interpretation+" |"),
"",
"## Persistencia de transiciones posicionales",
"- Umbral de episodio sostenido: "+positionalTransitions.minimumConsecutiveBlocksForSustained+" bloques consecutivos",
"",
"| Régimen | Posición | Bloques elegibles | Episodios | Transiciones | Transitorias | Sostenidas | Retornos a dominante anterior | Tasa de retorno | Duración media (bloques) |",
"|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
...positionalTransitions.series.map(x=>"| "+x.regimeId+" | R"+x.position+" | "+x.eligibleBlocks+" | "+x.episodes.length+" | "+x.transitionCount+" | "+x.transientTransitions+" | "+x.sustainedTransitions+" | "+x.returnsToEarlierDigit+" | "+pct(x.returnRate)+" | "+(x.meanEpisodeBlocks===null?"n/d":x.meanEpisodeBlocks.toFixed(2))+" |"),
"",
"| Posición | Regímenes | Transiciones | Transitorias | Sostenidas | Retornos | Tasa de retorno |",
"|---:|---:|---:|---:|---:|---:|---:|",
...positionalTransitions.summaryByPosition.map(x=>"| R"+x.position+" | "+x.regimeCount+" | "+x.transitions+" | "+x.transient+" | "+x.sustained+" | "+x.returns+" | "+pct(x.returnRate)+" |"),
"",
...positionalTransitions.limitations.map(x=>"- "+x),
"",
"## Contraste de perfiles posicionales entre regímenes",
"- Soporte mínimo por régimen: "+positionalContrasts.minimumRegimeSupport,
"- Umbral de distancia Jensen–Shannon: "+positionalContrasts.jensenShannonDistanceThreshold,
"- Umbral de diferencia de entropía: "+positionalContrasts.entropyDifferenceThresholdBits+" bits",
"",
"| Régimen A | Régimen B | Posición | Dominante A | Dominante B | Diferencia frecuencia dominante | Diferencia entropía | Distancia JS | Estabilidad A/B | Clasificación |",
"|---|---|---:|---:|---:|---:|---:|---:|---|---|",
...positionalContrasts.contrasts.map(x=>"| "+x.firstRegimeId+" | "+x.secondRegimeId+" | R"+x.position+" | "+(x.firstDominantDigit??"n/d")+" | "+(x.secondDominantDigit??"n/d")+" | "+(x.dominantShareDifference===null?"n/d":(100*x.dominantShareDifference).toFixed(1)+" pp")+" | "+(x.entropyDifferenceBits===null?"n/d":x.entropyDifferenceBits.toFixed(3))+" | "+(x.jensenShannonDistance===null?"n/d":x.jensenShannonDistance.toFixed(3))+" | "+x.firstStability+" / "+x.secondStability+" | "+x.classification+" |"),
"",
...positionalContrasts.limitations.map(x=>"- "+x),
"",
...positionalStability.limitations.map(x=>"- "+x),
"",
...positionalProfiles.limitations.map(x=>"- "+x),
"","## Limitaciones",...report.limitations.map(x=>"- "+x),"","Las etiquetas se recalculan solo con historia anterior a cada objetivo. No se modifican forecasts congelados ni el portafolio. Sin APIs, polling ni descargas."].join("\n")+"\n";
await writeFile(resolve(out,"latest.md"),md,"utf8");
console.log(md);
