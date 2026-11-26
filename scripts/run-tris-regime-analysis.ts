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
const report=summarizeProspectiveRegimePersistence(manifest,forecasts,results,stability.auditLabels,last,{minimumResolvedDraws:Number(process.env.TRIS_REGIME_PERSISTENCE_MIN_DRAWS??10)});
const sourceSha256=createHash("sha256").update(csv,"utf8").digest("hex");
const out=resolve(dir,"regime-analysis");await mkdir(out,{recursive:true});
const generatedAt=new Date().toISOString();
await writeFile(resolve(dir,"regime-labels.jsonl"),classifier.labels.map(x=>JSON.stringify(x)).join("\n")+"\n","utf8");
await writeFile(resolve(dir,"regime-labels-diagnostics.json"),JSON.stringify({source:basename(resolve(input)),sourceSha256,method:classifier.method,warmupDraws:classifier.warmupDraws,labels:classifier.labels.length,regimeCounts:classifier.labels.reduce((a,x)=>({...a,[x.regimeId]:(a[x.regimeId]??0)+1}),{} as Record<string,number>),diagnostics:classifier.diagnostics,stability,dynamics,limitations:classifier.limitations},null,2)+"\n","utf8");
const full={generatedAt,source:basename(resolve(input)),sourceSha256,classifierMethod:classifier.method,stability,dynamics,report};
await writeFile(resolve(out,"latest.json"),JSON.stringify(full,null,2)+"\n","utf8");
const pct=(x:number|null)=>x===null?"n/d":(100*x).toFixed(1)+"%";
const md=["# TRIS — análisis integral de persistencia por régimen","","- Fuente CSV: "+basename(resolve(input)),"- SHA-256 CSV: "+sourceSha256,"- Método de clasificación: "+classifier.method,"- Portafolio: "+report.portfolioId,"- Concursos observados: "+report.firstTargetDrawId+"–"+report.lastObservedDrawId,"- Etiquetas generadas: "+classifier.labels.length,"- Confirmación mínima de régimen: "+stability.minConsecutive+" etiquetas consecutivas","- Transiciones observadas: "+stability.transitions,"- Transiciones confirmadas: "+stability.confirmedTransitions,"- Episodios transitorios: "+stability.transientEpisodes,"","## Episodios de régimen", "| Episodio | Régimen | Inicio | Fin | Concursos | Clasificación | Confirmación |","|---:|---|---:|---:|---:|---|---:|",...stability.episodes.map(e=>"| "+e.episodeIndex+" | "+e.regimeId+" | "+e.startDrawId+" | "+e.endDrawId+" | "+e.length+" | "+e.status+" | "+(e.confirmedAtDrawId??"n/d")+" |"),"","## Sensibilidad a la regla de confirmación","| Racha mínima | Episodios | Persistentes | Transitorios | Transiciones confirmadas | Concursos en observación | % observación | Retraso medio |","|---:|---:|---:|---:|---:|---:|---:|---:|",...dynamics.thresholdSensitivity.map(x=>"| "+x.minConsecutive+" | "+x.episodes+" | "+x.persistentEpisodes+" | "+x.transientEpisodes+" | "+x.confirmedTransitions+" | "+x.watchDraws+" | "+(100*x.watchShare).toFixed(1)+"% | "+(x.meanConfirmationDelay??"n/d")+" |"),"","## Reglas de transición",...stability.limitations.map(x=>"- "+x),"","| Régimen | Candidato | Familia | Resueltos / esperados | Pendientes | Sin pronóstico | Aciertos | Baseline | Diferencia | Cobertura | Estado |","|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|",...report.summaries.map(s=>"| "+s.regimeId+" | "+s.candidateId+" | "+s.family+" | "+s.resolvedDraws+" / "+s.expectedDraws+" | "+s.pendingDraws+" | "+s.unforecastedDraws+" | "+s.hits+" | "+s.baselineHits+" | "+pct(s.difference)+" | "+pct(s.coverage)+" | "+s.status+" |"),"","## Limitaciones",...report.limitations.map(x=>"- "+x),"","Las etiquetas se recalculan solo con historia anterior a cada objetivo. No se modifican forecasts congelados ni el portafolio. Sin APIs, polling ni descargas."].join("\n")+"\n";
await writeFile(resolve(out,"latest.md"),md,"utf8");
console.log(md);
