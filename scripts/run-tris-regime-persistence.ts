#!/usr/bin/env tsx
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import type {FrozenForecast,ResolvedForecast} from "../src/research/intuition-prospective";
import type {ProspectivePortfolioManifest} from "../src/research/prospective-portfolio-monitor";
import type {ProspectiveRegimeLabel} from "../src/research/prospective-regime-persistence";
import {summarizeProspectiveRegimePersistence} from "../src/research/prospective-regime-persistence";
const dir=resolve(process.argv[2]??"data/prospective-portfolio");
async function json<T>(name:string):Promise<T>{return JSON.parse(await readFile(resolve(dir,name),"utf8")) as T;}
async function jsonl<T>(name:string):Promise<T[]>{return(await readFile(resolve(dir,name),"utf8")).split(/\r?\n/).filter(Boolean).map(x=>JSON.parse(x) as T);}
const manifest=await json<ProspectivePortfolioManifest>("portfolio-manifest.json");
const latest=await json<{summary:{lastObservedDrawId:number};manifest:{portfolioId:string}}>("latest-summary.json");
if(latest.manifest?.portfolioId!==manifest.portfolioId){console.error("latest-summary.json no corresponde al manifiesto.");process.exit(1);}
const forecasts=await jsonl<FrozenForecast>("forecasts.jsonl"),results=await jsonl<ResolvedForecast>("results.jsonl");
const labels=await jsonl<ProspectiveRegimeLabel>("regime-labels.jsonl");
if(!results.length){console.error("No hay resultados prospectivos resueltos.");process.exit(2);}
const report=summarizeProspectiveRegimePersistence(manifest,forecasts,results,labels,latest.summary.lastObservedDrawId,{minimumResolvedDraws:Number(process.env.TRIS_REGIME_PERSISTENCE_MIN_DRAWS??10)});
const out=resolve(dir,"regime-persistence");await mkdir(out,{recursive:true});
await writeFile(resolve(out,"latest.json"),JSON.stringify({generatedAt:new Date().toISOString(),report},null,2)+"\n","utf8");
const pct=(x:number|null)=>x===null?"n/d":(100*x).toFixed(1)+"%";
const md=["# TRIS — persistencia prospectiva condicionada por régimen","","- Portafolio: "+report.portfolioId,"- Concursos: "+report.firstTargetDrawId+"–"+report.lastObservedDrawId,"- Regímenes: "+report.regimes.join(", "),"","| Régimen | Candidato | Familia | Resueltos / esperados | Pendientes | Sin pronóstico | Aciertos | Baseline | Diferencia | Cobertura | Estado |","|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|",...report.summaries.map(s=>"| "+s.regimeId+" | "+s.candidateId+" | "+s.family+" | "+s.resolvedDraws+" / "+s.expectedDraws+" | "+s.pendingDraws+" | "+s.unforecastedDraws+" | "+s.hits+" | "+s.baselineHits+" | "+pct(s.difference)+" | "+pct(s.coverage)+" | "+s.status+" |"),"","## Limitaciones",...report.limitations.map(x=>"- "+x)].join("\n")+"\n";
await writeFile(resolve(out,"latest.md"),md,"utf8");console.log(md);
